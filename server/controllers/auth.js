import crypto from "crypto";
import { getRoom } from "../socket/webSocket.js";
import { logger } from "../logger.js";
import bcrypt from "bcrypt"
import {sequelize,db_master} from "../models/index.js"
import config from "../config/config.js";
import jwt from "jsonwebtoken";
import { redisClient } from "../helpers/redis.js";

const algorithm = "aes-256-cbc";
const student_key = crypto.scryptSync(config.CRYPTO_KEY_STUDENT, "salt", 32);
const assistant_key = crypto.scryptSync(
  config.CRYPTO_KEY_ASSISTANT,
  "salt",
  32
);

const decrypt = (encryptedData, iv, key) => {
  let ivhex = Buffer.from(iv, "hex");
  let encryptedText = Buffer.from(encryptedData, "hex");
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), ivhex);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const student = async (req, res, next) => {
  const body = req.body;
  
  let cekRoom = true;
  try {
    let login = true
    const userData = await redisClient.SMEMBERS(`${body.tenant_id}:USERDATA:${body.room_id}`);
    if(userData){
      for(let item of userData){
        const participant = JSON.parse(item)
        if(participant.username === body.username || body.id === participant.user_id){
          login = false
          break;
        }
      }
    }

    if(body?.room_id) {
      cekRoom = await req.db_tenant.rooms.findOne({
        where:{ 
          id : body.room_id
        }
      })
    }

    if (!cekRoom) {
      const redisRoom = await redisClient.get(`${body.tenant_id}:ROOM:${body?.room_id}`);
      if(!redisRoom){
          res.status(400).json({
            message: "alert.text.room_not_exists",
            error_code : "alert.text.room_not_exists"
          });
        return next()
      } else {
        body.temporary_room = true
      }
    }


    if(login){
      res.status(200).json({
        data : body
      });
    } else {
      res.status(400).json({
        message: "username already use",
        error_code : req?.tenant?.linkage_type != 'oidc' ? "alert.text.username_already_use" : "alert.text.email_already_use"
      });
    }
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
  return next()
    
};

export const assistant = async (req, res, next) => {
  const body = req.body;
  let encryptedData = body.encrypted;
  let iv = body.iv;

  try {
    let roomId = decrypt(encryptedData, iv, assistant_key);
    const payload = {
      status: "success",
      roomId: roomId,
      data: await getRoom(config.env.TENANT_ID, roomId),
    };
    res.status(200).json(payload);
  } catch (error) {
    res.status(400).json({ message: error });
  }
  return next()
    
};

export const admin = async (req, res, next) => {
  try {
    const body = req.body
    const data = await db_master.users.findOne({
        where:{ 
        [sequelize.Op.or] : [
          {
            username : body.username 
          },
          {
            email : body.username 
          }
        ]
      }
    })

    if(!data) {
      res.status(403).json({status : false, message: 'UNAUTHORIZED', error_code:'alert.text.unauthorized'});
      return next()
    } else {
      const passwordIsValid = bcrypt.compareSync(
        body.password,
        data.password
      );

      if (!passwordIsValid) {
        res.status(403).json({status : false, message: 'UNAUTHORIZED', error_code:'alert.text.unauthorized'});
        return next()
      }
    }

    /* expiry 1 hour */
    const expiryToken = Math.floor(Date.now() / 1000) + 60 * (config.env.JWT_EXPIRY_TOKEN * 60);

    delete data.dataValues.password
    const token = jwt.sign(
      {
        data: data,
      },
      config.env.JWT_SECRET_KEY,
      { expiresIn: expiryToken }
    );

    await redisClient.RPUSH('auth:token', token);

    res.status(200).json({status : true, data, access_token: {
      token,
      expiry: expiryToken,
    }});
  } catch (err) {
    res.status(500).json({status : false, message: err.message});
  }
  return next() 
};

export const teacher = async (req, res, next) => {
  try {
    const body = req.body
    let data
    let cekRoom = true;
    if(body?.open_id) {
     data = await req.db_tenant.teachers.findOne({
        where:{ 
          email : body.email
        }
      })
    } else {
      data = await req.db_tenant.teachers.findOne({
          where:{ 
          [sequelize.Op.or] : [
            {
              username : body.username 
            },
            {
              email : body.username 
            }
          ]
        }
      })
    }

    if(!data) {
      res.status(403).json({status : false, message: 'UNAUTHORIZED', code:401});
      return next()
    } else if(!body?.open_id) {
      const passwordIsValid = bcrypt.compareSync(
        body.password,
        data.password
      );

      if (!passwordIsValid) {
        res.status(403).json({status : false, message: 'UNAUTHORIZED',code:401});
        return next()
      }
    }

    if(body?.room_id) {
      cekRoom = await req.db_tenant.rooms.findOne({
        where:{ 
          id : body.room_id
        }
      })
    }

    if (!cekRoom) {
      const redisRoom = await redisClient.get(`${data.tenant_id}:ROOM:${body?.room_id}`);
      if(!redisRoom){
        res.status(400).json({status : false, message: 'alert.text.room_not_exists', error_code: 'alert.text.room_not_exists',code:403});
        return next()
      }
    }

    /* expiry 1 hour */
    const expiryToken = Math.floor(Date.now() / 1000) + 60 * (config.env.JWT_EXPIRY_TOKEN * 60);
    data.dataValues.role = 'teacher'
    delete data.dataValues.password

    const token = jwt.sign(
      {
        data: data,
      },
      config.env.JWT_SECRET_KEY,
      { expiresIn: expiryToken }
    );

    
    await redisClient.RPUSH('auth:token', token);
    res.status(200).json({status : true, data, access_token: {
      token,
      expiry: expiryToken,
    }});
    } catch (err) {
      res.status(500).json({status : false, message: err.message});
    }
    return next()
    
};

export const logout = async (req,res, next) => {
  try {
    const body = req.body
    await redisClient.LREM("auth:token", -1, body.token);
    
    // if(req.db_tenants){
    //   const databases = await db_master.databases.findAll();
    //   if (databases.length > 0) {
    //     for (var i = 0; i < databases.length; i++) {
    //       req.db_tenants[databases[i].tenant_id].sequelize.close()
    //     }
    //   }
    // }

    // if(req.db_tenant){
    //   req.db_tenants.sequelize.close()
    // }

    res.status(200).json({
      statut : true,
      token : body.token 
    })
  } catch (err) {
    res.status(500).json({status : false, message: err.message});
  }
  return next()
    
}

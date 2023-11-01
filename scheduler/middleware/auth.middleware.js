import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { db_master } from '../models/index.js';
import { redisClient } from '../helpers/redis.js';

const Auth = (roles) => {
  return async (req, res, next) => {
    const authorization = req.headers["authorization"] || " ";
    const token = authorization?.split(" ");
    if(token[0] !== 'Bearer' || !token[1] || token[1]==''){
      return res.status(403).json({
        error: true,
        message: "UNAUTHORIZED EMPTY TOKEN",
        error_code : "alert.text.unauthorized"
      });
    }
    
    // const isRedisExists = await redisClient.LLEN("auth:token");
    // if(isRedisExists < 1) {
    //   return res.status(403).json({
    //     error: true,
    //     message: "UNAUTHORIZED",
    //     error_code : "alert.text.unauthorized"
    //   });
    // }

    // const isLogin = await redisClient.LPOS("auth:token", token[1]);
    // if(isLogin < 0){
    //   return res.status(403).json({
    //     error: true,
    //     message: "UNAUTHORIZED",
    //     error_code : "alert.text.unauthorized"
    //   });
    // }
    
    jwt.verify(token[1], config.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: true,
          message: "UNAUTHORIZED INVALID TOKEN",
          error_code : "alert.text.unauthorized"
        });
      }
      req.user_data = decoded.data;
      if(!roles.includes(decoded.data?.role)){
        return res.status(401).json({
          error: true,
          message: "UNAUTHORIZED",
          error_code : "alert.text.unauthorized"
        });
      }
      checkUserExist(req, decoded.data?.id,decoded.data?.role, res, next);
    });
  }
}

export const checkUserExist = async (req, id, role, res, next) => {
  try {
  let exist = false 
  if(role == 'teacher'){
    const count = await req.db_tenant.teachers.count({ where: { id } });
    exist = count > 0 ? true : false
  } else if (role == 'superadmin' || role == 'admin' || role == 'school_admin') {
    const count = await db_master.users.count({ where: { id } });
    exist = count > 0 ? true : false
  } else if (role == 'student') {
    exist = true
  }

    if (exist) {
      next();
    } else {
      return res.status(401).json({
        error: true,
        message: "UNAUTHORIZED USER NOT FOUND",
        error_code : "alert.text.unauthorized_user_not_found"
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error?.message
    });
  }
};
 
export default Auth

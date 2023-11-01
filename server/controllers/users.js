import { logger } from "../logger.js";
import {sequelize, db_master} from "../models/index.js"
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt'
import config from '../config/config.js';

export const get = async (req, res, next) => {
  try {
   let where = {}
   let limit = parseInt(req.query?.per_page) || null
   let offset = (parseInt(req.query?.page)-1)*limit || null
   let keyword = req.query?.keyword || null
   let order = req.query?.order ? [req.query?.order] : [["name", "asc"]]; 
   let role = req.query?.role || null
   let tenant_id = req.query?.tenant_id || null
   let school_id = req.query?.school_id || null

   if(role) {
    where = {
      ...where,
      role : { [sequelize.Op.eq] : role }
    }
  }
  if(tenant_id) {
    where = {
      ...where,
      tenant_id : { [sequelize.Op.eq] : tenant_id }
    }
  }
  if(school_id) {
    where = {
      ...where,
      school_id : { [sequelize.Op.eq] : school_id }
    }
  }
   
   if(keyword){
    where = {
        ...where,
        [sequelize.Op.or] : [
          {
            name : { [sequelize.Op.substring] : keyword }
          },
          {
            username : { [sequelize.Op.substring] : keyword }
          },
          {
            email : { [sequelize.Op.substring] : keyword }
          }
        ]
    }
   }
   const data = await db_master.users.findAndCountAll({where,limit,offset,order});

   res.status(200).json({status : true, data});
  
  } catch (err) {
   res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const getById = async (req, res, next) => {
  try {
    const id = req.params.id
    const data = await req.db_tenant.schools.findOne({
        where:{ id }
    })
    
    res.status(200).json({status : true, data});
  } catch (err) {
    res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const store = async (req, res, next) => {
  try {
    const body = req.body

    const findAllWhr = [{ username: body.username }];
    
    body.username = body?.username?.trim()
    body.email = body?.email?.trim()
    body.name = body?.name?.trim()
    
    if (body.email) {
      findAllWhr.push({ email: body.email });
    }
    const check = await db_master.users.findAndCountAll({
      attributes: ['id'],
      where:{ 
      [sequelize.Op.or]: findAllWhr,
      }
    })
    if(check.count > 0){
      res.status(401).json({status : false, message : "Email or Username already used", error_code:'admin.validation.account_used'});
      return next()
    }

    body.password = bcrypt.hashSync(body.password, config.salt)
    var storeData = body;
    storeData = {...storeData, id:uuid()};
    
    const data = await db_master.users.create(storeData)

    logger.info(`[users/store] - ${JSON.stringify(data)}`)
    res.status(201).json({status : true, storeData});
  } catch (err) {
    logger.error(`[users/store] - ${JSON.stringify({message: err.message})}`)
    res.status(500).json({status : false, message : err.message});
  }
  return next() 
}

export const update = async (req, res, next) => {
  try {
    const id = req.params.id
    const body=req.body
    
    body.username = body?.username?.trim()
    body.email = body?.email?.trim()
    body.name = body?.name?.trim()

    const check2 = await checkData(req,id);
    if(!check2) {
      res.status(401).json({status : false, message : "Data not found", error_code:'alert.text.selected_data_not_found'});
      return next()
    }
    const findAllWhr = [{ username: body.username }];
    if (body.email) {
      findAllWhr.push({ email: body.email });
    }
    const check = await db_master.users.findAndCountAll({
      attributes: ['id'],
      where:{ 
        id: {[sequelize.Op.ne]:id},
        [sequelize.Op.or]: findAllWhr,
       }
    })
    if(check.count > 0){
      res.status(401).json({status : false, message : "Email or Username already used", error_code:'admin.validation.account_used'});
      return next()
    }

    const data = await db_master.users.findOne({
      where:{ id }
    })

    var storeData = {...body};
    if(storeData.password)
      storeData.password = bcrypt.hashSync(storeData.password, config.salt)

    if(storeData.password == 'DEFAULT')
      delete storeData.password

    await db_master.users.update(storeData,{
     where:{ id }
    })
    logger.info(`[users/update] - ${JSON.stringify(data)}`)
    res.status(201).json({status : true, data : storeData});
  } catch (err) {
    logger.error(`[users/update] - ${JSON.stringify({message: err.message})}`)
    res.status(500).send({ status:false, message : err.message });
  }
  return next()
    
}

export const destroy = async (req, res, next) => {
  try {
    const id = req.params.id
    const check = await checkData(req,id);
    if(!check) {
      res.status(401).json({status : false, message : "Data not found", error_code:'alert.text.selected_data_not_found'});
      return next()
    }
    const data = await db_master.users.destroy({
      where : { id }
    })
    logger.info(`[schools/destroy] - ${JSON.stringify(id)}`)
    res.status(201).json({status : true, data});
  } catch (err) {
    logger.error(`[schools/destroy] - ${JSON.stringify({message: err.message})}`)
    res.status(500).send({ status:false, message : err.message });
  }
  return next()
}

const checkData = async (req,id) => {
  const check = await db_master.users.findAndCountAll({
    attributes: ['id'],
    where : { id }
  })

  return check.count > 0 ? true : false;
}

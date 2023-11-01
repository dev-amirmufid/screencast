import { logger } from "../logger.js";
import {sequelize} from "../models/index.js"
import { v4 as uuid } from 'uuid';
import appService from "../helpers/appService.js";

export const get = async (req, res, next) => {
  try {
   let where = {}
   let limit = parseInt(req.query?.per_page) || null
   let offset = (parseInt(req.query?.page)-1)*limit || null
   let keyword = req.query?.keyword || null
   let order = req.query?.order ? [req.query?.order] : [["name", "asc"]]; 
   let tenant_id = req.query?.tenant_id || null
   let school_id = req.query?.school_id || null
   let date_start = req.query?.date_start || null
   let date_end = req.query?.date_end || null

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

   if(date_start && date_end){
    where = {
      ...where,
      createdAt: {
        [sequelize.Op.between]: [date_start+" 00:00:00", date_end+" 24:00:00"],
      },
    }
   }
   
   if(keyword){
    where = {
        ...where,
        [sequelize.Op.or] : [
          {name : { [sequelize.Op.substring] : keyword }},
          {type : { [sequelize.Op.substring] : keyword }},
        ]
    }
   }

   const data = await req.db_tenant.logs.findAndCountAll({where,limit,offset,order,logging:console.log});
   res.status(200).json({status : true, data:data});
  
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

    if(body.school_code){
      const check = await req.db_tenant.schools.findAndCountAll({
        attributes: ['id'],
        where:{ 
          school_code:body.school_code
        }
      })
      if(check.count > 0){
        res.status(401).json({status : false, message : "School code already used", error_code:'admin.schools.validation.school_code_fail'});
        return next()
      }
    }

    const storeData = {
      id:uuid(),
      name:body.name,
      school_code:body.school_code,
      tenant_id:body.tenant_id,
    }
    const data = await req.db_tenant.schools.create(storeData)

    appService.cmsLogs({
      tenant_id:body.tenant_id,
      code: 'logs.schools.success_save',
      name: 'Create Schools',
      data: data,
      req: req
    });
    res.status(201).json({status : true, data});
  } catch (err) {
    logger.error(`[schools/store] - ${JSON.stringify({message: err.message})}`)
    res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const update = async (req, res, next) => {
  try {
    const id = req.params.id
    const body=req.body

    if(body.school_code){
      const check = await req.db_tenant.schools.findAndCountAll({
        attributes: ['id'],
        where:{ 
          school_code:body.school_code,
          id: {[sequelize.Op.ne]:id}
        }
      })
      if(check.count>0){
        res.status(401).json({status : false, message : "School code already used", error_code:'admin.schools.validation.school_code_fail'});
        return next()
      }
    }
    
    const data = await req.db_tenant.schools.findOne({
      where:{ id }
    })

    const storeData = {
      id : id,
      name:body.name,
      school_code:body.school_code,
      tenant_id:body.tenant_id,
    }
    await req.db_tenant.schools.update(storeData,{
     where:{ id }
    })
    logger.info(`[schools/update] - ${JSON.stringify(data)}`)
    res.status(201).json({status : true, data : storeData});
  } catch (err) {
    logger.error(`[schools/update] - ${JSON.stringify({message: err.message})}`)
    res.status(500).send({ status:false, message : err.message });
  }
  return next()
    
}

export const destroy = async (req, res, next) => {
  try {
    const id = req.params.id

    await req.db_tenant.teachers.destroy({
      where : { 
        school_id : id 
      }
    })
    // await req.db_tenant.rooms.destroy({
    //   where : { 
    //     school_id : id 
    //   }
    // })
    // SEKARANG di table room belum ada school id

    const data = await req.db_tenant.schools.destroy({
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

import {sequelize, db_master} from "../models/index.js"

export const get = async (req, res, next) => {
  try {
   let where = {}
   let limit = parseInt(req.query?.per_page) || null
   let offset = (parseInt(req.query?.page)-1)*limit || null
   let keyword = req.query?.keyword || null
   let order = req.query?.order ? [req.query?.order] : [["createdAt", "desc"]]; 
   let tenant_id = req.query?.tenant_id || null
   let date_start = req.query?.date_start || null
   let date_end = req.query?.date_end || null

   if(tenant_id) {
    where = {
      ...where,
      tenant_id : { [sequelize.Op.eq] : tenant_id }
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
          {message : { [sequelize.Op.substring] : keyword }},
          {content : { [sequelize.Op.substring] : keyword }},
        ]
    }
   }

   const data = await db_master.sync_log.findAndCountAll({where,limit,offset,order,logging:console.log});
   res.status(200).json({status : true, data:data});
  
  } catch (err) {
   res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const getById = async (req, res, next) => {
  try {
    const id = req.params.id
    const data = await db_master.sync_log.findOne({
        where:{ id }
    })
    
    res.status(200).json({status : true, data});
  } catch (err) {
    res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

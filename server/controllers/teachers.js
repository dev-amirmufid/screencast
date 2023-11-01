import crypto from 'crypto';
import qrcode from 'yaqrcode';
import { generateRandomString } from '../helpers/utility.js';
import md5 from "md5";
import { logger } from "../logger.js";
import {sequelize,db_master,initDBTenant} from "../models/index.js"
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt'
import config from '../config/config.js';
import writecsv from "../helpers/wtirecsv.js";
import readCsv from "../helpers/readCsv.js"; 
import fs from 'fs'
import Joi from "joi";

export const createRoom = async (req, res, next) => {
  let body = req.body;
  let userID = `T${Math.floor(Math.random() * 1234567890 + 9)}`;
  let roomName = body?.room_name ? body.room_name : generateRandomString();
  let roomID = md5(roomName);
  let roomData
  if(req?.user_data){
    roomData = {
      user_id: req?.user_data.id,
      username: `TEACHER ${req?.user_data.username}`,
      user_type: "TEACHER",
      room_id: roomID,
      room_name: roomName,
    };
  } else {
      roomData = {
        user_id: userID,
        username: `TEACHER ${userID}`,
        user_type: "TEACHER",
        room_id: roomID,
        room_name: roomName,
      };
  }

  try {
    const payload = {
      status: "success",
      data: roomData,
    };
    logger.info(`[teacher/create_room] - ${JSON.stringify(roomData)}`)
    res.status(200).json(payload);
  } catch (error) {
    logger.error(`[teacher/create_room] - ${JSON.stringify({message: error.message})}`)
    res.status(400).send({ error : error.message });
  }
  return next()
    
};

const algorithm = 'aes-256-cbc';
const student_key = crypto.scryptSync(config.CRYPTO_KEY_STUDENT, 'salt', 32);
const assistant_key = crypto.scryptSync(config.CRYPTO_KEY_ASSISTANT, 'salt', 32);

const encrypt = (text, key, iv) => {
 let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
 let encrypted = cipher.update(text);
 encrypted = Buffer.concat([encrypted, cipher.final()]);
 return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

export const generateStudentURL = async (req, res, next) => {
  const student_iv = crypto.randomBytes(16);

  const body = req.body;
  var encrypted_roomid = encrypt(body.room_id, student_key, student_iv);
  var url = body.host+"/auth?type=student/"+encrypted_roomid.encryptedData+"/"+encrypted_roomid.iv;
  const studentURL = {
    url: url,
    qrcode: qrcode(url, {size: 500})
  };

  try {
    const payload = {
      status: "success",
      data: studentURL,
    };
    res.status(200).json(payload);
    logger.info(`[monitoring/generate_student_url] - ${JSON.stringify({...body, url: url})}`)
  } catch (error) {
    logger.error(`[monitoring/generate_student_url] - ${JSON.stringify({...body, message: error.message})}`)
    res.status(400).send({ error : error.message });

  }
  return next()
    
}

export const generateAssistantURL = async (req, res, next) => {
  const assistant_iv = crypto.randomBytes(16);

  const body = req.body;
  var encrypted_roomid = encrypt(body.room_id, assistant_key, assistant_iv);
  var url = body.host+"/auth?type=assistant/"+encrypted_roomid.encryptedData+"/"+encrypted_roomid.iv;
  const studentURL = {
    url: url,
    qrcode: qrcode(url, {size: 500})
  };

  try {
    const payload = {
      status: "success",
      data: studentURL,
    };
    res.status(200).json(payload);
    logger.info(`[monitoring/generate_assistant_url] - ${JSON.stringify({...body, url: url})}`)
  } catch (error) {
    logger.error(`[monitoring/generate_assistant_url] - ${JSON.stringify({...body, message: error.message})}`)
    res.status(400).send({ error : error.message });
  }
  return next()
    
}

export const get = async (req, res, next) => {
  try {
    let where = {}
    let limit = parseInt(req.query?.per_page) || null
    let offset = (parseInt(req.query?.page)-1)*limit || null
    let keyword = req.query?.keyword || null
    let order = req.query?.order ? [req.query?.order] : [["first_name", "asc"]]; 
    let tenant_id = req.query?.tenant_id || null
    let school_id = req.query?.school_id || null

    where = {
      ...where,
      tenant_id : { [sequelize.Op.eq] : tenant_id },
      is_assistant : false
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
            email : { [sequelize.Op.substring] : keyword }
          },
          {
            first_name : { [sequelize.Op.substring] : keyword }
          },
          {
            username : { [sequelize.Op.substring] : keyword }
          },
          sequelize.where(
            sequelize.fn("CONCAT_WS", ' ', sequelize.col("teachers.first_name"), sequelize.col("teachers.middle_name"),sequelize.col("teachers.last_name")),
            {[sequelize.Op.substring] : keyword}
          )
        ]
    }
    }
    const data = await req.db_tenant.teachers.findAndCountAll({where,limit,offset,order});

    res.status(200).json({status : true, data});
  
  } catch (err) {
    res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const exportCsv = async (req, res, next) => {
  try {
    let where = {}
    let limit = parseInt(req.query?.per_page) || null
    let offset = (parseInt(req.query?.page)-1)*limit || null
    let keyword = req.query?.keyword || null
    let order = req.query?.order ? [req.query?.order] : [["first_name", "asc"]]; 
    let tenant_id = req.query?.tenant_id || null
    let school_id = req.query?.school_id || null

    if(!tenant_id || !school_id)
      return res.status(400).json({status : false, message : "Tenant and school are required"});

    where = {
      ...where,
      tenant_id : { [sequelize.Op.eq] : tenant_id },
      is_assistant : false
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
            email : { [sequelize.Op.substring] : keyword }
          },
          {
            first_name : { [sequelize.Op.substring] : keyword }
          },
          {
            username : { [sequelize.Op.substring] : keyword }
          },
          sequelize.where(
            sequelize.fn("CONCAT_WS", ' ', sequelize.col("teachers.first_name"), sequelize.col("teachers.middle_name"),sequelize.col("teachers.last_name")),
            {[sequelize.Op.substring] : keyword}
          )
        ]
    }
    }

    const teachers = await req.db_tenant.teachers.findAndCountAll({where,order});
    
    const ids =  teachers?.rows?.map((tmp) => { return tmp.tenant_id })
    
    ids.push(tenant_id)

    const tenants = await db_master.tenants.findAndCountAll(
      {
        where: {
          id : {
            [sequelize.Op.in]:ids
          }
        }
      }
    )

    const data_tenants = [];

    tenants?.rows?.map((tmp_)=>{
      data_tenants[tmp_.id] = tmp_
    });
 
    let tmp_tenant_detail = data_tenants[tenant_id] ? data_tenants[tenant_id] : {}

    let header = [];
    // [ 
    //   "テナントID", // "Tenant ID",
    //   "学校ID", // "School ID",  (only local)
    //   "教師名", //"name",
    //   "ユーザーID", // "USER ID",
    //   "Eメールアドレス", // "email",  
    //   'パスワード' // 'password' (only local)
    // ];

    header.push("テナントID")
    header.push("学校ID")
    header.push("教師名")

    if(tmp_tenant_detail && tmp_tenant_detail.linkage_type == 'local')
      header.push("ユーザーID")
    
    header.push("Eメールアドレス")

    if(tmp_tenant_detail && tmp_tenant_detail.linkage_type == 'local')
      header.push("パスワード")

    let data = await Promise.all(teachers?.rows?.map((tmp) => {
      // let tmp_tenant_detail = data_tenants[tmp.tenant_id] ? data_tenants[tmp.tenant_id] : {}
      const _data = {}

      _data["テナントID"] = tmp.tenant_id
      _data["学校ID"] = tmp.school_id
      _data["教師名"] =  tmp.first_name
      if(tmp_tenant_detail && tmp_tenant_detail.linkage_type == 'local'){
        _data["ユーザーID"] = tmp.username
      } 
  
      _data["Eメールアドレス"] = tmp.email

      if(tmp_tenant_detail && tmp_tenant_detail.linkage_type == 'local'){ 
        _data["パスワード"] = ''
      }

      return _data
    }));

    console.log({tmp_tenant_detail})

    if(data.length == 0){
        const tmp_push = {
            "テナントID" : tenant_id,
            "学校ID": school_id,
            "教師名":""
        }

        if(tmp_tenant_detail && tmp_tenant_detail.linkage_type == 'local'){
          tmp_push["ユーザーID"] = ''
        } 

        tmp_push["Eメールアドレス"] = ''

        if(tmp_tenant_detail && tmp_tenant_detail.linkage_type == 'local'){ 
          tmp_push["パスワード"] = ''
        }

        data.push(tmp_push)
    }

    // return res.status(200).json({status : true, teachers});
  
    let pathFolder = `csv/teacher`;
    let fileName = `teacher${uuid()}.csv`

    /* create csv file */
    await writecsv(`${fileName}`, pathFolder, header, data);
  
    res.setHeader('Content-type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename='+fileName);

    res.download(`${pathFolder}/${fileName}`,`teacher${uuid()}.csv`);
     
    /* Remove file from path */
    setTimeout(() => {
      try {
        fs.unlinkSync(`${pathFolder}/${fileName}`);
      } catch (err) {
        // console.error(err);
      }
    }, 5000);

  } catch (err) {
    res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const importCsv = async (req, res, next) => {
  try {

    const file = req.file
    const {tenant_id} = req.body
    const errors    = [];
    let error_datas = [];

    // Get tenant detail from tenant_id in params 
    const tenant_detail =  await db_master.tenants.findOne({
      where : {
        id : tenant_id
      }
    })

    // define wich column be a identifier
    const identifyer_coulmn = tenant_detail.linkage_type == "local" ? 'username' : 'email'

    // define wich column have to unique
    const unique_coulmn = tenant_detail.linkage_type == "local" ? 'email' : 'username'

    // Read Csv File as JSON
    let csv = await readCsv(`${file?.path}`, { headers: false }, (row) => row);

    // Replicate json with readable key
    const teachers_csv = await Promise.all(csv.map( async (item)=> {
        const tmp_sort = {}
        const tmp      = {}
        const keys = Object.keys(item)

        await Promise.all(keys.map((element,index) => {
          tmp_sort[index] = item[element]
        }));
 
        // "テナントID", // "Tenant ID", 0 
        // "学校ID", // "School ID",  (only local) 1 
        // "教師名", //"name", 2 
        // "ユーザーID", // "USER ID",3 
        // "Eメールアドレス", // "email",   4 
        // 'パスワード' // 'password' (only local) 5

        tmp.first_name     = tmp_sort[2]
        tmp.email          = tmp_sort[tenant_detail.linkage_type == "local" ? 4 : 3]
        tmp.school_id      = tmp_sort[1]
        tmp.tenant_id      = tmp_sort[0]

        if(tenant_detail.linkage_type == "local"){
          tmp.username       = tmp_sort[3]

          if(tmp_sort[5])
            tmp.password = tmp_sort[5]
        }

        if(tenant_id != tmp.tenant_id )
          errors.push('admin.teachers.validation.tenant_id_invalid')
 
        const objectJoy = {
          first_name:Joi.string().max(128), 
          school_id:Joi.string().max(128), 
          tenant_id:Joi.string().max(128),
          phone_number:Joi.string().allow(null).allow('').optional(),
          password:Joi.string().min(4).max(100).alphanum().required().optional() 
                  .messages({
                    'string.alphanum': `admin.teachers.validation.password_alphanumeric`,
                    'string.min': `admin.teachers.validation.password_minlength`,
                    'string.max': `admin.teachers.validation.password_maxlength`,
                    'any.required':  `admin.teachers.validation.password_required`,
                  })
        }

        if(tenant_detail.linkage_type == "local"){
          objectJoy.email = Joi.string().allow(null).allow('').optional()
          objectJoy.username = Joi.string()
        }else{
          objectJoy.email = Joi.string()
          objectJoy.username = Joi.string().allow(null).allow('').optional()
        }

        const schema = Joi.object().keys(objectJoy);  
        const validation = schema.validate(tmp);
        
        if(validation && validation.error){ 
          errors.push(validation?.error?.details[0]?.message)
        }

        if(tmp.password)
          tmp.password = bcrypt.hashSync(tmp.password,config.salt)

        return tmp;
    }))
 

    // define identify_id depand on linkage_type == local with username else with email
    const identify_csv = await Promise.all(teachers_csv.map( async (item)=> {
        return item[identifyer_coulmn]
    }))

    // define identify_id depand on linkage_type == local with email else with username
    const unique_csv = await Promise.all(teachers_csv.map( async (item)=> {
        return item[unique_coulmn]
    }))

    let duplicate = unique_csv.filter((item, index) => unique_csv.indexOf(item) !== index)

    if(duplicate && duplicate.length > 0){
      errors.push('admin.validation.account_used')
      error_datas = duplicate
    } 
    
    // Open connection to database based on tenant id
    const db_tenant = await initDBTenant(tenant_id);

    // Get Existing data identify by email or user_id
    const teachers_db = await db_tenant.teachers.findAndCountAll(
      {
        where: {
          [identifyer_coulmn] : {
            [sequelize.Op.in]: identify_csv
          },
          is_assistant : false
        }
      }
    )

    // Get Existing data and macthing if unique value has been taken
    let teachers_db_unique = await db_tenant.teachers.findAndCountAll(
      {
        where: {
          [unique_coulmn] : {
            [sequelize.Op.in]: unique_csv
          },
          [identifyer_coulmn] : {
            [sequelize.Op.notIn]: identify_csv
          }
        },
        is_assistant : false
      }
    )

    teachers_db_unique = teachers_db_unique.rows
     
    // Get username or email list
    const teacher_identify = await Promise.all(teachers_db?.rows.map( async (item)=> {
      return item[identifyer_coulmn];
    }))

    const update_datas = [];
    const store_datas = [];
  
    await Promise.all(teachers_csv.map( async (item)=> { 

        const checkingUniqeExisting = teachers_db_unique.find((dat) => dat[unique_coulmn] == item[unique_coulmn]);

        if(checkingUniqeExisting && (checkingUniqeExisting[identifyer_coulmn] != item[identifyer_coulmn]))
          {
            errors.push('admin.validation.account_used')
            error_datas.push(item[identifyer_coulmn])
          }
        
        if(item && item[identifyer_coulmn] && teacher_identify.includes(item[identifyer_coulmn])){
          update_datas.push(item)
        }else{

          if(item && (item.password == '' || !item.password)){
            errors.push("validation.password_required")
            error_datas.push(item[identifyer_coulmn])
          }

          store_datas.push(item)
        }
    }))
    
    // if(errors && errors.length > 0)
    //   return res.status(400).json({status:false,message:errors[0],data:error_datas});

    // FINAL AFTER VALIDATION EXECUTION DATA
    await Promise.all(update_datas.map( async (item)=> { 
      await db_tenant.teachers.update(item, {
        where: { [identifyer_coulmn]: item[identifyer_coulmn]}
      }); 
    }))
 
    await Promise.all(store_datas.map( async (item)=> {
      item.id = uuid()
      await db_tenant.teachers.create(item, {
        where: { [identifyer_coulmn]: item[identifyer_coulmn]}
      });
    }))
 
    /* Remove file from path */
    setTimeout(() => {
      try {
        fs.unlinkSync(`${file?.path}`);
      } catch (err) {
        console.error(err);
      }
    }, 5000);
    
    return res.status(200).json({status:true,message:'ok',data: teachers_db });

  } catch (err) {
    /* Remove file from path */
    setTimeout(() => {
      try {
        fs.unlinkSync(`${file?.path}`);
      } catch (err) {
        console.error(err);
      }
    }, 5000);
    return res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const checkIngmportCsv = async (req, res, next) => {
 
  try {

    const file = req.file
    const {tenant_id} = req.body 
    let csv_format_failed = [];
    
    // Get tenant detail from tenant_id in params 
    const tenant_detail =  await db_master.tenants.findOne({
      where : {
        id : tenant_id
      }
    })

    // define wich column be a identifier
    const identifyer_coulmn = tenant_detail.linkage_type == "local" ? 'username' : 'email'

    // define wich column have to unique
    const unique_coulmn = tenant_detail.linkage_type == "local" ? 'email' : 'username'

    // Read Csv File as JSON
    let csv = await readCsv(`${file?.path}`, { headers: false }, (row) => row);

    if(!csv ||csv.length < 1)
      return res.status(400).json({status : false, message : 'admin.teachers.validation.csv_format_invalid'});


      // Replicate json with readable key
    const teachers_csv = await Promise.all(csv.map( async (item)=> {
        const tmp_sort = {}
        const tmp      = {}
        const keys = Object.keys(item)

        await Promise.all(keys.map((element,index) => {
          tmp_sort[index] = item[element]
        }));
 
        if(keys.length < 4 && tenant_detail.linkage_type != "local")
          csv_format_failed.push(true)

        if(keys.length < 6 && tenant_detail.linkage_type == "local")
          csv_format_failed.push(true)

          
        // "テナントID", // "Tenant ID", 0 
        // "学校ID", // "School ID",  (only local) 1 
        // "教師名", //"name", 2 
        // "ユーザーID", // "USER ID",3 
        // "Eメールアドレス", // "email",   4 
        // 'パスワード' // 'password' (only local) 5

        tmp.first_name     = tmp_sort[2]
        tmp.email          = tmp_sort[tenant_detail.linkage_type == "local" ? 4 : 3]
        tmp.school_id      = tmp_sort[1]
        tmp.tenant_id      = tmp_sort[0]

        if(tenant_detail.linkage_type == "local"){
          tmp.username       = tmp_sort[3]

          if(tmp_sort[5])
            tmp.password = tmp_sort[5]
        }
 
        const objectJoy = {
          first_name:Joi.string()
                    .max(128)
                    .required()
                    .messages({
                      'string.required':  `admin.teachers.validation.required`,
                      'string.empty':  `admin.teachers.validation.required`,
                      'string.max': `admin.teachers.validation.name_maxlength`,
                    })
                    , 
          school_id:Joi.string().required()
                    .messages({
                      'string.required':  `admin.teachers.validation.required`,
                      'string.empty':  `admin.teachers.validation.required`
                    }), 
          tenant_id:Joi.string().max(128).required()
                    .messages({
                      'string.required':  `admin.teachers.validation.required`,
                      'string.empty':  `admin.teachers.validation.required`
                    }),
          phone_number:Joi.string().allow(null).allow('').optional(),
          password : Joi.string().min(4).max(12).alphanum().optional()
                  .messages({
                    'string.alphanum': `admin.teachers.validation.password_alphanumeric`,
                    'string.min': `admin.teachers.validation.password_minlength`,
                    'string.max': `admin.teachers.validation.password_maxlength`,
                    'any.required':  `admin.teachers.validation.password_required`,
                  })
        }

                       
        if(tenant_detail.linkage_type == "local"){ 
            objectJoy.username = Joi.string()
                                .max(128)
                                .pattern(/^[a-zA-Z0-9_.!*’()-]+$/)
                                .messages({
                                  'string.required':  `admin.teachers.validation.required`,
                                  'string.empty':  `admin.teachers.validation.required`,
                                  'string.pattern.base':  `admin.teachers.validation.invalid_username`,
                                  'string.max': `admin.teachers.validation.userid_maxlength`
                                }) 

            objectJoy.email = Joi.string()
                              .max(319)
                              .email({tlds: false}) 
                              .allow('')
                              .allow(null)
                              .messages({
                                'string.required':  `admin.teachers.validation.required`,
                                'string.empty':  `admin.teachers.validation.required`,
                                'string.max':  `admin.teachers.validation.email_maxlength`,
                                'string.email':  `admin.teachers.validation.invalid_email`
                              }) 
        }else{ 
              objectJoy.username = Joi.string() 
                        .max(128)
                        .pattern(/^[a-zA-Z0-9_.!*’()-]+$/)
                        .allow('')
                        .allow(null)
                        .messages({
                          'string.required':  `admin.teachers.validation.required`,
                          'string.empty':  `admin.teachers.validation.required`,
                          'string.pattern.base':  `admin.teachers.validation.invalid_username`,
                          'string.max': `admin.teachers.validation.userid_maxlength`
                        }) 

              objectJoy.email = Joi.string()
                      .email({tlds: false})
                      .max(319)
                      .required()
                      .messages({
                        'string.required':  `admin.teachers.validation.required`,
                        'string.empty':  `admin.teachers.validation.required`,
                        'string.max':  `admin.teachers.validation.email_maxlength`,
                        'string.email':  `admin.teachers.validation.invalid_email`
                      }) 
        }

        const schema = Joi.object().keys(objectJoy);  
        const validation = schema.validate(tmp);
        
        tmp.tenant_name    = tenant_detail && tmp.tenant_id == tenant_detail.id? tenant_detail.name : 'N/A'

        tmp.errors = {};
 
        let regexMail = new RegExp('[a-z0-9]+@[a-z0-9]+\.[a-z]{2,3}'); 
        let regexUsername = new RegExp('/^[a-zA-Z0-9_.!*’()-]+$/'); 
 
        if(tmp.email&& !regexMail.test(tmp.email)) 
          tmp.errors.email = "admin.teachers.validation.invalid_email"

        if(tmp.username && !tmp.username.match(/^[a-zA-Z0-9_.!*’()-]+$/))
          tmp.errors.username = "admin.teachers.validation.invalid_username"

        if(validation?.error?.details){  
          await Promise.all(validation.error.details.map((element,index) => {
            console.log({element})
            tmp.errors[element.context.key] = element.message;
          }));
        }

        
        if(!tmp.tenant_id){
          tmp.errors.tenant_name = 'admin.teachers.validation.required'
        }

        if(tmp.password && tmp.password.length < 4)
          tmp.errors.password = 'admin.teachers.validation.password_minlength'

        if(tmp.username && tmp.username.length > 128)
          tmp.errors.username = 'admin.teachers.validation.userid_maxlength'
 
        if(tmp.tenant_id && tmp.tenant_id && (tenant_id != tmp.tenant_id)){
          tmp.errors.tenant_id = 'admin.teachers.validation.tenant_id_invalid'
          tmp.errors.tenant_name = 'admin.teachers.validation.tenant_id_invalid'
        }

        if(tmp.username && tmp.first_name.match(/([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g))
          tmp.errors.first_name = 'validation.emoji_disallowed'

        return tmp;
    }))

    if(csv_format_failed && csv_format_failed.length > 0)
      return res.status(400).json({status : false, message : 'admin.teachers.validation.csv_format_invalid'});
  
    // define identify_id depand on linkage_type == local with username else with email
    const identify_csv = await Promise.all(teachers_csv.map( async (item)=> {
        return item[identifyer_coulmn]
    }))
  
    // define identify_id depand on linkage_type == local with email else with username
    const unique_csv = await Promise.all(teachers_csv.map( async (item)=> {
        return item[unique_coulmn]
    }))
 
    // Get list of school id from csv
    const school_ids_csv = await Promise.all(teachers_csv.map( async (item)=> {
        return item.school_id
    }))

    // Open connection to database based on tenant id
    const db_tenant = await initDBTenant(tenant_id);
    
    let school_db = await db_tenant.schools.findAndCountAll(
      {
        where: {
          "id" : {
            [sequelize.Op.in]: school_ids_csv
          }
        }
      }
    )

     // Get Existing data identify by email or user_id
     const teachers_db = await db_tenant.teachers.findAndCountAll(
      {
        where: {
          [identifyer_coulmn] : {
            [sequelize.Op.in]: identify_csv
          },
          is_assistant : false
        }
      }
    )
    
    // Get list of school id from db
    const school_db_items = [];
    school_db = await Promise.all(school_db?.rows.map( async (item)=> {
      return school_db_items[item.id] = item
    }))
    
    // Get Existing data and macthing if unique value has been taken
    let teachers_db_unique = await db_tenant.teachers.findAndCountAll(
      {
        where: {
          [unique_coulmn] : {
            [sequelize.Op.in]: unique_csv
          },
          [identifyer_coulmn] : {
            [sequelize.Op.notIn]: identify_csv
          },
          is_assistant : false
        }
      }
    )

    teachers_db_unique = teachers_db_unique.rows
    
    // Get username or email list
    const teacher_identify = await Promise.all(teachers_db?.rows.map( async (item)=> {
      return item[identifyer_coulmn];
    }))
    
    let duplicate = unique_csv.filter((item, index) => unique_csv.indexOf(item) !== index)
    let duplicate2 = identify_csv.filter((item, index) => identify_csv.indexOf(item) !== index)

    const teachers_csv_validate = await Promise.all(teachers_csv.map( async (item)=> {
       const tmp = item
       tmp.school_name = school_db_items[tmp.school_id]?.name || false

       if(tmp.school_name == false){
        tmp.school_name =  tmp.school_id ? 'N/A' : ''
        tmp.errors['school_name'] = tmp.school_id ? 'admin.teachers.validation.school_id_invalid' : 'admin.teachers.validation.required'
       } 
       
       const checkingUniqeExisting = teachers_db_unique.find((dat) => dat[unique_coulmn] == item[unique_coulmn]); 

       if(item[unique_coulmn] && checkingUniqeExisting && item && item[identifyer_coulmn] && (checkingUniqeExisting[identifyer_coulmn] != item[identifyer_coulmn]))
        {
          tmp.errors[unique_coulmn] = 'admin.teachers.validation.unique_identifyer'
        }

        if(!item[identifyer_coulmn] || item[identifyer_coulmn] == "")
          tmp.errors[identifyer_coulmn] = 'admin.teachers.validation.required'

        if(item && item[identifyer_coulmn] && teacher_identify.includes(item[identifyer_coulmn])){
          tmp.action_type = 'update'
        }else{

          if(item && (item.password == '' || !item.password) && item[identifyer_coulmn] && identifyer_coulmn == 'username'){
            tmp.errors.password = 'admin.teachers.validation.password_required'
          }

          tmp.action_type = 'insert'
        }
        
        const checkingDuplicate = duplicate.includes(tmp[unique_coulmn])
        const checkingDuplicate2 = duplicate2.includes(tmp[identifyer_coulmn])

        console.log({duplicate2,checkingDuplicate2},tmp[identifyer_coulmn])

        if(checkingDuplicate && tmp[unique_coulmn])
          tmp.errors[unique_coulmn] = 'admin.teachers.validation.unique_identifyer'

        if(checkingDuplicate2 && tmp[identifyer_coulmn])
          tmp.errors[identifyer_coulmn] = 'admin.teachers.validation.unique_identifyer'
 
       return tmp
    }))
  
    /* Remove file from path */
    setTimeout(() => {
      try {
        fs.unlinkSync(`${file?.path}`);
      } catch (err) {
        // console.error(err);
      }
    }, 5000);
    
    return res.status(200).json({status: true, message:'ok', data : teachers_csv_validate });

  } catch (err) {
    /* Remove file from path */
    setTimeout(() => {
      try {
        fs.unlinkSync(`${file?.path}`);
      } catch (err) {
        // console.error(err);
      }
    }, 5000);
    return res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const getById = async (req, res, next) => {
  try {
    const id = req.params.id
    const data = await req.db_tenant.teachers.findOne({
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
    const tenant_id = body.tenant_id
    body.name = body?.name?.trim()
    body.username = body?.username?.trim()
    body.email = body?.email?.trim()


    let userCheckField = []

    if(body?.username) userCheckField.push({ username: body.username })
    if(body?.email) userCheckField.push({ email: body.email })

    const check = await req.db_tenant.teachers.findAndCountAll({
      attributes: ['id'],
      where:{ 
      [sequelize.Op.or]: userCheckField
      }
    })
    
    if(check.count > 0 && ((body?.username && body.username != "") || (body?.email && body.email != ""))){
      res.status(401).json({status : false, message : "Email or Username already used", error_code:'admin.validation.account_used'});
      return next()
    }

    if(body.password){
      body.password = bcrypt.hashSync(body.password, config.salt)
    }
    var storeData = body;
    storeData = {...storeData, id:uuid(), first_name:body.name, is_assistant:false};
    delete storeData.name;
    
    const data = await req.db_tenant.teachers.create(storeData)

    logger.info(`[teachers/store] - ${JSON.stringify(data)}`)
    res.status(201).json({status : true, storeData});
  } catch (err) {
    logger.error(`[teachers/store] - ${JSON.stringify({message: err.message})}`)
    res.status(500).json({status : false, message : err.message});
  }
  return next()
    
}

export const update = async (req, res, next) => {
  try {
    const id = req.params.id
    const body=req.body
    const tenant_id = body.tenant_id
    body.name = body?.name?.trim()
    body.username = body?.username?.trim()
    body.email = body?.email?.trim()

    const check2 = await checkData(req,id);
    if(!check2) {
      res.status(401).json({status : false, message : "Data not found", error_code:'alert.text.selected_data_not_found'});
      return next()
    }

    let userCheckField = []
    if(body?.username) userCheckField.push({ username: body.username })
    if(body?.email) userCheckField.push({ email: body.email })
    // console.log(userCheckField);
    const check = await req.db_tenant.teachers.findAndCountAll({
      attributes: ['id'],
      where:{ 
        id: {[sequelize.Op.ne]:id},
        [sequelize.Op.or]: userCheckField,
       }
    })
    if(check.count > 0 && ((body?.username && body.username != "") || (body?.email && body.email != ""))){
      res.status(401).json({status : false, message : "Email or Username already used", error_code:'admin.validation.account_used'});
      return next()
    }

    const data = await req.db_tenant.teachers.findOne({
      where:{ id }
    })

    var storeData = {...body, first_name:body.name};
    if(storeData.password)
      storeData.password = bcrypt.hashSync(storeData.password, config.salt)

    if(storeData.password == 'DEFAULT')
      delete storeData.password
      
    delete storeData.name;

    await req.db_tenant.teachers.update(storeData,{
     where:{ id }
    })
    logger.info(`[teachers/update] - ${JSON.stringify(data)}`)
    res.status(201).json({status : true, data : storeData});
  } catch (err) {
    logger.error(`[teachers/update] - ${JSON.stringify({message: err.message})}`)
    res.status(500).send({ status:false, message : err.message });
  }
  return next()
    
}

export const destroy = async (req, res, next) => {
  try {
    const id = req.params.id
    const body = req.body
    const tenant_id = body.tenant_id
    const is_assistant = body?.is_assistant || false;
    const check = await checkData(req,id);
    if(!check) {
      res.status(401).json({status : false, message : "Data not found", error_code:'alert.text.selected_data_not_found'});
      return next()
    }
    const data = await req.db_tenant.teachers.destroy({
      where : { 
        id,
        is_assistant 
      }
    })
    logger.info(`[teachers/destroy] - ${JSON.stringify(id)}`)
    res.status(201).json({status : true, data});
  } catch (err) {
    logger.error(`[teachers/destroy] - ${JSON.stringify({message: err.message})}`)
    res.status(500).send({ status:false, message : err.message });
  }
  return next()
    
}

export const changePassword = async (req,res, next) => {
  try{
    const id = req.params.id
    const {old_password, new_password} = req?.body

    const teacher = await req.db_tenant.teachers.findOne({
      where : { id }
    });

    if(!teacher) {
      res.status(401).json({status : false, message : "Data not found", error_code:'alert.text.selected_data_not_found'});
      return next()
    }

    if(req?.user_data?.role != 'superadmin'){
      const passwordIsValid = bcrypt.compareSync(
        old_password,
        teacher.password
      );

      if (!passwordIsValid) {
        res.status(401).send({
          status: false,
          message: "INVALID PASSWORD"
        });
        return next()
    
      }
    }

    req.db_tenant.teachers.update({
      password : bcrypt.hashSync(new_password, config.salt)
    },{
      where : {
        id
      }
    }).then((update)=>{
      logger.info(`[teachers/change-password] - ${JSON.stringify(id)}`)
      res.status(201).send({ status: true, message: 'Password has change'});
    }).catch((err) => {
      logger.error(`[teachers/change-password] - ${JSON.stringify({message: err.message})}`)
      res.status(500).send({ status: false, message: err.message });
    })
    
  } catch (err) {
    logger.error(`[teachers/change-password] - ${JSON.stringify({message: err.message})}`)
    return res.status(500).send({ status:false, message : err.message });
  }
  return next()
    
}

export const storeAssistant = async (req,res, next) => {
  try {
    const body = req.body;

    var time = new Date().getTime()
    const username = md5(`${body.tenant_id}-${body.room_id}-${time}`);
    const password = bcrypt.hashSync(username, config.salt);

    const data = {
      id : uuid(),
      sourcedId : null,
      tenant_id : body.tenant_id,
      school_id : body.school_id,
      first_name : username,
      username : username,
      phone_number : '',
      email : '',
      password : password,
      is_assistant : true
    }
    await req.db_tenant.teachers.create(data)
    
    res.status(201).json({status : true, data});
  } catch (err) {
    logger.error(`[teachers/store] - ${JSON.stringify({message: err.message})}`)
    res.status(500).json({status : false, message : err.message});
  }
  return next()
}


const checkData = async (req,id) => {
  const check = await req.db_tenant.teachers.findAndCountAll({
    attributes: ['id'],
    where : { id }
  })

  return check.count > 0 ? true : false;
}

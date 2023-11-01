import { wsConf } from "../constants/ws.js";
import { createClient } from "redis";
import config from "../config/config.js";
import { redisClient } from "../helpers/redis.js";
import {initAllTenantDB} from "../models/index.js"

export const iceServer = async (req, res, next) => {
  res.status(200).json({ data: wsConf.CONFIG });
  return next()
    
};

export const clearRedis = async (req, res, next) => {
  let key = req.query.key;

  if (key == authkey) {
    await redisClient.connect();
    await redisClient.flushAll();
    await redisClient.disconnect();
  }
  
  res.status(200).send("COMPLETED");
  return next()
    
};

export const clearAssistant = async (req, res, next) => {
  const db_tenants = await initAllTenantDB()
  for(let x in db_tenants){
    const teachers = await db_tenants[x].teachers.findAll({
      where : { is_assistant : true }
    })

    teachers.map((item)=>{
      redisClient.SREM(`${item.tenant_id}:USERTENANT`, item.id);
      redisClient.DEL(`${item.tenant_id}:USERLOGIN:${item.id}`);
    })

    db_tenants[x].teachers.destroy({
      where : { is_assistant : true }
    })
  }

  return res.send('ok')
}

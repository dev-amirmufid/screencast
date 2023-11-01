import { db_master, initAllTenantDB } from "../models/index.js";

export const clearData = async (req, res, next) => {
  const tenants = await db_master.tenants.findAll();
  const db_tenants = await initAllTenantDB()
  tenants.forEach(async(item) => {

    if(item.linkage_type == 'lti'){
      db_tenants[item.id].logs.destroy({ truncate : true, cascade: false })
      db_tenants[item.id].schools.destroy({ truncate : true, cascade: false })
      db_tenants[item.id].teachers.destroy({ truncate : true, cascade: false })
      db_tenants[item.id].rooms.destroy({ truncate : true, cascade: false })
    }
  });
  res.status(200).json("ok");
  return next()
    
};

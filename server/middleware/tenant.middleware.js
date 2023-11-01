import config from '../config/config.js';
import { db_master, db_tenants, initDBTenant } from '../models/index.js';

export const InitDBMiddleware = () => {
  return async (req, res, next) => {
    const subdomain = req.headers["subdomain"] || "";
    const tenants = await db_master.tenants.findOne({
      where : {
        subdomain : subdomain
      }
    })
    
    if(subdomain == config.env.SUBDOMAIN_ADMIN || subdomain == ''){
      req.db_tenants = db_tenants
      
      let param = req?.body || null
      if(req.method == "GET"){
       param = req?.query || null
      }
      const tenant_id = param?.tenant_id
      if(tenant_id){
        let db_tenant = db_tenants[tenant_id]
        if(!db_tenant) {
          db_tenant = await initDBTenant(tenant_id)
          if(!db_tenant) {
            console.log('failed load database or not found')
            
            return res.status(500).json({
              error: true,
              message: "failed load database or not found"
            });
          }
        } else {
          console.log('success connect database')
        }
        req.db_tenant = db_tenant;
      }
    }else {
      if(!tenants) {
        return res.status(404).json({
          error: true,
          message: "TENANT NOT FOUND"
        });
      } else {
        let db_tenant = db_tenants[tenants.id]
        if(!db_tenant) {
          db_tenant = await initDBTenant(tenants.id)
          if(!db_tenant) {
            console.log('failed load database or not found')
            
            return res.status(500).json({
              error: true,
              message: "failed load database or not found"
            });
          }
        } else {
          console.log('success connect database')
        }
        req.db_tenant = db_tenant;
        req.tenant = tenants;
      }
    }
    return next();

  }
}

export const CloseDBMiddleware = () => {
  return async (req, res, next) => {
    // console.log('CLOSE db')
    // if(req.db_tenants){
    //   const databases = await db_master.databases.findAll();
    //   if (databases.length > 0) {
    //     for (var i = 0; i < databases.length; i++) {
    //       if(req.db_tenants[databases[i].tenant_id]){
    //         req.db_tenants[databases[i].tenant_id].sequelize.close()
    //       }
    //       // console.log(req.db_tenants[databases[i].tenant_id].sequelize.close(),'req.db_tenants[databases[i].tenant_id].sequelize.close()')
    //     }
    //   }
    // }

    // if(req.db_tenant){
    //   req.db_tenant.sequelize.close()
    //   // console.log(req.db_tenants.sequelize.close(),'req.db_tenants.sequelize.close()')
    // }

    return true;
  }
}

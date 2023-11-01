import {sequelize} from "../models/index.js"
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

class AppService {
  
  constructor() {}

  async cmsLogs(data){
    try {
        var req = data.req;
        const authorization = req.headers["authorization"] || " ";
        const token = authorization?.split(" ");
    
          jwt.verify(token[1], config.env.JWT_SECRET_KEY, (err, decoded) => {
            var json_data = JSON.stringify({
                url: req.protocol + '://' + req.get('host') + req.originalUrl,
                method: req.method,
                headers: req.headers,
                users:decoded.data,
                body: req.body,
                response: data.data
            });
            let storeData = {
              id: uuid(),
              tenant_id: data.tenant_id,
              school_id: data.school_id,
              name: data.name,
              type:'CMS',
              content_data:json_data,
              createdBy: decoded.data?.role
            }
            req.db_tenant.logs.create(storeData)
          });
    } catch (error) {
        return false;
    }
  }

}

export default new AppService()

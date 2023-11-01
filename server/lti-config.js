import ltijs from "ltijs";
import Database from "ltijs-sequelize"
import config from "./config/config.js";
import { db_master, db_tenants, initDBTenant } from "./models/index.js";
import { v4 as uuid } from 'uuid';
import md5 from "md5";
import jwt from "jsonwebtoken";

const middleware = (app) => {
  app.use(async (req, res, next) => {
    console.log(req.query.subdomain)
    const subdomain = req.query.subdomain
    if(subdomain){
      const tenant = await db_master.tenants.findOne({
        where : {
          subdomain : subdomain
        }
      })
      if(tenant){
        req.tenant = tenant
      } else {
        return res.status(404).send("Tenant Not Found")
      }
    }
    return next()
  })
}
const db = new Database(config.env.MASTER_DB_DBNAME,config.env.MASTER_DB_USER,config.env.MASTER_DB_PASSWORD, 
  { 
    host: config.env.MASTER_DB_HOST,
    dialect: config.env.MASTER_DB_DRIVER,
    port: config.env.MASTER_DB_PORT,
    logging: false 
  }
)

const lti = ltijs.Provider;
// Setup provider

const LTI = async (params) => {
  lti.setup(config.env.LTI_KEY,
    { 
      plugin: db // Passing db object to plugin field
    },
    {
      serverAddon: middleware,
      appRoute: "/lti",
      loginRoute: "/lti/login", // Optionally, specify some of the reserved routes
      cookies: {
        secure: true, // Set secure to true if the testing platform is in a different domain and https is being used
        sameSite: 'None', // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
      },
      devMode: false, // Set DevMode to true if the testing platform is in a different domain and https is not being used
    }
  );

  // Set lti launch callback
  lti.onConnect(async (token, req, res) => {  
    if (token) {
      console.log(JSON.stringify(token))

      const platform = token?.platformContext;
      const role = platform?.roles;
      const userInfo = token?.userInfo;
      const custom_param = platform?.custom

      
      if(!req.tenant && custom_param?.subdomain){
        const tenant = await db_master.tenants.findOne({
          where : {
            subdomain : custom_param.subdomain
          }
        })
        if(tenant){
          req.tenant = tenant
        } else {
          return res.status(404).send("Tenant Not Found")
        }
      }


      const tenant_id = req.tenant?.id
      const context = platform.context
      let userType = "student";

      let db_tenant = db_tenants[tenant_id];
      if(!db_tenant){
        db_tenant = await initDBTenant(tenant_id)
      }

      if (role.length > 0) {
        for (var i = 0; i < role.length; i++) {
          if (role[i].includes("Instructor")) {
            userType = "teacher";
          }
        }
      }

      let room_id
      let access_token
      let data
      const uri = md5(`${context.id}-${context.title}`);
      const roomData = await db_tenant.rooms.findOne({
        where : {
          uri : uri
        }
      });

      room_id = roomData?.id
      if(!room_id){
        
        const roomOwner = {
          id : uuid(),
          sourcedId : null,
          tenant_id : tenant_id,
          school_id : tenant_id,
          first_name : 'roomOwner',
          middle_name : 'roomOwner',
          last_name : 'roomOwner',
          username : 'roomOwner',
          phone_number : '',
          email : 'roomOwner@roomOwner.com',
          password : ''
        }
        await db_tenant.teachers.create(roomOwner)

        const storeData = {
          id:uuid(),
          teacher_id : roomOwner.id,
          tenant_id : tenant_id,
          school_id : tenant_id,
          name:context.title,
          uri:uri,
          is_disabled:false,
          expiredAt:null
        }
        await db_tenant.rooms.create(storeData)
        room_id = storeData.id
      }

      if(userType == 'teacher'){
        const name = userInfo.name.split(" ")
        data = {
          id : uuid(),
          sourcedId : null,
          tenant_id : tenant_id,
          school_id : tenant_id,
          first_name : userInfo.given_name,
          middle_name : name[1],
          last_name : userInfo.family_name,
          username : userInfo.name,
          phone_number : '',
          email : userInfo.email,
          password : ''
        }
        await db_tenant.teachers.create(data)

        const expiryToken = Math.floor(Date.now() / 1000) + 60 * (config.env.JWT_EXPIRY_TOKEN * 60);
        data.role = 'teacher'
        delete data.password
        const jwttoken = jwt.sign(
          {
            data: data,
          },
          config.env.JWT_SECRET_KEY,
          { expiresIn: expiryToken }
        );

        access_token = {
          token : jwttoken,
          expiry: expiryToken,
        }

        data.role = userType
        data.name = userInfo.name
        data.room_id = room_id
  
      } else {
        data = {
          role : userType,
          name : userInfo.name,
          username : userInfo.name,
          tenant_id : tenant_id,
          room_id : room_id
        }
      }

      const CLIENT_URL = `${config.env.USE_HTTPS == 'true' ? 'https':'http'}://${req.tenant.subdomain}.${config.env.CLIENT_URL}`

      const jwtoken = jwt.sign({ 
        data : data,
        access_token : access_token
       }, config.env.JWT_SECRET_KEY);

      res.redirect(
        `${CLIENT_URL}/lti?token=${jwtoken}`
      );

    } 
  });

  const setup = async () => {
    // Deploy server and open connection to the database
    await lti.deploy({ port: config.env.LTI_PORT || 5001,serverless: params?.serverless ? true : false }); // Specifying port. Defaults to 3000

    // Register platform
    const lti_platform = await db_master.lti_settings.findAll();
    lti_platform.forEach(item => {
      lti.registerPlatform({
        name: item.platform_name,
        url: item.platform_url,
        clientId: item.client_id,
        authenticationEndpoint: item.authentication_endpoint,
        accesstokenEndpoint: item.accesstoken_endpoint,
        authConfig: {
          method: item.auth_method_type || 'JWK_SET',
          key: item.auth_key,
        },
      });
    });

    return lti
  };

  return await setup();
}

export default LTI

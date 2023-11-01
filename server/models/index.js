import Sequelize from 'sequelize';
import initModelsMaster from './master_db/init-models.js'
import initModelsTenant from './tenant_db/init-models.js'
import config from '../config/config.js';

export const db_master = initModelsMaster(new Sequelize(
  config.env.MASTER_DB_DBNAME,
  config.env.MASTER_DB_USER,
  config.env.MASTER_DB_PASSWORD,
  {
    logging: false,
    host: config.env.MASTER_DB_HOST,
    port: config.env.MASTER_DB_PORT,
    dialect: config.env.MASTER_DB_DIALECT,
    timezone: config.env.MASTER_DB_TIMEZONE, // for writing to database
    operatorsAliases: 0,
    pool: {
      max: 20,
      min: 0
    }
  }
))

//ORM
//rooms, teachers : one to one
db_master.lti_settings.belongsTo(db_master.tenants, { foreignKey: 'tenant_id', targetKey: 'id'});
//teachers, rooms : one to many
db_master.tenants.hasOne(db_master.lti_settings, { foreignKey: 'tenant_id', targetKey: 'id'});

export const initDBTenant = async (tenant_id) => {
  const databases = await db_master.databases.findOne({
    where : {
      tenant_id : tenant_id
    }
  })

  if(!databases){
    return false
  }


  try {
  const sequelize_db = new Sequelize(
    databases.db_name,
    databases.db_user,
    databases.db_password,
    {
      logging: false,
      host: databases.db_host,
      port: databases.db_port,
      dialect: config.env.TENANT_DB_DIALECT,
      timezone: config.env.TENANT_DB_TIMEZONE, // for writing to database
      operatorsAliases: 0,
      pool: {
        max: 20,
        min: 0
      }
    }
  )
    await sequelize_db.authenticate();
    //console.log('Connection has been established successfully.');
    const db_tenant = initModelsTenant(sequelize_db)
    //ORM
    //rooms, teachers : one to one
    db_tenant.rooms.belongsTo(db_tenant.teachers, { foreignKey: 'teacher_id', targetKey: 'id'});
    //teachers, rooms : one to many
    db_tenant.teachers.hasMany(db_tenant.rooms, { foreignKey: 'teacher_id', targetKey: 'id'});
  
    db_tenant.sequelize = sequelize_db

    // sequelize_db.beforeConnect(async (config) => {
    //   console.log('beforeConnect', tenant_id)
    // });
    // sequelize_db.afterConnect(async (config) => {
    //   console.log('afterConnect', tenant_id)
    // });
    // sequelize_db.beforeDisconnect(async (config) => {
    //   console.log('beforeDisconnect', tenant_id)
    // });
    // sequelize_db.afterDisconnect(async (config) => {
    //   console.log('afterDisconnect', tenant_id)
    // });
    return db_tenant;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
  
}

export const initAllTenantDB = async () => {
  const databases = await db_master.databases.findAll();
  let db_tenants = []
  if (databases.length > 0) {
    for (var i = 0; i < databases.length; i++) {
      db_tenants[databases[i].tenant_id] = await initDBTenant(databases[i].tenant_id);
    }
    return db_tenants;
  } else {
    return false
  }
}

export const sequelize = Sequelize
export const db_tenants = await initAllTenantDB();

const argv = require('yargs').argv;
const process = require('process')
const dotenv = require('dotenv')

const envFile = argv.env ? `.env.${argv.env.trim()}` : '.env'
dotenv.config({
 path: envFile
});

const conf = {
   master_db : {
      host: process.env.MASTER_DB_HOST,
      port: process.env.MASTER_DB_PORT,
      username: process.env.MASTER_DB_USER,
      password: process.env.MASTER_DB_PASSWORD,
      database: process.env.MASTER_DB_DBNAME,
      dialect: process.env.MASTER_DB_DIALECT,
      timezone:process.env.MASTER_DB_TIMEZONE,
   },
   tenant_db : {
      host: process.env.TENANT_DB_HOST,
      port: process.env.TENANT_DB_PORT,
      username: process.env.TENANT_DB_USER,
      password: process.env.TENANT_DB_PASSWORD,
      database: process.env.TENANT_DB_DBNAME,
      dialect: process.env.TENANT_DB_DIALECT,
      timezone:process.env.TENANT_DB_TIMEZONE,
   },
   new_tenant_db : {
      host: process.env.NEW_TENANT_DB_HOST,
      port: process.env.NEW_TENANT_DB_PORT,
      username: process.env.NEW_TENANT_DB_USER,
      password: process.env.NEW_TENANT_DB_PASSWORD,
      database: process.env.NEW_TENANT_DB_DBNAME,
      dialect: process.env.TENANT_DB_DIALECT,
      timezone:process.env.TENANT_DB_TIMEZONE,
   }
}

module.exports = conf[process.env.DB_GROUP]

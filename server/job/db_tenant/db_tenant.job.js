import {db_master} from "../../models/index.js"
import { v4 as uuid } from 'uuid';
import mysql from "mysql2/promise";
import {exec} from "child_process";

const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 

class JOB {
  onProcess = async (job, done, sectionIndex=0, percent=0, extraData={}) => {
    try {
      console.log(`onProcess Job ID ${job.id}`)
      console.log(`job data :`,job.data)

      const { db_host, db_port, db_user, db_password, db_name, tenant_db_name, tenant_id, linkage_type, storeDataLti } = job.data;
      const command = `ENV=1 DB_GROUP=new_tenant_db NEW_TENANT_DB_HOST=${db_host} NEW_TENANT_DB_PORT=${db_port} NEW_TENANT_DB_USER=${db_user} NEW_TENANT_DB_PASSWORD=${db_password} NEW_TENANT_DB_DBNAME=${tenant_db_name} npm run migration:new_tenant_db:migrate -- --env ${process.env.NODE_ENV}`;
      const conf = { host:db_host, port:db_port, user:db_user, password:db_password }

      
      job.progress(0)
      
      await db_master.databases.upsert({
        id : uuid(),
        db_host, 
        db_port, 
        db_user, 
        db_password, 
        db_name : tenant_db_name, 
        tenant_id
      })
      job.progress(33)

      const connection = await mysql.createConnection(conf);
      await connection.query(`DROP DATABASE IF EXISTS \`${tenant_db_name}\`;`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${tenant_db_name}\``);
      job.progress(66)

      exec(command, (error, stdout, stderr) => {
        if (error) {
            done(`error: ${error.message}`,null);
        }
        if (stderr) {
            done(`stderr: ${stderr}`,null);
        }
        if (stdout) {
            job.progress(100)
            console.log(`stdout: ${stdout}`)
            done(null,{
              status : true,
              message : `success create tenant`
            });
        }
      });

    } catch (err) {
      console.log(err)
      done('error',err);
    }
  }

  onActive = async (job, jobPromise) => {
    console.log(`onActive Job ID : ${job.id}`);
  }

  onWaiting = async (jobId) => {
    console.log(`onWaiting Job ID : ${jobId}`);
  }

  onError = async (error) => {
    console.log(`onError [${error}]`);
  }

  onProgress = async (job, progress) => {
    console.log(`onProgress Job ID ${job.id} [${progress}%]`)
  }

  onRemoved = async (job) => {
    console.log(`onRemove Job ID ${job.id}`)
  }

  onCompleted = async (job,result) => {
    console.log(`onComplete Job ID ${job.id}`,result)
  }

  onFailed = async (job, err) => {
    console.log(`onFailed Job ID ${job.id} [${err}]`)
  }
}
const DBTenantJob = new JOB()
export default DBTenantJob

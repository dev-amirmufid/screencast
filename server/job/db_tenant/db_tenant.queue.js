import Bull from 'bull'
import { v4 as uuidv4 } from "uuid";
import config from '../../config/config.js'
import JOB from './db_tenant.job.js';


const Queue = new Bull('create-db-tenant', {
  redis: {
      port:config.env.REDIS_PORT,
      host:config.env.REDIS_HOST,
      db:config.env.REDIS_DB_JOB,
      password:config.env.REDIS_KEY    
  },
  settings : {
      lockDuration: config.JOB_LOCK_DURATION_TIME,
      lockRenewTime: config.JOB_LOCK_RENEW_TIME,
      stalledInterval: config.JOB_STALED_CHECK_INTERVAL
  }
 })
 
 //queue process
 Queue.process(config.JOB_MAX_CONCURENCY,JOB.onProcess);
 
 //queue event
 Queue.on('active', JOB.onActive);
 Queue.on('error', JOB.onError);
 Queue.on('waiting', JOB.onWaiting);
 Queue.on('progress', JOB.onProgress);
 Queue.on('removed', JOB.onRemoved);
 Queue.on('completed', JOB.onCompleted);
 Queue.on('failed', JOB.onFailed);
 
 

 class ClassQueue {

    start = async (param, repeat=false) => {
     
        let confQueue = {
            jobId : `create-db-tenant-${param.id}`
        }    
        const job = await Queue.add(param,confQueue)
   
        return job;
    }
    
    get = async (jobId) => {
        return Queue.getJob(jobId)
    }

    getSchedulerJob = async (repeatId) => {
        const job = await Queue.getJobs()
        const foundJob = job.find(job => job.id === repeatId)
        return foundJob
    }
    
    obliterate = async () => {
     return Queue.obliterate({ force: true });
    }
    
    remove = async (repeatId) => {
        const job = await Queue.getJobs()
        const foundJob = job.find(job => job.id === repeatId)
    
        return await Queue.removeRepeatableByKey(foundopts.repeat.key);
    }
 }

 const DBTenantQueue = new ClassQueue()
 export default DBTenantQueue

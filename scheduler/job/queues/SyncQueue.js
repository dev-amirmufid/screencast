import Bull from "bull";
import SyncQueueProcess from "../process/SyncQueueProcess.js";
import moment from "moment";
import config from "../../config/config.js";
import { SYNC_STEP } from "../../constants/constans.js";

config.JOB_LOCK_DURATION_TIME = 60000;
config.JOB_LOCK_RENEW_TIME = 30000;
config.JOB_STALED_CHECK_INTERVAL = 10000;
config.JOB_MAX_CONCURENCY = 2;

const Queue = new Bull("tenant-syncronize", {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    db: process.env.REDIS_DB_JOB,
    password: process.env.REDIS_KEY,
  },
  settings: {
    lockDuration: config.JOB_LOCK_DURATION_TIME,
    lockRenewTime: config.JOB_LOCK_RENEW_TIME,
    stalledInterval: config.JOB_STALED_CHECK_INTERVAL,
  },
});

//queue event
Queue.on("active", SyncQueueProcess.onActive);
Queue.on("error", SyncQueueProcess.onError);
Queue.on("waiting", SyncQueueProcess.onWaiting);
Queue.on("progress", SyncQueueProcess.onProgress);
Queue.on("removed", SyncQueueProcess.onRemoved);
Queue.on("completed", SyncQueueProcess.onCompleted);
Queue.on("failed", SyncQueueProcess.onFailed);

//queue add function
const step = SYNC_STEP;
const recursiveJobs = async (jobData, done) => {
  if (jobData.data.step <= step.length) {
    await SyncQueueProcess.onProcess(jobData, done, async (jobData) => {
      let confQueue = {
        jobId: `SYNC_${jobData.data.tenantId}_${moment().format(
          "YYYYMMDDHHmmss"
        )}`,
        priority: config.SYNC_PRIORITY,
        attempts: 0,
        delay: 5000,
      };
      jobData.data.step = jobData.data.step + 1;
      return await Queue.add(jobData.data, confQueue);
    });
  }
};

const startSyncQueue = (req) => {
  let confQueue = {
    jobId: `SYNC_${req.tenantId}_${moment().format("YYYYMMDDHHmmss")}`,
    priority: config.SYNC_PRIORITY,
    attempts: 0,
    delay: 5000,
  };
  req.step = 0;
  req.typeJob = "syncronize";
  req.jobbackground = false;
  return Queue.add(req, confQueue);
};

const getJobQueue = (jobId) => {
  return Queue.getJob(jobId);
};

//queue process
Queue.process(config.JOB_MAX_CONCURENCY, recursiveJobs);

const removeJobQueue = async (jobId) => {
  return Queue.getJob(jobId)
    .then((job) => {
      if (job) {
        return job.remove();
      } else {
        return false;
      }
    })
    .catch(() => {
      return false;
    });
};

const cleanSyncJob = async () => {
  let milliseconds = 86400000 * config.CLEAN_JOB_STATUS_ROTATION;
  // let milliseconds = 5000
  await Queue.clean(milliseconds, "completed");
  await Queue.clean(milliseconds, "failed");
  // let milliseconds = 86400000 * config.CLEAN_JOB_STATUS_ROTATION
  // // let milliseconds = 5000
  // await Queue.clean(milliseconds, 'completed');
  // await Queue.clean(milliseconds, 'failed');

  return await Queue.obliterate({ force: true });
};

export { Queue, removeJobQueue, startSyncQueue, getJobQueue, cleanSyncJob };

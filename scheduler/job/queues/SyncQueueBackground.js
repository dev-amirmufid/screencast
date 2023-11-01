import Bull from "bull";
import SyncQueueProcess from "../process/SyncQueueProcess.js";
import moment from "moment";
import config from "../../config/config.js";
import { SYNC_STEP } from "../../constants/constans.js";

let Queue = {};
const step = SYNC_STEP;

const SyncQueueBackground = async (nameQueue, req) => {
  // moment.tz.setDefault(config.TIMEZONE);
  req.step = 0;
  if (!Queue[nameQueue]) {
    Queue[nameQueue] = new Bull(nameQueue, {
      redis: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
        db: process.env.REDIS_DB_JOB,
        password: process.env.REDIS_KEY,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      },
      settings: {
        lockDuration: config.SYNC_LOCK_DURATION_TIME, // Key expiration time for job locks.
        lockRenewTime: config.SYNC_LOCK_RENEW_TIME, // Interval on which to acquire the job lock
        stalledInterval: config.SYNC_STALED_CHECK_INTERVAL, // How often check for stalled jobs (use 0 for never checking).
      },
      // limiter : {
      //     max : config.SYNC_CRON_LIMITER,
      //     duration : config.SYNC_CRON_LIMITER_DURATION
      // }
    });

    //queue process
    Queue[nameQueue].process(config.MAX_SCHEDULER_CONCURENCY, recursiveJobs);

    //queue event
    Queue[nameQueue].on("error", SyncQueueProcess.onError);
    Queue[nameQueue].on("waiting", SyncQueueProcess.onWaiting);
    Queue[nameQueue].on("progress", SyncQueueProcess.onProgress);
    Queue[nameQueue].on("removed", SyncQueueProcess.onRemoved);
    Queue[nameQueue].on("completed", SyncQueueProcess.onCompleted);
    Queue[nameQueue].on("failed", SyncQueueProcess.onFailed);
  }
  let confQueue = {
    jobId: `SYNC_${req.tenantId}_${req.step}_${moment().format(
      "YYYYMMDDHHmmss"
    )}`,
    priority: config.SYNC_PRIORITY,
    attempts: config.SYNC_RETRY,
  };

  req.typeJob = "scheduler";
  req.jobbackground = true;
  req.nameQueue = nameQueue;
  return Queue[nameQueue].add(req, confQueue);
};

const recursiveJobs = async (jobData, done) => {
  console.log(jobData.data.step, step.length);
  if (jobData.data.step <= step.length) {
    // moment.tz.setDefault(config.TIMEZONE);
    await SyncQueueProcess.onProcess(jobData, done, async (jobData) => {
      console.log("Next QUEUE");
      jobData.data.step = jobData.data.step + 1;
      let confQueue = {
        jobId: `SYNC_${jobData.data.tenantId}_${
          jobData.data.step
        }_${moment().format("YYYYMMDDHHmmss")}`,
        priority: config.SYNC_PRIORITY,
        attempts: config.SYNC_RETRY,
        delay: 5000,
      };
      if (Queue[jobData.data.nameQueue]) {
        const x = await Queue[jobData.data.nameQueue].add(
          jobData.data,
          confQueue
        );

        console.log("Next QUEUE ADD", jobData.data.nameQueue, x?.id);
        return x;
      } else {
        console.log("NO QUEUE", jobData.data.nameQueue);
      }
    });
  }
};

const getJobQueueBackground = async (nameQueue, jobId) => {
  if (Queue[nameQueue]) {
    return Queue[nameQueue].getJob(jobId);
  } else {
    return false;
  }
};

const getJobQueueBackgroundByStatus = async (jobId) => {
  // let job = [];
  // for await (const { score, value } of redisClientJob.zScanIterator(jobId)) {
  //   job.push(value);
  // }
  // return job;
};

const IsJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const obliterateJobQueue = () => {
  if (Queue["tenant-scheduler"]) {
    return Queue["tenant-scheduler"].obliterate({ force: true });
  }
};

const cleanSyncBackgroundJob = async (nameQueue) => {
  let milliseconds = 86400000 * config.CLEAN_JOB_STATUS_ROTATION;
  // let milliseconds = 5000
  await Queue[nameQueue].clean(milliseconds, "completed");
  await Queue[nameQueue].clean(milliseconds, "failed");
};

export {
  getJobQueueBackground,
  obliterateJobQueue,
  SyncQueueBackground,
  cleanSyncBackgroundJob,
  getJobQueueBackgroundByStatus,
};

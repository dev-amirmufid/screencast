import dotenv from "dotenv";
import { genSaltSync } from "bcrypt";

const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV.trim()}`
  : ".env";

dotenv.config({
  path: envFile,
});

const PORT = process.env.PORT == "" ? "" : `:${process.env.PORT}`;
const HOST = process.env.HOST || "locahost";
const FE_URL = process.env.FE_URL || "http://locahost";

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  db_config: {
    databases: "tenants",
    req_tenant: "tenant_id",
    databases_tenant: "ID",
    tenant_field: {
      id: "id",
      use_blob_sync: "use_blob_sync",
      use_blob_tenant_name: "use_blob_tenant_name",
      blob_tenant_name: "blob_tenant_name",
      name: "name",
      blob_url: "blob_url",
      blob_key: "blob_key",
      db_name: "realcast_tenant_",
      job_id: "job_id",
      sync_status: "sync_status",
      last_sync: "last_sync",
    },
  },
  IS_PROCESS_DELTA: true,
  salt: genSaltSync(10),
  HOST: HOST,
  PORT: PORT,
  FE_URL: FE_URL,
  USE_HTTPS: process.env.USE_HTTPS || false,
  BASE_URL: `${process.env.USE_HTTPS == "true" ? "https" : "http"}://${
    process.env.HOST
  }${process.env.PORT == "" ? "" : `:${process.env.PORT}`}`,
  MAX_SCHEDULER_CONCURENCY: 60,
  MAX_SYNC_CONCURENCY: 2,
  SCHEDULER_DOWNLOAD_PRIORITY: 1,
  SCHEDULER_BLOB_ONCE_PRIORITY: 1,
  SCHEDULER_TO_BLOB_PRIORITY: 2,
  SYNC_PRIORITY: 1,
  SCHEDULER_SCHEDULE_TO_BLOB_RETRY: 3,
  SCHEDULER_BLOB_ONCE_RETRY: 0,
  SCHEDULER_DOWNLOAD_RETRY: 0,
  SYNC_RETRY: 0,
  SCHEDULER_LOCK_DURATION_TIME: 60000,
  SCHEDULER_LOCK_RENEW_TIME: 30000,
  SCHEDULER_STALED_CHECK_INTERVAL: 10000,
  SYNC_LOCK_DURATION_TIME: 60000,
  SYNC_LOCK_RENEW_TIME: 30000,
  SYNC_STALED_CHECK_INTERVAL: 10000,
  CLEAN_JOB_STATUS_ROTATION: 30, //day
  IMPORT_CSV_CHUNK: 100,
  TIMEZONE: "Asia/Tokyo",
};

for (const property in process.env) {
  config[property] = process.env[property];
}

export default config;

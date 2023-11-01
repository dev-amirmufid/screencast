import { logger } from "../logger.js";
import { db_master } from "../models/index.js";
import {
  startSyncQueue,
  getJobQueue,
  removeJobQueue,
} from "../job/queues/SyncQueue.js";
import {
  SyncQueueBackground,
  getJobQueueBackground,
} from "../job/queues/SyncQueueBackground.js";
import config from "../config/config.js";
import { decode } from "html-entities";
import { emptyAllBlobTable } from "../helpers/synchronize.js";

export const scheduler = async (req, res, next) => {
  const whrGetAllTenant = {};
  whrGetAllTenant[config.db_config.tenant_field.use_blob_sync] = 1;
  const getAllTenant = await db_master[config.db_config.databases].findAll({
    where: whrGetAllTenant,
  });

  if (!getAllTenant) {
    res.status(401).json({
      status: false,
      message: `Municipal with blob syncronize is not found`,
      error_code: "alert.text.selected_data_not_found",
    });
    return next();
  }

  let jobs = await recursiveJobs(getAllTenant, []);

  res.status(200).json(jobs);
};

const recursiveJobs = async (databaseListData, result, dbindex = 0) => {
  if (databaseListData[dbindex]) {
    const dataTenant = databaseListData[dbindex];

    let job = await SyncQueueBackground(
      `tenant-scheduler-${dataTenant[config.db_config.tenant_field.id]}`,
      {
        step: 0,
        tenantId: dataTenant[config.db_config.tenant_field.id],
        tenant_name: dataTenant[
          config.db_config.tenant_field.use_blob_tenant_name
        ]
          ? dataTenant[config.db_config.tenant_field.blob_tenant_name]
          : dataTenant[config.db_config.tenant_field.name],
        blob_url: decode(
          dataTenant[config.db_config.tenant_field.blob_url] +
            dataTenant[config.db_config.tenant_field.blob_key]
        ),
        data_tenant: dataTenant,
        dbName:
          config.db_config.tenant_field.db_name +
          dataTenant[config.db_config.tenant_field.id],
      }
    );

    if (job?.id) {
      const updTenantField = {};
      updTenantField[config.db_config.tenant_field.job_id] = job?.id;
      updTenantField[config.db_config.tenant_field.sync_status] = 1;
      const whrUpdTenantField = {};
      whrUpdTenantField[config.db_config.tenant_field.id] =
        dataTenant[config.db_config.tenant_field.id];
      await db_master[config.db_config.databases].update(updTenantField, {
        where: whrUpdTenantField,
      });
    }
    result[dbindex] = {
      job,
      data: dataTenant,
    };
    return await recursiveJobs(databaseListData, result, dbindex + 1);
  } else {
    return result;
  }
};

export const startServices = async (req, res, next) => {
  try {
    const tenantId = req.body[config.db_config.req_tenant]
      ? req.body[config.db_config.req_tenant]
      : null;

    const whrCheckTenant = {};
    whrCheckTenant[config.db_config.tenant_field.id] = tenantId;
    const checkTenant = await db_master[config.db_config.databases].findOne({
      where: whrCheckTenant,
    });

    if (!checkTenant) {
      res.status(401).json({
        status: false,
        message: `Municipal not found`,
        error_code: "alert.text.selected_data_not_found",
      });
      return next();
    }

    if (
      checkTenant &&
      !checkTenant[config.db_config.tenant_field.use_blob_sync]
    ) {
      res.status(401).json({
        status: false,
        message: `Municipal doesn't use blob syncronize`,
        error_code: "alert.text.tenant_disabled_sync",
      });
      return next();
    }

    let job;
    if (checkTenant[config.db_config.tenant_field.sync_status]) {
      job = await getJobQueue(
        checkTenant[config.db_config.tenant_field.job_id]
      );

      if (!job) {
        job = await getJobQueueBackground(
          `tenant-scheduler-${checkTenant[config.db_config.tenant_field.id]}`,
          checkTenant[config.db_config.tenant_field.job_id]
        );
      }

      res.status(200).json({ status: true, job });
      return;
    }

    if (checkTenant[config.db_config.tenant_field.job_id]) {
      let jobStatus = await getJobQueue(
        checkTenant[config.db_config.tenant_field.job_id]
      );

      if (jobStatus?.finishedOn) {
        await removeJobQueue(checkTenant[config.db_config.tenant_field.job_id]);
      }
    }

    await emptyAllBlobTable(
      checkTenant[config.db_config.tenant_field.id],
      config.db_config.tenant_field.db_name +
        checkTenant[config.db_config.tenant_field.id]
    );

    job = await startSyncQueue({
      tenantId,
      tenant_name: checkTenant[
        config.db_config.tenant_field.use_blob_tenant_name
      ]
        ? checkTenant[config.db_config.tenant_field.blob_tenant_name]
        : checkTenant[config.db_config.tenant_field.name],
      blob_url: decode(
        checkTenant[config.db_config.tenant_field.blob_url] +
          checkTenant[config.db_config.tenant_field.blob_key]
      ),
      data_tenant: checkTenant,
      dbName:
        config.db_config.tenant_field.db_name +
        checkTenant[config.db_config.tenant_field.id],
    });

    if (job?.id) {
      const updTenantField = {};
      updTenantField[config.db_config.tenant_field.job_id] = job?.id;
      updTenantField[config.db_config.tenant_field.sync_status] = 1;
      const whrUpdTenantField = {};
      whrUpdTenantField[config.db_config.tenant_field.id] = tenantId;
      await db_master[config.db_config.databases].update(updTenantField, {
        where: whrUpdTenantField,
      });
    }

    logger.info(`[tenants/sync] - ${JSON.stringify(job)}`);
    res.status(200).json({ status: true, job });
  } catch (err) {
    logger.error(
      `[tenants/sync] - ${JSON.stringify({ message: err.message })}`
    );
    res.status(500).json({ status: false, message: err.message });
  }

  return next();
};

export const getJobStatus = async (req, res, next) => {
  try {
    const tenantId = req.params?.id ? req.params?.id : null;

    const whrCheckTenant = {};
    whrCheckTenant[config.db_config.tenant_field.id] = tenantId;
    const checkTenant = await db_master[config.db_config.databases].findOne({
      where: whrCheckTenant,
    });

    if (!checkTenant) {
      res.status(401).json({
        status: false,
        message: `Municipal not found`,
        error_code: "alert.text.selected_data_not_found",
      });
      return next();
    }

    let job = await getJobQueue(
      checkTenant[config.db_config.tenant_field.job_id]
    );

    if (!job) {
      job = await getJobQueueBackground(
        `tenant-scheduler-${checkTenant[config.db_config.tenant_field.id]}`,
        checkTenant[config.db_config.tenant_field.job_id]
      );
    }

    if (!job && !checkTenant[config.db_config.tenant_field.sync_status]) {
      job = {
        returnvalue: {
          message: "SYNC FORCE STOPED",
          processedTotal: 0,
          status: true,
          syncStop: true,
          totalExecutionTimeAPI: 0,
          totalExecutionTimeInsert: 0,
        },
      };
    }

    logger.info(`[tenants/get_sync_status] - ${JSON.stringify(job)}`);
    res.status(200).json({ status: true, job });
  } catch (err) {
    logger.error(
      `[tenants/get_sync_status] - ${JSON.stringify({ message: err.message })}`
    );
    res.status(500).json({ status: false, message: err.message });
  }

  return next();
};

export const stopSync = async (req, res, next) => {
  try {
    const tenantId = req.params?.id ? req.params?.id : null;
    const updStopSyncTenant = {};
    updStopSyncTenant[config.db_config.tenant_field.sync_status] = 0;
    const whrStopSyncTenant = {};
    whrStopSyncTenant[config.db_config.tenant_field.id] = tenantId;
    await db_master[config.db_config.databases].update(updStopSyncTenant, {
      where: whrStopSyncTenant,
    });

    logger.info(`[tenants/stop_sync] - ${JSON.stringify(req?.params?.id)}`);
    res
      .status(201)
      .json({ status: true, jobId: req?.params?.id, stopLoader: false });
  } catch (err) {
    logger.error(
      `[tenants/stop_sync] - ${JSON.stringify({ message: err.message })}`
    );
    res.status(500).json({ status: false, message: err.message });
  }

  return next();
};

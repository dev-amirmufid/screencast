import {
  db_master,
  db_tenants,
  initDBTenant,
  sequelize,
} from "../models/index.js";
import config from "../config/config.js";
import {
  ACTION_UPSERT,
  ACTION_DELETE,
  DB_TYPE_MASTER,
  TABLE_BLOB_SCHOOL,
  TABLE_BLOB_TEACHER,
} from "../constants/constans.js";

const arrayChunk = (inputArray, perChunk) => {
  return inputArray?.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
};

const connectDbTenant = async (tenant_id, dbName) => {
  let db_tenant = db_tenants[dbName];
  if (!db_tenant) {
    db_tenant = await initDBTenant(tenant_id);
    if (!db_tenant) {
      console.log("failed load database or not found");

      return {
        status: false,
        message: "failed load database or not found",
      };
    }
  } else {
    console.log("success connect database");
  }

  return {
    status: true,
    db_tenant,
  };
};

const emptyAllBlobTable = async (
  tenant_id,
  dbName,
  deletedTable = [TABLE_BLOB_SCHOOL, TABLE_BLOB_TEACHER]
) => {
  const processResult = {
    status: true,
    message: "",
  };

  let connTenant = await connectDbTenant(tenant_id, dbName);
  let db_tenant;
  if (!connTenant.status) {
    processResult.status = false;
    processResult.message = connTenant.message;
    return processResult;
  } else {
    db_tenant = connTenant.db_tenant;
  }

  await Promise.all(
    deletedTable.map(async (table) => {
      await db_tenant[table]
        .destroy({ truncate: true })
        .then((item) => {
          processResult.status = true;
          processResult.message = `${table} success delete`;
          return processResult;
        })
        .catch((err) => {
          let validationError = JSON.parse(JSON.stringify(err))?.original;
          processResult.status = false;
          processResult.message = validationError;
          return processResult;
        });
    })
  );
  return processResult;
};

const executeQueryMaster = async (action, table, data, optionExecute = {}) => {
  switch (action) {
    case ACTION_UPSERT:
      return await db_master[table]
        .bulkCreate(data, optionExecute)
        .then((item) => {
          return { status: true, message: `${table} success insert` };
        })
        .catch((err) => {
          let validationError = JSON.parse(JSON.stringify(err))?.original;
          return { status: false, message: validationError.sqlMessage };
        });

    case ACTION_DELETE:
      return await db_master[table]
        .destroy({
          where: optionExecute,
        })
        .then((item) => {
          return { status: true, message: `${table} success delete` };
        })
        .catch((err) => {
          let validationError = JSON.parse(JSON.stringify(err))?.original;
          return { status: false, message: validationError.sqlMessage };
        });
  }
};

const executeQueryTenant = async (
  action,
  table,
  data,
  db_tenant,
  optionExecute = {}
) => {
  switch (action) {
    case ACTION_UPSERT:
      return await db_tenant[table]
        .bulkCreate(data, optionExecute)
        .then((item) => {
          return { status: true, message: `${table} success insert` };
        })
        .catch((err) => {
          let validationError = JSON.parse(JSON.stringify(err))?.original;
          return { status: false, message: validationError.sqlMessage };
        });

    case ACTION_DELETE:
      return await db_tenant[table]
        .destroy({
          where: optionExecute,
        })
        .then((item) => {
          return { status: true, message: `${table} success delete` };
        })
        .catch((err) => {
          let validationError = JSON.parse(JSON.stringify(err))?.original;
          console.log("error", validationError);
          return { status: false, message: validationError.sqlMessage };
        });
  }
};

const doImportTable = async (
  totalData,
  totalAllExecuteData,
  key,
  arrExecuteQuery,
  index = 0,
  percent = 0,
  totalAllProgress = 0,
  job,
  jobProgress,
  db_tenant
) => {
  if (index < key.length) {
    const data = arrExecuteQuery[key[index]];

    percent = await importToTable(
      totalData,
      totalAllExecuteData,
      totalAllProgress,
      data,
      0,
      percent,
      job,
      jobProgress,
      db_tenant
    );

    totalAllProgress += data.arr.length;

    return await doImportTable(
      totalData,
      totalAllExecuteData,
      key,
      arrExecuteQuery,
      ++index,
      percent,
      totalAllProgress,
      job,
      jobProgress,
      db_tenant
    );
  } else {
    return percent;
  }
};

const importToTable = async (
  totalData,
  totalAllExecuteData,
  totalAllProgress,
  data,
  index = 0,
  percent = 0,
  job,
  jobProgress,
  db_tenant
) => {
  let chunk = config.IMPORT_CSV_CHUNK;
  data.csvChunk = await arrayChunk(data.arr, chunk);

  let insert;
  if (data?.csvChunk) {
    if (data?.csvChunk[index]?.length > 0) {
      let dataInsert = data.csvChunk[index];
      let diff = chunk - dataInsert.length;
      let dataProgress = chunk * (index + 1) - diff;

      if (data.db === DB_TYPE_MASTER) {
        insert = await executeQueryMaster(
          data.action,
          data.table,
          dataInsert,
          data.optionExecute
        );
      } else {
        insert = await executeQueryTenant(
          data.action,
          data.table,
          dataInsert,
          db_tenant,
          data.optionExecute
        );
      }

      if (insert?.status) {
        percent = (dataProgress / totalAllExecuteData) * 100;
      }
      const dataPerProgress = totalAllExecuteData / totalData;
      let progress_row = (totalAllProgress + dataProgress) / dataPerProgress;
      if (data.progress) {
        progress_row = Math.ceil(progress_row);
        progress_row = progress_row > totalData ? totalData : progress_row;
        jobProgress.data[data.progress] = {
          total_row: totalData,
          progress_row: progress_row,
          is_calculating: false,
        };
        await job.progress(jobProgress);
      }
      return await importToTable(
        totalData,
        totalAllExecuteData,
        totalAllProgress,
        data,
        ++index,
        percent,
        job,
        jobProgress,
        db_tenant
      );
    } else {
      return percent;
    }
  } else {
    return percent;
  }
};

export {
  arrayChunk,
  connectDbTenant,
  emptyAllBlobTable,
  executeQueryMaster,
  executeQueryTenant,
  doImportTable,
  importToTable,
};

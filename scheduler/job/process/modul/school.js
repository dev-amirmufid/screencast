import moment from "moment";
import { existsSync } from "fs";
import { v4 as uuid } from "uuid";
import config from "../../../config/config.js";
import { sequelize } from "../../../models/index.js";
import { OneRosterReadCsv } from "../../../helpers/OneRosterReadCsv.js";
import {
  doImportTable,
  connectDbTenant,
  emptyAllBlobTable,
} from "../../../helpers/synchronize.js";
import {
  ACTION_UPSERT,
  ACTION_DELETE,
  ARR_ACTION_LIST,
  DB_TYPE_MASTER,
  DB_TYPE_TENANT,
  TABLE_BLOB_SCHOOL,
  TABLE_SCHOOL,
  TABLE_USER,
  TABLE_TEACHER,
} from "../../../constants/constans.js";

const executeCsvOrgs = async (
  is_delta,
  filename,
  job,
  tenantId,
  datacsv,
  db_tenant,
  tempListCsv,
  index = 0
) => {
  // job.progress(index);
  if (index < datacsv.length && tempListCsv.status) {
    const row = datacsv[index];

    if (row.sourcedId && row.name && row.type === "school") {
      //check school in table by school name
      let checkSchoolName = await db_tenant.schools.findOne({
        where: {
          name: row.name,
          tenant_id: tenantId,
        },
      });

      let checkOrgsCsv = tempListCsv.arr.findIndex(
        (val) => val.name === row.name && val.tenant_id === tenantId
      );

      if (
        checkOrgsCsv >= 0 &&
        tempListCsv.arr[checkOrgsCsv]?.sourcedId !== row.sourcedId &&
        tempListCsv.arr[checkOrgsCsv]?.action !== "DELETE" &&
        tempListCsv.arr[checkOrgsCsv]?.action !== "UPDATE" &&
        tempListCsv.arr[checkOrgsCsv]?.path === filename
      ) {
        tempListCsv.status = false;
        tempListCsv.message =
          "SCHOOL NAME " +
          row.name +
          " IS DUPLICATE FOR SCHOOL WITH SOURCED ID " +
          row.sourcedId;
      }

      if (tempListCsv.status) {
        if (!checkSchoolName) {
          checkSchoolName = await db_tenant.schools.findOne({
            where: {
              sourcedId: row.sourcedId,
            },
          });
        }

        if (!checkSchoolName) {
          checkSchoolName = await db_tenant[TABLE_BLOB_SCHOOL].findOne({
            where: {
              [sequelize.Op.or]: [
                { sourcedId: row.sourcedId },
                { name: row.name },
              ],
            },
          });
        }

        let statusAction = !checkSchoolName ? "CREATE" : "UPDATE";
        console.log(row.name, statusAction);

        const check = tempListCsv.arr.findIndex(
          (val) => val.sourcedId === row.sourcedId
        );

        if (check >= 0) {
          statusAction = "UPDATE";
        }

        if (row.status === "tobedeleted") {
          statusAction = "DELETE";
        }

        tempListCsv.arr.push({
          id: !checkSchoolName ? uuid() : checkSchoolName.id,
          tenant_id: tenantId,
          name: row.name,
          sourcedId: row.sourcedId,
          action: statusAction,
          path: filename,
          is_delta: is_delta,
        });
      }
    }

    return await executeCsvOrgs(
      is_delta,
      filename,
      job,
      tenantId,
      datacsv,
      db_tenant,
      tempListCsv,
      ++index
    );
  } else {
    return tempListCsv;
  }
};

const ProcessModulSchool = async (
  is_delta,
  job,
  masterPath,
  tenantId,
  latestListCsv = {}
) => {
  if (!job.data.orVersion) {
    job.data.orVersion = "1.1";
  }

  let schoolListCsv = {
    arr: latestListCsv.arr || [],
    status: true,
    arrExecuteQuery: null,
    message: "",
  };

  let connTenant = await connectDbTenant(job.data.tenantId, job.data.dbName);
  let db_tenant;
  if (!connTenant.status) {
    schoolListCsv.status = false;
    schoolListCsv.message = connTenant.message;
    return schoolListCsv;
  } else {
    db_tenant = connTenant.db_tenant;
  }

  const arrExecuteQuery = {
    school: {
      db: DB_TYPE_TENANT,
      table: TABLE_BLOB_SCHOOL,
      progress: null,
      action: ACTION_UPSERT,
      optionExecute: {
        updateOnDuplicate: [
          "tenant_id",
          "school_code",
          "name",
          "sourcedId",
          "action",
          "is_delta",
        ],
      },
      arr: [],
    },
  };
  if (existsSync(`${masterPath}/orgs.csv`)) {
    const getSchoolCsvAll = await OneRosterReadCsv(`${masterPath}`, "orgs");

    schoolListCsv = await executeCsvOrgs(
      is_delta,
      `${masterPath}`,
      job,
      tenantId,
      getSchoolCsvAll,
      db_tenant,
      schoolListCsv
    );
  }

  arrExecuteQuery.school.arr = schoolListCsv.arr;

  schoolListCsv.arrExecuteQuery = arrExecuteQuery;

  return schoolListCsv;
};

const ProcessQuerySchool = async (arrExecuteQuery, job) => {
  const processResult = {
    status: true,
    message: "",
  };
  let connTenant = await connectDbTenant(job.data.tenantId, job.data.dbName);
  let db_tenant;
  if (!connTenant.status) {
    processResult.status = false;
    processResult.message = connTenant.message;
    return processResult;
  } else {
    db_tenant = connTenant.db_tenant;
  }

  const totalAllExecuteData = arrExecuteQuery.school.arr.length;
  const totalExecuteData = arrExecuteQuery.school.arr.length;

  if (totalExecuteData) {
    const keyExecute = [];
    for (let key in arrExecuteQuery) {
      keyExecute.push(key);
    }
    await doImportTable(
      totalExecuteData,
      totalAllExecuteData,
      keyExecute,
      arrExecuteQuery,
      0,
      0,
      0,
      job,
      job.data.jobProgress,
      db_tenant
    );
  }

  return processResult;
};

const ProcessMasterSchool = async (job) => {
  let db_tenant = null;
  let connTenant = await connectDbTenant(job.data.tenantId, job.data.dbName);
  if (!connTenant.status) {
    returnResult.status = false;
    returnResult.message = connTenant.message;
    return returnResult;
  } else {
    db_tenant = connTenant.db_tenant;
  }

  let getDataBlobSchool = {
    status: true,
    message: "",
    arrExecuteQuery: {
      school: {
        db: DB_TYPE_TENANT,
        table: TABLE_SCHOOL,
        progress: "school",
        action: ACTION_UPSERT,
        optionExecute: {
          updateOnDuplicate: ["tenant_id", "school_code", "name", "sourcedId"],
        },
        arr: [],
      },
      del_school: {
        db: DB_TYPE_TENANT,
        table: TABLE_SCHOOL,
        progress: "school",
        action: ACTION_DELETE,
        optionExecute: {},
        arr: [],
      },
      del_teacher: {
        db: DB_TYPE_TENANT,
        table: TABLE_TEACHER,
        progress: "school",
        action: ACTION_DELETE,
        optionExecute: {},
        arr: [],
      },
      del_user: {
        db: DB_TYPE_MASTER,
        table: TABLE_USER,
        progress: "school",
        action: ACTION_DELETE,
        optionExecute: {},
        arr: [],
      },
    },
  };

  getDataBlobSchool = await ProcessGetBlobSchool(
    job,
    getDataBlobSchool,
    db_tenant
  );

  getDataBlobSchool.arrExecuteQuery.del_school.optionExecute = getDataBlobSchool
    .arrExecuteQuery.del_school.arr.length
    ? {
        id: {
          [sequelize.Op.in]: getDataBlobSchool.arrExecuteQuery.del_school.arr,
        },
      }
    : {};

  getDataBlobSchool.arrExecuteQuery.del_teacher.optionExecute =
    getDataBlobSchool.arrExecuteQuery.del_teacher.arr.length
      ? {
          school_id: {
            [sequelize.Op.in]:
              getDataBlobSchool.arrExecuteQuery.del_teacher.arr,
          },
        }
      : {};

  getDataBlobSchool.arrExecuteQuery.del_user.optionExecute = getDataBlobSchool
    .arrExecuteQuery.del_user.arr.length
    ? {
        school_id: {
          [sequelize.Op.in]: getDataBlobSchool.arrExecuteQuery.del_user.arr,
        },
      }
    : {};

  const totalAllExecuteData =
    getDataBlobSchool.arrExecuteQuery.school.arr.length +
    getDataBlobSchool.arrExecuteQuery.del_school.arr.length +
    getDataBlobSchool.arrExecuteQuery.del_teacher.arr.length +
    getDataBlobSchool.arrExecuteQuery.del_user.arr.length;

  const totalExecuteData =
    getDataBlobSchool.arrExecuteQuery.school.arr.length +
    getDataBlobSchool.arrExecuteQuery.del_school.arr.length;

  job.data.jobProgress.data["school"] = {
    total_row: totalExecuteData,
    progress_row: 0,
    is_calculating: true,
  };
  if (totalExecuteData) {
    const keyExecute = [];
    for (let key in getDataBlobSchool.arrExecuteQuery) {
      keyExecute.push(key);
    }

    console.log(getDataBlobSchool.arrExecuteQuery);
    await doImportTable(
      totalExecuteData,
      totalAllExecuteData,
      keyExecute,
      getDataBlobSchool.arrExecuteQuery,
      0,
      0,
      0,
      job,
      job.data.jobProgress,
      db_tenant
    );
  } else {
    job.data.jobProgress.data["school"] = {
      total_row: totalExecuteData,
      progress_row: totalExecuteData,
      is_calculating: false,
    };
  }
  // await emptyAllBlobTable(job.data.tenantId, job.data.dbName, [
  //   TABLE_BLOB_SCHOOL,
  // ]);
  return getDataBlobSchool;
};

const ProcessGetBlobSchool = async (
  job,
  returnResult,
  db_tenant,
  totalData = null,
  pages = 0,
  action = 0
) => {
  if (action < ARR_ACTION_LIST.length) {
    // get total data of an action
    let totalAllList = totalData;
    if (totalAllList === null) {
      totalAllList = await db_tenant[TABLE_BLOB_SCHOOL].count({
        where: {
          action: ARR_ACTION_LIST[action],
        },
      });
    }

    const getOffset = pages * config.IMPORT_CSV_CHUNK;
    if (getOffset < totalAllList) {
      const getDataSchool = await db_tenant[TABLE_BLOB_SCHOOL].findAll({
        where: {
          action: ARR_ACTION_LIST[action],
        },
        offset: getOffset,
        limit: config.IMPORT_CSV_CHUNK,
        order: [["createdAt", "ASC"]],
      });

      for (let row of getDataSchool) {
        if (ARR_ACTION_LIST[action] !== "DELETE") {
          returnResult.arrExecuteQuery.school.arr.push({
            id: row.id,
            tenant_id: row.tenant_id,
            name: row.name,
            sourcedId: row.sourcedId,
          });
        } else {
          const schData = await db_tenant[TABLE_SCHOOL].findOne({
            where: {
              id: row.id,
            },
          });

          let id = schData?.id || row?.id;
          if (id) {
            returnResult.arrExecuteQuery.del_school.arr.push(id);
            returnResult.arrExecuteQuery.del_teacher.arr.push(id);
            returnResult.arrExecuteQuery.del_user.arr.push(id);
          }
        }
      }

      return await ProcessGetBlobSchool(
        job,
        returnResult,
        db_tenant,
        totalAllList,
        ++pages,
        action
      );
    } else {
      return await ProcessGetBlobSchool(
        job,
        returnResult,
        db_tenant,
        null,
        0,
        ++action
      );
    }
  } else {
    return returnResult;
  }
};

export { ProcessModulSchool, ProcessQuerySchool, ProcessMasterSchool };

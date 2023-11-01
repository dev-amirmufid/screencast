import moment from "moment";
import { existsSync } from "fs";
import { v4 as uuid } from "uuid";
import config from "../../../config/config.js";
import { sequelize } from "../../../models/index.js";
import bcrypt from "bcrypt";
import {
  OneRosterReadCsv,
  readCsv,
} from "../../../helpers/OneRosterReadCsv.js";
import {
  doImportTable,
  connectDbTenant,
  emptyAllBlobTable,
  arrayChunk,
} from "../../../helpers/synchronize.js";
import {
  ACTION_UPSERT,
  ACTION_DELETE,
  DB_TYPE_TENANT,
  TABLE_TEACHER,
  TABLE_ROOM,
  TABLE_BLOB_TEACHER,
  MANIFEST_FIELD_OR_VERSION,
  ARR_ACTION_LIST,
} from "../../../constants/constans.js";

const executeCsvTeachers = (
  is_delta,
  filename,
  job,
  tenantId,
  datacsv,
  rolesCsv,
  or_version,
  db_tenant,
  tempListCsv,
  index = 0
) => {
  return new Promise((resolve) => {
    global.setTimeout(async () => {
      // job.progress(index);
      if (index < datacsv.length && tempListCsv.status) {
        const chunk = datacsv[index];

        for (let row of chunk) {
          console.log();
          //get teacher school sourcedId
          let teacherSchoolSourcedId = null;

          if (or_version === "1.2" && rolesCsv) {
            //get roles from csv roles
            const checkRolesIdx = rolesCsv.findIndex(
              (val) =>
                val.userSourcedId === row.sourcedId && val.role === "teacher"
            );
            if (checkRolesIdx >= 0) {
              teacherSchoolSourcedId = rolesCsv[checkRolesIdx].orgSourcedId;
              row.role = rolesCsv[checkRolesIdx].role;
            }
          } else if (row.orgSourcedIds && row.role === "teacher") {
            teacherSchoolSourcedId = row.orgSourcedIds;
          }

          if (teacherSchoolSourcedId) {
            row.teacherSchoolSourcedId = teacherSchoolSourcedId;
          }

          if (
            row.sourcedId &&
            row.username &&
            teacherSchoolSourcedId &&
            (row.givenName || row.familyName)
          ) {
            let isDeleted = false;
            if (row.status === "tobedeleted") {
              isDeleted = true;
            }

            //check school in table blob_school by orgSourcedIds
            let checkSchoolSourcedId = await db_tenant.blob_schools.findOne({
              where: { sourcedId: row.teacherSchoolSourcedId },
            });

            if (!checkSchoolSourcedId) {
              tempListCsv.status = false;
              tempListCsv.message =
                "SCHOOL IS NOT FOUND FOR USER WITH SOURCED ID " + row.sourcedId;
            } else {
              let userName = row.username;
              let email = row.email;
              if (userName.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                userName = userName.split("@")[0];
                email = row.username;
              }

              //check teacher duplicate in table teacher by teachernumber
              let checkTeacherUserid;
              if (email) {
                let checkTeacherUserid2 = await db_tenant.teachers.findAll({
                  where: {
                    [sequelize.Op.or]: [
                      {
                        username: userName,
                      },
                      {
                        [sequelize.Op.and]: {
                          email: { [sequelize.Op.neq]: null },
                          email: { [sequelize.Op.neq]: "" },
                          email: email,
                        },
                      },
                    ],
                  },
                });

                checkTeacherUserid2.map((val, index) => {
                  if (
                    !checkTeacherUserid &&
                    ((val.sourcedId &&
                      val.sourcedId != row.sourcedId &&
                      val.username === userName) ||
                      (!val.sourcedId &&
                        val.school_id != checkSchoolSourcedId.id &&
                        val.username === userName) ||
                      (email &&
                        val.email === email &&
                        val.username != userName))
                  ) {
                    checkTeacherUserid = val;
                  }
                });
                if (!checkTeacherUserid) {
                  checkTeacherUserid = checkTeacherUserid2.filter(
                    (val) => val.username === userName
                  )[0];
                }
              } else {
                checkTeacherUserid = await db_tenant.teachers.findOne({
                  where: {
                    username: userName,
                  },
                });
              }

              let checkTeacherCsv = tempListCsv.arr.findIndex(
                (val) =>
                  (val.username === userName ||
                    (email &&
                      val.email === email &&
                      val.username !== userName)) &&
                  val.action !== "DELETE"
              );

              if (
                (checkTeacherUserid &&
                  ((checkTeacherUserid?.sourcedId &&
                    checkTeacherUserid?.sourcedId != row.sourcedId &&
                    checkTeacherUserid?.username === userName) ||
                    (!checkTeacherUserid?.sourcedId &&
                      checkTeacherUserid?.school_id !=
                        checkSchoolSourcedId.id &&
                      checkTeacherUserid?.username === userName) ||
                    (email &&
                      checkTeacherUserid?.email === email &&
                      checkTeacherUserid?.username != userName))) ||
                (checkTeacherCsv >= 0 &&
                  (tempListCsv.arr[checkTeacherCsv].sourcedId !=
                    row.sourcedId ||
                    (email &&
                      tempListCsv.arr[checkTeacherCsv].email === email &&
                      tempListCsv.arr[checkTeacherCsv].username != userName)))
              ) {
                tempListCsv.status = false;

                if (
                  checkTeacherUserid?.username === userName ||
                  (checkTeacherCsv >= 0 &&
                    tempListCsv.arr[checkTeacherCsv].username === userName)
                ) {
                  tempListCsv.message =
                    'USERNAME "' +
                    userName +
                    '" IS DUPLICATE FOR USER WITH SOURCED ID ' +
                    row.sourcedId;
                }

                if (
                  email &&
                  (checkTeacherUserid?.email === email ||
                    (checkTeacherCsv >= 0 &&
                      tempListCsv.arr[checkTeacherCsv].email === email))
                ) {
                  tempListCsv.message =
                    'EMAIL "' +
                    email +
                    '" IS DUPLICATE FOR USER WITH SOURCED ID ' +
                    row.sourcedId;
                }
              } else {
                if (
                  !userName.match(/^[a-zA-Z0-9_.!*’()-]+$/) ||
                  (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
                ) {
                  tempListCsv.status = false;
                  if (!userName.match(/^[a-zA-Z0-9_.!*’()-]+$/)) {
                    tempListCsv.message =
                      'USERNAME "' +
                      userName +
                      '" IS INVALID FOR USER WITH SOURCED ID ' +
                      row.sourcedId;
                  } else if (
                    email &&
                    !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
                  ) {
                    tempListCsv.message =
                      'EMAIL "' +
                      email +
                      '" IS INVALID FOR USER WITH SOURCED ID ' +
                      row.sourcedId;
                  }
                } else {
                  if (!checkTeacherUserid) {
                    checkTeacherUserid = await db_tenant.teachers.findOne({
                      where: {
                        sourcedId: row.sourcedId,
                      },
                    });
                  }

                  if (!checkTeacherUserid) {
                    checkTeacherUserid = await db_tenant[
                      TABLE_BLOB_TEACHER
                    ].findOne({
                      where: {
                        [sequelize.Op.or]: [
                          { sourcedId: row.sourcedId },
                          {
                            [sequelize.Op.or]: [
                              {
                                username: row.username,
                              },
                              {
                                [sequelize.Op.and]: {
                                  email: { [sequelize.Op.neq]: null },
                                  email: { [sequelize.Op.neq]: "" },
                                  email: row.email,
                                },
                              },
                            ],
                          },
                        ],
                      },
                    });
                  }

                  if (!checkTeacherCsv) {
                    checkTeacherCsv = tempListCsv.arr.findIndex(
                      (val) => val.sourcedId === row.sourcedId
                    );
                  }

                  let teacher_name = row.familyName;
                  if (row.middleName) {
                    teacher_name += ` ${row.middleName}`;
                  }
                  if (row.givenName) {
                    teacher_name += ` ${row.givenName}`;
                  }

                  let teacherPass =
                    row.password ||
                    tempListCsv?.arr[checkTeacherCsv]?.password ||
                    userName;
                  if (
                    teacherPass != tempListCsv?.arr[checkTeacherCsv]?.password
                  ) {
                    teacherPass = bcrypt.hashSync(teacherPass, config.salt);
                  }
                  if (
                    checkTeacherUserid &&
                    !row.password &&
                    !tempListCsv?.arr[checkTeacherCsv]?.password
                  ) {
                    teacherPass = checkTeacherUserid?.password;
                  }

                  let DT_ACTION = !checkTeacherUserid ? "CREATE" : "UPDATE";

                  if (checkTeacherUserid && checkTeacherUserid?.ACTION) {
                    DT_ACTION = checkTeacherUserid?.ACTION;
                  }
                  if (isDeleted) {
                    DT_ACTION = "DELETE";
                  }

                  tempListCsv.arr.push({
                    id: !checkTeacherUserid ? uuid() : checkTeacherUserid?.id,
                    tenant_id: tenantId,
                    school_id: checkSchoolSourcedId.id,
                    first_name:
                      checkTeacherUserid && !teacher_name
                        ? checkTeacherUserid?.first_name
                        : teacher_name,
                    username:
                      checkTeacherUserid && !userName
                        ? checkTeacherUserid?.username
                        : userName,
                    phone_number:
                      checkTeacherUserid && !row.phone
                        ? checkTeacherUserid?.phone_number
                        : row.phone,
                    email:
                      checkTeacherUserid && !email
                        ? checkTeacherUserid?.email
                        : email,
                    password: teacherPass,
                    sourcedId: row.sourcedId,
                    action: DT_ACTION,
                    is_delta: is_delta,
                  });
                }
              }
            }
          }
        }

        resolve(
          executeCsvTeachers(
            is_delta,
            filename,
            job,
            tenantId,
            datacsv,
            rolesCsv,
            or_version,
            db_tenant,
            tempListCsv,
            ++index
          )
        );
      } else {
        resolve(tempListCsv);
      }
    }, 1000);
  });
};

const ProcessModulTeacher = async (
  is_delta,
  job,
  masterPath,
  tenantId,
  latestListCsv = {}
) => {
  if (!job.data.orVersion) {
    job.data.orVersion = "1.1";
  }

  let teacherListCsv = {
    arr: latestListCsv.arr || [],
    status: true,
    arrExecuteQuery: null,
    message: "",
  };

  let connTenant = await connectDbTenant(job.data.tenantId, job.data.dbName);
  let db_tenant;
  if (!connTenant.status) {
    teacherListCsv.status = false;
    teacherListCsv.message = connTenant.message;
    return teacherListCsv;
  } else {
    db_tenant = connTenant.db_tenant;
  }

  const arrExecuteQuery = {
    teacher: {
      db: DB_TYPE_TENANT,
      table: TABLE_BLOB_TEACHER,
      progress: null,
      action: ACTION_UPSERT,
      optionExecute: {
        updateOnDuplicate: [
          "sourcedId",
          "school_id",
          "username",
          "first_name",
          "phone_number",
          "email",
          "password",
          "action",
        ],
      },
      arr: [],
    },
  };
  if (existsSync(`${masterPath}/manifest.csv`)) {
    const getManifestData = await readCsv(
      `${masterPath}/manifest.csv`,
      { headers: true },
      (row) => row
    );

    getManifestData.map((val) => {
      if (
        val.propertyName === MANIFEST_FIELD_OR_VERSION &&
        val.value !== job.data.orVersion
      ) {
        job.data.orVersion = val.value;
      }
    });
  }

  if (
    existsSync(`${masterPath}/users.csv`) &&
    (job.data.orVersion === "1.1" ||
      (job.data.orVersion === "1.2" && existsSync(`${masterPath}/roles.csv`)))
  ) {
    let rolesCsv = null;
    if (job.data.orVersion === "1.2" && existsSync(`${masterPath}/roles.csv`)) {
      rolesCsv = await OneRosterReadCsv(`${masterPath}`, "roles");
    }
    //get enroll file
    const getTeacherCsvAll = await OneRosterReadCsv(`${masterPath}`, "users");

    const csvChunk = arrayChunk(getTeacherCsvAll, 100);

    teacherListCsv = await executeCsvTeachers(
      is_delta,
      `${masterPath}`,
      job,
      tenantId,
      csvChunk,
      rolesCsv,
      job.data.orVersion,
      db_tenant,
      teacherListCsv
    );
    console.log(getTeacherCsvAll, teacherListCsv.arr.length, "totall");
  }

  arrExecuteQuery.teacher.arr = teacherListCsv?.arr;

  teacherListCsv.arrExecuteQuery = arrExecuteQuery;

  return teacherListCsv;
};

const ProcessQueryTeacher = async (arrExecuteQuery, job) => {
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

  const totalAllExecuteData = arrExecuteQuery.teacher.arr.length;
  const totalExecuteData = arrExecuteQuery.teacher.arr.length;

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

const ProcessMasterTeacher = async (job) => {
  let db_tenant = null;
  let connTenant = await connectDbTenant(job.data.tenantId, job.data.dbName);
  if (!connTenant.status) {
    returnResult.status = false;
    returnResult.message = connTenant.message;
    return returnResult;
  } else {
    db_tenant = connTenant.db_tenant;
  }

  let getDataBlobTeacher = {
    status: true,
    message: "",
    arrExecuteQuery: {
      teacher: {
        db: DB_TYPE_TENANT,
        table: TABLE_TEACHER,
        progress: "teacher",
        action: ACTION_UPSERT,
        optionExecute: {
          updateOnDuplicate: [
            "sourcedId",
            "school_id",
            "username",
            "first_name",
            "phone_number",
            "email",
            "password",
            "action",
          ],
        },
        arr: [],
      },
      del_teacher: {
        db: DB_TYPE_TENANT,
        table: TABLE_TEACHER,
        progress: "teacher",
        action: ACTION_DELETE,
        optionExecute: {},
        arr: [],
      },
      del_room: {
        db: DB_TYPE_TENANT,
        table: TABLE_ROOM,
        progress: "teacher",
        action: ACTION_DELETE,
        optionExecute: {},
        arr: [],
      },
    },
  };

  getDataBlobTeacher = await ProcessGetBlobTeacher(
    job,
    getDataBlobTeacher,
    db_tenant
  );

  getDataBlobTeacher.arrExecuteQuery.del_teacher.optionExecute =
    getDataBlobTeacher.arrExecuteQuery.del_teacher.arr.length
      ? {
          id: {
            [sequelize.Op.in]:
              getDataBlobTeacher.arrExecuteQuery.del_teacher.arr,
          },
        }
      : {};

  getDataBlobTeacher.arrExecuteQuery.del_room.optionExecute = getDataBlobTeacher
    .arrExecuteQuery.del_room.arr.length
    ? {
        teacher_id: {
          [sequelize.Op.in]: getDataBlobTeacher.arrExecuteQuery.del_room.arr,
        },
      }
    : {};

  const totalAllExecuteData =
    getDataBlobTeacher.arrExecuteQuery.teacher.arr.length +
    getDataBlobTeacher.arrExecuteQuery.del_teacher.arr.length +
    getDataBlobTeacher.arrExecuteQuery.del_room.arr.length;
  const totalExecuteData =
    getDataBlobTeacher.arrExecuteQuery.teacher.arr.length +
    getDataBlobTeacher.arrExecuteQuery.del_teacher.arr.length;

  job.data.jobProgress.data["teacher"] = {
    total_row: totalExecuteData,
    progress_row: 0,
    is_calculating: true,
  };
  if (totalExecuteData) {
    const keyExecute = [];
    for (let key in getDataBlobTeacher.arrExecuteQuery) {
      keyExecute.push(key);
    }
    await doImportTable(
      totalExecuteData,
      totalAllExecuteData,
      keyExecute,
      getDataBlobTeacher.arrExecuteQuery,
      0,
      0,
      0,
      job,
      job.data.jobProgress,
      db_tenant
    );
  } else {
    job.data.jobProgress.data["teacher"] = {
      total_row: totalExecuteData,
      progress_row: totalExecuteData,
      is_calculating: false,
    };
  }

  // await emptyAllBlobTable(job.data.tenantId, job.data.dbName, [
  //   TABLE_BLOB_TEACHER,
  // ]);
  return getDataBlobTeacher;
};

const ProcessGetBlobTeacher = async (
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
      totalAllList = await db_tenant[TABLE_BLOB_TEACHER].count({
        where: {
          action: ARR_ACTION_LIST[action],
        },
      });
    }

    const getOffset = pages * config.IMPORT_CSV_CHUNK;
    if (getOffset < totalAllList) {
      const getDataTeacher = await db_tenant[TABLE_BLOB_TEACHER].findAll({
        where: {
          action: ARR_ACTION_LIST[action],
        },
        offset: getOffset,
        limit: config.IMPORT_CSV_CHUNK,
        order: [["createdAt", "ASC"]],
      });

      getDataTeacher.map((row) => {
        if (ARR_ACTION_LIST[action] !== "DELETE") {
          const dataTeacher = {
            id: row.id,
            tenant_id: row.tenant_id,
            school_id: row.school_id,
            first_name: row.first_name,
            username: row.username,
            phone_number: row.phone_number,
            email: row.email,
            password: row.password,
            sourcedId: row.sourcedId,
          };
          returnResult.arrExecuteQuery.teacher.arr.push(dataTeacher);
        } else {
          returnResult.arrExecuteQuery.del_teacher.arr.push(row.id);
          returnResult.arrExecuteQuery.del_room.arr.push(row.id);
        }
      });

      return await ProcessGetBlobTeacher(
        job,
        returnResult,
        db_tenant,
        totalAllList,
        ++pages,
        action
      );
    } else {
      return await ProcessGetBlobTeacher(
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

export { ProcessModulTeacher, ProcessQueryTeacher, ProcessMasterTeacher };

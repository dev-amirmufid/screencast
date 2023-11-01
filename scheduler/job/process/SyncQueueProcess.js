import { OneRosterDownload } from "../../helpers/OneRosterDownload.js";
import { OneRosterExtractZip } from "../../helpers/OneRosterExtractZip.js";
import { emptyAllBlobTable } from "../../helpers/synchronize.js";
import {
  ProcessModulSchool,
  ProcessQuerySchool,
  ProcessMasterSchool,
} from "./modul/school.js";
import {
  ProcessModulTeacher,
  ProcessQueryTeacher,
  ProcessMasterTeacher,
} from "./modul/teacher.js";
import { v4 as uuid } from "uuid";
import moment from "moment";
import { db_master } from "../../models/index.js";
import config from "../../config/config.js";
import { logger } from "../../logger.js";
import { SYNC_STEP } from "../../constants/constans.js";
import { checkValidationCSV } from "./partials/CsvValidation.js";

const PATH = "./download";

const step = SYNC_STEP;

const schedulerLog = async (job, status, message, content = "{}") => {
  const res = () => {
    if (job.data?.res?.OneRosterCsvValidationResponse?.status === true) {
      return `{ Synchronized schools : ${job.data?.res?.resultSchool?.total_data}, Synchronized teacher : ${job.data?.res?.resultTeacher?.total_data} }`;
    } else if (
      job.data?.res?.OneRosterCsvValidationResponse?.status === false
    ) {
      return `{ ${job.data?.res?.OneRosterCsvValidationResponse?.message} }`;
    } else {
      return `{}`;
    }
  };
  content = res();

  return await db_master.sync_log.create({
    id: uuid(),
    job_id: job.id,
    tenant_id: job.data.tenantId,
    type: job.data.typeJob.toUpperCase(),
    status: status.toUpperCase(),
    message: message.toUpperCase(),
    content: content,
    createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
  });
};

class OneRosterSyncronizeClass {
  onProcess = async (job, done, nextQueue) => {
    console.log(`onProcess Job ID : ${job.id}`);
    let error = false;
    const step_index = job.data.step;
    if (!job.data.res) {
      job.data.res = {};
      await schedulerLog(
        job,
        "SUCCESS",
        "START " + job.data.typeJob + " DATA FROM BLOB"
      );
    }

    if (!job.data.stepProgress) {
      job.data.stepProgress = [];
    }

    if (!job.data.percent) {
      job.data.percent = 0;
    }
    if (!job.data.jobProgress) {
      job.data.jobProgress = {
        current: step[step_index],
        message: "",
        data: {},
      };
    }
    job.progress(job.data.jobProgress);

    let processExecuteMasterSchool, processExecuteMasterTeacher;
    console.log(
      "****************************",
      step[step_index],
      "**************************"
    );
    switch (step[step_index]) {
      case "DOWNLOAD_BLOB":
        const OneRosterDownloadResponse = await OneRosterDownload(
          job.data.tenantId,
          job.data.tenant_name,
          job.data.blob_url,
          job.data.data_tenant[config.db_config.tenant_field.last_sync]
        );
        job.data.res.OneRosterDownloadResponse = OneRosterDownloadResponse;
        logger.info(
          `${job.id} - BLOB からのデータのダウンロード - ${JSON.stringify(
            job.data.res.OneRosterDownloadResponse
          )}`
        );
        error = !OneRosterDownloadResponse.status;

        job.data.jobProgress = {
          current: step[step_index],
          message: "BLOB からのデータのダウンロード",
          data: {},
        };
        job.progress(job.data.jobProgress);
        break;

      case "EXTRACT_ZIP":
        const OneRosterExtractZipResponse = await OneRosterExtractZip(
          `${PATH}/${job.data.tenantId}/${job.data.tenant_name}`,
          job.data.res.OneRosterDownloadResponse
        );
        job.data.res.OneRosterExtractZipResponse = OneRosterExtractZipResponse;
        if (
          !config.IS_PROCESS_DELTA &&
          !job.data.res.OneRosterExtractZipResponse.data.bulk?.path
        ) {
          error = true;
        }
        logger.info(
          `${job.id} - ZIP を抽出中 - ${JSON.stringify(
            job.data.res.OneRosterExtractZipResponse
          )}`
        );
        error = !OneRosterExtractZipResponse.status;

        job.data.jobProgress = {
          current: step[step_index],
          message: "ZIP を抽出中",
          data: {},
        };
        job.progress(job.data.jobProgress);
        break;

      case "CSV_VALIDATION":
        let errors = [];
        let message = "";
        if (job.data.res.OneRosterExtractZipResponse.data.bulk?.path) {
          const csvValidation = await checkValidationCSV(
            job.data.res.OneRosterExtractZipResponse.data.bulk?.path + "/"
          );

          error = csvValidation.error;
          errors = csvValidation.errors;
          message =
            job.data.res.OneRosterExtractZipResponse.data.bulk?.file_name +
            ": " +
            csvValidation.message;
        }

        if (
          job.data.res.OneRosterExtractZipResponse.data.delta?.length > 0 &&
          !error
        ) {
          for (const deltaIndex in job.data.res.OneRosterExtractZipResponse.data
            .delta) {
            const OneRosterDelta =
              job.data.res.OneRosterExtractZipResponse.data.delta[deltaIndex];
            if (OneRosterDelta.path && !error) {
              const csvValidationDelta = await checkValidationCSV(
                OneRosterDelta.path + "/"
              );

              error = csvValidationDelta.error;
              errors = csvValidationDelta.errors;
              message =
                OneRosterDelta?.file_name + ": " + csvValidationDelta.message;
            }
          }
        }

        job.data.res.OneRosterCsvValidationResponse = {
          status: !error,
          errors: errors,
          message: message,
        };
        job.data.jobProgress = {
          current: step[step_index],
          message: "CSVの検証中",
          data: {},
        };
        job.progress(job.data.jobProgress);

        break;

      case "SCHOOL":
        job.data.jobProgress = {
          current: step[step_index],
          message: "マッピング データ - 学校",
          data: {},
        };
        if (!job.data.res.resultSchool) {
          job.data.res.resultSchool = {
            status: true,
            message: "",
            total_data: 0,
          };
        }

        let processSchoolCsv = null;
        if (job.data.res.OneRosterExtractZipResponse.data.bulk?.path) {
          const masterPath =
            job.data.res.OneRosterExtractZipResponse.data.bulk.path;
          const dataSchool = await ProcessModulSchool(
            false,
            job,
            masterPath,
            job.data.tenantId
          );

          error = !dataSchool.status;

          if (dataSchool.status) {
            job.data.res.resultSchool.total_data = dataSchool.arr.length;
            processSchoolCsv = dataSchool;
          } else {
            job.data.res.resultSchool.status = dataSchool.status;
            job.data.res.resultSchool.message = dataSchool.message;
          }
        }

        if (!error && processSchoolCsv && processSchoolCsv.arrExecuteQuery) {
          const processExecuteSql = await ProcessQuerySchool(
            processSchoolCsv.arrExecuteQuery,
            job
          );

          error = !processExecuteSql.status;

          if (!processExecuteSql.status) {
            job.data.res.resultSchool.status = processExecuteSql.status;
            job.data.res.resultSchool.message = processExecuteSql.message;
          }
        }

        if (
          job.data.res.OneRosterExtractZipResponse.data.delta?.length > 0 &&
          !error
        ) {
          await Promise.all(
            job.data.res.OneRosterExtractZipResponse.data.delta.map(
              async (OneRosterDelta) => {
                if (OneRosterDelta.path && !error) {
                  const masterPathDelta = OneRosterDelta.path;
                  const dataSchoolDelta = await ProcessModulSchool(
                    true,
                    job,
                    masterPathDelta,
                    job.data.tenantId,
                    processSchoolCsv ? processSchoolCsv : []
                  );

                  error = !dataSchoolDelta.status;

                  if (dataSchoolDelta.status) {
                    job.data.res.resultSchool.total_data =
                      dataSchoolDelta.arr.length;
                    processSchoolCsv = dataSchoolDelta;
                  } else {
                    job.data.res.resultSchool.status = dataSchoolDelta.status;
                    job.data.res.resultSchool.message = dataSchoolDelta.message;
                  }

                  if (
                    !error &&
                    processSchoolCsv &&
                    processSchoolCsv.arrExecuteQuery
                  ) {
                    const processExecuteSql = await ProcessQuerySchool(
                      processSchoolCsv.arrExecuteQuery,
                      job
                    );

                    error = !processExecuteSql.status;

                    if (!processExecuteSql.status) {
                      job.data.res.resultSchool.status =
                        processExecuteSql.status;
                      job.data.res.resultSchool.message =
                        processExecuteSql.message;
                    }
                  }
                }
              }
            )
          );
        }

        if (error) {
          job.data.res.resultSchool.total_data = 0;
        }
        break;

      case "TEACHER":
        job.data.jobProgress = {
          current: step[step_index],
          message: "マッピング データ - 教師",
          data: {},
        };
        job.progress(job.data.jobProgress);
        if (!job.data.res.resultTeacher) {
          job.data.res.resultTeacher = {
            status: true,
            message: "",
            total_data: 0,
          };
        }

        let processTeacherCsv = null;

        if (job.data.res.OneRosterExtractZipResponse.data.bulk?.path) {
          const masterPath =
            job.data.res.OneRosterExtractZipResponse.data.bulk.path;
          const dataTeacher = await ProcessModulTeacher(
            false,
            job,
            masterPath,
            job.data.tenantId
          );

          error = !dataTeacher.status;

          if (dataTeacher.status) {
            job.data.res.resultTeacher.total_data = dataTeacher.arr.length;
            processTeacherCsv = dataTeacher;
          } else {
            job.data.res.resultTeacher.status = dataTeacher.status;
            job.data.res.resultTeacher.message = dataTeacher.message;
          }
        }

        if (!error && processTeacherCsv && processTeacherCsv.arrExecuteQuery) {
          const processExecuteSql = await ProcessQueryTeacher(
            processTeacherCsv.arrExecuteQuery,
            job
          );

          error = !processExecuteSql.status;

          if (!processExecuteSql.status) {
            job.data.res.resultTeacher.status = processExecuteSql.status;
            job.data.res.resultTeacher.message = processExecuteSql.message;
          }
        }

        if (
          job.data.res.OneRosterExtractZipResponse.data.delta.length > 0 &&
          !error
        ) {
          await Promise.all(
            job.data.res.OneRosterExtractZipResponse.data.delta.map(
              async (OneRosterDelta) => {
                if (OneRosterDelta.path && !error) {
                  const masterPath = OneRosterDelta.path;
                  const dataTeacher = await ProcessModulTeacher(
                    true,
                    job,
                    masterPath,
                    job.data.tenantId,
                    processTeacherCsv ? processTeacherCsv : []
                  );
                  error = !dataTeacher.status;

                  if (dataTeacher.status) {
                    job.data.res.resultTeacher.total_data =
                      dataTeacher.arr.length;
                    processTeacherCsv = dataTeacher;
                  } else {
                    job.data.res.resultTeacher.status = dataTeacher.status;
                    job.data.res.resultTeacher.message = dataTeacher.message;
                  }

                  if (
                    !error &&
                    processTeacherCsv &&
                    processTeacherCsv.arrExecuteQuery
                  ) {
                    const processExecuteSql = await ProcessQueryTeacher(
                      processTeacherCsv.arrExecuteQuery,
                      job
                    );

                    error = !processExecuteSql.status;

                    if (!processExecuteSql.status) {
                      job.data.res.resultTeacher.status =
                        processExecuteSql.status;
                      job.data.res.resultTeacher.message =
                        processExecuteSql.message;
                    }
                  }
                }
              }
            )
          );
        }

        if (error) {
          job.data.res.resultTeacher.total_data = 0;
        }
        break;

      case "EXECUTE_IMPORT":
        job.data.jobProgress = {
          current: step[step_index],
          message: "データベースへのデータのインポート",
          data: {},
        };
        job.progress(job.data.jobProgress);
        if (!job.data.res.resultExecuteQuery) {
          job.data.res.resultExecuteQuery = {
            status: true,
            message: "",
            error_module: null,
          };
        }
        // moved data from import table to master table (modul school)
        processExecuteMasterSchool = await ProcessMasterSchool(job, 0);

        error = !processExecuteMasterSchool.status;

        if (!processExecuteMasterSchool.status) {
          job.data.res.resultExecuteQuery.status =
            processExecuteMasterSchool.status;
          job.data.res.resultExecuteQuery.message =
            processExecuteMasterSchool.message;
          job.data.res.resultExecuteQuery.error_module = "school";
        }

        if (!error) {
          processExecuteMasterTeacher = await ProcessMasterTeacher(job, 0);

          error = !processExecuteMasterTeacher.status;

          if (!processExecuteMasterTeacher.status) {
            job.data.res.resultExecuteQuery.status =
              processExecuteMasterTeacher.status;
            job.data.res.resultExecuteQuery.message =
              processExecuteMasterTeacher.message;
            job.data.res.resultExecuteQuery.error_module = "teacher";
          }
        }
        break;

      case "EXECUTE_IMPORT_DELTA":
        if (job.data.res.OneRosterExtractZipResponse.data.delta.length > 0) {
          job.data.jobProgress = {
            current: step[step_index],
            message: "データベースへのデータのインポート",
            data: {},
          };
          job.progress(job.data.jobProgress);
          if (!job.data.res.resultExecuteQuery) {
            job.data.res.resultExecuteQuery = {
              status: true,
              message: "",
              error_module: null,
            };
          }
          // moved data from import table to master table (modul school)
          processExecuteMasterSchool = await ProcessMasterSchool(job, 1);

          error = !processExecuteMasterSchool.status;

          if (!processExecuteMasterSchool.status) {
            job.data.res.resultExecuteQuery.status =
              processExecuteMasterSchool.status;
            job.data.res.resultExecuteQuery.message =
              processExecuteMasterSchool.message;
            job.data.res.resultExecuteQuery.error_module = "school";
          }

          if (!error) {
            processExecuteMasterTeacher = await ProcessMasterTeacher(job, 1);

            error = !processExecuteMasterTeacher.status;

            if (!processExecuteMasterTeacher.status) {
              job.data.res.resultExecuteQuery.status =
                processExecuteMasterTeacher.status;
              job.data.res.resultExecuteQuery.message =
                processExecuteMasterTeacher.message;
              job.data.res.resultExecuteQuery.error_module = "teacher";
            }
          }
        }
        break;

      default:
        break;
    }

    if (error) {
      await emptyAllBlobTable(job.data.tenantId, job.data.dbName);
      await schedulerLog(
        job,
        "FAILED",
        "FAILED " + job.data.typeJob + " DATA FROM BLOB"
      );
      logger.info(
        `${job.id} - FAILED ${job.data.typeJob} PROCESS - ${JSON.stringify(
          job.data.res
        )}`
      );
      return done(new Error(JSON.stringify(job.data.res)), job.data.res);
    } else {
      console.log("step_index + 1 < step.length", step_index + 1, step.length);
      if (step_index + 1 < step.length) {
        console.log("nextQueue", step_index + 1, step.length);
        job.progress(job.data.jobProgress);
        const nextQueues = await nextQueue(job);

        console.log("nextQueue", nextQueues?.id);
        //update job id to municipal
        if (nextQueues?.id) {
          try {
            const updTenantField = {};
            updTenantField[config.db_config.tenant_field.job_id] =
              nextQueues?.id;
            const whrUpdTenantField = {};
            whrUpdTenantField[config.db_config.tenant_field.id] =
              job.data.tenantId;
            await db_master[config.db_config.databases].update(updTenantField, {
              where: whrUpdTenantField,
            });
          } catch (eee) {
            console.log(eee);
          }
        }
      } else {
        // await emptyAllBlobTable(job.data.tenantId, job.data.dbName);
        await schedulerLog(
          job,
          "SUCCESS",
          "FINISH " + job.data.typeJob + " DATA FROM BLOB",
          JSON.stringify(job.data.res.successData)
        );
        logger.info(
          `${job.id} - SUCCESS ${job.data.typeJob} PROCESS - ${JSON.stringify(
            job.data.res.successData
          )}`
        );

        //update last sync
        const updateTenants = {};
        updateTenants[config.db_config.tenant_field.sync_status] = 0;

        if (
          !config.IS_PROCESS_DELTA ||
          (config.IS_PROCESS_DELTA &&
            !job.data.data_tenant.last_sync &&
            (job.data.res.OneRosterDownloadResponse.data.bulk ||
              job.data.res.OneRosterDownloadResponse.data.delta.length > 0)) ||
          (job.data.data_tenant.last_sync &&
            job.data.res.OneRosterDownloadResponse.data.delta.length > 0)
        ) {
          updateTenants[config.db_config.tenant_field.last_sync] =
            moment().format("YYYY-MM-DD HH:mm:ss");
        }
        const whrupdateTenants = {};
        whrupdateTenants[config.db_config.tenant_field.id] = job.data.tenantId;
        await db_master[config.db_config.databases].update(updateTenants, {
          where: whrupdateTenants,
        });
      }
      return done(null, job.data.res);
    }
  };

  onActive = async (job, jobPromise) => {
    console.log(`onActive Job ID : ${job.id}`);
  };

  onWaiting = async (jobId) => {
    console.log(`onWaiting Job ID : ${jobId}`);
  };

  onError = async (error) => {
    console.log(`onError [${error}]`);
  };

  onProgress = async (job, progress) => {
    console.log(`onProgress Job ID ${job.id} [${progress}%]`);
  };

  onRemoved = async (job) => {
    console.log(`onRemove Job ID ${job.id}`);
  };

  onCompleted = async (job, result) => {
    console.log(`onComplete Job ID ${job.id}`, result);
  };

  onFailed = async (job, err) => {
    console.log(`onFailed Job ID ${job.id} [${err}]`);
    //update last sync
    const updateTenants = {};
    updateTenants[config.db_config.tenant_field.sync_status] = 0;

    const whrupdateTenants = {};
    whrupdateTenants[config.db_config.tenant_field.id] = job.data.tenantId;
    await db_master[config.db_config.databases].update(updateTenants, {
      where: whrupdateTenants,
    });
  };
}

const SyncQueueProcess = new OneRosterSyncronizeClass();

export default SyncQueueProcess;

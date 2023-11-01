import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  useSyncTenantsMutation,
  useStatusSyncTenantsQuery,
  useStopSyncTenantsMutation,
} from "../../../store/services/tenants";
import LoadingHoc from "../../../hocs/LoadingHoc";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavLink, useOutletContext, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RenderHTML } from "../../../helpers/utility";
import { TENANT_SYNC_NAME, POLLING } from "../../../constant/constant";
import useInterval from "../../../hooks/Polling";

const TenantManagementSync = ({ setLoading }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setTitle } = useOutletContext();

  const [isUpdateError, setIsUpdateError] = useState(false);
  const [isSync, setIsSync] = useState(true);
  const [isStop, setIsStop] = useState(false);
  const [syncTenant, resultSyncTenant] = useSyncTenantsMutation();

  const [stopSync, resultStopSyncTenant] = useStopSyncTenantsMutation();
  const { job_id } = useParams();
  const [failedReason, setFailedReason] = useState([]);
  const [tenantName, setTenantName] = useState("");
  const [progress, setProgress] = useState({});

  const syncTenantQuery = useStatusSyncTenantsQuery(job_id, {
    pollingInterval: POLLING.tenant,
  });

  //SET TITLE PAGE
  useEffect(() => {
    setTitle(t("sync.title"));
  }, []);

  useEffect(() => {
    let resultStatusSyncTenant = syncTenantQuery?.data;
    if (syncTenantQuery.status !== "pending") {
      setLoading(syncTenantQuery.isLoading);
      setIsUpdateError(syncTenantQuery.isLoading);
    }

    if (tenantName === "" || tenantName === undefined) {
      setTenantName(resultStatusSyncTenant?.job?.data.tenant_name);
    }
    const arrFailedReason = [];
    if (resultStatusSyncTenant && resultStatusSyncTenant?.job?.failedReason) {
      try {
        const jobFailedReason = JSON.parse(
          resultStatusSyncTenant?.job?.failedReason
        );

        const errorMessage = [];
        for (let key in jobFailedReason) {
          if (!jobFailedReason[key].status) {
            if (Array.isArray(jobFailedReason[key].errors)) {
              errorMessage.push(
                jobFailedReason[key].message +
                  " " +
                  jobFailedReason[key].errors.join(", ")
              );
            } else {
              errorMessage.push(jobFailedReason[key].message);
            }
          }
        }

        if (errorMessage.length) {
          arrFailedReason.push({
            status: false,
            errors: errorMessage,
          });
        }
      } catch (e) {
        arrFailedReason.push({
          status: false,
          errors: [resultStatusSyncTenant?.job?.failedReason],
        });
      }
      setFailedReason(arrFailedReason);
      setIsStop(true);
      setIsSync(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncTenantQuery?.data]);

  useEffect(() => {
    if (syncTenantQuery?.data?.job?.data?.progress == 0) {
      setProgress(syncTenantQuery?.data?.job?.data?.jobProgress);
      console.log("progress 1");
    } else if (syncTenantQuery?.data?.job?.progress) {
      setProgress(syncTenantQuery?.data?.job?.progress);
      console.log("progress 2");
    } else {
      console.log("progress 3");
    }
  }, [
    syncTenantQuery?.data?.job?.progress,
    syncTenantQuery?.data?.job?.data?.jobProgress,
  ]);

  useEffect(() => {
    console.log(progress, "progress");
  }, [progress]);

  const progressPercentage = (row) => {
    let percentage = (100 * row.progress_row) / row.total_row;
    return percentage + "%";
  };

  const handleRetry = () => {
    // dataStopSync?.stopLoader = false
    syncTenant(syncTenantQuery?.data?.job.data.data_tenant);
  };

  const handleStopSync = () => {
    console.log("asdasd");
    setIsStop(true);
    stopSync(job_id);
    setLoading(true);

    TENANT_SYNC_NAME.map((item) => {
      if (
        progress?.data[item.name] &&
        progress?.data[item.name]?.progress_row &&
        progress?.data[item.name]?.total_row
      ) {
        // resultStatusSyncTenant?.job?.progress.data[item.name]?.progress_row = 0
      }
    });
  };

  const onErrorDialogClose = () => {
    setIsUpdateError(false);
  };

  const progressData = () => {
    let res = [];
    // if (resultStatusSyncTenant?.job?.progress || resultStatusSyncTenant?.job?.progress === 0) {
    TENANT_SYNC_NAME.map((item) => {
      const progress_data = progress?.data?.[item.name]?.progress_row
        ? progress?.data[item.name]?.progress_row
        : item.progress_row;

      const total_data = progress?.data?.[item.name]?.total_row
        ? progress?.data[item.name]?.total_row
        : item.total_row;

      let percent = parseInt(progress_data / total_data) * 100;

      res.push(
        <React.Fragment key={item.name}>
          <div>
            <div className="font-bold mt-1 text-sm text-gray-600">
              {item.lable}
            </div>
          </div>
          <div className="col-span-5">
            <div className="bg-gradient-to-br from-gray-600 to-gray-800 text-center relative">
              <div
                className="bg-gradient-to-br from-cyan-300 to-cyan-800 shadow-md py-1 h-7"
                style={{
                  width: progress?.data?.[item.name]
                    ? progress?.data?.[item.name]?.progress_row !== 0 &&
                      progress?.data?.[item.name]?.total_row !== 0 &&
                      !progress?.data?.[item.name]?.is_calculating
                      ? progressPercentage(
                          progress?.data?.[item.name]
                            ? progress?.data?.[item.name]
                            : item
                        )
                      : "0%"
                    : "0%",
                }}></div>
              {syncTenantQuery?.data?.job?.returnvalue
                ?.OneRosterDownloadResponse.data.bulk === null &&
              syncTenantQuery?.data?.job?.returnvalue?.OneRosterDownloadResponse
                .data.delta.length === 0 ? (
                <></>
              ) : (
                <div className="text-gray-800 font-bold text-xs bg-gradient-to-br from-gray-200 to-gray-300 px-2 py-1 rounded-full absolute left-2/4 top-2/4 transform -translate-x-2/4 -translate-y-2/4">
                  {progress?.data?.[item.name]
                    ? progress?.data?.[item.name]?.progress_row === 0 &&
                      progress?.data?.[item.name]?.total_row === 0 &&
                      !progress?.data?.[item.name]?.is_calculating
                      ? t("admin.tenants.sync.label.no_data")
                      : progress?.data?.[item.name]?.progress_row === 0 &&
                        progress?.data?.[item.name]?.total_row === 0 &&
                        progress?.data?.[item.name]?.is_calculating
                      ? t("admin.tenants.sync.label.calculating")
                      : `${percent}%`
                    : t("admin.tenants.sync.label.calculating")}
                </div>
              )}
            </div>
          </div>
        </React.Fragment>
      );
    });

    return res;
    // }
  };

  return (
    <>
      <div className="top-1/3 w-full absolute bg-gradient-to-br flex items-center justify-center">
        <div className="w-2/3">
          <div className="bg-white border-2 border-gray-200">
            <div className="w-100 bg-gradient-to-r from-gray-800 to-gray-600 px-6 py-2">
              <div className="font-bold text-md text-white">
                {t("admin.tenants.sync.title")} {tenantName}
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 px-6 py-6">
              {!syncTenantQuery ||
              syncTenantQuery?.isLoading ||
              syncTenantQuery?.error ? (
                (syncTenantQuery?.isLoading && !isSync && (
                  <div className="col-span-6 mt-4">
                    <div className="flex justify-center my-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-teal-600 mt-2 mb-2"></div>
                    </div>
                  </div>
                )) ||
                (syncTenantQuery?.error && (
                  <RenderHTML HTML={syncTenantQuery?.message} />
                ))
              ) : (
                <>
                  {(!syncTenantQuery?.data?.job?.returnvalue ||
                    (syncTenantQuery?.data?.job?.returnvalue &&
                      Object.keys(syncTenantQuery?.data?.job?.returnvalue)
                        .length === 0)) &&
                    (syncTenantQuery?.data?.status ||
                      (!syncTenantQuery?.data &&
                        !syncTenantQuery?.data?.job?.failedReason &&
                        (!syncTenantQuery?.data?.status ||
                          !syncTenantQuery?.data?.syncStop))) && (
                      <div className="col-span-6 flex justify-between items-center mt-1 relative">
                        <div className="font-bold text-sm text-teal-600">
                          {t("admin.tenants.sync.label.process")} <br />
                          {progress?.message}
                        </div>
                        <div className="absolute top-0 right-0">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-teal-600"></div>
                        </div>
                      </div>
                    )}
                  <div className="col-span-6 relative">
                    <div className="grid grid-cols-6 gap-2">
                      {progressData()}
                    </div>

                    {(syncTenantQuery?.data?.status === false ||
                      syncTenantQuery?.data?.message ===
                        "SYNC FORCE STOPED") && (
                      <div className="absolute h-full w-full bg-gray-100 opacity-30 top-0"></div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-between items-center w-full col-span-6">
                {syncTenantQuery?.data?.status === false && (
                  <div className="mt-5 w-1/2 flex-col flex-wrap border-2 rounded border-red-500 p-2">
                    <div className="text-red-600 px-2 text-sm text-gray-600">
                      <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
                      <span className="text-xs font-bold">
                        {t("admin.tenants.sync.alert.sync_error")}:{" "}
                        {syncTenantQuery?.data?.err_type}
                      </span>

                      <p className="text-black">{`${
                        syncTenantQuery?.data?.message
                      } (${
                        syncTenantQuery?.data?.err_code ||
                        syncTenantQuery?.data?.code
                      })`}</p>
                    </div>
                  </div>
                )}
                {failedReason && failedReason.length > 0 && (
                  <div className="mt-5 w-1/2 flex-col flex-wrap border-2 rounded border-red-500 p-2">
                    <div className="text-red-600 px-2 text-sm text-gray-600">
                      <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
                      <span className="text-xs font-bold">
                        {t("admin.tenants.sync.alert.sync_error")}:{" "}
                        {failedReason.map((val) => {
                          if (!val.status) {
                            return (
                              <React.Fragment>
                                {val.message}
                                <br />
                              </React.Fragment>
                            );
                          }
                        })}
                      </span>

                      <p className="text-black">
                        {failedReason.map((val) => {
                          if (!val.status) {
                            return val.errors.map((item) => (
                              <React.Fragment>
                                {item}
                                <br />
                              </React.Fragment>
                            ));
                          }
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {syncTenantQuery?.data?.job?.returnvalue?.resultExecuteQuery
                  .status === true &&
                  !syncTenantQuery?.data?.skipDataUsers &&
                  syncTenantQuery?.data?.message !== "SYNC FORCE STOPED" && (
                    <div className="mt-5 flex-col flex-wrap border-2 rounded border-green-500 p-2">
                      <div className="text-green-600 px-2 text-sm text-green-600">
                        <FontAwesomeIcon icon="fa-solid fa-circle-check" />

                        {syncTenantQuery?.data?.job?.returnvalue
                          ?.OneRosterDownloadResponse.data.bulk === null &&
                        syncTenantQuery?.data?.job?.returnvalue
                          ?.OneRosterDownloadResponse.data.delta.length ===
                          0 ? (
                          <span className="text-xs font-bold">
                            {" "}
                            {t(
                              "admin.tenants.sync.alert.sync_completed_no_zip"
                            )}
                          </span>
                        ) : (
                          <span className="text-xs font-bold">
                            {" "}
                            {t("admin.tenants.sync.alert.sync_completed")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                {syncTenantQuery?.data?.job?.returnvalue?.resultExecuteQuery
                  ?.status === true &&
                  syncTenantQuery?.data?.skipDataUsers?.length > 0 && (
                    <div className="mt-5 w-1/2 flex-col flex-wrap border-2 rounded border-orange-500 p-2">
                      <div className="text-orange-600 px-2 text-sm text-gray-600">
                        <FontAwesomeIcon icon="fa-solid fa-triangle-exclamation" />
                        <span className="text-xs font-bold">
                          {t("admin.tenants.sync.alert.sync_completed")}
                          {syncTenantQuery?.data?.err_type}
                        </span>

                        <p className="text-orange-600">
                          <p className="text-xs font-bold">
                            {" "}
                            {t(
                              "admin.tenants.sync.alert.sync_error_skiped_data_user"
                            )}
                            :{" "}
                          </p>
                          {syncTenantQuery?.data?.skipDataUsers.map((item) => {
                            return <p>{item.login_id}</p>;
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                &nbsp;
                <div className="mt-4">
                  {/* if sync failed and user is superadmin */}
                  {(syncTenantQuery?.data?.job?.returnvalue?.resultExecuteQuery
                    ?.status === false ||
                    failedReason.length > 0) && (
                    <button
                      onClick={() => handleRetry()}
                      // className="ml-2 bg-gray-50 float-right text-sm text-gray-600 font-bold rounded border-b-2 border-teal-500 hover:border-teal-600 hover:bg-teal-500 hover:text-white shadow-md py-2 px-6 inline-flex items-center ml-2"
                      className="
                          bg-gradient-to-r from-cyan-400 to-cyan-600 shadow 
                          hover:bg-gradient-to-r hover:from-cyan-700 hover:to-cyan-600
                          shadow 
                          focus:shadow-outline 
                          focus:outline-none 
                          text-white font-bold py-2 px-4 rounded
                        ">
                      <span className="mr-2">
                        {t("admin.tenants.sync.btn.retry")}
                      </span>
                    </button>
                  )}
                  {!syncTenantQuery?.data?.job?.returnvalue?.resultExecuteQuery
                    ?.status &&
                    failedReason.length < 1 && (
                      <button
                        onClick={
                          !syncTenantQuery?.data?.syncStop
                            ? handleStopSync
                            : null
                        }
                        // className={` ${syncTenantQuery?.data?.syncStop ? "cursor-not-allowed bg-gray-200" : "bg-gray-50 border-teal-500 hover:border-teal-600 hover:bg-teal-500 hover:text-white"
                        //   } float-right text-sm text-gray-600 font-bold rounded border-b-2  shadow-md py-2 px-6 inline-flex items-center ml-2`}
                        className={`${
                          syncTenantQuery?.data?.syncStop
                            ? "cursor-not-allowed bg-gray-200"
                            : ""
                        }
                          bg-gradient-to-r from-red-400 to-red-600 shadow 
                          hover:bg-gradient-to-r hover:from-red-700 hover:to-red-600
                          shadow 
                          focus:shadow-outline 
                          focus:outline-none 
                          text-white font-bold py-2 px-4 rounded
                      `}>
                        <span className="mr-2">
                          {t("admin.tenants.sync.btn.stop")}
                        </span>
                      </button>
                    )}
                  {(syncTenantQuery?.data?.job?.returnvalue?.resultExecuteQuery
                    ?.status === true ||
                    failedReason.length > 0) && (
                    <NavLink to="/admin/tenant-management">
                      <button
                        // className="ml-2 bg-gray-50 float-right text-sm text-gray-600 font-bold rounded border-b-2 border-teal-500 hover:border-teal-600 hover:bg-teal-500 hover:text-white shadow-md py-2 px-6 inline-flex items-center ml-2"
                        className="
                          bg-gradient-to-r from-teal-400 to-teal-600 shadow 
                          hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
                          shadow 
                          focus:shadow-outline 
                          focus:outline-none 
                          text-white font-bold py-2 px-4 rounded
                          ml-2
                        ">
                        <span className="mr-2">
                          {t("admin.tenants.sync.btn.close")}
                        </span>
                      </button>
                    </NavLink>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* {isUpdateError && <ErrorDialog isError={isUpdateError} onDialogClose={onErrorDialogClose} addEdit={addEdit} />} */}
    </>
  );
};

export default LoadingHoc(TenantManagementSync);

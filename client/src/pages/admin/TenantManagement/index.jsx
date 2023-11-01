import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import moment from "moment";
import { useDispatch } from "react-redux";
import Table from "../../../components/common/Table";
// import Autocomplete from "../../../components/common/Autocomplete";
import {
  useGetTenantsQuery,
  useGetJobQuery,
  useStoreTenantsMutation,
  useUpdateTenantsMutation,
  useDeleteTenantsMutation,
  useSyncTenantsMutation,
} from "../../../store/services/tenants";
import { useGetUsersQuery } from "../../../store/services/users";
import { useGetRoomsQuery } from "../../../store/services/rooms";

import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Switch } from "@headlessui/react";
import FormModal from "../../../components/common/FormModal";
import { useFormik } from "formik";
import { TenantSchemaValidation } from "./TenantSchemaValidation";
import { TENANT_LINKAGE_TYPE_OPTION } from "../../../constant/constant";
import { showAlert, closeAlert } from "../../../store/features/alertSlice";
import LoadingHoc from "../../../hocs/LoadingHoc";
import { emptyStringToNull } from "../../../helpers/utility";
import ReactHtmlParser from "html-react-parser";
import { toast } from "react-toastify";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import { Xinput } from "../../../components/common/Forms";
import { wsSend } from "../../../store/redux/websocket/actions";

const TenantManagement = ({ setLoading }) => {
  const { setTitle } = useOutletContext();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [customeErrors, setCustomeErrors] = useState(null);

  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState([]);
  const [keyword, setKeyword] = useState("");
  // const [filterLinkage, setFilterLinkage] = useState('')
  const [job_id, setJobId] = useState("");
  const [actionType, setActionType] = useState("");
  const [tenant_id, setTenantId] = useState(null);

  const [storeTenant, resultStoreTenant] = useStoreTenantsMutation();
  const [updateTenant, resultUpdateTenant] = useUpdateTenantsMutation();
  const [deleteTenant, resultDeleteTenant] = useDeleteTenantsMutation();
  const [syncTenant, resultSyncTenant] = useSyncTenantsMutation();
  const [deleteRoomsFlag, setDeleteRoomsFlag] = useState(false);

  const tenants = useGetTenantsQuery({
    per_page: perPage,
    page,
    order,
    keyword,
    // filter_linkage: filterLinkage,
  });

  const job = useGetJobQuery(job_id ? { id: job_id } : skipToken, {
    pollingInterval: 1000,
  });

  const toastId = useRef(null);

  //console.log({resultStoreTenant})

  //SET TITLE PAGE
  useEffect(() => {
    setTitle(t("admin.tenants.title"));
  }, []);

  //ON LOADING
  useEffect(() => {
    setLoading(true);
    if (resultStoreTenant.isLoading) {
      setActionType("add");
      toastId.current = toast.info(
        t("admin.tenants.alert.onprogress_create_tenant"),
        {
          position: "bottom-left",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          hideProgressBar: false,
          closeButton: false,
          progress: 0,
        }
      );
    }
  }, [resultStoreTenant.isLoading]);
  useEffect(() => {
    setLoading(true);
    if (resultUpdateTenant.isLoading) {
      setActionType("edit");
      toastId.current = toast.info(
        t("admin.tenants.alert.onprogress_update_tenant"),
        {
          position: "bottom-left",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          hideProgressBar: false,
          progress: 0,
        }
      );
    }
  }, [resultUpdateTenant.isLoading]);
  useEffect(() => {
    setLoading(resultDeleteTenant.isLoading);
  }, [resultDeleteTenant.isLoading]);

  //ON JOB START
  useEffect(() => {
    const progress = job?.data?.job.progress || 0;
    toast.update(toastId.current, {
      progress: progress / 100,
    });
    if (job?.data?.job?.finishedOn) {
      dispatch(
        wsSend({
          type: "add_new_tenant",
          data: {
            tenant_id:
              resultStoreTenant?.data?.data?.id ||
              resultUpdateTenant?.data?.data?.id,
          },
        })
      );

      setLoading(false);
      setJobId(null);
      toast.done(toastId.current);
      toast.dismiss(toastId.current);

      if (actionType == "add") {
        toast.success(t("admin.tenants.alert.success_create_tenant"), {
          position: "bottom-left",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          draggable: true,
          progress: undefined,
        });
      }
      if (actionType == "edit") {
        toast.success(t("admin.tenants.alert.success_update_tenant"), {
          position: "bottom-left",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          draggable: true,
          progress: undefined,
        });
      }
    }
  }, [job?.data?.job]);

  //ON SUCCESS
  useEffect(() => {
    if (resultStoreTenant.isSuccess) {
      handleCloseFormModal();
      if (!resultStoreTenant?.data?.job?.id) {
        setLoading(false);
        setJobId(null);
        toast.done(toastId.current);
        toast.dismiss(toastId.current);
        toast.success(t("admin.tenants.alert.success_create_tenant"), {
          position: "bottom-left",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          draggable: true,
          progress: undefined,
        });
      }
    }
    setJobId(resultStoreTenant?.data?.job?.id);
  }, [resultStoreTenant.isSuccess]);
  useEffect(() => {
    if (resultUpdateTenant.isSuccess) {
      handleCloseFormModal();
      if (!resultUpdateTenant?.data?.job?.id) {
        setLoading(false);
        setJobId(null);
        toast.done(toastId.current);
        toast.dismiss(toastId.current);
        toast.success(t("admin.tenants.alert.success_update_tenant"), {
          position: "bottom-left",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          draggable: true,
          progress: undefined,
        });
      }
    }
    setJobId(resultUpdateTenant?.data?.job?.id);
  }, [resultUpdateTenant.isSuccess]);
  useEffect(() => {
    if (resultDeleteTenant.isSuccess) {
      console.log(resultDeleteTenant, "resultDeleteTenant");
      toast.success(t("admin.tenants.alert.success_delete_tenant"), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });

      dispatch(
        wsSend({
          type: "remove_tenant",
          data: {
            tenant_id: resultDeleteTenant?.data?.data?.id,
          },
        })
      );
    }
  }, [resultDeleteTenant.isSuccess]);

  //ON FAILED
  useEffect(() => {
    if (resultStoreTenant.isError) {
      // handle error after submit here
      if (
        resultStoreTenant?.error?.data?.error_code ==
        "alert.text.subdomain_already_use"
      )
        setCustomeErrors({
          subdomain: t("admin.tenants.validation.subdomain_already_use"),
        });

      setLoading(false);
      setJobId(null);
      toast.done(toastId.current);
      toast.dismiss(toastId.current);
    }
  }, [resultStoreTenant.isError]);
  useEffect(() => {
    if (resultUpdateTenant.isError) {
      // handle error after submit here
      if (
        resultUpdateTenant?.error?.data?.error_code ==
        "alert.text.subdomain_already_use"
      )
        setCustomeErrors({
          subdomain: t("admin.tenants.validation.subdomain_already_use"),
        });

      setLoading(false);
      setJobId(null);
      toast.done(toastId.current);
      toast.dismiss(toastId.current);
    }
  }, [resultUpdateTenant.isError]);
  useEffect(() => {
    if (resultDeleteTenant.isError) {
      setLoading(false);
      setJobId(null);
      toast.done(toastId.current);
      toast.dismiss(toastId.current);
    }
  }, [resultDeleteTenant.isError]);

  const formik = useFormik({
    initialValues: {
      id: "",
      name: "",
      linkage_type: "local",
      google_client_id: "",
      microsoft_client_id: "",
      blob_url: "",
      blob_key: "",
      blob_tenant_name: "",
      use_blob_sync: false,
      use_blob_tenant_name: true,
      limit: true,
      user_limit: "",
      subdomain: "",
      lti_setting_id: "",
      platform_name: "",
      platform_url: "",
      client_id: "",
      authentication_endpoint: "",
      accesstoken_endpoint: "",
      auth_method_type: "JWK_SET",
      auth_key: "",
    },
    validationSchema: TenantSchemaValidation,
    onSubmit: (values) => {
      values = emptyStringToNull(values);
      //console.log(values, 'values')
      values.use_blob_tenant_name = !values.use_blob_tenant_name;
      if (values?.id) {
        updateTenant(values);
      } else {
        storeTenant(values);
      }
    },
  });

  useEffect(() => {
    let tmp_ = customeErrors;
    if (tmp_) {
      tmp_.subdomain = null;
      setCustomeErrors(tmp_);
    }
  }, [formik?.errors?.subdomain, formik?.values?.subdomain]);

  const handleCloseFormModal = () => {
    setShowModal(false);
    setSelectedRow(null);
    formik.resetForm();
  };

  const handleShowFormModal = (row = null) => {
    setShowModal(true);
    setSelectedRow(row);
    if (row) {
      Object.keys(row)?.map((key) => {
        if (row[key] != null) {
          if (key == "lti_setting") {
            Object.keys(row[key])?.map((key_lti) => {
              if (row[key][key_lti]) {
                if (key_lti == "id") {
                  formik.setFieldValue(`lti_setting_id`, row[key][key_lti]);
                  setTimeout(() =>
                    formik.setFieldTouched(`lti_setting_id`, true)
                  );
                } else if (key_lti == "auth_method_type") {
                  formik.setFieldValue(`auth_method_type`, "JWK_SET");
                  setTimeout(() =>
                    formik.setFieldTouched(`auth_method_type`, true)
                  );
                } else {
                  formik.setFieldValue(`${key_lti}`, row[key][key_lti]);
                  setTimeout(() => formik.setFieldTouched(`${key_lti}`, true));
                }
              }
            });
          } else {
            if (key === "use_blob_tenant_name") {
              row[key] = !row[key];
            }
            formik.setFieldValue(`${key}`, row[key]);
            setTimeout(() => formik.setFieldTouched(`${key}`, true));
          }
        }
      });
    }
  };

  const users = useGetUsersQuery({
    tenant_id: tenant_id,
  });

  const rooms = useGetRoomsQuery(
    {
      tenant_id: tenant_id,
    },
    {
      skip: !tenant_id,
    }
  );

  useEffect(() => {
    if (deleteRoomsFlag === true && tenant_id !== null) {
      // console.log('==========', rooms)
      const data = rooms.data.data.rows;
      for (let i = 0; i < data.length; i++) {
        handleForceKick(data[i]);
      }

      setTenantId(null);
      setDeleteRoomsFlag(false);
    }
  }, [deleteRoomsFlag]);

  const handleForceKick = (data) => {
    dispatch(
      wsSend({
        type: "delete_room",
        data: {
          room_id: data.id,
          user_id: data.teacher_id,
          tenant_id: data.tenant_id,
          socket_room_id: `${data.tenant_id}:ROOM:${data.id}`,
        },
      })
    );
  };

  const onClickDelete = async (row) => {
    setTenantId(row.id);
    const filter = users.data.data.rows.filter((x) => x.role !== "superadmin");
    dispatch(
      showAlert({
        title: t("alert.name"),
        excerpt: t("alert.text.delete_tenant_confirm"),
        confirm: {
          status: true,
          labelBtnTrue: t("btn.btn_delete"),
          labelBtnfalse: t("btn.btn_cancel"),
        },
        action: {
          handleChange: () => dispatch(closeAlert()),
          onBtnTrueHandler: () => {
            deleteTenant(row);
            dispatch(closeAlert());
            for (let i = 0; i < filter.length; i++) {
              dispatch(
                wsSend({
                  type: "kick_user",
                  data: {
                    id: filter[i].id,
                  },
                })
              );
            }
            setDeleteRoomsFlag(true);
          },
        },
      })
    );
  };

  const onClickSync = (row) => {
    syncTenant(row);
    setLoading(true);
  };

  const renderTable = () => {
    const totalRows = tenants?.data?.data?.count || 0;
    const dataColumns = [
      {
        name: t("admin.tenants.label.no"),
        width: "5vw",
        center: true,
        cell: (row, index) => (page - 1) * perPage + (index + 1),
      },
      {
        name: t("admin.tenants.table.name"),
        selector: (row) => row.name,
        sortable: true,
        sortField: "name",
      },
      {
        name: t("admin.tenants.label.linkage_type"),
        selector: (row) =>
          t(`admin.tenants.label.linkage_type_${row.linkage_type}`),
        sortable: true,
        sortField: "linkage_type",
        width: "250px",
        center: true,
      },
      {
        name: t("admin.tenants.label.url"),
        cell: (row) => (
          <>
            <a
              href={import.meta.env.VITE_BASE_URL.replace("*", row.subdomain)}
              target="_blank">
              {import.meta.env.VITE_BASE_URL.replace("*", row.subdomain)}
            </a>
          </>
        ),
        sortable: true,
        sortField: "subdomain",
        center: true,
      },
      {
        name: t("admin.tenants.label.created_date"),
        selector: (row) => moment(row.createdAt).format("YYYY/MM/DD HH:mm:ss"),
        center: true,
        sortable: true,
        sortField: "createdAt",
        width: "15vw",
      },
      {
        name: t("admin.tenants.label.last_sync"),
        selector: (row) => {
          if (row.use_blob_sync && row.last_sync) {
            return moment(row.last_sync).format("YYYY/MM/DD HH:mm:ss");
          } else {
            return "-";
          }
        },
        center: true,
        sortable: true,
        sortField: "createdAt",
        width: "15vw",
      },
      {
        name: t("admin.tenants.label.sync_status"),
        selector: (row) => {
          if (row.sync_status == 1) {
            return (
              <span class="bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-yellow-300 border border-yellow-300">
                {t("admin.tenants.label.sync_status_on_process")}
              </span>
            );
          } else {
            return "-";
          }
        },
        center: true,
        sortable: false,
        sortField: "sync_status",
        width: "15vw",
      },
      {
        name: t("table.action_label"),
        center: true,
        cell: (row) => (
          <>
            <button
              className="
            bg-gradient-to-r from-white to-gray-200  
            hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300
              mx-1
              shadow 
              focus:shadow-outline 
              focus:outline-none 
              text-teal-600 font-bold py-2 px-4 rounded
            "
              type="button"
              onClick={() => {
                handleShowFormModal(row);
              }}>
              <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
            </button>
            <button
              className="
            bg-gradient-to-r from-white to-gray-200 
            hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300
              mx-1
              shadow 
              focus:shadow-outline 
              focus:outline-none 
              text-teal-600 font-bold py-2 px-4 rounded
            "
              type="button"
              onClick={() => {
                onClickDelete(row);
              }}>
              <FontAwesomeIcon icon="fa-solid fa-trash" />
            </button>
            {row.use_blob_sync && (
              <button
                className="
            bg-gradient-to-r from-white to-gray-200 
            hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300
              mx-1
              shadow 
              focus:shadow-outline 
              focus:outline-none 
              text-teal-600 font-bold py-2 px-4 rounded
            "
                type="button"
                onClick={() => {
                  onClickSync(row);
                }}>
                <FontAwesomeIcon icon="fa-solid fa-rotate" />
              </button>
            )}
          </>
        ),
        width: "200px",
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
      },
    ];
    return (
      <>
        <Table
          columns={dataColumns}
          data={tenants?.data?.data?.rows || []}
          totalRows={totalRows}
          loading={tenants?.isLoading}
          setPerPage={setPerPage}
          setPage={setPage}
          setKeyword={setKeyword}
          setOrder={setOrder}
          subHeaderComponent={filterOption}
        />
      </>
    );
  };

  const filterOption = useMemo(() => {
    return (
      <div className="flex flex-row justify-between items-end w-full">
        <button
          className="
        bg-gradient-to-r from-teal-400 to-teal-600 shadow 
          hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
          shadow 
          focus:shadow-outline 
          focus:outline-none 
          text-white font-bold py-2 px-4 rounded
        "
          type="button"
          onClick={() => handleShowFormModal(null)}>
          <FontAwesomeIcon icon="fa-solid fa-plus" />{" "}
          {t("admin.tenants.btn.add_new")}
        </button>

        {/* <div className="w-60">
          <label className="block text-sm font-medium text-gray-700">{t('admin.tenants.label.linkage_type')}</label>
          <Autocomplete data={TENANT_LINKAGE_TYPE_OPTION} defaultValue={false} placeholder={t('admin.tenants.label.linkage_type')}
            onChange={(obj) => {
              if (obj?.value)
                setFilterLinkage(obj.value)
            }} />
        </div> */}
      </div>
    );
  }, []);

  const handleTitle = () => {
    return !formik.values.id
      ? t("admin.tenants.label.add_tenant")
      : t("admin.tenants.label.edit_tenant");
  };
  const changeBlobSync = () => {
    formik.setFieldValue(`use_blob_sync`, !formik.values.use_blob_sync);
  };

  return (
    <div className="m-6">
      {renderTable()}
      <FormModal
        formik={formik}
        show={showModal}
        onClose={handleCloseFormModal}
        title={handleTitle()}>
        <input type="hidden" {...formik.getFieldProps("id")} />

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700">
            {t("admin.tenants.label.tenant_name")}{" "}
            <span className="text-red-600 ml-1">
              {t("form.label.mandatory")}
            </span>
          </label>
          <div className="mt-1">
            <input
              id="name"
              type="text"
              className={`
                  ${
                    formik.errors.name && formik.touched.name
                      ? `border-red-400`
                      : `border-gray-200`
                  }
                  border 
                  text-gray-700 
                  rounded 
                  py-2 px-2
                  focus:outline-none 
                  focus:bg-white 
                  focus:border-gray-500
                  block w-full 
                  focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                `}
              placeholder={t("placeholder.tenant_name")}
              {...formik.getFieldProps("name")}
              onChange={(e) => {
                formik.setFieldValue("name", e.target.value);
                formik.setFieldValue(
                  "blob_tenant_name",
                  formik.values.use_blob_tenant_name ? e.target.value : ""
                );
              }}
            />
          </div>
          {formik.errors.name && formik.touched.name && (
            <i className="mt-2 text-sm text-red-500">{formik.errors.name}</i>
          )}
        </div>

        <div>
          <label
            htmlFor="limit"
            className="block text-sm font-medium text-gray-700">
            {t("admin.tenants.label.limit")}
          </label>
          <div className="flex flex-row mt-1">
            <div className="mr-2">
              <input
                id="user_limit"
                type="text"
                pattern="[0-9]*"
                step={1}
                className={`
                    ${
                      formik.errors.user_limit && formik.touched.user_limit
                        ? `border-red-400`
                        : `border-gray-200`
                    }
                    border 
                    text-gray-700 
                    rounded 
                    py-2 px-2
                    focus:outline-none 
                    focus:bg-white 
                    focus:border-gray-500
                    block w-64 
                    focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                  `}
                placeholder={t("placeholder.user_limit")}
                {...formik.getFieldProps("user_limit")}
                onInput={(e) => {
                  const financialGoal = e.target.validity.valid
                    ? e.target.value
                    : formik.values.user_limit;

                  e.target.value = financialGoal;
                }}
                disabled={!formik.values.limit}
              />
            </div>

            <div className="flex items-center justify-center">
              <input
                id="limit"
                type="checkbox"
                className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                {...formik.getFieldProps("limit")}
                checked={formik.values.limit}
              />
              <label
                htmlFor="limit"
                className="ml-3 block text-sm font-medium text-gray-700">
                {t("admin.tenants.label.enable_limit")}
              </label>
            </div>
          </div>
          {formik.errors.limit && formik.touched.limit && (
            <i className="mt-2 text-sm text-red-500">{formik.errors.limit}</i>
          )}
          {formik.errors.user_limit && formik.touched.user_limit && (
            <i className="mt-2 text-sm text-red-500">
              {formik.errors.user_limit}
            </i>
          )}
        </div>

        <div>
          <label
            htmlFor="linkage_type"
            className="block text-sm font-medium text-gray-700">
            {t("admin.tenants.label.linkage_type")}
          </label>
          <div className="mt-1">
            <div className="flex flex-row">
              {TENANT_LINKAGE_TYPE_OPTION.map((linkage_type_option) => (
                <div
                  key={linkage_type_option.value}
                  className="flex items-center mr-3">
                  <input
                    id={`linkage_type-${linkage_type_option.value}`}
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                    {...formik.getFieldProps("linkage_type")}
                    onChange={(e) => {
                      if (
                        formik.values.id &&
                        selectedRow.linkage_type != e.target.value
                      ) {
                        dispatch(
                          showAlert({
                            title: t("alert.name"),
                            excerpt: ReactHtmlParser(
                              t("alert.text.change_tenant_type_confirm")
                            ),
                            confirm: {
                              status: true,
                              labelBtnTrue: t("alert.ok"),
                              labelBtnfalse: t("btn.btn_cancel"),
                            },
                            action: {
                              handleChange: () => dispatch(closeAlert()),
                              onBtnTrueHandler: () => {
                                formik.setFieldValue(
                                  `linkage_type`,
                                  e.target.value
                                );
                                dispatch(closeAlert());
                              },
                            },
                          })
                        );
                      } else {
                        formik.setFieldValue(`linkage_type`, e.target.value);
                      }
                    }}
                    value={linkage_type_option.value}
                    checked={
                      linkage_type_option.value === formik.values.linkage_type
                        ? true
                        : false
                    }
                  />
                  <label
                    htmlFor={`linkage_type-${linkage_type_option.value}`}
                    className="ml-3 block text-sm font-medium text-gray-700">
                    {linkage_type_option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          {formik.errors.linkage_type && formik.touched.linkage_type && (
            <i className="mt-2 text-sm text-red-500">
              {formik.errors.linkage_type}
            </i>
          )}
        </div>

        <div>
          <label
            htmlFor="subdomain"
            className="block text-sm font-medium text-gray-700">
            {t("admin.tenants.label.subdomain")}{" "}
            <span className="text-red-600 ml-1">
              {t("form.label.mandatory")}
            </span>
          </label>
          <div className="flex flex-row mt-1 justify-between">
            <div className="mr-2 w-3/4">
              <input
                id="subdomain"
                type="text"
                className={`
                    ${
                      formik.errors.subdomain && formik.touched.subdomain
                        ? `border-red-400`
                        : `border-gray-200`
                    }
                    border 
                    text-gray-700 
                    rounded 
                    py-2 px-2
                    focus:outline-none 
                    focus:bg-white 
                    focus:border-gray-500
                    block w-full 
                    focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                  `}
                placeholder={t("placeholder.tenant_subdomain")}
                {...formik.getFieldProps("subdomain")}
              />
            </div>
            <div className="flex items-center w-1/4">
              <label
                htmlFor="subdomainLabel"
                className="block text-sm font-medium text-gray-700">
                {import.meta.env.VITE_BASE_URL.split("*")[1]}
              </label>
            </div>
          </div>
          {formik.errors.subdomain && formik.touched.subdomain && (
            <i className="mt-2 text-sm text-red-500">
              {formik.errors.subdomain}
            </i>
          )}
          {customeErrors && customeErrors.subdomain && (
            <i className="mt-2 text-sm text-red-500">
              {customeErrors.subdomain}
            </i>
          )}
        </div>

        {formik.values.linkage_type !== "lti" ? (
          <div>
            <label
              htmlFor="use_blob_sync"
              className="block text-sm font-medium text-gray-700">
              {t("admin.tenants.label.use_blob_sync")}
            </label>
            <div className="mt-1">
              <div className="flex flex-row">
                <Switch
                  checked={formik.values.use_blob_sync}
                  onChange={changeBlobSync}
                  className={`${
                    formik.values.use_blob_sync ? "bg-blue-600" : "bg-gray-200"
                  } relative inline-flex h-6 w-11 items-center rounded-full`}>
                  <span className="sr-only">
                    {t("admin.tenants.label.use_blob_sync")}
                  </span>
                  <span
                    className={`${
                      formik.values.use_blob_sync
                        ? "translate-x-6"
                        : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                  />
                </Switch>
              </div>
            </div>
            {formik.errors.use_blob_sync && formik.touched.use_blob_sync && (
              <i className="mt-2 text-sm text-red-500">
                {formik.errors.use_blob_sync}
              </i>
            )}
          </div>
        ) : null}

        {formik.values.linkage_type !== "lti" && formik.values.use_blob_sync ? (
          <>
            <div>
              <label
                htmlFor="blob_url"
                className="block text-sm font-medium text-gray-700">
                {t("admin.tenants.label.blob_url")}
                <span className="text-red-600 ml-1">
                  {t("form.label.mandatory")}
                </span>
              </label>
              <div className="mt-1">
                <input
                  id="blob_url"
                  type="text"
                  className={`
                    ${
                      formik.errors.blob_url && formik.touched.blob_url
                        ? `border-red-400`
                        : `border-gray-200`
                    }
                    border 
                    text-gray-700 
                    rounded 
                    py-2 px-2
                    focus:outline-none 
                    focus:bg-white 
                    focus:border-gray-500
                    block w-full 
                    focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                  `}
                  placeholder={t("admin.tenants.label.blob_url")}
                  {...formik.getFieldProps("blob_url")}
                />
              </div>
              {formik.errors.blob_url && formik.touched.blob_url && (
                <i className="mt-2 text-sm text-red-500">
                  {formik.errors.blob_url}
                </i>
              )}
            </div>

            <div>
              <label
                htmlFor="blob_key"
                className="block text-sm font-medium text-gray-700">
                {t("admin.tenants.label.blob_key")}
                <span className="text-red-600 ml-1">
                  {t("form.label.mandatory")}
                </span>
              </label>
              <div className="mt-1">
                <input
                  id="blob_key"
                  type="text"
                  className={`
                    ${
                      formik.errors.blob_key && formik.touched.blob_key
                        ? `border-red-400`
                        : `border-gray-200`
                    }
                    border 
                    text-gray-700 
                    rounded 
                    py-2 px-2
                    focus:outline-none 
                    focus:bg-white 
                    focus:border-gray-500
                    block w-full 
                    focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                  `}
                  placeholder={t("admin.tenants.label.blob_key")}
                  {...formik.getFieldProps("blob_key")}
                />
              </div>
              {formik.errors.blob_key && formik.touched.blob_key && (
                <i className="mt-2 text-sm text-red-500">
                  {formik.errors.blob_key}
                </i>
              )}
            </div>

            <div>
              <label
                htmlFor="blob_tenant_name"
                className="block text-sm font-medium text-gray-700">
                {t("admin.tenants.label.blob_tenant_name")}
              </label>
              <div className="flex flex-row mt-1">
                <div className="mr-2">
                  <input
                    id="blob_tenant_name"
                    type="text"
                    className={`
                        ${
                          formik.errors.blob_tenant_name &&
                          formik.touched.blob_tenant_name
                            ? `border-red-400`
                            : `border-gray-200`
                        }
                        border 
                        text-gray-700 
                        rounded 
                        py-2 px-2
                        focus:outline-none 
                        focus:bg-white 
                        focus:border-gray-500
                        block w-64 
                        focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                      `}
                    placeholder={t(
                      "admin.tenants.placeholder.blob_tenant_name"
                    )}
                    {...formik.getFieldProps("blob_tenant_name")}
                    disabled={formik.values.use_blob_tenant_name}
                  />
                </div>

                <div className="flex items-center justify-center">
                  <input
                    id="use_blob_tenant_name"
                    type="checkbox"
                    className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                    {...formik.getFieldProps("use_blob_tenant_name")}
                    checked={formik.values.use_blob_tenant_name}
                    onChange={() => {
                      formik.setFieldValue(
                        "use_blob_tenant_name",
                        !formik.values.use_blob_tenant_name
                      );
                      formik.setFieldValue(
                        "blob_tenant_name",
                        !formik.values.use_blob_tenant_name
                          ? formik.values.name
                          : ""
                      );
                    }}
                  />
                  <label
                    htmlFor="use_blob_tenant_name"
                    className="ml-3 block text-sm font-medium text-gray-700">
                    {t("admin.tenants.label.use_blob_tenant_name")}
                  </label>
                </div>
              </div>
              {formik.errors.use_blob_tenant_name &&
                formik.touched.use_blob_tenant_name && (
                  <i className="mt-2 text-sm text-red-500">
                    {formik.errors.limit}
                  </i>
                )}
              {formik.errors.blob_tenant_name &&
                formik.touched.blob_tenant_name && (
                  <i className="mt-2 text-sm text-red-500">
                    {formik.errors.blob_tenant_name}
                  </i>
                )}
            </div>
          </>
        ) : null}

        {formik.values.linkage_type == "lti" ? (
          <>
            <input type="hidden" {...formik.getFieldProps("lti_setting_id")} />
            <Xinput
              id="platform_name"
              type="text"
              label={t("admin.tenants.label.platform_name")}
              placeholder={t("admin.tenants.placeholder.platform_name")}
              formik={formik}
            />
            <Xinput
              id="platform_url"
              type="text"
              label={t("admin.tenants.label.platform_url")}
              placeholder={t("admin.tenants.placeholder.platform_url")}
              formik={formik}
            />
            <Xinput
              id="client_id"
              type="text"
              label={t("admin.tenants.label.client_id")}
              placeholder={t("admin.tenants.placeholder.client_id")}
              formik={formik}
            />
            <Xinput
              id="authentication_endpoint"
              type="text"
              label={t("admin.tenants.label.authentication_endpoint")}
              placeholder={t(
                "admin.tenants.placeholder.authentication_endpoint"
              )}
              formik={formik}
            />
            <Xinput
              id="accesstoken_endpoint"
              type="text"
              label={t("admin.tenants.label.accesstoken_endpoint")}
              placeholder={t("admin.tenants.placeholder.accesstoken_endpoint")}
              formik={formik}
            />
            <Xinput
              id="auth_key"
              type="text"
              label={t("admin.tenants.label.auth_key")}
              placeholder={t("admin.tenants.placeholder.auth_key")}
              formik={formik}
            />
          </>
        ) : null}

        {formik.values.linkage_type === "oidc" ? (
          <>
            <div>
              <label
                htmlFor="google_client_id"
                className="block text-sm font-medium text-gray-700">
                {t("admin.tenants.label.google_client_id")}{" "}
                {(!formik?.values?.microsoft_client_id ||
                  (formik?.values?.google_client_id &&
                    formik?.values?.microsoft_client_id)) && (
                  <span className="text-red-600 ml-1">
                    {t("form.label.mandatory")}
                  </span>
                )}{" "}
              </label>
              <div className="mt-1">
                <input
                  id="google_client_id"
                  type="text"
                  className={`
                    ${
                      formik.errors.google_client_id &&
                      formik.touched.google_client_id
                        ? `border-red-400`
                        : `border-gray-200`
                    }
                    border 
                    text-gray-700 
                    rounded 
                    py-2 px-2
                    focus:outline-none 
                    focus:bg-white 
                    focus:border-gray-500
                    block w-full 
                    focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                  `}
                  placeholder={t("placeholder.google_client")}
                  {...formik.getFieldProps("google_client_id")}
                />
              </div>
              {formik.errors.google_client_id &&
                formik.touched.google_client_id && (
                  <i className="mt-2 text-sm text-red-500">
                    {formik.errors.google_client_id}
                  </i>
                )}
              <div>
                <a
                  href="https://support.google.com/workspacemigrate/answer/9222992?hl=en"
                  className="mt-2 text-sm text-blue-500"
                  target="_blank">
                  <u>{t("admin.tenants.label.create_client_id")}</u>
                </a>
              </div>
            </div>

            <div>
              <label
                htmlFor="microsoft_client_id"
                className="block text-sm font-medium text-gray-700">
                {t("admin.tenants.label.microsoft_client_id")}{" "}
                {(!formik?.values?.google_client_id ||
                  (formik?.values?.google_client_id &&
                    formik?.values?.microsoft_client_id)) && (
                  <span className="text-red-600 ml-1">
                    {t("form.label.mandatory")}
                  </span>
                )}{" "}
              </label>
              <div className="mt-1">
                <input
                  id="microsoft_client_id"
                  type="text"
                  className={`
                    ${
                      formik.errors.microsoft_client_id &&
                      formik.touched.microsoft_client_id
                        ? `border-red-400`
                        : `border-gray-200`
                    }
                    border 
                    text-gray-700 
                    rounded 
                    py-2 px-2
                    focus:outline-none 
                    focus:bg-white 
                    focus:border-gray-500
                    block w-full 
                    focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                  `}
                  placeholder={t("placeholder.microsoft_client")}
                  {...formik.getFieldProps("microsoft_client_id")}
                />
              </div>
              {formik.errors.microsoft_client_id &&
                formik.touched.microsoft_client_id && (
                  <i className="mt-2 text-sm text-red-500">
                    {formik.errors.microsoft_client_id}
                  </i>
                )}
              <div>
                <a
                  href="https://learn.microsoft.com/en-us/azure/marketplace/create-or-update-client-ids-and-secrets"
                  className="mt-2 text-sm text-blue-500"
                  target="_blank">
                  <u>{t("admin.tenants.label.create_client_id")}</u>
                </a>
              </div>
            </div>
          </>
        ) : null}
      </FormModal>
    </div>
  );
};

export default LoadingHoc(TenantManagement);

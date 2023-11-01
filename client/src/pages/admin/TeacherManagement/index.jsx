import { useEffect, useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import moment from 'moment'
import { useTranslation } from "react-i18next";
import Autocomplete from "../../../components/common/Autocomplete";

import { useGetTenantsQuery, useGetTenantByIdQuery } from "../../../store/services/tenants";
import { useExportDataMutation, useImportDataMutation } from "../../../store/services/request";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TeacherSchemaValidation, FileImportValidation } from "./TeacherSchemaValidation.jsx";
import { useFormik } from "formik";
import FormModal from "../../../components/common/FormModal";
import { emptyStringToNull } from "../../../helpers/utility";
import LoadingHoc from "../../../hocs/LoadingHoc";
import { useDispatch } from "react-redux";
import { showAlert, closeAlert } from "../../../store/features/alertSlice";
import { useAuth } from "../../../hooks/useAuth";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import { Xselect, Xinput, Xtable, Xbutton } from "../../../components/common/Forms";
import { wsSend } from "../../../store/redux/websocket/actions";
import { toast } from "react-toastify";
import ImportForm from './ImportForm'
import { useGetTeachersQuery, useStoreTeacherMutation, useUpdateTeacherMutation, useDeleteTeacherMutation } from "../../../store/services/teachers";
import { useGetSchoolsQuery } from "../../../store/services/schools";

const TeacherManagement = ({ setLoading }) => {
  const dispatch = useDispatch();
  const { setTitle } = useOutletContext()
  const { t } = useTranslation()
  const auth = useAuth();
  const [time, setTime] = useState(new Date().getTime());
  const [showModal, setShowModal] = useState(false)
  const [tenantLinkageData, setTenantLinkageData] = useState();
  const [storeDataTeacher, resultStoreDataTeacher] = useStoreTeacherMutation();
  const [updateDataTeacher, resultUpdateDataTeacher] = useUpdateTeacherMutation();
  const [deleteDataTeacher, resultDeleteDataTeacher] = useDeleteTeacherMutation();
  const [exportData, resultExportData] = useExportDataMutation();
  const [checkingImportData, resultCheckingImportData] = useImportDataMutation();
  const [importData, resultImportData] = useImportDataMutation();
  const [selectedRow, setSelectedRow] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [csvFileImport, setCsvFileImport] = useState(false)
  const navigate = useNavigate();

  const [linkage, setLinkage] = useState(null)
  const [filter, setFilter] = useState({
    per_page: 10,
    page: 1,
    order: [],
    keyword: '',
    tenant_id: auth.user.data.tenant_id,
    school_id: auth.user.data.school_id
  })

  useEffect(() => {
    setTitle(t('admin.teachers.title'))
  }, []);


  const formik = useFormik({
    initialValues: {
      id: '',
      tenant_id: '',
      school_id: '',
      email: '',
      name: '',
      username: '',
      password: '',
      password_confirm: '',
      linkage_type: ''
    },
    validationSchema: TeacherSchemaValidation,
    onSubmit: values => {
      var params = { ...values }
      if (params.id && params.password == defaultPass)
        delete params.password

      values = emptyStringToNull(params)
      var method = 'POST';
      var endpoint = 'teachers';


      if (values.id) {
        updateDataTeacher(values)
      } else {
        storeDataTeacher(values)
      }
    }
  });

  const formik_import_csv = useFormik({
    initialValues: {
      file: '',
      tenant_id: filter?.tenant_id,
    },
    validationSchema: FileImportValidation,
    onSubmit: (values, actions) => {
      let csv = document.getElementById("file").files[0];

      if (csv && (csv.type != 'text/csv') && (csv.type != 'application/vnd.ms-excel'))
        return actions.setErrors({ file: t('admin.validation.csv_only') })

      const formData = new FormData()

      formData.append('file', csv)
      formData.append('tenant_id', values.tenant_id)

      setCsvFileImport(csv)

      checkingImportData({
        endpoint: 'teachers/checking-import-csv',
        params: formData,
        time
      });
    }
  });

  const defaultPass = 'DEFAULT';

  const tenants = useGetTenantsQuery({
    no_lti: true
  });

  const tenants_selected = useGetTenantByIdQuery({
    id: formik.values.tenant_id
  }, {
    skip: formik.values.tenant_id ? false : true
  });

  const teachers = useGetTeachersQuery(filter, {
    skip: !filter.school_id
  });

  const school = useGetSchoolsQuery({
    tenant_id: formik.values.tenant_id
  }, {
    skip: !formik.values.tenant_id
  });

  const schoolFilter = useGetSchoolsQuery({
    tenant_id: filter.tenant_id
  }, {
    skip: auth.user.data.school_id || !filter.tenant_id
  });

  const handleExportFile = async () => {
    if (filter.school_id && filter.tenant_id) {
      exportData({
        endpoint: 'teachers/export',
        params: filter,
        time
      }, {
        skip: !filter.school_id
      });
    } else if (!filter.school_id && !filter.tenant_id) {
      toast.error(t('admin.teachers.validation.tenant_id_and_school_id_required'), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      })
    } else if (!filter.tenant_id) {
      toast.error(t('admin.teachers.validation.filter_tenant_id_required'), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      })
    } else if (!filter.school_id) {
      toast.error(t('admin.teachers.validation.filter_school_id_required'), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  useEffect(() => {
    setLoading(resultExportData?.isLoading || resultCheckingImportData?.isLoading)
  }, [resultExportData?.isLoading, resultCheckingImportData?.isLoading])

  useEffect(() => {
    if (resultCheckingImportData?.isSuccess == true) {
      formik_import_csv.resetForm()
      setShowUploadModal(false)
      navigate('/admin/teacher-import', { state: { csv_file: csvFileImport, payload: resultCheckingImportData?.data?.data } })
    }
  }, [resultCheckingImportData?.isSuccess])

  useEffect(() => {
    if (!tenantLinkageData && auth.user.data.role != 'superadmin') {
      if (tenants_selected.isSuccess) {
        formik.setFieldValue('linkage_type', tenants_selected.isSuccess ? tenants_selected.data.data.linkage_type : '')
        setTenantLinkageData(tenants_selected.isSucces ? tenants_selected.data.data.linkage_type : '')
      }
      if (auth.user.data.role != 'superadmin') {
        formik.setFieldValue('tenant_id', auth.user.data.tenant_id)
        formik.setFieldValue('school_id', auth.user.data.school_id)
      }
    }
  }, [tenants_selected.status, auth]);

  const handleCloseFormModal = () => {
    setShowModal(false)
    formik.resetForm()
    if (auth.user.data.role != 'superadmin') {
      formik.setFieldValue('tenant_id', auth.user.data.tenant_id)
      formik.setFieldValue('school_id', auth.user.data.school_id)
      formik.setFieldValue('linkage_type', tenants_selected.isSuccess ? tenants_selected.data.data.linkage_type : '')
    }
  }

  const onClickDelete = (row) => {
    dispatch(showAlert({
      title: t('alert.name'),
      excerpt: t('admin.teachers.label.confirm_delete'),
      confirm: {
        status: true,
        labelBtnTrue: t('btn.btn_delete'),
        labelBtnfalse: t('btn.btn_cancel'),
      },
      action: {
        handleChange: () => dispatch(closeAlert()),
        onBtnTrueHandler: () => {
          deleteDataTeacher(row)
          dispatch(closeAlert())
          dispatch(wsSend({
            type: "kick_teacher",
            data: {
              user_id: row.id,
              tenant_id: row.tenant_id
            }
          }))
        }
      }
    }))
  }

  const handleShowFormModal = (row = null) => {
    setShowModal(true)
    setSelectedRow(row);

    if (row) {
      Object.keys(row)?.map((key) => {
        if (row[key] != null) {
          formik.setFieldValue(`${(key == 'first_name') ? 'name' : key}`, row[key])

          setTimeout(() => formik.setFieldTouched(`${key}`, true))
        }
        if (key === "tenant_id" && auth.user.data.role == 'superadmin') {
          const idxSelectedTenant = tenants?.data?.data?.rows.findIndex(val => val.id === row['tenant_id']);
          formik.setFieldValue('linkage_type', idxSelectedTenant >= 0 ? tenants?.data?.data?.rows[idxSelectedTenant].linkage_type : '')
        }
        formik.setFieldValue('password', defaultPass)
        formik.setFieldValue('password_confirm', defaultPass)
      });
    }
  }

  useEffect(() => {
    if (showSchool && selectedRow != null) {
      formik.setFieldValue('school_id', selectedRow.school_id)
    }
  }, [selectedRow])

  const fiterTenant = () => {
    if (auth.user.data.tenant_id) {
      return <></>;
    } else {
      return (<div className="w-60">
        <label className="block text-sm font-medium text-gray-700"></label>
        <Autocomplete placeholder={t('placeholder.select_tenant')} label={t('admin.tenants.label.name')} data={tenants?.data?.data?.rows} defaultValue={false}
          onChange={(obj) => {
            if (obj?.id)
              setFilter((oldObject) => ({ ...oldObject, tenant_id: obj.id, school_id: null }))
          }} />
      </div>)
    }
  }

  const filterOption = useMemo(() => {

    if (showUploadModal == true)
      return <ImportForm
        handleCloseForm={() => {
          setShowUploadModal(false)
        }}
        onImporCsvChecked={(result) => navigate('/admin/teacher-import', { state: { csv_file: result.csv_file, payload: result?.data?.data, tenant_id: result.tenant_id } })} />

    return (
      <div className="flex flex-row justify-between items-end w-full">
        <div className="flex flex-row justify-between items-end">
          <div className="mr-2">
            <Xbutton onClick={() => handleShowFormModal(null)} >
              <FontAwesomeIcon icon="fa-solid fa-plus" /> {t('admin.tenants.btn.add_new')}
            </Xbutton>
          </div>
          <div className="mr-2">
            <Xbutton onClick={() => handleExportFile()}>
              <FontAwesomeIcon icon="fa-solid fa-download" className="mr-3" /> {t('btn.btn_export_csv')}
            </Xbutton>
          </div>
          <div className="mr-2">
            <Xbutton onClick={() => navigate('/admin/teacher-import')}>
              <FontAwesomeIcon icon="fa-solid fa-upload" className="mr-3" /> {t('btn.btn_import_csv')}
            </Xbutton>
          </div>
        </div>
        <div className="flex flex-row space-x-2">
          {fiterTenant()}
          {(!auth.user.data.school_id) &&
            <div className="w-60">
              <label className="block text-sm font-medium text-gray-700">{t('admin.teachers.label.school')}</label>
              <Autocomplete data={schoolFilter?.data?.data?.rows} defaultValue={false} placeholder={t('placeholder.select_school')}
                onChange={(obj) => {
                  if (obj?.id)
                    setFilter((oldObject) => ({ ...oldObject, school_id: obj.id }))
                }}
              />
            </div>
          }
        </div>
      </div>
    )
  }, [tenants, schoolFilter, showUploadModal, filter?.tenant_id, filter?.school_id])

  useEffect(() => {
    if (resultStoreDataTeacher.isSuccess || resultDeleteDataTeacher.isSuccess || resultUpdateDataTeacher.isSuccess) {
      setTime(new Date().getTime())
      handleCloseFormModal();
    }
  }, [resultStoreDataTeacher.isSuccess, resultDeleteDataTeacher.isSuccess, resultUpdateDataTeacher.isSuccess]);

  const [showSchool, setShowSchool] = useState(false);

  useEffect(() => {
    if (formik.values.tenant_id != '') {
      setShowSchool(true)
    } else {
      setShowSchool(false)
    }
  }, [formik.values.tenant_id])

  const renderTable = () => {
    const totalRows = teachers?.data?.data?.count || 0
    const dataColumns = [
      {
        name: t('admin.teachers.label.no'),
        width: "5vw",
        center: true,
        cell: (row, index) => ((filter.page - 1) * filter.per_page) + (index + 1)
      },
      {
        name: t('admin.teachers.label.name'),
        selector: row => row.first_name,
        sortable: true,
        sortField: 'first_name'
      },
      {
        name: t('admin.teachers.label.userid'),
        selector: row => row.username,
        sortable: true,
        sortField: 'username'
      },
      {
        name: t('admin.teachers.label.email'),
        selector: row => row.email,
        sortable: true,
        sortField: 'email'
      },
      {
        name: t('admin.teachers.label.created_date'),
        selector: row => moment(row.createdAt).format('YYYY/MM/DD hh:mm:ss'),
        center: true,
        sortable: true,
        sortField: 'createdAt',
        width: "15vw",
      },
      {
        name: t('table.action_label'),
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
              onClick={() => { handleShowFormModal(row) }}
            >
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
              onClick={() => { onClickDelete(row) }}
            >
              <FontAwesomeIcon icon="fa-solid fa-trash" />
            </button>
          </>
        ),
        width: "150px",
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
      },
    ];
    return <Xtable
      columns={dataColumns}
      data={teachers?.data?.data?.rows || []}
      totalRows={totalRows}
      loading={teachers?.isLoading}
      setFilter={setFilter}
      subHeaderComponent={filterOption}
    />
  }

  const handleTitle = () => {
    return (!selectedRow) ? t('admin.teachers.label.add_teacher') : t('admin.teachers.label.edit_teacher')
  }

  return (
    <div className="m-6">
      {renderTable()}
      <FormModal
        formik={formik}
        show={showModal}
        onClose={handleCloseFormModal}
        title={handleTitle()}
      >
        <input type="hidden"
          {...formik.getFieldProps('id')}
        />
        <input type="hidden"
          {...formik.getFieldProps('linkage_type')}
        />
        <div className={`${auth.user.data.role != 'superadmin' ? `hidden` : ''}`}>
          <Xselect
            id='tenant_id'
            data={tenants?.data?.data?.rows}
            label={(<>{t('admin.teachers.label.tenant')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)}
            placeholder={t('placeholder.select_tenant')}
            formik={formik}
            disabled={(formik.values.id) ? true : false}
            defaultValue={false}
            onChange={(e) => {
              formik.setFieldValue('tenant_id', (e) ? e.id : '')
              formik.setFieldValue('linkage_type', (e) ? e.linkage_type : '')
              formik.setTouched({
                ...formik.touched,
                'tenant_id': false
              }, true)
            }}
          />
        </div>
        <div className={`${auth.user.data.school_id ? `hidden` : ''}`}>
          <Xselect
            id='school_id'
            data={school?.data?.data?.rows}
            label={(<>{t('admin.teachers.label.school')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)}
            placeholder={t('placeholder.select_school')}
            disabled={(formik.values.id) ? true : false}
            formik={formik}
            defaultValue={false}
            onChange={(e) => {
              formik.setFieldValue('school_id', (e) ? e.id : '')
            }}
          />
        </div>
        <Xinput id="name" label={(<>{t('admin.teachers.label.name')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)} placeholder={t('placeholder.teacher_name')} formik={formik} />
        <Xinput className={`${formik.values.linkage_type != 'local' ? 'hidden' : ''}`} id="username" label={(<>{t('admin.teachers.label.userid')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)} placeholder={t('placeholder.username')} formik={formik} />
        <Xinput id="email" type='email' label={(<>{t('admin.teachers.label.email')} {formik.values.linkage_type != 'local' ? (<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span>) : null}</>)} placeholder={t('placeholder.email')} formik={formik} />
        <Xinput className={`${formik.values.linkage_type != 'local' ? 'hidden' : ''}`} id="password" type='password' label={(<>{t('admin.teachers.label.password')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)} placeholder={t('placeholder.password')} formik={formik} />
        <Xinput className={`${formik.values.linkage_type != 'local' ? 'hidden' : ''}`} id="password_confirm" type='password' label={(<>{t('admin.teachers.label.password_confirm')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)} placeholder={t('placeholder.password_confirm')} formik={formik} />

      </FormModal>

    </div>
  );
}

export default LoadingHoc(TeacherManagement);

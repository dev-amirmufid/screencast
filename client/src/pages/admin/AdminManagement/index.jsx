import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import moment from 'moment'
import { useTranslation } from "react-i18next";

import Table from "../../../components/common/Table";
import Autocomplete from "../../../components/common/Autocomplete";

import { useGetTenantsQuery } from "../../../store/services/tenants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AdminSchemaValidation } from "./AdminSchemaValidation.jsx";
import { useFormik } from "formik";
import FormModal from "../../../components/common/FormModal";
import { emptyStringToNull } from "../../../helpers/utility";
import LoadingHoc from "../../../hocs/LoadingHoc";
import { useDispatch } from "react-redux";
import { showAlert, closeAlert } from "../../../store/features/alertSlice";
import { useAuth } from "../../../hooks/useAuth";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import { Xselect } from "../../../components/common/Forms";
import { wsSend } from "../../../store/redux/websocket/actions";
import { useGetUsersQuery, useStoreUsersMutation, useDeleteUsersMutation, useUpdateUsersMutation } from "../../../store/services/users";
import { useGetSchoolsQuery } from "../../../store/services/schools";


const AdminManagement = ({ setLoading }) => {
  const dispatch = useDispatch();
  const { setTitle } = useOutletContext()
  const { t } = useTranslation()
  const auth = useAuth();

  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState([])
  const [keyword, setKeyword] = useState('')
  const [time, setTime] = useState(new Date().getTime());
  const [role, setRole] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [storeData, resultStoreData] = useStoreUsersMutation();
  const [updateData, resultUpdateData] = useUpdateUsersMutation();
  
  const [deleteData, resultDeleteData] = useDeleteUsersMutation();

  const defaultPass = 'DEFAULT';

  var roles = [
    { id: 'admin', name: t('admin.roles.admin') },
    { id: 'school_admin', name: t('admin.roles.school_admin') }
  ];

  if (auth.user.data.role != 'superadmin') {
    roles = [
      { id: 'school_admin', name: t('admin.roles.school_admin') }
    ]
  }
  const tenants = useGetTenantsQuery({
    no_lti : true
  });
  const [tenant_id, setTenantId] = useState(auth?.user?.data?.tenant_id ? auth?.user?.data?.tenant_id : null)
  const [schoolId, setSchoolId] = useState(auth?.user?.data?.school_id ? auth?.user?.data?.school_id : null)
  let fetch = false
  if(role && tenant_id){
    fetch = true;

    if(role == 'school_admin' && !schoolId){
      fetch = false
    }
  }

  const users = useGetUsersQuery({
    per_page: perPage,
    page,
    order,
    keyword,
    role: role,
    tenant_id: tenant_id,
    school_id: (role != 'school_admin') ? null : schoolId
  } , {
    skip : !fetch
  });

  const schoolFilter = useGetSchoolsQuery({
    tenant_id: tenant_id
  },{
    skip : auth.user.data.school_id || !tenant_id
  });

  const formik = useFormik({
    initialValues: {
      id: '',
      role: (auth.user.data.role != 'superadmin') ? 'school_admin' : '',
      tenant_id: '',
      school_id: '',
      email: '',
      name: '',
      username: '',
      password: '',
      password_confirm: ''
    },
    validationSchema: AdminSchemaValidation,
    onSubmit: values => {
      var params = { ...values }
      if (params.id && params.password == defaultPass)
        delete params.password

      values = emptyStringToNull(params)
      if (values.id) {
        updateData(values)
      } else {
        storeData(values)
      }
    }
  });

  useEffect(() => {
    setTitle(t('admin.view.title'))
    if(auth?.user?.data?.role == 'admin'){
      setRole('school_admin')
    }
  }, []);

  const school = useGetSchoolsQuery({
      tenant_id: formik.values.tenant_id
  }, {
    skip : formik.values.role != 'school_admin' || !formik.values.tenant_id
  });

  const handleCloseFormModal = () => {
    setShowModal(false)
    formik.resetForm()
  }

  const renderTable = () => {
    const totalRows = users?.data?.data?.count || 0
    const dataColumns = [
      {
        name: t('admin.schools.label.no'),
        width: "5vw",
        center: true,
        cell: (row, index) => ((page - 1) * perPage) + (index + 1)
      },
      {
        name: t('admin.label.name'),
        selector: row => row.name,
        sortable: true,
        sortField: 'name'
      },
      {
        name: t('admin.label.userid'),
        selector: row => row.username,
        sortable: true,
        sortField: 'username'
      },
      {
        name: t('admin.label.email'),
        selector: row => row.email,
        sortable: true,
        sortField: 'email'
      },
      {
        name: t('admin.label.created_date'),
        selector: row => moment(row.createdAt).format('YYYY/MM/DD hh:mm:ss'),
        center: true,
        sortable: true,
        sortField: 'createdAt',
        width: "15vw",
      },
      {
        name : t('table.action_label'),
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
    return <Table
      columns={dataColumns}
      data={users?.data?.data?.rows || []}
      totalRows={totalRows}
      loading={users?.isLoading}
      setPerPage={setPerPage}
      setPage={setPage}
      setKeyword={setKeyword}
      setOrder={setOrder}
      subHeaderComponent={filterOption}
    />
  }

  const onClickDelete = async (row) => {
  //console.log(row.id)
    dispatch(showAlert({
      title: t('alert.name'),
      excerpt: t('admin.label.confirm_delete'),
      confirm: {
        status: true,
        labelBtnTrue: t('btn.btn_delete'),
        labelBtnfalse: t('btn.btn_cancel'),
      },
      action: {
        handleChange: () => dispatch(closeAlert()),
        onBtnTrueHandler: () => {
          // deleteData({ endpoint: 'users/' + row })
          deleteData(row)
          dispatch(closeAlert())
          dispatch(wsSend({
            type : "kick_user",
            data: {
              id : row.id
            }
          }))
        }
      }
    }))
  }

  const [selectedRow, setSelectedRow] = useState(null)
  const handleShowFormModal = (row = null) => {
    setSelectedRow(row);
    // formik.setFieldValue('role', 'admin')
    if (row) {
      Object.keys(row)?.map((key) => {
        if (row[key] != null) {
          formik.setFieldValue(`${key}`, row[key])
          setTimeout(() => formik.setFieldTouched(`${key}`, true))
        }
        formik.setFieldValue('password', defaultPass)
        formik.setFieldValue('password_confirm', defaultPass)
      });
    } else if (auth.user.data.role != 'superadmin') {
      formik.setFieldValue('tenant_id', auth.user.data.tenant_id)
      if(auth.user.data.school_id != null)
      formik.setFieldValue('school_id', auth.user.data.school_id)
      formik.setFieldValue('role', 'school_admin')
    }
    setShowModal(true)
  }

  useEffect(() => {
  //console.log(selectedRow)
    if (showSchool && selectedRow != null) {
      formik.setFieldValue('school_id', selectedRow.school_id)
    }
  }, [selectedRow])


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
          onClick={() => handleShowFormModal(null)}
        >
          <FontAwesomeIcon icon="fa-solid fa-plus" /> {t('admin.tenants.btn.add_new')}
        </button>
        <div className={`flex flex-row space-x-2`}>
          <div className={`${auth.user.data.role != 'superadmin' ? `hidden` : 'w-60'}`}>
            <label className="block text-sm font-medium text-gray-700">{t('admin.label.role')}</label>
            <Autocomplete data={roles} defaultValue={false} value={role} placeholder={t('placeholder.select_role')} onChange={(e) => {
              if (e?.id)
              //console.log(e.id)
              setRole(e.id)
            }} />
          </div>
          <div className={`${auth.user.data.role != 'superadmin' ? `hidden` : 'w-60'}`}>
            <label className="block text-sm font-medium text-gray-700">{t('admin.label.tenant')}</label>
            <Autocomplete
              id='tenant_id'
              value={tenant_id}
              data={tenants?.data?.data?.rows}
              placeholder={t('placeholder.select_tenant')}
              defaultValue={false}
              onChange={(obj) => {
                if (obj?.id)
                  setTenantId(obj.id)
              }}
            />
          </div>
          {(role == 'school_admin') &&
            <div className="w-60">
              <label className="block text-sm font-medium text-gray-700">{t('admin.label.school')}</label>
              <Autocomplete defaultValue={false} data={schoolFilter?.data?.data?.rows} placeholder={t('placeholder.select_school')}
                onChange={(obj) => {
                  if (obj?.id)
                    setSchoolId(obj.id)
                }}
              />
            </div>
          }
        </div>
      </div>
    )
  }, [role, tenants, schoolFilter])

  useEffect(() => {
    if (resultStoreData.isSuccess || resultDeleteData.isSuccess || resultUpdateData.isSuccess) {
      setTime(new Date().getTime())
      handleCloseFormModal();
    }
  }, [resultStoreData.isSuccess, resultDeleteData.isSuccess, resultUpdateData.isSuccess]);

  const [showSchool, setShowSchool] = useState(false);
  const handleChangeForm = (field, e) => {
    formik.setFieldValue(field, e.target.value)
    if(field == 'role' && e.target.value == 'admin')
      formik.setFieldValue('school_id', null)
  }

  useEffect(() => {
    if (formik.values.role == 'school_admin' && formik.values.tenant_id != '') {
      setShowSchool(true)
    } else {
      setShowSchool(false)
    }
  }, [formik.values.role, formik.values.tenant_id])

  const handleTitle = () => {
    return (!selectedRow) ? t('admin.label.add_admin') : t('admin.label.edit_admin')
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
        <div className={`${auth.user.data.role != 'superadmin' ? `hidden` : ''}`}>
          <Xselect
            id='tenant_id'
            data={tenants?.data?.data?.rows}
            label={(<>{t('admin.label.tenant')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)}
            placeholder={t('placeholder.select_tenant')}
            formik={formik}
            disabled={(formik.values.id) ? true : false}
            defaultValue={false}
            onChange={(e) => {
              formik.setFieldValue('tenant_id', (e) ? e.id : '')
            }}
          />
        </div>
        {(showSchool) &&
          <Xselect
            id='school_id'
            data={school?.data?.data?.rows}
            label={(<>{t('admin.label.school')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)}
            placeholder={t('placeholder.select_school')}
            formik={formik}
            disabled={(formik.values.id) ? true : false}
            defaultValue={false}
            onChange={(e) => {
              formik.setFieldValue('school_id', (e) ? e.id : '')
            }}
          />
        }
        <div className={`${auth.user.data.role != 'superadmin' ? `hidden` : ''}`}>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">{t('admin.label.role')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></label>
          <div className="mt-1">
            <select
              disabled={(formik.values.id) ? true : false}
              id="role"
              className={`
        ${formik.errors.role && formik.touched.role ? `border-red-400` : `border-gray-200`}
        border 
        ${formik.values.role == "" ? `text-gray-400` : `text-gray-700`}
         
        rounded 
        py-2 px-2
        focus:outline-none 
        focus:bg-white 
        focus:border-gray-500
        block w-full 
        focus:border-teal-500 focus:ring-teal-500 sm:text-sm
      `}
              {...formik.getFieldProps('role')}
              onChange={(e) => { 
                handleChangeForm('role', e)
                formik.setTouched({
                  ...formik.touched,
                  'role': false
                }, true)
               }}
            >
              <option value="" disabled defaultValue hidden className="text-gray-400">{t('admin.label.select_role_placeholder')}</option>
              {roles.map(item => (
                <option className="text-gray-700" key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          {formik.errors.role && formik.touched.role && (<i className="mt-2 text-sm text-red-500">{formik.errors.role}</i>)}
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('admin.label.name')}</label>
          <div className="mt-1">
            <input
              id="name"
              type="text"
              className={`
        ${formik.errors.name && formik.touched.name ? `border-red-400` : `border-gray-200`}
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
              placeholder={t('placeholder.admin_name')}
              {...formik.getFieldProps('name')}
            />
          </div>
          {formik.errors.name && formik.touched.name && (<i className="mt-2 text-sm text-red-500">{formik.errors.name}</i>)}
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">{t('admin.label.userid')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></label>
          <div className="mt-1">
            <input
              id="username"
              type="text"
              className={`
        ${formik.errors.username && formik.touched.username ? `border-red-400` : `border-gray-200`}
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
              placeholder={t('placeholder.username')}
              {...formik.getFieldProps('username')}
            />
          </div>
          {formik.errors.username && formik.touched.username && (<i className="mt-2 text-sm text-red-500">{formik.errors.username}</i>)}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('admin.label.email')}</label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              className={`
        ${formik.errors.email && formik.touched.email ? `border-red-400` : `border-gray-200`}
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
              placeholder={t('placeholder.email')}
              {...formik.getFieldProps('email')}
            />
          </div>
          {formik.errors.email && formik.touched.email && (<i className="mt-2 text-sm text-red-500">{formik.errors.email}</i>)}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('admin.label.password')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              className={`
        ${formik.errors.password && formik.touched.password ? `border-red-400` : `border-gray-200`}
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
              placeholder={t('placeholder.password')}
              {...formik.getFieldProps('password')}
            />
          </div>
          {formik.errors.password && formik.touched.password && (<i className="mt-2 text-sm text-red-500">{formik.errors.password}</i>)}
        </div>
        <div>
          <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">{t('admin.label.password_confirm')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></label>
          <div className="mt-1">
            <input
              id="password_confirm"
              type="password"
              className={`
        ${formik.errors.password_confirm && formik.touched.password_confirm ? `border-red-400` : `border-gray-200`}
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
              placeholder={t('placeholder.password_confirm')}
              {...formik.getFieldProps('password_confirm')}
            />
          </div>
          {formik.errors.password_confirm && formik.touched.password_confirm && (<i className="mt-2 text-sm text-red-500">{formik.errors.password_confirm}</i>)}
        </div>

      </FormModal>
    </div>
  );
}

export default LoadingHoc(AdminManagement);

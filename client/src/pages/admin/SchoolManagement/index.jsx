import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import moment from 'moment'
import { useTranslation } from "react-i18next";

import Table from "../../../components/common/Table";
import Autocomplete from "../../../components/common/Autocomplete";

import { useGetTenantsQuery } from "../../../store/services/tenants";
import { useDeleteSchoolsMutation, useGetSchoolsQuery, useStoreSchoolsMutation, useUpdateSchoolsMutation } from "../../../store/services/schools";
import { useGetUsersQuery } from "../../../store/services/users";
import { useGetRoomsQuery } from "../../../store/services/rooms";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SchoolSchemaValidation } from "./SchoolSchemaValidation";
import { useFormik } from "formik";
import FormModal from "../../../components/common/FormModal";
import { emptyStringToNull } from "../../../helpers/utility";
import LoadingHoc from "../../../hocs/LoadingHoc";
import { useDispatch } from "react-redux";
import { showAlert, closeAlert } from "../../../store/features/alertSlice";
import { useAuth } from "../../../hooks/useAuth";
import { skipToken } from "@reduxjs/toolkit/dist/query"
import { Xselect } from '../../../components/common/Forms';
import { wsSend } from "../../../store/redux/websocket/actions";
import { clearData } from "../../../store/features/monitoringSlice";

const SchoolManagement = ({ setLoading }) => {
  const dispatch = useDispatch();
  const { setTitle } = useOutletContext()
  const { t } = useTranslation()
  const auth = useAuth();

  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState([])
  const [keyword, setKeyword] = useState('')
  const [time, setTime] = useState(new Date().getTime());
  const [tenant_id, setTenantId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [storeSchools, resultStoreSchools] = useStoreSchoolsMutation();
  const [updateSchools, resultUpdateSchools] = useUpdateSchoolsMutation();
  const [deleteSchools, resultDeleteSchools] = useDeleteSchoolsMutation();

  const tenants = useGetTenantsQuery({
    no_lti: true
  })
  const schools = useGetSchoolsQuery({
    per_page: perPage,
    page,
    order,
    keyword,
    tenant_id
  }, {
    skip: !tenant_id
  });

  useEffect(() => {
    setTitle(t('admin.schools.title'))
  }, []);

  const handleCloseFormModal = () => {
    setShowModal(false)
    formik.resetForm()
  }

  const renderTable = () => {
    const totalRows = schools?.data?.data?.count || 0
    const dataColumns = [
      {
        name: t('admin.schools.label.no'),
        width: "5vw",
        center: true,
        cell: (row, index) => ((page - 1) * perPage) + (index + 1)
      },
      {
        name: t('admin.schools.label.code'),
        selector: row => row.school_code,
        sortable: true,
        sortField: 'school_code'
      },
      {
        name: t('admin.schools.label.name'),
        selector: row => row.name,
        sortable: true,
        sortField: 'name'
      },
      {
        name: t('admin.schools.label.created_date'),
        selector: row => moment(row.createdAt).format('YYYY/MM/DD hh:mm:ss'),
        center: true,
        sortable: true,
        sortField: 'createdAt',
        width: "15vw",
      },
      {
        center: true,
        name: t('table.action_label'),
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
              onClick={() => {
                onClickDelete(row)
              }}
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
      data={schools?.data?.data?.rows || []}
      totalRows={totalRows}
      loading={schools?.isLoading}
      setPerPage={setPerPage}
      setPage={setPage}
      setKeyword={setKeyword}
      setOrder={setOrder}
      subHeaderComponent={filterOption}
    />
  }

  const users = useGetUsersQuery({
    role: 'school_admin',
    tenant_id: tenant_id,
  })

  const rooms = useGetRoomsQuery({
    tenant_id: tenant_id,
  },{
    skip : (!tenant_id)
  });

  const onClickDelete = async (row) => {
    const filter = users.data.data.rows.filter(x => x.role === "school_admin" && x.school_id === row.id)
    const filterRooms = rooms.data.data.rows.filter(x => x.school_id === row.id)
    dispatch(showAlert({
      title: t('alert.name'),
      excerpt: t('admin.schools.label.confirm_delete'),
      confirm: {
        status: true,
        labelBtnTrue: t('btn.btn_delete'),
        labelBtnfalse: t('btn.btn_cancel'),
      },
      action: {
        handleChange: () => dispatch(closeAlert()),
        onBtnTrueHandler: () => {
          deleteSchools(row)
          dispatch(closeAlert())
          for (let i = 0; i < filter.length; i++) {
            dispatch(wsSend({
              type: "kick_user",
              data: {
                id: filter[i].id
              }
            }))
          }
          for (let i = 0; i < filterRooms.length; i++) {
            handleForceKick(filterRooms[i])
          }
        }
      }
    }))
  }

  const handleForceKick = (data) => {
    dispatch(wsSend({
      type: "delete_room",
      data: {
        room_id: data.id,
        user_id: data.teacher_id,
        tenant_id: data.tenant_id,
        socket_room_id : `${data.tenant_id}:ROOM:${data.id}`
      }
    }))
  }

  const handleShowFormModal = (row = null) => {
    setShowModal(true)
    if (row) {
      Object.keys(row)?.map((key) => {
        if (row[key] != null) {
          formik.setFieldValue(`${key}`, row[key])
          setTimeout(() => formik.setFieldTouched(`${key}`, true))
        }
      });
    }
  }

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
          h-full
        "
          type="button"
          onClick={() => handleShowFormModal(null)}
        >
          <FontAwesomeIcon icon="fa-solid fa-plus" /> {t('admin.tenants.btn.add_new')}
        </button>
        {(!auth.user.data.tenant_id) &&
          <div className="w-60">
            <label className="block text-sm font-medium text-gray-700">{t('admin.schools.label.tenant')}</label>
            <Autocomplete data={tenants?.data?.data?.rows} defaultValue={false} placeholder={t('admin.schools.label.select_tenant')}
              onChange={(obj) => {
                if (obj?.id)
                  setTenantId(obj.id)
              }} />
          </div>
        }
      </div>
    )
  }, [tenants])


  const formik = useFormik({
    initialValues: {
      id: '',
      tenant_id: (auth.user.data.tenant_id) ? auth.user.data.tenant_id : '',
      school_code: '',
      name: ''
    },
    validationSchema: SchoolSchemaValidation,
    onSubmit: values => {
      values = emptyStringToNull(values)
      //console.log(values, 'values')
      if (values?.id) {
        updateSchools(values)
      } else {
        storeSchools(values)
      }
    }
  });

  useEffect(() => {
    if (resultStoreSchools.isSuccess || resultUpdateSchools.isSuccess || resultDeleteSchools.isSuccess) {
      setTime(new Date().getTime())
      handleCloseFormModal();
    }
  }, [resultStoreSchools.isSuccess, resultUpdateSchools.isSuccess, resultDeleteSchools.isSuccess]);

  useEffect(() => {
    if (auth.user.data.tenant_id)
      setTenantId(auth.user.data.tenant_id);
  }, [])

  const handleTitle = () => {
    return (!formik.values.id) ? t('admin.schools.label.add_school') : t('admin.schools.label.edit_school')
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
        {(!auth.user.data.tenant_id) &&
          <div>
            <label htmlFor="tenant" className="block text-sm font-medium text-gray-700">{t('admin.schools.label.tenant')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></label>
            <Xselect
              data={tenants?.data?.data?.rows}
              defaultValue={false}
              disabled={(formik.values.id) ? true : false}
              id="tenant_id"
              formik={formik}
              onChange={(e) => {
                formik.setFieldValue('tenant_id', (e) ? e.id : '')
              }}
              placeholder={t('admin.schools.label.select_tenant')}
            />
          </div>
        }
        <div>
          <label htmlFor="school_code" className="block text-sm font-medium text-gray-700">{t('admin.schools.label.code')}</label>
          <div className="mt-1">
            <input
              id="school_code"
              type="text"
              className={`
        ${formik.errors.school_code && formik.touched.school_code ? `border-red-400` : `border-gray-200`}
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
              placeholder={t('placeholder.code')}
              {...formik.getFieldProps('school_code')}
            />
          </div>
          {formik.errors.school_code && formik.touched.school_code && (<i className="mt-2 text-sm text-red-500">{formik.errors.school_code}</i>)}
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('admin.schools.label.name')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></label>
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
              placeholder={t('placeholder.school_name')}
              {...formik.getFieldProps('name')}
            />
          </div>
          {formik.errors.name && formik.touched.name && (<i className="mt-2 text-sm text-red-500">{formik.errors.name}</i>)}
        </div>

      </FormModal>
    </div>
  );
}

export default LoadingHoc(SchoolManagement);

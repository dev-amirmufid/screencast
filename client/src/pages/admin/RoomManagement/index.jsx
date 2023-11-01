import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import moment from 'moment'
import { useDispatch } from "react-redux";
import Table from "../../../components/common/Table";
import { useGetTenantsQuery } from "../../../store/services/tenants";
import { useGetSchoolsQuery } from "../../../store/services/schools";
import { useGetTeachersQuery } from "../../../store/services/teachers";
import { useGetRoomsQuery, useStoreRoomMutation, useUpdateRoomMutation, useDeleteRoomMutation } from "../../../store/services/rooms";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FormModal from "../../../components/common/FormModal";
import { useFormik } from "formik";
import { RoomSchemaValidation } from "./RoomSchemaValidation";
import { TENANT_LINKAGE_TYPE_OPTION } from "../../../constant/constant";
import { showAlert, closeAlert } from "../../../store/features/alertSlice";
import LoadingHoc from "../../../hocs/LoadingHoc";
import { concatClearText, emptyStringToNull } from "../../../helpers/utility";
import ReactHtmlParser from "html-react-parser";
import DatePicker from "../../../components/common/Datepicker";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import Autocomplete from "../../../components/common/Autocomplete";
import { useAuth } from "../../../hooks/useAuth";
import { Xselect } from "../../../components/common/Forms";
import { wsSend } from "../../../store/redux/websocket/actions";
import { toast } from "react-toastify";

const RoomManagement = ({ setLoading }) => {
  const { setTitle } = useOutletContext()
  const { t } = useTranslation()
  const dispatch = useDispatch();
  const auth = useAuth();

  const [selectedRow, setSelectedRow] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const [perPage, setPerPage] = useState(10)
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState([])
  const [keyword, setKeyword] = useState('')
  // const [filter_status_room, setStatusRoom] = useState('')
  const [filter_tenant_id, setFilterTenantId] = useState(auth?.user?.data?.tenant_id ? auth?.user?.data?.tenant_id : null)
  const [filter_school_id, setFilterSchoolId] = useState(auth?.user?.data?.school_id ? auth?.user?.data?.school_id : null)

  const [storeRoom, resultStoreRoom] = useStoreRoomMutation();
  const [updateRoom, resultUpdateRoom] = useUpdateRoomMutation();
  const [deleteRoom, resultDeleteRoom] = useDeleteRoomMutation();

  const formik = useFormik({
    initialValues: {
      id: '',
      name: '',
      expiredAt: '',
      is_disabled: true,
      tenant_id: '',
      school_id: '',
      teacher_id: ''
    },
    validationSchema: RoomSchemaValidation,
    onSubmit: values => {
      values = emptyStringToNull(values)
      values.expiredAt = values.expiredAt ? moment(values.expiredAt).format('YYYY-MM-DD') : null
    //console.log(values, 'values')
      if (values?.id) {
        updateRoom(values)
      } else {
        storeRoom(values)
      }
    }
  });
 
  useEffect(()=>{
    if(resultStoreRoom && resultStoreRoom.data && resultStoreRoom.data.status == true){
      toast.success(t("admin.rooms.alert.success_create_room"), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      })
    } 
  },[resultStoreRoom?.data])

  useEffect(()=>{
    if(resultUpdateRoom && resultUpdateRoom.data && resultUpdateRoom.data.status == true){
      toast.success(t("admin.rooms.alert.success_update_room"), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      })
    } 
  },[resultUpdateRoom?.data])

  useEffect(()=>{
    if(resultDeleteRoom && resultDeleteRoom.data && resultDeleteRoom.data.status == true){
      toast.success(t("admin.rooms.alert.success_delete_room"), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      })
    } 
  },[resultDeleteRoom?.data])

  useEffect(()=>{

    if(formik.values.is_disabled){
      formik.setFieldValue('expiredAt',null)
      setTimeout(() => formik.setFieldTouched(`expiredAt`, true))
    }
     
  },[formik.values.is_disabled])

  const tenants = useGetTenantsQuery({
    no_lti : true
  })

  const schools = useGetSchoolsQuery({
      tenant_id: formik.values.tenant_id
  }, {
    skip : !formik.values.tenant_id
  })

  const teachers = useGetTeachersQuery({
    tenant_id: formik.values.tenant_id,
    school_id: formik.values.school_id
  }, {
    skip : (!formik.values.tenant_id || !formik.values.school_id)
  })

  const schools_filter = useGetSchoolsQuery({
    tenant_id: filter_tenant_id
  }, {
    skip : !filter_tenant_id
  })

  const rooms = useGetRoomsQuery({
    per_page: perPage,
    page,
    order,
    keyword,
    // status_room: filter_status_room,
    tenant_id: filter_tenant_id,
    school_id: filter_school_id
  },{
    skip : (!filter_tenant_id || !filter_school_id)
  });

  //SET TITLE PAGE
  useEffect(() => {
    setTitle(t('admin.rooms.title'))
  }, []);


  useEffect(() => {
    if (auth.user.data.tenant_id) {
      setFilterTenantId(auth.user.data.tenant_id);
    }
  }, [])


  //ON LOADING
  useEffect(() => {
    setLoading(resultStoreRoom.isLoading)
  }, [resultStoreRoom.isLoading]);
  useEffect(() => {
    setLoading(resultUpdateRoom.isLoading)
  }, [resultUpdateRoom.isLoading]);
  useEffect(() => {
    setLoading(resultDeleteRoom.isLoading)
  }, [resultDeleteRoom.isLoading]);

  //ON SUCCESS
  useEffect(() => {
    if (resultStoreRoom.isSuccess) handleCloseFormModal()
  }, [resultStoreRoom.isSuccess]);
  useEffect(() => {
    if (resultUpdateRoom.isSuccess) handleCloseFormModal()
  }, [resultUpdateRoom.isSuccess]);
  useEffect(() => {
    if (resultDeleteRoom.isSuccess) console.log('success delete')
  }, [resultDeleteRoom.isSuccess]);

  const handleCloseFormModal = () => {
    setShowModal(false)
    setSelectedRow(null)
    formik.resetForm()
  }

  const handleShowFormModal = (row = null) => {
    setShowModal(true)
    setSelectedRow(row)
    if (row) {
      Object.keys(row)?.map((key) => {
        if (row[key] != null) {
          if (key == 'expiredAt') {
            row[key] = new Date(row[key])
          }
          formik.setFieldValue(`${key}`, row[key])
          setTimeout(() => formik.setFieldTouched(`${key}`, true))
        }
      });
    } else {
      if (auth.user.data.tenant_id) {
        formik.setFieldValue(`tenant_id`, auth.user.data.tenant_id)
        setTimeout(() => formik.setFieldTouched(`tenant_id`, true))
      }
      if (auth.user.data.school_id) {
        formik.setFieldValue(`school_id`, auth.user.data.school_id)
        setTimeout(() => formik.setFieldTouched(`tenant_id`, true))
      }
    }
  }

  const onClickDelete = (row) => {
    dispatch(showAlert({
      title: t('alert.name'),
      excerpt: t('alert.text.delete_room_confirm'),
      confirm: {
        status: true,
        labelBtnTrue: t('btn.btn_delete'),
        labelBtnfalse: t('btn.btn_cancel'),
      },
      action: {
        handleChange: () => dispatch(closeAlert()),
        onBtnTrueHandler: () => {
          deleteRoom(row)
          dispatch(closeAlert())
          dispatch(wsSend({
            type: "delete_room",
            data: {
              room_id: row.id,
              user_id: row.teacher_id,
              tenant_id: row.tenant_id,
              socket_room_id : `${row.tenant_id}:ROOM:${row.id}`
            }
          }))
        }
      }
    }))
  }

  const checkExpired = (date) => {
    let expiredDate = moment(date);
    let today = moment().startOf('day');
    // console.log(expiredDate.format('DD/MM/YYYY'),today.format('DD/MM/YYYY'),today.isAfter(expiredDate))
    if(today.isAfter(expiredDate)){
      return true
    }else{
      return false
    }
  }

  const renderTable = () => {
    const totalRows = rooms?.data?.data?.count || 0
    const dataColumns = [
      {
        name: t('admin.rooms.label.no'),
        width: "5vw",
        center: true,
        cell: (row, index) => ((page - 1) * perPage) + (index + 1)
      },
      {
        name: t('admin.rooms.label.name'),
        selector: row => row.name,
        sortable: true,
        sortField: 'name',
        minWidth: "200px",
      },
      {
        name: t('admin.rooms.label.teacher_id'),
        selector: row => (row.teacher && row.teacher.first_name),
        sortable: true,
        sortField: 'teacher_id'
      },
      {
        name: t('admin.rooms.label.status_room'),
        selector: row => checkExpired(row.expiredAt) ? t('admin.rooms.label.non_active') : t('admin.rooms.label.active'),
        center: true,
        sortable: true,
        sortField: 'createdAt',
        width: "100px",
      },
      {
        name: t('admin.rooms.label.createdAt'),
        selector: row => moment(row.createdAt).format('YYYY/MM/DD hh:mm:ss'),
        center: true,
        sortable: true,
        sortField: 'createdAt',
        width: "200px",
      },
      {
        name: t('admin.rooms.label.updatedAt'),
        selector: row => moment(row.updatedAt).format('YYYY/MM/DD hh:mm:ss'),
        center: true,
        sortable: true,
        sortField: 'updatedAt',
        width: "200px",
      },
      {
        name: t('admin.rooms.label.expiredAt'),
        selector: row => row.expiredAt ? moment(row.expiredAt).format('YYYY/MM/DD') : '-',
        center: true,
        sortable: true,
        sortField: 'expiredAt',
        width: "200px",
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
    return (
        <Table
          columns={dataColumns}
          data={rooms?.data?.data?.rows || []}
          totalRows={totalRows}
          loading={rooms?.isLoading}
          setPerPage={setPerPage}
          setPage={setPage}
          setKeyword={setKeyword}
          setOrder={setOrder}
          subHeaderComponent={filterOption}
        />
    )
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
            "
          type="button"
          onClick={() => handleShowFormModal(null)}
        >
          <FontAwesomeIcon icon="fa-solid fa-plus" /> {t('admin.rooms.btn.add_new')}
        </button>
       <div className="flex flex-row">
       {(!auth.user.data.tenant_id) && (
          <div className="mr-2 w-60">
            <label className="block text-sm font-medium text-gray-700">{t('admin.rooms.label.select_tenant')}</label>
            <Autocomplete data={tenants?.data?.data?.rows} defaultValue={false} placeholder={t('placeholder.select_tenant')}
              onChange={(obj) => {
                setFilterTenantId(obj?.id)
              }} />
          </div>
        )}
        {(!auth.user.data.school_id) && (
          <div className="w-60">
            <label className="block text-sm font-medium text-gray-700">{t('admin.rooms.label.school_id')}</label>
            <Autocomplete data={schools_filter?.data?.data?.rows} defaultValue={false} placeholder={t('placeholder.select_school')}
              onChange={(obj) => {
                setFilterSchoolId(obj?.id)
              }} />
          </div>
        )}
        {/* <div className="w-60">
          <label className="block text-sm font-medium text-gray-700">{t('admin.rooms.label.status_room')}</label>
          <Autocomplete data={[{ value: '0', name: t('admin.rooms.label.active') }, { value: '1', name: t('admin.rooms.label.non_active') }]} defaultValue={false} placeholder={t('admin.rooms.label.status_room')}
            onChange={(obj) => {
              setStatusRoom(obj?.value)
            }} />
        </div> */}
       </div>
      </div>
    )
  }, [tenants, schools_filter])

  const handleTitle = () => {
    return (!selectedRow) ? t('admin.rooms.label.add_room') : t('admin.rooms.label.edit_room')
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
        {(!auth.user.data.tenant_id) && (
          <Xselect
            id='tenant_id'
            data={tenants?.data?.data?.rows}
            label={(<>{t('admin.rooms.label.tenant_id')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)}
            placeholder={t('placeholder.select_tenant')}
            formik={formik}
            disabled={(formik.values.id) ? true : false}
            onChange={(e) => {
              formik.setFieldValue('tenant_id', (e) ? e.id : '')
            }}
          />
        )}
        {(!auth.user.data.school_id) && (
          <Xselect
            id='school_id'
            data={schools?.data?.data?.rows}
            label={(<>{t('admin.rooms.label.school_id')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)}
            placeholder={t('placeholder.select_school')}
            formik={formik}
            disabled={(formik.values.id) ? true : false}
            onChange={(e) => {
              formik.setFieldValue('school_id', (e) ? e.id : '')
            }}
          />
        )}

        <Xselect
          id='teacher_id'
          data={teachers?.data?.data?.rows}
          label={(<>{t('admin.rooms.label.teacher_id')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)}
          placeholder={t('placeholder.select_teacher')}
          formik={formik}
          disabled={(formik.values.id && formik.teacher_id) ? true : false}
          binding="first_name"
          onChange={(e) => {
            formik.setFieldValue('teacher_id', (e) ? e.id : '')
          }}
        />
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('admin.rooms.label.name')} <span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></label>
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
              placeholder={t('placeholder.room_name')}
              {...formik.getFieldProps('name')}
            />
          </div>
          {formik.errors.name && formik.touched.name && (<i className="mt-2 text-sm text-red-500">{formik.errors.name}</i>)}
        </div>

        <div>
          <label htmlFor="expiredAt" className="block text-sm font-medium text-gray-700">{t('admin.rooms.label.expiredAt')}</label>
          <div className="flex flex-row mt-1">
            <DatePicker
              popperPlacement="top-start"
              popperProps={{
                strategy: "fixed"
              }}
              selected={formik.values.expiredAt}
              className={`
                  ${formik.errors.expiredAt && formik.touched.expiredAt ? `border-red-400` : `border-gray-200`}
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
              {...formik.getFieldProps('expiredAt')}
              onChange={(date) => {
                formik.setFieldValue('expiredAt', date)
                setTimeout(() => formik.setFieldTouched(`expiredAt`, true))
              }}
              dateFormat="yyyy/MM/dd"
              minDate={new Date()}
              showDisabledMonthNavigation
              placeholderText={t('placeholder.click_to_show_calendar')}
              disabled={formik.values.is_disabled}
            />
            <div className="ml-2 flex items-center">
              <input
                id="is_disabled"
                type="checkbox"
                className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                {...formik.getFieldProps('is_disabled')}
                checked={formik.values.is_disabled}
              />
              <label htmlFor="is_disabled" className="ml-3 block whitespace-nowrap text-sm font-medium text-gray-700">{t('admin.rooms.label.is_disabled')}</label>
            </div>
          </div>
          {formik.errors.expiredAt && formik.touched.expiredAt && (<i className="mt-2 text-sm text-red-500">{formik.errors.expiredAt}</i>)}
        </div>
      </FormModal>
    </div>
  );
}

export default LoadingHoc(RoomManagement);

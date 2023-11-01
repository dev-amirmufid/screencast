import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState, Fragment } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup"
import CopyToClipboard from "react-copy-to-clipboard";
import FormModal from "../../components/common/FormModal";
import Modal from "../../components/common/Modal";
import { Dialog, Transition } from "@headlessui/react";
import RoomList from "../../components/RoomList";
import { Tab } from '@headlessui/react'
import { useGetRoomsQuery, useStoreRoomMutation, useUpdateRoomMutation, useDeleteRoomMutation } from "../../store/services/rooms";
import { useGetDataQuery } from "../../store/services/request";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import LoadingHoc from "../../hocs/LoadingHoc"

import { useAuth } from "../../hooks/useAuth";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

import { clearData, joinRoom } from "../../store/features/monitoringSlice";

import { setWsRoomId, wsSend } from "../../store/redux/websocket/actions";
import ReactPaginate from "react-paginate";
import { pagination, rulePaginate } from "../../constant/pagination";
import "../../components/Monitoring/Participant/style.scss";
import DatePicker from "../../components/common/Datepicker";
import { emptyStringToNull } from "../../helpers/utility";
import moment from 'moment'

import { baseUrl } from "../../helpers/utility";
import ShareUrl from "../../components/ShareUrl";
import { closeAlert, showAlert } from "../../store/features/alertSlice";

const RoomManagement = ({setLoading}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const {setTitle,setTopBar} = useOutletContext()
  const {user} = useAuth()
  
  const navigate = useNavigate();

  const [keyword,setKeyword] = useState('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formtitle, setFormTitle] = useState('');
  const [countData, setCountData] = useState(0);
  const [roomId, setRoomId] = useState(null);
  const [modalRoom, setModalRoom] = useState(null);
  const [roomData, setRoomData] = useState(null);

  const [storeRoom, resultStoreRoom] = useStoreRoomMutation();
  const [updateRoom, resultUpdateRoom] = useUpdateRoomMutation();
  const [deleteRoom, resultDeleteRoom] = useDeleteRoomMutation();
  const [paging, setPaging] = useState({
    page:1,
    per_page:10
  })

  const tenantData = useGetDataQuery({
    endpoint: 'tenants/'+user.data.tenant_id,
    params: []
  }, {
    skip : user.data.tenant_id ? false : true
  });

  const rooms = useGetRoomsQuery({
    order : ['name','asc'],
    page: paging.page,
    per_page:paging.per_page,
    keyword
  })

  useEffect(()=>{
    var tmpCount = rooms?.data?.data?.count;
    var count = Math.ceil(tmpCount/paging.per_page);
    if(count<paging.page)
      setPaging({...paging,page:1})
    setCountData(count)
  },[rooms])

  const handlePageClick=(data)=>{
    var newData=parseInt(data.selected)+1;
    setPaging({...paging,page:newData})
  }

  const formik = useFormik({
    initialValues: {
      id:'',
      name: '',
      expiredAt: '',
      is_disabled: true,
    },
    validationSchema: Yup.object().shape({
      id: Yup.string().uuid(),
      name: Yup.string().trim()
          // .min(1,(t('validation.minlength')).replace("{value}",1))
          .max(128,(t('validation.maxlength')).replace("{value}",128))
          .test(
            'disallow-emoji',
            t('validation.emoji_disallowed'),
            (value) => !value || (value && !value.match(/([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g))
          )
          .required(t('teacher.validation.room_name_required')),
      expiredAt: Yup.string().when('is_disabled', (is_disabled, schema) => {
        if(!is_disabled) {
          return schema.nullable(true).default(null).required(t('teacher.validation.expiredAt_required'))
        } else {
          return schema.nullable(true).default(null)
        }
      }),
      is_disabled: Yup.boolean().default(true),
    }),
    onSubmit: values => {
      values = emptyStringToNull(values)
      values.expiredAt = values.expiredAt ? moment(values.expiredAt).format('YYYY-MM-DD') : null
      setLoading(true)
      if(!values?.id || values?.id == '' || values?.id == null){
        storeRoom(values).then(()=>setLoading(false))
      } else {
        updateRoom(values).then(()=>setLoading(false))
      }
    }
  });

  useEffect(()=>{

    if(formik.values.is_disabled){
      formik.setFieldValue('expiredAt',null)
      setTimeout(() => formik.setFieldTouched(`expiredAt`, true))
    }
     
  },[formik.values.is_disabled])

  useEffect(() => {
    setTitle(t('teacher.room.room_management'))
    setTopBar('')
  }, []);
  
  useEffect(() => {
    if(resultStoreRoom.isSuccess){
      toast.success(t('teacher.room.success_add_room'), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });
      handleCloseFormModal()
    }
  }, [resultStoreRoom.isSuccess]);

  useEffect(() => {
    if(resultUpdateRoom.isSuccess){
      toast.success(t('teacher.room.success_update_room'), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });
      handleCloseFormModal()
    }
  }, [resultUpdateRoom.isSuccess]);
  
  useEffect(() => {
    if(resultDeleteRoom.isSuccess){
      toast.success(t('teacher.room.success_delete_room'), {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        draggable: true,
        progress: undefined,
      });
      handleCloseFormModal()
    }
  }, [resultDeleteRoom.isSuccess]);

  useEffect(() => {
    setLoading(resultDeleteRoom.isLoading)
  }, [resultDeleteRoom.isLoading]);

  const handleCloseFormModal = () => {
    setShowFormModal(false)
    formik.resetForm()
  }

  const handleShowFormModal = (data) => {
    setFormTitle(t('teacher.room.add_new_room'))
    setShowFormModal(true)
    if(data?.id){
      setFormTitle(t('teacher.room.edit_room'))
      formik.setFieldValue(`id`,data.id)
      formik.setFieldValue(`name`,data.name)
      formik.setFieldValue(`expiredAt`, data.expiredAt ? new Date(data.expiredAt) : null)
      formik.setFieldValue(`is_disabled`, data.expiredAt ? false : true)
      setTimeout(() => formik.setFieldTouched(`id`, true))
      setTimeout(() => formik.setFieldTouched(`name`, true))
      setTimeout(() => formik.setFieldTouched(`expiredAt`, true))
      setTimeout(() => formik.setFieldTouched(`is_disabled`, true))
    }
  }

  const handleDelete = (data) => {
    deleteRoom(data)
    
    let messageData = {
      type: "delete_room",
      room_id: data.id,
      user_id: data.teacher_id,
      tenant_id: data.tenant_id,
      socket_room_id : data.socket_room_id
    };
    
    dispatch(clearData(messageData));
  }
  
  const handleForceKick = (data) => {
    dispatch(wsSend({
      type : "force_kick",
      socket_room_id : data.socket_room_id
    }))
  }

  const handleJoinRoom = (data) => {
    const send = {
      quota: (tenantData.data.data.limit)?tenantData.data.data.user_limit:'unlimited',
      tenant_id: user?.data?.tenant_id,
      teacher_id: user?.data?.id,
      user_id: user?.data?.id,
      username: user?.data?.username ? user?.data?.username : user?.data?.email,
      user_type: user?.data?.role,
      room_id: data?.id,
      room_name: data?.name,
      room_uri: data?.uri,
      studentURL: { qrcode: "", url: data.link?.replace('{user_type}','student') },
      assistantURL: { qrcode: "", url: data.link?.replace('{user_type}','assistant') },
    };
    setRoomData(send)
    dispatch(joinRoom(send))
    dispatch(setWsRoomId(null))
    setTimeout(() => {
      navigate("/teacher/monitoring", { replace: false });
    }, 100);
  }

  const handleShareLink = (room) => {
    setModalRoom(room)
    setShowModal(true)
  }

  return (
    <div>
      <div className="w-full px-4 sm:px-6 lg:px-4 xl:px-6 pt-4 pb-4 sm:pb-6 lg:pb-4 xl:pb-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
              {/* <h3 className="text-xl font-bold leading-none text-gray-900 dark:text-white">{t('teacher.room.room_list')}</h3> */}
             
              <button 
                className="
                  bg-gradient-to-r from-teal-400 to-teal-600 shadow 
                  hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
                  shadow 
                  focus:shadow-outline 
                  focus:outline-none 
                  text-white font-bold py-2 px-4 rounded
                  mx-2
                "
                type="button" onClick={handleShowFormModal}
              ><FontAwesomeIcon icon="fa-solid fa-plus" /> {t('teacher.room.add_new')}</button>
              
              {false && 
              <button 
                className="
                  bg-gradient-to-r from-teal-400 to-teal-600 shadow 
                  hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
                  shadow 
                  focus:shadow-outline 
                  focus:outline-none 
                  text-white font-bold py-2 px-4 rounded
                  mx-2
                "
                type="button" onClick={()=>navigate("/teacher/temporary-monitoring", { replace: false })}
              > 
              
              <FontAwesomeIcon icon="fa-solid fa-video" className="mr-3" />
              {t('teacher.room.create_temp_room')}</button>
              }
          </div>
          {(rooms.data && rooms.data.data.rows.length > 0) ? 
          <div className="flex flex-wrap">
            {rooms?.data?.data?.rows.map((room)=>(
              <RoomList data={room} key={room.id} onEdit={handleShowFormModal} onDelete={handleDelete} onJoinRoom={handleJoinRoom}  onShareLink={handleShareLink} />
            ))}
          </div>
          :<h6 className='my-3 text-center text-black'>{t('table.no_data')}</h6>}
          
        <div className="paginate-participant z-10">
          {(rooms.data && rooms.data.data.rows.length > 0) ? 
          <ReactPaginate
            previousLabel={"<<<<"}
            nextLabel={">>>>"}
            breakLabel={"..."}
            breakClassName={"break-me"}
            pageCount={countData}
            marginPagesDisplayed={1}
            pageRangeDisplayed={1}
            forcePage={0}
            onPageChange={handlePageClick}
            containerClassName={"pagination"}
            activeClassName={"active"}
          />:''}
          </div>
          
      </div>

      <FormModal 
        formik={formik}
        show={showFormModal} 
        onClose={handleCloseFormModal}
        title={formtitle}
      >
        <input type="hidden"
        {...formik.getFieldProps('id')}
        />

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('teacher.room.room_name')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></label>
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
              placeholder={t('teacher.room.room_name_placeholder')}
              {...formik.getFieldProps('name')}
              />
          </div>
          {formik.errors.name && formik.touched.name && (<i className="mt-2 text-sm text-red-500">{formik.errors.name}</i>)}
        </div>
        <div className="mt-5">
          <label htmlFor="expiredAt" className="block text-sm font-medium text-gray-700">{t('teacher.room.expired_at')}</label>
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
              autoComplete='off'
            />

            <div className="ml-2 flex items-center">
              <input
                id="is_disabled"
                type="checkbox"
                className="h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500"
                {...formik.getFieldProps('is_disabled')}
                checked={formik.values.is_disabled}
              />
              <label htmlFor="is_disabled" className="ml-3 block text-sm font-medium text-gray-700">{t('admin.rooms.label.is_disabled')}</label>
            </div>
          </div>
          {formik.errors.expiredAt && formik.touched.expiredAt && (<i className="mt-2 text-sm text-red-500">{formik.errors.expiredAt}</i>)}
        </div>

      </FormModal>
                
      <Modal 
        show={showModal} 
        onClose={()=>setShowModal(false)}
        className="fixed z-10 inset-0 overflow-y-auto modal-main" style={{zIndex:1350}}
        title={t('teacher.modal.share_title')}
      >
        {modalRoom && 
          <ShareUrl 
            rooms={{
              id: modalRoom.id,
              tenant_id: modalRoom.tenant_id,
              uri: modalRoom.uri
            }} 
            setShowModal={setShowModal} 
            show={showModal} 
            onClose={()=>setShowModal(false)}
            title={()=>(<><FontAwesomeIcon icon="fa-solid fa-share-from-square" className="mr-2"/>{t('teacher.modal.share_title')}</>)}
          />
        }
      </Modal>
    </div>
  
  );
}

export default LoadingHoc(RoomManagement);

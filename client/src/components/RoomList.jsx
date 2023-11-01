import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch } from "react-redux";
import { showAlert, closeAlert } from "../store/features/alertSlice";
import { toast } from "react-toastify";
import CopyToClipboard from "react-copy-to-clipboard";
import { useEffect, useState } from "react";
import { t } from "i18next";
import { baseUrl } from "../helpers/utility";
import moment from 'moment'

const RoomList = ({data, onEdit, onDelete, onForceKick,  onJoinRoom, onShareLink}) => {
  const [room, setRoom] = useState({
    ...data,
    socket_room_id : `${data?.tenant_id}:ROOM:${data?.id}`
  });

  const [expired, setExpired] = useState(false)
  const borderExpired = {
    borderWidth: 1,
    borderStyle: 'solid',
    borderLeftColor:'#e74c3c',
    borderLeftWidth: '0.25rem',
    borderRadius: '0.25rem'
  }

  useEffect(()=>{
    if(room.expiredAt)
      checkExpired()
  },[room])

  const checkExpired = () => {
    let expiredDate = moment(room.expiredAt);
    let today = moment().startOf('day');
    if(today.isAfter(expiredDate)){
      setExpired(true)
    }else{
      setExpired(false)
    }
  }
  
  const dispatch = useDispatch()

  const onClickDelete = (room) => {
    dispatch(showAlert({
      title : t('alert.name'),
      excerpt : t('alert.text.delete_room_confirm'),
      confirm : {
        status: true,
        labelBtnTrue: t('btn.btn_delete'),
        labelBtnfalse: t('btn.btn_cancel'),
      },
      action : {
        handleChange: ()=> dispatch(closeAlert()),
        onBtnTrueHandler: () => {
          dispatch(closeAlert())
          setTimeout(() => {
            onDelete(room)
          }, 500);
        }
      }
    }))
  }

  const onClickForceKick = (room) => {
    onForceKick(room)
  }

  useEffect(() => {
    setRoom({
      ...data,
      socket_room_id : `${data?.tenant_id}:ROOM:${data?.id}`
    })
  }, [data]);

  const shareLink = () => {
    if(expired){  
      showExpired()
    }else{
      onShareLink(room)
    }
  }
  
  const joinRoom = () => {
    if(expired){     
      showExpired()
    }else{
      onJoinRoom({...room,link : `${baseUrl()}/{user_type}/join-room/${room.tenant_id}/${room.uri}}`})
    }
  }

  const showExpired = () => {   
    dispatch(showAlert({
      title : t('alert.name'),
      excerpt : t('alert.text.room_is_expired'),
      action : {
        handleChange: ()=> dispatch(closeAlert())
      }
    }))
  }

  return (
    <div className="bg-white w-1/2 mb-4" >
      <div className="px-2">
          <div className="p-8 rounded-lg border shadow-md flex items-center space-x-4" style={(expired)?borderExpired:{}}>
              <div className="flex-shrink-0">
                <FontAwesomeIcon
                  icon="fa-brands fa-chromecast"
                  className="mr-3 text-teal-500"
                  size="5x"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div>
                  <p className="text-xl font-medium text-gray-900 truncate dark:text-white">
                      {room.name}
                  </p>
                </div>
                <div className="flex justify-between mt-4">
                  
                  <div className="flex">
                    <button onClick={()=>onEdit(room)} className="text-sm font-medium text-gray-600 hover:underline dark:text-blue-500 mr-3"><FontAwesomeIcon icon="fa-solid fa-pen-to-square" className="mr-1" /> {t('teacher.room.edit')}</button>
                    <button onClick={()=>onClickDelete(room)} className="text-sm font-medium text-red-600 hover:underline dark:text-blue-500 mr-3"><FontAwesomeIcon icon="fa-solid fa-trash" className="mr-1" /> {t('teacher.room.delete')}</button>
                    {onForceKick ? (<button onClick={()=>onClickForceKick(room)} >{t('teacher.room.force_kick')}</button>) : null }
                  </div>
                  
                  <div className="flex justify-end">
                    
                    <button
                      id="start_room_session"
                      className="
                        bg-gradient-to-r from-white to-gray-200
                        hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300
                        ml-2
                        shadow 
                        focus:shadow-outline 
                        focus:outline-none 
                        text-teal-600 font-bold py-2 px-4 rounded
                      " 
                      type="button"
                      onClick={()=>shareLink()}
                    >
                      <FontAwesomeIcon icon="fa-solid fa-share-from-square" className="mr-3" />
                      {t('teacher.room.share_link')}
                    </button>
                    
                    <button
                      id="start_room_session"
                      className="
                        ml-2
                        bg-gradient-to-r from-teal-400 to-teal-600 shadow 
                        hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
                        text-white 
                        font-bold py-2 px-4 
                        rounded
                        focus:shadow-outline 
                        focus:outline-none
                        "
                      type="button"
                      onClick={()=>joinRoom()}
                    >
                      <FontAwesomeIcon icon="fa-solid fa-video" className="mr-3" />
                      {t('teacher.room.join_room')}
                    </button>
                  </div>
                
                </div>
              </div>
          </div>
      </div>
    </div>
  );
}

export default RoomList;

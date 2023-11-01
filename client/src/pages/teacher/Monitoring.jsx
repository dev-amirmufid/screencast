import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {  useLocation, useNavigate, useOutletContext } from "react-router-dom";
import LoadingHoc from "../../hocs/LoadingHoc";
import { fetchRoom, leaveRoom, joinRoom } from "../../store/features/monitoringSlice";
import { showAlert, closeAlert } from "../../store/features/alertSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { setWsRoomId, wsJoinRoom, wsLeaveRoom, wsSend } from "../../store/redux/websocket/actions";
import { storeLog } from "../../store/redux/log/actions";

import {
  onWatching,
  setWatchingStart,
  setWatchingType,
  setUserReset,
  hangup,
} from "../../store/redux/watching/actions";

import "./styles.css";
import { useAuth } from "../../hooks/useAuth";
import Participants from "../../components/Monitoring/Participant/Participants";
import ModalCompare from "../../components/Monitoring/ModalCompare";
import ModalSplit from "../../components/Monitoring/ModalSplit";
import ModalWatching from "../../components/Monitoring/ModalWatching";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import Modal from "../../components/common/Modal";
import ShareUrl from "../../components/ShareUrl";
import { LINKAGE_NAME_TYPE } from "../../constant/constant";
import { leaveAssistant } from "../../store/features/assistantSlice";
import DatePicker from "../../components/common/Datepicker";
import moment from "moment";

const Monitoring = ({setLoading}) => {

  const auth = useAuth()
  const { user, tenants } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [roomData, setRoomData] = useLocalStorage("roomData",null)
  const [assistantRoomData, setAssistantRoomData] = useLocalStorage("assistantRoom",null)
  const [tenantData, setTenantData] = useLocalStorage("tenantData",null)
  

  const monitoring = useSelector((state)=>state.monitoring);
  const websocket = useSelector((state) => state.websocket);
  const watching = useSelector((state) => state.watching);

  const [gridSize, setGridSize] = useState(4);
  const [showModal, setShowModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvDate, setCsvDate] = useState(new Date())
  
  
  const {setTitle, setTopBar} = useOutletContext()
  
  useEffect(() => {
//console.log(monitoring.roomStatus,'monitoring.roomStatus')
    if(monitoring.roomStatus == "exist"){
      let title = `${t('teacher.monitoring.title')} - ${monitoring.room.room_name}`
      if(location.pathname === '/teacher/temporary-monitoring' || roomData?.temporary){
        title = ``
      }
      setTitle(title)
      setTopBar(TopBar)

    } else if (monitoring.roomStatus == "no_exist") {
      if(assistantRoomData){
        dispatch(leaveAssistant())
      }
      
      dispatch(showAlert({
        title: t('alert.name'),
        excerpt: t('alert.text.room_not_exists'),
        action : {
          handleChange : () => {
            if(assistantRoomData){
              logoutAction();
              window.location.reload();
            } else {
              onLeaveRoom();
            }
            dispatch(closeAlert());
          }
        }
      }))
    } else if (monitoring.roomStatus == "force_leave"){
      if(assistantRoomData){
        dispatch(leaveAssistant())
        window.location.reload();
        logoutAction();
      }
      onLeaveRoom();
    }
  }, [monitoring.roomStatus,gridSize,monitoring.participants,watching.type,watching.users]);

  useEffect(() => {
    if (websocket.connected && roomData) {
          dispatch(wsJoinRoom({
            tenant_id : roomData?.tenant_id,
            room_uri : roomData?.room_uri,
            room_id : roomData?.room_id,
            user_id : user?.data?.id,
            username : user?.data?.username ? user?.data?.username : user?.data?.email,
            user_type : user?.data?.role,
            terminal_type: navigator?.platform,
            name_type: LINKAGE_NAME_TYPE.filter((item)=>item.value == tenants?.data?.data?.linkage_type)[0].name,
            temporary : roomData?.temporary ? roomData.temporary : false,
            assistant : assistantRoomData ? true : false
          }));
    } else {
      if(!roomData && location.pathname === '/teacher/temporary-monitoring'){
        const room_id_temporary = (Math.random() + 1).toString(36).substring(2)
        const send = {
          quota: (tenantData.data.data.limit)?tenantData.data.data.user_limit:'unlimited',
          tenant_id: user?.data?.tenant_id,
          teacher_id: user?.data?.id,
          user_id: user?.data?.id,
          username: user?.data?.username ? user?.data?.username : user?.data?.email,
          user_type: user?.data?.role,
          room_id: room_id_temporary,
          room_name: user?.data?.username ? user?.data?.username : user?.data?.email,
          room_uri: room_id_temporary,
          studentURL: { qrcode: "", url: '' },
          assistantURL: { qrcode: "", url: '' },
          temporary : true
        };
        setRoomData(send)
      } else if(!roomData && assistantRoomData){
        setRoomData(assistantRoomData)
      }
    }
  }, [websocket.connected, roomData]);

  
  useEffect(() => {
  //console.log(websocket.socket_room_id,'websocket.socket_room_id')
    if(websocket.socket_room_id) {
      if (websocket.socket_room_id == "room_not_found"){
        
        if(assistantRoomData){
          dispatch(leaveAssistant())
        }
        dispatch(showAlert({
          title: t('alert.name'),
          excerpt: t('alert.text.room_not_exists'),
          action : {
            handleChange : () => {
              if(assistantRoomData){
                window.location.reload();
                logoutAction();
              } else {
                onLeaveRoom();
              }
              dispatch(closeAlert());
            }
          }
        }))
      } else {
        dispatch(fetchRoom({
          tenant_id : roomData?.tenant_id,
          room_id : roomData?.room_id
        }));
      }
    }
  }, [websocket.socket_room_id]);

  useEffect(() => {
      if (watching?.type === "watching") {
        if (watching?.users[0]?.userStatus === "not_ready") {
          dispatch(showAlert({
            title: t("alert.name"),
            excerpt: t("alert.text.user_notready"),
            action : {
              handleChange : () => dispatch(closeAlert())
            }
          }))
        } else if (watching?.users[0]?.userStatus === "disconnect") {
          hangupHandler();
          setTimeout(function(){
            dispatch(showAlert({
              title: t("alert.name"),
              excerpt: t("alert.text.user_disconnect"),
              
              action : {
                handleChange : () => dispatch(closeAlert())
              }
            }))
          }, 1000);
        }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watching.users]);

  useEffect(() => {
  //console.log(monitoring.pollingIntervalRange)
    if(monitoring.pollingIntervalRange > 0 && websocket.socket_room_id){
      
      const timer = setTimeout(() => {
        dispatch(fetchRoom({
          tenant_id : roomData?.tenant_id,
          room_id : roomData?.room_id
        }));
        const payloadInterval = {
          type: "polling_participants_check",
          socket_room_id: websocket.socket_room_id,
          tenant_id : monitoring.room.tenant_id,
          room_id : monitoring.room.room_id
        };
        dispatch(wsSend(payloadInterval));
      //console.log('payloadInterval',payloadInterval)
      }, monitoring.pollingIntervalRange);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [monitoring.pollingIntervalRange,websocket.socket_room_id]);
  
  const logoutAction = () => {
    setLoading(true);
    auth.signout(({data,error}) => {
      setLoading(false)
      navigate("/admin/login", { replace: true });
    });    
  }

  const TopBar = () => {
    return (
      <>
        <button
          className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
          onClick={()=>{
            setShowCsvModal(true);
            setCsvDate(new Date);
          }}
        >
          {t('btn.btn_download_csv')}
        </button>

        {watching.type === "watching" && (
          <button
            className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
            onClick={() => dispatch(setWatchingType("compare"))}
          >
            {t("btn.btn_compare")}
          </button>
        )}

        {watching.type === "compare" && (
          <>
            <button
              className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
              onClick={() => onCancel()}
            >
              {t("btn.btn_cancel")}
            </button>

            <button
              className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
              onClick={() => handleCompare()}
            >
              {t("btn.btn_compare_start")}
            </button>
          </>
        )}

        {(!assistantRoomData || tenants?.data?.data?.linkage_type == 'lti') &&
          <button
            className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
            onClick={() => setShowModal(true)}
          >
          <FontAwesomeIcon icon="fa-solid fa-share-from-square" className="mr-3" />
          {t('teacher.room.share_link')}
          </button>
        }
        <div className="inline-block mr-3 pr-3  border-r-2 border-gray-300">
          <FontAwesomeIcon
            icon="fa-solid fa-users"
            className="text-2xl mr-3 text-teal-500"
          ></FontAwesomeIcon>
          <span className="text-lg text-gray-900">
            {t("teacher.monitoring.number_of_participant")}:
            <b id="total_participants"> {monitoring.participants.length} </b>
          </span>
        </div>
        <div className="inline-block mr-3 pr-3">
          <i className="fa fa-th-large text-2xl mr-3 text-teal-500"></i>
          <input
            id="grid_change"
            type="range"
            min={2}
            max={12}
            value={gridSize}
            onChange={(e) => setGridSize(e.target.value)}
          />
        </div>
      </>
    )
  }

  const onLeaveRoom = () => {
    
    dispatch(setWatchingType("watching"));
    dispatch(setUserReset());
    dispatch(leaveRoom());
    dispatch(wsLeaveRoom(roomData));
    setTimeout(() => {
      dispatch(setWsRoomId(null))
    }, 1000);
    
      navigate('/teacher/room-management');
    
  };

  const handleClose = () => {
    // dispatch(setCompartStart(false));
    dispatch(hangup());

    storeLog({
      status: "success",
      action: "[monitoring/hangup]",
      data: JSON.stringify(roomData),
    });
  };

  const handleCloseSplit = () => {
    dispatch(setWatchingStart(false));
    dispatch(setWatchingType("watching"));
    dispatch(setUserReset());

    storeLog({
      status: "success",
      action: "[monitoring/close_split]",
      data: JSON.stringify(roomData),
    });
  };
  
  const onCancel = () => {
    dispatch(setWatchingType("watching"));
    dispatch(setUserReset());
  };

  const handleCompare = () => {
    if (watching.users.length < 2) {
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt: t("alert.text.comparation"),
        action : {
          handleChange : () => dispatch(closeAlert())
        }
      }));

      storeLog({
        status: "error",
        action: "[monitoring/compare]",
        data: JSON.stringify({
          ...roomData,
          error: "Select two students to start the comparison",
        }),
      });
    } else if (watching.users.length > 9) {
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt: t("alert.text.comparation_limit"),
        action : {
          handleChange : () => dispatch(closeAlert())
        }
      }));

      storeLog({
        status: "error",
        action: "[monitoring/compare_limit]",
        data: JSON.stringify({
          ...roomData,
          error: "Only up to 9 students can be compared",
        }),
      });
    } else {
      // set compare
      if (watching.users.length < 3) {
        dispatch(setWatchingType("compare"));
        dispatch(setWatchingStart(true));

        dispatch(onWatching());

        storeLog({
          status: "success",
          action: "[monitoring/compare]",
          data: JSON.stringify(roomData),
        });
      } else {
        dispatch(setWatchingType("split"));
        dispatch(setWatchingStart(true));

        storeLog({
          status: "success",
          action: "[monitoring/split]",
          data: JSON.stringify(roomData),
        });
      }
      // set split
    }
  };

  const hangupHandler = () => {
    dispatch(hangup());
  };
  
  const handleCsvExportParticipant = () => {

    if(csvDate){
    //console.log(`${moment(csvDate).format('YYYYMMDD')}`)
    const url = `${import.meta.env.VITE_API_URL}/export/participant/${roomData.tenant_id}/${roomData.room_id}?date=${moment(csvDate).format('YYYYMMDD')}`;
    document.getElementById('outer_frame').src = url;
    } else {
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt: t("alert.text.date_required"),
        action : {
          handleChange : () => dispatch(closeAlert())
        }
      }))
    }
  };


  return (
    <div>      
      <Modal 
        show={showCsvModal} 
        onClose={()=>setShowCsvModal(false)}
        className="fixed z-10 inset-0 overflow-y-auto modal-main" style={{zIndex:1350}}
        title={t('teacher.modal.csv')}
      >
      <div style={{ minWidth: 500 }}>
        <div className="space-y-5 bg-white py-2">
          
          <div className="mt-1 export-filter-date">
            <label htmlFor="expiredAt" tabIndex={0} className="text-left block text-sm font-medium text-gray-700 mb-2">{t('teacher.modal.select_last_connection_date')}</label>
              <DatePicker
                popperPlacement="top-start"
                popperProps={{
                  strategy: "fixed"
                }}
                selected={csvDate}
                style={{width : '100% !important'}}
                className={`
                    border-gray-200
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
                dateFormat="yyyy/MM/dd"
                maxDate={new Date()}
                showDisabledMonthNavigation
                placeholderText={t('placeholder.click_to_show_calendar')}
                autoComplete='off'
                onChange={(date) => {
                  setCsvDate(date)
                }}
              />
          </div>
          
          <div className="text-right">
            <button
              type="button"
              onClick={()=>setShowCsvModal(false)}
              className="
                          bg-gradient-to-r from-white to-gray-200 mr-3  
                          hover:bg-gradient-to-r hover:from-gray-200 
                          hover:to-gray-300
                          mx-1 
                          min-w-min
                          shadow 
                          focus:shadow-outline 
                          focus:outline-none 
                          text-teal-600 font-bold py-2 px-4 rounded
                        "
            >
              {t('teacher.modal.button_close')}
            </button>

            <button
              type="button"
              onClick={()=>handleCsvExportParticipant()}
              className="
                          bg-gradient-to-r from-teal-400 to-teal-600 shadow 
                          hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
                          mx-1
                          min-w-min
                          shadow 
                          focus:shadow-outline 
                          focus:outline-none 
                          text-white font-bold py-2 px-4 rounded
                        "
            >
              {t('teacher.modal.download_csv')}
            </button> 

          </div> 
        </div>
      </div>
      </Modal>

      <Participants gridSize={gridSize} />
      
      {watching.isWatching && watching.type === "watching" && (
        <ModalWatching isOpenDialog={watching.isWatching} hangup={hangupHandler} />
      )}

      {watching.type === "compare" && (
        <ModalCompare isOpen={watching.isWatching} handleClose={handleClose} />
      )}
      
      {watching.type === "split" && (
        <ModalSplit isOpen={watching.isWatching} handleClose={handleCloseSplit} />
      )}
      
      {monitoring.room && 
        <ShareUrl  rooms={{
          id: monitoring.room.room_id,
          tenant_id: monitoring.room.tenant_id,
          uri: monitoring.room.room_uri
        }} setShowModal={setShowModal} 
        
        show={showModal} 
        onClose={()=>setShowModal(false)}
        className="fixed z-10 inset-0 overflow-y-auto modal-main" style={{zIndex:1350}}
        title={()=>(<><FontAwesomeIcon icon="fa-solid fa-share-from-square" className="mr-2"/>{t('teacher.modal.share_title')}</>)}
        />
      }
    </div>
  );
}

export default LoadingHoc(Monitoring);

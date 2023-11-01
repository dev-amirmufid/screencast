import React, { useState, useEffect } from "react";
import ModalForm from "../../components/common/ModalForm";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { wsSend, wsJoinRoom } from "../../store/redux/websocket/actions";
import { updateStatusJoin } from "../../store/redux/joinRoom/actions";
import { storeLog } from "../../store/redux/log/actions";
import Alert from "../../components/common/Alert";
import Footer from "../../components/Layout/Footer";
import studentIcon from "../../assets/images/student.png";
import { useAuth } from "../../hooks/useAuth";
import LoadingHoc from "../../hocs/LoadingHoc";

import { showAlert,closeAlert } from "../../store/features/alertSlice";
import moment from "moment";
import { useGetDataQuery } from "../../store/services/request";
import { LINKAGE_NAME_TYPE } from "../../constant/constant";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const JoinConfirm = ({setLoading}) => {
  
  const auth = useAuth();
  const openIDAccount = JSON.parse(localStorage.getItem("openIDAccount"));
  const joinStatus = useSelector((state) => state.joinRoom.joinStatus);
  const wsStatusConnect = useSelector((state) => state.websocket.connected);
  
  const websocket = useSelector((state) => state.websocket)
  const monitoring = useSelector((state)=>state.monitoring);

  const alert = useSelector((state) => state.alert)
  const joinRoomID = localStorage.getItem("joinRoomID");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  let query = useQuery();
  let isLTI = decodeURI(query.get("lti"));
  const { t } = useTranslation();
  const [expired, setExpired] = useState(false)
  const [activeUser, setActiveUser] = useState(0)

  const [formJoin, setFormJoin] = useState({
    tenant_id: openIDAccount.tenant_id,
    type: openIDAccount.type,
    user_id: openIDAccount.email,
    user_type: openIDAccount.user_type,
    username: openIDAccount.username,
    os: openIDAccount.os,
    room_name: openIDAccount.room_name,
    room_id: openIDAccount.room_id,
    room_uri: openIDAccount.room_uri,
    terminal_type: openIDAccount.terminal_type,
    name_type: isLTI !== "null" ? "LTI" : "OIDC"
  });

  const room = useGetDataQuery({
    endpoint: 'rooms/roomUri/'+openIDAccount.room_uri,
    params: {
      tenant_id : openIDAccount.tenant_id
    }
  },{
    skip:!openIDAccount.room_uri
  });

  const [alertForm, setAlertForm] = useState({
    isOpen: true,
    excerpt: "",
    confirm: {
      status: true,
      labelBtnTrue: t("btn.btn_yes"),
      labelBtnfalse: t("btn.btn_cancel"),
    },
  });

  useEffect(() => {
    if (!openIDAccount) {
      navigate(`/student/join-room/${joinRoomID}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!wsStatusConnect || alert.isOpen) {
      setAlertForm({ ...alertForm, isOpen: false });
    } else {
      setAlertForm({ ...alertForm, isOpen: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatusConnect, alert.isOpen]);
  
  useEffect(() => {
    if (joinStatus === "failed" || joinStatus === "server_full" || joinStatus === "room_full") {
      dispatch(updateStatusJoin(null));
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt:
          joinStatus === "failed"
            ? id
              ? t("alert.text.room_not_available")
              : t("alert.text.room_not_exist")
            : t("alert.text.room_is_full"),
        action : {
          handleChange : () => dispatch(closeAlert())
        }
      }));

      storeLog({
        status: "error",
        action: "[student/join_room]",
        data: t("alert.text.room_not_exist"),
      });
    } else if (joinStatus === "success") {
      navigate("/student/room");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinStatus]);
  
  useEffect(()=>{

    if(room.isSuccess){
      setFormJoin({ ...formJoin, 
        room_id: room?.data?.data?.rooms.id ,
        room_name: room?.data?.data?.rooms.name,
        name_type: LINKAGE_NAME_TYPE.filter((item)=>item.value == room.data.data.tenants.linkage_type)[0].name
      });

      if(room?.data?.data?.rooms?.expiredAt){
        checkExpired()
      }
    }

    if(room.isError) {
      
      dispatch(showAlert({
        title : t("alert.name"),
        excerpt : room?.error?.data?.error_code ?  t(`${room?.error?.data?.error_code}`) : room?.error?.data?.message,
        labelBtnClose: t('alert.ok'),
        action : {
          handleChange : () => {
            handleBack()
            dispatch(closeAlert())
          }
        }
      }))
    }
  },[room])

  
  useEffect(()=>{
    if(websocket.socket_id){
      setTimeout(() => {
        dispatch(wsSend({
          type : "get-quota-tenant",
          data: {
            tenant: openIDAccount.tenant_id,
            messageType:'student'
          }
        }));
      }, 100);
    }
  },[websocket.socket_id])

  
  useEffect(()=>{
    if(monitoring.userTenant !== null){
      var len = monitoring?.userTenant?.length; 
      setActiveUser(len)
    }
  },[monitoring.userTenant])
  

  const checkExpired = () => {
    let expiredDate = moment(room.data.data.rooms.expiredAt);
    let today = moment().startOf('day');
    if(today.isAfter(expiredDate)){
      setExpired(true)
    }
  }

  const handleBack = () => {
    navigate(-1);
  };

  const onConfirm = () => {
    if (formJoin.username.trim() === "") {
      dispatch(showAlert({
        ...alert,
        isOpen: true,
        title: t("alert.name"),
        excerpt: `${t("alert.text.room_must_filled")}, ${t(
          "alert.text.student_must_filled"
        )}`,
        labelBtnClose: t('alert.ok'),
        action : {
          handleChange : () => dispatch(closeAlert())
        }
      }));

      storeLog({
        status: "error",
        action: "[student/join_room]",
        data: t("alert.text.room_must_filled"),
      });
    } else  if ((formJoin.username).match(/([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g)) {
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt: `${t('validation.emoji_disallowed')}`,
        action : {
          handleChange : () => dispatch(closeAlert())
        }
      }));
    } else {
      handleSignStudent()
    }
  };

  const handleResetAlert = () => {
    dispatch(showAlert({
      isOpen: false,
      title: "",
      excerpt: "",
      confirm: {
        status: false,
        labelBtnTrue: "",
        labelBtnfalse: "",
      },
      action : {
        handleChange : () => dispatch(closeAlert())
      }
    }));

    setAlertForm({ ...alertForm, isOpen: true });
  };

  const handleOnEnterSubmit = (event) => {
    if(event.key === 'Enter'){
      onConfirm();
    }
  }

  const handleSignStudent = () => {
    if(expired){
      dispatch(showAlert({
        title : t('alert.name'),
        excerpt : t('alert.text.room_is_expired'),
        action : {
          handleChange: ()=> dispatch(closeAlert())
        }
      }))
    } else {
      if(!room.data.data.tenants.limit || room.data.data.tenants.limit == 0){
        loginProccess()
      } else {
        const len = monitoring?.userTenant?.length; 
        if(len >= room.data.data.tenants.user_limit){ 
          dispatch(showAlert({
            title: t('alert.text.room_is_full2'),
            excerpt: t('alert.text.total_active_user')+" : "+len+"/"+room.data.data.tenants.user_limit,
            action : {
              handleChange : ()=>dispatch(closeAlert())
            }
          }))
        } else {
         loginProccess()
        }
      }
    }
  }

  const loginProccess = () => {
    auth.signin({
      id : formJoin.user_id,
      username : formJoin.username,
      tenant_id:formJoin.tenant_id,
      room_id:formJoin.room_id
    }, 'student', ({data,error}) => {
      setLoading(false)
      if(error){
        dispatch(showAlert({
          isOpen: true,
          title: t("alert.name"),
          excerpt: error?.data?.error_code ? t(`${error?.data?.error_code}`) : error?.data?.message,
          action : {
            handleChange : () => dispatch(closeAlert())
          }
        }));
      } else {

      //console.log(formJoin,'formJoin')
        
        dispatch(wsSend({
          type : "user-login",
          data: {
            tenant: formJoin.tenant_id,
            userId: formJoin.user_id,
            userType : 'student'
          }
        }));
        setTimeout(() => {
          dispatch(wsJoinRoom({
            tenant_id : formJoin.tenant_id,
            room_uri : formJoin.room_uri,
            room_id : formJoin.room_id,
            user_id : formJoin.user_id,
            username : formJoin.username,
            user_type : formJoin.user_type,
            terminal_type : formJoin.terminal_type,
            name_type : formJoin.name_type,
            temporary : room?.data?.data?.rooms?.temporary ? room?.data?.data?.rooms?.temporary : false
          }));
          
          setAlertForm({ ...alertForm, isOpen: false });
        }, 100);
      //console.log(formJoin,'formJoin')
      }
    });
  }

  return (
    <>
    {room.isSuccess ? (
      <ModalForm
        handleChange={() => handleBack()}
        alert={alertForm}
        onBtnTrueHandler={() => onConfirm()}
      >
        <div className="w-full">
          <div className="mb-3">
            <img
              style={{ margin: "0 auto" }}
              src={studentIcon}
              className="h-28 sm:h-28"
              alt=""
            />
          </div>
          <input
            name="room_name"
            className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-4 px-4 mb-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
            value={formJoin?.username}
            onChange={(e) =>
              setFormJoin({ ...formJoin, username: e.target.value })
            }
            onKeyPress={handleOnEnterSubmit}
            maxLength="20"
            type="text"
          />
          <p className="text-gray-600 text-lg">
            {t("alert.text.join_room_confirm")}
          </p>
          <p className="text-gray-600 text-lg">
            {t("alert.text.join_room_confirm_2")}
          </p>
        </div>
      </ModalForm>
    ) : null}

      <Footer className="footer-top-show"/>
      <Alert handleChange={alert.action.handleChange} onBtnTrueHandler={alert.action.onBtnTrueHandler} alert={alert} />
    </>
  );
};

export default LoadingHoc(JoinConfirm);

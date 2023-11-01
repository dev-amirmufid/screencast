import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jwt from 'jwt-decode';

import Alert from "../../components/common/Alert";
import LoadingHoc from "../../hocs/LoadingHoc";
import { useGetDataQuery } from "../../store/services/request";
import moment from 'moment';
import { closeAlert, showAlert } from "../../store/features/alertSlice";
import getUuidByString from "uuid-by-string";
import { setWsRoomId, wsJoinRoom, wsSend } from "../../store/redux/websocket/actions";
import { useAuth } from "../../hooks/useAuth";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { joinRoom } from "../../store/features/monitoringSlice";
import { joinRoom as StudentJoinRoom } from "../../store/redux/joinRoom/actions";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Lti = (props) => {
  const dispatch = useDispatch();
  const alert = useSelector((state) => state.alert)
  const auth = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(null)
  const [expired, setExpired] = useState(null)
  const [userData, setUserData] = useState(null)
  const [goNext, setGoNext] = useState(null)
  const monitoring = useSelector((state)=>state.monitoring);
  const websocket = useSelector((state) => state.websocket)
  const [user, setUser, removeUser] = useLocalStorage('login', null);
  const [loginSession, setLoginSession, removeLoginSession] = useLocalStorage('loginSession',null)
  let query = useQuery();
  let token = query.get("token");

  const roomData = useGetDataQuery({
    endpoint: 'rooms/roomId/'+roomId,
    params: {}
  },{
    skip:!roomId
  });

  useEffect(()=>{
    if(websocket.socket_id && roomData.data){
      setTimeout(() => {
        dispatch(wsSend({
          type : "get-quota-tenant",
          data: {
            tenant: roomData.data.data.tenants.id
          }
        }));
      }, 100);
    }
  },[websocket.socket_id, roomData.data])
  
  useEffect(()=>{
    if(monitoring.userTenant !== null && goNext==null){
      setGoNext(true)
      if(roomData.isSuccess){
        if(roomData.data.data.rooms.is_disabled == 1){
          loginProcess()
        }else{
          checkExpired();
        }
      }
    }
  },[monitoring.userTenant,roomData.isSuccess])

  useEffect(()=>{
    if(token){
      decodeToken()
    }else{
      dispatch(showAlert({
        title : t('alert.name'),
        excerpt : t('alert.text.unauthorized_user_not_found'),
        action : {
          handleChange: ()=> dispatch(closeAlert())
        }
      }))
    }
  },[token])

  const decodeToken = () => {
    var data = jwt(token);
  //console.log(data,'data')
    if(data?.data?.role && data?.data?.name && data?.data?.room_id){
      setLoginSession({
        type : data?.data?.role
      })
      setUserData(data)
      setRoomId(data.data.room_id)
    }else{
      dispatch(showAlert({
        title : t('alert.name'),
        excerpt : t('alert.text.unauthorized_user_not_found'),
        action : {
          handleChange: ()=> dispatch(closeAlert())
        }
      }))
    }
  }
  
  const checkExpired = () => {
    let expiredDate = moment(roomData.data.data.rooms.expiredAt);
    let today = moment().startOf('day');
    if(today.isAfter(expiredDate)){
      setExpired(true)
    }else{
      setExpired(false)
    }
  }

  useEffect(()=>{
    if(expired !== null){
      if(expired){
        dispatch(showAlert({
          title : t('alert.name'),
          excerpt : t('alert.text.room_is_expired'),
          action : {
            handleChange: ()=> dispatch(closeAlert())
          }
        }))
      }else{
        loginProcess();
      }
    }
  },[expired])

  const loginProcess = () => {
    if(expired){
      dispatch(showAlert({
        title : t('alert.name'),
        excerpt : t('alert.text.room_is_expired'),
        action : {
          handleChange: ()=> dispatch(closeAlert())
        }
      }))
    }else{
    //console.log(userData,'userData')
      if(userData.data.role == 'student'){
        handleSignStudent(userData.data.name)
      }else if(userData.data.role == 'teacher'){
        handleSignTeacher(userData.data.name)
      }
    }
  }

  const handleSignTeacher = (name) => {
  //console.log(name)
      const user_id = getUuidByString(name)
      if(roomData.data.data.tenants.limit == 0){
        signInTeacher(user_id)
      }else{
        var len = monitoring.userTenant.length; 
        if(len >= roomData.data.data.tenants.user_limit){
          dispatch(showAlert({
            title: t('alert.text.room_is_full2'),
            excerpt: t('alert.text.total_active_user')+" : "+len+"/"+roomData.data.data.tenants.user_limit,
            action : {
              handleChange : ()=>dispatch(closeAlert())
            }
          }))
        }else{
          signInTeacher(user_id)
        }
      }
  }
  

  const handleSignStudent = (name) => {
      const user_id = getUuidByString(name)
      if(roomData.data.data.tenants.limit == 0){
        signInStudent(user_id)
      }else{
        var len = monitoring.userTenant.length; 
        if(len >= roomData.data.data.tenants.user_limit){
          dispatch(showAlert({
            title: t('alert.text.room_is_full2'),
            excerpt: t('alert.text.total_active_user')+" : "+len+"/"+roomData.data.data.tenants.user_limit,
            action : {
              handleChange : ()=>dispatch(closeAlert())
            }
          }))
        }else{
          signInStudent(user_id)
        }
      }
  }
  
  const signInTeacher = (userId) => {
      auth.ltiSign(userData)
      dispatch(wsSend({
        type : "user-login",
        data: {
          tenant: roomData.data.data.tenants.id,
          userId: userId,
          userType : 'teacher'
        }
      }));
      if(roomData && roomData.data && roomData.data.data){  
        var send = {
          quota: (roomData.data.data.tenants.limit)?roomData.data.data.tenants.user_limit:'unlimited',
          tenant_id: roomData.data.data.tenants.id,
          teacher_id: userId,
          user_id: userId,
          username: userData.data.username,
          user_type: userData.data.role,
          room_id: roomData.data.data.rooms.id,
          room_name: roomData.data.data.rooms.name,
          room_uri: roomData.data.data.rooms.uri,
          studentURL: { qrcode: "", url: roomData.data.data.rooms.link?.replace('{user_type}','student') },
          assistantURL: { qrcode: "", url: roomData.data.data.rooms.link?.replace('{user_type}','assistant') },}
        localStorage.setItem('assistantRoom', JSON.stringify(send));

        dispatch(wsSend({
          type : "fetch_room",
          tenant_id : roomData.data.data.tenants.id,
          room_id : roomData.data.data.rooms.id
        }));
        dispatch(joinRoom(send))
        dispatch(setWsRoomId(null))
        setTimeout(() => {
        //console.log('hhahahhahahahah')
          navigate(`/assistant/join-room/${roomData.data.data.tenants.id}/${roomData.data.data.rooms.uri}`, { replace: false });
        }, 100);
      }else{
        // navigate("/teacher/amir", { replace: true });
      }
  }
  
  const signInStudent = (userId) => {
    auth.signin({
      id : userId,
      username : userData.data.name,
      tenant_id: roomData.data.data.tenants.id,
      room_id: roomData.data.data.rooms.id
    }, 'student', ({data,error}) => {
      if(error){
        dispatch(showAlert({
          isOpen: true,
          title: t("alert.name"),
          excerpt: error?.data?.error_code ? t(error?.data?.error_code) : error?.data?.message,
          action : {
            handleChange : () => dispatch(closeAlert())
          }
        }));
      } else {
          dispatch(wsJoinRoom({
            tenant_id : roomData.data.data.tenants.id,
            room_uri : roomData.data.data.rooms.uri,
            room_id : null,
            user_id : userId,
            username : userData.data.name,
            user_type : 'student',
            terminal_type: navigator?.platform,
            name_type: "LTI"
          }));
          
const send =         
{
  type: 'join_room',
  tenant_id: roomData.data.data.tenants.id,
  user_id: userId,
  username: userData.data.name,
  
  room_id: roomData.data.data.rooms.id,
  room_name: roomData.data.data.rooms.name,
  room_uri: roomData.data.data.rooms.uri,
  
  user_type: 'student',
  teacher_id: roomData.data.data.rooms.teacher_id,
  teacher_name: 'roomOwner',
  is_exist: 1
} 
          dispatch(StudentJoinRoom(send))

          dispatch(wsSend({
            type : "user-login",
            data: {
              tenant: roomData.data.data.tenants.id,
              userId: userId,
              userType:'student'
            }
          }));
          navigate("/student/room");
      }
    });
  }
  return (
    <>
    <Alert handleChange={alert.action.handleChange} onBtnTrueHandler={alert.action.onBtnTrueHandler} alert={alert} />
    </>
  );
};

export default LoadingHoc(Lti);

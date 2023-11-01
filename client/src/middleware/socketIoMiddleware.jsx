import * as actions from "../store/redux/websocket/actions";
import { io } from "socket.io-client";
import {
  WEBSOCKET_CONNECT,
  WEBSOCKET_DISCONNECT,
  WEBSOCKET_DISCONNECTED,
  WEBSOCKET_RECONNECTED,
  WEBSOCKET_SEND,
  SET_USER_LOGIN,
  WEBSOCKET_JOIN_ROOM,
  WEBSOCKET_LEAVE_ROOM
} from "../store/actions";
import { wsConf } from "../constant/configWS";
import onMessageTeacher from "./onMessageTeacher";
import onMessageStudent from "./onMessageStudent";
import { wsSend, setWsRoomId } from "../store/redux/websocket/actions";
import {showAlert, closeAlert} from "../store/features/alertSlice"
import {leaveAssistant} from "../store/features/assistantSlice"
import i18n from '../i18n'
import onMessageAdmin from "./onMessageAdmin";
import { forceLeaveRoom, leaveRoom, userTenant } from "../store/features/monitoringSlice";
import { baseUrl } from "../helpers/utility";
import { setUserReset, setWatchingType } from "../store/redux/watching/actions";

let host = `${wsConf.HTTPS}://${wsConf.HOST}`;
if (wsConf.PORT !== "") {
  host = `${wsConf.HTTPS}://${wsConf.HOST}:${wsConf.PORT}`;
}

const socketMiddleware = () => {
  const t = i18n.t;
  let socket = null;
  return (store) => (next) => (action)=>{
    let userLoginType = JSON.parse(localStorage.getItem("loginSession"));
    let userLogin = JSON.parse(localStorage.getItem("login"));
    let roomData = JSON.parse(localStorage.getItem("roomData"));
    
    switch (action.type) {
      case WEBSOCKET_CONNECT:
      //console.log('WEBSOCKET_CONNECT',action.payload.tenant_id,action)
      //console.log('HOST ',`${host}/${action.payload.tenant_id ? `tenant-${action.payload.tenant_id}` : ''}`);
        if (socket === null) {
          store.dispatch(actions.wsSetStatus('connecting'));
          // websocket connect
          socket = io(`${host}/${action.payload.tenant_id ? `tenant-${action.payload.tenant_id}` : ''}`, {
            transports : ["websocket"],
            reconnectionAttempts: 10,
            withCredentials: true
          });

          if(!socket?.connected){
            //console.log('WEBSOCKET_CONNECT', 'IO not connect')
          }

          socket.on("connect", () => {
                  
          //console.log('WEBSOCKET_CONNECT','IO connect');
            if (socket.connected) {
              
              socket.on("socket_connected",()=>{
                    
                //console.log('WEBSOCKET_CONNECT','SOCKET CONNECTED');
                  
                store.dispatch(actions.wsConnected({
                  socket_id:socket.id,
                  tenant_id:action.payload.tenant_id
                }));

                if(userLoginType?.type && userLogin){
                  if(userLoginType?.type === 'admin'){
                    socket.send({
                      type : "user_connected",
                      data: userLogin.data
                    });
                  } else {
                    if(window.location.pathname.search('/student/join-room') && window.location.pathname.search('/teacher/login') && window.location.pathname.search('/student/join-confirm')){
                      socket.send({
                        type : "user-login",
                        data: {
                          tenant: action.payload.tenant_id,
                          userId: userLogin.data.id,
                          userType : userLoginType?.type
                        }
                      });
                    }
                  }
                }
              })
              
            }
          });

          socket.on("disconnect", () => {
          //console.log('WEBSOCKET_CONNECT','IO disconnect');
            store.dispatch(actions.wsDisconnect());
          });

          socket.io.on("reconnect_attempt", (count) => {
          //console.log('WEBSOCKET_CONNECT','IO reconnect_attempt');
            if (count >= 10) {
            //console.log('WEBSOCKET_CONNECT','IO DC');
              store.dispatch(actions.wsDisconnected());
              socket.close();
              socket = null;
            }
          });

          socket.io.on("reconnect", () => {
          //console.log('WEBSOCKET_CONNECT','IO reconnect');
            store.dispatch(actions.wsReconnected());
          });

          socket.off("message");
          socket.on("message", (data) => {
              data = JSON.parse(data.toString());
            //console.log('WEBSOCKET_MESSAGE','userLoginType',userLoginType?.type, data);

              if(data.messageType == 'student'){
              //console.log('STUDENT MESSAGE');
                onMessageStudent(store, data)
              }else if(data.messageType == 'teacher'){
              //console.log('TEACHER MESSAGE');
                onMessageTeacher(store, data)
              }else if(data.messageType == 'admin'){
              //console.log('ADMIN MESSAGE');
                onMessageAdmin(store,data);
              }else{
                var role = JSON.parse(localStorage.getItem("loginSession"));
                if(role?.type === "teacher" || role?.type === "assistant"){
                  onMessageTeacher(store, data)
                } else if(role?.type === "student"){
                  onMessageStudent(store, data);
                } else if(role?.type === "admin"){
                  onMessageAdmin(store,data);
                } else {
                  switch(data.type){
                    case "user_tenant":
                      store.dispatch(userTenant(data));
                      break;
                    default: 
                  }
                }
              }

          });

          socket.off("join_socket_room");
          socket.on("join_socket_room", (data) => {
            //console.log('WEBSOCKET JOIN ROOM', data);
            
            store.dispatch(setWsRoomId(data.socket_room_id))
            store.dispatch(wsSend({
              type: "join_room",
              user_id: data.user_id,
              user_type: data.user_type,
              username: data.username,
              terminal_type: data.terminal_type,
              name_type: data.name_type,
              os: 1,
              room_id: data.room_id,
              tenant_id: data.tenant_id,
              temporary : data.temporary
            }))
          })

          socket.off("leave_socket_room");
          socket.on("leave_socket_room", (data) => {
            //console.log('WEBSOCKET LEAVE ROOM', data);
            store.dispatch(setWsRoomId("leave_room"))
            store.dispatch(wsSend({
              type: "leave_room",
              user_id: data.user_id,
              user_type: data.user_type,
              username: data.username,
              os: 1,
              room_id: data.room_id,
              tenant_id: data.tenant_id,
              teacher_id: data.teacher_id
            }))
          })

          socket.off("room_not_found")
          socket.on("room_not_found", ()=>{
            store.dispatch(setWsRoomId('room_not_found'))
            store.dispatch(showAlert({
              title :t('alert.name'),
              excerpt : t('alert.text.room_not_found'),
              action : {
                handleChange : () => store.dispatch(closeAlert())
              }
            }))
          })

          socket.off("alert_limit_user")
          socket.on("alert_limit_user", ()=>{
            store.dispatch(showAlert({
              title :t('alert.name'),
              excerpt : t('alert.text.alert_limit_user'),
              action : {
                handleChange : () => {
                  localStorage.removeItem('login');
                  localStorage.removeItem('roomData');
                  localStorage.removeItem('loginSession');
                  localStorage.removeItem('studentRoom');
                  localStorage.removeItem('assistantRoomData');
                  store.dispatch(closeAlert())
                  window.location.reload()
                }
              }
            }))
          })

          socket.off("kick_teacher")
          socket.on("kick_teacher", (data)=>{
            if(data?.dontLogout){
            } else {
              store.dispatch(wsSend({
                type : "remove-quota-tenant",
                data: {
                  tenant: data.tenant_id,
                  userId: data.user_id,
                  userType: 'teacher'
                }
              }));
            }

            // store.dispatch(forceLeaveRoom());
            store.dispatch(showAlert({
              title :t('alert.name'),
              excerpt : t('alert.text.on_kick_teacher_user'),
              action : {
                handleChange : () => {
                  store.dispatch(closeAlert())
                  localStorage.removeItem('login');
                  localStorage.removeItem('roomData');
                  localStorage.removeItem('loginSession');
                  localStorage.removeItem('studentRoom');
                  localStorage.removeItem('assistantRoomData');
                  window.location.href=`${baseUrl()}/teacher/login`
                }
              }
            }))
              
          })
          
        }
        break;
      case WEBSOCKET_SEND:
      //console.log('WEBSOCKET_SEND');
        if (socket !== null) {
        //console.log('WEBSOCKET_SEND',action.payload,socket);
          socket.send(action.payload);
        }
        break;
      case WEBSOCKET_JOIN_ROOM:
      //console.log('WEBSOCKET_SEND_JOIN_ROOM');
        if (socket !== null) {
        //console.log('WEBSOCKET_SEND_JOIN_ROOM',action.payload);
          socket.emit("join_socket_room",{...action.payload, socket_id : socket.id});
        }
        break;
      case WEBSOCKET_LEAVE_ROOM:
      //console.log('WEBSOCKET_SEND_LEAVE_ROOM');
        if (socket !== null) {
        //console.log('WEBSOCKET_SEND_LEAVE_ROOM',action.payload);
          socket.emit("leave_socket_room",{...action.payload, socket_id : socket.id});
        }
        break;
      case SET_USER_LOGIN:
      ////console.log('SET_USER_LOGIN');
        localStorage.setItem(
          "loginSession",
          JSON.stringify({ type: action.payload })
        );
        break;
      default:
        return next(action);
    }
  };
};

export default socketMiddleware();

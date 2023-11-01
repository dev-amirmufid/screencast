import { useState, createContext, useEffect } from "react";
import { Navigate,Outlet,useLocation, useNavigate } from "react-router-dom";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useAuth } from "../../hooks/useAuth";
import { useCookies } from "react-cookie";

import { useAuthAdminMutation, useAuthTeacherMutation, useAuthStudentMutation, useAuthLogoutMutation } from "../../store/services/auth";
import { useDispatch, useSelector } from "react-redux";
import { wsLeaveRoom } from "../../store/redux/websocket/actions";
import { useCheckSubDomainQuery } from "../../store/services/tenants";
import loadable from "@loadable/component";
import { useTranslation } from "react-i18next";
import { closeAlert, showAlert } from "../../store/features/alertSlice";
import Alert from "../../components/common/Alert"
import { joinAssistant, leaveAssistant } from "../../store/features/assistantSlice";
import { useDeleteTeacherMutation } from "../../store/services/teachers";

const NotFound = loadable(() => import("../../pages/NotFound"));

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch()
  const tenants = useCheckSubDomainQuery();
  const [authAdminLogin,resultauthAdminLogin] = useAuthAdminMutation();
  const [authTeacherLogin,resultauthTeacherLogin] = useAuthTeacherMutation();
  const [authStudentLogin,resultauthStudentLogin] = useAuthStudentMutation();
  const [authLogout,resultauthLogout] = useAuthLogoutMutation();
  const [deleteTeacher,resultDeleteTeacher] = useDeleteTeacherMutation();
  
  const [tenantRequest, setTenantRequest, removeTenantRequest] = useLocalStorage('tenantRequest', null);
  const [tenantData, setTenantData, removeTenantData] = useLocalStorage('tenantData', null);
  const [user, setUser, removeUser] = useLocalStorage('login', null);
  const [roomData, setRoomData, removeRoomData] = useLocalStorage('roomData', null);
  const [loginSession, setLoginSession, removeLoginSession] = useLocalStorage('loginSession', null);
  const [studentRoom, setStudentRoom, removeStudentRoom] = useLocalStorage('studentRoom', null);
  const [assistantRoomData, setAssistantRoomData, removeAssistantRoomData] = useLocalStorage('assistantRoom', null);
  const isAssistant = useSelector((state) => state.assistant.isAssistant)

  useEffect(() => {
    setTenantRequest(tenants);
    if(tenants.isSuccess){
      setTenantData(tenants)
    }
  }, [tenants, tenantData]);

  useEffect(() => {
    if(assistantRoomData){
      dispatch(joinAssistant(assistantRoomData))
    } else {
      dispatch(leaveAssistant());
    }
  }, [assistantRoomData]);

  const signin = (values, role, callback, beforeCallbackSuccess = null) => {
    
    if(['superadmin','admin','school_admin'].includes(role)){
      return authAdminLogin(values).then(({data,error})=>{
        if(error){
          setLoginSession(null); 
          setUser(null); 
        }

        if(data){
          setLoginSession({
            type: role
          });
          setUser({access_token : data.access_token, data:data.data})
        }

        setTimeout(() => {
          callback({data,error})
        }, 100);
      }).catch((error)=>{
        setLoginSession(null); 
        setUser(null); 
        setTimeout(() => {
          callback({data:null,error})
        }, 100);
      })
    } else if (role == 'teacher') {
      return authTeacherLogin(values).then(({data,error})=>{
        let valid = true
        if(error){
          setLoginSession(null); 
          setUser(null); 
        }

        if(data){

        //console.log(beforeCallbackSuccess,'beforeCallbackSuccess')
          if(beforeCallbackSuccess){
            valid = beforeCallbackSuccess(data,error)
          }
          if(valid){
            setLoginSession({
              type: role
            });
            setUser({access_token : data.access_token, data:data.data})
          }
        }

        if(valid){
          setTimeout(() => {
            callback({data,error})
          }, 100);
        }
      }).catch((error)=>{
        setLoginSession(null); 
        setUser(null); 
        setTimeout(() => {
          callback({data:null,error})
        }, 100);
      })
    } else if(role == 'student') {
      const data = {
        id : values.id,
        username : values.username,
        role : role,
        tenant_id : values.tenant_id,
        room_id : values.room_id
      }
      const error = null
      return authStudentLogin(data).then(({data,error})=>{
        if(error){
          setLoginSession(null);
          setUser(null);  
        }

        if(data){
          setLoginSession({
            type: role
          });
          setUser({access_token : null, data : data.data})
        }

        setTimeout(() => {
          callback({data,error})
        }, 100);
      }).catch((error)=>{
        setLoginSession(null); 
        setUser(null); 
        setTimeout(() => {
          callback({data:null,error})
        }, 100);
      })
    } else {
      setTimeout(() => {
        callback({data:null,error})
      }, 100);
    }
  };

  const signout = (callback) => {

    if(isAssistant){
      deleteTeacher({
        id : user?.data?.id,
        is_assistant: true
      })
    }
    
    return authLogout({token : user?.access_token.token}).then(({data,error})=>{
      removeUser(); 
      removeRoomData();
      removeLoginSession();
      removeStudentRoom();
      removeAssistantRoomData();

      callback({data,error})
      if(roomData)  dispatch(wsLeaveRoom(roomData))
    }).catch((error)=>{
      setUser(null); 
      callback({data:null,error})
    })
  };

  const ltiSign = (data) => {
    setUser({access_token : data.access_token, data:data.data})
  }

  const value = { tenants : tenantData, tenantRequest, user, signin, signout, ltiSign };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const RequireAuth = ({ roles }) => {
  const dispatch = useDispatch()
  const {t} = useTranslation()
  const navigate = useNavigate()
  let auth = useAuth()
  let location = useLocation();
  if (!auth?.user || !roles.includes(auth?.user?.data?.role)) {
    if(roles.includes('superadmin') || roles.includes('admin')){
      return <Navigate to="/admin/login" />;
    }

    if(roles.includes('teacher')){
      return <Navigate to="/teacher/login" />;
    }

    return <Navigate to="/"  />;
  }

  useEffect(() => {
    if (auth?.user && auth?.user?.access_token?.expiry * 1000 < Date.now()) {
      dispatch(showAlert({
        title : t('alert.text.expired_token_title'),
        excerpt : t('alert.text.expired_token_text'),
        labelBtnClose: t('alert.ok'),
        action : {
          handleChange : ()=>{
            dispatch(closeAlert())
            auth.signout(({data,error}) => {
              if(roles.includes('superadmin') || roles.includes('admin')){
                navigate("/admin/login");
              }

              if(roles.includes('teacher')){
                navigate("/teacher/login");
              }              
            });    
          }
        }
      }))
    }
  }, [])
  
  return <Outlet />;
}

export const NoAuth = () => {
  const auth = useAuth();
  const location = useLocation();
  const assistant = useSelector((state)=>state.assistant)

  if (auth?.user && ['admin','superadmin'].includes(auth?.user?.data?.role)) {
    return <Navigate to="/admin" />;
  }
  if (auth?.user && auth?.user?.data?.role == 'teacher') {
    return <Navigate to="/teacher" />;
  }

  return <Outlet />;
};

export const TenantsAuth = () => {
  const {tenants, tenantRequest} = useAuth();
//console.log(tenants,'tenants')
  if(!tenantRequest || (tenantRequest && !tenantRequest.isLoading && !tenantRequest.isSuccess)) {
    return <NotFound />;
  }
  if (tenants) {
    return <Outlet />;
  }
};

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { wsJoinRoom, wsSend } from "../../store/redux/websocket/actions";
import jwt from 'jwt-decode';
import {
  updateStatusJoin,
  setAccountOpenID,
} from "../../store/redux/joinRoom/actions";
import Alert from "../../components/common/Alert";
import Footer from "../../components/Layout/Footer";
import { storeLog } from "../../store/redux/log/actions";
import { GoogleOAuthProvider } from '@react-oauth/google';
import MicrosoftLogin from "react-microsoft-login";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;

import studentIcon from "../../assets/images/student.png";
// import browserImages from "../../assets/images/browser.png";
import ReactHtmlParser from "html-react-parser";

import { useAuth } from "../../hooks/useAuth";

import LoadingHoc from "../../hocs/LoadingHoc";
import getUuidByString from "uuid-by-string";

import { showAlert, closeAlert } from "../../store/features/alertSlice";
import { useGetDataQuery } from "../../store/services/request";
import moment from 'moment';
import GoogleLoginButton from "../../components/common/GoogleLoginButton";
import axios from 'redaxios';
import { LINKAGE_NAME_TYPE } from "../../constant/constant";
import { setLoginUser } from "../../store/redux/master/actions";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const JoinRoom = ({setLoading}) => {
  const auth = useAuth();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tenant_id,room_uri } = useParams();
  let query = useQuery();
  let roomName = query.get("n");
  const joinStatus = useSelector((state) => state.joinRoom.joinStatus);
  const alert = useSelector((state) => state.alert)
  const websocket = useSelector((state) => state.websocket)
  const [activeUser, setActiveUser] = useState(0)
  const monitoring = useSelector((state)=>state.monitoring);

  const [userId, setUserId] = useState(null)

  const room = useGetDataQuery({
    endpoint: 'rooms/roomUri/'+room_uri,
    params: {
      tenant_id : tenant_id
    }
  },{
    skip:!room_uri
  });
  const [expired, setExpired] = useState(false)

  const [formJoin, setFormJoin] = useState({
    user_id: null,
    type: "join_room",
    user_type: "student",
    username: "",
    os: 1,
    room_name: roomName,
    room_uri: room_uri,
    room_id: null,
    tenant_id: tenant_id,
    terminal_type: navigator?.platform,
    name_type: "手動"
  });

  useEffect(() => {
    dispatch(setLoginUser({type:'student'}))
  }, []);

  useEffect(() => {
  //console.log(joinStatus,'joinStatus')
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
    if(monitoring.userTenant !== null){
      var len = monitoring?.userTenant?.length; 
      setActiveUser(len)
    }
  },[monitoring.userTenant])

  const submitHandler = async (e) => {
    setLoading(true);
    e.preventDefault();
    if (formJoin.username.trim() === "") {
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt: `${t(
          "alert.text.student_must_filled"
        )}`,
        action : {
          handleChange : () => dispatch(closeAlert())
        }
      }));
      
      setLoading(false);
    } else  if ((formJoin.username).match(/([\uD800-\uDBFF][\uDC00-\uDFFF(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g)) {
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt: `${t('validation.emoji_disallowed')}`,
        action : {
          handleChange : () => dispatch(closeAlert())
        }
      }));
      setLoading(false);
    
    } else {
      handleSignStudent({email:null,name:formJoin.username})
    }
  };

  const cekRoom = (room) => {
    if(room?.status == "fulfilled" && !room?.data?.data){
      dispatch(showAlert({
        title : t('alert.name'),
        excerpt : t('alert.text.room_not_exists'),
        action : {
          handleChange: ()=> dispatch(closeAlert())
        }
      }))
    }
    
    if(room && room?.data?.data?.rooms?.expiredAt)
      checkExpired()
  }
  
  useEffect(()=>{
    cekRoom(room)
  },[room])

  const checkExpired = () => {
    let expiredDate = moment(room.data.data.rooms.expiredAt);
    let today = moment().startOf('day');
    if(today.isAfter(expiredDate))
      setExpired(true)
  }

  const handleSignStudent = ({email, name}) => {
    if(expired){
      dispatch(showAlert({
        title : t('alert.name'),
        excerpt : t('alert.text.room_is_expired'),
        action : {
          handleChange: ()=> dispatch(closeAlert())
        }
      }))
      setLoading(false);
    
    }else{
      const user_id = email ? getUuidByString(email) : getUuidByString(name)
      
      if(room?.data?.data?.tenants?.limit == 0){
        loginProccess(user_id)
      }else{
        var len = monitoring?.userTenant?.length; 
        if(len >= room?.data?.data?.tenants?.user_limit){ 
          dispatch(showAlert({
            title: t('alert.text.room_is_full2'),
            excerpt: t('alert.text.total_active_user')+" : "+len+"/"+room?.data?.data?.tenants?.user_limit,
            action : {
              handleChange : ()=>dispatch(closeAlert())
            }
          }))
            setLoading(false);
    
        }else{
          loginProccess(user_id)
        }
      }
    }
  }

  const loginProccess = async (userId) => {
    cekRoom(room);
    if (room?.data?.data?.rooms?.id) {
    setUserId(userId)
  //console.log(formJoin,'formJoin')
    auth.signin({
      id : userId,
      username : formJoin.username,
      tenant_id:tenant_id,
      room_id:room.data.data.rooms.id
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
        setLoading(false);
    
      } else {
          setFormJoin({
            ...formJoin,
            username: formJoin.username,
            user_id: userId,
          })
          dispatch(wsJoinRoom({
            tenant_id : tenant_id,
            room_uri : room_uri,
            room_id : null,
            user_id : userId,
            username : formJoin.username,
            user_type : formJoin.user_type,
            terminal_type : formJoin.terminal_type,
            name_type : formJoin.name_type,
            temporary : data?.data?.temporary_room ? data?.data?.temporary_room : false
          }));
          dispatch(wsSend({
            type : "user-login",
            data: {
              tenant: tenant_id,
              userId: userId,
              userType : 'student'
            }
          }));
      }
    });
    }
  }

  const responseGoogle = async (codeResponse) => {
    const tokens = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${codeResponse.access_token}`);

    if(tokens?.data){
      const response = tokens?.data;

      const user_id = getUuidByString(response?.email)
      const payloadAccount = {
        ...formJoin,
        user_id: user_id,
        email: response?.email,
        name : response?.name,
        username: response?.name ? response?.name : response?.email,
      };
      
      dispatch(setAccountOpenID(payloadAccount));
      storeLog({
        status: "success",
        action: "[student/join_room_by_google]",
        data: JSON.stringify(payloadAccount),
      });
      navigate("/student/join-confirm");
    }
  }

  const responseMs = (err, data) => {
    if (data?.account && data?.account?.idTokenClaims) {
      const sessionStorage = window.sessionStorage;
      sessionStorage.clear();
      const user_id = getUuidByString(data?.account?.idTokenClaims?.email)
      const payloadAccount = {
        ...formJoin,
        user_id: user_id,
        email: data?.account?.idTokenClaims?.email,
        name : data?.account?.name,
        username: data?.account?.name ? data?.account?.name : data?.account?.idTokenClaims?.email,
      };
      
      dispatch(setAccountOpenID(payloadAccount));
      storeLog({
        status: "success",
        action: "[student/join_room_by_microsoft]",
        data: JSON.stringify(payloadAccount),
      });
      navigate("/student/join-confirm");
      // handleSignStudent(payloadAccount)
    } else {
      storeLog({
        status: "error",
        action: "[student/join_room_by_microsoft]",
        data: JSON.stringify(err),
      });
    }
  };

  useEffect(()=>{
    if(websocket.socket_id){
      setTimeout(() => {
        dispatch(wsSend({
          type : "get-quota-tenant",
          data: {
            tenant: tenant_id,
            messageType:'student'
          }
        }));
      }, 100);
    }
  },[websocket.socket_id])

  useEffect(() => {
    
    setFormJoin({
      ...formJoin,
      name_type: LINKAGE_NAME_TYPE.filter((item)=>item.value == auth.tenants?.data?.data?.linkage_type)[0].name,
    })
    
  }, [auth.tenants]);

  const LoginOIDC = () => {
    
    return (
      <div className="md:items-center">    
      
        <div
          className="flex items-center justify-center"
          style={{ marginTop: "20px" }}
        >
          {t("alert.text.join_with_other_account")}
        </div>                       
      {/* <button onClick={()=>responseGoogle({access_token : "ya29.a0Ael9sCOmQZd6oeUoQmzRx0FZvPstTY-gchh3J4t8ROt_qjEAEIROr3HKrilmH2OqTLnS4ng4JgkCNoD9iCIgNnwzIN3uU1vzRzQabGpFREBPsxm-w2lpRLAsywD62xbvbcGKwmZ-M7GINKveaBc0iCd0RrcRFgaCgYKAQQSARISFQF4udJhnK_6VRga8T7Lenjkap235A0165"})}
      ></button> */}

      
        <div
          className="flex justify-evenly md:items-center mt-4"
        >
          {auth.tenants?.data?.data?.google_client_id && (<div>
            <GoogleOAuthProvider clientId={auth.tenants?.data?.data?.google_client_id}>
              <GoogleLoginButton onSuccess={responseGoogle} />
            </GoogleOAuthProvider></div>
          )}

          {auth.tenants?.data?.data?.microsoft_client_id && (
            <MicrosoftLogin
              clientId={auth.tenants?.data?.data?.microsoft_client_id}
              redirectUri={`${window?.location?.origin}${import.meta.env.VITE_BASE_PATH}`.slice(
                0,
                -1
              )}
              graphScopes={["user.read", "openid", "email", "profile"]}
              authCallback={(err, data) => responseMs(err, data)}
            >
              <button
                type="button"
                className="w-full mt-4 ml-2 mr-2 focus:shadow  focus:outline-none border border-grey-500 text-gray-700 text-sm font-bold p-3 rounded"
              >
                <div className="flex items-center justify-center">
                  <FontAwesomeIcon icon="fa-brands fa-windows" className="text-2xl ml-2 mr-5 text-cyan-500" />
                  <span className="text-center">
                    {ReactHtmlParser(t("btn.btn_microsoft"))}
                  </span>
                </div>
              </button>
            </MicrosoftLogin>
          )}
        </div>
      </div>
    )
  }
  const LoginLocal = () => {
    return (
      <form
        className="w-full max-w-lg"
        id="student_register"
        onSubmit={(e) => submitHandler(e)}
      >
        {!room_uri && (
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full px-3">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                htmlFor="room_name"
              >
                {t("form.field.room_name")}
              </label>
              <input
                name="room_name"
                className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                id="room_name"
                value={formJoin?.room_name ? formJoin.room_name : ""}
                onChange={(e) =>
                  setFormJoin({
                    ...formJoin,
                    room_name: e.target.value,
                  })
                }
                type="text"
              />
              <p className="text-gray-600 text-xs italic">
                {t("alert.text.filed_must_alfanum")}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap -mx-3 mb-3">
          <div className="w-full px-3">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="username"
            >
              {t("form.field.student_name")}
            </label>
            <div className="">
              <input
                name="student_name"
                className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                id="username"
                value={formJoin.username}
                onChange={(e) =>
                  setFormJoin({ ...formJoin, username: e.target.value })
                }
                maxLength="20"
                type="text"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center md:items-center">
          <div className="sm:w-full">
            <button
              className="shadow w-full mb-3 bg-gradient-to-r from-cyan-500 to-sky-600 bor focus:shadow-outline focus:outline-none text-white font-bold py-4 px-4 rounded-full"
              type="submit"
            >
              {t("btn.btn_join")}
            </button>
          </div>
        </div>
      </form>
    )
  }
  return (
    <>
      
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-2xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-sky-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md min-w-full mx-auto" style={{width:'28rem'}}>
              <div className="mb-4">
                <img
                  style={{ margin: "0 auto" }}
                  src={studentIcon}
                  className="h-28 sm:h-28"
                  alt=""
                />
              </div>
              
              {LoginLocal()}
              
              {auth.tenants?.data?.data?.linkage_type == 'oidc' ? LoginOIDC() : null }

              <div className="flex justify-center md:items-center">
                  {(room?.data?.data?.tenants?.limit == 1)?
                    <div className="mt-4 items-center">
                      <small>{t('alert.text.total_active_user')} {activeUser}/{room?.data?.data?.tenants?.user_limit}</small>
                    </div>:''
                  }
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
      <Alert handleChange={alert.action.handleChange} onBtnTrueHandler={alert.action.onBtnTrueHandler} alert={alert} />
    </>
  );
};

export default LoadingHoc(JoinRoom);

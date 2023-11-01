import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GoogleOAuthProvider } from '@react-oauth/google';

import MicrosoftLogin from "react-microsoft-login";
import { useFormik } from "formik";
import * as Yup from "yup"
import ReactHtmlParser from "html-react-parser";

import LoadingHoc from "../../hocs/LoadingHoc";
import Alert from "../../components/common/Alert"
import { useAuth } from "../../hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Footer from "../../components/Layout/Footer";
import { setWsRoomId, wsSend } from "../../store/redux/websocket/actions";
import { joinRoom } from "../../store/features/monitoringSlice";
import moment from 'moment';
import GoogleLoginButton from "../../components/common/GoogleLoginButton";
import axios from "redaxios";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useGetDataQuery } from "../../store/services/request";

const LoginTeacher = ({setLoading}) => {

  const auth = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const params = useLocation();
  const assistant = useSelector((state)=>(state.assistant))
  const subdomain = (/:\/\/([^\/]+)/.exec(window.location.href)[1]).split('.')[0];
  const monitoring = useSelector((state)=>state.monitoring);
  const [activeUser, setActiveUser] = useState(0)
  const websocket = useSelector((state) => state.websocket);
  const [expired, setExpired] = useState(false)

  const [tenantData, setTenantData, removeTenantData] = useLocalStorage('tenantData', null);

  useEffect(() => {
    setTenantData(auth.tenants)
  }, [auth.tenants]);
  
  useEffect(()=>{
    if(tenantData && tenantData.data && tenantData?.data?.data?.limit == 1){
      dispatch(wsSend({
        type : "get-quota-tenant",
        data: {
          tenant: tenantData.data.data.id
        }
      }));
    }
  }, [tenantData])

  const roomId = useMemo(() => {
    const searchParams = new URLSearchParams(params.search);
    return searchParams.get('roomId');
  }, [location.search]);

  
  const roomData = useGetDataQuery({
    endpoint: 'rooms/roomId/'+roomId,
    params: {
      tenant_id : tenantData.data.data.id
    }
  },{
    skip : !roomId || !tenantData?.data?.data?.id
  });

  useEffect(() => {
  //console.log(roomData)
    if(roomData?.status == "fulfilled" && !roomData?.data?.data){
      setAlert({
        isOpen: true,
        title: t("alert.name"),
        excerpt: t('alert.text.room_not_exists'),
      });
    }

    if(roomData?.isSuccess && roomData?.data?.data?.rooms?.expiredAt)
    checkExpired()
  }, [roomData])

  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    excerpt: "",
    confirm: {
      status: false,
      labelBtnTrue: "",
      labelBtnfalse: "",
    },
  });
  
  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema: Yup.object().shape({
      username: Yup.string()
      .required(t('validation.userid_required')),
      password: Yup.string()
      .required(t('validation.password_required'))
    }),
    onSubmit: values => {
      if(expired){
        setAlert({
          isOpen: true,
          title: t('alert.text.room_is_expired'),
          excerpt: (t('alert.text.expired_at')).replace('{value}',moment(roomData.data.data.rooms.expiredAt).format('YYYY/MM/DD')),
        });
      } else {
        loginProccess()
      }
    }
  });

  const checkExpired = () => {
  //console.log('expired di cek')
    let expiredDate = moment(roomData?.data?.data?.rooms?.expiredAt);
    let today = moment().startOf('day');
    if(today.isAfter(expiredDate))
      setExpired(true)
  }

  const showAlertFull = (len) => {
    setLoading(false);
    setAlert({
      isOpen: true,
      title: t('alert.text.room_is_full2'),
      excerpt: t('alert.text.total_active_user')+" : "+len+"/"+tenantData?.data?.data?.user_limit,
    });
  }

  useEffect(()=>{
    if(monitoring.userTenant != null){
      var len = monitoring?.userTenant?.length; 
      setActiveUser(len)
    }
  },[monitoring.userTenant])

  const afterSuccessValidation = ()=>{
      let valid = true
      if(tenantData?.data?.data?.limit != 0){
        valid = false
        var len = monitoring?.userTenant?.length; 
        if(len >= tenantData?.data?.data?.user_limit){
          showAlertFull(len)
        } else {
          valid = true
        }
      }
      
      return valid
  }

  const loginProccess = () =>{
    setLoading(true)
    const authParams = formik.values;
    if (roomId) {
      authParams.room_id = roomId;
    }
    auth.signin(authParams, 'teacher', ({data,error}) => {
      setLoading(false);
      handleLoginResponse(data,error)
    }, afterSuccessValidation);
  }

  const handleLoginResponse = (data,error) => {
    
    if(error){
      var message = (error.data?.code && error.data?.code ==401)? auth.tenants?.data?.data?.linkage_type == 'oidc' ? t("alert.text.unauthorized_oidc") : t("alert.text.unauthorized") :error.data?.error_code ? t(`${error.data?.error_code}`) : error.data?.message;
      setAlert({
        isOpen: true,
        title: t("alert.name"),
        excerpt: message,
      });
    }
    if(data){
    //console.log('user-login','Login Teacher')
      dispatch(wsSend({
        type : "user-login",
        data: {
          tenant: tenantData?.data?.data?.id,
          userId: data.data.id,
          userType : 'teacher'
        }
      }));
      if(roomData && roomData?.data && roomData?.data?.data){  
        var send = {
          quota: (roomData?.data?.data?.tenants?.limit)?roomData?.data?.data?.tenants?.user_limit:'unlimited',
          tenant_id: data.data.tenant_id,
          teacher_id: data.data.id,
          user_id: data.data.id,
          username: data.data.username,
          user_type: data.data.role,
          room_id: roomData?.data?.data?.rooms.id,
          room_name: roomData?.data?.data?.rooms.name,
          room_uri: roomData?.data?.data?.rooms.uri,
          temporary: roomData?.data?.data?.rooms?.temporary ? roomData?.data?.data?.rooms.temporary : false,
          studentURL: { qrcode: "", url: roomData?.data?.data?.rooms?.link?.replace('{user_type}','student') },
          assistantURL: { qrcode: "", url: roomData?.data?.data?.rooms?.link?.replace('{user_type}','assistant') }
        }
        
        localStorage.setItem('assistantRoom', JSON.stringify(send));

        dispatch(wsSend({
          type : "fetch_room",
          tenant_id : data.data.tenant_id,
          room_id : roomData.data.data.rooms.id
        }));
        
        dispatch(joinRoom(send))
        dispatch(setWsRoomId(null))
        setTimeout(() => {
          navigate(`/assistant/join-room/${data.data.tenant_id}/${roomData?.data?.data?.rooms?.uri}`)
       }, 100);
      }else{
        navigate(`/teacher`)
      }
      
    }
  }
 
  const handleResetAlert = () => {
    setAlert({
      isOpen: false,
      title: "",
      excerpt: "",
      confirm: {
        status: false,
        labelBtnTrue: "",
        labelBtnfalse: "",
      },
    });
  };

  const responseGoogle = async (codeResponse) => {
    const tokens = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${codeResponse.access_token}`);
    if(tokens?.data){
      const response = tokens?.data;
      setLoading(true)
      const authParams = {email:response?.email, open_id:true};
      if (roomId) {
        authParams.room_id = roomId;
      }
      auth.signin(authParams, 'teacher', ({data,error}) => {
        setLoading(false)
        handleLoginResponse(data,error)
      },afterSuccessValidation);
    }
  }

  const responseMs = (err, data, msal) => {
    if (data?.account && data?.account?.idTokenClaims) {
      const sessionStorage = window.sessionStorage;
      sessionStorage.clear();
      setLoading(true)
      const authParams = {email:data?.account?.idTokenClaims?.email, open_id:true};
      if (roomId) {
        authParams.room_id = roomId;
      }
      auth.signin(authParams, 'teacher', ({data,error}) => {
        setLoading(false)
        handleLoginResponse(data,error)
      },afterSuccessValidation);
    }
  };

  const LoginOIDC = () => {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-2xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md w-96 min-w-full mx-auto">
            
              <div className="w-full max-w-lg">
                <h1 className="text-3xl font-bold py-5 text-center text-gray-900">{t('teacher.login.title')}</h1>
              </div>
            
              <div className="md:items-center">
                  {/* <button onClick={()=>responseGoogle({access_token : "ya29.a0Ael9sCONFWyQzh7FSt0bH3no_T6lFoyS0L63LADSmJBOCf_L4P5KCEt-fkfZTz68msPPKmbrFXfCst7cS9DQQ95-Glw9KSQ0mEwpUpVaZl3WGKWNua012OArRZa58JpVMMQW-RPYZaxpFbU7t2RJiNDDsx91CgaCgYKAT8SARISFQF4udJhdrSKIAqbgKWn-8ytRz6VPg0165"})}
                  >LOGIN GOOGLE</button>
                  <br></br>
                  <button onClick={()=>responseGoogle({access_token : "ya29.a0Ael9sCMxxOs5_Q5Wxh0W7ekjYa5kyk5LBWUyuWClf_cKXBm4QTbmIhbfXs6xhWNzFes8U_1yxV5xesu9o7gdifH1hRLRUkY4HMNGe2MS1AJM-XHs1TGs-UfGLC2olHqCugRqbcuptX4eWfFL3ZAVvezJRpoMXgaCgYKAaUSARISFQF4udJh0z9Jk48LoL-TeFD-iPaLtg0165"})}
                  >LOGIN GOOGLE Student</button>
                  <br></br>                 
                  <button onClick={()=>responseGoogle({access_token : "ya29.a0Ael9sCMuHHhAJETvBEfuqy2lG8djSq9M785eautlj5JvALMK6i8rkbAn_XHCMjM3yCU_-8zsWl14BNFoqMRZ8oVv5SAvXClNtCTKkTBjbD1Tjn0HAKnN5Sm7hNYj43B0hDkF0dFGwDKGHyGn8kl0MXKOyhQ36gaCgYKAZESARMSFQF4udJhstkqE0MzqHGaqPkDKk_Rmg0165"})}
                  >LOGIN GOOGLE Student</button>
                  <br></br> */}
                {auth.tenants?.data?.data?.google_client_id && (
                  <GoogleOAuthProvider clientId={auth.tenants?.data?.data?.google_client_id}>
                    <GoogleLoginButton onSuccess={responseGoogle} />
                  </GoogleOAuthProvider>
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
                    className="w-full mt-4 ml-2 mr-2 focus:shadow focus:outline-none border border-grey-500 text-gray-700 text-sm font-bold py-3 rounded"
                  >
                    <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon="fa-brands fa-windows" className="text-2xl ml-2 mr-5 text-cyan-500"/>
                      <span className="text-center">
                        {ReactHtmlParser(t("btn.btn_microsoft"))}
                      </span>
                    </div>
                  </button>
                </MicrosoftLogin>
                )}

                {(tenantData?.data?.data?.limit == 1)&&
                  <div className="items-center text-center">
                    <br />
                    <small>{t('alert.text.total_active_user')} {activeUser}/{tenantData?.data?.data?.user_limit}</small>
                  </div>
                }
                </div>

            
            </div>
          </div>
        </div>
      </div>)
  }

  const LoginLocal = () => {
    return (
      
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-2xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md w-96 min-w-full mx-auto">
            
              <div className="w-full max-w-lg">
                <h1 className="text-3xl font-bold py-5 text-center text-gray-900">{t('teacher.login.title')}</h1>
              </div>
            
              <form
                className="w-full max-w-lg"
                id="teacher-login-form"
                onSubmit={formik.handleSubmit}
              >
            
                <div className="flex flex-wrap -mx-3 mb-6">
                  <div className="w-full px-3">
                    <label
                      className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                      htmlFor="username"
                    >
                      {t('teacher.login.userid')}
                    </label>
                    <input
                      className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      id="username"
                      type="text"
                      {...formik.getFieldProps('username')}
                    />
                    {formik.errors.username && formik.touched.username && (<i className="text-red-500">{formik.errors.username}</i>)}
                  </div>
                </div>
                
                <div className="flex flex-wrap -mx-3 mb-3">
                  <div className="w-full px-3">
                    <label
                      className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                      htmlFor="password"
                    >
                      {t('teacher.login.password')}
                    </label>
                      <input
                        className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="password"
                        type="password"
                        {...formik.getFieldProps('password')}
                      />
                      {formik.errors.password && formik.touched.password && (<i className="text-red-500">{formik.errors.password}</i>)}
                    
                  </div>
                </div>

                <div className="flex justify-center md:items-center text-center">
                  <div className="sm:w-full">
                    <button
                      className="shadow w-96 mb-3 bg-gradient-to-r from-teal-600 to-teal-400 bor focus:shadow-outline focus:outline-none text-white font-bold py-4 px-4 rounded-full"
                      type="submit"
                    >
                      {t('teacher.login.btn_sign_in')}
                    </button>
                    {
                    (tenantData?.data?.data?.limit == 1)&&
                      <div className="items-center">
                        <br />
                        <small>{t('alert.text.total_active_user')} {activeUser}/{tenantData?.data?.data?.user_limit}</small>
                      </div>
                    }
                  </div>
                </div>

                
              </form>

            
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      
      {auth.tenants?.data?.data?.linkage_type == 'oidc' ? LoginOIDC() : null }
      {auth.tenants?.data?.data?.linkage_type == 'local' ? LoginLocal() : null }

      
      <Footer />
      <Alert handleChange={handleResetAlert} alert={alert} />
    </>
  );
}

export default LoadingHoc(LoginTeacher);

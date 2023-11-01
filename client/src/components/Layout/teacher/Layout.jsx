import { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import LoadingHoc from "../../../hocs/LoadingHoc";
import { useAuth } from "../../../hooks/useAuth";
import Navbar from "./Navbar";
import TopBar from "./TopBar";

import Alert from "../../common/Alert"
import { closeAlert, showAlert, initAlert } from "../../../store/features/alertSlice";
import { leaveRoom } from "../../../store/features/monitoringSlice";
import { wsLeaveRoom, wsSend } from "../../../store/redux/websocket/actions";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import Footer from "../Footer";
import { setUserReset, setWatchingType } from "../../../store/redux/watching/actions";

const AdminLayout = ({setLoading}) => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location  = useLocation()

  const auth = useAuth()
  const [title, setTitle] = useState('');
  const [topBarComponent, setTopBar] = useState('');
  const [lastPath, setLastPath] = useState('');
  
  const alert = useSelector((state) => state.alert)
  
  useEffect(() => {
    dispatch(initAlert({
      ...alert, action : {
        ...alert.action , 
        handleChange : ()=>dispatch(closeAlert()),
      }
    }))    
  }, []);


  const logoutAction = () => {
    setLoading(true);
    var userId = auth.user.data.id
  //console.log(auth.user)
    auth.signout(({data,error}) => {
      dispatch(wsSend({
        type : "remove-quota-tenant",
        data: {
          tenant: auth.user.data.tenant_id,
          userId: userId,
          userType: 'teacher'
        }
      }));
      localStorage.removeItem('assistantRoom');
      setLoading(false)
      navigate("/teacher/login", { replace: true });
    });    
  }

  const onLeaveRoom = () => {
    dispatch(setWatchingType("watching"));
    dispatch(setUserReset());
    const roomData = JSON.parse(localStorage.getItem('roomData'))
    dispatch(wsLeaveRoom(roomData));
    dispatch(leaveRoom());
    dispatch(closeAlert());
    setTopBar('')
    if(location.pathname === "/assistant/monitoring"){
      navigate(0);
    }
  };

  const fullName = [auth.user?.data?.first_name,auth.user?.data?.middle_name,auth.user?.data?.last_name]
  
  return (
    <div>
      <Navbar title={auth.tenants?.data?.data?.linkage_type == 'oidc' || auth.tenants?.data?.data?.linkage_type == 'local' ? fullName.join(' ') : auth.user?.data?.username} logoutAction={logoutAction} />
      <TopBar title={title}>
        {topBarComponent}
      </TopBar>
      <Outlet context={{setTitle,setTopBar}} logoutAction={logoutAction} />
      <Footer hide={auth.user} />
      <Alert handleChange={alert.action.handleChange} onBtnTrueHandler={alert.action.onBtnTrueHandler} alert={alert} />
      
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick={false}
        closeButton={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        bodyClassName="text-sm"
      />
    </div>
  );
}

export default LoadingHoc(AdminLayout)

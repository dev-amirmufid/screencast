import { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import LoadingHoc from "../../../hocs/LoadingHoc";
import { useAuth } from "../../../hooks/useAuth";
import Navbar from "./Navbar";
import TopBar from "./TopBar";

import Alert from "../../common/Alert"
import Footer from "../Footer";

import { closeAlert, showAlert, initAlert } from "../../../store/features/alertSlice";

const AdminLayout = ({setLoading}) => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useAuth()
  const [title, setTitle] = useState('');
  const [topBarComponent, setTopBar] = useState('');
  
  const alert = useSelector((state) => state.alert)
  
  const logoutAction = () => {
    setLoading(true);
    auth.signout(({data,error}) => {
      setLoading(false)
      navigate("/admin/login", { replace: true });
    });    
  }

  useEffect(() => {
    dispatch(initAlert({
      ...alert, action : {
        ...alert.action , 
        handleChange : ()=>dispatch(closeAlert()),
      }
    }))
    
  }, []);

  return (
    <div>
      <Navbar title={auth.user?.data?.username} logoutAction={logoutAction} />
      <TopBar title={title}>
        {topBarComponent}
      </TopBar>
      <Outlet context={{setTitle, setTopBar}} logoutAction={logoutAction} />
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

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useOutletContext } from "react-router-dom";

import {
  wsConnect,
  wsDisconnect,
  wsDisconnected,
  wsSetStatus,
  wsSetAutoReconnect,
  wsSend,
} from "../store/redux/websocket/actions";

import { showAlert, closeAlert } from "../store/features/alertSlice";

import { useTranslation } from "react-i18next";
import LoadingHoc from "./LoadingHoc";

import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCheckSubDomainQuery } from "../store/services/tenants";


const WebSocketHoc = ({setLoading}) => {
  const context = useOutletContext()
  const navigate = useNavigate()
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const wsStatus = useSelector((state) => state.websocket.status);
  const socket_message = useSelector((state) => state.socket_message);
  const {signout} = useAuth()
  const tenants = useCheckSubDomainQuery();

  const url = window.location.pathname;
  
  useEffect(() => {
    setLoading(true);
    if(tenants?.isSuccess){
      if(url && tenants?.data?.data?.id){
        dispatch(wsConnect({
          subdomain : tenants?.data?.subdomain,
          tenant_id : tenants?.data?.data?.id
        }));
      } else if(tenants?.data?.subdomain == import.meta.env.VITE_SUBDOMAIN_ADMIN){
        dispatch(wsConnect({
          subdomain : tenants?.data?.subdomain,
          tenant_id : null
        }));
      }
      setLoading(false);
    }
  }, [url,tenants]);

  useEffect(() => {
  // console.log(wsStatus,'wsStatus')
    if (wsStatus === "connecting") {
      setLoading(true);
    } else {
      if (wsStatus === "disconnect") {
        dispatch(closeAlert());
        setLoading(true);
        setTimeout(() => {
          dispatch(showAlert({
            title : t("alert.text.disconect_websocket_title"),
            excerpt : t("alert.text.disconect_websocket_subtitle"),
            labelBtnClose: t('alert.ok'),
            action : {
              handleChange : handleReconnct
            }
          }))
          setLoading(false);
        }, 5000);
      } else if (wsStatus === "connected") {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatus]);

  useEffect(() => {
    switch(socket_message.messageType){
      case 'admin' : 
        switch(socket_message.type){
          case 'user_connected':
            // console.log('user_connect')
            break;
            case 'kick_user':
            dispatch(showAlert({
              title : t("alert.name"),
              excerpt : t("alert.text.on_deleted_admin_user"),
              labelBtnClose: t('alert.ok'),
              action : {
                handleChange : () => {
                  setLoading(true);
                  signout(({data,error}) => {
                    setLoading(false);
                    navigate("/admin/login", { replace: true });
                    window.location.reload();
                  });   
                }
              }
            }))
          break;
        }
      break;
    }
  }, [socket_message]);

  const handleReconnct = async () => {
    // console.log('reconect')
    dispatch(closeAlert())
    window.location.reload();
  };
  
  return (
    <Outlet context={context} />
  );
};

export default LoadingHoc(WebSocketHoc);

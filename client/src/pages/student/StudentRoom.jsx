import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { wsJoinRoom, wsLeaveRoom, wsSend } from "../../store/redux/websocket/actions";
import {
  fetchRoom,
  handleMute,
  removeRoom,
  start,
  forceWatchingStop
} from "../../store/redux/studentRoom/actions";
import browserDetect from "../../helpers/browserDetect";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { storeLog } from "../../store/redux/log/actions";
import "./styles.css";
import recordIcon from "../../assets/images/record.png";
import Alert from "../../components/common/Alert";
import Footer from "../../components/Layout/Footer";
import { useNavigate } from "react-router-dom";
import { showAlert,closeAlert } from "../../store/features/alertSlice";
import { LINKAGE_NAME_TYPE } from "../../constant/constant";
import { useAuth } from "../../hooks/useAuth";

const StudentRoom = (props) => {
  const navigate = useNavigate()
  const wsStatusConnect = useSelector((state) => state.websocket.connected);
  const wsStatusReconnect = useSelector((state) => state.websocket.reconnected);
  const audioEnabled = useSelector((state) => state.studentRoom.audioEnabled);
  const audioMute = useSelector((state) => state.studentRoom.mute);
  const isShareScreen = useSelector((state) => state.studentRoom.isShareScreen);
  const isWatching = useSelector((state) => state.studentRoom.isWatching);
  const roomStatus = useSelector((state) => state.studentRoom.roomStatus);
  const isTimeOut = useSelector((state) => state.studentRoom.isTimeOut);
  const studentRoom = JSON.parse(localStorage.getItem("studentRoom"));
  const dispatch = useDispatch();
  const browser = browserDetect();
  const ssStopped = useSelector((state) => state.studentRoom.ssStopped);
  const socket_room_id = useSelector((state) => state.websocket.socket_room_id);
  const alert = useSelector((state) => state.alert);
  const {tenants} = useAuth()


  useEffect(() => {
    if (isTimeOut) {
      dispatch(showAlert({
        isOpen: true,
        hideTitle: true,
        title: t("alert.name"),
        excerpt: t("alert.text.room_time_out"),
        action : {
          onBtnTrueHandler : () => handleRefresh(),
          handleChange : () => leaveRoom()
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioMute, isTimeOut]);

  useEffect(() => {
    if (studentRoom) {
      if (roomStatus === "exist") {
        if (wsStatusConnect) {
          dispatch(wsJoinRoom({
            tenant_id : studentRoom.tenant_id,
            room_id : studentRoom.room_id,
            user_id : studentRoom.user_id,
            username : studentRoom.username,
            user_type : studentRoom.user_type,
            temporary : studentRoom.temporary ? studentRoom.temporary : false ,
            terminal_type: navigator?.platform,
            name_type: LINKAGE_NAME_TYPE.filter((item)=>item.value == tenants?.data?.data?.linkage_type)[0].name
          }));
        }else if(isWatching){
          dispatch(forceWatchingStop());
        }
      }
    } else {
      window.location.href = `${import.meta.env.VITE_BASE_PATH}student/leave-room`;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatusConnect, roomStatus]);

  useEffect(() => {
    if(socket_room_id) {
      if (socket_room_id == "room_not_found" || socket_room_id == "leave_room") {
        forceLeaveRoom()
      } else {
        dispatch(fetchRoom());
        
        if (browser !== "firefox" && browser !== "safari" && !isShareScreen) {
          dispatch(start());
        }

        storeLog({
          status: "success",
          action: "[student/room_exist]",
          data: JSON.stringify(studentRoom),
        });
      } 
    }
      
  }, [socket_room_id]);

  useEffect(() => {
    if (wsStatusReconnect) {
      setTimeout(function() {
        // wsUserConnected();
      }, 1000); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatusReconnect]);

  useEffect(() => {
    if(ssStopped){
      dispatch(showAlert({
        ...alert,
        isOpen: true,
        hideBtnOk: true,
        title: t("alert.name"),
        excerpt: t("alert.text.stop_ss_confirm"),
        confirm: {
          status: true,
          labelBtnTrue: t("btn.btn_yes"),
          labelBtnfalse: t("btn.btn_alert_leave_room"),
        },
        action : {
          onBtnTrueHandler : () => handleRefresh(),
          handleChange : () => leaveRoom()
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ssStopped]);

  const { t } = useTranslation();

  const handleMuteBtn = async () => {
    dispatch(handleMute());
  };

  const handleRefresh = () => {
    dispatch(closeAlert());
    window.location.reload();
  };

  const leaveRoom = () => {
    dispatch(wsLeaveRoom(studentRoom))
    dispatch(forceWatchingStop());
    localStorage.removeItem("studentRoom");
    localStorage.removeItem("loginSession");
    localStorage.removeItem("login");
    // navigate(`/student/leave-room`);
    window.location.href = `${import.meta.env.VITE_BASE_PATH}student/leave-room`;
  };

  const forceLeaveRoom = () => {
    dispatch(wsLeaveRoom(studentRoom))
    dispatch(forceWatchingStop());
    localStorage.removeItem("studentRoom");
    localStorage.removeItem("loginSession");
    localStorage.removeItem("login");
    // navigate(`/student/leave-room`);
    window.location.href = `${import.meta.env.VITE_BASE_PATH}student/leave-room/force`;
  };

  let btnShare;
  let btnShareText;
  if (browser === "firefox" || browser === "safari") {
    btnShare = (
      <button
        className="w-70 px-2 object-center bg-green-500 text-white h-9 rounded-md border ml-2"
        type="button"
        id="btn_share"
        onClick={() => dispatch(start())}
      >
        {t("btn.btn_share_screen")}
      </button>
    );

    btnShareText = (
      <div className="mt-4 text-white">{t("alert.text.share_sreen_text")}</div>
    );
  }
  
  return (
    <>
      <div className="fixed z-10 inset-0 overflow-y-auto" style={{zIndex:1350}}>
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
          <div className="relative py-3 sm:max-w-6xl sm:mx-auto">
            <div className="ss-overlay">
              {isShareScreen && (
                <div className="ss-overlay-text">
                  {t("ss_overlay_message")}
                </div>
              )}
            </div>
            <div className="container mx-auto text-center mb-1">
              <div className="md:flex">
                <div className="md:w-1/2 text-left font-bold">
                  {studentRoom?.username}
                </div>
                {isWatching && (
                  <div className="md:w-1/2 text-right font-bold text-red-500">
                    <div className="float-right blink">
                      <img
                        className="float-left w-6"
                        src={recordIcon}
                        alt="test"
                      />
                      <div className="float-left">
                        {t("alert.text.teacher_watching")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="container mx-auto bg-black mb-4 relative">
              {!isShareScreen && (
                <div className="screen-share-btn">
                  {btnShare}
                  {btnShareText}
                </div>
              )}
              <video
                id="localVideo"
                style={{ minWidth: "600px" }}
                playsInline
                autoPlay
                muted
              ></video>
              <div className="student-video-toolbar">
                {audioEnabled && (
                  <button
                    id="btn_toggle_audio"
                    className={`w-10 object-center text-white h-9 rounded-md ${
                      audioMute ? "muted" : ""
                    }`}
                    type="button"
                    onClick={() => handleMuteBtn()}
                  >
                    <FontAwesomeIcon
                      icon={`fa-solid ${audioMute ? "fa-microphone-slash" : "fa-microphone"}`}
                    ></FontAwesomeIcon>
                  </button>
                )}
              </div>
            </div>
            <div className="container mx-auto text-center">
              <button
                className="w-40 object-center bg-red-500 text-white h-9 rounded-md border"
                type="button"
                id="btn_leave"
                onClick={() => {
                  dispatch(showAlert({
                    ...alert,
                    isOpen: true,
                    hideBtnOk: true,
                    title: t("alert.name"),
                    excerpt: t("alert.text.stop_ss_confirm"),
                    confirm: {
                      status: true,
                      labelBtnTrue: t("btn.btn_yes"),
                      labelBtnfalse: t("btn.btn_alert_leave_room"),
                    },
                    action : {
                      onBtnTrueHandler : () => handleRefresh(),
                      handleChange : () => leaveRoom()
                    }
                  }));
                }}
              >
                {t("btn.btn_leave")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <canvas
        id="canvas"
        style={{ overflow: "auto", display: "none" }}
      ></canvas>
      {/* <Alert
        handleChange={leaveRoom}
        onBtnTrueHandler={handleRefresh}
        alert={alert}
      /> */}
      
      <Footer className="footer-top-show"/>
      <Alert handleChange={alert.action.handleChange} onBtnTrueHandler={alert.action.onBtnTrueHandler} alert={alert} />
    </>
  );
};

export default StudentRoom;

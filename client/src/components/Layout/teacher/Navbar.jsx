import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Alert from "../../common/Alert";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomAssistant } from "../../../store/features/assistantSlice"
import { useTranslation } from "react-i18next";
import { closeAlert, showAlert, initAlert } from "../../../store/features/alertSlice";
import { joinRoom, leaveRoom } from "../../../store/features/monitoringSlice";
import { setWsRoomId, wsLeaveRoom, wsSend } from "../../../store/redux/websocket/actions";
import TopBar from "./TopBar";
import { useAuth } from "../../../hooks/useAuth";
import TeacherNavlink from "../../common/TeacherNavlink";

const Navbar = ({ title, logoutAction }) => {
  const dispatch = useDispatch()
  const { t } = useTranslation();
  const navigate = useNavigate()
  const location  = useLocation()
  const {tenants} = useAuth();
  const [assistantRoomData, setAssistantRoomData] = useLocalStorage('assistantRoomData', null)
  const [assistantRoom, setAssistantRoom] = useLocalStorage('assistantRoom', null)
  const [storageRoom, setStorageRoom] = useState(null)
  const socket_room_id = useSelector((state) => state.websocket.socket_room_id)
  const isAssistant = useSelector((state) => state.assistant.isAssistant)
  const [goNext, setGoNext] = useState(false)
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    excerpt: "",
  });

  const onLeaveRoom = () => {
    const roomData = JSON.parse(localStorage.getItem('roomData'))
    dispatch(leaveRoom());
    dispatch(wsLeaveRoom(roomData));
    dispatch(closeAlert());
    setTimeout(() => {
      dispatch(setWsRoomId(null))
    }, 1000);
  };

  const handleButtonRoom = (e) => {
    e.preventDefault();

    if(location.pathname !='/teacher/room-management'){
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt: t("alert.text.leave_room_confirm"),
        confirm: {
          status: true,
          labelBtnTrue: t("btn.btn_yes"),
          labelBtnfalse: t("btn.btn_no"),
        },
        action : {
          onBtnTrueHandler : onLeaveRoom,
          handleChange : () => dispatch(closeAlert())
        }
      }))
    }
  }

  const classNavButton = {
    active: "bg-teal-700 mr-3 shadow focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded",
    normal: "bg-gradient-to-r from-white to-gray-200 mr-3 shadow focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
  }

  const handleLogout = () => {
    dispatch(showAlert({
      title: t("alert.name"),
      excerpt: t("alert.text.logout_confirm"),
      confirm: {
        status: true,
        labelBtnTrue: t("btn.btn_logout"),
        labelBtnfalse: t("btn.btn_cancel"),
      },
      action : {
        onBtnTrueHandler : () => {
          onLeaveRoom();
          logoutAction();
        },
        handleChange : () => dispatch(closeAlert())
      }
    }))
  }

  const handleCloseAlert = () => {
    setAlert({
      isOpen: false,
      title: "",
      excerpt: "",
      confirm: {
        status: false, 
        labelBtnTrue: "", 
        labelBtnfalse: ""
      }
    });
  };

  useEffect(() => {
    dispatch(fetchRoomAssistant())
  }, []);

  const handleAssistantJoin = (e) => {
    e.preventDefault();
    dispatch(joinRoom(assistantRoom))
    dispatch(setWsRoomId(null))
    setTimeout(() => {
      navigate("/assistant/monitoring", { replace: false });
    }, 100);
  }

  return (
    <>
      <nav
        className="bg-gradient-to-r from-teal-600 to-teal-400 shadow"
        role="navigation"
      >
        <div className="p-2 flex flex-wrap items-center md:flex-no-wrap">
          <div className="mr-4 md:mr-8 text-2xl text-white truncate teacher-title">
              {title} 
          </div>
          <div className="w-full md:w-auto md:flex-grow md:flex md:items-center">
            <ul className="flex flex-col mt-4 -mx-4 pt-4 border-t md:flex-row md:items-center md:mx-0 md:ml-auto md:mt-0 md:pt-0 md:border-0">
              {tenants?.data?.data?.linkage_type == 'lti' || assistantRoom  ? null : (
              <li>
                <TeacherNavlink to="/teacher/room-management"
                  className={({ isActive }) => isActive ? classNavButton.active : classNavButton.normal}
                >
                  <FontAwesomeIcon icon="fa-brands fa-chromecast" className="mr-3" />
                  {t('navigation.room_management')}
                </TeacherNavlink>
              </li>
              )}

              {assistantRoom && tenants?.data?.data?.linkage_type != 'lti' ? (
                <li> 
                  <TeacherNavlink to="/assistant/monitoring"
                    className={({ isActive }) => isActive ? classNavButton.active : classNavButton.normal}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-users-rectangle" className="mr-3" />
                    {t('navigation.assistant_monitoring')}
                  </TeacherNavlink>
                </li>
              ) : null}
              <li>
                <button
                  className={classNavButton.normal}
                  type="button"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon="fa-solid fa-right-from-bracket" className="mr-3" />
                  {t('navigation.logout')}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar;

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { closeAlert, showAlert } from "../../../store/features/alertSlice";
import { leaveRoom } from "../../../store/features/monitoringSlice";
import { setUserReset, setWatchingType } from "../../../store/redux/watching/actions";
import { wsLeaveRoom } from "../../../store/redux/websocket/actions";

const TeacherNavlink = (props) => {
  const dispatch = useDispatch()
  const { t } = useTranslation();
  const navigate = useNavigate()
  const location  = useLocation()

  useEffect(() => {
  //console.log(location.pathname)
  }, [location]);


  const onLeaveRoom = () => {
    dispatch(setWatchingType("watching"));
    dispatch(setUserReset());
    const roomData = JSON.parse(localStorage.getItem('roomData'))
    const assistantRoom = JSON.parse(localStorage.getItem('assistantRoom'))

    dispatch(wsLeaveRoom(roomData));
    dispatch(leaveRoom());
    dispatch(closeAlert());
    
    navigate(props.to);
    
    if(props.to === "/assistant/monitoring" && location.pathname === "/teacher/monitoring"){
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const handleClick = (e) => {
  //console.log(location.pathname,'aaaa',props.to)
    e.preventDefault();

    if(props.to != location.pathname && ["/teacher/monitoring","/assistant/monitoring","/teacher/temporary-monitoring"].includes(location.pathname)){
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
          handleChange : () => {
            dispatch(closeAlert());
          }
        }
      }))
    } else {
      navigate(props.to);
    }
  }

  return <NavLink onClick={(e)=>handleClick(e)} {...props}>{props.children}</NavLink>
}

export default TeacherNavlink

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { useDispatch } from "react-redux";
import { wsSend } from "../../store/redux/websocket/actions";
import { clearData } from "../../store/redux/monitoring/actions";
import { useStopwatch } from "react-timer-hook";
import { useTranslation } from "react-i18next";
import { roomLimit } from "../../constant/configWS";
import Alert from "../common/Alert";

const MyStopwatch = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const roomData = JSON.parse(localStorage.getItem("roomData"));
  const stopwatchOffset = new Date();
  const { seconds, minutes, isRunning, start, pause, reset } = useStopwatch({
    autoStart: true,
    // offsetTimestamp: stopwatchOffset.setSeconds(
    //   stopwatchOffset.getSeconds() + 300
    // ),
  });

  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    excerpt: "",
  });

  useEffect(() => {
    if(roomData?.room_id) {
      if (minutes === roomLimit.MAX_ROOM_TIME && roomLimit.MAX_ROOM_TIME !== 0 && roomData) {
        pause();
        dispatch(
          wsSend({
            type: "time_out",
            data: roomData,
          })
        );

        setAlert({
          isOpen: true,
          hideTitle: true,
          title: t("alert.name"),
          excerpt: t("alert.text.room_time_out"),
        });
      }
      localStorage.setItem(
        "roomData",
        JSON.stringify({ ...roomData, currentTimer: minutes })
      );
    }
  }, [minutes]);

  const handleCloseAlert = () => {
    let messageData = {
      type: "delete_room",
      room_id: roomData.room_id,
      user_id: roomData.user_id,
    };
    dispatch(clearData(messageData));
    window.location.href = `${import.meta.env.VITE_BASE_PATH}`;
  };

  if(roomLimit.MAX_ROOM_TIME > 0){
    return (
      <>
        <div className="text-xl text-grey-600">
          <FontAwesomeIcon icon="fa-regular fa-clock" className="mr-2"></FontAwesomeIcon>
          <span>{minutes < 10 ? `0${minutes}` : minutes}</span>:
          <span>{seconds < 10 ? `0${seconds}` : seconds}</span>
        </div>

        <Alert handleChange={handleCloseAlert} alert={alert} />
      </>
    );
  }else{
    return(<><div className="text-xl text-grey-600"></div></>);
  }
};

export default MyStopwatch;

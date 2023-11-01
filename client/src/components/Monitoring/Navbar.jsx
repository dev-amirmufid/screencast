import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { clearData } from "../../store/redux/monitoring/actions";
import { storeLog } from "../../store/redux/log/actions";
import {
  onWatching,
  setWatchingStart,
  setWatchingType,
  setUserReset,
  hangup,
} from "../../store/redux/watching/actions";
import ModalCompare from "./ModalCompare";
import ModalSplit from "./ModalSplit";
import Alert from "../common/Alert";
import Timer from "./Timer";

const Navbar = ({
  gridSize,
  setGridSize,
  handleStudentURL,
  handleAssistantURL,
}) => {
  const participants = useSelector((state) => state.monitoring.participants);
  const roomData = JSON.parse(localStorage.getItem("roomData"));
  const loginSession = JSON.parse(localStorage.getItem("loginSession"));
  const wsStatusConnect = useSelector((state) => state.websocket.connected);

  // get state watching
  const watchingType = useSelector((state) => state.watching.type);
  const isWatching = useSelector((state) => state.watching.isWatching);
  const watchingUsers = useSelector((state) => state.watching.users);

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    excerpt: "",
  });

  useEffect(() => {
    if (!wsStatusConnect) {
      dispatch(setWatchingStart(false));
      dispatch(setWatchingType("watching"));
      dispatch(setUserReset());
      dispatch(hangup());
      storeLog({
        status: "success",
        action: "[websocket/disconnect]",
        data: JSON.stringify(roomData),
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatusConnect]);

  const leaveRoom = () => {
    setAlert({
      ...alert,
      isOpen: true,
      title: t("alert.name"),
      excerpt: t("alert.text.leave_room_confirm"),
      confirm: {
        status: true,
        labelBtnTrue: t("btn.btn_yes"),
        labelBtnfalse: t("btn.btn_no"),
      },
    });
  };

  const onLeaveRoom = () => {
    let messageData = {
      type: "delete_room",
      room_id: roomData.room_id,
      user_id: roomData.user_id,
    };

    localStorage.removeItem("roomData")
    dispatch(clearData(messageData));
  };
  const handleCompare = () => {
    if (watchingUsers.length < 2) {
      setAlert({
        isOpen: true,
        title: t("alert.name"),
        excerpt: t("alert.text.comparation"),
      });

      storeLog({
        status: "error",
        action: "[monitoring/compare]",
        data: JSON.stringify({
          ...roomData,
          error: "Select two students to start the comparison",
        }),
      });
    } else if (watchingUsers.length > 9) {
      setAlert({
        isOpen: true,
        title: t("alert.name"),
        excerpt: t("alert.text.comparation_limit"),
      });

      storeLog({
        status: "error",
        action: "[monitoring/compare_limit]",
        data: JSON.stringify({
          ...roomData,
          error: "Only up to 9 students can be compared",
        }),
      });
    } else {
      // set compare
      if (watchingUsers.length < 3) {
        dispatch(setWatchingType("compare"));
        dispatch(setWatchingStart(true));

        dispatch(onWatching());

        storeLog({
          status: "success",
          action: "[monitoring/compare]",
          data: JSON.stringify(roomData),
        });
      } else {
        dispatch(setWatchingType("split"));
        dispatch(setWatchingStart(true));

        storeLog({
          status: "success",
          action: "[monitoring/split]",
          data: JSON.stringify(roomData),
        });
      }
      // set split
    }
  };

  const handleClose = () => {
    // dispatch(setCompartStart(false));
    dispatch(hangup());

    storeLog({
      status: "success",
      action: "[monitoring/hangup]",
      data: JSON.stringify(roomData),
    });
  };

  const onCancel = () => {
    dispatch(setWatchingType("watching"));
    dispatch(setUserReset());
  };

  const handleCloseAlert = () => {
    setAlert({
      isOpen: false,
      title: "",
      excerpt: "",
    });
  };

  const handleCloseSplit = () => {
    dispatch(setWatchingStart(false));
    dispatch(setWatchingType("watching"));
    dispatch(setUserReset());

    storeLog({
      status: "success",
      action: "[monitoring/close_split]",
      data: JSON.stringify(roomData),
    });
  };

  const handleCsvExportParticipant = () => {
    window.open(`${import.meta.env.VITE_API_URL}/export/participant/${roomData.room_id}`, '_blank')
  };

  return (
    <>
      <nav
        className="bg-gradient-to-r from-teal-600 to-teal-400 shadow"
        role="navigation"
      >
        <div className="p-2 flex flex-wrap items-center md:flex-no-wrap">
          <div className="mr-4 md:mr-8">
            <div className="text-2xl text-white" id="room_name">
              {roomData?.room_name}
            </div>
          </div>
          <div className="w-full md:w-auto md:flex-grow md:flex md:items-center">
            <ul className="flex flex-col mt-4 -mx-4 pt-4 border-t md:flex-row md:items-center md:mx-0 md:ml-auto md:mt-0 md:pt-0 md:border-0">
              {/* csv download */}
              <li>
                <button
                  className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
                  type="button"
                  onClick={() => handleCsvExportParticipant()}
                >
                  {t("btn.btn_download_csv")}
                </button>
              </li>

              {loginSession?.type !== "assistant" && (
                <>
                  <li>
                    <button
                      className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
                      type="button"
                      onClick={() => handleAssistantURL()}
                    >
                      {t("btn.btn_url_assistant")}
                    </button>
                  </li>

                  <li>
                    <button
                      className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
                      type="button"
                      onClick={() => handleStudentURL()}
                    >
                      {t("btn.btn_url_student")}
                    </button>
                  </li>
                </>
              )}
              <li>
                <button
                  id="btn_leave"
                  className="shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
                  type="button"
                  onClick={() => leaveRoom()}
                >
                  {t("btn.btn_leave")}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="bg-gray-100 shadow-md">
        <div className="p-2 flex justify-between items-center">
          <Timer />
          {/* &nbsp; */}
          <div className="flex flex-row-reverse">
            <div>
              <i className="fa fa-th-large text-3xl mr-3 text-teal-500"></i>
              <input
                id="grid_change"
                type="range"
                min={2}
                max={12}
                value={gridSize}
                onChange={(e) => setGridSize(e.target.value)}
              />
            </div>
            <div className="mr-3 pr-3 flex border-r-2 border-gray-300">
              <FontAwesomeIcon
                icon="fa-solid fa-user"
                className="text-2xl mr-3 text-teal-500"
              ></FontAwesomeIcon>
              <span className="text-lg text-gray-900">
                {t("teacher.monitoring.number_of_participant")}:
                <b id="total_participants"> {participants.length}</b>
              </span>
            </div>
            {watchingType === "watching" && (
              <button
                className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
                type="button"
                onClick={() => dispatch(setWatchingType("compare"))}
              >
                {t("btn.btn_compare")}
              </button>
            )}
            {watchingType === "compare" && (
              <div>
                <button
                  className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
                  type="button"
                  onClick={() => onCancel()}
                >
                  {t("btn.btn_cancel")}
                </button>

                <button
                  className="mr-3 shadow bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
                  type="button"
                  onClick={() => handleCompare()}
                >
                  {t("btn.btn_compare_start")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {watchingType === "compare" && (
        <ModalCompare isOpen={isWatching} handleClose={handleClose} />
      )}

      {watchingType === "split" && (
        <ModalSplit isOpen={isWatching} handleClose={handleCloseSplit} />
      )}

      <Alert
        handleChange={handleCloseAlert}
        onBtnTrueHandler={onLeaveRoom}
        alert={alert}
      />
    </>
  );
};

export default Navbar;

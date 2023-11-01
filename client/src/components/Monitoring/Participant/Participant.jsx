import React, { useEffect, useRef, useState } from "react";
import {
  onWatching,
  setWatchingStart,
  setWatchingType,
  setUserWatching,
  setUserReset,
  hangup,
} from "../../../store/redux/watching/actions";
import { useDispatch, useSelector } from "react-redux";
import { storeLog } from "../../../store/redux/log/actions";
import { useTranslation } from "react-i18next";

import { cutText } from "../../../helpers/utility";
import { showAlert, closeAlert } from "../../../store/features/alertSlice";
import { INITIAL_SCREEN } from "../../../constant/constant";

const Participant = ({ participant, onSelectedUser, gridSize }) => {
  const watchingType = useSelector((state) => state.watching.type);
  const wsStatusConnect = useSelector((state) => state.websocket.connected);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState(30);
  const refThumbnail = useRef();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let fontsize = 30;

    if (refThumbnail.current) {
      let width = refThumbnail.current.offsetWidth
      if (width >= 617) {
        fontsize = 30
      } else if (width >= 403) {
        fontsize = 20
      } else if (width >= 235) {
        fontsize = 14
      } else if (width >= 192) {
        fontsize = 12
      } else if (width >= 162) {
        fontsize = 10
      } else if (width >= 139) {
        fontsize = 8
      } else if (width >= 121) {
        fontsize = 7
      } else if (width >= 107) {
        fontsize = 6
      } else {
        fontsize = 5
      }
    }
    setFontSize(fontsize);
  });

  useEffect(() => {
    if (!wsStatusConnect) {
      dispatch(setWatchingStart(false));
      dispatch(setWatchingType("watching"));
      dispatch(setUserReset());
      dispatch(hangup());

      storeLog({
        status: "error",
        action: "[websocket/disconnect]",
        data: JSON.stringify(participant),
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatusConnect]);

  const watchingHandler = (participant) => {
    //console.log("START WATCHING ",participant);
    if (participant.last_screen_default == 0) {
      dispatch(setWatchingType("watching"));
      dispatch(setWatchingStart(true));
      dispatch(setUserWatching(participant));
      dispatch(onWatching());

      storeLog({
        status: "success",
        action: "[monitoring/watching]",
        data: JSON.stringify(participant),
      });
    } else if (participant.last_screen_default == 1) {
      dispatch(showAlert({
        title: t("alert.name"),
        excerpt: t("alert.text.user_notready"),
        action: {
          handleChange: () => dispatch(closeAlert())
        }
      }))
    }
  };

  return (
    <div>
      <li
        className="screen-list hover:shadow-lg flex cursor-pointer"
        key={participant.user_id}
      >
        <div ref={refThumbnail} className="relative hover:border-transparent hover:shadow-xs w-full bg-gray-50 border-2 border-dashed border-gray-200 text-sm font-medium py-1 px-1">
          <div className="flex justify-between items-center mb-1"
            onClick={(e) =>
              watchingType === "watching" ? watchingHandler(participant) : {}
            }>
            <div className="user_name break-all overflow-hidden text-ellipsis whitespace-nowrap">{cutText(participant.username, 30)}</div>
            {participant.last_screen_default === 1 && participant.last_screen == INITIAL_SCREEN && (
              <div className="please-wait-thumb" style={{ fontSize: `${fontSize}px` }} >
                {t("teacher.monitoring.wait_text")}
              </div>
            )}
            {participant.last_screen_default === 2 && (
              <div className="ss-stopped-bg">
                <div className="ss-stopped-thumb" style={{ fontSize: `${fontSize}px` }}>
                  <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
                  {t("teacher.monitoring.ss_stopped")}
                </div>
              </div>
            )}
            {participant.last_screen_default === 3 && (
              <div className="ss-stopped-bg">
                <div className="ss-stopped-thumb" style={{ fontSize: `${fontSize}px` }}>
                  <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
                  {t("teacher.monitoring.user_disconnected")}
                </div>
              </div>
            )}
            {watchingType === "compare" && participant.last_screen_default === 0 && (
              <input
                type="checkbox"
                className="h-8 w-8 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded compare-selectbox"
                onChange={(e) => onSelectedUser(participant.user_id)}
              />
            )}
          </div>
          <div
            className="simg w-full bg-black py-1 px-1"
            onClick={(e) =>
              watchingType === "watching" ? watchingHandler(participant) : {}
            }
          >
            {participant.last_screen && (
              <img
                className="h-auto w-full"
                style={{ margin: "0 auto", width: 380*4/gridSize, height: 235*4/gridSize, objectFit: 'contain' }}
                src={participant.last_screen ? participant.last_screen : null}
                alt={participant.username}
              />
            )}
          </div>
        </div>
      </li>
    </div>
  );
};

export default Participant;

import React, { useEffect, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { reloadScreen } from "../../store/redux/watching/actions";
import { cutText } from "../../helpers/utility";
import {
  setWatchingStart,
  setWatchingType,
  setUserReset,
} from "../../store/redux/watching/actions";

const ModalWatching = ({ isOpenDialog, hangup }) => {
  const { t } = useTranslation();
  const monitoring = useSelector((state) => state.monitoring);
  const usersWatching = useSelector((state) => state.watching.users);
  const participants = useSelector((state) => state.monitoring.participants);
  const dispatch = useDispatch();
  const remoteVideo = useRef();

  useEffect(() => {
  //console.log(usersWatching,'usersWatching')
  }, [monitoring, usersWatching]);

  const filterParticipant = () => {
    const intersecUsers = participants.filter((participant) =>
      usersWatching.some((user) => participant.user_id === user.user_id)
    );
    return intersecUsers;
  };

  const watchingFullscreen = () => {
    let elem = remoteVideo.current;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE11 */
      elem.msRequestFullscreen();
    }
  };

  const onHangup = () => {
    if (usersWatching[0]?.userStatus === "is_watching") {
      dispatch(setWatchingType("watching"));
      dispatch(setUserReset());
      dispatch(setWatchingStart(false));
    } else {
      hangup();
    }
  };

  return (
    <Dialog
      open={isOpenDialog}
      onClose={() => {}}
      className="fixed z-10 inset-0 overflow-y-auto modal-main" style={{zIndex:1350}}
    >
      <div
        className="fixed z-10 inset-0 overflow-y-auto" style={{zIndex:1350}}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl sm:align-middle ${
              usersWatching[0]?.userStatus === "is_watching"
                ? "md:w-5/12"
                : "md:w-6/12"
            } modal-body`}
          >
            <div className="bg-white">
              <div className="sm:flex sm:items-start">
                <div className="rounded-lg bg-white w-full">
                  {(usersWatching[0]?.userStatus === "is_watching"
                    ? filterParticipant()
                    : usersWatching
                  ).map((user) => (
                    <div key={user.user_id}>
                      <div className="flex justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                          <FontAwesomeIcon
                            icon="fa-solid fa-desktop"
                            className="text-blue-500"
                          ></FontAwesomeIcon>
                          &nbsp;
                          <span
                            className="font-bold text-gray-700 text-lg"
                            id="watching_username"
                          >
                            {cutText(user.username, 30)}
                          </span>
                        </div>
                        {/* {usersWatching[0]?.userStatus !== "is_watching" && ( */}
                          <div
                            style={{
                              display: !user.isUserLoading ? "block" : "none",
                            }}
                            className="rv-refresh-btn"
                            id="refresh_rv"
                            onClick={() => dispatch(reloadScreen(user))}
                          >
                            <FontAwesomeIcon
                              icon="fa-solid fa-rotate"
                              size="lg"
                              className="text-black"
                            ></FontAwesomeIcon>
                          </div>
                        {/* )} */}
                      </div>

                      <div
                        className="px-5 py-0 text-gray-600"
                        style={{ position: "relative" }}
                      >
                        <div
                          style={{
                            display: user.isUserLoading ? "flex" : "none",
                          }}
                          id="overlay_video"
                        >
                          <FontAwesomeIcon
                            className="text-white"
                            icon="fa-solid fa-spinner"
                            size="3x"
                            spin
                            style={{ textShadow: "0 1px 0 rgba(0, 0, 0, 0.1)" }}
                          />
                        </div>

                        {usersWatching[0]?.userStatus !== "is_watching" ? (
                          <video
                            style={{
                              display: !user.isUserLoading ? "block" : "none",
                            }}
                            className="w-full remote-video"
                            ref={remoteVideo}
                            id={`video_${user.user_id}`}
                            playsInline
                            autoPlay
                            muted
                          ></video>
                        ) : (
                          <img
                            className="h-auto w-full"
                            style={{ margin: "0 auto" }}
                            src={user.last_screen}
                            alt={user.username}
                          />
                        )}

                        {usersWatching[0]?.userStatus !== "is_watching" && (
                          <div id="video-toolbar">
                            <div
                              type="button"
                              className="full-screen-btn"
                              onClick={() => watchingFullscreen()}
                            >
                              <FontAwesomeIcon
                                icon="fa-solid fa-maximize"
                                size="lg"
                                className="text-white"
                              ></FontAwesomeIcon>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="px-5 py-4 flex justify-center">
                    {/* {!usersWatching[0]?.isUserLoading ?  */}
                    <button
                      onClick={() => onHangup()}
                      className="stop-watching shadow bg-blue-500 hover:bg-blue-600 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-2 rounded"
                      type="button"
                    >
                      {t("btn.btn_stop_watching")}
                    </button>
                    {/* } */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ModalWatching;

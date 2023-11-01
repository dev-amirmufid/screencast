import React, { useRef } from "react";
import { Dialog } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { useSelector, useDispatch } from "react-redux";
import { reloadScreen } from "../../store/redux/watching/actions";
import { cutText } from "../../helpers/utility";
import { useTranslation } from "react-i18next";

const ModalCompare = ({ isOpen, handleClose }) => {
  const { t } = useTranslation();
  const usersWatching = useSelector((state) => state.watching.users);
  const participants = useSelector((state) => state.monitoring.participants);
  const dispatch = useDispatch();
  const videos = useRef([]);
  videos.current = [];

  const watchingFullscreen = (index) => {
    const videoById = videos.current[index];

    if (videoById.requestFullscreen) {
      videoById.requestFullscreen();
    } else if (videoById.webkitRequestFullscreen) {
      /* Safari */
      videoById.webkitRequestFullscreen();
    } else if (videoById.msRequestFullscreen) {
      /* IE11 */
      videoById.msRequestFullscreen();
    }
  };

  const addToVideo = (elm) => {
    if (elm && !videos.current.includes(elm)) {
      videos.current.push(elm);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => handleClose}
      className="fixed z-10 inset-0 overflow-y-auto modal-main" style={{zIndex:1350}}
    >
      <div
        className="fixed z-10 inset-0 overflow-y-auto" style={{zIndex:1350}}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl sm:align-middle md:w-11/12 modal-body">
            <div className="bg-white overflow-y-auto rounded-lg">
              <div className="sm:flex sm:items-start">
                <div className="rounded-lg bg-white w-full">
                  <section className="px-4 sm:px-6 lg:px-4 xl:px-6 pt-4 pb-4 sm:pb-6 lg:pb-4 xl:pb-6 space-y-4">
                    <ul id="screen_list" className={`grid grid-cols-2 gap-8`}>
                      {usersWatching.map((user, index) => (
                        <li
                          key={user.user_id}
                          className="screen-list flex cursor-pointer"
                        >
                          <div className="relative hover:shadow-xs w-full text-sm font-medium">
                            <div className="flex justify-between items-center py-3">
                              <div className="user_name max-w-full">
                                <div class="flex">
                                  <FontAwesomeIcon
                                    icon="fa-solid fa-desktop"
                                    className="text-blue-500 mt-2"
                                  ></FontAwesomeIcon>
                                  &nbsp;
                                  <span className="font-bold text-gray-700 text-lg overflow-hidden text-ellipsis whitespace-nowrap">
                                    {cutText(user.username, 30)}
                                  </span>
                                </div>
                              </div>
                              {user.userStatus !== "is_watching" && (
                                <div
                                  style={{
                                    display: !user.isUserLoading ? "block" : "none",
                                  }}
                                  className="rv-refresh-btn"
                                  onClick={() => dispatch(reloadScreen(user))}
                                >
                                  <FontAwesomeIcon
                                    icon="fa-solid fa-rotate"
                                    size="lg"
                                    className="text-black"
                                  ></FontAwesomeIcon>
                                </div>
                              )}
                            </div>

                            {user.userStatus !== "is_watching" ? (
                              <div
                                className="simg w-full bg-black py-1 px-1"
                                style={{ position: "relative" }}
                              >
                                <div
                                  style={{
                                    display: user.isUserLoading
                                      ? "flex"
                                      : "none",
                                  }}
                                  id="overlay_video"
                                >
                                  <FontAwesomeIcon
                                    className="text-white"
                                    icon="fa-solid fa-spinner"
                                    size="3x"
                                    spin
                                    style={{
                                      textShadow: "0 1px 0 rgba(0, 0, 0, 0.1)",
                                    }}
                                  />
                                </div>
                                <video
                                  style={{
                                    display: !user.isUserLoading
                                      ? "block"
                                      : "none",
                                  }}
                                  ref={addToVideo}
                                  className="w-full remote-video"
                                  id={`video_${user.user_id}`}
                                  playsInline
                                  autoPlay
                                ></video>

                                <div className="video-toolbar-compare">
                                  <div
                                    type="button"
                                    className="full-screen-btn"
                                    onClick={() => watchingFullscreen(index)}
                                  >
                                    <FontAwesomeIcon
                                      icon="fa-solid fa-maximize"
                                      size="lg"
                                      className="text-white"
                                    ></FontAwesomeIcon>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <img
                                  className="h-auto w-full"
                                  style={{ margin: "0 auto" }}
                                  src={participants[index]?.last_screen}
                                  alt={participants[index]?.username}
                                />
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <div className="px-5 py-4 flex justify-center">
                    <button
                      onClick={() => handleClose()}
                      className="stop-watching shadow bg-blue-500 hover:bg-blue-600 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-2 rounded"
                      type="button"
                    >
                      {t("btn.btn_stop_compare")}
                    </button>
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

export default ModalCompare;

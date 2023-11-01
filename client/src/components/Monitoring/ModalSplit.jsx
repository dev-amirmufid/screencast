import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { cutText } from "../../helpers/utility";


const ModalSplit = ({ isOpen, handleClose }) => {
  const { t } = useTranslation();
  const participants = useSelector((state) => state.monitoring.participants);
  const usersWatching = useSelector((state) => state.watching.users);
  const [gridSize, setGridSize] = useState(4);

  const filterParticipant = () => {
    const intersecUsers = participants.filter((participant) =>
      usersWatching.some((user) => participant.user_id === user.user_id)
    );
    const sortParticipant = intersecUsers.sort((a, b) => {
      if ( a.username < b.username ){
        return -1;
      }
      if ( a.username > b.username ){
        return 1;
      }
      return 0;
    })
    return sortParticipant;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => handleClose}
      className="fixed z-10 inset-0 overflow-y-auto modal-main" style={{ zIndex: 1350 }}
    >
      <div
        className="fixed z-10 inset-0 overflow-y-auto" style={{ zIndex: 1350 }}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg text-left shadow-xl sm:align-middle md:w-10/12 modal-body modal-split">
            <div className="bg-white overflow-y-auto rounded-lg">
              <div className="sm:flex sm:items-start">
                <div className="rounded-lg bg-white w-full">
                  <section className="px-4 sm:px-6 lg:px-4 xl:px-6 pt-4 pb-4 sm:pb-6 lg:pb-4 xl:pb-6 space-y-4">
                    <div className="px-5 flex flex-row-reverse justify-center border-b border-gray-100 px-5 py-4">
                      <div>
                        <i className="fa fa-th-large text-3xl mr-3 text-teal-500"></i>
                        <input
                          id="grid_change"
                          type="range"
                          min={2}
                          max={6}
                          value={gridSize}
                          onChange={(e) => setGridSize(e.target.value)}
                        />
                      </div>

                      <div className="mr-4 pr-3 flex border-r-2 border-gray-300">
                        <button
                          onClick={() => handleClose()}
                          className="stop-watching shadow bg-blue-500 hover:bg-blue-600 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-2 rounded"
                          type="button"
                        >
                          {t("btn.btn_stop_watching")}
                        </button>
                      </div>
                    </div>
                    <ul
                      id="screen_list"
                      className={`grid grid-cols-${gridSize} gap-8 split-screen-box`}
                    >
                      {filterParticipant().map((user, index) => (
                        <li
                          key={user.user_id}
                          className="screen-list flex cursor-pointer"
                        >
                          <div className="relative hover:shadow-xs w-full text-sm font-medium">
                            <div className="flex justify-between items-center py-2">
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
                            </div>
                            <div
                              className="simg w-full bg-black py-1 px-1"
                              style={{ position: "relative" }}
                            >
                              <img
                                className="h-auto w-full"
                                style={{ margin: "0 auto" }}
                                src={user.last_screen}
                                alt={user.username}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ModalSplit;

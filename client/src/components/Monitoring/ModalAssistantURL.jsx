import React from "react";
import { Dialog } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CopyToClipboard } from "react-copy-to-clipboard";

const ModalAssistantURL = React.memo(({ isOpenDialog, handleClose, refreshQR }) => {
  const { t } = useTranslation();
  const assistantURL = useSelector((state) => state.monitoring.assistantURL);
  const notify = () => {
    return toast.success(t("alert.toast.url_copied"), {
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      draggable: true,
      progress: undefined,
    });
  };

  const copyUrl = () => {
    notify();
  };

  return (
    <>
      <Dialog
        open={isOpenDialog}
        onClose={()=>{}}
        className="fixed z-10 inset-0 overflow-y-auto modal-main" style={{zIndex:1350}}
      >
        <div
          className="fixed z-10 inset-0 overflow-y-auto" style={{zIndex:1350}}
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle w-auto modal-body">
              <div className="bg-white">
                <div className="sm:flex sm:items-start">
                  <div className="rounded-lg bg-white w-full">
                    <div className="text-center border-b border-gray-100 px-5 py-4">
                      <div className="font-bold text-gray-700 text-lg">
                        <FontAwesomeIcon
                          name="fa-solid fa-share-from-square"
                          className="mr-2 text-blue"
                        ></FontAwesomeIcon>
                        {t("teacher.assistant_url.title")}
                      </div>
                    </div>

                    <div
                      className="px-5 py-0 flex items-start"
                      style={{ position: "relative" }}
                    >
                      <input
                        name="assistant_url"
                        className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 px-3 mb-3 focus:outline-none"
                        id="assistant_url"
                        type="text"
                        readOnly
                        value={assistantURL?.url}
                      />
                      <CopyToClipboard
                        onCopy={copyUrl}
                        text={assistantURL?.url}
                      >
                        <button
                          className="ml-2 shadow bg-gradient-to-r from-teal-400 to-teal-600 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-3 rounded"
                          type="button"
                        >
                          <FontAwesomeIcon
                            icon="fa-solid fa-copy"
                            size="lg"
                            className="text-white"
                          ></FontAwesomeIcon>
                        </button>
                      </CopyToClipboard>
                    </div>

                    <div className="px-5 py-0 text-center mb-3">
                      <img
                        className="inline-block border border-cyan-500 w-80"
                        src={assistantURL?.qrcode}
                        alt="assistant_url_qrcode"
                      ></img>
                    </div>

                    <div className="px-5 py-0 text-center mb-2">
                      <div className="grid grid-cols-2 content-center">
                        <div>
                          <button
                            className="shadow bg-gradient-to-r from-teal-400 to-teal-600 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-3 rounded"
                            type="button"
                            onClick={refreshQR}
                          >
                            <FontAwesomeIcon
                              icon="fa-solid fa-rotate"
                              size="lg"
                              className="text-white mr-2"
                            ></FontAwesomeIcon>
                            {t("teacher.student_url.qr_refresh")}
                          </button>
                        </div>

                        <div>
                          <a href={assistantURL?.qrcode} download="qrcode.jpg">
                            <button
                              className="shadow bg-gradient-to-r from-cyan-500 to-sky-600 focus:shadow-outline focus:outline-none text-white py-2 px-2 rounded"
                              type="button"
                            >
                              <FontAwesomeIcon
                                icon="fa-solid fa-download"
                                size="lg"
                                className="text-white mr-2"
                              ></FontAwesomeIcon>
                              {t("teacher.assistant_url.qr_download")}
                            </button>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-0 mb-2 flex justify-center">
                      <div className="w-96 text-center font-bold text-gray-500 text-sm">
                        {t("teacher.assistant_url.notice")}
                      </div>
                    </div>

                    <div className="px-5 py-4 flex justify-center bg-gray-50 ">
                      <button
                        onClick={handleClose}
                        className="shadow bg-gradient-to-r from-gray-100 to-gray-200 focus:shadow-outline focus:outline-none text-gray-700 py-2 px-2 rounded"
                        type="button"
                      >
                        {t("teacher.assistant_url.close")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
});

export default ModalAssistantURL;

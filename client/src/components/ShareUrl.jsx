import React, {Fragment, useEffect} from 'react'
import { baseUrl } from '../helpers/utility';
import { useState } from 'react';
import { Tab } from '@headlessui/react'
import CopyToClipboard from 'react-copy-to-clipboard';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import QRCode from 'react-qr-code';
import { useTranslation } from 'react-i18next';
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from '../hooks/useAuth';


function ShareUrl({ rooms, setShowModal,
    show,
    onClose,
    title
    }) {
    const {tenants} = useAuth()
    const { t } = useTranslation()
    const [shareurl,setShareUrl] = useState([])

    const setupLink = (item) => {
        var url = baseUrl() + '/assistant/join-room/'+rooms.tenant_id+'/'+rooms.uri
        if (item.key == 'student_url') 
            url = baseUrl() + '/student/join-room/'+rooms.tenant_id+'/'+rooms.uri
        
        return url;
    }

    const downloadQR = (id) => {
        const svg = document.getElementById(id);
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = "QRCode";
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    };

    useEffect(() => {
        const arr = [
            {
                key: 'student_url',
                label: t('teacher.student_url.title'),
                url: 'student'
            },
            {
                key: 'assistant_url',
                label: t('teacher.assistant_url.title'),
                url: 'assistant',
            }
        ];
        
        if(tenants?.data?.data?.linkage_type == 'lti'){
           const x = arr.filter((item)=>item.key == 'student_url');
            setShareUrl(x)
        } else {
            setShareUrl(arr)
        }
    }, []);

    return (
        
    <Transition appear show={show} as={Fragment} 
      className="fixed z-10 inset-0 overflow-y-auto modal-main " style={{zIndex:1350}}
    >
      <Dialog as="div" className="relative z-10" 
      onClose={onClose} >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
              className="inline-block align-bottom bg-white rounded-lg text-center overflow-hidden shadow-xl sm:my-8 sm:align-middle w-auto">
                {title ? (<Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 pt-4">{title}</Dialog.Title>) : null }
                <div className="space-y-6 bg-white pt-5">
                    <div className="w-full">
                    <Tab.Group>
                        <Tab.List className="flex bg-white px-7">
                        
                        {shareurl.map((item) => (
                            <Tab key={item.key} className={({ selected }) => (`mx-2 shadow font-bold py-2 px-4 rounded w-full
                                ${selected ? `
                                    bg-gradient-to-r from-teal-400 to-teal-600 
                                    hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
                                    text-white
                                ` : `
                                    bg-gradient-to-r from-white to-gray-200
                                    hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300
                                    text-teal-600
                                `}`)
                            }
                            >
                            {item.label}
                            </Tab>
                        ))}
                        </Tab.List>
                        <Tab.Panels className="mt-2">
                        {shareurl.map((item) => (
                            <Tab.Panel
                            key={item.key}
                            className={`rounded-xl bg-white ring-white focus:outline-none `}
                            >
                            <div className="p-4">
                                <div className="p-3">
                                {/* copy link */}
                                <div className="py-0 flex items-start" style={{ position: "relative" }} >
                                    <input
                                    className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-2 px-3 mb-3 focus:outline-none"
                                    type="text"
                                    readOnly
                                    value={setupLink(item)}
                                    />
                                    <CopyToClipboard onCopy={()=>{
                                    toast.success(t("alert.toast.url_copied"), {
                                        position: "bottom-left",
                                        autoClose: 3000,
                                        hideProgressBar: true,
                                        closeOnClick: true,
                                        draggable: true,
                                        progress: undefined,
                                    })
                                    }} text={setupLink(item)}>
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

                                {/* qr image */}
                                <div className="px-5 py-0 text-center mb-3">
                                    <div className="inline-block border border-cyan-500 w-96 max-w-xs">
                                    <QRCode 
                                    id={`${item.key}`} 
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                                    value={`${setupLink(item)}`} />
                                    </div>
                                </div>

                                {/* button download */}
                                <div className="px-5 py-0 text-center mb-2">
                                    <button
                                    onClick={()=>downloadQR(item.key)}
                                    className="shadow bg-gradient-to-r from-cyan-500 to-sky-600 focus:shadow-outline focus:outline-none text-white py-2 px-2 rounded"
                                    type="button"
                                    >
                                    <FontAwesomeIcon
                                        icon="fa-solid fa-download"
                                        size="lg"
                                        className="text-white mr-2"
                                    ></FontAwesomeIcon>
                                    {t(`teacher.${item.key}.qr_download`)}
                                    </button>
                                </div>
                                
                                <div className="px-5 py-0 mb-2 flex justify-center">
                                    <div className="w-96 text-center font-bold text-gray-500 text-sm">
                                    {t(`teacher.${item.key}.notice`)}
                                    </div>
                                </div>
                                </div>
                            </div>

                            <div className="mt-5 py-4 flex justify-center bg-gray-100">
                                <button
                                onClick={onClose}
                                className="shadow bg-gradient-to-r from-gray-100 to-gray-200 focus:shadow-outline focus:outline-none text-gray-700 py-2 px-2 rounded"
                                type="button"
                                >
                                {t(`teacher.${item.key}.close`)}
                                </button>
                            </div>
                            </Tab.Panel>
                        ))}
                        </Tab.Panels>
                    </Tab.Group>
                    </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

      </Dialog>
    </Transition>
        
    )
}

export default ShareUrl

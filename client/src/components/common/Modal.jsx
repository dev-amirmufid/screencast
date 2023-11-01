import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const Modal = ({
  show,
  onClose,
  title,
  children
}) => {
  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose} >
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
              className="inline-block align-bottom bg-white rounded-lg overflow-hidden shadow-xl sm:my-8 sm:align-middle w-auto">
                {title ? (<Dialog.Title as="h3" className="px-4 text-left text-lg font-semibold leading-6 py-4 bg-gradient-to-r from-teal-600 to-teal-400 shadow text-white">{title}</Dialog.Title>) : null }
                <div className="p-4">
                <div className="space-y-6 bg-white">
                    {children}
                  </div>

                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

      </Dialog>
    </Transition>
  );
};

export default Modal;

import React from "react";
import { Dialog } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const Overlay = ({ isOpen }) => {
  return (
      <div
        className="fixed z-10 inset-0 overflow-y-auto" style={{zIndex:1350}}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
          ></div>

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block align-bottom text-center rounded-lg text-left overflow-hidden  transform transition-all sm:my-8 sm:align-middle">
          <FontAwesomeIcon icon="fa-solid fa-spinner" size="3x" className="text-teal-600"
              spin
              style={{ textShadow: "0 1px 0 rgba(0, 0, 0, 0.1)" }}
          />
          </div>
        </div>
      </div>
  );
};

export default Overlay;

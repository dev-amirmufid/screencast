import React from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

const FormModal = ({
  formik,
  show,
  onClose,
  title,
  children
}) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={show}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth='lg'
      scroll="body"
    >
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle id="alert-dialog-title" className="bg-gradient-to-r from-teal-600 to-teal-400 shadow text-white" style={{ paddingTop: '0.8rem', paddingBottom: '0.8rem' }}>
          {title}
        </DialogTitle>
        <DialogContent>
          <div style={{ minWidth: 500 }}>
            <div className="space-y-5 bg-white py-2">
              {children}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <div className="text-center flex flex-row-reverse my-3">
            <button
              type="submit"
              className="
                          bg-gradient-to-r from-teal-400 to-teal-600 shadow 
                          hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
                          mx-1
                          min-w-min
                          shadow 
                          focus:shadow-outline 
                          focus:outline-none 
                          text-white font-bold py-2 px-4 rounded
                        "
            >
              {t('teacher.modal.button_save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="
                          bg-gradient-to-r from-white to-gray-200 mr-3  
                          hover:bg-gradient-to-r hover:from-gray-200 
                          hover:to-gray-300
                          mx-1 
                          min-w-min
                          shadow 
                          focus:shadow-outline 
                          focus:outline-none 
                          text-teal-600 font-bold py-2 px-4 rounded
                        "
            >
              {t('teacher.modal.button_close')}
            </button>
          </div>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormModal;

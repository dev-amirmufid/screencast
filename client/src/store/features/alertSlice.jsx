import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isOpen: false,
  title: "",
  excerpt: "",
  confirm: {
    status: false,
    labelBtnTrue: "",
    labelBtnfalse: "",
  },
  action : {
    handleChange: ()=> console.log('empty action'),
    onBtnTrueHandler: ()=> console.log('empty action')
  },
  labelBtnClose : ""
}

export const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    showAlert: (state,action) => {
      state.isOpen = true;
      state.title = action.payload?.title || state.title;
      state.excerpt = action.payload?.excerpt || state.excerpt;
      state.confirm = action.payload?.confirm || false;
      state.action = {
        ...state.action , 
        handleChange : action.payload?.action?.handleChange || state.action?.handleChange,
        onBtnTrueHandler : action.payload?.action?.onBtnTrueHandler || state.action?.onBtnTrueHandler
      }
      state.labelBtnClose = action.payload?.labelBtnClose || state.labelBtnClose
    },
    closeAlert: (state, action) => {
      state.isOpen = false
      state.title = ""
      state.excerpt = ""
      state.confirm = {
        status: false,
        labelBtnTrue: "",
        labelBtnfalse: "",
      },
      state.action = {
        handleChange: ()=> console.log('empty action'),
        onBtnTrueHandler: ()=> console.log('empty action')
      }
      state.labelBtnClose = action.payload?.labelBtnClose || state.labelBtnClose
    },
    initAlert: (state, action) => {
      state.isOpen = false;
      state.title = action.payload?.title || state.title;
      state.excerpt = action.payload?.excerpt || state.excerpt;
      state.confirm = action.payload?.confirm || state.confirm;
      state.action = {
        ...state.action , 
        handleChange : action.payload?.action?.handleChange || state.action?.handleChange,
        onBtnTrueHandler : action.payload?.action?.onBtnTrueHandler || state.action?.onBtnTrueHandler
      }
      state.labelBtnClose = action.payload?.labelBtnClose || state.labelBtnClose
    }
  },
})

export const { showAlert, closeAlert, initAlert } = alertSlice.actions

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  messageType: "",
  type: "",
  data: ""
}

export const socketMessageSlice = createSlice({
  name: 'socket_message',
  initialState,
  reducers: {
    reciveSocketMessage : (state,action) => {
      state.messageType = action.payload?.messageType;
      state.type = action.payload?.type;
      state.data = action.payload?.data;
    }
  },
})

export const { reciveSocketMessage } = socketMessageSlice.actions

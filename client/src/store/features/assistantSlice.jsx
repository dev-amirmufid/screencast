import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isAssistant : false,
  joinStatus : false,
  room : null,
  params : null
}

export const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    joinAssistant: (state, action) => {
    //console.log('initAssistant','slice')
      state.isAssistant = true;
      state.joinStatus = true;
      state.room = action.payload
      state.params = {
        tenant_id : action.payload.tenant_id,
        room_uri : action.payload.room_uri
      };
    },
    leaveAssistant: (state, action) => {
      localStorage.removeItem('assistantRoomData')
      localStorage.removeItem('assistantRoom')
      state.isAssistant = false;
      state.joinStatus = false;
      state.room = null
      state.params = null
    },
    initAssistant: (state, action) => {
      state.isAssistant = true;
      state.params = action.payload
    },
    fetchRoomAssistant: (state,action) => {
      const room = JSON.parse(localStorage.getItem("assistantRoomData"))
      if(room){
        state.room = room
        state.isAssistant = true;
        state.joinStatus = true;
        state.params = {
          tenant_id : room?.tenant_id,
          room_uri : room?.room_uri
        };
      }
    },
  },
})

export const { joinAssistant, leaveAssistant, initAssistant, fetchRoomAssistant } = assistantSlice.actions

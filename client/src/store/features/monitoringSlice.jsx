import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { WATCHING_SET_USER_STATUS,WATCHING_USER_RESET,WATCHING_SET_TYPE,WATCHING_SET_START } from "../actions";
import { setWsRoomId, wsSend } from '../redux/websocket/actions';
import { unsetUserCompare } from "../redux/watching/actions";
import { studentConf } from "../../constant/configWS";

const initialState = {
  roomStatus: "", // exist, expiry, no exist
  room: {},
  participants: [],
  studentURL: { qrcode: "", url: "" },
  assistantURL: { qrcode: "", url: "" },
  userTenant:null,
  pollingIntervalRange : 0
};

export const userConnected = createAsyncThunk('monitoring/userConnected',
  async (payload, {dispatch,getState,rejectWithValue}) => {
    try {
      if(![0,2].includes(parseInt(payload.room_exist))){
        const payloadInterval = {
          type: "polling_session",
          user_id: payload.user_id,
          username: payload.username,
          room_id: payload.room_id,
          room_name: payload.room_name,
        };
        dispatch(wsSend(payloadInterval));
      }

      return payload;
    } catch(err) {
     return rejectWithValue(err.response.data)
    }
  }
)

export const clearData = createAsyncThunk('monitoring/clearData',
  async (payload, {dispatch,getState,rejectWithValue}) => {
    try {
      dispatch(wsSend(payload));
      localStorage.removeItem("roomData")
      return {
        roomStatus: "", // exist, expiry, no exist
        room: "",
        participants: [],
        studentURL: { qrcode: "", url: "" },
        assistantURL: { qrcode: "", url: "" },
      };
    } catch(err) {
     return rejectWithValue(err.response.data)
    }
  }
)

export const refreshScreen = createAsyncThunk('monitoring/refreshScreen',
  async (payload, {dispatch,getState,rejectWithValue}) => {
    try {
      const state = getState();
      const participants = state.monitoring.participants;
      const watching = state.watching;
      let res = {}

      if (payload.last_screen_default == 2 || payload.user_exist !== 1) {
        if (payload.user_exist !== 1) {
          let participantNew = participants.filter(
            (user) => user.user_id !== payload.user_id
          );
          res.participants = participantNew
        }
        if (watching.type === "compare" || watching.type === "split") {
          // this function can remove existing user
          dispatch(unsetUserCompare(payload.user_id));
        //console.log(watching.users.length,'watching.users.length')
          if (watching.users.length === 0 && watching.isWatching) {
            dispatch({ type: WATCHING_USER_RESET, payload: [] });
            dispatch({ type: WATCHING_SET_TYPE, payload: "watching" });
            dispatch({ type: WATCHING_SET_START, payload: false });
          }
        }

        dispatch({
          type: WATCHING_SET_USER_STATUS,
          payload: { status: "disconnect", user_id: payload.user_id },
        });
      }

      if (payload.user_exist === 1) {
        let cekExist = participants.find((user) => user.user_id === payload.user_id);
        if (!cekExist) {
          res.participants = [...participants, payload];
        } else {
          res.participants = participants.map((user) =>
            user.user_id === payload.user_id ? payload : user
          );
        }
      }
      return res;
    } catch(err) {
     return rejectWithValue(err.response.data)
    }
  }
)

export const fetchRoom = createAsyncThunk('monitoring/fetchRoom',
  async (payload, {dispatch,getState,rejectWithValue}) => {
    try {
      dispatch(wsSend({
        type : "fetch_room",
        tenant_id : payload.tenant_id,
        room_id : payload.room_id
      }));
      
      const room = JSON.parse(localStorage.getItem("roomData"));

      return {
        room : room,
        studentURL : room.studentURL,
        assistantURL : room.assistantURL,
        roomStatus : room ? "exist":"no_exist"
      }
    } catch(err) {
     return rejectWithValue(err.response.data)
    }
  }
)

export const deleteRoom = createAsyncThunk('monitoring/deleteRoom',
  async (payload, {dispatch,getState,rejectWithValue}) => {
    try {
      dispatch(setWsRoomId('room_not_found'))      
      localStorage.removeItem("roomData");

      return {
        roomStatus: "no_exist", // exist, expiry, no exist
        room: {},
        participants: [],
        studentURL: { qrcode: "", url: "" },
        assistantURL: { qrcode: "", url: "" },
      }
    } catch(err) {
     return rejectWithValue(err.response.data)
    }
  }
)

export const userTenant = createAsyncThunk('monitoring/userTenant',
  async (payload, {dispatch,getState,rejectWithValue})=>{
    try {
      var currentTenant = getState().websocket.tenant_id;
      if(currentTenant == payload.tenant){
      //console.log(payload)
        return payload;
      }else{
      //console.log(currentTenant,payload.tenant);
        return rejectWithValue(null);
      }
    } catch (err) {
      return rejectWithValue(err.response.data)
    }
  }
)

export const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    forceLeaveRoom : (state,action) => {
      state.roomStatus = "force_leave"
    },
    joinRoom: (state,action) => {
      localStorage.setItem('roomData', JSON.stringify(action.payload))
      state.room = action.payload
      state.studentURL = action.payload?.studentURL
      state.assistantURL = action.payload?.assistantURL
      state.roomStatus = "exist"
    },
    initParticipant: (state, action) => {
      state.participants = action.payload.participants
      const intervalRange =  studentConf.getRefreshScreenInterval(action.payload.participants.length)
      state.pollingIntervalRange = intervalRange
    },
    leaveRoom : (state,action) => {
      localStorage.removeItem("roomData");

      state.roomStatus = "";
      state.room = {};
      state.participants = [];
      state.studentURL = { qrcode: "", url: "" };
      state.assistantURL = { qrcode: "", url: "" };
    },
    setStudentUrl : (state,action) => {
      state.studentURL = { 
        qrcode: action.payload.qrcode, 
        url: action.payload.url
      }
    },
    setAssistantUrl : (state,action) => {
      state.assistantURL = { 
        qrcode: action.payload.qrcode, 
        url: action.payload.url
      }
    },
    timeOut : (state,action) => {
      
    }
  },
  extraReducers : (builder) => {
    // userConected
    builder.addCase(userConnected.fulfilled, (state, action) => {
      if (parseInt(action.payload.room_exist) === 0) {
        state.roomStatus = "no_exist"
      } else if (parseInt(action.payload.room_exist) === 2) {
        state.roomStatus = "expiry"
      } else {
        state.roomStatus = "exist"
      }
    }),

    // userConected
    builder.addCase(clearData.fulfilled, (state, action) => {
      state = action.payload
    }),

    // userConected
    builder.addCase(refreshScreen.fulfilled, (state, action) => {
      state.participants = action.payload.participants
    }),

    // fetchRoom
    builder.addCase(fetchRoom.fulfilled, (state, action) => {
      state.room = action.payload.room
      state.studentURL = action.payload.studentURL
      state.assistantURL = action.payload.assistantURL
      state.roomStatus = action.payload.roomStatus
    }),

    // fetchRoom
    builder.addCase(deleteRoom.fulfilled, (state, action) => {
      state.roomStatus = action.payload.roomStatus // exist, expiry, no exist
      state.room = action.payload.room
      state.participants = action.payload.participants
      state.studentURL = action.payload.studentURL
      state.assistantURL = action.payload.assistantURL
    }),  
    builder.addCase(userTenant.fulfilled, (state, action) => {
      state.userTenant = action.payload.userTenant
    })
  }
})

export const { joinRoom, leaveRoom,  setStudentUrl, setAssistantUrl, timeOut, initParticipant, forceLeaveRoom } = monitoringSlice.actions

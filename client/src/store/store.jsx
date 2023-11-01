import { configureStore } from '@reduxjs/toolkit'

//middleware
import socketMiddleware from "../middleware/socketIoMiddleware";

//slice
import { websocketReducer } from "./redux/websocket/reducer";
import { roomRegisterReducer } from "./redux/roomRegister/reducer";
// import { monitoringReducer } from "./redux/monitoring/reducer";
import { joinRoomReducer } from "./redux/joinRoom/reducer";
import { studentRoomReducer } from "./redux/studentRoom/reducer";
import { watchingReducer } from "./redux/watching/reducer";
import { joinRoomAssistantReducer } from "./redux/joinRoomAssistant/reducer";
import { alertSlice } from './features/alertSlice';
import { monitoringSlice } from './features/monitoringSlice';
import { assistantSlice } from './features/assistantSlice';
import { socketMessageSlice } from './features/socketMessageSlice';

//api
import { teachersApi } from './services/teachers';
import { tenantsApi } from './services/tenants';
import { schoolsApi } from './services/schools';
import { roomsApi } from './services/rooms';
import { usersApi } from './services/users';
import { logsApi } from './services/logs';

const store = configureStore({
  reducer: {
    websocket: websocketReducer,
    roomRegister: roomRegisterReducer,
    [monitoringSlice.name]: monitoringSlice.reducer,
    [assistantSlice.name]: assistantSlice.reducer,
    [socketMessageSlice.name]: socketMessageSlice.reducer,
    joinRoom: joinRoomReducer,
    studentRoom: studentRoomReducer,
    watching: watchingReducer,
    joinRoomAssistant: joinRoomAssistantReducer,
    [teachersApi.reducerPath] : teachersApi.reducer,
    [tenantsApi.reducerPath] : tenantsApi.reducer,
    [schoolsApi.reducerPath] : schoolsApi.reducer,
    [roomsApi.reducerPath] : roomsApi.reducer,
    [usersApi.reducerPath] : usersApi.reducer,
    [logsApi.reducerPath] : logsApi.reducer,
    [alertSlice.name]: alertSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ 
      serializableCheck: false,
    })
    .concat(teachersApi.middleware)
    .concat(socketMiddleware)
  ,
})

export default store;

import {
    WEBSOCKET_CONNECT,
    WEBSOCKET_CONNECTED,
    WEBSOCKET_DISCONNECT,
    WEBSOCKET_DISCONNECTED,
    WEBSOCKET_RECONNECTED,
    WEBSOCKET_SET_AUTO_RECONNECT,
    WEBSOCKET_SET_STATUS,
    WEBSOCKET_SET_ROOM_ID
  } from "../../actions";
  
  const initialState = {
    connected: false,
    status: "", //connecting, connected, disconnect
    autoReconnect: false,
    reconnected: false,
    socket_room_id: null,
    socket_id: null,
    socket_tenant_id: null
  };
  
  export const websocketReducer = (state = { ...initialState }, action) => {
    switch (action.type) {
      case WEBSOCKET_CONNECT:
        return { ...state, host: action.host };
      case WEBSOCKET_CONNECTED:
        return { ...state, connected: true, status: "connected", socket_id : action.payload.socket_id, tenant_id: action.payload.tenant_id };
      case WEBSOCKET_DISCONNECT:
        return { ...state, connected: false, reconnected: false, status: "disconnect" };
      case WEBSOCKET_RECONNECTED:
        return { ...state, connected: true, reconnected: true, status: "connected" };
      case WEBSOCKET_DISCONNECTED:
        return { ...state, connected: false, reconnected: true, status: "disconnect" };
      case WEBSOCKET_SET_AUTO_RECONNECT:
        return { ...state, autoReconnect: action.payload };
      case WEBSOCKET_SET_STATUS:
        return { ...state, status: action.payload };
      case WEBSOCKET_SET_ROOM_ID:
        return { ...state, socket_room_id: action.payload };
      default:
        return state;
    }
  };
  
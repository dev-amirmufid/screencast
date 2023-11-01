import {
  WEBSOCKET_OPEN,
  WEBSOCKET_CONNECT,
  WEBSOCKET_CONNECTED,
  WEBSOCKET_DISCONNECT,
  WEBSOCKET_DISCONNECTED,
  WEBSOCKET_RECONNECTED,
  WEBSOCKET_SEND,
  WEBSOCKET_SET_AUTO_RECONNECT,
  WEBSOCKET_SET_STATUS,
  WEBSOCKET_JOIN_ROOM,
  WEBSOCKET_LEAVE_ROOM,
  WEBSOCKET_SET_ROOM_ID
} from "../../actions";

export const wsOpen = (payload = null) => ({
  type: WEBSOCKET_OPEN,
  payload,
});
export const wsConnect = (payload = null) => {
  return {
    type: WEBSOCKET_CONNECT,
    payload,
  };
};
export const wsConnected = (payload = null) => ({
  type: WEBSOCKET_CONNECTED,
  payload,
});

export const wsSend = (payload = null) => ({
  type: WEBSOCKET_SEND,
  payload,
});

export const wsDisconnect = (payload = null) => ({
  type: WEBSOCKET_DISCONNECT,
  payload,
});

export const wsDisconnected = (payload = null) => ({
  type: WEBSOCKET_DISCONNECTED,
  payload,
});

export const wsReconnected = (payload = null) => ({
  type: WEBSOCKET_RECONNECTED,
  payload,
});

export const wsSetStatus = (payload = null) => ({
  type: WEBSOCKET_SET_STATUS,
  payload,
});

export const wsSetAutoReconnect = (payload = null) => ({
  type: WEBSOCKET_SET_AUTO_RECONNECT,
  payload,
});

export const wsJoinRoom = (payload = null) => ({
  type: WEBSOCKET_JOIN_ROOM,
  payload,
});

export const wsLeaveRoom = (payload = null) => ({
  type: WEBSOCKET_LEAVE_ROOM,
  payload,
});

export const setWsRoomId = (payload = null) => ({
  type: WEBSOCKET_SET_ROOM_ID,
  payload,
});

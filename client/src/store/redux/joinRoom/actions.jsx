import {
  JOIN_ROOM,
  JOIN_ROOM_SET_STATUS_JOIN,
  JOIN_ROOM_SET_ACCOUNT_OPENID,
} from "../../actions";

export const joinRoom = (data) => async (dispatch) => {
  if (data.is_exist === 0) {
    await dispatch({ type: JOIN_ROOM_SET_STATUS_JOIN, payload: "failed" });
  } else if (data.is_exist === 3) {
    await dispatch({ type: JOIN_ROOM_SET_STATUS_JOIN, payload: "server_full" });
  } else if (data.is_exist === 4) {
    await dispatch({ type: JOIN_ROOM_SET_STATUS_JOIN, payload: "room_full" });
  } else {
    await dispatch({ type: JOIN_ROOM, payload: data });
  }
};

export const updateStatusJoin = (data) => async (dispatch) => {
  await dispatch({ type: JOIN_ROOM_SET_STATUS_JOIN, payload: data });
};

export const setAccountOpenID = (data) => async (dispatch) => {
  await dispatch({ type: JOIN_ROOM_SET_ACCOUNT_OPENID, payload: data });
};

import { ASSISTANT_JOIN_ROOM, ASSISTANT_JOIN_ROOM_SET_STATUS_JOIN } from "../../actions";

export const joinRoomAssistant = (data) => async (dispatch) => {
  if (data.is_exist === 0) {
    await dispatch({ type: ASSISTANT_JOIN_ROOM_SET_STATUS_JOIN, payload: "failed" });
  } else {
    await dispatch({ type: ASSISTANT_JOIN_ROOM, payload: data });
  }
};

export const updateStatusJoin = (data) => async (dispatch) => {
  await dispatch({ type: ASSISTANT_JOIN_ROOM_SET_STATUS_JOIN, payload: data });
};

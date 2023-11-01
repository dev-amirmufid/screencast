import * as api from "../../../api";;
import { CREATE_ROOM, CREATE_ROOM_FAILED } from "../../actions";
import { wsSend } from "../websocket/actions";

// action room
export const roomRegister = (roomData) => async (dispatch) => {
  const { data } = await api.teacherCreateRoom(roomData);
  const payload = { ...data?.data, ...{ type: "create_room", override: 0 } };
  dispatch(wsSend(payload));
};

export const createRoom = (roomData) => async (dispatch) => {
  dispatch({ type: CREATE_ROOM, payload: roomData });
};

export const createRoomFailed = (roomData) => async (dispatch) => {
  dispatch({ type: CREATE_ROOM_FAILED, payload: roomData });
};

import { CREATE_ROOM, CREATE_ROOM_FAILED } from "../../actions";

const initState = {
  createStatus: null,
  data: {},
};

export const roomRegisterReducer = (roomData = initState, action) => {
  switch (action.type) {
    case CREATE_ROOM:
      localStorage.setItem("roomData", JSON.stringify({ ...action?.payload }));
      return { ...roomData, data: action.payload, createStatus: "success" };
    case CREATE_ROOM_FAILED:
      return { ...roomData, data: action.payload, createStatus: "failed" };
    default:
      return roomData;
  }
};

import {
  JOIN_ROOM,
  JOIN_ROOM_SET_STATUS_JOIN,
  JOIN_ROOM_SET_ACCOUNT_OPENID,
} from "../../actions";

const initState = {
  data: {},
  openIDAccount: {},
  joinStatus: null,
};

export const joinRoomReducer = (roomData = initState, action) => {
  switch (action.type) {
    case JOIN_ROOM:
      localStorage.setItem("studentRoom", JSON.stringify({ ...action?.payload }));
      return { ...roomData, data: action.payload, joinStatus: "success" };
    case JOIN_ROOM_SET_STATUS_JOIN:
      return { ...roomData, joinStatus: action.payload };
    case JOIN_ROOM_SET_ACCOUNT_OPENID:
      localStorage.setItem("openIDAccount", JSON.stringify(action?.payload));
      return { ...roomData, openIDAccount: action.payload };
    default:
      return roomData;
  }
};

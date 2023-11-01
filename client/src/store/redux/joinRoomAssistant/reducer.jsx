import { ASSISTANT_JOIN_ROOM, ASSISTANT_JOIN_ROOM_SET_STATUS_JOIN } from "../../actions";

const initState = {
  data: {},
  joinStatus: null,
};

export const joinRoomAssistantReducer = (roomData = initState, action) => {
  switch (action.type) {
    case ASSISTANT_JOIN_ROOM:
      return { ...roomData, data: action.payload, joinStatus: "success" };
    case ASSISTANT_JOIN_ROOM_SET_STATUS_JOIN:
      return { ...roomData, joinStatus: action.payload };
    default:
      return roomData;
  }
};

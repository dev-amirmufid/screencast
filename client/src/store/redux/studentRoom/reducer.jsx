import {
  STUDENT_FETCH_ROOM,
  STUDENT_UPDATE_ROOM_STATUS,
  STUDENT_SET_STATUS_WATCHING,
  STUDENT_SET_WATCHING_USER,
  STUDENT_SET_AUDIO,
  STUDENT_SET_MUTE,
  STUDENT_SET_SHARE_SCREEN,
  STUDENT_SET_ISWATCHING,
  STUDENT_ROOM_TIME_OUT,
  STUDENT_SET_SS_STOPPED,
  STUDENT_SET_STUDENT_ID_LIST
} from "../../actions";

const initState = {
  roomStatus: "exist", // exist, expiry, no exist
  room: JSON.parse(localStorage.getItem("studentRoom")),
  watching: {
    watchingAllowed: 0, //(0: not available, 1: available, 2: user is watching)
    watchingUserID: 0,
  },
  audioEnabled: false,
  mute: false,
  isShareScreen: false,
  isWatching: false,
  isTimeOut: false,
  ssStopped: false,
  studentIdList:[]
};

export const studentRoomReducer = (studentRoom = initState, action) => {
  switch (action.type) {
    case STUDENT_FETCH_ROOM:
      return {
        ...studentRoom,
        room: JSON.parse(localStorage.getItem("studentRoom")),
      };
    case STUDENT_UPDATE_ROOM_STATUS:
      return { ...studentRoom, roomStatus: action.payload };
    case STUDENT_SET_STATUS_WATCHING:
      return {
        ...studentRoom,
        watching: { ...studentRoom.watching, watchingAllowed: action.payload },
      };
    case STUDENT_SET_WATCHING_USER:
      return {
        ...studentRoom,
        watching: { ...studentRoom.watching, watchingUserID: action.payload },
      };
    case STUDENT_SET_AUDIO:
      return { ...studentRoom, audioEnabled: action.payload };
    case STUDENT_SET_MUTE:
      return { ...studentRoom, mute: action.payload };
    case STUDENT_SET_SHARE_SCREEN:
      return { ...studentRoom, isShareScreen: action.payload };
    case STUDENT_SET_ISWATCHING:
      return { ...studentRoom, isWatching: action.payload };
    case STUDENT_ROOM_TIME_OUT:
      return { ...studentRoom, isTimeOut: true };
    case STUDENT_SET_SS_STOPPED:
      return { ...studentRoom, ssStopped: action.payload };
    case STUDENT_SET_STUDENT_ID_LIST:
      return { ...studentRoom, studentIdList: action.payload };
    default:
      return studentRoom;
  }
};

import {
  MONITORING_FETCH_ROOM,
  MONITORING_UPDATE_ROOM_STATUS,
  MONITORING_REFRESH_SCREEN,
  MONITORING_DESTROY,
  MONITORING_SET_STUDENT_URL,
  MONITORING_SET_ASSISTANT_URL,
} from "../../actions";

const initState = {
  roomStatus: "exist", // exist, expiry, no exist
  room: JSON.parse(localStorage.getItem("roomData")),
  participants: [
    // {
    //   last_screen: "https://cdn.pixabay.com/photo/2014/06/03/19/38/board-361516__340.jpg",
    //   last_screen_date: 1632939507741,
    //   last_screen_default: 0,
    //   os: 1,
    //   room_id: "a6275559aeb1bcbbfdcd2a299790dcf5",
    //   type: "refresh_screen",
    //   user_exist: 1,
    //   user_id: "qwewqe",
    //   username: "dodi ",
    // },
    // {
    //   last_screen: "https://cdn.pixabay.com/photo/2016/11/15/07/09/photo-manipulation-1825450__340.jpg",
    //   last_screen_date: 1632939507741,
    //   last_screen_default: 0,
    //   os: 1,
    //   room_id: "a6275559aeb1bcbbfdcd2a299790dcf5",
    //   type: "refresh_screen",
    //   user_exist: 1,
    //   user_id: "sasdasd",
    //   username: " Setiawan",
    // },
    // {
    //   last_screen: "https://cdn.pixabay.com/photo/2018/04/14/20/12/texture-3319946__340.jpg",
    //   last_screen_date: 1632939507741,
    //   last_screen_default: 0,
    //   os: 1,
    //   room_id: "a6275559aeb1bcbbfdcd2a299790dcf5",
    //   type: "refresh_screen",
    //   user_exist: 1,
    //   user_id: "qweqwe",
    //   username: "sadsadn",
    // },
    // {
    //   last_screen: "https://cdn.pixabay.com/photo/2016/11/15/07/09/photo-manipulation-1825450__340.jpg",
    //   last_screen_date: 1632939507741,
    //   last_screen_default: 0,
    //   os: 1,
    //   room_id: "a6275559aeb1bcbbfdcd2a299790dcf5",
    //   type: "refresh_screen",
    //   user_exist: 1,
    //   user_id: "1044876744",
    //   username: "123213",
    // },
    // {
    //   last_screen: "https://cdn.pixabay.com/photo/2016/11/15/07/09/photo-manipulation-1825450__340.jpg",
    //   last_screen_date: 1632939507741,
    //   last_screen_default: 0,
    //   os: 1,
    //   room_id: "a6275559aeb1bcbbfdcd2a299790dcf5",
    //   type: "refresh_screen",
    //   user_exist: 1,
    //   user_id: "123213saswd",
    //   username: "doasdsadsadi ",
    // },
    // {
    //   last_screen: "https://cdn.pixabay.com/photo/2016/11/15/07/09/photo-manipulation-1825450__340.jpg",
    //   last_screen_date: 1632939507741,
    //   last_screen_default: 0,
    //   os: 1,
    //   room_id: "a6275559aeb1bcbbfdcd2a299790dcf5",
    //   type: "refresh_screen",
    //   user_exist: 1,
    //   user_id: "sasda123213sd",
    //   username: " Setiawabambangn",
    // },
    // {
    //   last_screen: "https://cdn.pixabay.com/photo/2018/04/14/20/12/texture-3319946__340.jpg",
    //   last_screen_date: 1632939507741,
    //   last_screen_default: 0,
    //   os: 1,
    //   room_id: "a6275559aeb1bcbbfdcd2a299790dcf5",
    //   type: "refresh_screen",
    //   user_exist: 1,
    //   user_id: "qweq444we",
    //   username: "udit",
    // },
    // {
    //   last_screen: "https://cdn.pixabay.com/photo/2018/04/13/09/41/wall-3316062__340.jpg",
    //   last_screen_date: 1632939507741,
    //   last_screen_default: 0,
    //   os: 1,
    //   room_id: "a6275559aeb1bcbbfdcd2a299790dcf5",
    //   type: "refresh_screen",
    //   user_exist: 1,
    //   user_id: "16666044876744",
    //   username: "agus",
    // },
  ],
  studentURL: { qrcode: "", url: "" },
  assistantURL: { qrcode: "", url: "" },
};

export const monitoringReducer = (monitoring = initState, action) => {
  switch (action.type) {
    case MONITORING_FETCH_ROOM:
      return {
        ...monitoring,
        room: JSON.parse(localStorage.getItem("roomData")),
      };
    case MONITORING_UPDATE_ROOM_STATUS:
      return { ...monitoring, roomStatus: action.payload };
    case MONITORING_REFRESH_SCREEN:
      return { ...monitoring, participants: action.payload };
    case MONITORING_DESTROY:
      return initState;
    case MONITORING_SET_STUDENT_URL:
      return { ...monitoring, studentURL: action.payload };
    case MONITORING_SET_ASSISTANT_URL:
      return { ...monitoring, assistantURL: action.payload };
    default:
      return monitoring;
  }
};

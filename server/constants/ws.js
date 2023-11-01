const wsTypes = {
  USER_CONNECTED: "user_connected",
  POLLING_SESSION: "polling_session",
  PING: "ping",
  OFFER: "offer",
  ANSWER: "answer",
  ICE: "ice",
  CREATE_ROOM: "create_room",
  CREATE_ROOM_FAILED: "create_room_failed",
  DELETE_ROOM: "delete_room",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  LEAVE_ROOM_ASSISTANT: "leave_room_assistant",
  REFRESH_SCREEN: "refresh_screen",
  WATCHING: "watching",
  WATCHING_STATUS: "watching_status",
  WATCHING_STOP: "watching_stop",
  GENERATE_ROOM: "generate_room",
  TIME_OUT: "time_out",
  STUDENT_ID_LIST: "student_id_list",
  JOIN_WS_ROOM: "join_socket_room",
  LEAVE_WS_ROOM: "leave_socket_room",
  FETCH_ROOM: "fetch_room"
};

const wsConf = {
  CONFIG: {
    iceServers: [
      {
        urls: "turn:s-turn.uird.jp:443?transport=udp",
        username: "realcast",
        credential: "rS2N9Hz",
      },
      {
        urls: "turn:s-turn.uird.jp:443?transport=tcp",
        username: "realcast",
        credential: "rS2N9Hz",
      },
    ],
  },
};

const userType = {
  TEACHER: "teacher",
  ASSISTANT: "assistant",
  STUDENT: "student",
};

const osType = {
  OS_BROWSER: 1,
  OS_IOS: 2,
};

const limit = {
  MAX_STUDENT: 10000,
  MAX_ASSISTANT: 10000,
  MAX_TOTAL_USER: 10000,
  MAX_USED_TIME: 0, // menit
};

export { wsTypes, userType, osType, wsConf, limit };

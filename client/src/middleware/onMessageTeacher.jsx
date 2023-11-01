import { createRoom, createRoomFailed } from "../store/redux/roomRegister/actions";
import { joinRoomAssistant } from "../store/redux/joinRoomAssistant/actions";
import { reciveSocketMessage } from "../store/features/socketMessageSlice";

import {
  watching,
  watchingStatus,
  receiveOffer,
  receiveICE,
} from "../store/redux/watching/actions";

import { 
  userConnected,
  refreshScreen,
  deleteRoom,
  timeOut,
  leaveRoom,
  initParticipant,
  userTenant
} from "../store/features/monitoringSlice";
import { closeAlert, showAlert } from "../store/features/alertSlice";

const onMessageTeacher = (store, data) => {
  let type = data.type;
  
  switch (type) {
    case "create_room":
      store.dispatch(createRoom(data));
      break;
    case "create_room_failed":
      store.dispatch(createRoomFailed(data));
      break;
    case "join_room":
      store.dispatch(joinRoomAssistant(data));
      break;
    case "leave_room":
      store.dispatch(leaveRoom(data));
      break;

    case "user_connected":
      store.dispatch(userConnected(data));
      break;
    case "refresh_screen":
      store.dispatch(refreshScreen(data));
      break;
    case "watching":
      store.dispatch(watching(data));

      break;
    case "watching_status":
      store.dispatch(watchingStatus(data));

      break;
    case "offer":
      store.dispatch(receiveOffer(data));
      break;
    case "ice":
      store.dispatch(receiveICE(data));
      break;
    case "delete_room":
      store.dispatch(deleteRoom(data));
      break;
    case "time_out":
      store.dispatch(timeOut(data));
      break;
    case "fetch_room":
      store.dispatch(initParticipant(data));
      break;
    case "user_tenant":
      store.dispatch(userTenant(data));
      break;
    case "alert_limit_user":
      store.dispatch(reciveSocketMessage(data))
    default:
    //console.log("default", data);
  }
};

export default onMessageTeacher;

import { userTenant } from "../store/features/monitoringSlice";
import { joinRoom } from "../store/redux/joinRoom/actions";
import {
  userConnected,
  watching,
  receiveICE,
  receiveAnswer,
  watchingStop,
  roomTimeOut,
  updateStudentIdList,
} from "../store/redux/studentRoom/actions";

const onMessageStudent = (store, data) => {
  let type = data.type;

  switch (type) {
    case "join_room":
      store.dispatch(joinRoom(data));
      break;
    case "user_connected":
      store.dispatch(userConnected(data));
      break;
    case "watching":
      store.dispatch(watching(data));
      break;
    case "ice":
      store.dispatch(receiveICE(data));
      break;
    case "answer":
      store.dispatch(receiveAnswer(data));
      break;
    case "watching_stop":
      store.dispatch(watchingStop(data));
      break;
    case "time_out":
      store.dispatch(roomTimeOut(data));
      break;
    case "student_id_list":
      store.dispatch(updateStudentIdList(data));
      break;
    case "user_tenant":
      store.dispatch(userTenant(data));
      break;
    default:
  }
};

export default onMessageStudent;

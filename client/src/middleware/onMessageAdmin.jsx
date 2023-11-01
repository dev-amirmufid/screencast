import i18n from "../i18n";
import { closeAlert, showAlert } from "../store/features/alertSlice";
import { reciveSocketMessage } from "../store/features/socketMessageSlice";

const onMessageAdmin = (store, data) => {
  store.dispatch(reciveSocketMessage(data))
  let type = data.type;
  const t = i18n.t;

  switch (type) {
    case "failed_load_socket":
      store.dispatch(showAlert({
        title :t('alert.name'),
        excerpt : t('alert.text.failed_load_socket'),
        action : {
          handleChange : () => store.dispatch(closeAlert())
        }
      }))
      break;
    default:
  }
};

export default onMessageAdmin;

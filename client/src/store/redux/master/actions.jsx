import * as api from "../../../api";;
import { SET_USER_LOGIN } from "../../actions";

export const setLoginUser = (type) => ({ type: SET_USER_LOGIN, payload: type });

export const authStudent = (roomData) => async () => {
  const { data } = await api.authStudent(roomData);
  return data;
};

export const authAssistant = (roomData) => async () => {
  const { data } = await api.authAssistant(roomData);
  return data;
};

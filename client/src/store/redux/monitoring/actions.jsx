import {
  MONITORING_FETCH_ROOM,
  MONITORING_UPDATE_ROOM_STATUS,
  MONITORING_REFRESH_SCREEN,
  MONITORING_DESTROY,
  MONITORING_SET_STUDENT_URL,
  MONITORING_SET_ASSISTANT_URL,
  WATCHING_SET_USER_STATUS,
  WATCHING_USER_RESET,
  WATCHING_SET_TYPE,
  WATCHING_SET_START,
} from "../../actions";
import { wsSend } from "../websocket/actions";
import { setUserCompare, unsetUserCompare } from "../watching/actions";
import { wsConf } from "../../../constant/configWS";

import * as api from "../../../api";;

export const fetchRoom = () => async (dispatch) => {
  dispatch({ type: MONITORING_FETCH_ROOM, payload: {} });
};

export const userConnected = (data) => async (dispatch) => {
  if (parseInt(data.room_exist) === 0) {
    dispatch({ type: MONITORING_UPDATE_ROOM_STATUS, payload: "no_exist" });
  } else if (parseInt(data.room_exist) === 2) {
    dispatch({ type: MONITORING_UPDATE_ROOM_STATUS, payload: "expiry" });
  } else {
    initPolling(data, dispatch);
    dispatch({ type: MONITORING_UPDATE_ROOM_STATUS, payload: "exist" });
  }
};

const initPolling = (data, dispatch) => {
  setInterval(function () {
    let payload = {
      type: "polling_session",
      user_id: data.user_id,
      username: data.username,
      room_id: data.room_id,
      room_name: data.room_name,
    };
    dispatch(wsSend(payload));
  }, wsConf.POLLING_INTERVAL);
};

export const refreshScreen = (data) => async (dispatch, getState) => {
  const state = getState();
  const participants = state.monitoring.participants;
  const watching = state.watching;

  if (data.last_screen_default == 2 || data.user_exist !== 1) {
    if (data.user_exist !== 1) {
      let participantNew = participants.filter(
        (user) => user.user_id !== data.user_id
      );
      dispatch({ type: MONITORING_REFRESH_SCREEN, payload: participantNew });
    }
    if (watching.type === "compare" || watching.type === "split") {
      // this function can remove existing user
      dispatch(unsetUserCompare(data.user_id));

      if (watching.users.length === 0) {
        dispatch({ type: WATCHING_USER_RESET, payload: [] });
        dispatch({ type: WATCHING_SET_TYPE, payload: "watching" });
        dispatch({ type: WATCHING_SET_START, payload: false });
      }
    }

    dispatch({
      type: WATCHING_SET_USER_STATUS,
      payload: { status: "disconnect", user_id: data.user_id },
    });
  }

  if (data.user_exist === 1) {
    let cekExist = participants.find((user) => user.user_id === data.user_id);
    if (!cekExist) {
      let mergeData = [...participants, data];

      dispatch({ type: MONITORING_REFRESH_SCREEN, payload: mergeData });
    } else {
      let participantUpdate = participants.map((user) =>
        user.user_id === data.user_id ? data : user
      );

      dispatch({ type: MONITORING_REFRESH_SCREEN, payload: participantUpdate });
    }
  }
};

export const leaveRoom = (data) => async (dispatch, getState) => {

};

export const clearData = (data) => async (dispatch) => {
  dispatch({ type: MONITORING_DESTROY, payload: {} });
  dispatch(wsSend(data));
};

export const deleteRoom = (data) => async (dispatch) => {
  localStorage.removeItem("roomData");
  window.location.href = `${import.meta.env.VITE_BASE_PATH}`;
};

export const generateStudentURL = (roomData) => async (dispatch) => {
  var root = document.location.protocol + '//' + document.location.host;
  roomData.host = root;
  const { data } = await api.generateStudentURL(roomData);
  dispatch({ type: MONITORING_SET_STUDENT_URL, payload: data?.data });
};

export const generateAssistantURL = (roomData) => async (dispatch) => {
  var root = document.location.protocol + '//' + document.location.host;
  roomData.host = root;
  const { data } = await api.generateAssistantURL(roomData);
  dispatch({ type: MONITORING_SET_ASSISTANT_URL, payload: data.data });
};

export const timeOut = (roomData) => async (dispatch) => {
  
};

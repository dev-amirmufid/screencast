import {
  WATCHING_SET_START,
  WATCHING_USER_RESET,
  WATCHING_SET_TYPE,
  WATCHING_SET_USER,
  WATCHING_SET_USER_STATUS,
  WATCHING_SET_LOADING,
} from "../../actions";

import { wsSend } from "../websocket/actions";
import { wsConf, browserType } from "../../../constant/configWS";
import { storeLog } from "../log/actions";

// set watching status start/finish
export const setWatchingStart = (data) => async (dispatch) => {
  dispatch({ type: WATCHING_SET_START, payload: data });
};

// set watching type compare/watching (default: watching)
export const setWatchingType = (data) => async (dispatch) => {
  dispatch({ type: WATCHING_SET_TYPE, payload: data });
};

// set watching status ready, not_ready or disconnect
export const setWatchingStatus = (data) => async (dispatch) => {
  dispatch({
    type: WATCHING_SET_USER_STATUS,
    payload: data,
  });
};

// set watching users for comparison or default watching
export const setUserWatching = (participant) => async (dispatch) => {
  dispatch({ type: WATCHING_SET_USER, payload: [...[], participant] });
};

// reset user state to 0
export const setUserReset = () => async (dispatch) => {
  dispatch({ type: WATCHING_USER_RESET, payload: [] });
};

// if watching type is compare use this method
export const setUserCompare = (participantId) => async (dispatch, getState) => {
  //get state from reducer
  const state = getState();
  const userWatching = state.watching.users;
  const participants = state.monitoring.participants;

  // find user
  let find = userWatching.findIndex((user) => user.user_id === participantId);
  if (find > -1) {
    userWatching.splice(find, 1);
    dispatch({ type: WATCHING_SET_USER, payload: [...userWatching] });
  } else {
    const payload = [
      ...userWatching,
      participants.find((user) => user.user_id === participantId),
    ];
    dispatch({ type: WATCHING_SET_USER, payload: payload });
  }
};

export const unsetUserCompare = (participantId) => async (dispatch, getState) => {
  //get state from reducer
  const state = getState();
  const userWatching = state.watching.users;
  const participants = state.monitoring.participants;

  // find user
  let find = userWatching.findIndex((user) => user.user_id === participantId);
  if (find > -1) {
    userWatching.splice(find, 1);
    dispatch({ type: WATCHING_SET_USER, payload: [...userWatching] });
  }
};

export const onWatching = () => async (dispatch, getState) => {
  //get state from reducer
  const state = getState();
  const userWatching = state.watching.users;
  const room = state.monitoring.room;

  // set watching start
  dispatch({ type: WATCHING_SET_START, payload: true });

  // loop user exist on state
  let index = 0
  for (let user of userWatching){
    dispatch({
      type: WATCHING_SET_LOADING,
      payload: { user_id: user.user_id, loading: true },
    });

    // delay 0.5 second for waiting state
    setTimeout(() => {
      let offerData = {
        type: "watching",
        user_id: room.user_id,
        username: user.username,
        room_id: room.room_id,
        room_name: room.room_name,
        target_user_id: user.user_id,
        os: user.os,
      };
      dispatch(wsSend(offerData));
    }, index * 500);
    index++
  }
};

export const watching = (data) => async (dispatch, getState) => {
  const state = getState();
  const room = state.monitoring.room;

  if (data.room_id === room.room_id) {
    // if user not exist
    if (parseInt(data.user_exist) === 0) {
      dispatch({ type: WATCHING_SET_START, payload: false });
      dispatch({
        type: WATCHING_SET_USER_STATUS,
        payload: { status: "disconnect", user_id: data.user_id },
      });
    }
  }
};

export const watchingStatus = (data) => async (dispatch, getState) => {
  const state = getState();
  const room = state.monitoring.room;
  const users = state.watching.users;
  const userIndex = users.findIndex((user) => user.user_id === data.user_id);

  if (userIndex >= 0) {
    if (
      data.room_id === room.room_id &&
      users[userIndex].user_id === data.user_id
    ) {
      
      if (parseInt(data.available) === 0) {
        // set watching start to false
        dispatch({ type: WATCHING_SET_START, payload: false });
        dispatch({
          type: WATCHING_SET_USER_STATUS,
          payload: { status: "not_ready", user_id: data.user_id },
        });
      } else if (data.available === 2) {
        dispatch({
          type: WATCHING_SET_USER_STATUS,
          payload: { status: "is_watching", user_id: data.user_id },
        });
      } else {
        //set loading to false
        await dispatch({
          type: WATCHING_SET_LOADING,
          payload: { user_id: data.user_id, loading: false },
        });

        dispatch({
          type: WATCHING_SET_USER_STATUS,
          payload: { status: "ready", user_id: data.user_id },
        });
      }
    }
  }
};

/* 
  /*This method below for handle dynamic peer connection
  */
let pc2 = {};
export const receiveOffer = (data) => async (dispatch, getState) => {
  const state = getState();
  const room = state.monitoring.room;
  const users = state.watching.users;
  const userIndex = users.findIndex((user) => user.user_id === data.user_id);

  if (
    data.room_id === room.room_id &&
    data.user_id === users[userIndex].user_id
  ) {
    pc2[data.user_id] = new RTCPeerConnection(wsConf.CONFIG);
    var desc = new RTCSessionDescription(data.sessionDescription);
    pc2[data.user_id].addEventListener("icecandidate", (e) =>
      onIceCandidate(pc2[data.user_id], e)
    );
    pc2[data.user_id].addEventListener("iceconnectionstatechange", function(e){
      onIceStateChange(pc2[data.user_id], e);
    });
    pc2[data.user_id].addEventListener("track", gotRemoteStream);

    try {
      await pc2[data.user_id].setRemoteDescription(desc);
      onSetRemoteSuccess(pc2[data.user_id]);
    } catch (e) {
      onSetSessionDescriptionError();
    }

    processAnswer();
  } else {
    
  }

  async function gotRemoteStream(e) {
    const remoteVideo = document.getElementById(`video_${data.user_id}`);
    if (remoteVideo.srcObject !== e.streams[0]) {
      remoteVideo.srcObject = e.streams[0];
    }
  }
  async function processAnswer() {
    try {
      const answer = await pc2[data.user_id].createAnswer();
      await onCreateAnswerSuccess(answer);
    } catch (e) {
      onCreateSessionDescriptionError(e);
    }
  }

  async function onCreateAnswerSuccess(desc) {
    try {
      await pc2[data.user_id].setLocalDescription(desc);
      await sendAnswer(pc2[data.user_id].localDescription);
      onSetLocalSuccess(pc2[data.user_id]);
    } catch (e) {
      onSetSessionDescriptionError(e);
    }
  }

  function sendAnswer(desc) {
    if (users[userIndex].os === browserType.IOS_BROWSER) {
      desc = desc.sdp;
    }
    let offerData = {
      type: "answer",
      room_id: room.room_id,
      user_id: room.user_id,
      username: room.username,
      target_user_id: users[userIndex].user_id,
      sessionDescription: desc,
      candidate: "",
    };
    dispatch(wsSend(offerData));
  }

  async function onIceCandidate(pc, event) {
    if (event.candidate) {
      try {
        await sendICE(event.candidate);
        onAddIceCandidateSuccess(pc);
      } catch (e) {
        onAddIceCandidateError(pc, e);
      }
    }
  }

  async function sendICE(candidate) {
    let offerData = {
      type: "ice",
      room_id: room.room_id,
      user_id: room.user_id,
      username: room.username,
      target_user_id: users[userIndex].user_id,
      candidate: candidate,
    };
    if (users[userIndex].os === browserType.IOS_BROWSER) {
      offerData = {
        type: "ice",
        room_id: room.room_id,
        user_id: room.user_id,
        username: room.username,
        target_user_id: users[userIndex].user_id,
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid,
      };
    }
    dispatch(wsSend(offerData));
  }

  function onIceStateChange(pc, event) {}
  function onSetRemoteSuccess(pc) {}
  function onAddIceCandidateSuccess(pc) {}
  function onSetLocalSuccess(pc) {}
  function onSetSessionDescriptionError(error) {}
  function onAddIceCandidateError(pc, error) {}
  function onCreateSessionDescriptionError(error) {}
};

export const receiveICE = (data) => async (dispatch, getState) => {
  const state = getState();
  const room = state.monitoring.room;
  const users = state.watching.users;
  const userIndex = users.findIndex((user) => user.user_id === data.user_id);

  if (userIndex >= 0) {
    if (
      data.room_id === room.room_id &&
      data.user_id === users[userIndex].user_id
    ) {
      if (data.candidate != null) {
        var candidate = new RTCIceCandidate(data.candidate);
        try {
          pc2[data.user_id].addIceCandidate(candidate).catch((e) => {});
        } catch (err) {}
      }
    }
  }
};

export const reloadScreen = (participant) => async (dispatch, getState) => {
  const state = getState();
  const room = state.monitoring.room;

  dispatch({
    type: WATCHING_SET_LOADING,
    payload: { user_id: participant.user_id, loading: true },
  });

  dispatch(singleHangup(participant));
  setTimeout(async function () {
    let offerData = {
      type: "watching",
      user_id: room.user_id,
      username: room.username,
      room_id: room.room_id,
      room_name: room.room_name,
      target_user_id: participant.user_id,
      os: participant.os
    };
    dispatch(wsSend(offerData));
    dispatch({
      type: WATCHING_SET_LOADING,
      payload: { user_id: participant.user_id, loading: false },
    });

    storeLog({
      status: "success",
      action: "[monitoring/reload_screen]",
      data: JSON.stringify(offerData),
    });
  }, 1000);
};

const singleHangup = (participant) => async (dispatch, getState) => {
  const state = getState();
  const room = state.monitoring.room;
  const users = state.watching.users;
  const userIndex = users.findIndex(
    (user) => user.user_id === participant.user_id
  );

  let messageData = {
    type: "watching_stop",
    user_id: room.user_id,
    username: room.username,
    room_id: room.room_id,
    room_name: room.room_name,
    target_user_id: users[userIndex].user_id,
  };
  dispatch(wsSend(messageData));
  pc2[users[userIndex].user_id]?.close();
  pc2[users[userIndex].user_id] = null;
};

export const hangup = (data) => async (dispatch, getState) => {
  const state = getState();
  const room = state.monitoring.room;
  const users = state.watching.users;

  users.forEach((user, index) => {
  //console.log(user,'user')
    if (user.userStatus !== "is_watching") {
      setTimeout(() => {
        let messageData = {
          type: "watching_stop",
          user_id: room.user_id,
          username: room.username,
          room_id: room.room_id,
          room_name: room.room_name,
          target_user_id: user.user_id,
        };
        dispatch(wsSend(messageData));
        pc2[user.user_id]?.close();
        pc2[user.user_id] = null;
      }, index * 1000);
    }
  });

  dispatch({ type: WATCHING_USER_RESET, payload: [] });
  dispatch({ type: WATCHING_SET_TYPE, payload: "watching" });
  dispatch({ type: WATCHING_SET_START, payload: false });
};

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
import { wsSend } from "../websocket/actions";
import { wsConf, studentConf } from "../../../constant/configWS";
import browserDetect from "../../../helpers/browserDetect";
import { storeLog } from "../log/actions";

export const fetchRoom = () => async (dispatch) => {
  dispatch({ type: STUDENT_FETCH_ROOM, payload: {} });
};

export const userConnected = (data) => async (dispatch, getState) => {
  // const state = getState();
  // const isShareScreen = state.studentRoom.isShareScreen;
  if (parseInt(data.room_exist) === 0) {
    dispatch({ type: STUDENT_UPDATE_ROOM_STATUS, payload: "no_exist" });
  } else if (parseInt(data.room_exist) === 2) {
    dispatch({ type: STUDENT_UPDATE_ROOM_STATUS, payload: "expiry" });
  } else {
    dispatch({ type: STUDENT_UPDATE_ROOM_STATUS, payload: "exist" });
    initPolling(data, dispatch);
  }
};

let pollingIntervalVar = false;

const initPolling = (data, dispatch) => {
  if (pollingIntervalVar !== false) {
    clearInterval(pollingIntervalVar);
  }

  pollingIntervalVar = setInterval(function () {
    let payload = {
      type: "polling_session",
      user_id: data.user_id,
      username: data.username,
      room_id: data.room_id,
      room_name: data.room_name,
    };
    dispatch(wsSend(payload));
  }, studentConf.POLLING_INTERVAL);
};

let localStream;
let shouldRefreshScreen = false;
let localVideo;

export const start = () => async (dispatch, getState) => {
  localVideo = document.getElementById("localVideo");
  const state = getState();
  const room = state.studentRoom.room;
  let brw = browserDetect();

  try {
    let audioStream = false;
    if (brw !== "firefox" && brw !== "safari") {
      audioStream = true;
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: audioStream,
      video: true,
    });

    localVideo.srcObject = stream;
    localStream = stream;

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      dispatch({ type: STUDENT_SET_AUDIO, payload: true });
    } else {
      dispatch({ type: STUDENT_SET_AUDIO, payload: false });
    }

    localStream.getVideoTracks()[0].onended = async function () {
      // doLeaveRoom(dispatch, getState);
      dispatch({ type: STUDENT_SET_SS_STOPPED, payload: true });
    };
    initRefreshScreen(dispatch, getState);
    storeLog({
      status: "success",
      action: "[student/share_screen]",
      data: JSON.stringify(room),
    });
    dispatch({ type: STUDENT_SET_SHARE_SCREEN, payload: true });
  } catch (e) {
    storeLog({
      status: "error",
      action: "[student/share_screen]",
      data: JSON.stringify({ ...room, error: e }),
    });
    //set user share screen to true
    dispatch({ type: STUDENT_SET_SHARE_SCREEN, payload: false });
    dispatch({ type: STUDENT_SET_SS_STOPPED, payload: true });
  }
};

const initRefreshScreen = async (dispatch, getState) => {
  await dispatch({
    type: STUDENT_SET_STATUS_WATCHING,
    payload: 1,
  });

  shouldRefreshScreen = true
  setTimeout(function () {
    sendRefreshScreen(dispatch, getState);
  }, 2000);

};

const sendRefreshScreen = async (dispatch, getState) => {
  const state = getState();
  if(shouldRefreshScreen){
    const room = state.studentRoom.room;
    const ssStopped = state.studentRoom.ssStopped;
    let last_screen = captureScreen();
    let messageData = {
      type: "refresh_screen",
      room_id: room.room_id,
      user_id: room.user_id,
      teacher_id: room.teacher_id,
      last_screen: last_screen,
      last_screen_default: (ssStopped)?2:0
    };

    dispatch(wsSend(messageData));
  }

  //get appropriate interval based on student count
  const intervalRange =  studentConf.getRefreshScreenInterval(state.studentRoom.studentIdList.length)
  setTimeout(function () {
    sendRefreshScreen(dispatch, getState);
  }, intervalRange);
};

const captureScreen = () => {
  let canvas = document.getElementById("canvas");
  if (localVideo !== null) {
    let iwidth = localVideo.videoWidth;
    let iheight = localVideo.videoHeight;
    canvas.width = wsConf.CANVAS_WIDTH;
    canvas.height = wsConf.CANVAS_HEIGHT;

    // get the scale
    let scale = Math.min(canvas.width / iwidth, iheight / iheight);
    // get the top left position of the image
    let x = canvas.width / 2 - (iwidth / 2) * scale;
    let y = canvas.height / 2 - (iheight / 2) * scale;
    canvas
      .getContext("2d")
      .drawImage(localVideo, x, y, iwidth * scale, iheight * scale);
    return canvas.toDataURL();
  } else {
    shouldRefreshScreen = false
  }
};

export const watching = (data) => async (dispatch, getState) => {
  const state = getState();
  const room = state.studentRoom.room;
  const watching = state.studentRoom.watching;

  if (data.room_id === room.room_id && data.target_user_id === room.user_id) {
    let messageData = {
      type: "watching_status",
      available: watching.watchingAllowed,
      room_id: room.room_id,
      user_id: room.user_id,
      username: room.username,
      target_user_id: data.user_id,
    };
    dispatch(wsSend(messageData));

    if (watching.watchingAllowed === 1) {
      dispatch({
        type: STUDENT_SET_WATCHING_USER,
        payload: data.user_id,
      });

      dispatch({
        type: STUDENT_SET_ISWATCHING,
        payload: true,
      });
      call(dispatch, getState);
    }
  }
};

let pc1;
const call = async (dispatch, getState) => {
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
  }
  if (audioTracks.length > 0) {
  }
  pc1 = new RTCPeerConnection(wsConf.CONFIG);
  pc1.addEventListener("icecandidate", (e) =>
    onIceCandidate(pc1, e, dispatch, getState)
  );
  pc1.addEventListener("iceconnectionstatechange", (e) =>
    onIceStateChange(pc1, e)
  );

  localStream.getTracks().forEach((track) => pc1.addTrack(track, localStream));

  try {
    const offer = await pc1.createOffer(wsConf.OFFER_OPTIONS);
    await onCreateOfferSuccess(offer, dispatch, getState);
  } catch (e) {
    onCreateSessionDescriptionError(e);
  }
};

const onCreateOfferSuccess = async (desc, dispatch, getState) => {
  try {
    await pc1.setLocalDescription(desc);
    await sendOffer(desc, dispatch, getState);
    onSetLocalSuccess(pc1);
  } catch (e) {
    onSetSessionDescriptionError();
  }
};

const sendOffer = async (desc, dispatch, getState) => {
  await dispatch({
    type: STUDENT_SET_STATUS_WATCHING,
    payload: 2, //set user is watching
  });

  const state = getState();
  const room = state.studentRoom.room;
  const watching = state.studentRoom.watching;

  let offerData = {
    type: "offer",
    room_id: room.room_id,
    user_id: room.user_id,
    username: room.username,
    target_user_id: watching.watchingUserID,
    sessionDescription: desc,
    candidate: null,
  };
  dispatch(wsSend(offerData));
};

const onIceCandidate = async (pc, event, dispatch, getState) => {
  if (event.candidate) {
    try {
      await sendICE(event.candidate, dispatch, getState);
      onAddIceCandidateSuccess(pc);
    } catch (e) {
      onAddIceCandidateError(pc, e);
    }
  }
};

const sendICE = (candidate, dispatch, getState) => {
  const state = getState();
  const room = state.studentRoom.room;
  const watching = state.studentRoom.watching;

  let offerData = {
    type: "ice",
    room_id: room.room_id,
    user_id: room.user_id,
    username: room.username,
    target_user_id: watching.watchingUserID,
    candidate: candidate,
  };
  dispatch(wsSend(offerData));
};

export const receiveICE = (data) => async (dispatch, getState) => {
  if (data.candidate != null) {
    var candidate = new RTCIceCandidate(data.candidate);
    try {
      pc1.addIceCandidate(candidate);
    } catch (err) {}
  }
};

export const receiveAnswer = (data) => async (dispatch) => {
  let desc = new RTCSessionDescription(data.sessionDescription);
  try {
    await pc1.setRemoteDescription(desc);
    onSetRemoteSuccess(pc1);
  } catch (e) {
    onSetSessionDescriptionError(e);
  }
};

const doLeaveRoom = (dispatch, getState) => {
  const state = getState();
  const room = state.studentRoom.room;
  let messageData = {
    type: "leave_room",
    room_id: room.room_id,
    user_id: room.user_id,
    teacher_id: room.teacher_id,
  };
  dispatch(wsSend(messageData));
  localStorage.removeItem("studentRoom");
  window.location.href = `${import.meta.env.VITE_BASE_PATH}student/leave-room`;
};

export const removeRoom = () => async (dispatch, getState) => {
  const state = getState();
  const room = state.studentRoom.room;
  storeLog({
    status: "success",
    action: "[student/leave_room]",
    data: JSON.stringify(room),
  });
  doLeaveRoom(dispatch, getState);
};

export const handleMute = () => async (dispatch, getState) => {
  const state = getState();
  const audioEnabled = state.studentRoom.audioEnabled;
  const studentRoom = state.studentRoom.room;
  let mute = state.studentRoom.mute;

  if (audioEnabled) {
    const audioTracks = localStream.getAudioTracks();

    if (audioTracks.length > 0) {
      mute = !mute;
      for (var i = 0; i < audioTracks.length; i++) {
        audioTracks[i].enabled = !mute;
      }
      if (mute) {
        storeLog({
          status: "success",
          action: "[student/mute_audio]",
          data: JSON.stringify(studentRoom),
        });
        await dispatch({ type: STUDENT_SET_MUTE, payload: true });
      } else {
        storeLog({
          status: "success",
          action: "[student/unmute_audio]",
          data: JSON.stringify(studentRoom),
        });
        await dispatch({ type: STUDENT_SET_MUTE, payload: false });
      }
    }
  }
};

export const watchingStop = (data) => async (dispatch, getState) => {
  const state = getState();
  const room = state.studentRoom.room;
  if (data.room_id === room.room_id && data.target_user_id === room.user_id) {
    dispatch({ type: STUDENT_SET_STATUS_WATCHING, payload: 1 });
    dispatch({ type: STUDENT_SET_WATCHING_USER, payload: 0 });
    dispatch({
      type: STUDENT_SET_ISWATCHING,
      payload: false,
    });
    hangup();
  }
};

export const forceWatchingStop = () => async (dispatch, getState) => {
  dispatch({ type: STUDENT_SET_STATUS_WATCHING, payload: 1 });
  dispatch({ type: STUDENT_SET_WATCHING_USER, payload: 0 });
  dispatch({
    type: STUDENT_SET_ISWATCHING,
    payload: false,
  });
  hangup();
  
  localStream.getTracks().forEach((track) => track.stop());
};

const hangup = () => {
  pc1?.close();
  pc1 = null;
};

const onSetRemoteSuccess = (pc) => {};
const onSetLocalSuccess = (pc) => {};
const onAddIceCandidateSuccess = (pc) => {};
const onSetSessionDescriptionError = (error) => {};
const onCreateSessionDescriptionError = (error) => {};
const onAddIceCandidateError = (pc, error) => {};
const onIceStateChange = (pc, event) => {
  if (pc) {
  }
};

export const roomTimeOut = () => async (dispatch, getState) => {
  dispatch({ type: STUDENT_ROOM_TIME_OUT });
};


export const updateStudentIdList = (data) => async (dispatch, getState) => {
  dispatch({ type: STUDENT_SET_STUDENT_ID_LIST, payload: data.student_id_list });
};

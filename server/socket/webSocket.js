import { wsTypes, userType, limit } from "../constants/ws.js";
import { logger } from "../logger.js";
import moment from 'moment';
import config from "../config/config.js";
import { redisClient } from "../helpers/redis.js";
import { db_master } from "../models/index.js";
import { eventRoomsSocket, tenantSocket } from "./eventSocket.js";

setInterval(function () {
  redisClient.ping((err) => {
    if (err) console.error('Redis keepalive error', err);
  });
}, 180 * 1000);

export const onPollingSession = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  var user = await getUser(ws.tenant_id, json.user_id);
  if (user !== false) {
    user.last_connection = new Date().getTime();
    user.disconnected = 0;
  }
};

export const onWatching = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let targetUser = await getUser(ws.tenant_id, json.target_user_id);
  var userAvailable = false;
  if (targetUser !== false) {
    if (targetUser.disconnected === 0) {
      userAvailable = true;
    }
  }
  let messageReturn
  if (userAvailable) {
    ws.to(targetUser.ws).emit("message", message);
    // targetUser.ws.send(message);
    messageReturn = {
      type: wsTypes.WATCHING,
      user_exist: 1,
      user_id: targetUser.user_id,
      username: targetUser.username,
      room_id: json.room_id,
      room_name: json.room_name,
    };
    ws.send(JSON.stringify(messageReturn));
    logger.info(`[websocket/watching] - ${JSON.stringify(messageReturn)}`);
  } else {
    messageReturn = {
      type: wsTypes.WATCHING,
      user_exist: 0,
      room_id: json.room_id,
      room_name: json.room_name,
    };
    ws.send(JSON.stringify(messageReturn));
    logger.info(`[websocket/watching] - ${JSON.stringify(messageReturn)}`);
  }
};

export const onWatchingStatus = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let targetUser = await getUser(ws.tenant_id, json.target_user_id);
  if (targetUser !== false) {
    if (json.available == 1) {
      targetUser.watching_user_id = json.user_id;
      await redisClient.set(ws.tenant_id+":USER:"+json.target_user_id, JSON.stringify(targetUser));
    }
    ws.to(targetUser.ws).emit("message", message);
    // targetUser.ws.send(message);
    logger.info(`[websocket/watching_status] - ${JSON.stringify(json)}`);
  }
};

export const onWatchingStop = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let user = await getUser(ws.tenant_id, json.user_id);
  if (user !== false) {
    user.watching_user_id = 0;
    await redisClient.set(ws.tenant_id+":USER:"+json.user_id, JSON.stringify(user));
  }
  let targetUser = await getUser(ws.tenant_id, json.target_user_id);
  if (targetUser !== false) {
    ws.to(targetUser.ws).emit("message", message);
    // targetUser.ws.send(message);
    logger.info(`[websocket/watching_stop] - ${JSON.stringify(json)}`);
  }
};

export const onOffer = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let targetUser = await getUser(ws.tenant_id, json.target_user_id);
  if (targetUser !== false) {
    ws.to(targetUser.ws).emit("message", message);
    // targetUser.ws.send(message);
    logger.info(`[websocket/offer] - ${JSON.stringify(json)}`);
  }
};

export const onAnswer = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let targetUser = await getUser(ws.tenant_id, json.target_user_id);
  if (targetUser !== false) {
    ws.to(targetUser.ws).emit("message", message);
    // targetUser.ws.send(message);
    logger.info(`[websocket/answer] - ${JSON.stringify(json)}`);
  }
};

export const onICE = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let targetUser = await getUser(ws.tenant_id, json.target_user_id);
  if (targetUser !== false) {
    ws.to(targetUser.ws).emit("message", message);
    // targetUser.ws.send(message);
  }
};

export const onUserConnected = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let user = await getUser(ws.tenant_id, json.user_id);
  if (!user) {
    user = await registerUser(io, ws, json);
  } else {
    user.user_id = json.user_id;
    user.username = json.username;
    user.room_id = json.room_id;
    user.teacher_id = json.teacher_id;
    user.terminal_type = json.terminal_type;
    user.name_type = json.name_type;
  }
  user.disconnected = 0;
  user.ws = ws.id;

  ws.user_id = json.user_id;
  ws.user_type = json.user_type;
  ws.tenant_id = ws.tenant_id;
  ws.os = json.os;

  let room = await getRoom(ws.tenant_id, json.room_id);
  if (room !== false) {
    
    if (json.user_type == userType.ASSISTANT){
      if (room.assistant_list.length > 0) {
        var index = room.assistant_list.findIndex((id)=>json.user_id == id);
        if (index >= 0) {
          room.assistant_list.splice(index, 1);
          room.assistant_list_ws.splice(index, 1);
        }
      }
      room.assistant_list.push(json.user_id);
      room.assistant_list_ws.push(ws.id);
    }else if(json.user_type == userType.STUDENT){
      if (room.participant_list.length > 0) {
        var index = room.participant_list.findIndex((id)=>json.user_id == id);
        if (index >= 0) {
          room.participant_list.splice(index, 1);
          room.participant_list_ws.splice(index, 1);
        }
      }
      room.participant_list.push(json.user_id);
      room.participant_list_ws.push(ws.id);
    }

    await redisClient.SET(ws.tenant_id+":ROOM:"+json.room_id, JSON.stringify(room));
    await redisClient.SET(ws.tenant_id+":USER:"+json.user_id, JSON.stringify(user));

    if (
      json.user_type == userType.TEACHER ||
      json.user_type == userType.ASSISTANT
    ) {
      var assistant_list = await getActiveAssistantList(ws.tenant_id, room);
      var user_list = await getActiveParticipantList(ws.tenant_id, room);
      if (room.teacher_id == json.user_id || json?.is_assistant) {
        var messageReturn = {
          type: wsTypes.USER_CONNECTED,
          room_id: json.room_id,
          user_id: json.user_id,
          participant_list: user_list,
          assistant_list: assistant_list,
          room_exist: 1,
        };
      } else {
        await deleteUser(ws.tenant_id, json.user_id,io,ws);
        var messageReturn = {
          type: wsTypes.USER_CONNECTED,
          room_id: json.room_id,
          user_id: json.user_id,
          participant_list: user_list,
          assistant_list: assistant_list,
          room_exist: 2,
        };
      }
      const roomData = await redisClient.get(ws.tenant_id+":ROOM:"+json.room_id);
      const participantList = roomData ? JSON.parse(roomData).participant_list : null
      if(participantList?.length){
        
        for (const user_id of participantList) {
          const userData = await redisClient.get(ws.tenant_id+":USER:"+user_id);
          refreshScreen(io, ws, JSON.parse(userData), 1);
        }
      }

    } else {
      var messageReturn = {
        type: wsTypes.USER_CONNECTED,
        room_id: json.room_id,
        user_id: json.user_id,
        room_exist: 1,
      };
      if (user.last_screen == 0 || user.last_screen_default == 3) {
        user.last_screen = config.INITIAL_SCREEN;
        user.last_screen_date = new Date().getTime();
        user.last_screen_default = 1;
        
        refreshScreen(io, ws, user, 1);
      }
    }
  } else {
    await deleteUser(ws.tenant_id, json.user_id,io,ws);
    await deleteRoom(ws.tenant_id, json.room_id,io,ws);
    var messageReturn = {
      type: wsTypes.USER_CONNECTED,
      room_id: json.room_id,
      user_id: json.user_id,
      room_exist: 0,
    };
  }
  ws.send(JSON.stringify(messageReturn));
  logger.info(`[websocket/user_connected] - ${JSON.stringify(messageReturn)}`);
};

export const getActiveAssistantList = async (tenant_id, room) => {
  var user_list = Array();
  var assistant_list = room.assistant_list;

  if (assistant_list.length > 0) {
    for (var i = assistant_list.length - 1; i >= 0; i--) {
      var user = await getUser(tenant_id, assistant_list[i]);
      if (user !== false) {
        var currdate = new Date().getTime();
        var lscreendate = user.last_screen_date;
        var diff = currdate - lscreendate;
        if (user.last_screen != 0 && diff <= config.timeoutScreen) {
          user_list.push(user);
        }
      }
    }
  }
  return user_list;
};

export const getActiveParticipantList = async (tenant_id, room) => {
  var user_list = Array();
  var participant_list = room.participant_list;
  if (participant_list.length > 0) {
    for (var i = participant_list.length - 1; i >= 0; i--) {
      var user = await getUser(tenant_id, participant_list[i]);
      if (user !== false) {
        var currdate = new Date().getTime();
        var lscreendate = user.last_screen_date;
        var diff = currdate - lscreendate;
        if (user.last_screen != 0 && diff <= config.timeoutScreen) {
          user_list.push(user);
        }
      }
    }
  }
  return user_list;
};

export const onCreateRoom = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let roomExist = await getRoomByName(ws.tenant_id, json.room_name);
  if (roomExist == false || (roomExist != false && json.override == 1)) {
    let room = await getRoom(ws.tenant_id, json.room_id);
    if (!room) {
      room = await registerRoom(io, ws, json);
    } else {
      if (json.override == 1) {
        await deleteUser(ws.tenant_id, room.teacher_id,io,ws);
      }
      room.teacher_id = json.user_id;
      room.teacher_name = json.username;
      room.room_name = json.room_name;
      room.ws = ws.id;
    }
    ws.send(message);
  } else {
    const roomExisting = {
      room_id: roomExist.room_id,
      room_name: roomExist.room_name,
      type: "create_room",
      user_id: roomExist.teacher_id,
      user_type: userType.TEACHER,
      username: roomExist.teacher_name,
    };

    ws.send(JSON.stringify(roomExisting));
  }
};

export const onDeleteRoom = async (io, ws, message,nsp = null) => {
  if(!nsp){
    nsp = ws.nsp
  }
  if(nsp?.name){
    onForceKick(io, ws, message, nsp)
    io.of(nsp.name).in(message.socket_room_id).emit("message", JSON.stringify({
      type : "delete_room",
      room_id : ws.room_id,
      socket_room_id : ws.socket_room_id
    }))
    await redisClient.DEL(`${ws.tenant_id}:ROOM:${ws.room_id}`);
    logger.info(`[websocket/delete_room] - ${JSON.stringify(message)}`);
  }
};

export const onForceKick = async (io, ws, message, nsp = null) => {
  if(!nsp){
    nsp = ws.nsp
  }

  if(nsp?.name){
    const sids = await io.of(nsp.name).in(message.socket_room_id).allSockets();
    sids.forEach((sid)=>{
      io.of(nsp.name).adapter.remoteLeave(sid, message.socket_room_id);
    })
  }
}

export const onJoinRoom = async (io, ws, message) => {
  let room = null
  let checkAttemps = 10
  console.log(ws.tenant_id,ws.room_id, 'ON JOIN ROOM')
  let interval = setInterval(async () => {
    --checkAttemps;
    room = await getRoom(ws.tenant_id,ws.room_id);

      let messageReturn = {
        type: wsTypes.JOIN_ROOM,
        tenant_id: ws.tenant_id,
        user_id: ws.user_id,
        username: ws.username,
        room_id: ws.room_id,
        user_type: ws.user_type,
        temporary : message.temporary ? message.temporary : false
      };

      if(room) {
        console.log('ada room ?')
        const userIds = await redisClient.SMEMBERS(ws.tenant_id+":USERDATA");
        const user = await getUser(ws.tenant_id,ws.user_id);
        
        messageReturn.room_name = room.room_name;
        messageReturn.teacher_id = room.teacher_id;
        messageReturn.teacher_name = room.teacher_name;

        if (userIds.length >= limit.MAX_TOTAL_USER) {
          messageReturn.is_exist = 3; //user in this server full
        } else {
          if(user){      
            let storeToRedis = false
            if (ws.user_type == userType.ASSISTANT) {
              if (room.assistant_list.length >= limit.MAX_ASSISTANT) {
                messageReturn.is_exist = 4; //user in this server full
                storeToRedis = false;
              } else {
                if (room.assistant_list.length > 0) {
                  var index = room.assistant_list.findIndex((id)=>ws.user_id == id);
                  if (index >= 0) {
                    room.assistant_list.splice(index, 1);
                    room.assistant_list_ws.splice(index, 1);
                  }
                }
                room.assistant_list.push(user.user_id);
                room.assistant_list_ws.push(ws.id);
                storeToRedis = true;
              }
            } else if (ws.user_type == userType.STUDENT) {
              if (room.participant_list.length >= limit.MAX_STUDENT) {
                messageReturn.is_exist = 4; //user in this server full
                storeToRedis = false;
              } else {
                if (room.participant_list.length > 0) {
                  var index = room.participant_list.findIndex((id)=>ws.user_id == id);
                  if (index >= 0) {
                    room.participant_list.splice(index, 1);
                    room.participant_list_ws.splice(index, 1);
                  }
                }
                room.participant_list.push(user.user_id);
                room.participant_list_ws.push(ws.id);
                /* save to data history */
                room.participant_list_history.push(user);
                storeToRedis = true;
              }
            }

      
            if(storeToRedis){
              if (user.last_screen == 0 || user.last_screen_default == 3) {
                user.last_screen = config.INITIAL_SCREEN;
                user.last_screen_date = new Date().getTime();
                user.last_screen_default = 1;
                
                refreshScreen(io, ws, user, 1);
              }
              await redisClient.SET(`${ws.tenant_id}:ROOM:${ws.room_id}`, JSON.stringify(room));
              messageReturn.is_exist = 1; 
            }
          }
        }

        clearInterval(interval)
        ws.send(JSON.stringify(messageReturn));
        logger.info(`[websocket/join_room] - ${JSON.stringify(messageReturn)}`);
      } else {
        messageReturn.is_exist = 0; //room not found
        if(checkAttemps <= 0) {
          clearInterval(interval)
          
          ws.send(JSON.stringify(messageReturn));
        }
        console.log('no room ?')
      }
  }, 500);

  
};

export const getQuotaTenant = async (io, ws, message) => {
  var data = JSON.parse(message);
  const userTenant = await redisClient.SMEMBERS(data.data.tenant+":USERTENANT");
  console.log(userTenant,'userTenant')
  io.of(ws.nsp.name).emit('message', JSON.stringify({
    type: 'user_tenant',
    tenant:data.data.tenant,
    userTenant: (userTenant)?userTenant:[]
  }));
}

export const setQuotaTenant = async (io, ws, message) => {
  // const user = await getUser(ws.tenant_id,ws.user_id);
  // if (user !== false) {
    await redisClient.SADD(`${ws.tenant_id}:USERTENANT`, ws.user_id.toString());
  // }
  // console.log('001',ws.tenant_id,ws.user_id,user)
  getQuotaTenant(io, ws, message);
}

export const userLogin = async (io, ws, message) => {
  var data = JSON.parse(message);

  ws.user_id = data.data.userId.toString();
  ws.tenant_id = data.data.tenant.toString();
  ws.user_type = data.data.userType.toString();

  //check teacher is in the tenant
  let availableTeacher = true;
  let availableTenants = false;
  availableTenants = await db_master.tenants.findOne({
    attributes : ['id','linkage_type'],
    where : {
      id:ws.tenant_id
    }
  })

  if (ws.user_type === 'teacher' && ws?.db?.teachers) {
    // console.log('ws.db_tenant',ws.db_tenant)
    availableTeacher = await ws.db.teachers.findOne({
      attributes : ['id'],
      where : {
        id:ws.user_id
      }
    })
    
    console.log('AVAILABLE TENANT', availableTenants.linkage_type)
    
    const redisTeacherLogin = await redisClient.GET(ws.tenant_id+":USERLOGIN:"+ws.user_id);
    console.log('REDIS TEACHER LOGIN', redisTeacherLogin)
    const teacherLoginData = JSON.parse(redisTeacherLogin);
    if(teacherLoginData){
      io.of(ws.nsp.name).in(teacherLoginData.ws).emit("kick_teacher", {
        user_id: teacherLoginData?.user_id,
        tenant_id: teacherLoginData?.tenant_id,
        dontLogout : true
      })
    }
  }
  
  console.log('targetUser',1)
  if (availableTeacher || availableTenants.linkage_type === 'lti') {
    const userTenant = await redisClient.SMEMBERS(ws.tenant_id+":USERTENANT");
    let userActive = 0
    if(userTenant){
      userActive = userTenant?.length
    }

      const tenantData = await db_master.tenants.findOne({
        where : {
          id : ws.tenant_id
        }
      })
      
      if((tenantData.limit && userActive < tenantData.user_limit) || !tenantData.limit){
        console.log('targetUser',4)
        if (ws.user_type === 'teacher') {
          let targetUser = await getUserLogin(ws.tenant_id,ws.user_id);
          if (!targetUser) {
            targetUser = {
              tenant_id: ws.tenant_id,
              user_type: ws.user_type,
              user_id: ws.user_id,
              ws: ws.id,
            };
          } else {
            targetUser.ws = ws.id;
          }
          console.log(targetUser,'targetUser')
          await redisClient.SET(ws.tenant_id+":USERLOGIN:"+ws.user_id, JSON.stringify(targetUser));
        }
        setQuotaTenant(io, ws, message);
      } else {
        ws.emit("alert_limit_user", {
          user_id: ws.user_id,
          user_type: ws.user_type,
          tenant_id: ws.tenant_id
        });
      }
    
  } else {
    if(availableTenants.linkage_type != 'lti'){
      ws.emit("kick_teacher", {
        user_id: ws.user_id,
        tenant_id: ws.tenant_id
      });
    }
  }
}

export const removeQuotaTenant = async (io, ws, message) => {
  console.log('removeQuotaTenant')
  await redisClient.SREM(`${ws.tenant_id}:USERTENANT`, ws.user_id);
  await redisClient.DEL(`${ws.tenant_id}:USERLOGIN:${ws.user_id}`);
  console.log('002')
  getQuotaTenant(io, ws, message);
}

export const platformConvert = (platform) => {
  switch(platform) {
    case 'Win32':
      return 'Windows';
      break;
    case 'Win64':
      return 'Windows';
      break;
    default:
      return 'Mac/Ipad';
  }
};

export const studentLeaveRoom = async (tenant_id, room_id, user_id) => {
  let room = await getRoom(tenant_id, room_id);
  console.log('STUDENT LEAVE ROOM')

  /* update redist data on leave */
  if(room){
    let currentUser = room.participant_list_history.map(userH => userH.user_id == user_id ? {...userH, disconnect_date: moment().format('YYYY/MM/DD HH:mm:ss')} : userH);
    room.participant_list_history = currentUser;
    console.log('studentLeaveRoom')
    await redisClient.set(tenant_id+":ROOM:"+room_id, JSON.stringify(room));
  }
};

export const onLeaveRoom = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  let room = await getRoom(ws.tenant_id, json.room_id);

  /* update redist data on leave */
  
  if(room){
    let currentUser = room.participant_list_history.map(userH => userH.user_id == json.user_id ? {...userH, disconnect_date: moment().format('YYYY/MM/DD HH:mm:ss')} : userH);
    room.participant_list_history = currentUser;
    await redisClient.set(ws.tenant_id+":ROOM:"+json.room_id, JSON.stringify(room));
    await removeParticipant(ws.tenant_id, json.room_id, json.user_id);
  }
  
};

export const onLeaveRoomAssistant = async (io, ws, message) => {
  const json = JSON.parse(message.toString());

  await removeAssistant(ws.tenant_id, json.room_id, json.user_id);

  var user = await getUser(ws.tenant_id, json.user_id);
  if (user !== false) {
    await deleteUser(ws.tenant_id, json.user_id,io,ws);
  }
  
  logger.info(`[websocket/leave_room_assistant] - ${JSON.stringify(json)}`);
};

export const onRefreshScreen = async (io, ws, message) => {
  const json = JSON.parse(message.toString());
  if (json.forTest && json.forTest === 1) {
    ws.tenant_id = json.tenant_id;
    ws.user_id = json.user_id;
    ws.room_id = json.room_id;
    ws.socket_room_id = `${json.tenant_id}:ROOM:${json.room_id}`;
  }
  var user = await getUser(ws.tenant_id, ws.user_id);
  if (user !== false) {
    user.last_screen = json.last_screen;
    user.last_screen_date = new Date().getTime();
    user.last_screen_default = json.last_screen_default;
    refreshScreen(io, ws, user, 1);
  }
};

export const removeParticipant = async (tenant_id, room_id, user_id) => {
  let room = await getRoom(tenant_id, room_id);
  if (room !== false) {
    if (room.participant_list.length > 0) {
      var index = false;
      for (var i = room.participant_list.length - 1; i >= 0; i--) {
        if (room.participant_list[i] == user_id) {
          index = i;
        }
      }
      if (index !== false) {
        room.participant_list.splice(index, 1);
        room.participant_list_ws.splice(index, 1);
      }

      await redisClient.set(tenant_id+":ROOM:"+room_id, JSON.stringify(room));
    }
  }
};

const removeAssistant = async (tenant_id, room_id, user_id) => {
  let room = await getRoom(tenant_id, room_id);
  if (room !== false) {
    if (room.assistant_list.length > 0) {
      var index = false;
      for (var i = room.assistant_list.length - 1; i >= 0; i--) {
        if (room.assistant_list[i] == user_id) {
          index = i;
        }
      }
      if (index !== false) {
        room.assistant_list.splice(index, 1);
        room.assistant_list_ws.splice(index, 1);
      }
      await redisClient.set(tenant_id+":ROOM:"+room_id, JSON.stringify(room));
    }
  }
};

export const registerUser = async (io, ws, data) => {
  let user = {
    tenant_id: data.tenant_id,
    user_type: data.user_type,
    user_id: data.user_id,
    username: data.username,
    room_id: data.room_id,
    teacher_id: data.teacher_id,
    terminal_type: data.terminal_type,
    name_type: data.name_type,
    last_screen: 0,
    last_screen_date: new Date().getTime(),
    last_screen_default: 0,
    os: data.os,
    watching_user_id: 0,
    last_connection: new Date().getTime(),
    disconnected: 0,
    ws: ws.id,
  };
  await redisClient.RPUSH(data.tenant_id+":USERDATA", data.user_id);
  await redisClient.set(data.tenant_id+":USER:"+data.user_id, JSON.stringify(user));
  return user;
};

export const registerRoom = async (io, ws, data) => {
  let room = {
    tenant_id: data.tenant_id,
    teacher_id: data.user_id,
    teacher_name: data.username,
    room_id: data.room_id,
    room_name: data.room_name,
    participant_list: Array(),
    assistant_list: Array(),
    participant_list_ws: Array(),
    assistant_list_ws: Array(),
    participant_list_history: Array(),
    ws: ws.id,
  };

  let redisData = {room_id: data.room_id,room_name: data.room_name,ws : ws.id};
  await redisClient.RPUSH(data.tenant_id+":ROOMDATA", JSON.stringify(redisData));
  await redisClient.set(data.tenant_id+":ROOM:"+data.room_id, JSON.stringify(room));
  return room;
};

export const getUser = async (tenant_id, user_id) => {
  const user = await redisClient.get(tenant_id+":USER:"+user_id);
  if (user) {
    return JSON.parse(user);
  }else{
    return false;
  }
};

export const getUserLogin = async (tenant_id, user_id) => {
  const user = await redisClient.get(tenant_id+":USERLOGIN:"+user_id);
  if (user) {
    return JSON.parse(user);
  }else{
    return false;
  }
};

export const deleteUser = async (tenant_id, user_id,io=null, ws=null) => {
  await redisClient.SREM(tenant_id+":USERDATA", user_id);
  await redisClient.DEL(tenant_id+":USER:"+user_id);
  await redisClient.SREM(tenant_id+":USERTENANT",user_id);
  if(io){
    console.log('003')
    getQuotaTenant(io, ws, JSON.stringify({data:{tenant:tenant_id}}));
  }
};

export const getRoom = async (tenant_id, room_id) => {
  const room = await redisClient.get(tenant_id+":ROOM:"+room_id);
  if (room) {
    return JSON.parse(room);
  }else{
    return false;
  }
};

export const getRoomByName = async (tenant_id, room_name) => {
  var room = false;
  var roomData = await redisClient.LRANGE(tenant_id+":ROOMDATA", 0, -1);
  if (roomData.length > 0) {
    for (var i = roomData.length - 1; i >= 0; i--) {
      var temp = JSON.parse(roomData[i]);
      if (temp.room_name == room_name) {
        room = temp;
        i = -1;
      }
    }
  }
  
  if (room != false) {
    return await getRoom(tenant_id, room.room_id);
  }else{
    return false;
  }
};

export const deleteRoom = async (tenant_id, room_id,io=null,ws=null) => {
  var room = await getRoom(tenant_id, room_id);
  if (room != false) {
    var participant_list = room.participant_list;
    if (participant_list.length > 0) {
      for (var i = participant_list.length - 1; i >= 0; i--) {
        await deleteUser(tenant_id, participant_list[i],io,ws);
      }
    }
    
    let redisData = {room_id: room.room_id,room_name: room.room_name, ws : room.ws};
    await redisClient.SREM(tenant_id+":ROOMDATA", JSON.stringify(redisData));
    await redisClient.DEL(tenant_id+":ROOM:"+room_id);
  }
};

export const isSame = (ws1, ws2) => {
  // -- compare object --
  return ws1 == ws2;
};

export const refreshScreen = async (io , ws, user, user_exist) => {
    var student = await getUser(ws.tenant_id, ws.user_id);
    if (student != false) {
      await redisClient.set(ws.tenant_id+":USER:"+ws.user_id, JSON.stringify(user));
    }

    let messageReturn = {
      type: wsTypes.REFRESH_SCREEN,
      room_id: ws.room_id,
      user_exist: user_exist,
      user_id: user.user_id,
      username: user.username,
      last_screen: user.last_screen,
      last_screen_date: user.last_screen_date,
      last_screen_default: user.last_screen_default,
      os: user.os,
    };

    //get current online users
    let room = await getRoom(ws.tenant_id, ws.room_id);
    let studentIdListMessage = {
      type: wsTypes.STUDENT_ID_LIST,
      room_id: ws.room_id,
      student_id_list:room?.participant_list
    }
    ws.send(JSON.stringify(studentIdListMessage));
    
    ws.to(ws.socket_room_id).emit("message", JSON.stringify(messageReturn));
};

export const wsEmit = (wstarget, data) => {
  wstarget.send(JSON.stringify(data));
};

export const onPing = (io, ws, message) => {};

export const onTimeOut = async (io, ws, message) => {
  const { data } = JSON.parse(message.toString());
  ws.to(ws.socket_room_id).emit(JSON.stringify({ type: "time_out" }));
};

export const joinSocketRoom = async (io, ws, id) => {
  await io.of(ws.nsp.name).adapter.remoteJoin(ws.id, id);
}

export const leaveSocketRoom = async (io, ws, id) => {
  await io.of(ws.nsp.name).adapter.remoteLeave(ws.id, id);

  console.log(`${ws.tenant_id}:ROOM:${ws.room_id}`)
  const getRoom = await redisClient.GET(`${ws.tenant_id}:ROOM:${ws.room_id}`);
  const getRoomData = JSON.parse(getRoom);
  
    if(getRoomData?.teacher_id == ws?.user_id && getRoomData?.temporary){
      onDeleteRoom(io,ws, {
        socket_room_id : ws.socket_room_id
      })
      const x = await redisClient.DEL(`${ws.tenant_id}:ROOM:${ws.room_id}`);
      console.log(x,'xxxxxxxxxxxxxxxxxxxxxxxxxx')
    }
}
 
export const emitJoinSocketRoom = async (io,ws)=>{
  ws.emit("join_socket_room", {
    tenant_id : ws.tenant_id,
    room_id : ws.room_id,
    teacher_id : ws.teacher_id,
    user_id : ws.user_id,
    username : ws.username,
    user_type : ws.user_type,
    terminal_type : ws.terminal_type,
    name_type : ws.name_type,
    socket_room_id: ws.socket_room_id,
    temporary : ws?.temporary_room ? ws?.temporary_room : false
  });
}

export const fetchRoom = async (io,ws,message = null) => {
  const userData = await redisClient.SMEMBERS(`${ws.tenant_id}:USERDATA:${ws.room_id}`);
  let participants = []
  for(let item of userData){
    const participant = JSON.parse(item)
    if(participant.user_type){
      if (participant.user_type === 'student') {
        const getUser = await redisClient.get(`${ws.tenant_id}:USER:${participant.user_id}`);
        const parseGetUser = JSON.parse(getUser);
        if (parseGetUser) {
          participant.last_screen = parseGetUser.last_screen;
          // participant.last_screen_default = 0;
        }
      }
      participants.push(participant)
    }
  }

  const messageReturn = {
    type: "fetch_room",
    participants,
    ws_room_id : `${ws.tenant_id}:ROOM:${ws.room_id}`
  };
  
  io.of(ws.nsp.name).in(ws.socket_room_id).emit("message", JSON.stringify(messageReturn));
}

export const onRoomNotFound = (io,ws) => {
  ws.emit("room_not_found", {});
}

export const onUserAdminConnected = async (io, ws, message) => {
  const { data } = message;
  
  if(data?.id){
    const adminUserRedis = await redisClient.get(`ADMIN:USER:${data?.id}`);
    let user
    if(!adminUserRedis){
      user = {
        id: data?.id,
        name: data?.name,
        username: data?.username,
        tenant_id: data?.tenant_id,
        school_id: data?.school_id,
        teacher_id: data?.teacher_id,
        role: data?.role,
        ws: ws.id
      };
    } else {
      user = JSON.parse(adminUserRedis)
      if(user?.tenant_id && user?.role == 'admin') await redisClient.SREM(`ADMIN:TENANT:${user?.tenant_id}:USERS`, JSON.stringify(user));
      if(user?.school_id && user?.role == 'school_admin') await redisClient.SREM(`ADMIN:TENANT:${user?.tenant_id}:SCHOOL:${user?.school_id}:USERS`, JSON.stringify(user));
      
      user.ws = ws.id
    }

    if(user?.tenant_id && user?.role == 'admin') await redisClient.SADD(`ADMIN:TENANT:${user?.tenant_id}:USERS`, JSON.stringify(user));
    if(user?.school_id && user?.role == 'school_admin') await redisClient.SADD(`ADMIN:TENANT:${user?.tenant_id}:SCHOOL:${user?.school_id}:USERS`, JSON.stringify(user));
    
    await redisClient.SADD(`ADMIN:USERS`, JSON.stringify(user));
    await redisClient.SET(`ADMIN:USER:${user?.id}`, JSON.stringify(user));
    ws.user = user
  
    const messageReturn = {
      messageType: 'admin',
      type: "user_connected",
      data : user
    };
    ws.send(JSON.stringify(messageReturn));
  }
};

export const onKickUserAdmin = async (io,ws,message) => {
  const { data } = message;

  const adminUserRedis = await redisClient.GET(`ADMIN:USER:${data?.id}`);
  const adminUser = JSON.parse(adminUserRedis);

  if(adminUser?.ws){
    const messageReturn = {
      messageType: 'admin',
      type : "kick_user",
      data : adminUser
    }
    ws.to(adminUser.ws).emit("message",JSON.stringify(messageReturn));
  }
}

export const onKickUserTeacher = async (io,ws,message, realcastSocketIo) => {
  const { data } = message;

  if(!realcastSocketIo){
    realcastSocketIo = io.of(ws.nsp.name);
  }

  let targetUser = await getUserLogin(data?.tenant_id, data?.user_id);
  if (targetUser !== false) {
    realcastSocketIo.in(targetUser.ws).emit("kick_teacher", {
      user_id: data?.user_id,
      tenant_id: data?.tenant_id
    })
  }
}

export const onNewTenant = async (io,message,tenant_db) => {
  const { data } = message;

  if(tenant_db){

  } else {
    const messageReturn = {
      messageType: 'admin',
      type: "failed_load_socket"
    };
    ws.send(JSON.stringify(messageReturn));
  }
  
}

export const pollingParticipantsCheck = async (io,ws,message,nsp = null) => {
  console.log(message,'polling_participants_check')
  if(message.socket_room_id){
    if(!nsp){
      nsp = ws.nsp
    }

    if(nsp?.name){
      
      const sids = await io.of(nsp.name).in(message.socket_room_id).allSockets();
      let sidArrays = []
      sids.forEach((sid)=>{
        sidArrays.push(sid)
      })

      console.log(sidArrays,'sidArrays')
      const room = await redisClient.get(message.socket_room_id);
      if(room){
        const roomData = JSON.parse(room);
        let disconnectIndex = []
        roomData.participant_list_ws.forEach((ws_id,index)=>{
          if(!sidArrays.includes(ws_id)){
            disconnectIndex.push(index)
          }
        })
        let userIds = [];

        console.log(disconnectIndex,'disconnectIndex')

        for( const index of disconnectIndex){
          const user_id = roomData.participant_list[index];   
          console.log(roomData.participant_list,index,'xxxxxxxxx',user_id)
          await redisClient.DEL(`${message.tenant_id}:USER:${user_id}`);
          userIds.push(user_id);

          roomData.participant_list.splice(index, 1);
          roomData.participant_list_ws.splice(index, 1);
        }
        await redisClient.SET(`${message.tenant_id}:ROOM:${message.room_id}`, JSON.stringify(roomData));

        const userData = await redisClient.SMEMBERS(`${message.tenant_id}:USERDATA:${message.room_id}`);
        userData.forEach((item)=>{
          const user = JSON.parse(item);
          if(userIds.includes(user.user_id)){
            redisClient.SREM(`${message.tenant_id}:USERDATA:${message.room_id}`, item);
          }
        })
      }

      
      fetchRoom(io,ws,message)
    }

  }
}

import { redisClient } from "../helpers/redis.js";
import config from "../config/config.js";

import { wsTypes,userType } from "../constants/ws.js";
import {
  onUserConnected,
  onPollingSession,
  onOffer,
  onAnswer,
  onICE,
  onCreateRoom,
  onDeleteRoom,
  onJoinRoom,
  onLeaveRoom,
  onLeaveRoomAssistant,
  onRefreshScreen,
  onWatching,
  onWatchingStatus,
  onWatchingStop,
  getUser,
  getRoom,
  removeParticipant,
  refreshScreen,
  deleteUser,
  onPing,
  onTimeOut,

  joinSocketRoom,
  leaveSocketRoom,
  emitJoinSocketRoom,
  fetchRoom,
  onRoomNotFound,
  onForceKick,
  onKickUserAdmin,
  onKickUserTeacher,
  onUserAdminConnected,
  getQuotaTenant,
  setQuotaTenant,
  userLogin,
  removeQuotaTenant,
  studentLeaveRoom,
  onNewTenant,
  pollingParticipantsCheck,
  getUserLogin
} from "./webSocket.js";
import { db_master, db_tenants, initDBTenant } from "../models/index.js";

const setrealcastSocketIo = (io, message) => {
  const { data } = message;
  return io.of(`/tenant-${data.tenant_id}`);
}

export const adminSocket = async (io,socket) => {
  socket.on("message", async (message) => {
    const type = message.type;
    console.log("socket.js admin on message",type);
    let realcastSocketIo;
    switch (type) {
      
      case "add_new_tenant": 

        let db_tenant = db_tenants[message.data.tenant_id]
        if(!db_tenant) {
          db_tenant = await initDBTenant(message.data.tenant_id)
          if(!db_tenant) {
            console.log('failed load database or not found')
            
            return res.status(500).json({
              error: true,
              message: "failed load database or not found"
            });
          }
        } else {
          console.log('success connect database')
        }
        
        onNewTenant(io,message,db_tenant)
        break;
      case "remove_tenant":
        // disconnect all sockets from this namespace
        io.of(`/${message.data.tenant_id}`).local.disconnectSockets();

        // remove the namespace
        io._nsps.delete(`/${message.data.tenant_id}`);

        break;

      case "user_connected": 
        onUserAdminConnected(io,socket,message)
        break;
      case "kick_user" :
        onKickUserAdmin(io,socket,message);
        break;
      case "delete_room" :
        realcastSocketIo = setrealcastSocketIo(io,message);
        onDeleteRoom(io, socket, message.data, realcastSocketIo);
        break;
      case "kick_teacher" :
        realcastSocketIo = setrealcastSocketIo(io,message);
        onKickUserTeacher(io, socket, message, realcastSocketIo)
        break;
    }
  })
  
  socket.emit("socket_connected", {
    socket_id: socket.id,
    tenant_id: null
  });

}


export const tenantSocket = async (io,socket) => {
  console.log("socket.js io.on TENANT connection");
  const db_tenant = socket.db;
  const socket_tenant_id = socket.tenant_id

  socket.emit("socket_connected", {
    socket_id: socket.id,
    tenant_id: socket_tenant_id
  });
  
  socket.on("message", async (message) => {
    const type = message.type;
    console.log("socket.js on message",type);

    switch (type) {
      case wsTypes.USER_CONNECTED:
        onUserConnected(io,socket, JSON.stringify(message));
        break;

      case wsTypes.POLLING_SESSION:
        onPollingSession(io,socket, JSON.stringify(message));
        break;

      case wsTypes.OFFER:
        onOffer(io,socket, JSON.stringify(message));
        break;

      case wsTypes.ANSWER:
        onAnswer(io,socket, JSON.stringify(message));
        break;

      case wsTypes.ICE:
        onICE(io,socket, JSON.stringify(message));
        break;

      case wsTypes.CREATE_ROOM:
        onCreateRoom(io,socket, JSON.stringify(message));
        break;

      case wsTypes.DELETE_ROOM:
        onDeleteRoom(io,socket, message);
        break;

      case wsTypes.JOIN_ROOM:
        onJoinRoom(io,socket, message)
        break;

      case wsTypes.LEAVE_ROOM:
        onLeaveRoom(io,socket, JSON.stringify(message));
        break;

      case wsTypes.LEAVE_ROOM_ASSISTANT:
        onLeaveRoomAssistant(io,socket, JSON.stringify(message));
        break;

      case wsTypes.REFRESH_SCREEN:
        onRefreshScreen(io,socket, JSON.stringify(message));
        break;

      case wsTypes.WATCHING:
        onWatching(io,socket, JSON.stringify(message));
        break;

      case wsTypes.WATCHING_STATUS:
        onWatchingStatus(io,socket, JSON.stringify(message));
        break;

      case wsTypes.WATCHING_STOP:
        onWatchingStop(io,socket, JSON.stringify(message));
        break;
      case wsTypes.PING:
        onPing(io,socket, JSON.stringify(message));
        break;
      case wsTypes.TIME_OUT:
        onTimeOut(io,socket, JSON.stringify(message));
        break;
      case wsTypes.FETCH_ROOM:
        fetchRoom(io,socket, JSON.stringify(message));
        break;
      case 'get-quota-tenant':
        console.log('004')
        getQuotaTenant(io,socket, JSON.stringify(message));
        break;
      case 'set-quota-tenant':
        setQuotaTenant(io,socket, JSON.stringify(message));
        break;
      case 'user-login':
        userLogin(io,socket, JSON.stringify(message));
      break;
      
      case 'remove-quota-tenant':
        removeQuotaTenant(io,socket, JSON.stringify(message));
        break;
      case 'force_kick' :
        onForceKick(io,socket, message)
        break;
      case 'polling_participants_check' :
        pollingParticipantsCheck(io,socket, message)
        break;
    }
  });

  socket.on("disconnect", async () => {
    if (socket.user_id != undefined) {
      console.log(
        "CLOSED " +
          socket.user_type +
          " : " +
          socket.user_id +
          " : " +
          socket.os
      );
      if (socket.user_type == userType.STUDENT) {
        var user = await getUser(socket.tenant_id, socket.user_id);
        if (user !== false) {
          if (user.last_screen != 0) {
            user.disconnected = 1;
            user.last_screen_date = new Date().getTime();
            user.last_screen_default = 3;
            user.last_screen = config.INITIAL_SCREEN;
            refreshScreen(io, socket, user, 1);

            setTimeout(async function() {
              var user = await getUser(socket.tenant_id, socket.user_id);
              if (user !== false) {
                if (user.last_screen_default == 3) {
                  const userData = await redisClient.SMEMBERS(`${socket.tenant_id}:USERDATA:${user.room_id}`);
              
                  await Promise.all(
                    userData.map(async(item) => {
                      const participant = JSON.parse(item)
                      if(participant.user_id == socket.user_id){
                        const user = await getUser(socket.tenant_id, socket.user_id);
                        if (user !== false) {
                          await redisClient.SREM(`${socket.tenant_id}:USERDATA:${user.room_id}`, item);
                        }
                      }
                    })
                  )

                  refreshScreen(io, socket, user, user.room_id, user.teacher_id, 0);
                  await removeParticipant(socket.tenant_id, user.room_id, socket.user_id);
                  await deleteUser(socket.tenant_id, socket.user_id,io,socket);
                  fetchRoom(io,socket);
                }
              }
            }, 4000);  
          }
        }
      } else if (socket.user_type != userType.STUDENT) {
        var user = await getUser(socket.tenant_id, socket.user_id);
        if (user !== false) {
          user.disconnected = 1;
          if (user.watching_user_id != 0) {
            let room = await getRoom(socket.tenant_id, user.room_id);
            let message = {
              type: wsTypes.WATCHING_STOP,
              user_id: user.user_id,
              username: user.username,
              room_id: user.room_id,
              room_name: room.room_name,
              target_user_id: user.watching_user_id,
              tenant_id: socket.tenant_id
            };
            onWatchingStop(io,socket, JSON.stringify(message));
          }
        }
      }

      if(socket?.user_id){
        const userLogin = getUserLogin(socket.tenant_id,socket.user_id)
        if(userLogin?.ws == socket.id){
          removeQuotaTenant(io,socket, JSON.stringify({
            data : {
              tenant: socket.tenant_id,
              userId: socket.user_id,
              userType: socket.user_type
            }
          }))
        }
      }
    }
  });

  socket.on("join_socket_room", async (data)=>{
    console.log(socket.id,data,'id JOIN SOCKET ROOM===============')
    try {

      const tenant_id = socket_tenant_id

      const tenantData = await db_master.tenants.findOne({
        where : {
          id : tenant_id
        }
      })
      const userTenant = await redisClient.SMEMBERS(tenant_id+":USERTENANT");
      let userActive = 0
      if(userTenant){
        userActive = userTenant?.length
      }
      const exists = await redisClient.SISMEMBER(tenant_id+":USERTENANT",data.user_id);
      if(exists && userActive > 0){
        userActive = userActive - 1;
      }

      if((tenantData.limit && userActive < tenantData.user_limit) || !tenantData.limit){
        
        if(data){
          let rooms

          if(!data?.room_id && data?.room_uri){
            rooms = await db_tenant.rooms.findOne({
              attributes : ['id','tenant_id','teacher_id'],
              where : {
                uri:data?.room_uri
              }
            })
          } else {
            rooms = await db_tenant.rooms.findOne({
              attributes : ['id','tenant_id','teacher_id'],
              where : {
                id:data?.room_id
              }
            })
          }

          if(rooms || data?.temporary){
            socket.tenant_id = data.tenant_id.toString();
            socket.room_id = rooms ? rooms.id.toString() : data?.room_id ? data.room_id.toString() : data.room_uri.toString();
            socket.teacher_id = rooms ? rooms.teacher_id.toString() : socket.room_id;
            socket.user_id = data.user_id.toString();
            socket.username = data.username.toString();
            socket.user_type = data.user_type.toString();
            socket.terminal_type = data.terminal_type.toString();
            socket.name_type = data.name_type.toString();
            socket.socket_room_id = `${socket.tenant_id}:ROOM:${socket.room_id}`;
            socket.id_from_client = data.socket_id
            socket.temporary_room = data?.temporary
            socket.os = data?.os
            if(data?.temporary && socket.user_type == 'teacher' && !data.assistant){
              await redisClient.SET(`${tenant_id}:ROOM:${socket.room_id}`, JSON.stringify({
                tenant_id: socket.tenant_id,
                quota:(tenantData.limit)?tenantData.user_limit:'unlimited',
                teacher_id: socket.user_id,
                teacher_name: socket.username,
                room_id: socket.room_id,
                room_name: data.username,
                participant_list: Array(),
                assistant_list: Array(),
                participant_list_ws: Array(),
                assistant_list_ws: Array(),
                participant_list_history: Array(),
                ws: socket.socket_room_id,
                temporary : true
              }));   
            }
            joinSocketRoom(io, socket,socket.socket_room_id) 
          } else {
            onRoomNotFound(io,socket)
          }
        }
      } else {
        socket.emit("alert_limit_user", {
          user_id: socket.user_id,
          user_type: socket.user_type,
          tenant_id: socket.tenant_id
        });
      }
    } catch (err) {
      console.log(err)
    }

  })
  
  socket.on(wsTypes.LEAVE_WS_ROOM, async (data)=>{
    console.log(`=======================================================`)
    console.log(`LEAVE_WS_ROOM: ${data.tenant_id}:ROOM:${data.room_id}`);
    console.log(`=======================================================`)
    if(data){
      const id = `${data.tenant_id}:ROOM:${data.room_id}`
      leaveSocketRoom(io, socket, id) 
    }
  })

  
}

export const eventRoomsSocket = async (io,namespace) => {
  const db_tenant = namespace.db;
  
  const onCreateSocketRoom = async (id) => {
    console.log(`=======================================================`)
    console.log(`CREATED ROOM : ${id}`);
    console.log(`=======================================================`)
  
    // console.log(realcastSocketIo)
    try {
      const room_id = id.split(':').at(-1)
      const tenant_id = id.split(':').at(0)
  
      console.log('room_id',room_id)
      console.log('tenant_id',tenant_id)

      if(tenant_id && room_id){
        const tenant_data = await db_master.tenants.findOne({
          attributes : ['limit','user_limit'],
          where : {
            id:tenant_id
          }
        })
  
        const rooms = await db_tenant.rooms.findOne({
          attributes : ['id','name','tenant_id','teacher_id'],
          include : {
            model : db_tenant.teachers,
            attributes : ['first_name','middle_name','last_name','username','email']
          },
          where : {
            id:room_id,
            tenant_id
          }
        })
  
        if(rooms){
          await redisClient.SADD(`${tenant_id}:ROOMDATA`, room_id);
          let storeRoom;
          const getRoom = await redisClient.get(`${tenant_id}:ROOM:${room_id}`);
          if (!getRoom) {
            storeRoom = await redisClient.SET(`${tenant_id}:ROOM:${room_id}`, JSON.stringify({
              tenant_id: tenant_id,
              quota:(tenant_data.limit)?tenant_data.user_limit:'unlimited',
              teacher_id: rooms.teacher_id,
              teacher_name: rooms.teacher.username,
              room_id: rooms.id,
              room_name: rooms.name,
              participant_list: Array(),
              assistant_list: Array(),
              participant_list_ws: Array(),
              assistant_list_ws: Array(),
              participant_list_history: Array(),
              ws: id,
            }));   
          } else {
            storeRoom = 'OK';
          }
        }
      }
    } catch (err) {
      console.log(`***FAILED store ROOM to redis: ${id}***`)
      console.log(err)
    }
  }

  const onJoinRoom = async (id, socket_id) => {
    const socket = namespace?.sockets?.get(socket_id);

    const room_id = socket?.room_id
    const tenant_id = socket?.tenant_id
    const user_id = socket?.user_id
    const username = socket?.username
    const user_type = socket?.user_type
    const teacher_id = socket?.teacher_id
    const terminal_type = socket?.terminal_type
    const name_type = socket?.name_type
    const os = socket?.os

    if(socket?.user_id && socket_id != id && socket.id == socket_id){ //check room is not private room
      console.log(`=======================================================`)
      console.log(`JOINED TO ROOM : [SocketID : ${socket_id} xxxx ${socket.id} xxxx ${socket.id_from_client}] [RoomID : ${id}] [UserID : ${socket?.user_id}] [OS : ${os}]`);
      console.log(`=======================================================`)
      try {

          const user = {
            tenant_id: tenant_id,
            user_type: user_type,
            user_id: user_id,
            username: username,
            room_id: room_id,
            teacher_id: teacher_id,
            terminal_type: terminal_type,
            name_type: name_type,
            last_screen: 0,
            last_screen_date: new Date().getTime(),
            last_screen_default: 0,
            os: os,
            watching_user_id: 0,
            last_connection: new Date().getTime(),
            disconnected: 0,
            ws: socket_id,
          }

          const userData = {
            room_id : room_id,
            user_id : user_id,
            username : username,
            user_type: user_type,
            last_screen : config.INITIAL_SCREEN,
            last_screen_default: 1,
            os : os
          }
          
          const storeUser = await redisClient.SET(`${tenant_id}:USER:${user_id}`, JSON.stringify(user));
          
          await redisClient.SREM(`${tenant_id}:USERDATA:${room_id}`, JSON.stringify(userData));
          await redisClient.SADD(`${tenant_id}:USERDATA:${room_id}`, JSON.stringify(userData));

          socket.userStored = storeUser == 'OK' ? true : false;

          setQuotaTenant(io, socket, JSON.stringify({data:{
            tenant:tenant_id,
            userId:user_id,
            userType:user_type
          }}))

          fetchRoom(io,socket);
          emitJoinSocketRoom(io,socket)
    
      } catch (err) {
        console.log(`***FAILED store USER to redis: ${id}***`)
        console.log(err)
      }
    }
  }

  const onDeleteRoom = async (id) => {
    // console.log(`=======================================================`)
    // console.log(`DELETED ROOM : ${id}`);
    // console.log(`=======================================================`)
    const room_id = id.split(':').at(-1)
    const tenant_id = id.split(':').at(0)
    

    try {
      if(tenant_id && room_id){
        io.in(id).socketsLeave(true);
        redisClient.SREM(`${tenant_id}:ROOMDATA`, room_id);
        // redisClient.DEL(`${tenant_id}:ROOM:${room_id}`);
      }
    } catch (err) {
      // console.log(err)
      // console.log(`***FAILED delete ROOM from redis: ${id}***`)
    }
  }

  const onLeaveRoom = async (id, socket_id) => {
    const socket = namespace?.sockets?.get(socket_id);

    const room_id = socket?.room_id
    const tenant_id = socket?.tenant_id
    const user_id = socket?.user_id
    const username = socket?.username
    const user_type = socket?.user_type
    
    if(socket_id != id && socket.id == socket_id){
      console.log(`=======================================================`)
      console.log(`LEAVE FROM ROOM : [SocketID : ${socket_id}] [RoomID : ${id}]`);
      console.log(`=======================================================`)

        try {
            
            const user = await getUser(socket.tenant_id, socket.user_id);
            if(user){
              if(user_type == userType.STUDENT){
                await studentLeaveRoom(tenant_id, room_id, user_id);
                user.last_screen_date = new Date().getTime();
                user.last_screen_default = 3;
                refreshScreen(io, socket, user, 1);
              }
              
              
              if (user_type != userType.STUDENT) {
                const userData = await redisClient.SMEMBERS(`${socket.tenant_id}:USERDATA:${room_id}`);
                
                await Promise.all(
                  userData.map(async(item) => {
                    const participant = JSON.parse(item)
                    if(participant.user_id == socket.user_id){
                      const user = await getUser(socket.tenant_id, participant.user_id);
                      if (user !== false) {
                        await redisClient.SREM(`${socket.tenant_id}:USERDATA:${room_id}`, item);
                        await redisClient.DEL(`${socket.tenant_id}:USER:${participant.user_id}`);
                      }
                    }
                  })
                )

                if(user_type == userType.STUDENT){
                  removeQuotaTenant(io,socket, JSON.stringify({
                    data : {
                      tenant: socket.tenant_id,
                      userId: socket.user_id,
                      userType: userType.STUDENT
                    }
                  }))
                }
              
                refreshScreen(io, socket, user, 0);
              }

              socket.emit("leave_socket_room", {
                user_id: socket.user_id,
                user_type: socket.user_type,
                username: socket.username,
                room_id: socket.room_id,
                tenant_id: socket.tenant_id,
                teacher_id: socket.teacher_id
              });
            }
        } catch (err) {
          console.log(err)
          console.log(`***FAILED delete USER from redis: ${id}***`)
        }
    }
  }

  
  // const ns = io.server._nsps.get('/tenant-9465a95d-2170-4a1d-b254-e2de1bd38da2')
  // console.log(.adapter,'io')
  // ns.adapter.on("create-room", onCreateSocketRoom);
  namespace.adapter.on("create-room", onCreateSocketRoom);
  
  namespace.adapter.on("join-room", onJoinRoom);
  
  namespace.adapter.on("delete-room", onDeleteRoom);
  
  namespace.adapter.on("leave-room", onLeaveRoom);

}

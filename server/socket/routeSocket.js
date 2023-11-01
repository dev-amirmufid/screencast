import { db_master, db_tenants, initDBTenant } from "../models/index.js";
import { adminSocket, tenantSocket, eventRoomsSocket } from "./eventSocket.js";
import { onLeaveRoom } from "./webSocket.js";

export const socketIO = async (io) => {
  let ns_adapter = []

  const realcastSocketIo = io.of("/");
  realcastSocketIo.on("connection", async (socket) => {
    // console.log("socket.js io.on connection");
    adminSocket(io,socket)
  });

  
  const tenantNameSpace = io.of(/^\/tenant-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

  tenantNameSpace.on('connection', async (ns_socket) => {
    console.log(`OPEN TENANT`, ns_socket.nsp.name)
    
    const socket_tenant_id = ns_socket.nsp.name.replace('/tenant-','');
    let db_tenant
    if(db_tenants[socket_tenant_id]){
      db_tenant = db_tenants[socket_tenant_id]
    } else {
      db_tenant = await initDBTenant(socket_tenant_id);
    }
    ns_socket.tenant_id = socket_tenant_id
    ns_socket.db = db_tenant

    tenantSocket(io,ns_socket)
  });

  io.on("new_namespace", async (namespace) => {
    console.log(`CREATE NAMESPACE TENANT`, namespace.name)
    const socket_tenant_id = namespace.name.replace('/tenant-','');
    let db_tenant
    if(db_tenants[socket_tenant_id]){
      db_tenant = db_tenants[socket_tenant_id]
    } else {
      db_tenant = await initDBTenant(socket_tenant_id);
    }
    namespace.tenant_id = socket_tenant_id
    namespace.db = db_tenant
    eventRoomsSocket(io,namespace)
  });
};

import React from 'react';
import { Navigate, Route, Routes } from "react-router-dom"
import { TeacherLayout } from "../components/Layout"
import WebSocketHoc from "../hocs/WebSocketHoc"
import { NoAuth, RequireAuth, TenantsAuth } from "./Provider/AuthProvider"
import RedirectNao from '../pages/RedirectNAO';

//Teacher Page
const LoginTeacher = React.lazy(() => import("../pages/teacher/LoginTeacher"));
const Lti = React.lazy(() => import("../pages/lti/Lti"));
const RoomManagement = React.lazy(() => import("../pages/teacher/RoomManagement"));
const AssistantJoinRoom = React.lazy(() => import("../pages/teacher/AssistantJoinRoom"));

const Monitoring = React.lazy(() => import("../pages/teacher/Monitoring"));
const JoinRoom = React.lazy(() => import("../pages/student/JoinRoom"));
const JoinConfirm = React.lazy(() => import("../pages/student/JoinConfirm"));
const StudentRoom = React.lazy(() => import("../pages/student/StudentRoom"));
const StudentLeave = React.lazy(() => import("../pages/student/LeaveRoom"));
const NotFound = React.lazy(() => import("../pages/NotFound"));

export const TenantRouters = () => {
  return (
    <Routes>
      <Route element={<TenantsAuth />}>
          <Route element={<WebSocketHoc />}>
            <Route path="/lti" element={<Lti/>} />
          </Route>             
        <Route path="/assistant/join-room/:tenant_id/:room_uri" element={<AssistantJoinRoom />} />
        <Route element={<NoAuth />}>
          <Route path="/student/leave-room/force" element={<StudentLeave force={true} />} />
          <Route path="/student/leave-room" element={<StudentLeave force={false}  />} />
          <Route element={<WebSocketHoc />}>
            <Route path="/" element={<RedirectNao/>} />
            <Route path="/teacher/login" element={<RedirectNao/>} />
            <Route path="/student/join-room/:tenant_id/:room_uri" element={<JoinRoom />} />
            <Route path="/student/join-confirm" element={<JoinConfirm />} />
          </Route>              
          <Route element={<WebSocketHoc />}>
            <Route path="/student/room" element={<StudentRoom />} />
          </Route>
        </Route>
        <Route element={<RequireAuth roles={['teacher']}/>}>
          <Route element={<TeacherLayout />}>
            <Route element={<WebSocketHoc />}>
              <Route path="/teacher" element={ <Navigate to="/teacher/room-management" />} />
              <Route path="/teacher/monitoring" element={<Monitoring />} />
              <Route path="/teacher/room-management" element={<RoomManagement />} />
              <Route path="/assistant/monitoring" element={<Monitoring />} />
              <Route path="/teacher/temporary-monitoring" element={<Monitoring />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={ <NotFound />} />
    </Routes>
  )
}

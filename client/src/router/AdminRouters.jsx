import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/Layout";
import { NoAuth, RequireAuth } from "./Provider/AuthProvider";
import WebSocketHoc from "../hocs/WebSocketHoc"

//Admin Page
const LoginAdmin = React.lazy(() => import("../pages/admin/LoginAdmin"));
const TenantManagement = React.lazy(() => import("../pages/admin/TenantManagement"));
const TenantManagementSync = React.lazy(() => import("../pages/admin/TenantManagementSync"));
const TeacherManagement = React.lazy(() => import("../pages/admin/TeacherManagement"));
const TeacherImport = React.lazy(() => import("../pages/admin/TeacherManagement/TeacherImport"));
const SchoolManagement = React.lazy(() => import("../pages/admin/SchoolManagement"));
const AdminManagement = React.lazy(() => import("../pages/admin/AdminManagement"));
const LogManagement = React.lazy(() => import("../pages/admin/LogManagement"));
const SyncLogManagement = React.lazy(() => import("../pages/admin/SyncLogManagement"));
const AdminRoomManagement = React.lazy(() => import("../pages/admin/RoomManagement"));
const NotFound = React.lazy(() => import("../pages/NotFound"));

export const AdminRouters = () => {
  return (
    <Routes>
      <Route element={<NoAuth />}>
        <Route path="/" element={<LoginAdmin/>} />
        <Route path="/admin/login" element={<LoginAdmin/>} />
      </Route>
      <Route element={<RequireAuth roles={['admin','superadmin','school_admin']}/>}>
        <Route element={<AdminLayout />}>
          <Route element={<WebSocketHoc />}>
            <Route path="/admin" element={ <Navigate to="/admin/tenant-management" replace />} />
            <Route path="/admin/tenant-management" element={<TenantManagement />} />
            <Route path="/admin/tenant-management/sync/:job_id" element={<TenantManagementSync />} />
            <Route path="/admin/admin-management" element={<AdminManagement />} />
            <Route path="/admin/school-management" element={<SchoolManagement />} />
            {/* ADMIN > Teachers Start*/}
            <Route path="/admin/teacher-management" element={<TeacherManagement />} />
            <Route path="/admin/teacher-import" element={<TeacherImport/>} /> 
            {/* ADMIN > Teachers End*/}
            <Route path="/admin/room-management" element={<AdminRoomManagement />} />
            <Route path="/admin/log-management" element={<LogManagement />} />
            <Route path="/admin/sync-log-management" element={<SyncLogManagement />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={ <NotFound />} />
    </Routes>
  )
}

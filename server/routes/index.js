import express from "express";
import teacherRoutes from "./teachers.js";
import studentRoutes from "./student.js";
import authRoutes from "./auth.js";
import logRoutes from "./log.js";
import logsRoutes from "./logs.js";
import syncLogsRoutes from "./sync-logs.js";
import confRoutes from "./config.js";
import exportRoutes from "./export.js";

import tenantsRouters from "./tenants.js";
import schoolsRouters from "./schools.js";
import roomsRouters from "./rooms.js";
import usersRouters from "./users.js";

import LTI from "../lti-config.js";

const lti = await LTI({serverless:true})

const router = express.Router();

router.use("/users", usersRouters);
router.use("/teachers", teacherRoutes);
router.use("/student", studentRoutes);
router.use("/auth", authRoutes);
router.use("/log", logRoutes);
router.use("/logs", logsRoutes);
router.use("/sync-logs", syncLogsRoutes);
router.use("/config", confRoutes);
router.use("/export", exportRoutes);
router.use("/tenants", tenantsRouters);
router.use("/schools", schoolsRouters);
router.use("/rooms", roomsRouters);
router.use("/lti", lti.app);


export default router;

import express from "express";
import { createUser } from "../controllers/student.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";
const router = express.Router();

router.post("/createUser", createUser, CloseDBMiddleware());

export default router;

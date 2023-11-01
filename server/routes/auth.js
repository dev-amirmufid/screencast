import express from "express";
import { student, assistant, admin, teacher, logout } from "../controllers/auth.js";
import { Validator } from "../middleware/index.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";
import { loginSchema } from "../validation/auth.js";

const router = express.Router();

router.post("/student", student,CloseDBMiddleware());
router.post("/assistant", assistant,CloseDBMiddleware());
router.post("/admin", Validator(loginSchema), admin,CloseDBMiddleware());
router.post("/teacher",[Validator(loginSchema)] , teacher,CloseDBMiddleware());
router.post("/logout" , logout,CloseDBMiddleware());

export default router;

import express from "express";
import { iceServer, clearRedis, clearAssistant } from "../controllers/config.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";
const router = express.Router();

router.get("/ice-server", iceServer,CloseDBMiddleware());
router.get("/clearRedis", clearRedis,CloseDBMiddleware());
router.get("/clearAssistant", clearAssistant);

export default router;

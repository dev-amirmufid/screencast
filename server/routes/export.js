import express from "express";
import { participantCsv } from "../controllers/export.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";
const router = express.Router();

router.get("/participant/:tenant_id/:roomid", participantCsv, CloseDBMiddleware());

export default router;

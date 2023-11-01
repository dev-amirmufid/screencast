import express from "express";
import { storeLog, createLog } from "../controllers/log.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";

const router = express.Router();
router.post("/store", storeLog, CloseDBMiddleware());
router.post("/create", createLog, CloseDBMiddleware()); // api log for appli


export default router;

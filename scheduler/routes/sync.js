import express from "express";
import {
  startServices,
  getJobStatus,
  stopSync,
  scheduler,
} from "../controllers/sync.js";
import { Auth } from "../middleware/index.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";

const router = express.Router();

router.post(
  "/start",
  [Auth(["superadmin", "admin", "school_admin"])],
  startServices,
  CloseDBMiddleware()
);
router.get(
  "/status/:id",
  [Auth(["superadmin", "admin", "school_admin"])],
  getJobStatus,
  CloseDBMiddleware()
);
router.get("/stopsync/:id", stopSync, CloseDBMiddleware());
router.get("/scheduler", scheduler, CloseDBMiddleware());

export default router;

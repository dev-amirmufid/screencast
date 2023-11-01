import express from "express";
import { 
  get,
  getById
} from "../controllers/sync-logs.js";
import { Auth } from "../middleware/index.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";

const router = express.Router();

router.get("/", [Auth(['superadmin'])], get, CloseDBMiddleware())
router.get("/:id", [Auth(['superadmin'])], getById, CloseDBMiddleware())

export default router;

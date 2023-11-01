import express from "express";
import { 
  clearData
} from "../controllers/lti.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";

const router = express.Router();

router.get("/clear-data", clearData, CloseDBMiddleware())
export default router;

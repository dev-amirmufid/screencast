import express from "express";
import { 
  get,
  store,
  update,
  getById,
  destroy
} from "../controllers/logs.js";
import { Auth } from "../middleware/index.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";

const router = express.Router();

router.get("/", [Auth(['superadmin','admin','school_admin'])], get, CloseDBMiddleware())
router.get("/:id", [Auth(['superadmin','admin','school_admin'])], getById, CloseDBMiddleware())
router.post("/", [Auth(['superadmin','admin','school_admin'])], store,CloseDBMiddleware())
router.put("/:id", [Auth(['superadmin','admin','school_admin'])], update, CloseDBMiddleware())
router.delete("/:id", [Auth(['superadmin','admin','school_admin'])], destroy, CloseDBMiddleware())

export default router;

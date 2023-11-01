import express from "express";
import { 
  get,
  store,
  update,
  getById,
  destroy
} from "../controllers/users.js";
import { Auth,Validator } from "../middleware/index.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";
import { getSchema } from "../validation/users.js";

const router = express.Router();

router.get("/", [Auth(['superadmin','admin','school_admin']), Validator(getSchema)], get, CloseDBMiddleware())
router.get("/:id", [Auth(['superadmin','admin','school_admin'])], getById, CloseDBMiddleware())
router.post("/", [Auth(['superadmin','admin','school_admin'])], store, CloseDBMiddleware())
router.put("/:id", [Auth(['superadmin','admin','school_admin'])], update, CloseDBMiddleware())
router.delete("/:id", [Auth(['superadmin','admin','school_admin'])], destroy,CloseDBMiddleware())

export default router;

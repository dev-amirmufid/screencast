import express from "express";
import { 
  get,
  store,
  update,
  getById,
  destroy,
  getByRoomId,
  getByRoomUri
} from "../controllers/rooms.js";
import { Auth,Validator } from "../middleware/index.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";
import { getSchema, storeSchema } from "../validation/rooms.js";

const router = express.Router();

router.get("/", [Auth(['superadmin','admin','school_admin','teacher']), Validator(getSchema)], get, CloseDBMiddleware())
router.get("/:id", [Auth(['superadmin','admin','school_admin','teacher'])], getById, CloseDBMiddleware())
router.get("/roomId/:id", [], getByRoomId, CloseDBMiddleware())
router.get("/roomUri/:id", [], getByRoomUri, CloseDBMiddleware())
router.post("/", [Auth(['superadmin','admin','school_admin','teacher']), Validator(storeSchema)], store, CloseDBMiddleware())
router.put("/:id", [Auth(['superadmin','admin','school_admin','teacher']), Validator(storeSchema)], update,CloseDBMiddleware())
router.delete("/:id", [Auth(['superadmin','admin','school_admin','teacher'])], destroy, CloseDBMiddleware())

export default router;

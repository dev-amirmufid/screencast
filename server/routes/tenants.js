import express from "express";
import { 
  get,
  store,
  update,
  getById,
  destroy,
  checkSubdomain,
  getJobStatus,
  getBySubdomain,
  migration
} from "../controllers/tenants.js";
import { Auth,Validator } from "../middleware/index.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";
import { getSchema, storeSchema } from "../validation/tenants.js";

const router = express.Router();

router.get("/migration", migration, CloseDBMiddleware())

router.get("/check-subdomain/" , checkSubdomain, CloseDBMiddleware())
router.get("/job/:id", [Auth(['superadmin','admin','school_admin'])], getJobStatus, CloseDBMiddleware())
router.get("/subdomain/:subdomain", [], getBySubdomain, CloseDBMiddleware())

router.get("/", [Auth(['superadmin','admin','school_admin']), Validator(getSchema)], get, CloseDBMiddleware())
router.post("/", [Auth(['superadmin','admin','school_admin']), Validator(storeSchema)], store, CloseDBMiddleware())
router.get("/:id/", [Auth(['superadmin','admin','school_admin','teacher'])], getById, CloseDBMiddleware())
router.put("/:id", [Auth(['superadmin','admin','school_admin']), Validator(storeSchema)], update, CloseDBMiddleware())
router.delete("/:id", [Auth(['superadmin','admin','school_admin'])], destroy, CloseDBMiddleware())

export default router;

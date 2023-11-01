import express from "express";
import { 
  createRoom, 
  generateStudentURL, 
  generateAssistantURL,
  get,
  store,
  update,
  getById,
  destroy,
  changePassword,
  exportCsv,
  importCsv,
  checkIngmportCsv,
  storeAssistant  
} from "../controllers/teachers.js";

import { Auth,Validator } from "../middleware/index.js";
import { CloseDBMiddleware } from "../middleware/tenant.middleware.js";
import { getSchema } from "../validation/teachers.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/assistant", storeAssistant, CloseDBMiddleware())

router.post("/createRoom", createRoom, CloseDBMiddleware());
router.post("/generateStudentURL",  generateStudentURL, CloseDBMiddleware());
router.post("/generateAssistantURL",  generateAssistantURL, CloseDBMiddleware());

router.post("/change-password/:id", [Auth(['superadmin','admin','school_admin','teacher'])], changePassword, CloseDBMiddleware())
router.get("/", [Auth(['superadmin','admin','school_admin','teacher']), Validator(getSchema)], get, CloseDBMiddleware())
router.get("/export", [Auth(['superadmin','admin','school_admin','teacher']), Validator(getSchema)], exportCsv, CloseDBMiddleware())
router.post("/import-csv",[Auth(['superadmin','admin','school_admin','teacher']),upload.single("file")], importCsv, CloseDBMiddleware())
router.post("/checking-import-csv",[Auth(['superadmin','admin','school_admin','teacher']),upload.single("file")], checkIngmportCsv, CloseDBMiddleware())
router.get("/:id", [Auth(['superadmin','admin','school_admin','teacher'])], getById, CloseDBMiddleware())
router.post("/", [Auth(['superadmin','admin','school_admin','teacher'])], store, CloseDBMiddleware())
router.put("/:id", [Auth(['superadmin','admin','school_admin','teacher'])], update, CloseDBMiddleware())
router.delete("/:id", [Auth(['superadmin','admin','school_admin','teacher'])], destroy, CloseDBMiddleware())

export default router;

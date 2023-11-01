import express from "express";
import syncRoutes from "./sync.js";
// import schedulerRoutes from "./scheduler.js";
// import jobRoutes from "./job.js";

const router = express.Router();

router.use("/sync", syncRoutes);
// router.use("/scheduler", schedulerRoutes);
// router.use("/job", jobRoutes);

export default router;
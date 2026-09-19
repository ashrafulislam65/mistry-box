import { Router } from "express";
import publicRoutes from "./public.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/", publicRoutes);
router.use("/admin", adminRoutes);

export default router;
import { Router } from "express";
import { requireAdminAuth } from "../middleware/auth.middleware";
import { adminLogin, adminLogout, adminMe } from "../controllers/auth.controller";
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "../controllers/category.controller";
import {
  adminListPackages,
  adminCreatePackage,
  adminUpdatePackage,
  adminDeletePackage,
} from "../controllers/package.controller";
import { adminListOrders, adminUpdateOrderStatus, adminExportOrders } from "../controllers/order.controller";

const router = Router();

router.post("/auth/login", adminLogin);
router.post("/auth/logout", adminLogout);
router.get("/auth/me", requireAdminAuth, adminMe);

router.use(requireAdminAuth);

router.get("/categories", adminListCategories);
router.post("/categories", adminCreateCategory);
router.put("/categories/:id", adminUpdateCategory);
router.delete("/categories/:id", adminDeleteCategory);

router.get("/packages", adminListPackages);
router.post("/packages", adminCreatePackage);
router.put("/packages/:id", adminUpdatePackage);
router.delete("/packages/:id", adminDeletePackage);

router.get("/orders", adminListOrders);
router.get("/orders/export", adminExportOrders);
router.patch("/orders/:id", adminUpdateOrderStatus);

export default router;
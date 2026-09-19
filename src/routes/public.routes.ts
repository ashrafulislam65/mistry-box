import { Router } from "express";
import { listCategories } from "../controllers/category.controller";
import { listPackages, getPackageBySlug } from "../controllers/package.controller";
import { createOrder } from "../controllers/order.controller";

const router = Router();

router.get("/categories", listCategories);
router.get("/packages", listPackages);
router.get("/packages/:slug", getPackageBySlug);
router.post("/orders", createOrder);

export default router;
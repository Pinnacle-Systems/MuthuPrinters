import { Router } from "express";
const router = Router();
import { get, getMonthly, getCustomerWise, getYearWise } from "../controllers/salesReport.controller.js";

router.get("/", get);
router.get("/monthly", getMonthly);
router.get("/customerWise", getCustomerWise);
router.get("/yearWise", getYearWise);

export default router;

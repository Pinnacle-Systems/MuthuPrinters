import { Router } from "express";
const router = Router();
import { get, getMonthly, getCustomerWise, getYearWise, getYearWiseBreakup, getMonthWiseBreakup, getQuarterWiseBreakup, getCustomerWiseBreakup } from "../controllers/salesReport.controller.js";

router.get("/", get);
router.get("/monthly", getMonthly);
router.get("/customerWise", getCustomerWise);
router.get("/yearWise", getYearWise);
router.get("/yearWiseBreakup", getYearWiseBreakup);
router.get("/monthWiseBreakup", getMonthWiseBreakup);
router.get("/quarterWiseBreakup", getQuarterWiseBreakup);
router.get("/customerWiseBreakup", getCustomerWiseBreakup);

export default router;

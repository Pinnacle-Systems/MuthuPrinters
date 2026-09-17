import { Router } from "express";
const router = Router();
import { get } from "../controllers/productionReport.controller.js";

router.get("/", get);

export default router;

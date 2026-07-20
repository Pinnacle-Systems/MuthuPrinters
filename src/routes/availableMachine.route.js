import { Router } from "express";
const router = Router();
import {
  get
} from "../controllers/availableMachine.controller.js";

router.get("/", get);

export default router;

import { Router } from "express";
const router = Router();
import {
  get,
  getOne,
  create,
  update,
  remove,
  getPendingApproval,
} from "../controllers/approvalConfig.controller.js";

router.post("/", create);

router.get("/", get);

router.get("/getPendingApproval", getPendingApproval);

router.get("/:id", getOne);

router.put("/:id", update);

router.delete("/:id", remove);

export default router;

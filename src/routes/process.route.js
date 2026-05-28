import { Router } from "express";
const router = Router();
import {
  get,
  getOne,
  create,
  update,
  remove,
  UpdateProcess,
  UpdatePushProcess
} from "../controllers/process.controller.js";

router.post("/", create);

router.get("/", get);

router.get("/:id", getOne);

router.put("/:id", update);

router.put("/Update/Process",UpdateProcess)

router.put("/Update/PushProcess",UpdatePushProcess)

router.delete("/:id", remove);

export default router;

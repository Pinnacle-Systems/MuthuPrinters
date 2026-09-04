import { Router } from "express";
const router = Router();
import {
  get,
  getOne,
  create,
  update,
  remove,
  notificationMachines,
  machineViewed,
} from "../controllers/machine.controller.js";

router.post("/", create);

router.post("/viewed", machineViewed);

router.get("/notifications", notificationMachines);

router.get("/", get);

router.get("/:id", getOne);

router.put("/:id", update);

router.delete("/:id", remove);

export default router;

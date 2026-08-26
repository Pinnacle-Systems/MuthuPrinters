import { Router } from "express";
const router = Router();
import {
  get,
  getOne,
  create,
  update,
  remove,
  getRefList,
  geOrderItemsList
} from "../controllers/packing.controller.js";

import { multerUploadForGrid } from "../utils/multerUpload.js";

router.post("/", multerUploadForGrid.array("images"), create);

router.put("/:id", multerUploadForGrid.array("images"), update);

router.get("/", get);

router.get("/:id", getOne);

router.get("/refList", getRefList);

router.get("/orderitemsList", geOrderItemsList);

router.delete("/:id", remove);

export default router;

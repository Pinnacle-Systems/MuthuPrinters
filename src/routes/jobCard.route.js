import { Router } from "express";
const router = Router();
import {
  get,
  getOne,
  create,
  update,
  remove,
  getJobCardList,get_mob_joblist
} from "../controllers/jobCard.controller.js";


router.post("/", create);

router.get("/", get);
router?.get("/get_mob_joblist",get_mob_joblist)
router.get("/jobCardList", getJobCardList);
router.put("/:id", update);

router.get("/:id", getOne);
router.delete("/:id", remove);

export default router;

import express from "express";
import { ReworkPendingProcess } from "../services/process_mob.service.js";

const router = express.Router();

router.post("/rework-pending", async (req, res, next) => {
  try {
    const result = await ReworkPendingProcess(req);
    if (result.statusCode === 0) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    console.error("Error in rework-pending route:", err.message);
    next(err);
  }
});

export default router;

import { get as _get } from "../services/ProductionReportService.js";

async function get(req, res, next) {
  try {
    res.json(await _get(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}

export { get };

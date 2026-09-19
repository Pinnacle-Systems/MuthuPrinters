import { get as _get, getMonthly as _getMonthly, getCustomerWise as _getCustomerWise, getYearWise as _getYearWise } from "../services/salesReport.service.js";

async function get(req, res, next) {
  try {
    res.json(await _get(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}
async function getMonthly(req, res, next) {
  try {
    res.json(await _getMonthly(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}

async function getCustomerWise(req, res, next) {
  try {
    res.json(await _getCustomerWise(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}

async function getYearWise(req, res, next) {
  try {
    res.json(await _getYearWise(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}

export { get, getMonthly, getCustomerWise, getYearWise };

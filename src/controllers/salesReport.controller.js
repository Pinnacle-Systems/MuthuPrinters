import { get as _get, getMonthly as _getMonthly, getCustomerWise as _getCustomerWise, getYearWise as _getYearWise, getYearWiseBreakup as _getYearWiseBreakup, getMonthWiseBreakup as _getMonthWiseBreakup, getQuarterWiseBreakup as _getQuarterWiseBreakup, getCustomerWiseBreakup as _getCustomerWiseBreakup } from "../services/salesReport.service.js";

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

async function getYearWiseBreakup(req, res, next) {
  try {
    res.json(await _getYearWiseBreakup(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}

async function getMonthWiseBreakup(req, res, next) {
  try {
    res.json(await _getMonthWiseBreakup(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}

async function getQuarterWiseBreakup(req, res, next) {
  try {
    res.json(await _getQuarterWiseBreakup(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}

async function getCustomerWiseBreakup(req, res, next) {
  try {
    res.json(await _getCustomerWiseBreakup(req));
  } catch (err) {
    console.error(`Error `, err.message);
    res.status(500).json({ error: err.message });
  }
}

export { get, getMonthly, getCustomerWise, getYearWise, getYearWiseBreakup, getMonthWiseBreakup, getQuarterWiseBreakup, getCustomerWiseBreakup };

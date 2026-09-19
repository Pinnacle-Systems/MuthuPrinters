import { prisma } from "../lib/prisma.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getYearShortCodeForFinYear } from "../utils/helper.js";

async function get(req) {
  const { branchId, finYearId } = req.query;

  let finYearDate = null;
  if (finYearId) {
    finYearDate = await getFinYearStartTimeEndTime(finYearId);
  }

  const whereClause = {
    branchId: branchId ? parseInt(branchId) : undefined,
  };

  if (finYearDate) {
    whereClause.AND = [
      { createdAt: { gte: finYearDate.startDateStartTime } },
      { createdAt: { lte: finYearDate.endDateEndTime } },
    ];
  }

  // Fetch from SalesDelivery
  const salesDeliveries = await prisma.salesDelivery.findMany({
    where: whereClause,
    select: {
      netAmount: true,
      createdAt: true,
    },
  });

  // Fetch from SalesBillEntry
  const salesBillEntries = await prisma.salesBillEntry.findMany({
    where: whereClause,
    select: {
      netAmount: true,
      createdAt: true,
    },
  });

  let totalRevenue = 0;

  const processEntries = (entries) => {
    entries.forEach((entry) => {
      totalRevenue += parseFloat(entry.netAmount || 0);
    });
  };

  processEntries(salesDeliveries);
  processEntries(salesBillEntries);

  const data = [
    {
      label: "Total Revenue",
      revenue: totalRevenue,
    },
  ];

  return { statusCode: 0, data };
}

async function getMonthly(req) {
  const { branchId, finYearId } = req.query;

  let finYearDate = null;
  if (finYearId) {
    finYearDate = await getFinYearStartTimeEndTime(finYearId);
  }

  const whereClause = {
    branchId: branchId ? parseInt(branchId) : undefined,
  };

  if (finYearDate) {
    whereClause.AND = [
      { createdAt: { gte: finYearDate.startDateStartTime } },
      { createdAt: { lte: finYearDate.endDateEndTime } },
    ];
  }

  const salesDeliveries = await prisma.salesDelivery.findMany({
    where: whereClause,
    select: { netAmount: true, createdAt: true },
  });

  const salesBillEntries = await prisma.salesBillEntry.findMany({
    where: whereClause,
    select: { netAmount: true, createdAt: true },
  });

  const monthlyData = {};

  const processEntries = (entries) => {
    entries.forEach((entry) => {
      const amt = parseFloat(entry.netAmount || 0);
      const monthStr = entry.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
      if (!monthlyData[monthStr]) monthlyData[monthStr] = 0;
      monthlyData[monthStr] += amt;
    });
  };

  processEntries(salesDeliveries);
  processEntries(salesBillEntries);

  const sortedMonths = Object.keys(monthlyData).sort();
  const data = sortedMonths.map((month) => {
    const date = new Date(month + "-01");
    return {
      monthStr: month,
      label: date.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      }),
      revenue: monthlyData[month],
    };
  });

  return { statusCode: 0, data };
}

async function getCustomerWise(req) {
  const { branchId, finYearId, customerId } = req.query;

  if (!customerId) {
    return { statusCode: 1, message: "Customer ID is required" };
  }

  let finYearDate = null;
  if (finYearId) {
    finYearDate = await getFinYearStartTimeEndTime(finYearId);
  }

  const whereClause = {
    branchId: branchId ? parseInt(branchId) : undefined,
    customerId: parseInt(customerId),
  };

  if (finYearDate) {
    whereClause.AND = [
      { createdAt: { gte: finYearDate.startDateStartTime } },
      { createdAt: { lte: finYearDate.endDateEndTime } },
    ];
  }

  const salesDeliveries = await prisma.salesDelivery.findMany({
    where: whereClause,
    select: { netAmount: true },
  });

  const salesBillEntries = await prisma.salesBillEntry.findMany({
    where: whereClause,
    select: { netAmount: true },
  });

  let totalRevenue = 0;

  const processEntries = (entries) => {
    entries.forEach((entry) => {
      totalRevenue += parseFloat(entry.netAmount || 0);
    });
  };

  processEntries(salesDeliveries);
  processEntries(salesBillEntries);

  const data = [
    {
      label: "Total Revenue",
      revenue: totalRevenue,
    },
  ];

  return { statusCode: 0, data };
}

export { get, getMonthly, getCustomerWise, getYearWise };

async function getYearWise(req) {
  const { branchId } = req.query;

  const finYears = await prisma.finYear.findMany({
    orderBy: { from: "asc" },
  });

  const yearWiseData = [];

  for (const fy of finYears) {
    if (!fy.from || !fy.to) continue;

    const shortCode = getYearShortCodeForFinYear(fy.from, fy.to);

    // Using simple date conversion, but keeping same logic structure as getMonthly
    const startTime = new Date(fy.from);
    const endTime = new Date(fy.to);
    endTime.setHours(23, 59, 59, 999);

    const whereClause = {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    };

    const salesDeliveries = await prisma.salesDelivery.findMany({
      where: whereClause,
      select: { netAmount: true },
    });

    const salesBillEntries = await prisma.salesBillEntry.findMany({
      where: whereClause,
      select: { netAmount: true },
    });

    let totalRevenue = 0;
    salesDeliveries.forEach((entry) => {
      totalRevenue += parseFloat(entry.netAmount || 0);
    });
    salesBillEntries.forEach((entry) => {
      totalRevenue += parseFloat(entry.netAmount || 0);
    });

    yearWiseData.push({
      finYearId: fy.id,
      shortCode,
      label: shortCode,
      revenue: totalRevenue,
    });
  }

  return { statusCode: 0, data: yearWiseData };
}

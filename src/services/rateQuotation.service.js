import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getDateFromDateTime,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  if (!branchId) return "";
  let lastObject = await prisma.rateQuotation.findFirst({
    where: {
      branchId: parseInt(branchId),
      AND:
        startTime && endTime
          ? [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }]
          : undefined,
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");
  let newDocId = `${branchObj?.branchCode || "BR"}/${shortCode || "GEN"}/QUO/1`;
  if (lastObject && lastObject.docId) {
    const parts = lastObject.docId.split("/");
    const lastNum = parseInt(parts.at(-1));
    if (!isNaN(lastNum)) {
      newDocId = `${branchObj?.branchCode || "BR"}/${shortCode || "GEN"}/QUO/${lastNum + 1}`;
    }
  }
  return newDocId;
}

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    serachDocNo,
    searchDocDate,
    finYearId,
    searchCustomer,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const startTime = finYearDate?.startDateStartTime || finYearDate?.startTime;
  const endTime = finYearDate?.endDateEndTime || finYearDate?.endTime;
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(startTime, endTime)
    : "";

  let nextDocId = "";
  if (branchId) {
    nextDocId = await getNextDocId(branchId, shortCode, startTime, endTime);
  }

  let data = await prisma.rateQuotation.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND:
        startTime && endTime
          ? [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }]
          : undefined,
      docId: serachDocNo ? { contains: serachDocNo } : undefined,
      customer: searchCustomer
        ? { name: { contains: searchCustomer } }
        : undefined,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          contactPersonName: true,
          contactNumber: true,
        },
      },
      rateQuotationItems: {
        include: {
          ItemGroup: true,
          ItemSubGroup: true,
          StyleItem: true,
          Hsn: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });

  if (searchDocDate) {
    data = data?.filter((item) =>
      String(getDateFromDateTime(item.docDate)).includes(searchDocDate),
    );
  }

  const totalCount = data.length;

  if (pagination) {
    data = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return {
    statusCode: 0,
    data,
    nextDocId,
    totalCount,
  };
}

async function getOne(id) {
  const data = await prisma.rateQuotation.findUnique({
    where: { id: parseInt(id) },
    include: {
      rateQuotationItems: {
        include: {
          ItemGroup: true,
          ItemSubGroup: true,
          StyleItem: true,
          Hsn: true,
        },
      },
      customer: true,
    },
  });

  if (!data) return NoRecordFound("Rate Quotation");

  return {
    statusCode: 0,
    data,
  };
}

async function create(body) {
  const {
    userId,
    branchId,
    companyId,
    finYearId,
    docDate,
    userDate,
    customerId,
    rateQuotationItems,
  } = body;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const startTime = finYearDate?.startDateStartTime || finYearDate?.startTime;
  const endTime = finYearDate?.endDateEndTime || finYearDate?.endTime;
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(startTime, endTime)
    : "";

  let newDocId = await getNextDocId(branchId, shortCode, startTime, endTime);

  const rawItems = rateQuotationItems || "[]";
  const itemsArray =
    typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;

  const validItems = itemsArray.filter((item) => item.styleItemId);

  const data = await prisma.rateQuotation.create({
    data: {
      docId: newDocId,
      docDate: docDate ? new Date(docDate) : null,
      userDate: userDate ? new Date(userDate) : null,
      customerId: customerId ? parseInt(customerId) : null,

      createdById: userId ? parseInt(userId) : null,
      branchId: branchId ? parseInt(branchId) : null,
      companyId: companyId ? parseInt(companyId) : null,
      finYearId: finYearId ? parseInt(finYearId) : null,

      rateQuotationItems: {
        create: validItems.map((item) => ({
          itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
          itemSubGroupId: item?.itemSubGroupId
            ? parseInt(item?.itemSubGroupId)
            : null,
          styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
          hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
          price:
            item?.price !== undefined &&
            item?.price !== null &&
            item?.price !== ""
              ? parseFloat(item.price)
              : null,
          taxPercent:
            item?.taxPercent !== undefined &&
            item?.taxPercent !== null &&
            item?.taxPercent !== ""
              ? parseFloat(item.taxPercent)
              : null,
        })),
      },
    },
  });

  return { statusCode: 0, data };
}

async function update(id, body) {
  const {
    userId,
    branchId,
    companyId,
    finYearId,
    docDate,
    userDate,
    customerId,
    rateQuotationItems,
  } = body;

  const dataFound = await prisma.rateQuotation.findUnique({
    where: { id: parseInt(id) },
  });

  if (!dataFound) return NoRecordFound("Rate Quotation");

  const rawItems = rateQuotationItems || "[]";
  const itemsArray =
    typeof rawItems === "string" ? JSON.parse(rawItems) : rawItems;

  const validItems = itemsArray.filter((item) => item.styleItemId);

  const data = await prisma.rateQuotation.update({
    where: { id: parseInt(id) },
    data: {
      docDate: docDate ? new Date(docDate) : null,
      userDate: userDate ? new Date(userDate) : null,
      customerId: customerId ? parseInt(customerId) : null,
      updatedById: userId ? parseInt(userId) : null,
      ...(branchId && { branchId: parseInt(branchId) }),
      ...(companyId && { companyId: parseInt(companyId) }),
      ...(finYearId && { finYearId: parseInt(finYearId) }),

      rateQuotationItems: {
        deleteMany: {},
        create: validItems.map((item) => ({
          itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
          itemSubGroupId: item?.itemSubGroupId
            ? parseInt(item?.itemSubGroupId)
            : null,
          styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
          hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
          price:
            item?.price !== undefined &&
            item?.price !== null &&
            item?.price !== ""
              ? parseFloat(item.price)
              : null,
          taxPercent:
            item?.taxPercent !== undefined &&
            item?.taxPercent !== null &&
            item?.taxPercent !== ""
              ? parseFloat(item.taxPercent)
              : null,
        })),
      },
    },
  });

  return { statusCode: 0, data };
}

async function remove(id) {
  const dataFound = await prisma.rateQuotation.findUnique({
    where: { id: parseInt(id) },
  });

  if (!dataFound) return NoRecordFound("Rate Quotation");

  const data = await prisma.rateQuotation.delete({
    where: { id: parseInt(id) },
  });

  return { statusCode: 0, data };
}

export { get, getOne, create, update, remove };

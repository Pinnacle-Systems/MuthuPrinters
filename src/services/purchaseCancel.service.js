import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from "../configs/Responses.js";
import {
  exclude,
  getDateFromDateTime,
  getYearShortCodeForFinYear,
  getYearShortCode,
} from "../utils/helper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";


async function getNextDocId(
  branchId,
  shortCode,
  startTime,
  endTime,
  saveType,
  docId,
  isUpdate,
) {
  // Case 1: Draft save
  if (saveType) {
    return "Draft Save";
  } else if (isUpdate === "drift") {
    lastObject = await prisma.purchaseCancel.findFirst({
      where: {
        branchId: parseInt(branchId),
        draftSave: false,
        AND: [
          { createdAt: { gte: startTime } },
          { createdAt: { lte: endTime } },
        ],
      },
      orderBy: { id: "desc" },
    });
    const branchObj = await getTableRecordWithId(branchId, "branch");
    let newDocId = `${branchObj.branchCode}${getYearShortCode(
      new Date(),
    )}/PC/1`;

    if (lastObject) {
      newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PC/${
        parseInt(lastObject.docId.split("/").at(-1)) + 1
      }`;
    }

    return newDocId;
  } else {
    let lastObject = await prisma.purchaseCancel.findFirst({
      where: {
        branchId: parseInt(branchId),
        AND: [
          {
            createdAt: {
              gte: startTime,
            },
          },
          {
            createdAt: {
              lte: endTime,
            },
          },
        ],
      },
      orderBy: {
        id: "desc",
      },
    });

    const branchObj = await getTableRecordWithId(branchId, "branch");
    let newDocId = `${branchObj.branchCode}${getYearShortCode(
      new Date(),
    )}/PC/1`;
    if (lastObject) {
      if (lastObject.docId === "Draft Save") {
        const records = await prisma.purchaseCancel.findMany({
          select: {
            docId: true,
          },
          where: {
            branchId: parseInt(branchId),
            AND: [
              {
                createdAt: {
                  gte: startTime,
                },
              },
              {
                createdAt: {
                  lte: endTime,
                },
              },
            ],
          },
        });
        const maxDocId = records.reduce((max, current) => {
          const currentNo = Number(current.docId.split("/").pop());
          const maxNo = max ? Number(max.split("/").pop()) : 0;

          return currentNo > maxNo ? current.docId : max;
        }, null);
        newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PC/${
          parseInt(maxDocId.split("/").at(-1)) + 1
        }`;
      } else {
        newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PC/${
          parseInt(lastObject.docId.split("/").at(-1)) + 1
        }`;
      }
    }
    return newDocId;
  }
}

function manualFilterSearchData(searchDocDate, data) {
  return data.filter(
    (item) =>
      searchDocDate
        ? String(getDateFromDateTime(item.docDate)).includes(searchDocDate)
        : true,
    // (searchSupplierDcDate ? String(getDateFromDateTime(item.dueDate)).includes(searchSupplierDcDate) : true)
    // (searchPurchaseBillNo ?String(item.purchaseBillId).includes(searchPurchaseBillNo) : true)
  );
}

async function get(req) {
  const {
    branchId,
    active,
    pagination,
    pageNumber,
    dataPerPage,
    serachDocNo,
    searchDocDate,
    searchSupplier,
  } = req.query;
  let data = await prisma.purchaseCancel.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      active: active ? Boolean(active) : undefined,
      docId: Boolean(serachDocNo)
        ? {
            contains: serachDocNo,
          }
        : undefined,
      supplier: {
        name: Boolean(searchSupplier)
          ? { contains: searchSupplier }
          : undefined,
      },
    },
    include: {
      supplier: {
        select: {
          name: true,
        },
      },
    },
  });
  data = manualFilterSearchData(searchDocDate, data);
  const totalCount = data.length;

  if (pagination) {
    data = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * dataPerPage,
    );
  }
  let newDocId = await getNextDocId(branchId);
  return { statusCode: 0, nextDocId: newDocId, data };
}

async function getOne(id) {
  const childRecord = 0;
  const data = await prisma.purchaseCancel.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      purchaseCancelItems: true,
    },
  });
  if (!data) return NoRecordFound("purchaseReturn");
  const itemWithPoQty = await Promise.all(
    data.purchaseCancelItems.map(async (item) => {
      const poQty = await prisma.poItems.findFirst({
        where: {
          styleItemId: item.styleItemId,
          poId: item.poId,
          uomId: item.uomId,
          hsnId: item.hsnId,
        },
        select: {
          qty: true,
        },
      });
      const inwardItems = await prisma.inwardItems.findMany({
        where: {
          styleItemId: item.styleItemId,
          poId: item.poId,
          uomId: item.uomId,
          hsnId: item.hsnId,
        },
        select: {
          inwardQty: true,
          purchaseInwardId: true,
        },
      });
      const inwardQty = inwardItems.reduce(
        (sum, item) => sum + (item.inwardQty ?? 0),
        0,
      );
      const inwardIds = inwardItems
        .map((i) => i.purchaseInwardId)
        .filter(Boolean);
      let returnQty = 0;

      if (inwardIds.length > 0) {
        const returnAgg = await prisma.purchaseReturnItems.aggregate({
          where: {
            styleItemId: data.styleItemId,
            uomId: data.uomId,
            hsnId: data.hsnId,
            purchaseInwardId: { in: inwardIds },
          },
          _sum: { returnQty: true },
        });

        returnQty = returnAgg._sum.returnQty ?? 0;
      }
      
      return {
        ...item,
        poQty: poQty.qty,
        alreadyInwardQty: inwardQty,
        alreadyReturnQty: returnQty,
        balQtyCancel: poQty.qty - (inwardQty - returnQty),
      };
    }),
  );
  return {
    statusCode: 0,
    data: {
      ...data,
      purchaseCancelItems: itemWithPoQty,
      ...{ childRecord },
    },
  };
}

async function getSearch(req) {
  const { searchKey } = req.params;
  const { companyId, active } = req.query;
  const data = await prisma.purchaseReturn.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      active: active ? Boolean(active) : undefined,
      OR: [
        {
          name: {
            contains: searchKey,
          },
        },
      ],
    },
  });
  return { statusCode: 0, data: data };
}

async function create(body) {
  const {
    userId,
    branchId,
    storeId,
    docDate,
    supplierId,
    poType,
    remarks,
    termsAndCondition,
    cancelItems,
    finYearId,
    draftSave,
    locationId,
  } = await body;
  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(
        finYearDate?.startDateStartTime,
        finYearDate?.endDateEndTime,
      )
    : "";
  let newDocId = await getNextDocId(
    branchId,
    shortCode,
    finYearDate?.startDateStartTime,
    finYearDate?.endDateEndTime,
    draftSave,
  );
  let data;
  await prisma.$transaction(async (tx) => {
    data = await tx.purchaseCancel.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        createdById: parseInt(userId),
        branchId: parseInt(branchId),
        storeId: parseInt(storeId),
        supplierId: parseInt(supplierId),
        poType,
        remarks,
        termsAndCondition,
        locationId: parseInt(locationId),
      },
    });
    await createCancelItems(
      tx,
      cancelItems,
      data,
      userId,
      locationId,
      storeId,
      poType,
    );
  });
  return { statusCode: 0, data };
}

async function createCancelItems(
  tx,
  cancelItems,
  purchaseReturn,
  userId,
  locationId,
  storeId,
  poType,
) {
  const promises = cancelItems?.map(async (stockDetail, index) => {
    const createdItem = await tx.purchaseCancelItems.create({
      data: {
        purchaseCancelId: parseInt(purchaseReturn.id),
        styleItemId: stockDetail?.styleItemId
          ? parseInt(stockDetail.styleItemId)
          : null,
        uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
        hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
        cancelQty: stockDetail?.cancelQty
          ? parseInt(stockDetail.cancelQty)
          : null,
        poType: poType ? poType : "",
        poId: stockDetail?.poId ? parseInt(stockDetail.poId) : null,
        batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
        poDocId: stockDetail?.poDocId ? stockDetail?.poDocId : null,
      },
    });
    return createdItem;
  });

  return Promise.all(promises);
}

function findRemovedItems(dataFound, purchaseCancelItems) {
  let removedItems = dataFound.purchaseCancelItems.filter((oldItem) => {
    let result = purchaseCancelItems.find(
      (newItem) => parseInt(newItem.id) === parseInt(oldItem.id),
    );
    if (result) return false;
    return true;
  });
  return removedItems;
}

async function update(id, body) {
  const {
    userId,
    branchId,
    storeId,
    locationId,
    docDate,
    supplierId,
    poType,
    dcNo,
    dcDate,
    remarks,
    termsAndCondition,
    cancelItems,
  } = await body;
  let data;
  const dataFound = await prisma.purchaseCancel.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      purchaseCancelItems: {
        select: {
          id: true,
        },
      },
    },
  });
  if (!dataFound) return NoRecordFound("Purchase Return");

  let removedItems = findRemovedItems(dataFound, cancelItems);
  let removeItemsIds = removedItems.map((item) => parseInt(item.id));
  await prisma.$transaction(async (tx) => {
    // await deleteItemsFromStock(tx, removeItemsIds);
    if (removeItemsIds.length > 0) {
      await tx.purchaseCancelItems.deleteMany({
        where: { id: { in: removeItemsIds } },
      });
    }
    data = await tx.purchaseCancel.update({
      where: {
        id: parseInt(id),
      },
      data: {
        docDate: docDate ? new Date(docDate) : null,
        updatedById: parseInt(userId),
        storeId: parseInt(storeId),
        branchId: parseInt(branchId),
        locationId: parseInt(locationId),
        supplierId: parseInt(supplierId),
        poType,
        remarks,
        termsAndCondition,
      },
    });

    await updateCancelGoods(
      tx,
      cancelItems,
      data,
      userId,
      locationId,
      storeId,
      poType,
    );
  });
  return { statusCode: 0, data };
}

async function updateCancelGoods(
  tx,
  cancelItems,
  purchaseReturn,
  userId,
  locationId,
  storeId,
  poType,
) {
  const promises = cancelItems.map(async (stockDetail) => {
    if (stockDetail.id) {
      // Update existing purchaseReturnItem
      const updatedItem = await tx.purchaseCancelItems.update({
        where: { id: parseInt(stockDetail.id) },

        data: {
          purchaseCancelId: parseInt(purchaseReturn.id),
          styleItemId: stockDetail?.styleItemId
            ? parseInt(stockDetail.styleItemId)
            : null,
          uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
          hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
          cancelQty: stockDetail?.cancelQty
            ? parseInt(stockDetail.cancelQty)
            : null,
          poType: poType ? poType : "",
          poId: stockDetail?.poId ? parseInt(stockDetail.poId) : null,
          batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
          poDocId: stockDetail?.poDocId ? stockDetail?.poDocId : null,
        },
      });

      return updatedItem;
    } else {
      // Create new purchaseReturnItem
      const createdItem = await tx.purchaseCancelItems.create({
        data: {
          purchaseCancelId: parseInt(purchaseReturn.id),
          styleItemId: stockDetail?.styleItemId
            ? parseInt(stockDetail.styleItemId)
            : null,
          uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
          hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
          cancelQty: stockDetail?.cancelQty
            ? parseInt(stockDetail.cancelQty)
            : null,
          poType: poType ? poType : "",
          poId: stockDetail?.poId ? parseInt(stockDetail.poId) : null,
          batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
          poDocId: stockDetail?.poDocId ? stockDetail?.poDocId : null,
        },
      });

      return createdItem;
    }
  });

  return Promise.all(promises);
}

async function remove(id) {
  const data = await prisma.purchaseCancel.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

export { get, getOne, getSearch, create, update, remove };

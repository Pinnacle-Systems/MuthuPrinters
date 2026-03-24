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
    lastObject = await prisma.purchaseInwardReturn.findFirst({
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
    )}/PR/1`;

    if (lastObject) {
      newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PR/${
        parseInt(lastObject.docId.split("/").at(-1)) + 1
      }`;
    }

    return newDocId;
  } else {
    let lastObject = await prisma.purchaseInwardReturn.findFirst({
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
    )}/PR/1`;
    if (lastObject) {
      if (lastObject.docId === "Draft Save") {
        const records = await prisma.purchaseInwardReturn.findMany({
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
        newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PR/${
          parseInt(maxDocId.split("/").at(-1)) + 1
        }`;
      } else {
        newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PR/${
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
  let data = await prisma.purchaseInwardReturn.findMany({
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
    orderBy: {
      docId: "desc",
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
  const data = await prisma.purchaseInwardReturn.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      purchaseReturnItems: true,
    },
  });
  if (!data) return NoRecordFound("purchaseReturn");
  const itemWithPoQty = await Promise.all(
    data.purchaseReturnItems.map(async (item) => {
      const poQty = await prisma.poItems.findFirst({
        where: {
          styleItemId: item.styleItemId,
          poId: item.poId,
          uomId: item.uomId,
          hsnId: item.hsnId,
          itemGroupId: item.itemGroupId,
          sizeId: item.sizeId,
          colorId: item.colorId,
        },
        select: {
          qty: true,
        },
      });
      const returnItems = await prisma.purchaseReturnItems.findMany({
        where: {
          styleItemId: item.styleItemId,
          purchaseInwardId: item.purchaseInwardId,
          uomId: item.uomId,
          hsnId: item.hsnId,
        },
        select: {
          returnQty: true,
        },
      });

      const returnQty = returnItems.reduce(
        (sum, item) => sum + (item.returnQty ?? 0),
        0,
      );
      const inwardQty = await prisma.inwardItems.findFirst({
        where: {
          purchaseInwardId: item.purchaseInwardId,
          styleItemId: item.styleItemId,
          uomId: item.uomId,
          hsnId: item.hsnId,
          invNo: item.invNo,
        },
        select: {
          inwardQty: true,
        },
      });
      const inwardAgg = await prisma.inwardItems.aggregate({
        where: {
          styleItemId: item.styleItemId,
          purchaseInwardId: item.purchaseInwardId,
          uomId: item.uomId,
          hsnId: item.hsnId,
          itemGroupId: item.itemGroupId,
          sizeId: item.sizeId,
          colorId: item.colorId,
        },
        _sum: { inwardQty: true },
      });
      const alreadyInwardQty = inwardAgg?._sum?.inwardQty ?? 0;
      const returnAgg = await prisma.purchaseReturnItems.aggregate({
        where: {
          styleItemId: item.styleItemId,
          purchaseInwardId: item.purchaseInwardId,
          uomId: item.uomId,
          hsnId: item.hsnId,
          itemGroupId: item.itemGroupId,
          sizeId: item.sizeId,
          colorId: item.colorId,
          purchaseInwardReturnId: { not: data.id },
        },
        _sum: { returnQty: true },
      });
      const alreadyReturnQty = returnAgg?._sum?.returnQty ?? 0;
      return {
        ...item,
        // balQty: inwardQty?.inwardQty - returnQty + item.returnQty,
        balQty: alreadyInwardQty - alreadyReturnQty,
        poQty: poQty?.qty,
        inwardQty: alreadyInwardQty,
        alreadyReturnQty: alreadyReturnQty,
      };
    }),
  );
  return {
    statusCode: 0,
    data: {
      ...data,
      purchaseReturnItems: itemWithPoQty,
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
    returnType,
    dcNo,
    dcDate,
    remarks,
    termsAndCondition,
    returnItems,
    finYearId,
    draftSave,
    locationId,
    invNo,
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
    data = await tx.purchaseInwardReturn.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        createdById: parseInt(userId),
        branchId: parseInt(branchId),
        storeId: parseInt(storeId),
        supplierId: parseInt(supplierId),
        returnType,
        dcNo,
        dcDate: dcDate ? new Date(dcDate) : null,
        remarks,
        termsAndCondition,
        locationId: parseInt(locationId),
        invNo,
      },
    });
    await createReturnItems(
      tx,
      returnItems,
      data,
      userId,
      locationId,
      storeId,
      returnType,
      invNo,
    );
  });
  return { statusCode: 0, data };
}

async function createReturnItems(
  tx,
  returnItems,
  purchaseReturn,
  userId,
  locationId,
  storeId,
  returnType,
  invNo,
) {
  const promises = returnItems?.map(async (stockDetail, index) => {
    const createdItem = await tx.purchaseReturnItems.create({
      data: {
        purchaseInwardReturnId: parseInt(purchaseReturn.id),
        styleItemId: stockDetail?.styleItemId
          ? parseInt(stockDetail.styleItemId)
          : null,
        uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
        hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
        returnQty: stockDetail?.returnQty
          ? parseInt(stockDetail.returnQty)
          : null,
        returnType: returnType ? returnType : "",
        purchaseInwardId: stockDetail?.purchaseInwardId
          ? parseInt(stockDetail.purchaseInwardId)
          : null,
        invNo: invNo ? invNo : null,
        batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
        itemGroupId: stockDetail?.itemGroupId
          ? parseInt(stockDetail.itemGroupId)
          : null,
        sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
        colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
      },
    });
    await tx.stock.create({
      data: {
        inOrOut: "Out",
        processName: "Purchase Return",
        createdById: parseInt(userId),
        branchId: parseInt(locationId),
        storeId: parseInt(storeId),
        purchaseReturnItemsId: createdItem.id,
        styleItemId: stockDetail?.styleItemId
          ? parseInt(stockDetail.styleItemId)
          : null,
        uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
        hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
        qty:
          stockDetail?.returnQty && !isNaN(parseFloat(stockDetail.returnQty))
            ? -Math.abs(parseInt(stockDetail.returnQty))
            : null,
        // returnType: returnType ? returnType : "",
        invNo: invNo ? invNo : null,
        batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
        itemGroupId: stockDetail?.itemGroupId
          ? parseInt(stockDetail.itemGroupId)
          : null,
        sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
        colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
      },
    });
    return createdItem;
  });

  return Promise.all(promises);
}

function findRemovedItems(dataFound, purchaseReturnItems) {
  let removedItems = dataFound.purchaseReturnItems.filter((oldItem) => {
    let result = purchaseReturnItems.find(
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
    returnType,
    invNo,
    dcNo,
    dcDate,
    remarks,
    termsAndCondition,
    returnItems,
  } = await body;
  let data;
  const dataFound = await prisma.purchaseInwardReturn.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      purchaseReturnItems: {
        select: {
          id: true,
        },
      },
    },
  });
  if (!dataFound) return NoRecordFound("Purchase Return");

  let removedItems = findRemovedItems(dataFound, returnItems);
  let removeItemsIds = removedItems.map((item) => parseInt(item.id));
  await prisma.$transaction(async (tx) => {
    // await deleteItemsFromStock(tx, removeItemsIds);
    if (removeItemsIds.length > 0) {
      await tx.purchaseReturnItems.deleteMany({
        where: { id: { in: removeItemsIds } },
      });
    }
    data = await tx.purchaseInwardReturn.update({
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
        returnType,
        invNo,
        dcNo,
        dcDate: dcDate ? new Date(dcDate) : null,
        remarks,
        termsAndCondition,
      },
    });

    await updateReturnGoods(
      tx,
      returnItems,
      data,
      userId,
      locationId,
      storeId,
      returnType,
      invNo,
    );
  });
  return { statusCode: 0, data };
}

async function updateReturnGoods(
  tx,
  returnItems,
  purchaseReturn,
  userId,
  locationId,
  storeId,
  returnType,
  invNo,
) {
  const promises = returnItems.map(async (stockDetail) => {
    if (stockDetail.id) {
      // Update existing purchaseReturnItem
      const updatedItem = await tx.purchaseReturnItems.update({
        where: { id: parseInt(stockDetail.id) },

        data: {
          purchaseInwardReturnId: parseInt(purchaseReturn.id),
          styleItemId: stockDetail?.styleItemId
            ? parseInt(stockDetail.styleItemId)
            : null,
          uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
          hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
          returnQty: stockDetail?.returnQty
            ? parseInt(stockDetail.returnQty)
            : null,
          returnType: returnType ? returnType : "",
          purchaseInwardId: stockDetail?.purchaseInwardId
            ? parseInt(stockDetail.purchaseInwardId)
            : null,
          invNo: invNo ? invNo : null,
          batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
          itemGroupId: stockDetail?.itemGroupId
            ? parseInt(stockDetail.itemGroupId)
            : null,
          sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
          colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
        },
      });

      // Update or create Stock row
      const existingStock = await tx.stock.findFirst({
        where: { purchaseReturnItemsId: updatedItem.id },
      });

      if (existingStock) {
        await tx.stock.update({
          where: { id: existingStock.id },
          data: {
            updatedById: parseInt(userId),
            branchId: parseInt(locationId),
            storeId: parseInt(storeId),
            styleItemId: stockDetail?.styleItemId
              ? parseInt(stockDetail.styleItemId)
              : null,
            uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
            hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
            qty:
              stockDetail?.returnQty &&
              !isNaN(parseFloat(stockDetail.returnQty))
                ? -Math.abs(parseInt(stockDetail.returnQty))
                : null,
            // returnType: returnType ? returnType : "",
            invNo: invNo ? invNo : null,
            batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
            itemGroupId: stockDetail?.itemGroupId
              ? parseInt(stockDetail.itemGroupId)
              : null,
            sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
            colorId: stockDetail?.colorId
              ? parseInt(stockDetail.colorId)
              : null,
          },
        });
      } else {
        await tx.stock.create({
          data: {
            inOrOut: "Out",
            processName: "Purchase Return",
            createdById: parseInt(userId),
            branchId: parseInt(locationId),
            storeId: parseInt(storeId),
            purchaseReturnItemsId: createdItem.id,
            styleItemId: stockDetail?.styleItemId
              ? parseInt(stockDetail.styleItemId)
              : null,
            uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
            hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
            qty:
              stockDetail?.returnQty &&
              !isNaN(parseFloat(stockDetail.returnQty))
                ? -Math.abs(parseInt(stockDetail.returnQty))
                : null,
            // returnType: returnType ? returnType : "",
            invNo: invNo ? invNo : null,
            batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
            itemGroupId: stockDetail?.itemGroupId
              ? parseInt(stockDetail.itemGroupId)
              : null,
            sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
            colorId: stockDetail?.colorId
              ? parseInt(stockDetail.colorId)
              : null,
          },
        });
      }

      return updatedItem;
    } else {
      // Create new purchaseReturnItem
      const createdItem = await tx.purchaseReturnItems.create({
        data: {
          purchaseInwardReturnId: parseInt(purchaseReturn.id),
          styleItemId: stockDetail?.styleItemId
            ? parseInt(stockDetail.styleItemId)
            : null,
          uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
          hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
          returnQty: stockDetail?.returnQty
            ? parseInt(stockDetail.returnQty)
            : null,
          returnType: returnType ? returnType : "",
          purchaseInwardId: stockDetail?.purchaseInwardId
            ? parseInt(stockDetail.purchaseInwardId)
            : null,
          invNo: invNo ? invNo : null,
          batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
          itemGroupId: stockDetail?.itemGroupId
            ? parseInt(stockDetail.itemGroupId)
            : null,
          sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
          colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
        },
      });

      // Create Stock row
      await tx.stock.create({
        data: {
          inOrOut: "Out",
          processName: "Purchase Return",
          createdById: parseInt(userId),
          branchId: parseInt(locationId),
          storeId: parseInt(storeId),
          purchaseReturnItemsId: createdItem.id,
          styleItemId: stockDetail?.styleItemId
            ? parseInt(stockDetail.styleItemId)
            : null,
          uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
          hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
          qty:
            stockDetail?.returnQty && !isNaN(parseFloat(stockDetail.returnQty))
              ? -Math.abs(parseInt(stockDetail.returnQty))
              : null,
          // returnType: returnType ? returnType : "",
          invNo: invNo ? invNo : null,
          batchNo: stockDetail?.batchNo ? stockDetail?.batchNo : null,
          itemGroupId: stockDetail?.itemGroupId
            ? parseInt(stockDetail.itemGroupId)
            : null,
          sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
          colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
        },
      });

      return createdItem;
    }
  });

  return Promise.all(promises);
}

async function remove(id) {
  const data = await prisma.purchaseInwardReturn.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

export { get, getOne, getSearch, create, update, remove };

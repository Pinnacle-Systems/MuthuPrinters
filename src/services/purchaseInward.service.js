import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getYearShortCode,
  getDateFromDateTime,
  buildDateRange,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";

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
    lastObject = await prisma.purchaseInward.findFirst({
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
    )}/PI/1`;

    if (lastObject) {
      newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PI/${
        parseInt(lastObject.docId.split("/").at(-1)) + 1
      }`;
    }

    return newDocId;
  } else {
    let lastObject = await prisma.purchaseInward.findFirst({
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
    let newDocId = `${branchObj.branchCode}/${shortCode}/PI/1`;
    if (lastObject) {
      if (lastObject.docId === "Draft Save") {
        const records = await prisma.purchaseInward.findMany({
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
        newDocId = `${branchObj.branchCode}/${shortCode}/PI/${
          parseInt(maxDocId.split("/").at(-1)) + 1
        }`;
      } else {
        newDocId = `${branchObj.branchCode}/${shortCode}/PI/${
          parseInt(lastObject.docId.split("/").at(-1)) + 1
        }`;
      }
    }
    return newDocId;
  }
}

function getPurchaseInwardStatus(inward) {
  if (inward.receiptType === "Against Invoice") {
    if (inward.inwardType !== "Direct Inward") {
      let isFullyReceived = true;
      let isPartiallyReceived = false;

      (inward.inwardItems || []).forEach((item) => {
        const poQty = item.poQty || 0;
        const inwardQty = item.inwardQty || 0;

        if (inwardQty < poQty) {
          isFullyReceived = false;
        }

        if (inwardQty > 0 && inwardQty < poQty) {
          isPartiallyReceived = true;
        }
      });

      if (isFullyReceived) return "Fully Billed"; // or Fully Received
      if (isPartiallyReceived) return "Partially Billed";

      return "Not Billed";
    }

    if (inward.inwardType === "Direct Inward") {
      return "Fully Billed";
    }
  } else {
    // 🔥 NORMAL LOGIC
    const inwardItems = inward.inwardItems || [];
    const returnItems = inward.purchaseReturnItems || [];
    const billItems = inward.purchaseBillEntryItems || [];

    const totalInwardQty = inwardItems.reduce(
      (sum, item) => sum + (item.inwardQty || 0),
      0,
    );

    const totalReturnQty = returnItems.reduce(
      (sum, item) => sum + (item.returnQty || 0),
      0,
    );

    const totalBilledQty = billItems.reduce(
      (sum, item) => sum + (item.inwardQty || 0),
      0,
    );

    if (totalInwardQty === 0) return "Pending";

    if (totalReturnQty >= totalInwardQty) return "Fully Returned";

    if (totalBilledQty >= totalInwardQty) return "Fully Billed";

    if (totalBilledQty > 0 && totalReturnQty > 0)
      return "Partially Billed & Returned";

    if (totalBilledQty > 0) return "Partially Billed";

    if (totalReturnQty > 0) return "Partially Returned";

    return "Not Billed";
  }
}

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    serachDocNo,
    searchDocDate,
    searchStore,
    searchInwardType,
    finYearId,
    searchSupplier,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(finYearDate?.startTime, finYearDate?.endTime)
    : "";
  let newDocId = await getNextDocId(
    branchId,
    shortCode,
    finYearDate?.startDateStartTime,
    finYearDate?.endDateEndTime,
  );
  let data;
  let totalCount;
  data = await prisma.purchaseInward.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
            {
              createdAt: {
                gte: finYearDate.startTime,
              },
            },
            {
              createdAt: {
                lte: finYearDate.endTime,
              },
            },
          ]
        : undefined,
      docId: Boolean(serachDocNo)
        ? {
            contains: serachDocNo,
          }
        : undefined,
      inwardType: Boolean(searchInwardType)
        ? { contains: searchInwardType }
        : undefined,
      Store: {
        storeName: searchStore ? { contains: searchStore } : undefined,
      },
      supplier: {
        name: searchSupplier ? { contains: searchSupplier } : undefined,
      },
    },
    include: {
      Store: {
        select: {
          id: true,
          storeName: true,
        },
      },
      inwardItems: {
        include: {
          Po: {
            include: {
              poItems: true,
              quoteVersions: true,
            },
          },
        },
      },
      purchaseReturnItems: {
        select: {
          returnQty: true,
        },
      },
      purchaseBillEntryItems: {
        select: {
          inwardQty: true,
        },
      },
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          purchaseReturnItems: true,
          purchaseBillEntryItems: true,
        },
      },
    },
    orderBy: {
      docId: "desc",
    },
  });
  totalCount = data.length;
  if (searchDocDate) {
    data = data?.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
    );
  }
  if (pagination) {
    data = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * dataPerPage,
    );
  }
  return {
    statusCode: 0,
    data: data.map((item) => ({
      ...item,
      status: getPurchaseInwardStatus(item),
      childRecord:
        item._count?.purchaseReturnItems + item._count?.purchaseBillEntryItems,
    })),
    nextDocId: newDocId,
    totalCount,
  };
}
// function manualFilterSearchDataPIItems(
//   searchPoDate,
//   searchDueDate,
//   searchInwardType,
//   data,
// ) {
//   const inwardTypeKey = searchInwardType
//     ? searchInwardType.split(" ")[0].toUpperCase()
//     : "";
//   return data.filter(
//     (item) =>
//       (searchPoDate
//         ? String(getDateFromDateTime(item.Po.docDate)).includes(searchPoDate)
//         : true) &&
//       (searchDueDate
//         ? String(getDateFromDateTime(item.Po.dueDate)).includes(searchDueDate)
//         : true) &&
//       (inwardTypeKey ? item.Po.poType.toUpperCase() === inwardTypeKey : true),
//   );
// }
async function getOne(id) {
  const data = await prisma.purchaseInward.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      Store: {
        select: {
          locationId: true,
          storeName: true,
        },
      },
      Branch: {
        select: {
          branchName: true,
        },
      },
      supplier: {
        select: {
          name: true,
        },
      },
      inwardItems: {
        include: {
          Po: {
            select: {
              docId: true,
            },
          },
        },
      },
    },
  });
  if (!data) return NoRecordFound("Purchase Inward");
  const itemsWithQty = await Promise.all(
    data.inwardItems.map(async (item) => {
      const cancelAgg = await prisma.purchaseCancelItems.aggregate({
        where: {
          styleItemId: item.styleItemId,
          poId: item.poId,
          uomId: item.uomId,
          hsnId: item.hsnId,
          itemGroupId: item.itemGroupId,
          sizeId: item.sizeId,
          colorId: item.colorId,
          gsmId: item.gsmId,
        },
        _sum: {
          cancelQty: true,
        },
      });
      const alreadyCancelQty = cancelAgg?._sum?.cancelQty ?? 0;

      const inwardAgg = await prisma.inwardItems.aggregate({
        where: {
          styleItemId: item.styleItemId,
          poId: item.poId,
          uomId: item.uomId,
          hsnId: item.hsnId,
          itemGroupId: item.itemGroupId,
          sizeId: item.sizeId,
          colorId: item.colorId,
          purchaseInwardId: { not: data.id },
          gsmId: item.gsmId,
        },
        _sum: { inwardQty: true },
      });

      const alreadyInwardQty = inwardAgg?._sum?.inwardQty ?? 0;

      const returnAgg = await prisma.purchaseReturnItems.aggregate({
        where: {
          styleItemId: item.styleItemId,
          uomId: item.uomId,
          hsnId: item.hsnId,
          itemGroupId: item.itemGroupId,
          sizeId: item.sizeId,
          colorId: item.colorId,
          purchaseInwardId: data.id,
          gsmId: item.gsmId,
        },
        _sum: { returnQty: true },
      });

      const alreadyReturnQty = returnAgg?._sum?.returnQty ?? 0;

      return {
        ...item,
        alreadyCancelQty,
        alreadyInwardQty,
        alreadyReturnQty,
        balQty: item.poQty - (alreadyInwardQty + alreadyCancelQty),
      };
    }),
  );
  const childRecordReturn = await prisma.purchaseReturnItems.count({
    where: {
      purchaseInwardId: data.id,
    },
  });
  const childRecordBill = await prisma.purchaseBillEntryItems.count({
    where: {
      purchaseInwardId: data.id,
    },
  });
  return {
    statusCode: 0,
    data: {
      ...data,
      inwardItems: itemsWithQty,
      childRecord: childRecordReturn,
      childRecordBill: childRecordBill,
    },
  };
}
async function getOneBillEntry(req) {
  const { supplierId, dcNo } = req.query;

  console.log(supplierId, "supplierIdreceived");

  const data = await prisma.purchaseInward.findMany({
    where: {
      supplierId: parseInt(supplierId),
    },
    include: {
      Store: {
        select: {
          locationId: true,
          storeName: true,
        },
      },
      Branch: {
        select: {
          branchName: true,
        },
      },
      supplier: {
        select: {
          name: true,
        },
      },
      inwardItems: {
        include: {
          Hsn: true,
          StyleItem: true,
          Uom: true,
        },
      },
    },
  });
  if (!data) return NoRecordFound("Purchase Inward");

  return {
    statusCode: 0,
    data: {
      ...data,
    },
  };
}
async function getAllDataPoItems(data) {
  const results = await Promise.all(
    data?.map(async (item) => {
      const res = await getPoItemById(item.id);
      return res.data;
    }),
  );

  // ✅ filter here
  return results.filter((item) => item.balQty > 0);
}
async function getPoItemById(id) {
  const data = await prisma.inwardItems.findUnique({
    where: { id: parseInt(id) },
    include: {
      Po: { select: { docId: true, dueDate: true, docDate: true } },
      Uom: { select: { name: true } },
      StyleItem: { select: { name: true } },
      Hsn: { select: { name: true } },
    },
  });

  if (!data) return NoRecordFound("Purchase Order");
  // 1️⃣ All inward rows
  const inwardItems = await prisma.inwardItems.findMany({
    where: {
      styleItemId: data.styleItemId,
      poId: data.poId,
      uomId: data.uomId,
      hsnId: data.hsnId,
    },
    select: {
      purchaseInwardId: true,
      inwardQty: true,
    },
  });

  const inwardQty = inwardItems.reduce(
    (sum, item) => sum + (item.inwardQty ?? 0),
    0,
  );
  const cancelItems = await prisma.purchaseCancelItems.findMany({
    where: {
      styleItemId: data.styleItemId,
      poId: data.poId,
      uomId: data.uomId,
      hsnId: data.hsnId,
    },
    select: {
      cancelQty: true,
    },
  });

  const cancelQty = cancelItems.reduce(
    (sum, item) => sum + (item.cancelQty ?? 0),
    0,
  );

  const inwardIds = inwardItems.map((i) => i.purchaseInwardId).filter(Boolean);

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
    statusCode: 0,
    data: {
      ...data,
      poQty: data.qty,
      cancelQty,
      alreadyInwardQty: inwardQty,
      alreadyReturnQty: returnQty,
      balQty: data.qty - (inwardQty + cancelQty),
      balQtyCancel: data.qty - (inwardQty - returnQty),
    },
  };
}
async function getPurchaseInwardBillEntryItems(req) {
  const {
    branchId,
    active,
    supplierId,
    searchInvNo,
    pagination,
    dataPerPage,
    searchDocId,
    searchPIDate,
    searchInwardType,
    searchDcNo,
    billType,
  } = req.query;
  // const docDateFilter = buildDateRange(searchPIDate);

  let data;
  let totalCount;

  if (pagination) {
    // ✅ Step 1: Get all InwardItem IDs already referenced in PurchaseBillEntryItems
    const alreadyBilledItems = await prisma.purchaseBillEntryItems.findMany({
      where: {
        purchaseInwardId: { not: null },
      },
      select: {
        purchaseInwardId: true,
        styleItemId: true,
        sizeId: true,
        colorId: true,
        gsmId: true,
      },
    });

    // ✅ Step 2: Extract the inwardItem IDs to exclude
    // Since PurchaseBillEntryItems links to PurchaseInward (not InwardItems directly),
    // we need to get the actual InwardItems IDs that are billed
    const billedInwardItemIds = await prisma.purchaseBillEntryItems.findMany({
      where: {
        purchaseInwardId: { not: null },
      },
      select: {
        docId: true,
        styleItemId: true,
        sizeId: true,
        colorId: true,
        gsmId: true,
        purchaseInwardId: true,
      },
    });

    // Build a set of composite keys to exclude: purchaseInwardId + styleItemId + sizeId
    const billedKeys = new Set(
      billedInwardItemIds.map(
        (b) =>
          `${b.purchaseInwardId}_${b.styleItemId}_${b.sizeId}_${b.colorId}_${b.gsmId}`,
      ),
    );

    // ✅ Step 3: Fetch inward items normally
    data = await prisma.inwardItems.findMany({
      where: {
        PurchaseInward: {
          docId: Boolean(searchDocId) ? { contains: searchDocId } : undefined,
          invNo: searchInvNo ? { contains: searchInvNo } : undefined,
          dcNo: Boolean(searchDcNo) ? { contains: searchDcNo } : undefined,
          // docDate: docDateFilter,
          AND: [
            {
              OR: [
                { receiptType: { not: "Against Invoice" } },
                { receiptType: null },
                { receiptType: "" },
              ],
            },
          ],
          supplierId: supplierId ? parseInt(supplierId) : undefined,
          inwardType: billType ? { contains: billType } : undefined,
        },
      },
      include: {
        PurchaseInward: {
          select: {
            supplierId: true,
            docDate: true,
            docId: true,
            invNo: true,
            dcNo: true,
            id: true,
          },
        },
        Hsn: { select: { name: true, tax: true } },
        StyleItem: { select: { name: true } },
        Uom: { select: { name: true } },
        Size: { select: { name: true } },
        Color: { select: { name: true } },
        Gsm: { select: { name: true } },
      },
    });
    data = manualFilterSearchDataPIItems(searchPIDate, data);

    // ✅ Step 4: Filter out already-billed items using composite key match
    data = data.filter((item) => {
      const key = `${item.purchaseInwardId}_${item.styleItemId}_${item.sizeId}_${item.colorId}_${item.gsmId}`;
      return !billedKeys.has(key);
    });

    // Filter by supplierId
    data = data.filter((i) => i.PurchaseInward?.supplierId == supplierId);
  } else {
    data = await prisma.inwardItems.findMany({
      where: {
        branchId: branchId ? parseInt(branchId) : undefined,
        active: active ? Boolean(active) : undefined,
      },
    });
  }

  return { statusCode: 0, data, totalCount };
}

function manualFilterSearchDataPIItems(searchPIDate, data) {
  return data.filter((item) =>
    searchPIDate
      ? String(getDateFromDateTime(item.PurchaseInward?.docDate)).includes(
          searchPIDate,
        )
      : true,
  );
}

async function create(req) {
  const {
    userId,
    branchId,
    storeId,
    docDate,
    supplierId,
    inwardType,
    dcNo,
    dcDate,
    remarks,
    vehicleNo,
    inwardItems,
    finYearId,
    draftSave,
    locationId,
    invNo,
    receiptType,
    taxTemplateId,
    discountType,
    discountValue,
    netBillValue,
  } = await req.body;
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
    data = await tx.purchaseInward.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        createdById: parseInt(userId),
        branchId: parseInt(branchId),
        storeId: parseInt(storeId),
        supplierId: parseInt(supplierId),
        inwardType,
        dcNo,
        dcDate: dcDate ? new Date(dcDate) : null,
        remarks,
        vehicleNo,
        locationId: parseInt(locationId),
        invNo,
        receiptType,
        taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : null,
        netBillValue: netBillValue ? parseFloat(netBillValue) : null,
      },
    });
    await createInwardItems(
      tx,
      inwardItems,
      data,
      userId,
      locationId,
      storeId,
      inwardType,
      invNo,
      dcNo,
    );
    if (receiptType === "Against Invoice") {
      await tx.purchaseLedger.create({
        data: {
          docId: newDocId ?? "",
          docDate: docDate ? new Date(docDate) : null,
          supplierId: parseInt(supplierId) ?? undefined,
          remarks: remarks ?? "",
          netBillValue: parseFloat(netBillValue) ?? null,
          purchaseInwardId: parseInt(data.id) ?? undefined,
        },
      });
    }
  });
  return { statusCode: 0, data };
}

async function createInwardItems(
  tx,
  inwardItems,
  purchaseInward,
  userId,
  locationId,
  storeId,
  inwardType,
  invNo,
  dcNo,
) {
  const promises = inwardItems?.map(async (stockDetail, index) => {
    const createdItem = await tx.inwardItems.create({
      data: {
        purchaseInwardId: parseInt(purchaseInward.id),
        styleItemId: stockDetail?.styleItemId
          ? parseInt(stockDetail.styleItemId)
          : null,
        uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
        hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
        poQty: stockDetail?.poQty ? parseInt(stockDetail.poQty) : null,
        inwardQty: stockDetail?.inwardQty
          ? parseInt(stockDetail.inwardQty)
          : null,
        inwardType: inwardType ? inwardType : "",
        poId: stockDetail?.poId ? parseInt(stockDetail.poId) : null,
        invNo: invNo ? invNo : null,
        price: stockDetail?.price ? parseInt(stockDetail.price) : null,
        itemGroupId: stockDetail?.itemGroupId
          ? parseInt(stockDetail.itemGroupId)
          : null,
        sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
        colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
        dcNo: dcNo ? dcNo : null,
        discountType: stockDetail?.discountType ?? undefined,
        discountValue: stockDetail?.discountValue
          ? parseInt(stockDetail.discountValue)
          : null,
        taxPercent: stockDetail?.taxPercent
          ? parseInt(stockDetail.taxPercent)
          : null,
        gsmId: stockDetail?.gsmId ? parseInt(stockDetail.gsmId) : null,
      },
    });
    await tx.stock.create({
      data: {
        inOrOut: "In",
        processName: "Purchase Inward",
        createdById: parseInt(userId),
        branchId: parseInt(locationId),
        storeId: parseInt(storeId),
        inwardItemsId: createdItem.id,
        styleItemId: stockDetail?.styleItemId
          ? parseInt(stockDetail.styleItemId)
          : null,
        uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
        hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
        qty: stockDetail?.inwardQty ? parseInt(stockDetail.inwardQty) : null,
        inwardType: inwardType ? inwardType : "",
        invNo: invNo ? invNo : null,
        itemGroupId: stockDetail?.itemGroupId
          ? parseInt(stockDetail.itemGroupId)
          : null,
        sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
        colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
        gsmId: stockDetail?.gsmId ? parseInt(stockDetail.gsmId) : null,
      },
    });
    return createdItem;
  });

  return Promise.all(promises);
}

function findRemovedItems(dataFound, fabricInwardItems) {
  let removedItems = dataFound.fabricInwardItems.filter((oldItem) => {
    let result = JSON.parse(fabricInwardItems).find(
      (newItem) => parseInt(newItem.id) === parseInt(oldItem.id),
    );
    if (result) return false;
    return true;
  });
  return removedItems;
}

function findRemovedItemsGoods(dataFound, inwardItems) {
  let removedItems = dataFound.inwardItems.filter((oldItem) => {
    let result = inwardItems.find(
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
    inwardType,
    dcNo,
    dcDate,
    remarks,
    vehicleNo,
    inwardItems,
    finYearId,
    invNo,
    receiptType,
    taxTemplateId,
    discountType,
    discountValue,
    netBillValue,
  } = await body;
  let data;
  const dataFound = await prisma.purchaseInward.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      inwardItems: {
        select: {
          id: true,
        },
      },
    },
  });
  if (!dataFound) return NoRecordFound("Purchase Inward");
  let removedItemsGoods = findRemovedItemsGoods(dataFound, inwardItems);
  let removeItemsGoodsIds = removedItemsGoods.map((item) => parseInt(item.id));
  await prisma.$transaction(async (tx) => {
    if (removeItemsGoodsIds.length > 0) {
      await tx.inwardItems.deleteMany({
        where: { id: { in: removeItemsGoodsIds } },
      });
    }
    data = await tx.purchaseInward.update({
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
        inwardType,
        dcNo,
        dcDate: dcDate ? new Date(dcDate) : null,
        remarks,
        vehicleNo,
        locationId: parseInt(locationId),
        invNo,
        receiptType,
        taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : null,
        netBillValue: netBillValue ? parseFloat(netBillValue) : null,
      },
    });
    await updateinwardItems(
      tx,
      inwardItems,
      data,
      userId,
      locationId,
      storeId,
      inwardType,
      invNo,
      dcNo,
    );
    if (receiptType === "Against Invoice") {
      const ledger = await tx.purchaseLedger.findFirst({
        where: {
          purchaseInwardId: parseInt(data.id),
        },
      });

      if (ledger) {
        await tx.purchaseLedger.update({
          where: { id: ledger.id },
          data: {
            docDate: docDate ? new Date(docDate) : null,
            supplierId: parseInt(supplierId) ?? undefined,
            remarks: remarks ?? "",
            netBillValue: parseFloat(netBillValue) ?? null,
          },
        });
      }
    }
  });
  return { statusCode: 0, data };
}

async function updateinwardItems(
  tx,
  inwardItems,
  purchaseInward,
  userId,
  locationId,
  storeId,
  inwardType,
  invNo,
  dcNo,
) {
  const promises = inwardItems?.map(async (stockDetail) => {
    if (stockDetail.id) {
      // Update existing OpeningStockItem
      const updatedItem = await tx.inwardItems.update({
        where: { id: parseInt(stockDetail.id) },
        data: {
          purchaseInwardId: parseInt(purchaseInward.id),
          styleItemId: stockDetail?.styleItemId
            ? parseInt(stockDetail.styleItemId)
            : null,
          uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
          hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
          poQty: stockDetail?.poQty ? parseInt(stockDetail.poQty) : null,
          inwardQty: stockDetail?.inwardQty
            ? parseInt(stockDetail.inwardQty)
            : null,
          inwardType: inwardType ? inwardType : "",
          poId: stockDetail?.poId ? parseInt(stockDetail.poId) : null,
          invNo: invNo ? invNo : null,
          price: stockDetail?.price ? parseInt(stockDetail.price) : null,
          itemGroupId: stockDetail?.itemGroupId
            ? parseInt(stockDetail.itemGroupId)
            : null,
          sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
          colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
          dcNo: dcNo ? dcNo : null,
          discountType: stockDetail?.discountType ?? undefined,
          discountValue: stockDetail?.discountValue
            ? parseInt(stockDetail.discountValue)
            : null,
          taxPercent: stockDetail?.taxPercent
            ? parseInt(stockDetail.taxPercent)
            : null,
          gsmId: stockDetail?.gsmId ? parseInt(stockDetail.gsmId) : null,
        },
      });

      // Update or create Stock row
      const existingStock = await tx.stock.findFirst({
        where: { inwardItemsId: updatedItem.id },
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
            qty: stockDetail?.inwardQty
              ? parseInt(stockDetail.inwardQty)
              : null,
            inwardType: inwardType ? inwardType : "",
            invNo: invNo ? invNo : null,
            itemGroupId: stockDetail?.itemGroupId
              ? parseInt(stockDetail.itemGroupId)
              : null,
            sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
            colorId: stockDetail?.colorId
              ? parseInt(stockDetail.colorId)
              : null,
            gsmId: stockDetail?.gsmId ? parseInt(stockDetail.gsmId) : null,
          },
        });
      } else {
        await tx.stock.create({
          data: {
            inOrOut: "In",
            processName: "Purchase Inward",
            createdById: parseInt(userId),
            branchId: parseInt(locationId),
            storeId: parseInt(storeId),
            inwardItemsId: updatedItem.id,
            styleItemId: stockDetail?.styleItemId
              ? parseInt(stockDetail.styleItemId)
              : null,
            uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
            hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
            qty: stockDetail?.inwardQty
              ? parseInt(stockDetail.inwardQty)
              : null,
            inwardType: inwardType ? inwardType : "",
            invNo: invNo ? invNo : null,
            itemGroupId: stockDetail?.itemGroupId
              ? parseInt(stockDetail.itemGroupId)
              : null,
            sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
            colorId: stockDetail?.colorId
              ? parseInt(stockDetail.colorId)
              : null,
            gsmId: stockDetail?.gsmId ? parseInt(stockDetail.gsmId) : null,
          },
        });
      }

      return updatedItem;
    } else {
      // Create new OpeningStockItem
      const createdItem = await tx.inwardItems.create({
        data: {
          purchaseInwardId: parseInt(purchaseInward.id),
          styleItemId: stockDetail?.styleItemId
            ? parseInt(stockDetail.styleItemId)
            : null,
          uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
          hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
          poQty: stockDetail?.poQty ? parseInt(stockDetail.poQty) : null,
          inwardQty: stockDetail?.inwardQty
            ? parseInt(stockDetail.inwardQty)
            : null,
          inwardType: inwardType ? inwardType : "",
          poId: stockDetail?.poId ? parseInt(stockDetail.poId) : null,
          invNo: invNo ? invNo : null,
          price: stockDetail?.price ? parseInt(stockDetail.price) : null,
          itemGroupId: stockDetail?.itemGroupId
            ? parseInt(stockDetail.itemGroupId)
            : null,
          sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
          colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
          dcNo: dcNo ? dcNo : null,
          discountType: stockDetail?.discountType ?? undefined,
          discountValue: stockDetail?.discountValue
            ? parseInt(stockDetail.discountValue)
            : null,
          taxPercent: stockDetail?.taxPercent
            ? parseInt(stockDetail.taxPercent)
            : null,
          gsmId: stockDetail?.gsmId ? parseInt(stockDetail.gsmId) : null,
        },
      });

      // Create Stock row
      await tx.stock.create({
        data: {
          inOrOut: "In",
          processName: "Purchase Inward",
          createdById: parseInt(userId),
          branchId: parseInt(locationId),
          storeId: parseInt(storeId),
          inwardItemsId: createdItem.id,
          styleItemId: stockDetail?.styleItemId
            ? parseInt(stockDetail.styleItemId)
            : null,
          uomId: stockDetail?.uomId ? parseInt(stockDetail.uomId) : null,
          hsnId: stockDetail?.hsnId ? parseInt(stockDetail.hsnId) : null,
          qty: stockDetail?.inwardQty ? parseInt(stockDetail.inwardQty) : null,
          inwardType: inwardType ? inwardType : "",
          invNo: invNo ? invNo : null,
          itemGroupId: stockDetail?.itemGroupId
            ? parseInt(stockDetail.itemGroupId)
            : null,
          sizeId: stockDetail?.sizeId ? parseInt(stockDetail.sizeId) : null,
          colorId: stockDetail?.colorId ? parseInt(stockDetail.colorId) : null,
          gsmId: stockDetail?.gsmId ? parseInt(stockDetail.gsmId) : null,
        },
      });

      return createdItem;
    }
  });

  return Promise.all(promises);
}

async function remove(id) {
  const data = await prisma.purchaseInward.delete({
    where: {
      id: parseInt(id),
    },
  });

  return { statusCode: 0, data };
}

async function getPurchaseDetail(req) {
  const { invNo, storeId, branchId } = req.query;

  // 1️⃣ First try fetching by styleNo
  let data = await prisma.purchaseInward.findFirst({
    where: {
      invNo: invNo,
    },
    include: {
      fabricInwardItems: {
        select: {
          materialStocks: true,
          id: true,
          purchaseInwardId: true,
          styleNo: true,
          fabricId: true,
          styleItemId: true,
          styleId: true,
          hsnId: true,
          fabWidth: true,
          fabMeter: true,
          uomId: true,
          noOfPcs: true,
          accessoryId: true,
          accessoryGroupId: true,
          accessoryItemId: true,
          uomId: true,
          uomId: true,
          qty: true,
          price: true,
          Fabric: true,
          Color: true,
          StyleItem: true,
          Accessory: true,
          AccessoryGroup: true,
          Uom: true,
          Size: true,
          filePath: true,
        },
      },
      supplierId: true,
      inwardType: true,
    },
  });

  if (!data) return NoRecordFound("Purchase Inward");
  return {
    statusCode: 0,
    data: {
      ...data,
    },
  };
}

async function getPurchaseDetailStock(req) {
  const { invNo, storeId, branchId, returnType } = req.query;

  let purchaseData = await prisma.purchaseInward.findFirst({
    where: {
      invNo: invNo,
      inwardType: returnType,
    },
    include: {
      inwardItems: true,
    },
  });
  if (!purchaseData || purchaseData.length === 0)
    return NoRecordFound("Invoice");
  let data;
  const isMaterial =
    returnType?.toLowerCase().includes("fabric") ||
    returnType?.toLowerCase().includes("accessory");
  if (isMaterial) {
    data = await prisma.materialStock.groupBy({
      by: [
        "fabricId",
        "hsnId",
        "fabWidth",
        "accessoryId",
        "accessoryGroupId",
        "uomId",
        "uomId",
        "styleId",
        "invNo",
        "portionId",
      ],
      where: {
        branchId: branchId ? parseInt(branchId) : undefined,
        storeId: storeId ? parseInt(storeId) : undefined,
        invNo: invNo,
      },
      _sum: {
        qty: true,
        fabMeter: true,
      },
    });
  } else {
    const rg =
      purchaseData.inwardItems.filter(
        (item) => item.styleId && item.styleItemId && item.uomId,
      ) || [];
    const orConditions = rg.map((item) => ({
      styleId: item.styleId,
      styleItemId: item.styleItemId,
      hsnId: item.hsnId,
      uomId: item.uomId,
    }));
    data = await prisma.stock.groupBy({
      by: ["fabricId", "hsnId", "uomId", "styleId", "styleItemId", "styleNo"],
      where: {
        branchId: branchId ? parseInt(branchId) : undefined,
        storeId: storeId ? parseInt(storeId) : undefined,
        OR: orConditions,
      },
      _sum: {
        qty: true,
      },
    });
  }

  if (!data || data.length === 0) return NoRecordFound("Invoice not found");

  // 4️⃣ Return formatted result
  return {
    statusCode: 0,
    data: isMaterial
      ? data.map((d) => ({
          invNo: d.invNo,
          styleItemId: d.styleItemId,
          fabricId: d.fabricId,
          hsnId: d.hsnId,
          uomId: d.uomId,
          fabWidth: d.fabWidth,
          fabMeter: d._sum.fabMeter,
          accessoryId: d.accessoryId,
          accessoryGroupId: d.accessoryGroupId,
          uomId: d.uomId,
          uomId: d.uomId,
          qty: d._sum.qty,
          styleId: d.styleId,
          portionId: d.portionId,
        }))
      : data.map((d) => ({
          invNo: purchaseData.invNo,
          styleItemId: d.styleItemId,
          fabricId: d.fabricId,
          hsnId: d.hsnId,
          uomId: d.uomId,
          stkQty: d._sum.qty,
          styleId: d.styleId,
          styleNo: d.styleNo,
        })),
    returnType: purchaseData.inwardType,
    supplierId: purchaseData.supplierId,
  };
}

function manualFilterSearchDataPurchaseInwardItems(
  searchDocDate,
  searchDcDate,
  returnType,
  data,
) {
  const returnTypeToSearch =
    returnType === "General Return"
      ? ["Direct Inward"]
      : ["Order Purchase Inward", "General Purchase Inward"];

  return data.filter(
    (item) =>
      (searchDocDate
        ? String(getDateFromDateTime(item.PurchaseInward.docDate)).includes(
            searchDocDate,
          )
        : true) &&
      (searchDcDate
        ? String(getDateFromDateTime(item.PurchaseInward.dcDate)).includes(
            searchDcDate,
          )
        : true) &&
      (returnTypeToSearch
        ? returnTypeToSearch.includes(item.PurchaseInward.inwardType) // ✅ Check against array
        : true),
  );
}

async function getAllDataPurInwardItems(data) {
  // let promises = data?.map(async (item) => {
  //   let data = await getPurInwardItemById(item.id);
  //   return data.data;
  // });
  // return Promise.all(promises);
  const results = await Promise.all(
    data?.map(async (item) => {
      const res = await getPurInwardItemById(item.id);
      return res.data;
    }),
  );

  // ✅ filter here
  return results.filter((item) => item.balQty > 0);
}

async function getPurInwardItemById(id) {
  let data = await prisma.inwardItems.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      PurchaseInward: {
        select: {
          docId: true,
          dcDate: true,
          docDate: true,
        },
      },
      Uom: {
        select: {
          name: true,
        },
      },
      StyleItem: {
        select: {
          name: true,
        },
      },
      Hsn: {
        select: {
          name: true,
        },
      },
      Itemgroup: {
        select: {
          name: true,
        },
      },
      Size: {
        select: {
          name: true,
        },
      },
      Color: {
        select: {
          name: true,
        },
      },
      Gsm: {
        select: {
          name: true,
        },
      },
    },
  });
  if (!data) return NoRecordFound("Purchase Inward");
  const itemWithPoQty = await prisma.poItems.findFirst({
    where: {
      styleItemId: data.styleItemId,
      poId: data.poId,
      uomId: data.uomId,
      hsnId: data.hsnId,
      gsmId: data.gsmId,
    },
  });
  const returnItems = await prisma.purchaseReturnItems.findMany({
    where: {
      styleItemId: data.styleItemId,
      purchaseInwardId: data.purchaseInwardId,
      uomId: data.uomId,
      hsnId: data.hsnId,
      gsmId: data.gsmId,
    },
    select: {
      returnQty: true,
    },
  });

  const returnQty = returnItems.reduce(
    (sum, item) => sum + (item.returnQty ?? 0),
    0,
  );
  // const totalStkQty = await prisma.stock.aggregate({
  //   where: {
  //     styleItemId: data.styleItemId,
  //     uomId: data.uomId,
  //     hsnId: data.hsnId,
  //     invNo: data.invNo
  //   },
  //   _sum: {
  //     qty: true,
  //   },
  // });
  return {
    statusCode: 0,
    data: {
      ...data,
      poQty: itemWithPoQty?.qty ?? 0,
      alreadyReturnQty: returnQty,
      // balQty: totalStkQty._sum.qty,
      balQty: data.inwardQty - returnQty,
    },
  };
}

async function getPurchaseInwardItems(req) {
  const {
    branchId,
    active,
    supplierId,
    pagination,
    dataPerPage,
    searchDocId,
    searchDocDate,
    searchDcDate,
    returnType,
  } = req.query;

  let data;
  let totalCount;
  if (pagination) {
    data = await prisma.inwardItems.findMany({
      where: {
        PurchaseInward: {
          docId: Boolean(searchDocId)
            ? {
                contains: searchDocId,
              }
            : undefined,
          supplierId: supplierId ? parseInt(supplierId) : undefined,
        },
      },
      include: {
        PurchaseInward: {
          select: {
            supplierId: true,
            docDate: true,
            dcDate: true,
            inwardType: true,
          },
        },

        Uom: {
          select: {
            name: true,
          },
        },
      },
    });
    data = manualFilterSearchDataPurchaseInwardItems(
      searchDocDate,
      searchDcDate,
      returnType,
      data,
    );
    console.log(data, "data");

    data = data?.filter((i) => i.PurchaseInward.supplierId == supplierId);

    data = await getAllDataPurInwardItems(data);
  } else {
    data = await prisma.inwardItems.findMany({
      where: {
        branchId: branchId ? parseInt(branchId) : undefined,
        active: active ? Boolean(active) : undefined,
      },
    });
  }
  return { statusCode: 0, data, totalCount };
}

export {
  get,
  getOne,
  create,
  update,
  remove,
  getPurchaseDetail,
  getPurchaseDetailStock,
  getPurchaseInwardItems,
  getOneBillEntry,
  getPurchaseInwardBillEntryItems,
};

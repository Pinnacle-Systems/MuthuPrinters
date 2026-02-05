import { PrismaClient } from "@prisma/client";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getDateFromDateTime,
  getDateTimeRange,
  getYearShortCode,
  getYearShortCodeForFinYear,
  substract,
} from "../utils/helper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { poUpdateValidator } from "../validators/po.validator.js";
// import { getTotalQty } from '../utils/poHelpers/getTotalQuantity.js';
const prisma = new PrismaClient();

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.po.findFirst({
    where: {
      branchId: parseInt(branchId),
    },
    orderBy: {
      id: "desc",
    },
  });
  const branchObj = await getTableRecordWithId(branchId, "branch");
  let newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PO/1`;
  if (lastObject) {
    newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PO/${parseInt(lastObject.docId.split("/").at(-1)) + 1}`;
  }
  return newDocId;
}

function manualFilterSearchData(
  searchPoDate,
  searchDueDate,
  searchPoType,
  data,
) {
  return data.filter(
    (item) =>
      (searchPoDate
        ? String(getDateFromDateTime(item.createdAt)).includes(searchPoDate)
        : true) &&
      (searchDueDate
        ? String(getDateFromDateTime(item.dueDate)).includes(searchDueDate)
        : true) &&
      (searchPoType
        ? item.poType.toLowerCase().includes(searchPoType.toLowerCase())
        : true),
  );
}

async function get(req) {
  const {
    branchId,
    active,
    pagination,
    pageNumber,
    dataPerPage,
    finYearId,
    searchDocId,
    searchPoDate,
    searchSupplierAliasName,
    searchPoType,
    searchDueDate,
    supplierId,
    startDate,
    endDate,
    filterParties,
    supplier,
    filterPoTypes,
    serachDocNo,
    searchClientName,
    searchDate,
    searchMaterial,
  } = req.query;
  const { startTime: startDateStartTime } = getDateTimeRange(startDate);
  const { endTime: endDateEndTime } = getDateTimeRange(endDate);
  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(
        finYearDate?.startDateStartTime,
        finYearDate?.endDateEndTime,
      )
    : "";
  let data = await prisma.po.findMany({
    where: {
      AND: [
        {
          AND: finYearDate
            ? [
                {
                  createdAt: {
                    gte: finYearDate.startDateStartTime,
                  },
                },
                {
                  createdAt: {
                    lte: finYearDate.endDateEndTime,
                  },
                },
              ]
            : undefined,
        },
        {
          AND:
            startDate && endDate
              ? [
                  {
                    createdAt: {
                      gte: startDateStartTime,
                    },
                  },
                  {
                    createdAt: {
                      lte: endDateEndTime,
                    },
                  },
                ]
              : undefined,
        },
      ],
      branchId: branchId ? parseInt(branchId) : undefined,
      active: active ? Boolean(active) : undefined,
      // poType: Boolean(searchPoType) ? { contains: searchPoType } : undefined,
      docId: Boolean(serachDocNo)
        ? {
            contains: serachDocNo,
          }
        : undefined,
      OR:
        supplierId || Boolean(filterParties)
          ? [
              {
                supplierId: supplierId ? parseInt(supplierId) : undefined,
              },
              {
                supplierId: Boolean(filterParties)
                  ? {
                      in: filterParties.split(",").map((i) => parseInt(i)),
                    }
                  : undefined,
              },
            ]
          : undefined,
      Supplier: {
        aliasName: Boolean(searchSupplierAliasName)
          ? { contains: searchSupplierAliasName }
          : undefined,
        name: Boolean(supplier) ? { contains: supplier } : undefined,
      },
    },
    include: {
      Supplier: {
        select: {
          aliasName: true,
          name: true,
        },
      },

      poItems: {
        select: {
          qty: true,
        },
      },
    },
  });
  data = manualFilterSearchData(searchDate, searchDueDate, searchPoType, data);
  const totalCount = data.length;
  // data = await getTotalQty(data);
  // if (pagination) {
  //     data = data.slice(((pageNumber - 1) * parseInt(dataPerPage)), pageNumber * dataPerPage)
  // }

  let docId = finYearDate
    ? await getNextDocId(
        branchId,
        shortCode,
        finYearDate?.startDateStartTime,
        finYearDate?.endDateEndTime,
      )
    : "";
  // console.log(data, "data")
  return { statusCode: 0, data, nextDocId: docId, totalCount };
}

async function getOne(id) {
  const childRecord = 0;

  // Fetch PO with relations
  let po = await prisma.po.findUnique({
    where: { id: parseInt(id) },
    include: {
      poItems: true,
      Supplier: {
        select: {
          aliasName: true,
          contactPersonName: true,
          gstNo: true,
          address: true,
          pincode: true,
          City: {
            select: { name: true },
          },
        },
      },
      DeliveryParty: {
        select: {
          name: true,
          address: true,
          contactPersonName: true,
        },
      },
      DeliveryBranch: {
        select: {
          branchName: true,
          contactName: true,
          address: true,
        },
      },
    },
  });

  if (!po) return NoRecordFound("po");

  // Compute PoItems with balanceQty
  const updatedItems =
    po.poItems?.map((item) => {
      const qty = parseFloat(item.qty) || 0;
      const req = parseFloat(item?.RequirementPlanningItems?.requiredQty) || 0;

      return {
        ...item,
        balanceQty: Math.max(0, parseFloat(req) - parseFloat(qty)),
        requiredQty: req,
      };
    }) || [];

  // Assign updated PoItems back to PO object
  po.poItems = updatedItems;
  const childRecordInward = await prisma.inwardItems.count({
    where: {
      poId: po.id,
    },
  });
  const childRecordCancel = await prisma.purchaseCancelItems.count({
    where: {
      poId: po.id,
    },
  });

  return {
    statusCode: 0,
    data: {
      ...po,
      childRecordInward: childRecordInward,
      childRecordCancel: childRecordCancel
    },
  };
}

async function getSearch(req) {
  const { companyId, active } = req.query;
  const { searchKey } = req.params;
  const data = await prisma.po.findMany({
    where: {
      country: {
        companyId: companyId ? parseInt(companyId) : undefined,
      },
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

async function getLotWiseReturnRolls(lotNo, poItemsId) {
  let returnDatas = `select sum(ReturnLotDetails.qty) as lotQty,sum(ReturnLotDetails.noOfRolls) as lotRolls from directReturnItems left join DirectReturnOrPoReturn on DirectReturnOrPoReturn.id=directReturnItems.directReturnOrPoReturnId
    left join ReturnLotDetails on ReturnLotDetails.directReturnItemsId=directReturnItems.id
    where directReturnItems.poItemsId=${poItemsId}  and DirectReturnOrPoReturn.poInwardOrDirectInward="PurchaseReturn" ;
    `;
  const alreadyReturnData = await prisma.$queryRawUnsafe(returnDatas);
  return alreadyReturnData[0];
}

async function getStockQty(
  storeId,
  itemType,
  accessoryId,
  colorId,
  uomId,
  designId,
  gaugeId,
  loopLengthId,
  gsmId,
  sizeId,
  fabricId,
  kDiaId,
  fDiaId,
  yarnId,
) {
  let sql;

  console.log(
    "itemTypePOID",
    itemType == "Accessory",
    colorId,
    uomId,
    sizeId,
    accessoryId,
    storeId,
  );

  if (itemType == "Accessory") {
    sql = `select sum(qty) as stockQty, sum(noOfRolls) as stockRolls  from stock
        where colorId=${colorId} and uomId=${uomId}  and sizeId=${sizeId} and accessoryId=${accessoryId} and  storeId=${storeId}; 
                `;
  } else {
    sql = `select sum(qty) as stockQty,sum(noOfRolls) as stockRolls  from stock
        where yarnId=${yarnId} and colorId=${colorId} and uomId=${uomId} ;`;
  }

  console.log(sql, "sqlstock");

  const stockData = await prisma.$queryRawUnsafe(sql);
  return stockData[0];
}

async function getStockQtyByLot(
  lotNo,
  storeId,
  itemType,
  accessoryId,
  colorId,
  uomId,
  designId,
  gaugeId,
  loopLengthId,
  gsmId,
  sizeId,
  fabricId,
  kDiaId,
  fDiaId,
) {
  let sql;

  if (itemType == "DyedFabric") {
    sql = `select sum(qty) as stockQty,sum(noOfRolls) as stockRolls  from stock
        where colorId=${colorId} and uomId=${uomId} and designId=${designId} and gaugeId=${gaugeId} and loopLengthId=${loopLengthId}
         and gsmId=${gsmId}  and 
        fabricId=${fabricId} and   kDiaId=${kDiaId} and fDiaId=${fDiaId} 

                `;
  } else {
    sql = `select sum(qty) as stockQty,sum(noOfRolls) as stockRolls  from stock
        where colorId=${colorId} and uomId=${uomId} 
       and sizeId=${sizeId} and 
        accessoryId=${accessoryId}  ;
                `;
  }

  const stockData = await prisma.$queryRawUnsafe(sql);
  return stockData[0];
}

function getStockObject(transType, item) {
  let newItem = {};
  if (transType === "GreyYarn" || transType === "DyedYarn") {
    newItem["yarnId"] = parseInt(item["yarnId"]);
  } else if (transType === "GreyFabric" || transType === "DyedFabric") {
    newItem["fabricId"] = parseInt(item["fabricId"]);
    newItem["designId"] = parseInt(item["designId"]);
    newItem["gaugeId"] = parseInt(item["gaugeId"]);
    newItem["loopLengthId"] = parseInt(item["loopLengthId"]);
    newItem["gsmId"] = parseInt(item["gsmId"]);
    newItem["kDiaId"] = parseInt(item["kDiaId"]);
    newItem["fDiaId"] = parseInt(item["fDiaId"]);
  } else if (transType === "Accessory") {
    newItem["accessoryId"] = parseInt(item["accessoryId"]);
    newItem["sizeId"] = item["sizeId"] ? parseInt(item["sizeId"]) : undefined;
  }
  newItem["uomId"] = parseInt(item["uomId"]);
  newItem["colorId"] = parseInt(item["colorId"]);
  return newItem;
}

export function getPoItemObject(poMaterial, item) {
  console.log(item, "item");

  let newItem = {};
  if (poMaterial === "GreyYarn" || poMaterial === "DyedYarn") {
    newItem.yarnId = parseInt(item.yarnId);
    newItem.noOfBags = item.noOfBags ? parseInt(item.noOfBags) : null;
    newItem.weightPerBag = item.weightPerBag
      ? parseFloat(item.weightPerBag)
      : null;
    newItem.percentage = item.percentage ? parseFloat(item.percentage) : null;
    newItem.requiredQty = item.requiredQty
      ? parseFloat(item.requiredQty)
      : null;
    newItem.count = item.count ? parseInt(item.count) : null;
    newItem.hsnId = item.hsnId ? parseInt(item.hsnId) : null;
  } else if (poMaterial === "GreyFabric" || poMaterial === "DyedFabric") {
    newItem.fabricId = parseInt(item.fabricId);
    newItem.designId = parseInt(item.designId);
    newItem.gaugeId = parseInt(item.gaugeId);
    newItem.loopLengthId = parseInt(item.loopLengthId);
    newItem.gsmId = parseInt(item.gsmId);
    newItem.kDiaId = parseInt(item.kDiaId);
    newItem.fDiaId = parseInt(item.fDiaId);
  } else if (poMaterial === "Accessory") {
    newItem.accessoryId = parseInt(item.accessoryId);
    newItem.sizeId = item.sizeId ? parseInt(item.sizeId) : undefined;
    newItem.accessoryGroupId = parseInt(item.accessoryGroupId);
    newItem.accessoryItemId = parseInt(item.accessoryItemId);
  }

  ((newItem.requirementPlanningItemsId = item?.RequirementPlanningItemsId
    ? parseInt(item?.RequirementPlanningItemsId)
    : undefined),
    (newItem.orderId = item?.orderId ? parseInt(item?.orderId) : undefined),
    (newItem.orderDetailsId = item?.orderDetailsId
      ? parseInt(item?.orderDetailsId)
      : undefined),
    (newItem.uomId = item.uomId ? parseInt(item.uomId) : null));
  newItem.colorId = item.colorId ? parseInt(item.colorId) : undefined;
  newItem.qty = parseFloat(item.qty);
  newItem.price = parseFloat(item.price);
  newItem.discountType = item.discountType ?? null;
  newItem.discountValue = parseFloat(item.discountValue ?? 0);
  newItem.tax = parseFloat(item.tax ?? 0);
  newItem.taxPercent = parseFloat(item.taxPercent ?? 0);
  return newItem;
}

async function create(body) {
  try {
    const {
      userId,
      branchId,
      finYearId,
      docDate,
      dueDate,
      poType,
      taxTemplateId,
      deliveryType,
      deliveryToId,
      termsAndCondtion,
      remarks,
      supplierId,
      poItems,
      discountType,
      discountValue,
      taxPercent,
      termsId,
      payTermId,
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
    );
    let data;
    await prisma.$transaction(async (tx) => {
      data = await tx.po.create({
        data: {
          docId: newDocId,
          docDate: docDate ? new Date(docDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          poType,
          branchId: parseInt(branchId),
          createdById: parseInt(userId),
          taxTemplateId: parseInt(taxTemplateId),
          deliveryType,
          deliveryBranchId:
            deliveryType === "ToSelf"
              ? deliveryToId
                ? parseInt(deliveryToId)
                : null
              : null,
          deliveryToId:
            deliveryType === "ToParty"
              ? deliveryToId
                ? parseInt(deliveryToId)
                : null
              : null,
          termsAndCondtion,
          remarks,
          supplierId: parseInt(supplierId),
          discountType,
          discountValue:
            discountValue === "" || discountValue == null
              ? null
              : Number(discountValue),
          taxPercent:
            taxPercent === "" || taxPercent == null ? null : Number(taxPercent),
          quoteVersions: {
            create: {
              quoteVersion: 1,
            },
          },
          termsId: termsId ? parseInt(termsId) : null,
          payTermId: payTermId ? parseInt(payTermId) : null,
        },
      });
      await createPoItems(tx, poItems, data, userId, branchId);
    });
    return { statusCode: 0, data };
  } catch (err) {
    return {
      statusCode: 400,
      message: err.message,
    };
  }
}

async function createPoItems(tx, poItems, po) {
  const promises = poItems.map(async (itemDetails, index) => {
    const qty = itemDetails?.qty
      ? Math.round(parseFloat(itemDetails.qty))
      : null;

    const createdItem = await tx.poItems.create({
      data: {
        poId: parseInt(po.id),
        styleItemId: itemDetails?.styleItemId
          ? parseInt(itemDetails.styleItemId)
          : null,
        uomId: itemDetails?.uomId ? parseInt(itemDetails.uomId) : null,
        hsnId: itemDetails?.hsnId ? parseInt(itemDetails.hsnId) : null,
        qty,
        price: itemDetails?.price ? parseInt(itemDetails.price) : null,
        discountType: itemDetails?.discountType ?? undefined,
        discountValue: itemDetails?.discountValue
          ? parseInt(itemDetails.discountValue)
          : null,
        taxPercent: itemDetails?.taxPercent
          ? parseInt(itemDetails.taxPercent)
          : null,
      },
    });

    return createdItem;
  });

  return Promise.all(promises);
}

function findRemovedItems(dataFound, poItems) {
  let removedItems = dataFound.poItems.filter((oldItem) => {
    let result = poItems.find(
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
    docDate,
    dueDate,
    poType,
    taxTemplateId,
    deliveryType,
    deliveryToId,
    termsAndCondtion,
    remarks,
    supplierId,
    poItems,
    discountType,
    discountValue,
    taxPercent,
    isNewVersion,
    quoteVersion,
    termsId,
    payTermId,
  } = await body;
  let data;
  const dataFound = await prisma.po.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      poItems: true,
      quoteVersions: true,
    },
  });
  if (!dataFound) return NoRecordFound("PO");
  const currentQuoteVersion = Math.max(
    ...new Set(
      dataFound?.poItems
        .filter((i) => i?.quoteVersion)
        .map((i) => parseInt(i.quoteVersion)),
    ),
  );
  let removedItems = findRemovedItems(dataFound, poItems);
  let removeItemsIds = removedItems.map((item) => parseInt(item.id));
  await prisma.$transaction(async (tx) => {
    if (removeItemsIds.length > 0) {
      await tx.poItems.deleteMany({
        where: { id: { in: removeItemsIds } },
      });
    }
    data = await tx.po.update({
      where: {
        id: parseInt(id),
      },
      data: {
        docDate: docDate ? new Date(docDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        branchId: parseInt(branchId),
        poType,
        taxTemplateId: parseInt(taxTemplateId),
        deliveryType,
        deliveryBranchId:
          deliveryType === "ToSelf"
            ? deliveryToId
              ? parseInt(deliveryToId)
              : null
            : null,
        deliveryToId:
          deliveryType === "ToParty"
            ? deliveryToId
              ? parseInt(deliveryToId)
              : null
            : null,
        termsAndCondtion,
        remarks,
        supplierId: parseInt(supplierId),
        updatedById: parseInt(userId),
        discountType,
        discountValue:
          discountValue === "" || discountValue == null
            ? null
            : Number(discountValue),
        taxPercent:
          taxPercent === "" || taxPercent == null ? null : Number(taxPercent),
        quoteVersion: isNewVersion
          ? currentQuoteVersion + 1
          : parseInt(quoteVersion),
        quoteVersions: isNewVersion
          ? {
              create: {
                quoteVersion: currentQuoteVersion + 1,
              },
            }
          : undefined,
        termsId: termsId ? parseInt(termsId) : null,
        payTermId: payTermId ? parseInt(payTermId) : null,
        poItems: {
          createMany: {
            data: poItems
              .filter((i) => i["quoteVersion"] == "New")
              .map((temp) => {
                let newItem = {};
                newItem["styleItemId"] = parseInt(temp["styleItemId"]);
                newItem["uomId"] = temp["uomId"];
                newItem["hsnId"] = parseInt(temp["hsnId"]);
                newItem["qty"] = parseFloat(temp["qty"]);
                newItem["price"] = parseFloat(temp["price"]);
                newItem["discountType"] = temp["discountType"];
                newItem["discountValue"] = parseFloat(
                  temp["discountValue"] || 0,
                );
                newItem["taxPercent"] = parseFloat(temp["taxPercent"] || 0);
                newItem["quoteVersion"] = parseInt(currentQuoteVersion + 1);
                return newItem;
              }),
          },
        },
      },
    });
    // await updatePoItems(tx, poItems, data, userId, branchId, nextQuoteVersion);
  });
  return { statusCode: 0, data };
}

async function updatePoItems(tx, poItems, po, userId, branchId, quoteVersion) {
  const promises = poItems.map(async (itemDetails) => {
    const qty = itemDetails?.qty
      ? Math.round(parseFloat(itemDetails.qty))
      : null;

    if (itemDetails.id) {
      // Update existing poItem
      const updatedItem = await tx.poItems.update({
        where: { id: parseInt(itemDetails.id) },
        data: {
          poId: parseInt(po.id),
          styleItemId: itemDetails?.styleItemId
            ? parseInt(itemDetails.styleItemId)
            : null,
          uomId: itemDetails?.uomId ? parseInt(itemDetails.uomId) : null,
          hsnId: itemDetails?.hsnId ? parseInt(itemDetails.hsnId) : null,
          qty,
          price: itemDetails?.price ? parseInt(itemDetails.price) : null,
          discountType: itemDetails?.discountType ?? undefined,
          discountValue: itemDetails?.discountValue
            ? parseInt(itemDetails.discountValue)
            : null,
          taxPercent: itemDetails?.taxPercent
            ? parseInt(itemDetails.taxPercent)
            : null,
          quoteVersion,
        },
      });

      return updatedItem;
    } else {
      // Create new poItem
      const createdItem = await tx.poItems.create({
        data: {
          poId: parseInt(po.id),
          styleItemId: itemDetails?.styleItemId
            ? parseInt(itemDetails.styleItemId)
            : null,
          uomId: itemDetails?.uomId ? parseInt(itemDetails.uomId) : null,
          hsnId: itemDetails?.hsnId ? parseInt(itemDetails.hsnId) : null,
          qty,
          price: itemDetails?.price ? parseInt(itemDetails.price) : null,
          discountType: itemDetails?.discountType ?? undefined,
          discountValue: itemDetails?.discountValue
            ? parseInt(itemDetails.discountValue)
            : null,
          taxPercent: itemDetails?.taxPercent
            ? parseInt(itemDetails.taxPercent)
            : null,
          quoteVersion,
        },
      });

      return createdItem;
    }
  });

  return Promise.all(promises);
}

async function remove(id) {
  const data = await prisma.po.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

function manualFilterSearchDataPoItems(
  searchPoDate,
  searchDueDate,
  searchInwardType,
  data,
) {
  const inwardTypeKey = searchInwardType
    ? searchInwardType.split(" ")[0].toUpperCase()
    : "";
  return data.filter(
    (item) =>
      (searchPoDate
        ? String(getDateFromDateTime(item.Po.docDate)).includes(searchPoDate)
        : true) &&
      (searchDueDate
        ? String(getDateFromDateTime(item.Po.dueDate)).includes(searchDueDate)
        : true) &&
      (inwardTypeKey ? item.Po.poType.toUpperCase() === inwardTypeKey : true),
  );
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
  const data = await prisma.poItems.findUnique({
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

  // 2️⃣ Return qty using purchaseInwardId
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

  // 3️⃣ Stock balance
  const totalStkQty = await prisma.stock.aggregate({
    where: {
      styleItemId: data.styleItemId,
      uomId: data.uomId,
      hsnId: data.hsnId,
      invNo: data.invNo,
    },
    _sum: { qty: true },
  });

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

async function getPoItems(req) {
  const {
    branchId,
    active,
    supplierId,
    inwardType,
    pagination,
    dataPerPage,
    searchDocId,
    searchPoDate,
    searchInwardType,
    searchDueDate,
  } = req.query;

  let data;
  let totalCount;
  if (pagination) {
    data = await prisma.poItems.findMany({
      where: {
        Po: {
          docId: Boolean(searchDocId)
            ? {
                contains: searchDocId,
              }
            : undefined,
          supplierId: supplierId ? parseInt(supplierId) : undefined,
        },
      },
      include: {
        Po: {
          select: {
            supplierId: true,
            docDate: true,
            dueDate: true,
            poType: true,
          },
        },

        Uom: {
          select: {
            name: true,
          },
        },
      },
    });
    data = manualFilterSearchDataPoItems(
      searchPoDate,
      searchDueDate,
      searchInwardType,
      data,
    );

    data = data?.filter((i) => i.Po.supplierId == supplierId);

    data = await getAllDataPoItems(data);
    // if (isPurchaseInwardFilter) {
    //   data = data.filter(
    //     (item) =>
    //       parseFloat(
    //         balanceQtyCalculation(
    //           item?.qty,
    //           item?.alreadyCancelData?._sum?.qty,
    //           item?.alreadyInwardedData?._sum?.qty,
    //           item?.alreadyReturnedData?._sum?.qty,
    //         ),
    //       ) > 0,
    //   );

    //   data = data?.filter((j) => parseFloat(j.balanceQty) > 0);
    // }

    // if (isPurchaseCancelFilter) {
    //   data = data.filter(
    //     (item) =>
    //       parseFloat(
    //         balanceCancelQtyCalculation(
    //           item?.qty,
    //           item?.alreadyCancelData?._sum?.qty,
    //           item?.alreadyInwardedData?._sum?.qty,
    //           item?.alreadyReturnedData?._sum?.qty,
    //         ),
    //       ) > 0,
    //   );
    // }
    // if (isPurchaseReturnFilter) {
    //   // data = data.filter(item => substract(item.alreadyInwardedData?._sum?.qty ? item.alreadyInwardedData._sum.qty : 0, item.alreadyReturnedData?._sum?.qty ? item.alreadyReturnedData?._sum?.qty : 0) > 0)

    //   data = data.filter((item) => {
    //     const poQty = item?.qty || 0;
    //     const inwardQty = item?.alreadyInwardedData?._sum?.qty || 0;
    //     const returnQty = item?.alreadyReturnedData?._sum?.qty || 0;
    //     const cancelQty = item?.alreadyCancelData?._sum?.qty || 0;

    //     const balance = parseFloat(substract(inwardQty, returnQty));

    //     // log for debugging
    //     console.log({
    //       itemId: item?.id,
    //       poQty,
    //       inwardQty,
    //       returnQty,
    //     });

    //     // keep only if positive balance
    //     return balance > 0;
    //   });
    // }
  } else {
    data = await prisma.poItems.findMany({
      where: {
        branchId: branchId ? parseInt(branchId) : undefined,
        active: active ? Boolean(active) : undefined,
      },
    });
  }
  return { statusCode: 0, data, totalCount };
}

export { get, getOne, getSearch, create, update, remove, getPoItems };

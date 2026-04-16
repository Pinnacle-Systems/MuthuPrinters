import { prisma } from "../lib/prisma.js";

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
import {
  approveRecord,
  createApprovalLog,
  rejectRecord,
} from "../utils/approvalHelper.js";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.po.findFirst({
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
  let newDocId = `${branchObj.branchCode}/${shortCode}/PO/1`;
  if (lastObject) {
    newDocId = `${branchObj.branchCode}/${shortCode}/PO/${parseInt(lastObject.docId.split("/").at(-1)) + 1}`;
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

function getPOStatus(po) {
  const poItems = po.poItems || [];
  const totalPoQty = poItems.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalInwardQty =
    po.inwardItems?.reduce((sum, item) => sum + (item.inwardQty || 0), 0) || 0;
  const totalCancelQty =
    po.purchaseCancelItems?.reduce(
      (sum, item) => sum + (item.cancelQty || 0),
      0,
    ) || 0;
  const totalProcessedQty = totalInwardQty + totalCancelQty;

  if (totalInwardQty === 0 && totalCancelQty === 0) return "Pending";
  if (totalCancelQty >= totalPoQty) return "Cancelled";
  if (totalInwardQty >= totalPoQty) return "Fully Received";
  if (totalProcessedQty >= totalPoQty) return "Closed (Inward + Cancelled)";
  if (totalInwardQty > 0 && totalCancelQty > 0)
    return "Partially Received & Cancelled";
  if (totalInwardQty > 0) return "Partially Received";
  if (totalCancelQty > 0) return "Partially Cancelled";
  return "Pending";
}

function getPOApprovalStatus(log, isApprovalConfigured = false) {
  // No approval log = not configured
  if (!log) {
    if (isApprovalConfigured) {
      return {
        status: "NOTAPPROVED",
        label: "Not Approved",
        color: "orange",
        currentLevel: 1,
        levelLogs: [],
      };
    }
    return {
      status: "NOT_CONFIGURED",
      label: "No Approval",
      color: "gray",
      currentLevel: null,
      levelLogs: [],
    };
  }

  const base = {
    currentLevel: log.currentLevel,
    levelLogs: log.LevelLogs ?? [],
    remarks: log.remarks,
  };

  switch (log.status) {
    case "APPROVED":
      return { ...base, status: "APPROVED", label: "Approved", color: "green" };
    case "REJECTED":
      return { ...base, status: "REJECTED", label: "Rejected", color: "red" };
    case "PENDING":
      return {
        ...base,
        status: "PENDING",
        label: `PENDING`,
        color: "orange",
      };
    case "NOTAPPROVED":
      return {
        ...base,
        status: "NOTAPPROVED",
        label: "Not Approved",
        color: "orange",
      };
    default:
      return { ...base, status: "UNKNOWN", label: "Unknown", color: "gray" };
  }
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
    pageId,
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
      _count: {
        select: {
          inwardItems: true,
          purchaseCancelItems: true,
        },
      },
      inwardItems: { select: { inwardQty: true } },
      purchaseCancelItems: { select: { cancelQty: true } },
    },
    orderBy: {
      docId: "desc",
    },
  });
  data = manualFilterSearchData(searchDate, searchDueDate, searchPoType, data);
  const poIds = data.map((po) => po.id);
  const approvalConfig = await prisma.approvalConfig.findUnique({
    where: {
      branchId_pageId: {
        branchId: parseInt(branchId),
        pageId: parseInt(pageId), // 80
      },
    },
    select: { id: true, active: true },
  });

  const isApprovalConfigured = approvalConfig?.active === true;
  const approvalLogs = await prisma.approvalLog.findMany({
    where: {
      referencePage: "PURCHASE ORDER",
      referenceId: { in: poIds },
    },
    select: {
      id: true,
      referenceId: true,
      status: true,
      remarks: true,
      currentLevel: true,
      LevelLogs: {
        select: {
          action: true,
          levelNo: true,
          userId: true,
          createdAt: true,
          User: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  const approvalLogMap = approvalLogs.reduce((acc, log) => {
    acc[log.referenceId] = log;
    return acc;
  }, {});
  const totalCount = data.length;
  let docId = finYearDate
    ? await getNextDocId(
      branchId,
      shortCode,
      finYearDate?.startDateStartTime,
      finYearDate?.endDateEndTime,
    )
    : "";
  return {
    statusCode: 0,
    data: data.map((po) => {
      const log = approvalLogMap[po.id] ?? null;
      return {
        ...po,
        status: getPOStatus(po),
        approvalStatus: getPOApprovalStatus(log, isApprovalConfigured),
        childRecord: po._count.inwardItems + po._count.purchaseCancelItems,
      };
    }),
    nextDocId: docId,
    totalCount,
  };
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
  const PO_PAGE = await prisma.page.findFirst({
    where: {
      name: "PURCHASE ORDER",
    },
    select: {
      id: true,
    },
  });
  const PO_PAGE_ID = PO_PAGE?.id;
  const [childRecordInward, childRecordCancel, approvalLog, approvalConfig] =
    await Promise.all([
      prisma.inwardItems.count({ where: { poId: po.id } }),
      prisma.purchaseCancelItems.count({ where: { poId: po.id } }),
      prisma.approvalLog.findFirst({
        where: {
          referenceId: parseInt(id),
          referencePage: "PURCHASE ORDER",
        },
        select: {
          id: true,
          status: true,
          currentLevel: true,
          ApprovalConfig: {
            select: {
              approvalLevels: {
                orderBy: { levelNo: "asc" },
                select: {
                  id: true,
                  levelNo: true,
                  approveType: true,
                  condition: true,
                  LevelUsers: {
                    select: {
                      userId: true,
                      User: { select: { id: true, username: true } },
                    },
                  },
                },
              },
            },
          },
          LevelLogs: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              levelNo: true,
              action: true,
              remarks: true,
              createdAt: true,
              User: { select: { id: true, username: true } },
            },
          },
        },
      }),
      prisma.approvalConfig.findFirst({
        where: {
          pageId: PO_PAGE_ID, // 80
          branchId: po.branchId, // use branchId from the fetched po
          active: true,
        },
        select: { id: true },
      }),
    ]);

  const isApprovalConfigured = !!approvalConfig;

  return {
    statusCode: 0,
    data: {
      ...po,
      childRecordInward,
      childRecordCancel,
      approvalStatus: getPOApprovalStatus(approvalLog, isApprovalConfigured),
      approvalLog: approvalLog ?? null,
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
      pageId,
      totalNetAmount,
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
        itemGroupId: itemDetails?.itemGroupId
          ? parseInt(itemDetails.itemGroupId)
          : null,
        sizeId: itemDetails?.sizeId ? parseInt(itemDetails.sizeId) : null,
        colorId: itemDetails?.colorId ? parseInt(itemDetails.colorId) : null,
        gsmId: itemDetails?.gsmId ? parseInt(itemDetails.gsmId) : null,
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
    termsId,
    payTermId,
    isNewVersion,
    quoteVersion,
    submitApproval,
    pageId,
  } = await body;
  console.log(submitApproval, "submitApproval");
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
        // poItems: {
        //   createMany: {
        //     data: poItems
        //       .filter((i) => i["quoteVersion"] == "New")
        //       .map((temp) => {
        //         let newItem = {};
        //         newItem["styleItemId"] = parseInt(temp["styleItemId"]);
        //         newItem["uomId"] = temp["uomId"];
        //         newItem["hsnId"] = temp["hsnId"]
        //           ? parseInt(temp["hsnId"])
        //           : null;
        //         newItem["qty"] = parseFloat(temp["qty"]);
        //         newItem["price"] = parseFloat(temp["price"]);
        //         newItem["discountType"] = temp["discountType"];
        //         newItem["discountValue"] = parseFloat(
        //           temp["discountValue"] || 0,
        //         );
        //         newItem["taxPercent"] = parseFloat(temp["taxPercent"] || 0);
        //         newItem["quoteVersion"] = parseInt(currentQuoteVersion + 1);
        //         newItem["itemGroupId"] = temp["itemGroupId"]
        //           ? parseInt(temp["itemGroupId"])
        //           : null;
        //         newItem["sizeId"] = temp["sizeId"]
        //           ? parseInt(temp["sizeId"])
        //           : null;
        //         newItem["colorId"] = temp["colorId"]
        //           ? parseInt(temp["colorId"])
        //           : null;
        //         return newItem;
        //       }),
        //   },
        // },
      },
    });
    await updatePoItems(
      tx,
      poItems,
      data,
      quoteVersion,
      currentQuoteVersion,
      isNewVersion,
    );
    if (submitApproval) {
      await createApprovalLog(
        tx,
        branchId,
        pageId,
        data.id,
        "PURCHASE ORDER",
        {
          true: true,
        },
        data?.docId,
        userId,
      );
    }
  });
  return { statusCode: 0, data };
}

async function updatePoItems(
  tx,
  poItems,
  po,
  quoteVersion,
  currentQuoteVersion,
  isNewVersion,
) {
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
          itemGroupId: itemDetails?.itemGroupId
            ? parseInt(itemDetails.itemGroupId)
            : null,
          sizeId: itemDetails?.sizeId ? parseInt(itemDetails.sizeId) : null,
          colorId: itemDetails?.colorId ? parseInt(itemDetails.colorId) : null,
          gsmId: itemDetails?.gsmId ? parseInt(itemDetails.gsmId) : null,
          quoteVersion: isNewVersion
            ? currentQuoteVersion + 1
            : parseInt(quoteVersion),
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
          quoteVersion: isNewVersion
            ? currentQuoteVersion + 1
            : parseInt(quoteVersion),
          itemGroupId: itemDetails?.itemGroupId
            ? parseInt(itemDetails.itemGroupId)
            : null,
          sizeId: itemDetails?.sizeId ? parseInt(itemDetails.sizeId) : null,
          colorId: itemDetails?.colorId ? parseInt(itemDetails.colorId) : null,
          gsmId: itemDetails?.gsmId ? parseInt(itemDetails.gsmId) : null,
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
  searchDocDate,
  searchDueDate,
  poType,
  data,
) {
  const inwardTypeKey = poType ? poType.split(" ")[0].toUpperCase() : "";
  return data.filter(
    (item) =>
      (searchDocDate
        ? String(getDateFromDateTime(item.Po.docDate)).includes(searchDocDate)
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

  // 1️⃣ Find max quoteVersion per poId
  const maxVersionByPo = {};

  for (const item of results) {
    const poId = item.poId;
    if (!maxVersionByPo[poId] || item.quoteVersion > maxVersionByPo[poId]) {
      maxVersionByPo[poId] = item.quoteVersion;
    }
  }

  // 2️⃣ Keep only rows of max version AND balQty > 0
  const finalResult = results.filter(
    (item) =>
      item.quoteVersion === maxVersionByPo[item.poId] && item.balQty > 0,
  );

  return finalResult;
}

async function getPoItemById(id) {
  const data = await prisma.poItems.findUnique({
    where: { id: parseInt(id) },
    include: {
      Po: { select: { docId: true, dueDate: true, docDate: true, id: true } },
      Uom: { select: { name: true } },
      StyleItem: { select: { name: true } },
      Hsn: { select: { name: true } },
      Size: { select: { name: true } },
      Color: { select: { name: true } },
      Gsm: { select: { name: true } },
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
      itemGroupId: data.itemGroupId,
      sizeId: data.sizeId,
      colorId: data.colorId,
      gsmId: data.gsmId,
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
      itemGroupId: data.itemGroupId,
      sizeId: data.sizeId,
      colorId: data.colorId,
      gsmId: data.gsmId,
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
        itemGroupId: data.itemGroupId,
        sizeId: data.sizeId,
        colorId: data.colorId,
        gsmId: data.gsmId,
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
      alreadyCancelQty: cancelQty,
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
    searchDocDate,
    searchInwardType,
    searchDueDate,
    poType,
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
            id: true,
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
      searchDocDate,
      searchDueDate,
      poType,
      data,
    );

    data = data?.filter((i) => i.Po.supplierId == supplierId);

    data = await getAllDataPoItems(data);
    // ✅ STEP 1: Get unique PO ids from filtered items
    const poIds = [...new Set(data.map((item) => item.Po.id))];
    const PO_PAGE = await prisma.page.findFirst({
      where: {
        name: "PURCHASE ORDER",
      },
      select: {
        id: true,
      },
    });
    const PO_PAGE_ID = PO_PAGE?.id;
    const [approvalLogs, approvalConfig] = await Promise.all([
      prisma.approvalLog.findMany({
        where: {
          referencePage: "PURCHASE ORDER",
          referenceId: { in: poIds },
        },
        select: {
          referenceId: true,
          status: true,
          currentLevel: true,
        },
      }),
      prisma.approvalConfig.findFirst({
        where: {
          pageId: PO_PAGE_ID, // 80
          branchId: parseInt(branchId),
          active: true,
        },
        select: { id: true },
      }),
    ]);

    const isApprovalConfigured = !!approvalConfig;

    const approvalLogMap = approvalLogs.reduce((acc, log) => {
      acc[log.referenceId] = log;
      return acc;
    }, {});

    data = data.map((item) => {
      const log = approvalLogMap[item.Po.id] ?? null;
      return {
        ...item,
        approvalStatus: getPOApprovalStatus(log, isApprovalConfigured),
      };
    });

    // If approval is configured: only let APPROVED items through
    // If not configured at all: let everything through
    data = data.filter((item) =>
      isApprovalConfigured ? item.approvalStatus.status === "APPROVED" : true,
    );
  } else {
    data = await prisma.poItems.findMany({
      where: {
        branchId: branchId ? parseInt(branchId) : undefined,
        active: active ? Boolean(active) : undefined,
      },
    });
  }
  totalCount = data.length;
  return { statusCode: 0, data, totalCount };
}

async function createApproveStatus(body) {
  try {
    const {
      userId,
      remarks,
      recordData,
      referencePage,
      referenceId,
      actionType,
    } = body;
    if (!userId) {
      return res.json({ statusCode: 1, message: "userId is required" });
    }
    if (actionType === "REJECT" && !remarks?.trim()) {
      return { statusCode: 1, message: "Remarks required for rejection" };
    }
    let result;
    if (actionType === "APPROVE") {
      result = await approveRecord(
        referenceId,
        referencePage,
        userId,
        remarks,
        recordData ?? { true: true },
      );
    } else {
      result = await rejectRecord(referenceId, referencePage, userId, remarks);
    }
    return result;
  } catch (err) {
    return {
      statusCode: 400,
      message: err.message,
    };
  }
}

export {
  get,
  getOne,
  getSearch,
  create,
  update,
  remove,
  getPoItems,
  createApproveStatus,
};

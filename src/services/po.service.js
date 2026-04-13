import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getDateFromDateTime,
  getDateTimeRange,
  getYearShortCodeForFinYear,
} from "../utils/helper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import {
  approveRecord,
  createApprovalLog,
  rejectRecord,
  evaluateConfigTrigger,
  getTriggeredConfig,
  getModuleApprovalSetup,
  applyOperator,
  getValueByPath,
  buildIncludeForModule, // ✅ single universal helper
} from "../utils/approvalHelper.js";

const REFERENCE_PAGE = "PURCHASE ORDER";

// ── Doc ID ────────────────────────────────────────────────────────────────────
async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.po.findFirst({
    where: {
      branchId: parseInt(branchId),
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });
  const branchObj = await getTableRecordWithId(branchId, "branch");
  let newDocId = `${branchObj.branchCode}/${shortCode}/PO/1`;
  if (lastObject) {
    newDocId = `${branchObj.branchCode}/${shortCode}/PO/${parseInt(lastObject.docId.split("/").at(-1)) + 1}`;
  }
  return newDocId;
}

// ── Filters ───────────────────────────────────────────────────────────────────
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

// ── PO Status ─────────────────────────────────────────────────────────────────
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

// ── Approval Status ───────────────────────────────────────────────────────────
function getPOApprovalStatus(log, isApprovalConfigured = false) {
  if (!log) {
    return isApprovalConfigured
      ? {
          status: "NOTAPPROVED",
          label: "Not Approved",
          color: "orange",
          currentLevel: 1,
          levelLogs: [],
        }
      : {
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
  const map = {
    APPROVED: {
      ...base,
      status: "APPROVED",
      label: "Approved",
      color: "green",
    },
    REJECTED: { ...base, status: "REJECTED", label: "Rejected", color: "red" },
    PENDING: { ...base, status: "PENDING", label: "Pending", color: "orange" },
    NOTAPPROVED: {
      ...base,
      status: "NOTAPPROVED",
      label: "Not Approved",
      color: "orange",
    },
  };
  return (
    map[log.status] ?? {
      ...base,
      status: "UNKNOWN",
      label: "Unknown",
      color: "gray",
    }
  );
}

// ── In-memory config evaluator (avoids N DB calls in list) ────────────────────
function evaluateConfigs(activeConfigs, record) {
  if (!activeConfigs?.length) return false;

  // ✅ Only valid configs with levels + users, sorted by priority
  const valid = activeConfigs
    .filter(
      (c) =>
        c.approvalLevels?.length > 0 &&
        c.approvalLevels.some((l) => l.LevelUsers?.length > 0),
    )
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  // ✅ Use shared evaluator — same logic as getTriggeredConfig for consistency
  return valid.some((config) => evaluateConfigTrigger(config, record));
}

// ── GET LIST ──────────────────────────────────────────────────────────────────
async function get(req) {
  const {
    branchId,
    active,
    finYearId,
    searchPoType,
    searchDueDate,
    supplierId,
    startDate,
    endDate,
    filterParties,
    supplier,
    searchSupplierAliasName,
    serachDocNo,
    searchDate,
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
                { createdAt: { gte: finYearDate.startDateStartTime } },
                { createdAt: { lte: finYearDate.endDateEndTime } },
              ]
            : undefined,
        },
        {
          AND:
            startDate && endDate
              ? [
                  { createdAt: { gte: startDateStartTime } },
                  { createdAt: { lte: endDateEndTime } },
                ]
              : undefined,
        },
      ],
      branchId: branchId ? parseInt(branchId) : undefined,
      active: active ? Boolean(active) : undefined,
      docId: Boolean(serachDocNo) ? { contains: serachDocNo } : undefined,
      OR:
        supplierId || Boolean(filterParties)
          ? [
              { supplierId: supplierId ? parseInt(supplierId) : undefined },
              {
                supplierId: Boolean(filterParties)
                  ? { in: filterParties.split(",").map((i) => parseInt(i)) }
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
      Supplier: { select: { aliasName: true, name: true } },
      poItems: true,
      _count: { select: { inwardItems: true, purchaseCancelItems: true } },
      inwardItems: { select: { inwardQty: true } },
      purchaseCancelItems: { select: { cancelQty: true } },
    },
    orderBy: { docId: "desc" },
  });

  data = manualFilterSearchData(searchDate, searchDueDate, searchPoType, data);
  const poIds = data.map((po) => po.id);

  // ✅ Universal setup check — works whether PO has rules or not
  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    branchId,
  );

  const approvalLogs = await prisma.approvalLog.findMany({
    where: { referencePage: REFERENCE_PAGE, referenceId: { in: poIds } },
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

  // ✅ Only fetch configs if approval is set up for this form
  const activeConfigs =
    hasApproval && module
      ? await prisma.approvalConfig.findMany({
          where: {
            moduleId: module.id,
            branchId: parseInt(branchId),
            active: true,
          },
          include: {
            ConfigConditions: {
              include: { Field: true, Operator: true, CompareField: true },
            },
            approvalLevels: {
              include: { LevelUsers: true },
              orderBy: { levelNo: "asc" },
            },
          },
          // orderBy: { priority: "asc" },
        })
      : [];

  const nextDocId = finYearDate
    ? await getNextDocId(
        branchId,
        shortCode,
        finYearDate?.startDateStartTime,
        finYearDate?.endDateEndTime,
      )
    : "";

  // purchaseOrder.service.js — FIX in get()
  const resolvedData = data.map((po) => {
    const log = approvalLogMap[po.id] ?? null;

    // ✅ PRIORITY: If log exists → use log.status (single source of truth)
    // Only evaluate configs if NO log exists yet (to decide if rule would trigger)
    let shouldTrigger = false;
    if (!log && hasApproval && activeConfigs.length > 0) {
      shouldTrigger = evaluateConfigs(activeConfigs, po);
    }

    return {
      ...po,
      status: getPOStatus(po),
      // If log exists → derive from log; otherwise from shouldTrigger
      approvalStatus: getPOApprovalStatus(log, !!log || shouldTrigger),
      childRecord: po._count.inwardItems + po._count.purchaseCancelItems,
    };
  });

  return {
    statusCode: 0,
    data: resolvedData,
    nextDocId,
    totalCount: data.length,
  };
}

// ── GET ONE ───────────────────────────────────────────────────────────────────
async function getOne(id) {
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
          City: { select: { name: true } },
        },
      },
      DeliveryParty: {
        select: { name: true, address: true, contactPersonName: true },
      },
      DeliveryBranch: {
        select: { branchName: true, contactName: true, address: true },
      },
    },
  });
  if (!po) return NoRecordFound("po");

  po.poItems =
    po.poItems?.map((item) => {
      const qty = parseFloat(item.qty) || 0;
      const req = parseFloat(item?.RequirementPlanningItems?.requiredQty) || 0;
      return { ...item, balanceQty: Math.max(0, req - qty), requiredQty: req };
    }) || [];

  // ✅ Universal setup check
  const { hasApproval, module } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    po.branchId,
  );

  const [childRecordInward, childRecordCancel, approvalLog] = await Promise.all(
    [
      prisma.inwardItems.count({ where: { poId: po.id } }),
      prisma.purchaseCancelItems.count({ where: { poId: po.id } }),
      prisma.approvalLog.findFirst({
        where: { referenceId: parseInt(id), referencePage: REFERENCE_PAGE },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          currentLevel: true,
          remarks: true,
          ApprovalConfig: {
            select: {
              approvalLevels: {
                orderBy: { levelNo: "asc" },
                select: {
                  id: true,
                  levelNo: true,
                  approveType: true,
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
    ],
  );

  return {
    statusCode: 0,
    data: {
      ...po,
      childRecordInward,
      childRecordCancel,
      // ✅ isApprovalConfigured = hasApproval from universal check
      approvalStatus: getPOApprovalStatus(approvalLog, hasApproval),
      approvalLog: approvalLog ?? null,
    },
  };
}

async function getSearch(req) {
  const { active } = req.query;
  const { searchKey } = req.params;
  const data = await prisma.po.findMany({
    where: {
      active: active ? Boolean(active) : undefined,
      OR: [{ docId: { contains: searchKey } }],
    },
  });
  return { statusCode: 0, data };
}

export function getPoItemObject(poMaterial, item) {
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
  newItem.requirementPlanningItemsId = item?.RequirementPlanningItemsId
    ? parseInt(item.RequirementPlanningItemsId)
    : undefined;
  newItem.orderId = item?.orderId ? parseInt(item.orderId) : undefined;
  newItem.orderDetailsId = item?.orderDetailsId
    ? parseInt(item.orderDetailsId)
    : undefined;
  newItem.uomId = item.uomId ? parseInt(item.uomId) : null;
  newItem.colorId = item.colorId ? parseInt(item.colorId) : undefined;
  newItem.qty = parseFloat(item.qty);
  newItem.price = parseFloat(item.price);
  newItem.discountType = item.discountType ?? null;
  newItem.discountValue = parseFloat(item.discountValue ?? 0);
  newItem.tax = parseFloat(item.tax ?? 0);
  newItem.taxPercent = parseFloat(item.taxPercent ?? 0);
  return newItem;
}

// ── CREATE ────────────────────────────────────────────────────────────────────
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

    // ✅ Single universal check OUTSIDE transaction — covers all 3 scenarios
    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
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
          quoteVersions: { create: { quoteVersion: 1 } },
          termsId: termsId ? parseInt(termsId) : null,
          payTermId: payTermId ? parseInt(payTermId) : null,
        },
      });

      await createPoItems(tx, poItems, data);

      // ✅ Only runs if: module exists AND active config exists for this branch
      // If PO has no rules configured → hasApproval=false → skipped, form saves normally
      if (hasApproval && module) {
        // ✅ Dynamic include — pulls every relation any Field master references
        const includeClause = await buildIncludeForModule(module.id);

        const fullRecord = await tx.po.findUnique({
          where: { id: data.id },
          include: includeClause, // ← { Supplier: true, poItems: true, inwardItems: true, ... }
        });

        await createApprovalLog(
          tx,
          branchId,
          module.id,
          data.id,
          REFERENCE_PAGE,
          fullRecord,
          data.docId,
          userId,
        );
      }
    });

    return { statusCode: 0, data };
  } catch (err) {
    return { statusCode: 400, message: err.message };
  }
}

async function createPoItems(tx, poItems, po) {
  return Promise.all(
    poItems.map(async (itemDetails) => {
      const qty = itemDetails?.qty
        ? Math.round(parseFloat(itemDetails.qty))
        : null;
      return await tx.poItems.create({
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
    }),
  );
}

function findRemovedItems(dataFound, poItems) {
  return dataFound.poItems.filter(
    (oldItem) =>
      !poItems.find((newItem) => parseInt(newItem.id) === parseInt(oldItem.id)),
  );
}

// ── UPDATE ────────────────────────────────────────────────────────────────────
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
  } = await body;

  const dataFound = await prisma.po.findUnique({
    where: { id: parseInt(id) },
    include: { poItems: true, quoteVersions: true },
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

  // ✅ Universal check — only when resubmitting, skip otherwise
  const { module, hasApproval } = submitApproval
    ? await getModuleApprovalSetup(REFERENCE_PAGE, branchId)
    : { module: null, hasApproval: false };

  let data;
  await prisma.$transaction(async (tx) => {
    if (removeItemsIds.length > 0) {
      await tx.poItems.deleteMany({ where: { id: { in: removeItemsIds } } });
    }

    data = await tx.po.update({
      where: { id: parseInt(id) },
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
          ? { create: { quoteVersion: currentQuoteVersion + 1 } }
          : undefined,
        termsId: termsId ? parseInt(termsId) : null,
        payTermId: payTermId ? parseInt(payTermId) : null,
      },
    });

    if (isNewVersion) {
      await createNewVersionItems(
        tx,
        poItems,
        data.id,
        currentQuoteVersion + 1,
      );
    } else {
      await updatePoItems(
        tx,
        poItems,
        data,
        quoteVersion,
        currentQuoteVersion,
        isNewVersion,
      );
    }

    // ✅ Only runs if resubmitting AND approval is configured for this form
    if (submitApproval && hasApproval && module) {
      // Clear old rejected/notapproved log so user can resubmit cleanly
      await tx.approvalLog.deleteMany({
        where: {
          referenceId: parseInt(id),
          referencePage: REFERENCE_PAGE,
          status: { in: ["REJECTED", "NOTAPPROVED"] },
        },
      });

      const includeClause = await buildIncludeForModule(module.id);

      const fullRecord = await tx.po.findUnique({
        where: { id: data.id },
        include: includeClause, // ← { Supplier: true, poItems: true, inwardItems: true, ... }
      });

      await createApprovalLog(
        tx,
        branchId,
        module.id,
        data.id,
        REFERENCE_PAGE,
        fullRecord,
        data.docId,
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
  return Promise.all(
    poItems.map(async (itemDetails) => {
      const qty = itemDetails?.qty
        ? Math.round(parseFloat(itemDetails.qty))
        : null;
      if (itemDetails.id) {
        return await tx.poItems.update({
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
            colorId: itemDetails?.colorId
              ? parseInt(itemDetails.colorId)
              : null,
            gsmId: itemDetails?.gsmId ? parseInt(itemDetails.gsmId) : null,
            quoteVersion: isNewVersion
              ? currentQuoteVersion + 1
              : parseInt(quoteVersion),
          },
        });
      } else {
        return await tx.poItems.create({
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
            colorId: itemDetails?.colorId
              ? parseInt(itemDetails.colorId)
              : null,
            gsmId: itemDetails?.gsmId ? parseInt(itemDetails.gsmId) : null,
          },
        });
      }
    }),
  );
}

async function createNewVersionItems(tx, poItems, poId, version) {
  return await tx.poItems.createMany({
    data: poItems
      .filter((i) => i["quoteVersion"] === "New")
      .map((temp) => ({
        poId,
        styleItemId: temp.styleItemId ? parseInt(temp.styleItemId) : null,
        uomId: temp.uomId ? parseInt(temp.uomId) : null,
        hsnId: temp.hsnId ? parseInt(temp.hsnId) : null,
        qty: parseFloat(temp.qty),
        price: parseFloat(temp.price),
        discountType: temp.discountType,
        discountValue: parseFloat(temp.discountValue || 0),
        taxPercent: parseFloat(temp.taxPercent || 0),
        quoteVersion: version,
        itemGroupId: temp.itemGroupId ? parseInt(temp.itemGroupId) : null,
        sizeId: temp.sizeId ? parseInt(temp.sizeId) : null,
        colorId: temp.colorId ? parseInt(temp.colorId) : null,
        gsmId: temp.gsmId ? parseInt(temp.gsmId) : null,
      })),
  });
}

// ── REMOVE ────────────────────────────────────────────────────────────────────
async function remove(id) {
  const poId = parseInt(id);
  return await prisma.$transaction(async (tx) => {
    // Safe even if no approval logs exist
    await tx.approvalLog.deleteMany({
      where: { referencePage: REFERENCE_PAGE, referenceId: poId },
    });
    const data = await tx.po.delete({ where: { id: poId } });
    return { statusCode: 0, data };
  });
}

// ── GET PO ITEMS (for inward selection) ───────────────────────────────────────
async function getAllDataPoItems(data) {
  const results = await Promise.all(
    data?.map(async (item) => {
      const res = await getPoItemById(item.id);
      return res.data;
    }),
  );
  const maxVersionByPo = {};
  for (const item of results) {
    const poId = item.poId;
    if (!maxVersionByPo[poId] || item.quoteVersion > maxVersionByPo[poId]) {
      maxVersionByPo[poId] = item.quoteVersion;
    }
  }
  return results.filter(
    (item) =>
      item.quoteVersion === maxVersionByPo[item.poId] && item.balQty > 0,
  );
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

  const [inwardItems, cancelItems] = await Promise.all([
    prisma.inwardItems.findMany({
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
      select: { purchaseInwardId: true, inwardQty: true },
    }),
    prisma.purchaseCancelItems.findMany({
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
      select: { cancelQty: true },
    }),
  ]);

  const inwardQty = inwardItems.reduce(
    (sum, item) => sum + (item.inwardQty ?? 0),
    0,
  );
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
    pagination,
    searchDocId,
    searchDocDate,
    searchDueDate,
    poType,
  } = req.query;

  let data;
  let totalCount;

  if (pagination) {
    data = await prisma.poItems.findMany({
      where: {
        Po: {
          docId: Boolean(searchDocId) ? { contains: searchDocId } : undefined,
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
        Uom: { select: { name: true } },
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

    const poIds = [...new Set(data.map((item) => item.Po.id))];

    // ✅ Universal check — if PO has no approval config, all items pass through
    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );

    const approvalLogs = hasApproval
      ? await prisma.approvalLog.findMany({
          where: { referencePage: REFERENCE_PAGE, referenceId: { in: poIds } },
          select: { referenceId: true, status: true, currentLevel: true },
        })
      : [];

    const approvalLogMap = approvalLogs.reduce((acc, log) => {
      acc[log.referenceId] = log;
      return acc;
    }, {});

    data = data.map((item) => ({
      ...item,
      approvalStatus: getPOApprovalStatus(
        approvalLogMap[item.Po.id] ?? null,
        hasApproval,
      ),
    }));

    // ✅ If approval not configured for PO → let ALL items through
    // If configured → only APPROVED items pass to inward
    data = data.filter((item) =>
      hasApproval ? item.approvalStatus.status === "APPROVED" : true,
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

// ── APPROVE / REJECT ──────────────────────────────────────────────────────────
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

    if (!userId) return { statusCode: 1, message: "userId is required" };
    if (actionType === "REJECT" && !remarks?.trim()) {
      return { statusCode: 1, message: "Remarks required for rejection" };
    }

    if (actionType === "APPROVE") {
      return await approveRecord(
        referenceId,
        referencePage,
        userId,
        remarks,
        recordData ?? {},
      );
    } else if (actionType === "REJECT") {
      return await rejectRecord(referenceId, referencePage, userId, remarks);
    }

    return { statusCode: 1, message: "Invalid action type" };
  } catch (err) {
    return { statusCode: 400, message: err.message };
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

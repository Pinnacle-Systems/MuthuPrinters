import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getDateFromDateTime,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import {
  buildIncludeForModule,
  createApprovalLog,
  evaluateConfigs,
  getApprovalStatus,
  getModuleApprovalSetup,
} from "../utils/approvalHelper.js";
import { orderEntry } from "../routes/index.js";
const REFERENCE_PAGE = "JOB CARD";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  const lastObject = await prisma.jobCard.findFirst({
    where: {
      branchId: parseInt(branchId),
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");
  let newDocId = `${branchObj.branchCode}/${shortCode}/JC/1`;

  if (lastObject) {
    const lastNo = parseInt(lastObject.docId.split("/").at(-1)) || 0;
    newDocId = `${branchObj.branchCode}/${shortCode}/JC/${lastNo + 1}`;
  }

  return newDocId;
}

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchProductionType,
    finYearId,
    searchCustomer,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  console.log("req",req?.query);
  
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

  let data = await prisma.jobCard.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
            { createdAt: { gte: finYearDate.startTime } },
            { createdAt: { lte: finYearDate.endTime } },
          ]
        : undefined,
      docId: searchDocNo ? { contains: searchDocNo } : undefined,
      productionType: searchProductionType
        ? { contains: searchProductionType }
        : undefined,
      customer: {
        name: searchCustomer ? { contains: searchCustomer } : undefined,
      },
    },
    include: {
      customer: { select: { id: true, name: true } },
      gsm: { select: { id: true, name: true } },
      _count: {
        select: {
          productionAllocations: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });
  if (searchDocDate) {
    data = data.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
    );
  }
  let totalCount = data.length;

  // if (pagination) {
  //   data = data.slice(
  //     (pageNumber - 1) * parseInt(dataPerPage),
  //     pageNumber * dataPerPage,
  //   );
  // }

  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    branchId,
  );

  // ── fetch all relevant approval logs in one query ─────────────────────────
  const jobCardIds = data.map((o) => o.id);

  const approvalLogs = await prisma.approvalLog.findMany({
    where: { referencePage: REFERENCE_PAGE, referenceId: { in: jobCardIds } },
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

  // ── fetch active configs only if approval is set up ───────────────────────
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
        })
      : [];

  // ── resolve approval status per record ───────────────────────────────────
  let resolvedData = data.map((jobCard) => {
    const log = approvalLogMap[jobCard.id] ?? null;

    let shouldTrigger = false;
    if (!log && hasApproval && activeConfigs.length > 0) {
      shouldTrigger = evaluateConfigs(activeConfigs, jobCard);
    }

    return {
      ...jobCard,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
      childRecord: jobCard._count.productionAllocations,
    };
  });

  if (pagination) {
    resolvedData = resolvedData.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return { statusCode: 0, data: resolvedData, nextDocId: newDocId, totalCount };
}

async function getJobCardList(req) {
  const { branchId, companyId } = req.query;

  let result = await prisma.jobCard.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
    },
    select: {
      id: true,
      docId: true,
      orderQty: true,
      styleItemId: true,
      customer: { select: { name: true } },
      processRoute: {
        orderBy: {
          sequence: "asc",
        },
      },
      OrderEntry: { select: { docId: true } },
      StyleItem: { select: { name: true } },
      productionAllocations: {
        select: {
          id: true,
          docId: true,
        },
      },
    },
    orderBy: {
      docId: "desc",
    },
  });

  console.log("Job Card List Result:", result?.processRoute);

  const data = result.map((item) => ({
    id: item.id,
    docId: item.docId,
    orderQty: item.orderQty,
    styleItemId: item.styleItemId,
    styleItemName: item.StyleItem?.name || "",
    customerName: item.customer?.name || "",

    orderEntryDocId: item.OrderEntry?.docId || "",

    processRoute: item.processRoute || [],
    productionAllocationId: item.productionAllocations?.[0]?.id || null,
  }));

  return { statusCode: 0, data };
}

async function getOne(id) {
  const data = await prisma.jobCard.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: { select: { id: true, name: true } },
      gsm: { select: { id: true, name: true } },
      Branch: { select: { branchName: true } },
      Plate: { select: { id: true, name: true } },
      Die: { select: { id: true, name: true } },
      boardQualities: {
        include: { Board: { select: { id: true, name: true } } },
      },
      processDetails: {
        include: { Process: { select: { id: true, name: true } } },
      },
      laminationDetails: {
        include: { Lamination: { select: { id: true, name: true } } },
      },
      varnishDetails: {
        include: { Varnish: { select: { id: true, name: true } } },
      },
      machineDetails: {
        include: { Machine: { select: { id: true, name: true } } },
      },
      processRoute: {
        include: { Process: { select: { id: true, name: true } } },
        orderBy: { sequence: "asc" },
      },
      jobCardSizeDetails: true,
      printingDetails: true,
      finishingProcesses: true,
      plateDetails: true,
      _count: {
        select: {
          productionAllocations: true,
        },
      },
    },
  });

  if (!data) return NoRecordFound("Job Card");
  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    data.branchId,
  );
  let log = null;
  let shouldTrigger = false;

  if (hasApproval && module) {
    // 🔹 get approval log for this record
    log = await prisma.approvalLog.findFirst({
      where: {
        referencePage: REFERENCE_PAGE,
        referenceId: data.id,
      },
      include: {
        LevelLogs: {
          include: {
            User: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // 🔹 if no log → check config condition
    if (!log) {
      const activeConfigs = await prisma.approvalConfig.findMany({
        where: {
          moduleId: module.id,
          branchId: parseInt(branchId || data.branchId),
          active: true,
        },
        include: {
          ConfigConditions: {
            include: {
              Field: true,
              Operator: true,
              CompareField: true,
            },
          },
        },
      });

      if (activeConfigs.length > 0) {
        shouldTrigger = evaluateConfigs(activeConfigs, data);
      }
    }
  }
  return {
    statusCode: 0,
    data: {
      ...data,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
      approvalLog: log,
      childRecord: data._count.productionAllocations,
    },
  };
}

// ─────────────────────────────────────────────
// SAFE ARRAY PARSER (NO JSON ERRORS)
// ─────────────────────────────────────────────
function safeArray(val) {
  // already array
  if (Array.isArray(val)) return val;

  // null / undefined / empty
  if (!val) return [];

  // string "undefined"
  if (val === "undefined") return [];

  // ONLY parse if it's actually a string
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (err) {
      console.warn("⚠️ JSON Parse Failed:", val);
      return [];
    }
  }

  // fallback
  return [];
}

async function create(body) {
  try {
    const {
      userId,
      branchId,
      finYearId,
      docDate,
      orderEntryId,
      orderType,
      orderQty,
      customerId,
      gsmId,
      boardId,
      fullBoardId,
      noOfPockets,
      cuttingSizeId,
      runningQty,
      isFourColor,
      isCutColor,
      isFront,
      isFrontAndBack,
      isCMYK,
      isCutColMachine,
      isFrontMachine,
      isFrontBackMachine,
      plateId,
      dieId,
      totalPlatesets,
      remarks,
      designerId,
      tagCardUps,
      jobRunTime,
      productionType,
      styleItemId,
      itemGroupId,
      itemType,
      followUpId,
      labelQuality,
      block,
      labelQty,
      rollQty,
      cutAndSeal,
      // Arrays
      boardItems,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
      trackingType,
      jobCardSizeDetails,
      selectedPrinting,
      selectedFinishing,
      orderItemId,
      plateDetails,
      labelSizeId,
      totalMeter,
      blockDate,
      isRepeatedJobCard,
      refJobCardId,
    } = body;

    // ─────────────────────────────
    // ✅ SAFE ARRAYS
    // ─────────────────────────────
    const safeBoardItems = safeArray(boardItems);
    const safeProcesses = safeArray(selectedProcesses);
    const safeLaminations = safeArray(laminations);
    const safeVarnishes = safeArray(varnishes);
    const safeMachines = safeArray(selectedMachines);
    const safeProcessRoute = safeArray(processRoute);
    const safeJobCardSizeDetails = safeArray(jobCardSizeDetails);
    const safeSelectedPrinting = safeArray(selectedPrinting);
    const safePlateDetails = safeArray(plateDetails);
    const safeFinishingDetails = safeArray(selectedFinishing);

    // ─────────────────────────────
    // FIN YEAR + DOC ID
    // ─────────────────────────────
    let finYearDate = await getFinYearStartTimeEndTime(finYearId);

    const shortCode = finYearDate
      ? getYearShortCodeForFinYear(
          finYearDate.startDateStartTime,
          finYearDate.endDateEndTime,
        )
      : "";

    const newDocId = await getNextDocId(
      branchId,
      shortCode,
      finYearDate?.startDateStartTime,
      finYearDate?.endDateEndTime,
    );

    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );
    let data;

    await prisma.$transaction(async (tx) => {
      data = await tx.jobCard.create({
        data: {
          docId: newDocId,
          docDate: docDate ? new Date(docDate) : null,

          createdById: Number(userId),
          branchId: Number(branchId),

          orderEntryId: orderEntryId ? Number(orderEntryId) : null,
          orderType: orderType || null,
          orderQty: orderQty ? parseInt(orderQty) : null,
          orderItemId: orderItemId ? Number(orderItemId) : null,
          customerId: customerId ? Number(customerId) : null,

          gsmId: gsmId ? Number(gsmId) : null,
          boardId: boardId ? Number(boardId) : null,

          fullBoardId: fullBoardId ? Number(fullBoardId) : null,
          noOfPockets: noOfPockets ? parseInt(noOfPockets) : null,
          cuttingSizeId: cuttingSizeId ? Number(cuttingSizeId) : null,
          runningQty: runningQty ? parseInt(runningQty) : null,

          isFourColor: !!isFourColor,
          isCutColor: !!isCutColor,
          isFront: !!isFront,
          isFrontAndBack: !!isFrontAndBack,

          isCMYK: !!isCMYK,
          isCutColMachine: !!isCutColMachine,
          isFrontMachine: !!isFrontMachine,
          isFrontBackMachine: !!isFrontBackMachine,

          plateId: plateId ? Number(plateId) : null,
          dieId: dieId ? Number(dieId) : null,
          totalPlatesets: totalPlatesets || null,

          remarks: remarks || null,
          designerId: designerId ? Number(designerId) : null,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime || null,
          productionType: productionType || null,
          styleItemId: styleItemId ? Number(styleItemId) : null,
          itemGroupId: itemGroupId ? Number(itemGroupId) : null,
          itemType: itemType || null,
          followUpId: followUpId ? Number(followUpId) : null,
          labelQuality: labelQuality || null,
          block: block || null,
          labelQty: labelQty ? parseInt(labelQty) : null,
          rollQty: rollQty ? parseInt(rollQty) : null,
          cutAndSeal: cutAndSeal || null,
          trackingType: trackingType || null,
          labelSizeId: labelSizeId ? Number(labelSizeId) : null,
          totalMeter: totalMeter ? parseInt(totalMeter) : null,
          blockDate: blockDate ? new Date(blockDate) : null,
          isRepeatedJobCard: !!isRepeatedJobCard,
          refJobCardId: refJobCardId ? Number(refJobCardId) : null,
          boardQualities: safeBoardItems.length
            ? {
                createMany: {
                  data: safeBoardItems.map((id) => ({
                    boardId: Number(id),
                  })),
                },
              }
            : undefined,

          printingDetails: safeSelectedPrinting.length
            ? {
                createMany: {
                  data: safeSelectedPrinting.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,

          plateDetails: safePlateDetails.length
            ? {
                createMany: {
                  data: safePlateDetails.map((p) => ({
                    plateName: p.plateName,
                    qty: p.qty ? Number(p.qty) : null,
                  })),
                },
              }
            : undefined,

          processDetails: safeProcesses.length
            ? {
                createMany: {
                  data: safeProcesses.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,

          laminationDetails: safeLaminations.length
            ? {
                createMany: {
                  data: safeLaminations.map((l) => ({
                    laminationId: Number(l.processId),
                    isFront: !!l.isFront,
                    isFrontAndBack: !!l.isFrontAndBack,
                  })),
                },
              }
            : undefined,

          varnishDetails: safeVarnishes.length
            ? {
                createMany: {
                  data: safeVarnishes.map((v) => ({
                    varnishId: Number(v.processId),
                    isFront: !!v.isFront,
                    isFrontAndBack: !!v.isFrontAndBack,
                  })),
                },
              }
            : undefined,

          machineDetails: safeMachines.length
            ? {
                createMany: {
                  data: safeMachines.map((id) => ({
                    macId: Number(id),
                  })),
                },
              }
            : undefined,

          processRoute: safeProcessRoute.length
            ? {
                createMany: {
                  data: safeProcessRoute.map((r, idx) => ({
                    processId: Number(r.processId || r.boardId),
                    type: r.type,
                    sequence: idx + 1,
                    isFront: !!r.isFront,
                    isFrontAndBack: !!r.isFrontAndBack,
                    status: "NOT_STARTED",
                  })),
                },
              }
            : undefined,

          jobCardSizeDetails: safeJobCardSizeDetails.length
            ? {
                createMany: {
                  data: safeJobCardSizeDetails.map((s) => ({
                    sizeId: s.sizeId ? Number(s.sizeId) : null,
                    qty: s.qty ? Number(s.qty) : null,
                    barcodeFrom: s.barcodeFrom || null,
                    barcodeTo: s.barcodeTo || null,
                  })),
                },
              }
            : undefined,

          finishingProcesses: safeFinishingDetails.length
            ? {
                createMany: {
                  data: safeFinishingDetails.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,
        },
      });
      if (hasApproval && module) {
        // ✅ Dynamic include — pulls every relation any Field master references
        const includeClause = await buildIncludeForModule(module.id);

        const fullRecord = await tx.jobCard.findUnique({
          where: { id: data.id },
          include: includeClause,
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

    console.log("✅ CREATED SUCCESS:", data);

    return { statusCode: 0, data };
  } catch (err) {
    console.error("❌ SERVICE ERROR:", err);
    return { statusCode: 1, message: err.message };
  }
}

async function update(id, body) {
  try {
    const {
      userId,
      branchId,
      docDate,
      orderEntryId,
      orderType,
      orderQty,
      customerId,
      gsmId,
      boardId,
      fullBoardId,
      noOfPockets,
      cuttingSizeId,
      runningQty,
      isFourColor,
      isCutColor,
      isFront,
      isFrontAndBack,
      isCMYK,
      isCutColMachine,
      isFrontMachine,
      isFrontBackMachine,
      plateId,
      dieId,
      totalPlatesets,
      remarks,
      designerId,
      tagCardUps,
      jobRunTime,
      boardItems,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
      submitApproval,
      productionType,
      styleItemId,
      itemGroupId,
      itemType,
      followUpId,
      labelQuality,
      block,
      labelQty,
      rollQty,
      cutAndSeal,
      trackingType,
      jobCardSizeDetails,
      orderItemId,
      selectedPrinting,
      plateDetails,
      labelSizeId,
      selectedFinishing,
      totalMeter,
      blockDate,
      isRepeatedJobCard,
      refJobCardId,
      isAmendment,
    } = body;
    const dataFound = await prisma.jobCard.findUnique({
      where: { id: parseInt(id) },
    });
    if (!dataFound) return NoRecordFound("Job Card");

    // const parsedBoardItems = parseJsonField(boardItems, []);
    // const parsedProcesses = parseJsonField(selectedProcesses, []);
    // const parsedLaminations = parseJsonField(laminations, []);
    // const parsedVarnishes = parseJsonField(varnishes, []);
    // const parsedMachines = parseJsonField(selectedMachines, []);
    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );
    let data;
    await prisma.$transaction(async (tx) => {
      // Delete all child records first, then recreate (simplest safe strategy)
      await tx.boardQuality.deleteMany({ where: { jobCardId: parseInt(id) } });
      await tx.printingDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.plateDetails.deleteMany({ where: { jobCardId: parseInt(id) } });
      await tx.processDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.laminationDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.varnishDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.machineDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.jobCardSizeBreakup.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.finishingProcess.deleteMany({
        where: { jobCardId: parseInt(id) },
      });

      if (processRoute.length > 0) {
        // Fetch current DB rows for this job card
        const existingRouteRows = await tx.processRoute.findMany({
          where: { jobCardId: parseInt(id) },
          select: {
            id: true,
            processId: true,
            type: true,
            isFront: true,
            isFrontAndBack: true,
          },
        });

        // Build a lookup key identical to the frontend: "type:processId[:sub]"
        const makeRouteKey = (type, processId, isFront, isFrontAndBack) => {
          const sub = isFrontAndBack ? "frontback" : isFront ? "front" : "";
          return `${type}:${processId}${sub ? `:${sub}` : ""}`;
        };

        const existingKeyToRow = {};
        existingRouteRows.forEach((row) => {
          existingKeyToRow[
            makeRouteKey(
              row.type,
              row.processId,
              row.isFront,
              row.isFrontAndBack,
            )
          ] = row;
        });

        // Build desired key set from the incoming payload
        const incomingKeyToRoute = {};
        processRoute.forEach((r, idx) => {
          const key = makeRouteKey(
            r.type,
            Number(r.processId),
            Boolean(r.isFront),
            Boolean(r.isFrontAndBack),
          );
          incomingKeyToRoute[key] = { ...r, sequence: idx + 1 };
        });

        // Delete rows that are no longer in the incoming payload
        const keysToDelete = Object.keys(existingKeyToRow).filter(
          (k) => !incomingKeyToRoute[k],
        );
        if (keysToDelete.length > 0) {
          const idsToDelete = keysToDelete.map((k) => existingKeyToRow[k].id);
          await tx.processRoute.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        // Update sequence on rows that already exist (keep status/completedQty untouched)
        const keysToUpdate = Object.keys(incomingKeyToRoute).filter(
          (k) => existingKeyToRow[k],
        );
        for (const key of keysToUpdate) {
          await tx.processRoute.update({
            where: { id: existingKeyToRow[key].id },
            data: { sequence: incomingKeyToRoute[key].sequence },
          });
        }

        // Insert rows that are new
        const keysToInsert = Object.keys(incomingKeyToRoute).filter(
          (k) => !existingKeyToRow[k],
        );
        if (keysToInsert.length > 0) {
          await tx.processRoute.createMany({
            data: keysToInsert.map((k) => {
              const r = incomingKeyToRoute[k];
              return {
                jobCardId: parseInt(id),
                processId: Number(r.processId),
                type: r.type,
                sequence: r.sequence,
                isFront: Boolean(r.isFront),
                isFrontAndBack: Boolean(r.isFrontAndBack),
              };
            }),
          });
        }
      } else {
        // Incoming payload has no routes — delete all existing rows
        await tx.processRoute.deleteMany({
          where: { jobCardId: parseInt(id) },
        });
      }
      if (isAmendment) {
        const allocation = await tx.productionAllocation.findFirst({
          where: { jobCardId: parseInt(id) },
          select: {
            id: true,
            allocationDetails: {
              select: { id: true, processId: true, type: true },
            },
          },
        });

        if (allocation) {
          // Build a sequence lookup from the (now-synced) incoming processRoute
          // key: "type:processId"  →  value: sequence (1-based)
          const routeSequenceMap = {};
          processRoute.forEach((r, idx) => {
            routeSequenceMap[`${r.type}:${Number(r.processId)}`] = idx + 1;
          });

          // Update each dtl row whose type+processId appears in the route
          for (const dtl of allocation.allocationDetails) {
            const key = `${dtl.type}:${dtl.processId}`;
            if (routeSequenceMap[key] !== undefined) {
              await tx.productionAllocationDtl.update({
                where: { id: dtl.id },
                data: { sequence: routeSequenceMap[key] },
              });
            }
          }
        }
      }

      data = await tx.jobCard.update({
        where: { id: parseInt(id) },
        data: {
          docDate: docDate ? new Date(docDate) : null,
          updatedById: parseInt(userId),
          branchId: parseInt(branchId),
          orderEntryId: orderEntryId ? parseInt(orderEntryId) : null,
          orderType: orderType || null,
          orderQty: orderQty ? parseInt(orderQty) : null,
          customerId: customerId ? parseInt(customerId) : null,
          gsmId: gsmId ? parseInt(gsmId) : null,
          boardId: boardId ? parseInt(boardId) : null,
          fullBoardId: fullBoardId ? parseInt(fullBoardId) : null,
          noOfPockets: noOfPockets ? parseInt(noOfPockets) : null,
          cuttingSizeId: cuttingSizeId ? Number(cuttingSizeId) : null,
          runningQty: runningQty ? parseInt(runningQty) : null,
          isFourColor: Boolean(isFourColor),
          isCutColor: Boolean(isCutColor),
          isFront: Boolean(isFront),
          isFrontAndBack: Boolean(isFrontAndBack),
          isCMYK: Boolean(isCMYK),
          isCutColMachine: Boolean(isCutColMachine),
          isFrontMachine: Boolean(isFrontMachine),
          isFrontBackMachine: Boolean(isFrontBackMachine),
          plateId: plateId ? parseInt(plateId) : null,
          dieId: dieId ? parseInt(dieId) : null,
          totalPlatesets: totalPlatesets || null,
          remarks: remarks || null,
          designerId: designerId ? parseInt(designerId) : null,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime || null,
          productionType: productionType || null,
          styleItemId: styleItemId ? Number(styleItemId) : null,
          itemGroupId: itemGroupId ? Number(itemGroupId) : null,
          itemType: itemType || null,
          followUpId: followUpId ? Number(followUpId) : null,
          labelQuality: labelQuality || null,
          block: block || null,
          labelQty: labelQty ? Number(labelQty) : null,
          rollQty: rollQty ? Number(rollQty) : null,
          cutAndSeal: cutAndSeal || null,
          trackingType: trackingType || null,
          orderItemId: orderItemId ? Number(orderItemId) : null,
          labelSizeId: labelSizeId ? Number(labelSizeId) : null,
          totalMeter: totalMeter ? Number(totalMeter) : null,
          blockDate: blockDate ? new Date(blockDate) : null,
          isRepeatedJobCard: !!isRepeatedJobCard,
          refJobCardId: refJobCardId ? Number(refJobCardId) : null,
          boardQualities:
            boardItems.length > 0
              ? {
                  createMany: {
                    data: boardItems.map((bId) => ({
                      boardId: parseInt(bId),
                    })),
                  },
                }
              : undefined,

          printingDetails: selectedPrinting.length
            ? {
                createMany: {
                  data: selectedPrinting.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,

          plateDetails: plateDetails.length
            ? {
                createMany: {
                  data: plateDetails.map((p) => ({
                    plateName: p.plateName,
                    qty: p.qty ? Number(p.qty) : null,
                  })),
                },
              }
            : undefined,

          processDetails:
            selectedProcesses.length > 0
              ? {
                  createMany: {
                    data: selectedProcesses.map((pId) => ({
                      processId: parseInt(pId),
                    })),
                  },
                }
              : undefined,

          laminationDetails:
            laminations.length > 0
              ? {
                  createMany: {
                    data: laminations.map((l) => ({
                      laminationId: parseInt(l.processId),
                      isFront: Boolean(l.isFront),
                      isFrontAndBack: Boolean(l.isFrontAndBack),
                    })),
                  },
                }
              : undefined,

          varnishDetails:
            varnishes.length > 0
              ? {
                  createMany: {
                    data: varnishes.map((v) => ({
                      varnishId: parseInt(v.processId),
                      isFront: Boolean(v.isFront),
                      isFrontAndBack: Boolean(v.isFrontAndBack),
                    })),
                  },
                }
              : undefined,

          machineDetails:
            selectedMachines.length > 0
              ? {
                  createMany: {
                    data: selectedMachines.map((mId) => ({
                      macId: parseInt(mId),
                    })),
                  },
                }
              : undefined,

          jobCardSizeDetails: jobCardSizeDetails.length
            ? {
                createMany: {
                  data: jobCardSizeDetails.map((s) => ({
                    sizeId: s.sizeId ? Number(s.sizeId) : null,
                    qty: s.qty ? Number(s.qty) : null,
                    barcodeFrom: s.barcodeFrom || null,
                    barcodeTo: s.barcodeTo || null,
                  })),
                },
              }
            : undefined,
          finishingProcesses: selectedFinishing.length
            ? {
                createMany: {
                  data: selectedFinishing.map((id) => ({
                    processId: Number(id),
                  })),
                },
              }
            : undefined,
        },
      });
      if (submitApproval && hasApproval && module) {
        await tx.approvalLog.deleteMany({
          where: {
            referenceId: parseInt(id),
            referencePage: REFERENCE_PAGE,
            status: { in: ["REJECTED", "NOTAPPROVED"] },
          },
        });

        const fullRecord = await tx.jobCard.findUnique({
          where: { id: parseInt(id) },
          include: await buildIncludeForModule(module.id),
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

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
async function remove(id) {
  try {
    const jobCardId = parseInt(id);
    await prisma.approvalLog.deleteMany({
      where: { referencePage: REFERENCE_PAGE, referenceId: jobCardId },
    });
    const dataFound = await prisma.jobCard.findUnique({
      where: { id: jobCardId },
    });
    if (!dataFound) return NoRecordFound("Job Card");

    // Cascade delete handles child records (onDelete: Cascade in schema)
    const data = await prisma.jobCard.delete({
      where: { id: parseInt(id) },
    });

    return { statusCode: 0, data };
  } catch (err) {
    return { statusCode: 400, message: err.message };
  }
}

export { get, getOne, create, update, remove, getJobCardList };

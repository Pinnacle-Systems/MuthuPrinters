import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getDateFromDateTime,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";

// ─────────────────────────────────────────────
// Doc ID Generator
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchOrderType,
    finYearId,
    searchCustomer,
  } = req.query;

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
      orderType: searchOrderType ? { contains: searchOrderType } : undefined,
      customer: {
        name: searchCustomer ? { contains: searchCustomer } : undefined,
      },
    },
    include: {
      customer: { select: { id: true, name: true } },
      gsm: { select: { id: true, name: true } },
    },
    orderBy: { id: "desc" },
  });

  let totalCount = data.length;

  if (searchDocDate) {
    data = data.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
    );
  }

  if (pagination) {
    data = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * dataPerPage,
    );
  }

  return { statusCode: 0, data, nextDocId: newDocId, totalCount };
}

// ─────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────
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
    },
  });

  if (!data) return NoRecordFound("Job Card");
  return { statusCode: 0, data };
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
// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────
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
      fullBoard,
      noOfPockets,
      cuttingSize,
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
      totalPlateSet,
      remarks,
      designerId,
      tagCardUps,
      jobRunTime,

      // Arrays
      boardItems,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
    } = body;

    // ─────────────────────────────
    // ✅ SAFE ARRAYS
    // ─────────────────────────────
    const safeBoardItems = safeArray(boardItems);
    const safeProcesses = safeArray(selectedProcesses);
    const safeLaminations = safeArray(laminations);
    const safeVarnishes = safeArray(varnishes);
    const safeMachines = safeArray(selectedMachines);

    console.log("✅ SAFE ARRAYS:");
    console.log({
      safeBoardItems,
      safeProcesses,
      safeLaminations,
      safeVarnishes,
      safeMachines,
    });

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

    console.log("📄 NEW DOC ID:", newDocId);

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
          orderQty: orderQty ? Number(orderQty) : null,
          customerId: customerId ? Number(customerId) : null,

          gsmId: gsmId ? Number(gsmId) : null,
          boardId: boardId ? Number(boardId) : null,

          fullBoard: fullBoard ? Number(fullBoard) : null,
          noOfPockets: noOfPockets ? Number(noOfPockets) : null,
          cuttingSize: cuttingSize || null,
          runningQty: runningQty ? Number(runningQty) : null,

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
          totalPlateSet: totalPlateSet ? Number(totalPlateSet) : null,

          remarks: remarks || null,
          designerId: designerId ? Number(designerId) : null,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime || null,

          // ─────────────────────────────
          // RELATIONS
          // ─────────────────────────────

          boardQualities: safeBoardItems.length
            ? {
                createMany: {
                  data: safeBoardItems.map((id) => ({
                    boardId: Number(id),
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
                    machineId: Number(id),
                  })),
                },
              }
            : undefined,
        },
      });
    });

    console.log("✅ CREATED SUCCESS:", data);

    return { statusCode: 0, data };
  } catch (err) {
    console.error("❌ SERVICE ERROR:", err);
    return { statusCode: 1, message: err.message };
  }
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────
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
      fullBoard,
      noOfPockets,
      cuttingSize,
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
      totalPlateSet,
      remarks,
      designerId,
      tagCardUps,
      jobRunTime,
      boardItems,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
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

    let data;
    await prisma.$transaction(async (tx) => {
      // Delete all child records first, then recreate (simplest safe strategy)
      await tx.boardQuality.deleteMany({ where: { jobCardId: parseInt(id) } });
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
          fullBoard: fullBoard ? parseInt(fullBoard) : null,
          noOfPockets: noOfPockets ? parseInt(noOfPockets) : null,
          cuttingSize: cuttingSize || null,
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
          totalPlateSet: totalPlateSet ? parseInt(totalPlateSet) : null,
          remarks: remarks || null,
          designerId: designerId ? parseInt(designerId) : null,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime || null,

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
                      machineId: parseInt(mId),
                    })),
                  },
                }
              : undefined,
        },
      });
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
    const dataFound = await prisma.jobCard.findUnique({
      where: { id: parseInt(id) },
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

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
export { get, getOne, create, update, remove };

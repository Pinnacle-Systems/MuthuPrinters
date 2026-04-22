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
      // Arrays from UI
      boardItems, // number[]  — selected board quality process IDs
      selectedProcesses, // number[] — selected default process IDs
      laminations, // { processId, isFront, isFrontAndBack }[]
      varnishes, // { processId, isFront, isFrontAndBack }[]
      selectedMachines, // number[] — selected machine process IDs
    } = body;

    let finYearDate = await getFinYearStartTimeEndTime(finYearId);
    const shortCode = finYearDate
      ? getYearShortCodeForFinYear(
          finYearDate?.startDateStartTime,
          finYearDate?.endDateEndTime,
        )
      : "";

    const newDocId = await getNextDocId(
      branchId,
      shortCode,
      finYearDate?.startDateStartTime,
      finYearDate?.endDateEndTime,
    );

    // Parse JSON strings sent via FormData
    const parsedBoardItems = parseJsonField(boardItems, []);
    const parsedProcesses = parseJsonField(selectedProcesses, []);
    const parsedLaminations = parseJsonField(laminations, []);
    const parsedVarnishes = parseJsonField(varnishes, []);
    const parsedMachines = parseJsonField(selectedMachines, []);

    let data;
    await prisma.$transaction(async (tx) => {
      data = await tx.jobCard.create({
        data: {
          docId: newDocId,
          docDate: docDate ? new Date(docDate) : null,
          createdById: parseInt(userId),
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

          // Nested creates
          boardQualities:
            parsedBoardItems.length > 0
              ? {
                  createMany: {
                    data: parsedBoardItems.map((bId) => ({
                      boardId: parseInt(bId),
                    })),
                  },
                }
              : undefined,

          processDetails:
            parsedProcesses.length > 0
              ? {
                  createMany: {
                    data: parsedProcesses.map((pId) => ({
                      processId: parseInt(pId),
                    })),
                  },
                }
              : undefined,

          laminationDetails:
            parsedLaminations.length > 0
              ? {
                  createMany: {
                    data: parsedLaminations.map((l) => ({
                      laminationId: parseInt(l.processId),
                      isFront: Boolean(l.isFront),
                      isFrontAndBack: Boolean(l.isFrontAndBack),
                    })),
                  },
                }
              : undefined,

          varnishDetails:
            parsedVarnishes.length > 0
              ? {
                  createMany: {
                    data: parsedVarnishes.map((v) => ({
                      varnishId: parseInt(v.processId),
                      isFront: Boolean(v.isFront),
                      isFrontAndBack: Boolean(v.isFrontAndBack),
                    })),
                  },
                }
              : undefined,

          machineDetails:
            parsedMachines.length > 0
              ? {
                  createMany: {
                    data: parsedMachines.map((mId) => ({
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

    const parsedBoardItems = parseJsonField(boardItems, []);
    const parsedProcesses = parseJsonField(selectedProcesses, []);
    const parsedLaminations = parseJsonField(laminations, []);
    const parsedVarnishes = parseJsonField(varnishes, []);
    const parsedMachines = parseJsonField(selectedMachines, []);

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
            parsedBoardItems.length > 0
              ? {
                  createMany: {
                    data: parsedBoardItems.map((bId) => ({
                      boardId: parseInt(bId),
                    })),
                  },
                }
              : undefined,

          processDetails:
            parsedProcesses.length > 0
              ? {
                  createMany: {
                    data: parsedProcesses.map((pId) => ({
                      processId: parseInt(pId),
                    })),
                  },
                }
              : undefined,

          laminationDetails:
            parsedLaminations.length > 0
              ? {
                  createMany: {
                    data: parsedLaminations.map((l) => ({
                      laminationId: parseInt(l.processId),
                      isFront: Boolean(l.isFront),
                      isFrontAndBack: Boolean(l.isFrontAndBack),
                    })),
                  },
                }
              : undefined,

          varnishDetails:
            parsedVarnishes.length > 0
              ? {
                  createMany: {
                    data: parsedVarnishes.map((v) => ({
                      varnishId: parseInt(v.processId),
                      isFront: Boolean(v.isFront),
                      isFrontAndBack: Boolean(v.isFrontAndBack),
                    })),
                  },
                }
              : undefined,

          machineDetails:
            parsedMachines.length > 0
              ? {
                  createMany: {
                    data: parsedMachines.map((mId) => ({
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
function parseJsonField(value, fallback) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export { get, getOne, create, update, remove };

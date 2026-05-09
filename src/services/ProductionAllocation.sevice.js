import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import { getYearShortCodeForFinYear } from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.productionAllocation.findFirst({
    where: {
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");

  let newDocId = `${branchObj.branchCode}/${shortCode}/PA/1`;

  if (lastObject) {
    const parts = lastObject.docId.split("/");
    const lastNum = parseInt(parts.at(-1));

    if (!isNaN(lastNum)) {
      newDocId = `${branchObj.branchCode}/${shortCode}/PA/${lastNum + 1}`;
    }
  }

  return newDocId;
}

async function get(req) {
  const {
    branchId,
    finYearId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  const data = await prisma.productionAllocation.findMany({
    where: {
      docId: searchDocNo ? { contains: searchDocNo } : undefined,

      AND: finYearDate
        ? [
            { createdAt: { gte: finYearDate.startDateStartTime } },
            { createdAt: { lte: finYearDate.endDateEndTime } },
          ]
        : undefined,
    },

    include: {
      JobCard: {
        select: {
          id: true,
          docId: true,
        },
      },

      StyleItem: {
        select: {
          id: true,
          name: true,
        },
      },

      allocationDetails: {
        include: {
          Process: true,
        },
        orderBy: {
          sequence: "asc",
        },
      },
    },

    orderBy: {
      id: "desc",
    },
  });

  let result = data;

  if (pagination) {
    result = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return {
    statusCode: 0,
    totalCount: data.length,
    data: result,
  };
}

async function getOne(id) {
  const data = await prisma.productionAllocation.findUnique({
    where: {
      id: parseInt(id),
    },

    include: {
      JobCard: {
        include: {
          customer: true,
        },
      },

      StyleItem: true,

      allocationDetails: {
        include: {
          Process: true,
        },

        orderBy: {
          sequence: "asc",
        },
      },
    },
  });

  if (!data) {
    return NoRecordFound("Production Allocation");
  }

  return {
    statusCode: 0,
    data,
  };
}

async function create(body) {
  const {
    userId,
    branchId,
    finYearId,
    docDate,
    remarks,
    jobCardId,
    styleItemId,
    allocationDetails,
  } = body;

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

  const data = await prisma.productionAllocation.create({
    data: {
      docId: newDocId,

      docDate: docDate ? new Date(docDate) : null,

      remarks,

      createdById: parseInt(userId),

      jobCardId: parseInt(jobCardId),

      styleItemId: styleItemId ? parseInt(styleItemId) : null,

      allocationDetails: {
        createMany: {
          data: allocationDetails.map((item) => ({
            processId: item.processId ? parseInt(item.processId) : null,

            type: item.type || null,

            sequence: item.seqNo ? parseInt(item.seqNo) : null,

            isInHouse: Boolean(item.isInHouse),

            isOutSide: Boolean(item.isOutSide),
          })),
        },
      },
    },

    include: {
      allocationDetails: true,
    },
  });

  return {
    statusCode: 0,
    data,
  };
}

async function update(id, body) {
  const {
    userId,
    docDate,
    remarks,
    jobCardId,
    styleItemId,
    allocationDetails,
  } = body;

  const found = await prisma.productionAllocation.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!found) {
    return NoRecordFound("Production Allocation");
  }

  const data = await prisma.productionAllocation.update({
    where: {
      id: parseInt(id),
    },

    data: {
      docDate: docDate ? new Date(docDate) : null,

      remarks,

      updatedById: parseInt(userId),

      jobCardId: parseInt(jobCardId),

      styleItemId: styleItemId ? parseInt(styleItemId) : null,

      allocationDetails: {
        deleteMany: {},

        createMany: {
          data: allocationDetails.map((item) => ({
            processId: item.processId ? parseInt(item.processId) : null,

            type: item.type || null,

            sequence: item.seqNo ? parseInt(item.seqNo) : null,

            isInHouse: Boolean(item.isInHouse),

            isOutSide: Boolean(item.isOutSide),
          })),
        },
      },
    },

    include: {
      allocationDetails: true,
    },
  });

  return {
    statusCode: 0,
    data,
  };
}

async function remove(id) {
  const found = await prisma.productionAllocation.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!found) {
    return NoRecordFound("Production Allocation");
  }

  const data = await prisma.productionAllocation.delete({
    where: {
      id: parseInt(id),
    },
  });

  return {
    statusCode: 0,
    data,
  };
}

export { get, getOne, create, update, remove };

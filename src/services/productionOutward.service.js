// productionOutward.service.js

import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import { getYearShortCodeForFinYear } from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.productionOutward.findFirst({
    where: {
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");

  let newDocId = `${branchObj.branchCode}/${shortCode}/POUT/1`;

  if (lastObject) {
    const parts = lastObject.docId.split("/");
    const lastNum = parseInt(parts.at(-1));

    if (!isNaN(lastNum)) {
      newDocId = `${branchObj.branchCode}/${shortCode}/POUT/${lastNum + 1}`;
    }
  }

  return newDocId;
}

async function get(req) {
  const { finYearId, pagination, pageNumber, dataPerPage, searchDocNo } =
    req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  const data = await prisma.productionOutward.findMany({
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
      Vendor: true,

      ProductionAllocation: {
        include: {
          JobCard: true,
        },
      },

      outwardDetails: {
        include: {
          Process: true,
          JobCard: true,
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
  const data = await prisma.productionOutward.findUnique({
    where: {
      id: parseInt(id),
    },

    include: {
      Vendor: true,

      ProductionAllocation: {
        include: {
          JobCard: true,
        },
      },

      outwardDetails: {
        include: {
          Process: true,
          JobCard: true,
        },

        orderBy: {
          sequence: "asc",
        },
      },
    },
  });

  if (!data) {
    return NoRecordFound("Production Outward");
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
    productionAllocationId,
    vendorId,
    outwardDetails,
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

  const data = await prisma.productionOutward.create({
    data: {
      docId: newDocId,

      docDate: docDate ? new Date(docDate) : null,

      remarks,

      createdById: parseInt(userId),

      productionAllocationId: productionAllocationId
        ? parseInt(productionAllocationId)
        : null,

      vendorId: vendorId ? parseInt(vendorId) : null,

      outwardDetails: {
        createMany: {
          data: outwardDetails.map((item) => ({
            processId: item.processId ? parseInt(item.processId) : null,

            jobCardId: item.jobCardId ? parseInt(item.jobCardId) : null,

            sentQty: item.sentQty ? parseInt(item.sentQty) : 0,

            pendingQty: item.sentQty ? parseInt(item.sentQty) : 0,

            sequence: item.sequence ? parseInt(item.sequence) : null,

            remarks: item.remarks || null,
          })),
        },
      },
    },

    include: {
      outwardDetails: true,
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
    productionAllocationId,
    vendorId,
    outwardDetails,
  } = body;

  const found = await prisma.productionOutward.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!found) {
    return NoRecordFound("Production Outward");
  }

  const data = await prisma.productionOutward.update({
    where: {
      id: parseInt(id),
    },

    data: {
      docDate: docDate ? new Date(docDate) : null,

      remarks,

      updatedById: parseInt(userId),

      productionAllocationId: productionAllocationId
        ? parseInt(productionAllocationId)
        : null,

      vendorId: vendorId ? parseInt(vendorId) : null,

      outwardDetails: {
        deleteMany: {},

        createMany: {
          data: outwardDetails.map((item) => ({
            processId: item.processId ? parseInt(item.processId) : null,

            jobCardId: item.jobCardId ? parseInt(item.jobCardId) : null,

            sentQty: item.sentQty ? parseInt(item.sentQty) : 0,

            pendingQty: item.pendingQty ? parseInt(item.pendingQty) : 0,

            sequence: item.sequence ? parseInt(item.sequence) : null,

            remarks: item.remarks || null,
          })),
        },
      },
    },

    include: {
      outwardDetails: true,
    },
  });

  return {
    statusCode: 0,
    data,
  };
}

async function remove(id) {
  const found = await prisma.productionOutward.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!found) {
    return NoRecordFound("Production Outward");
  }

  const data = await prisma.productionOutward.delete({
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

// model ProductionOutward {
//   id                     Int       @id @default(autoincrement())
//   docId                  String
//   docDate                DateTime?

//   productionAllocationId Int?
//   ProductionAllocation   ProductionAllocation?
//     @relation(fields: [productionAllocationId], references: [id])

//   vendorId               Int?
//   Vendor                 Party?
//     @relation(fields: [vendorId], references: [id])

//   remarks                String?

//   outwardDetails         ProductionOutwardDtl[]

//   createdAt              DateTime @default(now())
// }

// model ProductionOutwardDtl {
//   id                  Int      @id @default(autoincrement())

//   productionOutwardId Int
//   ProductionOutward   ProductionOutward
//     @relation(fields: [productionOutwardId], references: [id], onDelete: Cascade)

//   processId           Int?
//   Process             Process?
//     @relation(fields: [processId], references: [id])

//   jobCardId           Int?
//   JobCard             JobCard?
//     @relation(fields: [jobCardId], references: [id])

//   sentQty             Int?

//   receivedQty         Int? @default(0)

//   pendingQty          Int?

//   sequence            Int?

//   remarks             String?

// allocationDetailId Int?

// AllocationDetail ProductionAllocationDtl?
//  @relation(fields: [allocationDetailId], references: [id])
// }

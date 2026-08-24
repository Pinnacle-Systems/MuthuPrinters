// productionOutward.service.js

import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getDateFromDateTime,
  getYearShortCodeForFinYear,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import moment from "moment";

const updateProcessRoutes = async (tx, jobCardId, routes,outward) => {
  // deduplicate routes based on processId + sequence
  const uniqueRoutes = [];
  const seen = new Set();
  for (const r of routes) {
    const key = `${r.processId}_${r.sequence}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRoutes.push(r);
    }
  }

  await Promise.all(
    uniqueRoutes.map(async (item) => {
      const pId = item.processId ? parseInt(item.processId) : null;
      const seq = item.sequence ? parseInt(item.sequence) : null;

      const sumResult = await tx.productionOutwardDtl.aggregate({
        _sum: { sentQty: true },
        where: {
          ProductionOutward: { jobCardId: parseInt(jobCardId) },
          processId: pId,
          sequence: seq,
        },
      });
      const totalSent = sumResult._sum.sentQty || 0;

      const routeData = await tx.processRoute.findFirst({
        where: {
          jobCardId: parseInt(jobCardId),
          processId: pId,
          sequence: seq,
        },
      });

      const currentCompleted = routeData?.completedQty || 0;
      const currentWastage = routeData?.wastageQty || 0;
      const currentActualQty = item.actualQty !== undefined && item.actualQty !== null 
        ? parseInt(item.actualQty) 
        : (routeData?.actualQty || 0);

      let newStatus = "NOT_STARTED";
      if (currentCompleted > 0 || currentWastage > 0) {
         const pendingInward = Math.max(currentActualQty - (currentCompleted + currentWastage), 0);
         newStatus = pendingInward === 0 ? "COMPLETED" : "PARTIALLY_COMPLETED";
      } else if (totalSent > 0) {
         newStatus = "IN_PROGRESS";
      }

      const pendingQty = Math.max(currentActualQty - (currentCompleted + currentWastage), 0);

      const updateData = {
        status: newStatus,
        sendQty: totalSent,
        pendingQty: pendingQty,
      };

      if (item.actualQty !== undefined && item.actualQty !== null) {
        updateData.actualQty = parseInt(item.actualQty);
      }

       const processId = item.processId ? parseInt(item.processId) : null;
       const sequence = item.sequence ? parseInt(item.sequence) : null;

       const processRoute = await tx.processRoute.findFirst({
        where: {
        jobCardId: parseInt(jobCardId),
        processId,
        sequence,
       },
        });


       const processRouteSeq = await tx.processRoute.findFirst({
        where: {
        jobCardId: parseInt(jobCardId),
        sequence:sequence + 1,
          },
        });

     if (!processRoute) return; // guard: nothing matched, decide how to handle

      //    await tx.processRoute.update({
      // where: { id: processRoute.id },
      // data: {
      //   status: "IN_PROGRESS",
      //   pendingQty: item.sentQty ? parseInt(item.sentQty) : 0,
      //   actualQty: item.sentQty ? parseInt(item.sentQty) : 0,
      // },
      //    });


       await tx.processRoute.updateMany({
        where: {
          jobCardId: parseInt(jobCardId),
          processId: pId,
          sequence: seq,
        },
        data: updateData,
      });

        // const processRoute = await  tx.processRoute.updateMany({
        //   where: {
        //     jobCardId: parseInt(jobCardId),
        //     processId: item.processId ? parseInt(item.processId) : null,
        //     sequence: item.sequence ? parseInt(item.sequence) : null,
        //   },

        //   data: {
        //     status: "IN_PROGRESS",
        //     pendingQty: item.sentQty ? parseInt(item.sentQty) : 0,
        //     actualQty: item.sentQty ? parseInt(item.sentQty) : 0,
        //   },
        // })

      // var    getIncomingExist = await tx?.incomingQty?.findFirst({
      //       where: {
      // jobCardId: parseInt(jobCardId),
      // sendRoute: Number(processRoute?.id || 0),
      // outwardId: null,
      // pendingQty: { gt: 0 },
      //     },
      //    orderBy: { id: "asc" },
      //       });



       await  tx?.incomingQty?.create({
                 data: {
                   jobCardId: parseInt(jobCardId),
                   processRouteId: Number(processRoute?.id || 0),
                   sendRoute: Number(processRouteSeq?.id ?? processRoute?.id),
                   qty: Number(item?.sentQty || 0),
                   pendingQty: Number(item?.sentQty || 0),
                   completedQty: 0,
                   wastageQty: 0,
                   outwardId : outward?.id
                 }
             });

     
    }),
  );
};

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.productionOutward.findFirst({
    where: {
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");

  let newDocId = `${branchObj.branchCode}/${shortCode}/PIS/1`;

  if (lastObject) {
    const parts = lastObject.docId.split("/");
    const lastNum = parseInt(parts.at(-1));
    if (!isNaN(lastNum)) {
      newDocId = `${branchObj.branchCode}/${shortCode}/PIS/${lastNum + 1}`;
    }
  }

  return newDocId;
}

async function get(req) {
  const {
    finYearId,
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchJobCard,
    searchSupplier,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  let data = await prisma.productionOutward.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      docId: searchDocNo ? { contains: searchDocNo } : undefined,
      AND: finYearDate
        ? [
            { createdAt: { gte: finYearDate.startDateStartTime } },
            { createdAt: { lte: finYearDate.endDateEndTime } },
          ]
        : undefined,
      JobCard: {
        docId: searchJobCard ? { contains: searchJobCard } : undefined,
      },
      Supplier: {
        name: searchSupplier ? { contains: searchSupplier } : undefined,
      },
    },
    include: {
      Supplier: true,
      JobCard: true,
      ProductionAllocation: true,
      productionOutwardDetails: {
        include: {
          Process: true,
          ProductionAllocationDtl: true,
        },
        orderBy: { sequence: "asc" },
      },
      _count: {
        select: {
          productionInwardDtls: true,
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
  let result = data?.map((item) => ({
    ...item,
    childRecord: item._count.productionInwardDtls,
  }));
  if (pagination) {
    result = result.slice(
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
    where: { id: parseInt(id) },
    include: {
      Supplier: true,
      JobCard: true,
      ProductionAllocation: true,
      productionOutwardDetails: {
        include: {
          Process: true,
          ProductionAllocationDtl: true,
        },
        orderBy: { sequence: "asc" },
      },
      _count: {
        select: {
          productionInwardDtls: true,
        },
      },
    },
  });

  if (!data) return NoRecordFound("Production Outward");

  const childRecord = data._count?.productionInwardDtls || 0;

  return { statusCode: 0, data: { ...data, childRecord } };
}

async function getOutwardJobCardDtls(req) {
  const {
    supplierId,
    pagination,
    searchJobCard,
    searchDocId,
    searchDocDate,
    processId,
  } = req.query;

  let data = [];

  const whereCondition = {
    ProductionOutward: {
      supplierId: supplierId ? parseInt(supplierId) : undefined,

      docId: searchDocId ? { contains: searchDocId } : undefined,

      docDate: searchDocDate
        ? {
            gte: moment
              .utc(searchDocDate, "DD-MM-YYYY")
              .startOf("day")
              .toDate(),
            lte: moment.utc(searchDocDate, "DD-MM-YYYY").endOf("day").toDate(),
          }
        : undefined,

      JobCard: {
        docId: searchJobCard ? { contains: searchJobCard } : undefined,
      },
    },

    processId: processId ? parseInt(processId) : undefined,
  };

  data = await prisma.productionOutwardDtl.findMany({
    where: whereCondition,

    include: {
      productionInwardDtls: {
        select: {
          receivedQty: true, // or acceptedQty based on your logic
          acceptedQty: true,
          wastageQty: true,
        },
      },
      ProductionOutward: {
        select: {
          id: true,
          docId: true,
          docDate: true,
          supplierId: true,

          Supplier: {
            select: {
              id: true,
              name: true,
            },
          },

          JobCard: {
            select: {
              id: true,
              docId: true,
            },
          },
        },
      },

      Process: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: {
      id: "asc",
    },
  });

  // Group by productionOutwardId
  const groupedData = Object.values(
    data.reduce((acc, item) => {
      const key = item.productionOutwardId;

      const alreadyReceivedQty = (item.productionInwardDtls || []).reduce(
        (sum, inward) =>
          sum +
          (inward.acceptedQty || inward.receivedQty || 0) +
          (inward.wastageQty || 0),
        0,
      );

      const wastageQty = (item.productionInwardDtls || []).reduce(
        (sum, inward) => sum + (inward.wastageQty || 0),
        0,
      );

      const pendingQty = (item.sentQty || 0) - alreadyReceivedQty;
      if (!acc[key]) {
        acc[key] = {
          id: item.id,
          productionOutwardId: item.productionOutwardId,

          // combine process ids here
          processes: item.processId ? [item.processId] : [],

          sentQty: item.sentQty || 0,
          alreadyReceivedQty,

          wastageQty,

          pendingQty,
          sequence: item.sequence,
          prevProcessId: item.prevProcessId,
          productionAllocationDtlId: item.productionAllocationDtlId,

          ProductionOutward: item.ProductionOutward,
        };
      } else {
        // push additional process ids
        if (item.processId && !acc[key].processes.includes(item.processId)) {
          acc[key].processes.push(item.processId);
        }
        acc[key].alreadyReceivedQty += alreadyReceivedQty;
        acc[key].wastageQty += wastageQty;
        acc[key].pendingQty =
          (acc[key].sentQty || 0) - acc[key].alreadyReceivedQty;
      }

      return acc;
    }, {}),
  );
  const filterData = groupedData.filter((item) => item.pendingQty > 0);

  return {
    statusCode: 0,
    data: filterData,
    totalCount: filterData.length,
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
    productionAllocationId,
    supplierId,
    outwardDetails,
    dcNo,
    vehicleNo,
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

  const data = await prisma.$transaction(async (tx) => {
    const outward = await tx.productionOutward.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        remarks,
        branchId: branchId ? parseInt(branchId) : null,
        createdById: parseInt(userId),
        jobCardId: parseInt(jobCardId),
        productionAllocationId: productionAllocationId
          ? parseInt(productionAllocationId)
          : null,
        supplierId: supplierId ? parseInt(supplierId) : null,
        dcNo,
        vehicleNo,
        productionOutwardDetails: {
          createMany: {
            data: outwardDetails.map((item) => ({
              processId: item.processId ? parseInt(item.processId) : null,

              sentQty: item.sentQty ? parseFloat(item.sentQty) : 0,

              sequence: item.sequence ? parseInt(item.sequence) : null,

              // productionAllocationDtlId: item.productionAllocationDtlId
              //   ? parseInt(item.productionAllocationDtlId)
              //   : null,

              // prevProcessId: item.prevProcessId
              //   ? parseInt(item.prevProcessId)
              //   : null,
            })),
          },
        },
      },

      include: {
        productionOutwardDetails: true,
      },
    });

    if (body.productionQty !== undefined && body.productionQty !== null && body.productionQty !== "") {
      await tx.processRoute.updateMany({
        where: { jobCardId: parseInt(jobCardId) },
        data: { actualQty: parseInt(body.productionQty) },
      });
    }

    await updateProcessRoutes(tx, jobCardId, outwardDetails,outward);


    return outward;
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
    productionAllocationId,
    supplierId,
    outwardDetails,
    dcNo,
    vehicleNo,
  } = body;
  const found = await prisma.productionOutward.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      productionOutwardDetails: true,
    },
  });

  if (!found) {
    return NoRecordFound("Production Outward");
  }

  const data = await prisma.$transaction(async (tx) => {
    // OLD DETAILS
    const oldDetails = found.productionOutwardDetails || [];

    // OLD KEYS
    const oldKeys = oldDetails.map(
      (item) => `${item.processId}_${item.sequence}`,
    );

    // NEW KEYS
    const newKeys = outwardDetails.map(
      (item) => `${item.processId}_${item.sequence}`,
    );

    // REMOVED ROWS
    const removedRows = oldDetails.filter(
      (item) => !newKeys.includes(`${item.processId}_${item.sequence}`),
    );

    // UPDATE OUTWARD
    const updated = await tx.productionOutward.update({
      where: {
        id: parseInt(id),
      },

      data: {
        docDate: docDate ? new Date(docDate) : null,

        remarks,

        updatedById: parseInt(userId),

        jobCardId: parseInt(jobCardId),

        productionAllocationId: productionAllocationId
          ? parseInt(productionAllocationId)
          : null,

        supplierId: supplierId ? parseInt(supplierId) : null,

        dcNo,
        vehicleNo,

        productionOutwardDetails: {
          deleteMany: {},

          createMany: {
            data: outwardDetails.map((item) => ({
              processId: item.processId ? parseInt(item.processId) : null,

              sentQty: item.sentQty ? parseFloat(item.sentQty) : 0,

              sequence: item.sequence ? parseInt(item.sequence) : null,
            })),
          },
        },
      },

      include: {
        productionOutwardDetails: true,
      },
    });

    if (body.productionQty !== undefined && body.productionQty !== null && body.productionQty !== "") {
      await tx.processRoute.updateMany({
        where: { jobCardId: parseInt(jobCardId) },
        data: { actualQty: parseInt(body.productionQty) },
      });
    }

    const allAffectedRoutes = [...outwardDetails, ...removedRows];
    await updateProcessRoutes(tx, jobCardId, allAffectedRoutes);

    return updated;
  });

  return {
    statusCode: 0,
    data,
  };
}

async function remove(id) {
  const found = await prisma.productionOutward.findUnique({
    where: { id: parseInt(id) },
    include: {
      productionOutwardDetails: true,
    },
  });

  if (!found) return NoRecordFound("Production Outward");

  const data = await prisma.$transaction(async (tx) => {
    // Delete outward first so the sum doesn't include it
    const deleted = await tx.productionOutward.delete({
      where: { id: parseInt(id) },
    });

    // Recalculate process route status based on remaining outwards
    await updateProcessRoutes(tx, found.jobCardId, found.productionOutwardDetails);

    return deleted;
  });

  return { statusCode: 0, data };
}

export { get, getOne, create, update, remove, getOutwardJobCardDtls };

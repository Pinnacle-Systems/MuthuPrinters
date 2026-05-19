// productionInward.service.js

import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getDateFromDateTime,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";

const REFERENCE_PAGE = "PRODUCTION INWARD";

// ─────────────────────────────────────────────────────────────
// DOC ID
// ─────────────────────────────────────────────────────────────

async function getNextDocId(branchId, shortCode, startTime, endTime, saveType) {
  if (saveType) return "Draft Save";

  let lastObject = await prisma.productionInward.findFirst({
    where: {
      branchId: parseInt(branchId),
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");

  let newDocId = `${branchObj.branchCode}/${shortCode}/PIN/1`;

  if (lastObject) {
    if (lastObject.docId === "Draft Save") {
      const records = await prisma.productionInward.findMany({
        select: { docId: true },
        where: {
          branchId: parseInt(branchId),
          AND: [
            { createdAt: { gte: startTime } },
            { createdAt: { lte: endTime } },
          ],
        },
      });

      const maxDocId = records.reduce((max, current) => {
        const currentNo = Number(current.docId.split("/").pop());
        const maxNo = max ? Number(max.split("/").pop()) : 0;

        return currentNo > maxNo ? current.docId : max;
      }, null);

      newDocId = `${branchObj.branchCode}/${shortCode}/PIN/${
        parseInt(maxDocId.split("/").at(-1)) + 1
      }`;
    } else {
      newDocId = `${branchObj.branchCode}/${shortCode}/PIN/${
        parseInt(lastObject.docId.split("/").at(-1)) + 1
      }`;
    }
  }

  return newDocId;
}

// ─────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────

function getProductionInwardStatus(inward) {
  const inwardDetails = inward.inwardDetails || [];

  const totalReceived = inwardDetails.reduce(
    (sum, item) => sum + (item.receivedQty || 0),
    0,
  );

  const totalAccepted = inwardDetails.reduce(
    (sum, item) => sum + (item.acceptedQty || 0),
    0,
  );

  const totalWastage = inwardDetails.reduce(
    (sum, item) => sum + (item.wastageQty || 0),
    0,
  );

  if (totalReceived === 0) return "Pending";

  if (totalAccepted === totalReceived) return "Fully Accepted";

  if (totalWastage > 0) return "Wastage Added";

  return "Partially Accepted";
}

// ─────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchSupplier,
    finYearId,
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

  let data = await prisma.productionInward.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,

      AND: finYearDate
        ? [
            { createdAt: { gte: finYearDate.startTime } },
            { createdAt: { lte: finYearDate.endTime } },
          ]
        : undefined,

      docId: Boolean(searchDocNo) ? { contains: searchDocNo } : undefined,

      Supplier: {
        name: searchSupplier ? { contains: searchSupplier } : undefined,
      },
    },

    include: {
      Supplier: {
        select: {
          id: true,
          name: true,
        },
      },

      Branch: {
        select: {
          id: true,
          branchName: true,
        },
      },

      JobCard: {
        select: {
          id: true,
          docId: true,
        },
      },

      ProductionOutward: {
        select: {
          id: true,
          docId: true,
        },
      },

      inwardDetails: true,
    },

    orderBy: {
      id: "desc",
    },
  });

  let totalCount = data.length;

  if (searchDocDate) {
    data = data.filter((item) =>
      String(getDateFromDateTime(item.docDate)).includes(searchDocDate),
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
      status: getProductionInwardStatus(item),
    })),

    nextDocId: newDocId,

    totalCount,
  };
}

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────

async function getOne(id) {
  const data = await prisma.productionInward.findUnique({
    where: {
      id: parseInt(id),
    },

    include: {
      Supplier: true,

      Branch: true,

      JobCard: true,

      ProductionOutward: true,

      inwardDetails: {
        include: {
          Process: true,

          ProductionOutwardDtl: true,
        },
      },
    },
  });

  if (!data) {
    return NoRecordFound("Production Inward");
  }

  return {
    statusCode: 0,

    data: {
      ...data,

      status: getProductionInwardStatus(data),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

async function create(body) {
  const {
    userId,
    branchId,
    finYearId,
    docDate,
    remarks,
    productionOutwardId,
    supplierId,
    inwardType,
    dcNo,
    dcDate,
    vehicleNo,
    receiptType,
    invNo,
    netBillValue,
    discountType,
    discountValue,
    taxTemplateId,
    jobCardId,
    inwardDetails,
    draftSave,
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
    draftSave,
  );

  let data;

  await prisma.$transaction(async (tx) => {
    data = await tx.productionInward.create({
      data: {
        docId: newDocId,

        docDate: docDate ? new Date(docDate) : null,

        remarks,

        createdById: parseInt(userId),

        branchId: branchId ? parseInt(branchId) : null,

        supplierId: supplierId ? parseInt(supplierId) : null,

        // productionOutwardId: productionOutwardId
        //   ? parseInt(productionOutwardId)
        //   : null,

        // jobCardId: jobCardId ? parseInt(jobCardId) : null,

        inwardType,

        dcNo,

        dcDate: dcDate ? new Date(dcDate) : null,

        vehicleNo,

        receiptType,

        invNo,

        netBillValue: netBillValue ? parseFloat(netBillValue) : null,

        discountType,

        discountValue: discountValue ? parseFloat(discountValue) : null,

        taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,

        inwardDetails: {
          create: inwardDetails.map((item) => ({
            outwardDetailId: item.outwardDetailId
              ? parseInt(item.outwardDetailId)
              : null,

            receivedQty: parseFloat(item.receivedQty || 0),

            wastageQty: parseFloat(item.wastageQty || 0),

            acceptedQty:
              parseFloat(item.receivedQty || 0) -
              parseFloat(item.wastageQty || 0),

            processId: item.processId ? parseInt(item.processId) : null,

            price: item.price ? parseFloat(item.price) : null,

            discountType: item.discountType,

            discountValue: item.discountValue
              ? parseFloat(item.discountValue)
              : null,

            taxPercent: item.taxPercent ? parseFloat(item.taxPercent) : null,

            jobCardId: item.jobCardId ? parseInt(item.jobCardId) : null,

            productionOutwardId: item.productionOutwardId
              ? parseInt(item.productionOutwardId)
              : null,
          })),
        },
      },

      include: {
        inwardDetails: true,
      },
    });

    // UPDATE OUTWARD DETAIL RECEIVED QTY

    // for (const item of inwardDetails) {
    //   if (item.outwardDetailId) {
    //     const outwardDtl = await tx.productionOutwardDtl.findUnique({
    //       where: {
    //         id: parseInt(item.outwardDetailId),
    //       },
    //     });

    //     if (outwardDtl) {
    //       const totalReceived =
    //         parseFloat(outwardDtl.receivedQty || 0) +
    //         parseFloat(item.receivedQty || 0);

    //       const pending = parseFloat(outwardDtl.sentQty || 0) - totalReceived;

    //       await tx.productionOutwardDtl.update({
    //         where: {
    //           id: outwardDtl.id,
    //         },

    //         data: {
    //           receivedQty: totalReceived,

    //           pendingQty: pending,
    //         },
    //       });
    //     }
    //   }
    // }
  });

  return {
    statusCode: 0,
    data,
  };
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

async function update(id, body) {
  const {
    userId,
    branchId,
    docDate,
    remarks,
    // productionOutwardId,
    supplierId,
    inwardType,
    dcNo,
    dcDate,
    vehicleNo,
    receiptType,
    invNo,
    netBillValue,
    discountType,
    discountValue,
    taxTemplateId,
    // jobCardId,
    inwardDetails,
  } = body;

  const dataFound = await prisma.productionInward.findUnique({
    where: {
      id: parseInt(id),
    },

    include: {
      inwardDetails: true,
    },
  });

  if (!dataFound) {
    return NoRecordFound("Production Inward");
  }

  const removedItems = dataFound.inwardDetails.filter(
    (oldItem) =>
      !inwardDetails.find(
        (newItem) => parseInt(newItem.id) === parseInt(oldItem.id),
      ),
  );

  const removedIds = removedItems.map((item) => parseInt(item.id));

  let data;

  await prisma.$transaction(async (tx) => {
    // REVERT OLD RECEIVED QTY

    // for (const oldItem of dataFound.inwardDetails) {
    //   if (oldItem.outwardDetailId) {
    //     const outwardDtl = await tx.productionOutwardDtl.findUnique({
    //       where: {
    //         id: parseInt(oldItem.outwardDetailId),
    //       },
    //     });

    //     if (outwardDtl) {
    //       const totalReceived =
    //         parseFloat(outwardDtl.receivedQty || 0) -
    //         parseFloat(oldItem.receivedQty || 0);

    //       const pending = parseFloat(outwardDtl.sentQty || 0) - totalReceived;

    //       await tx.productionOutwardDtl.update({
    //         where: {
    //           id: outwardDtl.id,
    //         },

    //         data: {
    //           receivedQty: totalReceived,

    //           pendingQty: pending,
    //         },
    //       });
    //     }
    //   }
    // }

    if (removedIds.length > 0) {
      await tx.productionInwardDtl.deleteMany({
        where: {
          id: {
            in: removedIds,
          },
        },
      });
    }

    data = await tx.productionInward.update({
      where: {
        id: parseInt(id),
      },

      data: {
        updatedById: parseInt(userId),

        branchId: branchId ? parseInt(branchId) : null,

        docDate: docDate ? new Date(docDate) : null,

        remarks,

        // productionOutwardId: productionOutwardId
        //   ? parseInt(productionOutwardId)
        //   : null,

        supplierId: supplierId ? parseInt(supplierId) : null,

        inwardType,

        dcNo,

        dcDate: dcDate ? new Date(dcDate) : null,

        vehicleNo,

        receiptType,

        invNo,

        netBillValue: netBillValue ? parseFloat(netBillValue) : null,

        discountType,

        discountValue: discountValue ? parseFloat(discountValue) : null,

        taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,

        // jobCardId: jobCardId ? parseInt(jobCardId) : null,
      },
    });

    // UPDATE / CREATE DETAILS

    for (const item of inwardDetails) {
      if (item.id) {
        await tx.productionInwardDtl.update({
          where: {
            id: parseInt(item.id),
          },

          data: {
            outwardDetailId: item.outwardDetailId
              ? parseInt(item.outwardDetailId)
              : null,

            receivedQty: parseFloat(item.receivedQty || 0),

            wastageQty: parseFloat(item.wastageQty || 0),

            acceptedQty:
              parseFloat(item.receivedQty || 0) -
              parseFloat(item.wastageQty || 0),

            processId: item.processId ? parseInt(item.processId) : null,

            price: item.price ? parseFloat(item.price) : null,

            discountType: item.discountType,

            discountValue: item.discountValue
              ? parseFloat(item.discountValue)
              : null,

            taxPercent: item.taxPercent ? parseFloat(item.taxPercent) : null,
          },
        });
      } else {
        await tx.productionInwardDtl.create({
          data: {
            productionInwardId: parseInt(id),

            outwardDetailId: item.outwardDetailId
              ? parseInt(item.outwardDetailId)
              : null,

            receivedQty: parseFloat(item.receivedQty || 0),

            wastageQty: parseFloat(item.wastageQty || 0),

            acceptedQty:
              parseFloat(item.receivedQty || 0) -
              parseFloat(item.wastageQty || 0),

            processId: item.processId ? parseInt(item.processId) : null,

            price: item.price ? parseFloat(item.price) : null,

            discountType: item.discountType,

            discountValue: item.discountValue
              ? parseFloat(item.discountValue)
              : null,

            taxPercent: item.taxPercent ? parseFloat(item.taxPercent) : null,
          },
        });
      }
    }

    // ADD NEW RECEIVED QTY

    // for (const item of inwardDetails) {
    //   if (item.outwardDetailId) {
    //     const outwardDtl = await tx.productionOutwardDtl.findUnique({
    //       where: {
    //         id: parseInt(item.outwardDetailId),
    //       },
    //     });

    //     if (outwardDtl) {
    //       const totalReceived =
    //         parseFloat(outwardDtl.receivedQty || 0) +
    //         parseFloat(item.receivedQty || 0);

    //       const pending = parseFloat(outwardDtl.sentQty || 0) - totalReceived;

    //       await tx.productionOutwardDtl.update({
    //         where: {
    //           id: outwardDtl.id,
    //         },

    //         data: {
    //           receivedQty: totalReceived,

    //           pendingQty: pending,
    //         },
    //       });
    //     }
    //   }
    // }
  });

  return {
    statusCode: 0,
    data,
  };
}

// ─────────────────────────────────────────────────────────────
// REMOVE
// ─────────────────────────────────────────────────────────────

async function remove(id) {
  const dataFound = await prisma.productionInward.findUnique({
    where: {
      id: parseInt(id),
    },

    include: {
      inwardDetails: true,
    },
  });

  if (!dataFound) {
    return NoRecordFound("Production Inward");
  }

  await prisma.$transaction(async (tx) => {
    // REVERT OUTWARD RECEIVED QTY

    // for (const item of dataFound.inwardDetails) {
    //   if (item.outwardDetailId) {
    //     const outwardDtl = await tx.productionOutwardDtl.findUnique({
    //       where: {
    //         id: parseInt(item.outwardDetailId),
    //       },
    //     });

    //     if (outwardDtl) {
    //       const totalReceived =
    //         parseFloat(outwardDtl.receivedQty || 0) -
    //         parseFloat(item.receivedQty || 0);

    //       const pending = parseFloat(outwardDtl.sentQty || 0) - totalReceived;

    //       await tx.productionOutwardDtl.update({
    //         where: {
    //           id: outwardDtl.id,
    //         },

    //         data: {
    //           receivedQty: totalReceived,

    //           pendingQty: pending,
    //         },
    //       });
    //     }
    //   }
    // }

    await tx.productionInward.delete({
      where: {
        id: parseInt(id),
      },
    });
  });

  return {
    statusCode: 0,
    message: "Production Inward Deleted Successfully",
  };
}

export { get, getOne, create, update, remove };

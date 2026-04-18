import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getYearShortCode,
  getDateFromDateTime,
  buildDateRange,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import fs from "fs";
import path from "path";

async function getNextDocId(
  branchId,
  shortCode,
  startTime,
  endTime,
  saveType,
  docId,
  isUpdate,
) {
  // Case 1: Draft save
  if (saveType) {
    return "Draft Save";
  } else if (isUpdate === "drift") {
    lastObject = await prisma.orderEntry.findFirst({
      where: {
        branchId: parseInt(branchId),
        draftSave: false,
        AND: [
          { createdAt: { gte: startTime } },
          { createdAt: { lte: endTime } },
        ],
      },
      orderBy: { id: "desc" },
    });
    const branchObj = await getTableRecordWithId(branchId, "branch");
    let newDocId = `${branchObj.branchCode}${getYearShortCode(
      new Date(),
    )}/OE/1`;

    if (lastObject) {
      newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/OE/${
        parseInt(lastObject.docId.split("/").at(-1)) + 1
      }`;
    }

    return newDocId;
  } else {
    let lastObject = await prisma.orderEntry.findFirst({
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
    let newDocId = `${branchObj.branchCode}/${shortCode}/OE/1`;
    if (lastObject) {
      if (lastObject.docId === "Draft Save") {
        const records = await prisma.orderEntry.findMany({
          select: {
            docId: true,
          },
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
        });
        const maxDocId = records.reduce((max, current) => {
          const currentNo = Number(current.docId.split("/").pop());
          const maxNo = max ? Number(max.split("/").pop()) : 0;

          return currentNo > maxNo ? current.docId : max;
        }, null);
        newDocId = `${branchObj.branchCode}/${shortCode}/OE/${
          parseInt(maxDocId.split("/").at(-1)) + 1
        }`;
      } else {
        newDocId = `${branchObj.branchCode}/${shortCode}/OE/${
          parseInt(lastObject.docId.split("/").at(-1)) + 1
        }`;
      }
    }
    return newDocId;
  }
}

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    serachDocNo,
    searchDocDate,
    searchOrderType,
    finYearId,
    searchCustomer,
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
  let data;
  let totalCount;
  data = await prisma.orderEntry.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
            {
              createdAt: {
                gte: finYearDate.startTime,
              },
            },
            {
              createdAt: {
                lte: finYearDate.endTime,
              },
            },
          ]
        : undefined,
      docId: Boolean(serachDocNo)
        ? {
            contains: serachDocNo,
          }
        : undefined,
      orderType: Boolean(searchOrderType)
        ? { contains: searchOrderType }
        : undefined,
      customer: {
        name: searchCustomer ? { contains: searchCustomer } : undefined,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      docId: "desc",
    },
  });
  totalCount = data.length;
  if (searchDocDate) {
    data = data?.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
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
      childRecord: 0,
    })),
    nextDocId: newDocId,
    totalCount,
  };
}

async function getOne(id) {
  const data = await prisma.orderEntry.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      attachments: true,
      Branch: {
        select: {
          branchName: true,
        },
      },
      customer: {
        select: {
          name: true,
        },
      },
    },
  });
  if (!data) return NoRecordFound("Purchase Inward");
  return {
    statusCode: 0,
    data: data,
  };
}

async function create(body) {
  const {
    userId,
    branchId,
    docDate,
    customerId,
    orderType,
    deliveryDate,
    remarks,
    requirements,
    finYearId,
    orderQty,
    attachments,
    draftSave,
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
    draftSave,
  );
  let data;
  const safeorderQty =
    orderQty && !isNaN(Number(orderQty)) ? parseFloat(orderQty) : null;
  await prisma.$transaction(async (tx) => {
    data = await tx.orderEntry.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        createdById: parseInt(userId),
        branchId: parseInt(branchId),
        customerId: parseInt(customerId),
        orderType,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        remarks,
        requirements,
        orderQty: safeorderQty,
        attachments:
          JSON.parse(attachments)?.length > 0
            ? {
                createMany: {
                  data: JSON.parse(attachments).map((sub) => ({
                    date: sub?.date ? new Date(sub?.date) : undefined,
                    filePath: sub?.filePath ? sub?.filePath : undefined,
                    name: sub?.name ? sub?.name : undefined,
                  })),
                },
              }
            : undefined,
      },
    });
  });
  return { statusCode: 0, data };
}

async function update(id, body, files) {
  const {
    userId,
    branchId,
    docDate,
    customerId,
    orderType,
    deliveryDate,
    remarks,
    requirements,
    orderQty,
    attachments,
  } = await body;

  const safeorderQty =
    orderQty && !isNaN(Number(orderQty)) ? parseFloat(orderQty) : null;

  const parseAttachments = JSON.parse(attachments || "[]");
  const incomingIds = parseAttachments
    ?.filter((i) => i.id)
    .map((i) => parseInt(i.id));

  let data;
  const dataFound = await prisma.orderEntry.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      attachments: { select: { id: true, filePath: true } },
    },
  });
  if (!dataFound) return NoRecordFound("Purchase Inward");
  const removedAttachments = dataFound.attachments.filter(
    (existing) => !incomingIds.includes(existing.id),
  );
  const updatedAttachmentsWithNewFile = dataFound.attachments.filter(
    (existing) => {
      const incoming = parseAttachments.find(
        (i) => parseInt(i.id) === existing.id,
      );
      // If incoming filePath is empty/changed and old had a file
      return (
        incoming &&
        existing.filePath &&
        (!incoming.filePath || incoming.filePath !== existing.filePath)
      );
    },
  );

  // ✅ Unlink removed attachment files
  const unlinkFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join("./uploads", filePath);
    fs.unlink(fullPath, (err) => {
      if (err) console.warn(`Could not delete file: ${fullPath}`, err.message);
      else console.log(`Deleted file: ${fullPath}`);
    });
  };

  // Delete files for removed attachments
  removedAttachments.forEach((att) => unlinkFile(att.filePath));

  // Delete old files for attachments where file was replaced
  updatedAttachmentsWithNewFile.forEach((att) => unlinkFile(att.filePath));

  await prisma.$transaction(async (tx) => {
    data = await tx.orderEntry.update({
      where: {
        id: parseInt(id),
      },
      data: {
        docDate: docDate ? new Date(docDate) : null,
        updatedById: parseInt(userId),
        branchId: parseInt(branchId),
        customerId: parseInt(customerId),
        orderType,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        remarks,
        requirements,
        orderQty: safeorderQty,
        attachments: {
          deleteMany: {
            ...(incomingIds.length > 0 && {
              id: { notIn: incomingIds },
            }),
          },

          update: parseAttachments
            .filter((item) => item.id)
            .map((sub) => ({
              where: { id: parseInt(sub.id) },
              data: {
                date: sub?.date ? new Date(sub?.date) : undefined,
                filePath: (() => {
                  const matchedFile = files?.find(
                    (f) => f.originalname === sub.filePath,
                  );
                  return matchedFile
                    ? matchedFile.filename
                    : sub.filePath || undefined;
                })(),
                name: sub?.name ? sub?.name : undefined,
              },
            })),

          create: parseAttachments
            .filter((item) => !item.id)
            .map((sub) => ({
              date: sub?.date ? new Date(sub?.date) : undefined,
              filePath: (() => {
                const matchedFile = files?.find(
                  (f) => f.originalname === sub.filePath,
                );
                return matchedFile ? matchedFile.filename : sub.filePath;
              })(),
              name: sub?.name ? sub?.name : undefined,
            })),
        },
      },
    });
  });
  return { statusCode: 0, data };
}

async function remove(id) {
  const dataFound = await prisma.orderEntry.findUnique({
    where: { id: parseInt(id) },
    include: { attachments: { select: { filePath: true } } },
  });

  // ✅ Unlink all attachment files
  //   dataFound?.attachments?.forEach((att) => {
  //     if (!att.filePath) return;
  //     const fullPath = path.join("./uploads", att.filePath);
  //     fs.unlink(fullPath, (err) => {
  //       if (err) console.warn(`Could not delete: ${fullPath}`, err.message);
  //     });
  //   });
  const data = await prisma.orderEntry.delete({
    where: {
      id: parseInt(id),
    },
  });

  return { statusCode: 0, data };
}

export { get, getOne, create, update, remove };

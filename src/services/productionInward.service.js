// productionInward.service.js

import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import { getYearShortCodeForFinYear } from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  let lastObject = await prisma.productionInward.findFirst({
    where: {
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");

  let newDocId = `${branchObj.branchCode}/${shortCode}/PIN/1`;

  if (lastObject) {
    const parts = lastObject.docId.split("/");
    const lastNum = parseInt(parts.at(-1));

    if (!isNaN(lastNum)) {
      newDocId = `${branchObj.branchCode}/${shortCode}/PIN/${lastNum + 1}`;
    }
  }

  return newDocId;
}

async function create(body) {
  const {
    userId,
    branchId,
    finYearId,
    docDate,
    remarks,
    productionOutwardId,
    vendorId,
    inwardDetails,
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

  const data = await prisma.productionInward.create({
    data: {
      docId: newDocId,

      docDate: docDate ? new Date(docDate) : null,

      remarks,

      createdById: parseInt(userId),

      productionOutwardId: productionOutwardId
        ? parseInt(productionOutwardId)
        : null,

      vendorId: vendorId ? parseInt(vendorId) : null,

      inwardDetails: {
        createMany: {
          data: inwardDetails.map((item) => ({
            outwardDetailId: item.outwardDetailId
              ? parseInt(item.outwardDetailId)
              : null,

            receivedQty: item.receivedQty ? parseInt(item.receivedQty) : 0,

            wastageQty: item.wastageQty ? parseInt(item.wastageQty) : 0,

            acceptedQty:
              parseInt(item.receivedQty || 0) - parseInt(item.wastageQty || 0),

            remarks: item.remarks || null,
          })),
        },
      },
    },

    include: {
      inwardDetails: true,
    },
  });

  for (const item of inwardDetails) {
    if (item.outwardDetailId) {
      const outwardDtl = await prisma.productionOutwardDtl.findUnique({
        where: {
          id: parseInt(item.outwardDetailId),
        },
      });

      if (outwardDtl) {
        const totalReceived =
          (outwardDtl.receivedQty || 0) + parseInt(item.receivedQty || 0);

        const pending = (outwardDtl.sentQty || 0) - totalReceived;

        await prisma.productionOutwardDtl.update({
          where: {
            id: outwardDtl.id,
          },

          data: {
            receivedQty: totalReceived,
            pendingQty: pending,
          },
        });
      }
    }
  }

  return {
    statusCode: 0,
    data,
  };
}

export { create };

// model ProductionInward {
//   id                   Int      @id @default(autoincrement())
//   docId                String
//   docDate              DateTime?

//   productionOutwardId  Int?
//   ProductionOutward    ProductionOutward?
//     @relation(fields: [productionOutwardId], references: [id])

//   vendorId             Int?
//   Vendor               Party?
//     @relation(fields: [vendorId], references: [id])

//   remarks              String?

//   inwardDetails        ProductionInwardDtl[]

//   createdAt            DateTime @default(now())
// }

// model ProductionInwardDtl {
//   id                   Int      @id @default(autoincrement())

//   productionInwardId   Int
//   ProductionInward     ProductionInward
//     @relation(fields: [productionInwardId], references: [id], onDelete: Cascade)

//   outwardDetailId      Int?
//   ProductionOutwardDtl ProductionOutwardDtl?
//     @relation(fields: [outwardDetailId], references: [id])

//   receivedQty          Int?

//   wastageQty           Int?

//   acceptedQty          Int?

//   remarks              String?
// }

// model VendorBill {
//   id Int @id @default(autoincrement())

//   docId String
//   docDate DateTime?

//   vendorId Int?
//   Vendor Party?
//     @relation(fields: [vendorId], references: [id])

//   productionInwardId Int?
//   ProductionInward ProductionInward?
//     @relation(fields: [productionInwardId], references: [id])

//   totalAmount Float?

//   billDetails VendorBillDtl[]

//   remarks String?
// }

// model VendorBillDtl {
//   id Int @id @default(autoincrement())

//   vendorBillId Int
//   VendorBill VendorBill
//    @relation(fields: [vendorBillId], references: [id])

//   processId Int?

//   qty Float?

//   rate Float?

//   amount Float?
// }

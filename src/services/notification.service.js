import { prisma } from "../lib/prisma.js";
const REFERENCE_PAGE = "ORDER ENTRY";

async function checkPendingJobCards(userId) {
  const today = new Date();

  const pendingItems = await prisma.orderItems.findMany({
    where: {
      jobCards: {
        none: {},
      },

      OrderEntry: {
        OR: [{ validTo: { gte: today } }, { validTo: null }],
      },
    },

    include: {
      OrderEntry: true,
      StyleItem: true,
    },
  });

  const pendingItemIds = pendingItems.map((item) => item.id);
  // Clean up any old "Job Card Pending" notifications that are no longer pending
  // (e.g. Job card was created, or OrderEntry was deleted/expired)
  await prisma.notification.deleteMany({
    where: {
      userId: parseInt(userId),
      referencePage: REFERENCE_PAGE,
      title: "Job Card Pending",
      referenceId: {
        notIn: pendingItemIds,
      },
    },
  });
  for (const item of pendingItems) {
    const alreadyExists = await prisma.notification.findFirst({
      where: {
        referenceId: item.id,
        referencePage: REFERENCE_PAGE,
      },
    });

    if (!alreadyExists) {
      await prisma.notification.create({
        data: {
          title: "Job Card Pending",

          message: `Job Card not created for ${item.StyleItem?.name || ""} in ${item.OrderEntry?.docId || ""}`,

          type: "WARNING",

          userId: parseInt(userId),

          referenceId: item.id,

          referencePage: REFERENCE_PAGE,
        },
      });
    }
  }
}

async function checkPendingBulkOrders(userId) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 25);

  // Find sample orders older than 25 days with a refNo
  const sampleOrders = await prisma.orderEntry.findMany({
    where: {
      productionType: "SAMPLE",
      refNo: {
        not: "",
      },
      createdAt: {
        lte: cutoffDate,
      },
    },
  });

  const pendingSampleIds = [];

  for (const sample of sampleOrders) {
    // Check if there is a Bulk order with this refNo
    const bulkOrder = await prisma.orderEntry.findFirst({
      where: {
        productionType: "BULK",
        refNo: sample.refNo,
      },
    });

    if (!bulkOrder) {
      pendingSampleIds.push(sample.id);

      const alreadyExists = await prisma.notification.findFirst({
        where: {
          referenceId: sample.id,
          referencePage: REFERENCE_PAGE,
          title: "Bulk Order Pending",
        },
      });

      if (!alreadyExists) {
        await prisma.notification.create({
          data: {
            title: "Bulk Order Pending",
            message: `Bulk order not created for sample ${sample.refNo} (Order No: ${sample.docId})`,
            type: "WARNING",
            userId: parseInt(userId),
            referenceId: sample.id,
            referencePage: REFERENCE_PAGE,
          },
        });
      }
    }
  }

  // Clean up any old "Bulk Order Pending" notifications that are no longer pending
  await prisma.notification.deleteMany({
    where: {
      userId: parseInt(userId),
      referencePage: REFERENCE_PAGE,
      title: "Bulk Order Pending",
      referenceId: {
        notIn: pendingSampleIds,
      },
    },
  });
}

async function getNotifications(req) {
  const userId = req.userId;

  await checkPendingJobCards(userId);
  await checkPendingBulkOrders(userId);

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
  console.log(notifications, "notifications");

  return {
    statusCode: 0,
    data: notifications,
  };
}

async function markAsRead(req) {
  const { id } = req.body;

  await prisma.notification.update({
    where: {
      id,
    },
    data: {
      isRead: true,
    },
  });

  return {
    statusCode: 0,
    data: "Notification marked as read",
  };
}

// await prisma.notification.updateMany({
//   where: {
//     referenceId: orderItemId,
//     referencePage: "JOB_CARD_PENDING",
//   },

//   data: {
//     isResolved: true,
//   },
// });

// And query:

// isResolved: false
export { checkPendingJobCards, getNotifications, markAsRead };

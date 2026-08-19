import { prisma } from "../lib/prisma.js";

async function ReworkPendingProcess(req) {
  const { jobCardId, processRouteId, reason, completedQty, wastageQty, userId } = req.body;

  if (!jobCardId || !processRouteId) {
    return { statusCode: 1, message: "jobCardId and processRouteId are required" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the current process route
      const currentRoute = await tx.processRoute.findUnique({
        where: { id: Number(processRouteId) },
      });

      if (!currentRoute) {
        throw new Error("ProcessRoute not found");
      }

      const actualQty = currentRoute.actualQty || 0;
      const completed = Number(completedQty) || 0;
      const wastage = Number(wastageQty) || 0;
      const pendingQty = actualQty - (completed + wastage);

      // We only rework if there is pending quantity
      if (pendingQty <= 0) {
        throw new Error("No pending quantity available for rework. Quantities meet or exceed actual quantity.");
      }

      // 2. Log to the new ReworkLog table
      await tx.reworkLog.create({
        data: {
          jobCardId: Number(jobCardId),
          processRouteId: Number(processRouteId),
          actualQty: actualQty,
          completedQty: completed,
          wastageQty: wastage,
          pendingQty: pendingQty,
          reason: reason || "Partially Completed",
          Userid: userId ? Number(userId) : null
        }
      });

      // 3. Update all existing pending processes for the "good" batch to match the completed qty
      // We only update sequences > the current sequence, because previous sequences are already done.
      await tx.processRoute.updateMany({
        where: {
          jobCardId: Number(jobCardId),
          sequence: { gt: currentRoute.sequence },
        },
        data: {
          actualQty: completed,
        }
      });

      // 4. Clone all processes from Seq 1 up to the current sequence for the pending amount
      const initialRoutes = await tx.processRoute.findMany({
        where: {
          jobCardId: Number(jobCardId),
          sequence: { lte: currentRoute.sequence },
        },
        orderBy: { sequence: 'asc' }
      });

      // Get the current max sequence on this JobCard so we can append
      const maxSequenceRoute = await tx.processRoute.findFirst({
        where: { jobCardId: Number(jobCardId) },
        orderBy: { sequence: 'desc' }
      });
      let nextSequence = maxSequenceRoute ? maxSequenceRoute.sequence + 1 : 1;

      // Prepare new routes
      const newRoutesData = initialRoutes.map((route) => {
        return {
          jobCardId: Number(jobCardId),
          processId: route.processId,
          type: route.type,
          sequence: nextSequence++,
          isFront: route.isFront,
          isFrontAndBack: route.isFrontAndBack,
          actualQty: pendingQty,
          completedQty: null,
          pendingQty: null,
          wastageQty: null,
          status: "NOT_STARTED",
        };
      });

      // 5. Append the duplicated routes to the JobCard
      await tx.processRoute.createMany({
        data: newRoutesData
      });

      return {
        message: "Rework triggered successfully. Original quantities adjusted and rework appended.",
        pendingQtyAdded: pendingQty
      };
    });

    return { statusCode: 0, data: result };

  } catch (error) {
    console.error("Error in ReworkPendingProcess:", error);
    return { statusCode: 1, message: error.message || "Failed to process rework" };
  }
}

export {
  ReworkPendingProcess
};

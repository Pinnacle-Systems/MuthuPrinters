import { prisma } from "../lib/prisma.js";

// ── Condition evaluator ─────────────────────────────────────────────────────
// Safely evaluates simple expressions like "totalNetAmount > 10000"
// or "true" (always apply). Returns boolean.
// Condition = "totalNetAmount > 100000"   recordData = { totalNetAmount: 150000 }
//      ↓
// new Function("totalNetAmount", "return !!(totalNetAmount > 100000)")(150000)
//      ↓
// 150000 > 100000 = true ✅
//      ↓
// ApprovalLog created → PENDING

function evaluateCondition(condition, record) {
  if (!condition || condition.trim() === "" || condition.trim() === "true") {
    return true;
  }
  try {
    // Build a sandboxed function with the record's fields as variables
    const keys = Object.keys(record);
    const values = keys.map((k) => record[k]);
    // eslint-disable-next-line no-new-func
    return new Function(...keys, `return !!(${condition})`)(...values);
  } catch {
    return false; // if condition fails to parse, skip level
  }
}

// ── 1. Check if approval is ON ──────────────────────────────────────────────
export async function isApprovalEnabled(branchId, pageId) {
  const config = await prisma.approvalConfig.findUnique({
    where: { branchId_pageId: { branchId: +branchId, pageId: +pageId } },
  });
  return { enabled: config?.active === true, config };
}

// ── 2. Create PENDING log + resolve which levels apply based on record data ─
export async function createApprovalLog(
  tx,
  branchId,
  pageId,
  referenceId,
  referencePage,
  recordData = {},
) {
  const config = await tx.approvalConfig.findUnique({
    where: {
      branchId_pageId: {
        branchId: parseInt(branchId),
        pageId: parseInt(pageId),
      },
    },
    include: {
      approvalLevels: {
        include: { LevelUsers: true },
        orderBy: { levelNo: "asc" },
      },
    },
  });
  console.log("config", config);
  if (!config?.active) return null;
  // Filter levels whose condition is met
  const applicableLevels = config.approvalLevels.filter((lvl) =>
    evaluateCondition(lvl.condition, recordData),
  );
  console.log("applicableLevels", applicableLevels);
  if (applicableLevels.length === 0) return null; // no levels apply → auto-pass
  const log = await tx.approvalLog.create({
    data: {
      approvalConfigId: config.id,
      referenceId: +referenceId,
      referencePage,
      status: "PENDING",
      currentLevel: applicableLevels[0].levelNo,
    },
  });
  return { log, applicableLevels };
}

// ── 3. Get full approval status of a record ─────────────────────────────────
export async function getApprovalLog(referenceId, referencePage) {
  return await prisma.approvalLog.findFirst({
    where: { referenceId: +referenceId, referencePage },
    include: {
      ApprovalConfig: {
        include: {
          ApprovalLevels: {
            include: { LevelUsers: { include: { User: true } } },
            orderBy: { levelNo: "asc" },
          },
        },
      },
      LevelLogs: {
        include: { User: { select: { id: true, username: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// ── 4. Can this user act on the current level? ──────────────────────────────
export async function canUserActOnLevel(approvalLog, userId) {
  const config = approvalLog.ApprovalConfig;
  if (!config) return false;

  const currentLevel = config.ApprovalLevels.find(
    (l) => l.levelNo === approvalLog.currentLevel,
  );
  if (!currentLevel) return false;

  return currentLevel.LevelUsers.some((lu) => lu.userId === +userId);
}

// ── 5. Advance or complete approval ────────────────────────────────────────
// Call this after a user approves one level.
async function advanceApproval(tx, approvalLog, applicableLevelNos) {
  const nextLevel = applicableLevelNos.find(
    (n) => n > approvalLog.currentLevel,
  );
  if (nextLevel) {
    return await tx.approvalLog.update({
      where: { id: approvalLog.id },
      data: { currentLevel: nextLevel },
    });
  }
  // All levels done → fully APPROVED
  return await tx.approvalLog.update({
    where: { id: approvalLog.id },
    data: { status: "APPROVED" },
  });
}

// ── 6. Approve action ───────────────────────────────────────────────────────
export async function approveRecord(
  referenceId,
  referencePage,
  userId,
  remarks,
  recordData = {},
) {
  return await prisma.$transaction(async (tx) => {
    const log = await tx.approvalLog.findFirst({
      where: { referenceId: +referenceId, referencePage },
      include: {
        ApprovalConfig: {
          include: {
            ApprovalLevels: {
              include: { LevelUsers: true },
              orderBy: { levelNo: "asc" },
            },
          },
        },
        LevelLogs: true,
      },
    });

    if (!log) return { statusCode: 1, message: "Approval log not found" };
    if (log.status === "APPROVED")
      return { statusCode: 1, message: "Already approved" };
    if (log.status === "REJECTED")
      return { statusCode: 1, message: "Already rejected" };

    const config = log.ApprovalConfig;
    const applicableLevels = config.ApprovalLevels.filter((lvl) =>
      evaluateCondition(lvl.condition, recordData),
    );
    const currentLevel = applicableLevels.find(
      (l) => l.levelNo === log.currentLevel,
    );
    if (!currentLevel)
      return { statusCode: 1, message: "Current level not found" };

    // Auth check
    const isAuthorised = currentLevel.LevelUsers.some(
      (lu) => lu.userId === +userId,
    );
    if (!isAuthorised)
      return { statusCode: 1, message: "Not authorised to approve this level" };

    // Record this user's approval for the level
    await tx.approvalLevelLog.create({
      data: {
        approvalLogId: log.id,
        approvalLevelId: currentLevel.id,
        levelNo: currentLevel.levelNo,
        userId: +userId,
        action: "APPROVED",
        remarks: remarks || null,
      },
    });

    // Check if level is satisfied
    const levelApprovals = [
      ...log.LevelLogs.filter(
        (ll) =>
          ll.approvalLevelId === currentLevel.id && ll.action === "APPROVED",
      ),
      { userId: +userId }, // optimistically include current action
    ];

    const uniqueApprovers = new Set(levelApprovals.map((l) => l.userId));
    const requiredCount = currentLevel.LevelUsers.length;
    const levelSatisfied =
      currentLevel.approverLogic === "OR"
        ? uniqueApprovers.size >= 1
        : uniqueApprovers.size >= requiredCount; // AND: all users must approve

    if (!levelSatisfied) {
      return {
        statusCode: 0,
        message: "Approval recorded. Waiting for other approvers.",
        data: log,
      };
    }

    // Level satisfied → advance
    const applicableLevelNos = applicableLevels.map((l) => l.levelNo);
    const updated = await advanceApproval(tx, log, applicableLevelNos);
    return { statusCode: 0, data: updated };
  });
}

// ── 7. Reject action ────────────────────────────────────────────────────────
export async function rejectRecord(
  referenceId,
  referencePage,
  userId,
  remarks,
) {
  return await prisma.$transaction(async (tx) => {
    const log = await tx.approvalLog.findFirst({
      where: { referenceId: +referenceId, referencePage },
      include: {
        ApprovalConfig: {
          include: { ApprovalLevels: { include: { LevelUsers: true } } },
        },
        LevelLogs: true,
      },
    });
    if (!log) return { statusCode: 1, message: "Approval log not found" };
    if (log.status !== "PENDING")
      return {
        statusCode: 1,
        message: `Cannot reject — status is ${log.status}`,
      };

    const currentLevel = log.ApprovalConfig.ApprovalLevels.find(
      (l) => l.levelNo === log.currentLevel,
    );
    const isAuthorised = currentLevel?.LevelUsers.some(
      (lu) => lu.userId === +userId,
    );
    if (!isAuthorised)
      return { statusCode: 1, message: "Not authorised to reject this level" };

    await tx.approvalLevelLog.create({
      data: {
        approvalLogId: log.id,
        approvalLevelId: currentLevel.id,
        levelNo: currentLevel.levelNo,
        userId: +userId,
        action: "REJECTED",
        remarks: remarks || null,
      },
    });

    const updated = await tx.approvalLog.update({
      where: { id: log.id },
      data: { status: "REJECTED" },
    });
    return { statusCode: 0, data: updated };
  });
}

async function create(body) {
  const { branchId, userId, ...rest } = body;
  const PO_PAGE_ID = 80;

  let data;
  await prisma.$transaction(async (tx) => {
    data = await tx.po.create({
      data: { branchId: +branchId, createdById: +userId, ...rest },
    });

    // Build the record snapshot for condition evaluation
    const recordData = {
      // totalNetAmount: data.totalNetAmount ?? 0,
      // ← compute this from poItems if needed
      supplierId: data.supplierId,
      poType: data.poType,
      branchId: data.branchId,
    };

    await createApprovalLog(
      tx,
      branchId,
      PO_PAGE_ID,
      data.id,
      "PURCHASE ORDER",
      recordData,
    );
  });

  return { statusCode: 0, data };
}

export async function saveApprovalConfig(branchId, pageId, body) {
  const { active, approvalLevelItems } = body; // items from the frontend table

  return await prisma.$transaction(async (tx) => {
    const config = await tx.approvalConfig.upsert({
      where: { branchId_pageId: { branchId: +branchId, pageId: +pageId } },
      create: { branchId: +branchId, pageId: +pageId, active: active ?? false },
      update: { active: active ?? false },
    });

    // Delete old levels and recreate (simplest for a table-based UI)
    await tx.approvalLevel.deleteMany({
      where: { approvalConfigId: config.id },
    });

    for (const item of approvalLevelItems ?? []) {
      const level = await tx.approvalLevel.create({
        data: {
          approvalConfigId: config.id,
          levelNo: item.levelNo,
          approverLogic: item.approveType ?? "OR",
          condition: item.condition ?? "",
        },
      });

      // item.users = [{ value: userId, label: "..." }, ...]
      for (const user of item.users ?? []) {
        await tx.approvalLevelUser.create({
          data: { approvalLevelId: level.id, userId: +user.value },
        });
      }
    }

    return { statusCode: 0, data: config };
  });
}

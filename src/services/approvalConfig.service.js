import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from "../configs/Responses.js";

async function get(req) {
  const { branchId } = req.query;

  const data = await prisma.approvalConfig.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
    },
    include: {
      Module: true,
      ApproverRole: true,
      ApproverUser: true,
      approvalLevels: {
        include: {
          LevelUsers: {
            include: { User: true },
          },
        },
      },
      _count: {
        select: {
          approvalLogs: true,
        },
      },
    },
  });

  return {
    statusCode: 0,
    data: data.map((item) => ({
      ...item,
      childRecord: item._count.approvalLogs,
    })),
  };
}

async function getPendingApproval(req) {
  const { userId } = req.query;
  const uid = parseInt(userId);

  // ── 1. Logs where this user is an approver at the CURRENT level ──────────
  // Prisma can't do field-to-field comparison (currentLevel = levelNo) in where,
  // so we fetch PENDING logs where user is in ANY level, then filter in JS.
  const pendingLogs = await prisma.approvalLog.findMany({
    where: {
      status: "PENDING",
      ApprovalConfig: {
        approvalLevels: {
          some: {
            LevelUsers: { some: { userId: uid } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      ApprovalConfig: {
        include: {
          approvalLevels: {
            orderBy: { levelNo: "asc" },
            include: {
              LevelUsers: true,
            },
          },
        },
      },
      RaisedBy: { select: { id: true, username: true } },
      LevelLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Filter to only logs where user is in the CURRENT active level
  const approverLogs = pendingLogs.filter((log) => {
    const currentLevel = log.ApprovalConfig?.approvalLevels.find(
      (l) => l.levelNo === log.currentLevel,
    );
    return currentLevel?.LevelUsers.some((lu) => lu.userId === uid);
  });

  // ── 2. Logs raised BY this user that have unread status updates ──────────
  const raisedByLogs = await prisma.approvalLog.findMany({
    where: {
      raisedById: uid,
      isRead: false,
      // Only show terminal or active states — skip PENDING raised-by
      // since those will already appear in approverLogs if user is also approver
      status: { in: ["APPROVED", "REJECTED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // cap — don't return entire history
    include: {
      ApprovalConfig: {
        include: {
          approvalLevels: {
            orderBy: { levelNo: "asc" },
            include: { LevelUsers: true },
          },
        },
      },
      RaisedBy: { select: { id: true, username: true } },
      LevelLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // ── 3. Merge, deduplicate by log id ──────────────────────────────────────
  const seen = new Set(approverLogs.map((l) => l.id));
  const merged = [
    ...approverLogs,
    ...raisedByLogs.filter((r) => !seen.has(r.id)),
  ];

  // ── 4. Sort merged: PENDING first, then by createdAt desc ────────────────
  merged.sort((a, b) => {
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return { statusCode: 0, data: merged };
}

async function getOne(id) {
  const data = await prisma.approvalConfig.findUnique({
    where: { id: parseInt(id) },
    include: {
      ConfigConditions: {
        include: {
          Field: true,
          Operator: true,
          CompareField: true,
        },
      },
      approvalLevels: {
        orderBy: { levelNo: "asc" },
        include: {
          LevelUsers: {
            include: { User: true },
          },
        },
      },
      ApproverRole: true,
      ApproverUser: true,
      Module: true,
    },
  });

  if (!data) return NoRecordFound("ApprovalConfig");

  return {
    statusCode: 0,
    data: {
      ...data,
      approvalLevelItems: data.approvalLevels.map((lvl) => ({
        levelNo: lvl.levelNo,
        approveType: lvl.approveType,
        users: lvl.LevelUsers.map((u) => ({
          label: u.User?.username,
          value: u.userId,
        })),
      })),
    },
  };
}

async function getSearch(req) {
  const { searchKey } = req.params;
  const { companyId, active } = req.query;
  const data = await prisma.taxTemplate.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      active: active ? Boolean(active) : undefined,
      OR: [
        {
          name: {
            contains: searchKey,
          },
        },
      ],
    },
  });
  return { statusCode: 0, data: data };
}

async function create(body) {
  const {
    branchId,
    moduleId,
    active,
    approvalLevelItems,
    name,
    priority,
    ruleLogicalOperator,
    ConfigConditions,
  } = await body;

  const data = await prisma.approvalConfig.create({
    data: {
      name,
      branchId: parseInt(branchId),
      moduleId: parseInt(moduleId),
      priority: parseInt(priority || 0),
      active,
      ruleLogicalOperator: ruleLogicalOperator || "AND",

      ConfigConditions: {
        create:
          ConfigConditions?.filter((cond) => cond.fieldId && cond.operatorId) // Skip empty/invalid rules
            ?.map((cond) => ({
              fieldId: parseInt(cond.fieldId),
              operatorId: parseInt(cond.operatorId),
              valueType: cond.valueType || "STATIC",
              value: cond.valueType === "STATIC" ? cond.value : null,
              compareFieldId:
                cond.valueType === "DYNAMIC"
                  ? parseInt(cond.compareFieldId)
                  : null,
            })) || [],
      },

      approvalLevels: {
        create: approvalLevelItems.map((lvl, index) => ({
          levelNo: index + 1,
          approveType: lvl.approveType,

          LevelUsers: {
            create: lvl.users.map((u) => ({
              userId: parseInt(u.value),
            })),
          },
        })),
      },
    },
  });

  return { statusCode: 0, data };
}

async function update(id, body) {
  const {
    branchId,
    moduleId,
    active,
    approvalLevelItems,
    name,
    priority,
    ruleLogicalOperator,
    ConfigConditions,
  } = await body;

  const existing = await prisma.approvalConfig.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existing) return NoRecordFound("ApprovalConfig");

  const data = await prisma.approvalConfig.update({
    where: { id: parseInt(id) },
    data: {
      name,
      branchId: parseInt(branchId),
      moduleId: parseInt(moduleId),
      priority: parseInt(priority || 0),
      active,
      ruleLogicalOperator: ruleLogicalOperator || "AND",

      ConfigConditions: {
        deleteMany: {}, // Clear old rules
        create:
          ConfigConditions?.filter((cond) => cond.fieldId && cond.operatorId) // Skip empty/invalid rules
            ?.map((cond) => ({
              fieldId: parseInt(cond.fieldId),
              operatorId: parseInt(cond.operatorId),
              valueType: cond.valueType || "STATIC",
              value: cond.valueType === "STATIC" ? cond.value : null,
              compareFieldId:
                cond.valueType === "DYNAMIC"
                  ? parseInt(cond.compareFieldId)
                  : null,
            })) || [],
      },

      approvalLevels: {
        deleteMany: {}, // 🔥 clear old
        create: approvalLevelItems.map((lvl, index) => ({
          levelNo: index + 1,
          approveType: lvl.approveType,

          LevelUsers: {
            create: lvl.users.map((u) => ({
              userId: parseInt(u.value),
            })),
          },
        })),
      },
    },
  });

  return { statusCode: 0, data };
}

async function remove(id) {
  const data = await prisma.approvalConfig.delete({
    where: { id: parseInt(id) },
  });

  return { statusCode: 0, data };
}

async function markApprovalRead(id) {
  const data = await prisma.approvalLog.update({
    where: { id: parseInt(id) },
    data: { isRead: true },
  });
  return { statusCode: 0, data };
}

// Frontend — update Notification.jsx to show type label and mark as read on view:
// jsxfunction openRecord(log) {
//   const tabName = PAGE_ROUTE_MAP[log.referencePage] ?? log.referencePage;
//   dispatch(push({ name: tabName, previewId: log.referenceId }));
//   // Mark as read so it disappears from raised-by list
//   if (log.isRead === false) {
//     markRead(log.id); // add useMarkApprovalReadMutation below
//   }
//   setOpen(false);
// }

export {
  get,
  getOne,
  getSearch,
  create,
  update,
  remove,
  getPendingApproval,
  markApprovalRead,
};

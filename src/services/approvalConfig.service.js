import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from "../configs/Responses.js";

async function get(req) {
  const { branchId } = req.query;

  const data = await prisma.approvalConfig.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
    },
    include: {
      Page: true,
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

  // Find all PENDING logs where the current level includes this user
  const logs = await prisma.approvalLog.findMany({
    where: {
      status: "PENDING",
      ApprovalConfig: {
        approvalLevels: {
          some: {
            // levelNo: { equals: prisma.approvalLog.fields.currentLevel }, // ← see note below
            LevelUsers: { some: { userId: parseInt(userId) } },
          },
        },
      },
    },
    include: {
      ApprovalConfig: {
        include: {
          approvalLevels: {
            include: { LevelUsers: true },
            orderBy: { levelNo: "asc" },
          },
        },
      },
      RaisedBy: {
        select: {
          username: true,
        },
      },
      LevelLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Prisma can't do a field-to-field comparison in where, so filter in JS:
  const filteredLogs = logs.filter((log) => {
    const level = log.ApprovalConfig?.approvalLevels.find(
      (l) => l.levelNo === log.currentLevel,
    );

    return level?.LevelUsers.some((lu) => lu.userId === parseInt(userId));
  });
  // Logs raised by this user — so they can track status
  const raisedByLogs = await prisma.approvalLog.findMany({
    where: {
      raisedById: parseInt(userId),
      status: { in: ["PENDING", "APPROVED", "REJECTED"] },
      isRead: false, // only unread updates
    },
    include: {
      ApprovalConfig: {
        include: {
          approvalLevels: {
            include: { LevelUsers: true },
            orderBy: { levelNo: "asc" },
          },
        },
      },
      RaisedBy: { select: { username: true } },
      LevelLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Merge, deduplicate by id
  const allLogs = [
    ...filteredLogs,
    ...raisedByLogs.filter((r) => !filteredLogs.some((a) => a.id === r.id)),
  ];

  return {
    statusCode: 0,
    data: allLogs,
  };
}

async function getOne(id) {
  const data = await prisma.approvalConfig.findUnique({
    where: { id: parseInt(id) },
    include: {
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
    },
  });

  if (!data) return NoRecordFound("ApprovalConfig");

  return {
    statusCode: 0,
    data: {
      ...data,
      approvalLevelItems: data.approvalLevels.map((lvl) => ({
        levelNo: lvl.levelNo,
        approveType: lvl.approverLogic,
        condition: lvl.condition,
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
  const { branchId, pageId, active, approvalLevelItems } = await body;

  const data = await prisma.approvalConfig.create({
    data: {
      branchId: parseInt(branchId),
      pageId: parseInt(pageId),
      active,

      approvalLevels: {
        create: approvalLevelItems.map((lvl, index) => ({
          levelNo: index + 1,
          approveType: lvl.approveType,
          condition: lvl.condition,

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
  const { branchId, pageId, active, approvalLevelItems } = await body;

  const existing = await prisma.approvalConfig.findUnique({
    where: { id: parseInt(id) },
  });

  if (!existing) return NoRecordFound("ApprovalConfig");

  const data = await prisma.approvalConfig.update({
    where: { id: parseInt(id) },
    data: {
      branchId: parseInt(branchId),
      pageId: parseInt(pageId),
      active,

      approvalLevels: {
        deleteMany: {}, // 🔥 clear old
        create: approvalLevelItems.map((lvl, index) => ({
          levelNo: index + 1,
          approveType: lvl.approveType,
          condition: lvl.condition,

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

// markApprovalRead: builder.mutation({
//   query: (id) => ({
//     url: `${APPROVAL_API}/markRead/${id}`,
//     method: "PUT",
//   }),
//   invalidatesTags: ["Approval"],
// }),

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

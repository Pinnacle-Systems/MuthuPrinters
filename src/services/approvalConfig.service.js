import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from "../configs/Responses.js";
import { exclude } from "../utils/helper.js";

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

export { get, getOne, getSearch, create, update, remove };

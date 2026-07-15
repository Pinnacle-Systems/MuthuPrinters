import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";

async function get(req) {
  const { companyId, active } = req.query;
  const data = await prisma.itemSubGroup.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      active: active ? Boolean(active) : undefined,
    },
    include: {
      ItemGroup: true,

      _count: {
        select: {
          StyleItem: true,
          OrderItems: true,
        },
      },
    },
  });
  return {
    statusCode: 0,
    data: data.map((item) => {
      return {
        ...item,
        childRecord: item._count.StyleItem,
      };
    }),
  };
}

async function getOne(id) {
  const childRecord = await prisma.styleItem.count({
    where: {
      itemSubGroupId: parseInt(id),
    },
  });
  const data = await prisma.itemSubGroup.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!data) return NoRecordFound("itemSubGroup");
  return { statusCode: 0, data: { ...data, ...{ childRecord } } };
}

async function getSearch(req) {
  const { searchKey } = req.params;
  const { companyId, active } = req.query;
  const data = await prisma.itemSubGroup.findMany({
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
    include: {
      _count: {
        select: {
          styleItems: true,
        },
      },
    },
  });
  return {
    statusCode: 0,
    data: data.map((item) => {
      return {
        ...item,
        childRecord: item._count.styleItems,
      };
    }),
  };
}

async function create(body) {
  const { itemGroupId, name, userId, companyId, active } = await body;
  const data = await prisma.itemSubGroup.create({
    data: {
      itemGroupId: itemGroupId ? parseInt(itemGroupId) : undefined,
      name,
      createdById: userId ? parseInt(userId) : undefined,
      companyId: companyId ? parseInt(companyId) : undefined,

      active,
    },
  });
  return { statusCode: 0, data };
}

async function update(id, body) {
  const { itemGroupId, name, userId, active } = await body;
  const dataFound = await prisma.itemSubGroup.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!dataFound) return NoRecordFound("itemSubGroup");
  const data = await prisma.itemSubGroup.update({
    where: {
      id: parseInt(id),
    },
    data: {
      itemGroupId: itemGroupId ? parseInt(itemGroupId) : undefined,
      name,
      active,
      updatedById: userId ? parseInt(userId) : undefined,
    },
  });
  return { statusCode: 0, data };
}

async function remove(id) {
  const data = await prisma.itemSubGroup.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

export { get, getOne, getSearch, create, update, remove };

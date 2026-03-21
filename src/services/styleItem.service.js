import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";

async function get(req) {
  const { companyId, active } = req.query;

  let data = await prisma.styleItem.findMany({
    where: {
      active: active ? Boolean(active) : undefined,
    },
    include: {
      _count: {
        select: {
          poItems: true,
        },
      },
      SizeTemplate: {
        select: {
          SizeTemplateList: {
            select: {
              sizeId: true,
            },
          },
        },
      },
    },
  });
  return {
    statusCode: 0,
    data: (data = data.map((color) => ({
      ...color,
      childRecord: color?._count.poItems > 0,
    }))),
  };
}

async function getOne(id) {
  const childRecord = await prisma.poItems.count({
    where: { styleItemId: parseInt(id) },
  });
  const data = await prisma.styleItem.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      Hsn: true,
    },
  });
  if (!data) return NoRecordFound("styleItem");
  return { statusCode: 0, data: { ...data, ...{ childRecord } } };
}

async function getSearch(req) {
  const { searchKey } = req.params;
  const { companyId, active } = req.query;
  const data = await prisma.styleItem.findMany({
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
    name,
    aliasName,
    active,
    code,
    hsnId,
    uomId,
    sizeTemplateId,
    itemGroupId,
  } = await body;
  const data = await prisma.styleItem.create({
    data: {
      name,
      aliasName,
      active,
      code,
      hsnId: hsnId ? parseInt(hsnId) : undefined,
      uomId: uomId ? parseInt(uomId) : undefined,
      itemGroupId: itemGroupId ? parseInt(itemGroupId) : undefined,
      sizeTemplateId: sizeTemplateId ? parseInt(sizeTemplateId) : undefined,
    },
  });
  return { statusCode: 0, data };
}

async function update(id, body) {
  const {
    name,
    active,
    aliasName,
    code,
    hsnId,
    uomId,
    sizeTemplateId,
    itemGroupId,
  } = await body;

  const dataFound = await prisma.styleItem.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!dataFound) return NoRecordFound("styleItem");
  const data = await prisma.styleItem.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name,
      aliasName,
      active,
      code,
      hsnId: hsnId ? parseInt(hsnId) : undefined,
      uomId: parseInt(uomId) ?? 0,
      itemGroupId: parseInt(itemGroupId) ?? 0,
      sizeTemplateId: parseInt(sizeTemplateId) ?? 0,
    },
  });
  return { statusCode: 0, data };
}

async function remove(id) {
  const data = await prisma.styleItem.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

export { get, getOne, getSearch, create, update, remove };

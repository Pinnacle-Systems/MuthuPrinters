import { NoRecordFound } from "../configs/Responses.js";

import { prisma } from "../lib/prisma.js";

async function get(req) {
  const { companyId, active } = req.query;
  const data = await prisma.PackingControlPanel.findMany({
    where: {
      active: active ? Boolean(active) : undefined,
    },

  });
  return {
    statusCode: 0,
    data: data
  };
}

async function getOne(id) {
  const childRecord = 0;
  const data = await prisma.PackingControlPanel.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!data) return NoRecordFound("PackingControlPanel");
  return { statusCode: 0, data: { ...data, ...{ childRecord } } };
}

async function getSearch(req) {
  const { searchKey } = req.params;
  const { companyId, active } = req.query;
  const data = await prisma.PackingControlPanel.findMany({
    where: {
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
  const { name, packingPercentage, active } = await body;
  const data = await prisma.PackingControlPanel.create({
    data: {
      packingPercentage,
      // active
    },
  });
  return { statusCode: 0, data };
}

async function update(id, body) {
  const { packingPercentage, active } = await body;
  const dataFound = await prisma.PackingControlPanel.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!dataFound) return NoRecordFound("PackingControlPanel");
  const data = await prisma.PackingControlPanel.update({
    where: {
      id: parseInt(id),
    },
    data: {
      packingPercentage,
      // active
    },
  });
  return { statusCode: 0, data };
}

async function remove(id) {
  const data = await prisma.PackingControlPanel.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

export { get, getOne, getSearch, create, update, remove };

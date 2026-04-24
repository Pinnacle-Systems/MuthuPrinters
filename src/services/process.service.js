import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";

async function get(req) {
  const { companyId, active } = req.query;
  const data = await prisma.process.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      // active: active ? Boolean(active) : undefined,
    },
    include: {
      _count: {
        select: {
          processGroupList: true,
          laminationDetails: true,
          varnishDetails: true,
          machineDetails: true,
          processDetails: true,
        },
      },
    },
  });
  return {
    statusCode: 0,
    data: data.map((process) => ({
      ...process,
      childRecord:
        process._count.processGroupList +
        process._count.laminationDetails +
        process._count.varnishDetails +
        process._count.machineDetails +
        process._count.processDetails,
    })),
  };
}

async function getOne(id) {
  const data = await prisma.process.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!data) return NoRecordFound("process");
  const childRecord = 0;
  //   await prisma.processGroupList.count({
  //     where: {
  //       processId: parseInt(id),
  //     },
  //   });
  return { statusCode: 0, data: { ...data, ...{ childRecord } } };
}

async function create(body) {
  const { name, companyId, active = true } = await body;

  const data = await prisma.process.create({
    data: {
      name,
      active,
      companyId: parseInt(companyId),
    },
  });

  return { statusCode: 0, data };
}

async function update(id, body) {
  const { name, active, companyId } = await body;
  const dataFound = await prisma.process.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!dataFound) return NoRecordFound("process");
  const data = await prisma.process.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name,
      active,
      companyId: parseInt(companyId),
    },
  });
  return { statusCode: 0, data };
}

async function remove(id) {
  const data = await prisma.process.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

export { get, getOne, create, update, remove };

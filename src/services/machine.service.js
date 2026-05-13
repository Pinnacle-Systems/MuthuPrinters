import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";

async function get(req) {
  const { companyId, active } = req.query;
  const data = await prisma.machine.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      // active: active ? Boolean(active) : undefined,
    },
    // include: {
    //   _count: {
    //     select: {
    //       machineDetails: true,
    //     },
    //   },
    // },
  });
  return {
    statusCode: 0,
    data: data.map((machine) => ({
      ...machine,
      // childRecord: machine._count.machineDetails,
    })),
  };
}

async function getOne(id) {
  const data = await prisma.machine.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!data) return NoRecordFound("machine");
  const childRecord = 0;

  return { statusCode: 0, data: { ...data, ...{ childRecord } } };
}

async function create(body) {
  const { name, companyId, active = true } = await body;

  const data = await prisma.machine.create({
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
  const dataFound = await prisma.machine.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  if (!dataFound) return NoRecordFound("machine");
  const data = await prisma.machine.update({
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
  const data = await prisma.machine.delete({
    where: {
      id: parseInt(id),
    },
  });
  return { statusCode: 0, data };
}

export { get, getOne, create, update, remove };

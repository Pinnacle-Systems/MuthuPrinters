import { prisma } from "../lib/prisma.js";

async function get(req) {
  const { departmentId } = req.query;
  const departmentIdNum = Number(departmentId);

  if (!departmentId || isNaN(departmentIdNum)) {
    return {
      statusCode: 1,
      message: "Invalid or missing departmentId",
      data: [],
    };
  }
  const date = new Date();
  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const busyMachines = await prisma?.takenmachines?.findMany({
    where: {
      stDate: dateOnly,
      isAvailable: false,
    },
    select: {
      id: true,
    },
  });
  var busyMachinesArray = busyMachines?.map((mdata) => mdata?.id) || [];
  const availableMachine = await prisma?.machine?.findMany({
    where: {
      AND: [
        { id: { notIn: busyMachinesArray } },
        { departmentId: departmentIdNum },
      ],
    },
    select:{
      id:true,
      name:true
    }
  });

  return {
    statusCode: 0,
    data: { machines: availableMachine },
  };
}

export { get };

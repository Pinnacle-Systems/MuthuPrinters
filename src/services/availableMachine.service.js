import { prisma } from "../lib/prisma.js";
import { endDate, startDate } from "../utils/helper.js";
import {  PrismaClient } from "@prisma/client";

async function get(req) {
  const { departmentId, machineId } = req.query;
  const departmentIdNum = Number(departmentId);
  const machineNum = Number(machineId);

  if (machineId && isNaN(machineNum)) {
    return {
      statusCode: 1,
      message: "Invalid or missing MachineId",
      data: [],
    };
  }

  if (!departmentId || isNaN(departmentIdNum)) {
    return {
      statusCode: 1,
      message: "Invalid or missing departmentId",
      data: [],
    };
  }

  if (!startDate || !endDate) {
    return {
      statusCode: 1,
      message: "Invalid or missing startDate/endDate",
      data: [],
    };
  }

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  if (isNaN(startDateObj) || isNaN(endDateObj)) {
    return {
      statusCode: 1,
      message: "startDate/endDate must be valid dates",
      data: [],
    };
  }

  const M_WHERE = {
    stDatetime: {
      gte: startDateObj,
      lt: endDateObj,
    },
    isAvailable: false,
  };

  if (machineId) {
    M_WHERE.Machineid = {
      not: machineNum,
    };
  }

  const busyMachines = await prisma?.takenmachines?.findMany({
    where: M_WHERE,
    select: {
      Machineid: true,
      User: true,
      JobCard: true,
      ProcessRoute: true,
    },
  });

  const availableMachine = await prisma?.machine?.findMany({
    where: { departmentId: departmentIdNum },
    select: {
      id: true,
      name: true,
    },
  }) || [];

  const finalizeMachine = availableMachine.map((element) => {
    const busyMachine_filter = busyMachines?.find(
      (bmf) => bmf.Machineid === element?.id,
    );
    if (busyMachine_filter) {
      return { ...element, busy: true, busy_by: busyMachine_filter?.User,JobCard:busyMachine_filter?.JobCard };
    }
    return { ...element, busy: false };
  });
 
  return {
    statusCode: 0,
    data: { machines: finalizeMachine },
  };
}

export { get };

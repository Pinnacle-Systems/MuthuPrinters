import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";

async function get(req) {
  const { companyId, active } = req.query;
  const data = await prisma.machine.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      // active: active ? Boolean(active) : undefined,
    },
    include: {
      _count: {
        select: {
          machineDetails: true,
          productionempPunch: true,
          takenMachines: true,
          PlateDetails: true,
        },
      },
      Size: true,
    },
    orderBy: {
      id: "asc",
    },
  });
  return {
    statusCode: 0,
    data: data.map((machine) => ({
      ...machine,
      childRecord:
        machine._count.machineDetails +
        machine._count.productionempPunch +
        machine._count.takenMachines +
        machine._count.PlateDetails,
    })),
  };
}

async function getOne(id) {
  const data = await prisma.machine.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      _count: {
        select: {
          machineDetails: true,
          productionempPunch: true,
          takenMachines: true,
          PlateDetails: true,
        },
      },
    },
  });
  if (!data) return NoRecordFound("machine");
  const childRecord =
    data._count.machineDetails +
    data._count.productionempPunch +
    data._count.takenMachines +
    data._count.PlateDetails;

  return { statusCode: 0, data: { ...data, ...{ childRecord } } };
}

async function create(body) {
  const {
    name,
    companyId,
    active = true,
    sizeId,
    departmentId,
    isDefault,
  } = await body;

  const data = await prisma.machine.create({
    data: {
      name,
      active,
      sizeId: sizeId ? parseInt(sizeId) : undefined,
      companyId: parseInt(companyId),
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      isDefault: isDefault ?? false,
    },
  });

  return { statusCode: 0, data };
}

async function update(id, body) {
  const { name, active, companyId, sizeId, departmentId, isDefault } =
    await body;
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
      sizeId: sizeId ? parseInt(sizeId) : undefined,
      companyId: parseInt(companyId),
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      isDefault: isDefault ?? false,
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

async function notificationMachines(req) {
  let userId = req.user?.id;
  if (!userId && req.query?.userId) userId = parseInt(req.query.userId);
  if (!userId && req.headers?.userid) userId = parseInt(req.headers.userid);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data = await prisma.takenmachines.findMany({
    where: {
      isAvailable: false,
    },
    include: {
      Machine: {
        include: {
          MobileNotification: {
            where: {
              userId: userId ? userId : undefined,
              createdAt: {
                gte: today,
              },
            },
          },
        },
      },
      User: {
        include: {
          Employee: true,
        },
      },
      ProcessRoute: {
        include: {
          Process: true,
        },
      },
      JobCard: true,
      deparment: true,
    },
  });
  const currentTime = new Date();

  const formattedData = data
    .filter((record) => {
      if (!userId) return true; // If we cannot identify the user, don't filter
      const machineNotifications = record.Machine?.MobileNotification || [];
      const viewedToday = machineNotifications.some(
        (notif) => notif.isViewed === true,
      );
      // Exclude this record if the user has already viewed the notification today
      return !viewedToday;
    })
    .map((record) => {
      const startTime = new Date(record.stDatetime);
      const diffMs = Math.max(0, currentTime - startTime);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const diffDays = Math.floor(hours / 24);
      const remainingHours = hours % 24;

      let runningDuration = "";
      if (diffDays > 0) {
        runningDuration = `${diffDays}d ${remainingHours}h ${mins}m`;
      } else {
        runningDuration = `${hours}h ${mins}m`;
      }

      return {
        id: record.id,
        machineId: record.Machineid,
        machineName: record.Machine?.name || "Unknown",
        departmentName: record.deparment?.name || "Unknown",
        user: record.User?.Employee?.name || record.User?.username || "Unknown",
        process: record.ProcessRoute?.Process?.name || "Unknown",
        jobCard: record.JobCard?.docId || "Unknown",
        startTime: startTime.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        startTimeUTC: record.stDatetime,
        runningDuration: runningDuration,
        runningDurationHours: diffMs / (1000 * 60 * 60),
      };
    });

  return { statusCode: 0, data: formattedData };
}

async function machineViewed(req) {
  const { machineId } = req.body;
  let userId = req.body?.userId;
  if (!userId && req.body?.userId) userId = parseInt(req.body.userId);
  if (!userId && req.query?.userId) userId = parseInt(req.query.userId);
  if (!userId && req.headers?.userid) userId = parseInt(req.headers.userid);

  if (!userId) {
    return { statusCode: 1, message: "User ID is required to mark as viewed" };
  }
  if (!machineId) {
    return { statusCode: 1, message: "Machine ID is required" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);


  const existingNotification = await prisma.mobileNotification.findFirst({
    where: {
      userId: userId,
      machineId: parseInt(machineId),
      createdAt: {
        gte: today,
      },
    },
  });

  let data;
  if (existingNotification) {
    data = await prisma.mobileNotification.update({
      where: { id: existingNotification.id },
      data: { isViewed: true },
    });
  } else {
    data = await prisma.mobileNotification.create({
      data: {
        userId: userId,
        machineId: parseInt(machineId),
        isViewed: true,
        createdAt: new Date(),
      },
    });
  }

  return { statusCode: 0, message: "Notification marked as viewed", data };
}

export {
  get,
  getOne,
  create,
  update,
  remove,
  notificationMachines,
  machineViewed,
};

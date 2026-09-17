import { prisma } from "../lib/prisma.js";
import moment from "moment";

async function get(req) {
  try {
    const { date, month, branchId } = req.query || {};
    let startOfDay, endOfDay;

    if (month) {
      const targetMonth = moment(month, "YYYY-MM");
      startOfDay = targetMonth.startOf("month").toDate();
      endOfDay = targetMonth.endOf("month").toDate();
    } else {
      const targetDate = date ? new Date(date) : new Date();
      startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    }

    // Query production punches for the given date
    const productionLogs = await prisma.productionempPunch.findMany({
      where: {
        createAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        ...(branchId && { JobCard: { branchId: parseInt(branchId) } }),
      },
      include: {
        JobCard: {
          include: {
            OrderEntry: true,
          },
        },
        ProcessRoute: {
          include: {
            Process: true,
          },
        },
        User: true,
        deparment: true,
        Machine: true,
        pushLogs: true,
      },
      orderBy: {
        createAt: "asc",
      },
    });

    // Map data for the frontend
    const reportData = productionLogs.map((log) => {
      // Calculate total hours worked (hh:mm:ss)
      let hoursWorked = "00:00:00";
      if (log.startTime && log.endTime) {
        const duration = moment.duration(
          moment(log.endTime).diff(moment(log.startTime)),
        );
        const hours = Math.floor(duration.asHours())
          .toString()
          .padStart(2, "0");
        const minutes = duration.minutes().toString().padStart(2, "0");
        const seconds = duration.seconds().toString().padStart(2, "0");
        hoursWorked = `${hours}:${minutes}:${seconds}`;
      }

      return {
        id: log.id,
        jobCardNo: log.JobCard?.docId || "N/A",
        orderNo: log.JobCard?.OrderEntry?.docId || "N/A",
        processName:
          log.ProcessRoute?.Process?.name || log.ProcessRoute?.type || "N/A",
        processStatus: log.ProcessRoute?.status || "N/A",
        productionQty: log.JobCard?.runningQty || log.JobCard?.rollQty || 0,
        completedQty: log.ProcessRoute?.completedQty || 0,
        actualQty: log.ProcessRoute?.actualQty || 0,
        pendingQty: log.ProcessRoute?.pendingQty || 0,
        wastageQty: log.ProcessRoute?.wastageQty || 0,
        sendQty: log.ProcessRoute?.sendQty || 0,
        username: log.User?.username || "N/A",
        startTime: log.startTime,
        endTime: log.endTime,
        date: log.startDate || log.createAt,
        department: log.deparment?.name || "N/A",
        machine: log.Machine?.name || "N/A",
        hoursWorked: hoursWorked,
        pushLogs: log.pushLogs.map((pushLog) => ({
          id: pushLog.id,
          pauseReason: pushLog.pauseReason,
          pauseTime: pushLog.pushtime,
          resumeTime: pushLog.resumetime,
          pauseQty: pushLog.pauseQty,
        })),
      };
    });

    return {
      success: true,
      data: reportData,
    };
  } catch (error) {
    console.error("Error in getDailyProductionReport:", error);
    throw error;
  }
}

export { get };

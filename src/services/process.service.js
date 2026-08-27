import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import { current_dateOnly, endDate, startDate } from "../utils/helper.js";
import crypto from "crypto";

async function get(req) {
  const { companyId, active } = req.query;
  const data = await prisma.process.findMany({
    where: {
      companyId: companyId ? parseInt(companyId) : undefined,
      // active: active ? Boolean(active) : undefined,
    },
    include: {
      Department: true,
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
  const processCount = await prisma.processGroupList.count({
    where: {
      processId: parseInt(id),
    },
  });
  return { statusCode: 0, data: { ...data, ...{ childRecord: processCount } } };
}

async function create(body) {
  const {
    name,
    companyId,
    active = true,
    isOutsideJob,
    departmentId,
  } = await body;

  const data = await prisma.process.create({
    data: {
      name,
      active,
      companyId: parseInt(companyId),
      isOutsideJob: Boolean(isOutsideJob),
      departmentId: parseInt(departmentId),
    },
  });

  return { statusCode: 0, data };
}

async function UpdateCurrentProcess(req) {
  const { status, processId } = req?.body;

  const data = await prisma.processRoute.update({
    where: { id: Number(processId ?? 0) },
    data: {
      status,
    },
  });

  return { statusCode: 1, data };
}

async function UpdateProcess(req) {
  const {
    status,
    jobcardId,
    processId,
    flag,
    type,
    departmentId,
    machineId,
    userId,
    id,
    completedQty,
    wastageQty,
    processIncomingId,
    processIncomingQty,
    remarks,
    splitSizes,
  } = req?.body;

  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const istISOString = istTime.toISOString();

  const currentDate = istTime.toISOString(); // "YYYY-MM-DD"
  const currentTime = istTime.toISOString(); //.split("T")[1].split(".")[0]; // "HH:MM:SS"

  let data;

  if (!departmentId) {
    return {
      statusCode: 1,
      message: "Invalid or missing departmentId",
      data: [],
    };
  }
  if (!machineId) {
    return {
      statusCode: 1,
      message: "Invalid or missing machine",
      data: [],
    };
  }

  const isTakenmachinechk = await prisma?.takenmachines?.findFirst({
    where: {
      Machineid: machineId,
    },
    select: {
      id: true,
    },
  });

  if (isTakenmachinechk?.id && isTakenmachinechk?.isAvailable === false) {
    return { statusCode: 0, message: "This Machine Busy On Another Process!" };
  }

  await prisma.$transaction(async (tx) => {
    const process_start = await tx.processRoute.update({
      where: {
        id: Number(processId || 0),
      },
      data: {
        status: status,
      },
    });

    let addMain_punch_log;

    if (flag === "START") {
      addMain_punch_log = await tx.productionempPunch.create({
        data: {
          JobCard: { connect: { id: Number(jobcardId) } },
          ProcessRoute: { connect: { id: Number(processId || 0) } },
          startDate: istISOString,
          startTime: istISOString,
          User: { connect: { id: Number(userId) } },
          deparment: { connect: { id: Number(departmentId) } },
          Machine: { connect: { id: Number(machineId) } },
        },
      });

      if (!isTakenmachinechk?.id) {
        await tx?.takenmachines?.create({
          data: {
            JobCard: { connect: { id: Number(jobcardId) } },
            ProcessRoute: { connect: { id: Number(processId || 0) } },
            User: { connect: { id: Number(userId) } },
            deparment: { connect: { id: Number(departmentId) } },
            Machine: { connect: { id: Number(machineId) } },
            isAvailable: false,
          },
        });
      } else {
        await tx?.takenmachines?.updateMany({
          data: {
            jobCardId: Number(jobcardId),
            processRouteId: Number(processId || 0),
            Userid: Number(userId),
            departmentid: Number(departmentId),
            Machineid: Number(machineId),
            isAvailable: false,
          },
          where: {
            isAvailable: true,
            Machineid: machineId,
          },
        });
      }
    } else if (flag === "STOP") {
      if (!completedQty) throw new Error("Completed Qty Must Be Entered");
      if (Number(completedQty ?? 0) <= 0) 
        throw new Error("Completed Qty must be greater than 0");

      const pRoute = await tx.processRoute.findUnique({
        where: { id: Number(processId || 0) },
        include: { JobCard: true },
      });

     

      let actualQty = pRoute.actualQty || pRoute.sendQty;
      if (!actualQty) {
        if (pRoute.JobCard?.itemType === "LABEL") {
          actualQty = pRoute.JobCard.rollQty || 0;
        } else if (pRoute.JobCard) {
          actualQty = pRoute.JobCard.runningQty || 0;
        } else {
          actualQty = 0;
        }
      }
      let effectiveQty = actualQty;
      if (pRoute.sequence > 1) {
        const previousRoutes = await tx.processRoute.findMany({
          where: {
            jobCardId: pRoute.jobCardId,
            sequence: { lt: pRoute.sequence },
            reworkSetId: pRoute.reworkSetId || null,
          },
        });
        const previousWastages = previousRoutes.reduce(
          (acc, curr) => acc + Number(curr.wastageQty || 0),
          0
        );
        effectiveQty = Math.max(actualQty - previousWastages, 0);
      }



      const getIncomingExist = processIncomingId ? await tx?.incomingQty?.findUnique({
        where: {
          id: Number(processIncomingId)
        }
      }) : null;


      // Validation for Max Allowed Quantity
      let maxAllowed = actualQty;
      if (pRoute.sequence > 1) {
        if (getIncomingExist?.qty > 0) {
          maxAllowed = Number(getIncomingExist.qty);
        } else if (processIncomingQty > 0) {
          maxAllowed = Number(processIncomingQty);
        }
      }

      const totalCompleted =
        Number(pRoute?.completedQty || 0) + Number(completedQty);

      const totalWastage =
        Number(pRoute?.wastageQty || 0) + Number(wastageQty || 0);

      const totalCompleted_Incoming =
        Number(getIncomingExist?.completedQty || 0) + Number(completedQty);

      const totalWastage_Incoming =
        Number(getIncomingExist?.wastageQty || 0) + Number(wastageQty || 0);

      if ((totalCompleted_Incoming + totalWastage_Incoming) > maxAllowed) {
        throw new Error(`Cannot process ${totalCompleted_Incoming + totalWastage_Incoming} pieces. The previous process only completed ${maxAllowed} pieces.`);
      }


      if ((totalCompleted + totalWastage) > effectiveQty) {
        throw new Error(`Cannot process ${totalCompleted + totalWastage} pieces. The  process only production below to ${effectiveQty}.`);
      }

      const pendingQty = Math.max(
        effectiveQty - (totalCompleted + totalWastage),
        0,
      );

      const baseIncomingQty = getIncomingExist ? Number(getIncomingExist.qty) : Number(processIncomingQty || 0);
      const pendingQty_Incoming = Math.max(
        baseIncomingQty - (totalCompleted_Incoming + totalWastage_Incoming),
        0,
      );

      let routeStatus = "NOT_STARTED";
      if (totalCompleted > 0 || totalWastage > 0) {
        routeStatus = pendingQty === 0 ? "COMPLETED" : "PARTIALLY_COMPLETED";
      } else if (pRoute.sendQty > 0) {
        routeStatus = "IN_PROGRESS";
      }


        const seqRoute = await tx?.processRoute?.findFirst({
        where:{
          jobCardId: jobcardId,
          sequence : Number(pRoute?.sequence)+1 }
          })


      let isCompleted = false;
      if (pendingQty_Incoming === 0) {
        isCompleted = true;
      }

      if (getIncomingExist?.id && pRoute?.sequence > 1) {
        await tx?.incomingQty?.update({
          data: {
            jobCardId: jobcardId,
            isCompleted: isCompleted,
            pendingQty: pendingQty_Incoming,
            wastageQty: totalWastage_Incoming,
            completedQty: totalCompleted_Incoming
          },
              where:{
              id:getIncomingExist?.id
              }
           })
          }

          if (seqRoute?.id) {
            //  const existingNextSeq = await tx?.IncomingQty?.findFirst({
            //    where: {
            //      jobCardId: Number(jobcardId),
            //      processRouteId: Number(processId || 0),
            //      sendRoute: seqRoute?.id
            //    }
            //  });

            //  if (existingNextSeq?.id) {
            //    await tx?.IncomingQty?.update({
            //      where: { id: existingNextSeq.id },
            //      data: {
            //        qty: Number(existingNextSeq.qty || 0) + Number(completedQty),
            //        pendingQty: Number(existingNextSeq.pendingQty || 0) + Number(completedQty)
            //      }
            //    });
            //  } else {
               await tx?.incomingQty?.create({
                 data: {
                   jobCardId: Number(jobcardId),
                   processRouteId: Number(processId || 0),
                   sendRoute: seqRoute?.id,
                   qty: Number(completedQty),
                   pendingQty: Number(completedQty),
                   completedQty: 0,
                   wastageQty: 0
                 }
               });
            //  }
          }


      await tx.processRoute.update({
        where: {
          id: Number(processId || 0),
        },
        data: {
          completedQty: totalCompleted,
          wastageQty: totalWastage,
          actualQty: actualQty,
          pendingQty: pendingQty,
          status: routeStatus,
        },
      });

      if (pendingQty > 0) {
        const reworkSetId = crypto.randomUUID();

        // Log to ReworkLog for partially delivered
        await tx.reworkLog.create({
          data: {
            uniqueId: reworkSetId,
            jobCardId: pRoute.jobCardId,
            processRouteId: pRoute.id,
            actualQty: actualQty,
            completedQty: totalCompleted,
            wastageQty: totalWastage,
            pendingQty: pendingQty,
            reason: "Partially Delivered",
            Userid: Number(userId) || null,
          },
        });

        // Add to active tracking table
        await tx.reworkBatchTracker.create({
          data: {
            uniqueId: reworkSetId,
            jobCardId: pRoute.jobCardId,
            processRouteId: pRoute.id,
            userId: Number(userId),
            isExpired: false
          }
        });
      }

      const stop_push_log = await tx.pushLogs.create({
        data: {
          pushtime: istISOString,
          resumetime: istISOString, // Marks it as closed/not-paused
          productionlog: Number(id),
          Userid: Number(userId),
          pauseReason: "Process Stopped",
          remarks: remarks,
          completedQty: Number(completedQty || 0),
          wastageQty: Number(wastageQty || 0),
        }
      });

      if (splitSizes && splitSizes.length > 0) {
        await Promise.all(
          splitSizes.map(async (element_size) => {
            return await tx.splitSizes.create({
              data: {
                pushLogId: stop_push_log.id,
                jobCardSizeId: element_size.id,
                qty: element_size.qty,
              },
            });
          })
        );
      }

      addMain_punch_log = await tx.productionempPunch.update({
        where: { id: Number(id) }, // ← real punchId from frontend
        data: {
          endDate: istISOString,
          endTime: istISOString,
        },
      });

      await tx?.takenmachines?.updateMany({
        data: {
          edDatetime: new Date(),
          isAvailable: true,
        },
        where: {
          Machineid: machineId,
          isAvailable: false,
        },
      });
      // Check if this is the final process and it is fully completed
      if (routeStatus === "COMPLETED") {
        const maxSequenceRoute = await tx.processRoute.findFirst({
          where: { jobCardId: pRoute.jobCardId },
          orderBy: { sequence: "desc" },
        });

        if (maxSequenceRoute && pRoute.sequence === maxSequenceRoute.sequence) {
          // Expire active trackers for this jobcard
          await tx.reworkBatchTracker.updateMany({
            where: {
              jobCardId: pRoute.jobCardId,
              isExpired: false
            },
            data: {
              isExpired: true
            }
          });
        }
      }
    }
    data = { process_start, addMain_punch_log };
  });

  return { statusCode: 0, data }; // ✅ return after transaction completes
}

async function UpdatePushProcess(req) {
  const {
    flag,
    productionlogid,
    userId,
    id,
    completedQty,
    wastageQty,
    remarks,
    pauseReason,
    reason,
    splitSizes,
    pauseQty,
    sizeswise,
    machineId,
  } = req?.body;

  var splitSizes__ = splitSizes?.length > 0 ? splitSizes : [];


  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const istISOString = istTime.toISOString();

  //const currentDate = istTime.toISOString();
  const currentTime = istTime.toISOString();

  let data;

  // console.log("pause----------------------------------------",req?.body)

  await prisma.$transaction(async (tx) => {
    let addMain_punch_log;

    if (flag === "PAUSE") {
      addMain_punch_log = await tx.pushLogs.create({
        data: {
          pushtime: istISOString,
          productionlog: productionlogid,
          Userid: userId,
          pauseReason: pauseReason,
          remarks: remarks,
          completedQty: Number(completedQty || 0),
          wastageQty: Number(wastageQty || 0),
          ...(!sizeswise && { pauseQty: Number(pauseQty) }),
        },
      });

      await Promise.all(
        splitSizes__?.map(async (element_size) => {
          return await tx.splitSizes?.create({
            data: {
              pushLogId: addMain_punch_log?.id,
              jobCardSizeId: element_size?.id,
              qty: element_size?.qty,
            },
          });
        }),
      );

      if (reason === "Partially Completed" || reason === "Others") {
        await tx?.takenmachines?.updateMany({
          data: {
            isAvailable: true,
          },
          where: {
            Machineid: machineId,
          },
        });
      }

      if (Number(completedQty || 0) > 0 || Number(wastageQty || 0) > 0) {
        const punchInfo = await tx.productionempPunch.findUnique({
          where: { id: productionlogid },
          include: { ProcessRoute: { include: { JobCard: true } } }
        });

        if (punchInfo && punchInfo.ProcessRoute) {
          const pRoute = punchInfo.ProcessRoute;
          const jobcardId = punchInfo.jobCardId;
          const processId = punchInfo.processRouteId;

          let actualQty = pRoute.actualQty || pRoute.sendQty;
          if (!actualQty) {
            if (pRoute.JobCard?.itemType === "LABEL") {
              actualQty = pRoute.JobCard.rollQty || 0;
            } else if (pRoute.JobCard) {
              actualQty = pRoute.JobCard.runningQty || 0;
            } else {
              actualQty = 0;
            }
          }
          let effectiveQty = actualQty;
          if (pRoute.sequence > 1) {
            const previousRoutes = await tx.processRoute.findMany({
              where: {
                jobCardId: jobcardId,
                sequence: { lt: pRoute.sequence },
                reworkSetId: pRoute.reworkSetId || null,
              },
            });
            const previousWastages = previousRoutes.reduce(
              (acc, curr) => acc + Number(curr.wastageQty || 0),
              0
            );
            effectiveQty = Math.max(actualQty - previousWastages, 0);
          }

          const totalCompleted = Number(pRoute.completedQty || 0) + Number(completedQty || 0);
          const totalWastage = Number(pRoute.wastageQty || 0) + Number(wastageQty || 0);

          if ((totalCompleted + totalWastage) > effectiveQty) {
            throw new Error(`Cannot process ${totalCompleted + totalWastage} pieces. The process only production below to ${effectiveQty}.`);
          }

          const pendingQty = Math.max(effectiveQty - (totalCompleted + totalWastage), 0);

          let routeStatus = "NOT_STARTED";
          if (totalCompleted > 0 || totalWastage > 0) {
            routeStatus = pendingQty === 0 ? "COMPLETED" : "PARTIALLY_COMPLETED";
          } else if (pRoute.sendQty > 0) {
            routeStatus = "IN_PROGRESS";
          }

          const getIncomingExist = await tx.incomingQty.findFirst({
            where: {
              sendRoute: processId,
              pendingQty: { gt: 0 },
              isCompleted: false
            },
            orderBy: { id: 'asc' }
          });

          let maxAllowed = actualQty;
          if (pRoute.sequence > 1 && getIncomingExist?.qty > 0) {  
              maxAllowed = Number(getIncomingExist?.qty || 0);
          }

          if (getIncomingExist && pRoute.sequence > 1) {
            const totalCompleted_Incoming = Number(getIncomingExist.completedQty || 0) + Number(completedQty || 0);
            const totalWastage_Incoming = Number(getIncomingExist.wastageQty || 0) + Number(wastageQty || 0);

            if ((totalCompleted_Incoming + totalWastage_Incoming) > maxAllowed) {
              throw new Error(`Cannot process ${totalCompleted_Incoming + totalWastage_Incoming} pieces. The previous process only completed ${maxAllowed} pieces.`);
            }

            const pendingQty_Incoming = Math.max((getIncomingExist.qty || 0) - (totalCompleted_Incoming + totalWastage_Incoming), 0);

            await tx.incomingQty.update({
              where: { id: getIncomingExist.id },
              data: {
                isCompleted: pendingQty_Incoming === 0,
                pendingQty: pendingQty_Incoming,
                wastageQty: totalWastage_Incoming,
                completedQty: totalCompleted_Incoming
              }
            });
          }

          const seqRoute = await tx.processRoute.findFirst({
            where: { jobCardId: jobcardId, sequence: Number(pRoute.sequence) + 1 }
          });

          if (seqRoute?.id && Number(completedQty || 0) > 0) {
            await tx.incomingQty.create({
              data: {
                jobCardId: Number(jobcardId),
                processRouteId: Number(processId),
                sendRoute: seqRoute.id,
                qty: Number(completedQty || 0),
                pendingQty: Number(completedQty || 0),
                completedQty: 0,
                wastageQty: 0
              }
            });
          }

          await tx.processRoute.update({
            where: { id: processId },
            data: {
              completedQty: totalCompleted,
              wastageQty: totalWastage,
              actualQty: actualQty,
              pendingQty: pendingQty,
              status: routeStatus
            }
          });

          if (pendingQty > 0 && reason === "Partially Completed") {
            const crypto = (await import("crypto")).default;
            const reworkSetId = crypto.randomUUID();
            await tx.reworkLog.create({
              data: {
                uniqueId: reworkSetId,
                jobCardId: jobcardId,
                processRouteId: processId,
                actualQty: actualQty,
                completedQty: totalCompleted,
                wastageQty: totalWastage,
                pendingQty: pendingQty,
                reason: "Partially Delivered",
                Userid: Number(userId) || null
              }
            });
            await tx.reworkBatchTracker.create({
              data: {
                uniqueId: reworkSetId,
                jobCardId: jobcardId,
                processRouteId: processId,
                userId: Number(userId) || 0,
                isExpired: false
              }
            });
          }
        }
      }
    } else if (flag === "RESUME") {
      var checkTaken_M = await tx?.takenmachines?.findFirst({
        where: {
          Userid: { not: userId },
          isAvailable: false,
          Machineid: machineId,
        },
      });

      if (checkTaken_M?.id) {
        addMain_punch_log = {
          statusCode: 1,
          message: "Machine have taken by another employee.!!!!",
        };
        data = addMain_punch_log;
        return;
      }

      const lastPausedLog = await tx.pushLogs.findFirst({
        where: {
          productionlog: productionlogid,
          Userid: userId,
          pushtime: { not: null },
          resumetime: null,
        },
        orderBy: {
          pushtime: "desc",
        },
      });
      addMain_punch_log = await tx.pushLogs.update({
        where: {
          id: lastPausedLog.id, // ✅ unique id — safe to update
        },
        data: {
          resumetime: istISOString,
        },
      });
      await tx?.takenmachines?.updateMany({
        data: {
          isAvailable: false,
        },
        where: {
          Machineid: machineId,
        },
      });
    }

    data = addMain_punch_log;
  });

  console.log("process PUSH", data);
  if (data?.statusCode === 1) return data;
  return { statusCode: 0, data };
}

async function update(id, body) {
  const { name, active, companyId, isOutsideJob, departmentId } = await body;
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
      isOutsideJob: Boolean(isOutsideJob),
      departmentId: parseInt(departmentId),
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

export {
  get,
  getOne,
  create,
  update,
  remove,
  UpdateProcess,
  UpdatePushProcess,
  UpdateCurrentProcess,
};

import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getDateFromDateTime,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import {
  buildIncludeForModule,
  createApprovalLog,
  evaluateConfigs,
  getApprovalStatus,
  getModuleApprovalSetup,
} from "../utils/approvalHelper.js";

const REFERENCE_PAGE = "JOB CARD";

async function getNextDocId(branchId, shortCode, startTime, endTime) {
  const lastObject = await prisma.jobCard.findFirst({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");
  let newDocId = `${branchObj.branchCode}/${shortCode}/JC/1`;

  if (lastObject) {
    const lastNo = parseInt(lastObject.docId.split("/").at(-1)) || 0;
    newDocId = `${branchObj.branchCode}/${shortCode}/JC/${lastNo + 1}`;
  }

  return newDocId;
}

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchProductionType,
    finYearId,
    searchCustomer,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(
      finYearDate?.startDateStartTime,
      finYearDate?.endDateEndTime,
    )
    : "";

  let newDocId = await getNextDocId(
    branchId,
    shortCode,
    finYearDate?.startDateStartTime,
    finYearDate?.endDateEndTime,
  );

  let data = await prisma.jobCard.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
          { createdAt: { gte: finYearDate.startTime } },
          { createdAt: { lte: finYearDate.endTime } },
        ]
        : undefined,
      docId: searchDocNo ? { contains: searchDocNo } : undefined,
      productionType: searchProductionType
        ? { contains: searchProductionType }
        : undefined,
      customer: {
        name: searchCustomer ? { contains: searchCustomer } : undefined,
      },
    },
    include: {
      customer: { select: { id: true, name: true } },
      gsm: { select: { id: true, name: true } },
      _count: {
        select: {
          productionAllocations: true,

          productionempPunch: true,
          takenMachines: true,
        },
      },
    },
    orderBy: { id: "desc" },
  });
  if (searchDocDate) {
    data = data.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
    );
  }
  let totalCount = data.length;

  // if (pagination) {
  //   data = data.slice(
  //     (pageNumber - 1) * parseInt(dataPerPage),
  //     pageNumber * dataPerPage,
  //   );
  // }

  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    branchId,
  );

  // ── fetch all relevant approval logs in one query ─────────────────────────
  const jobCardIds = data.map((o) => o.id);

  const approvalLogs = await prisma.approvalLog.findMany({
    where: { referencePage: REFERENCE_PAGE, referenceId: { in: jobCardIds } },
    select: {
      id: true,
      referenceId: true,
      status: true,
      remarks: true,
      currentLevel: true,
      LevelLogs: {
        select: {
          action: true,
          levelNo: true,
          userId: true,
          createdAt: true,
          User: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const approvalLogMap = approvalLogs.reduce((acc, log) => {
    acc[log.referenceId] = log;
    return acc;
  }, {});

  // ── fetch active configs only if approval is set up ───────────────────────
  const activeConfigs =
    hasApproval && module
      ? await prisma.approvalConfig.findMany({
        where: {
          moduleId: module.id,
          branchId: branchId ? parseInt(branchId) : undefined,
          active: true,
        },
        include: {
          ConfigConditions: {
            include: { Field: true, Operator: true, CompareField: true },
          },
          approvalLevels: {
            include: { LevelUsers: true },
            orderBy: { levelNo: "asc" },
          },
        },
      })
      : [];

  // ── resolve approval status per record ───────────────────────────────────
  let resolvedData = data.map((jobCard) => {
    const log = approvalLogMap[jobCard.id] ?? null;

    let shouldTrigger = false;
    if (!log && hasApproval && activeConfigs.length > 0) {
      shouldTrigger = evaluateConfigs(activeConfigs, jobCard);
    }

    return {
      ...jobCard,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
      childRecord:
        (jobCard._count?.productionAllocations || 0) +
        (jobCard._count?.productionempPunch || 0) +
        (jobCard._count?.takenMachines || 0),
    };
  });

  if (pagination) {
    resolvedData = resolvedData.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return { statusCode: 0, data: resolvedData, nextDocId: newDocId, totalCount };
}

/* Mobile Api's*/

// get job card Details
async function get_mob_jobcard(req) {
  const parsedId = parseInt(req?.query?.id);
  const userId = parseInt(req?.query?.userid);
  const processRouteId = parseInt(req?.query?.processRouteId);
  const branchId = parseInt(req?.query?.branchId)

  var check_punch_result = await prisma.productionempPunch?.findFirst({
    where: {
      jobCardId: Number(parsedId || 0),
      processRouteId: Number(processRouteId || 0),
    },
    include: {
      pushLogs: true,
      ProcessRoute: {
        include: { Process: true },
      },
    },
    orderBy: {
      createAt: "desc",
    },
  });

  //  var pushlog =  check_punch_result?.pushLogs?.findLast(flast=> flast.pushtime && flast.resumetime)
  var pushlog_last_ = check_punch_result?.pushLogs?.findLast(
    (flast) => flast.pushtime && !flast.resumetime,
  );

  if (
    check_punch_result?.Userid != userId &&
    check_punch_result &&
    !pushlog_last_ &&
    check_punch_result?.ProcessRoute?.status == "IN_PROGRESS"
  ) {
    throw new Error("Already another user taken this jobcard");
  } else if (check_punch_result?.ProcessRoute?.status == "COMPLETED") {
    throw new Error("Already completed and taken this jobcard");
  }

  if (isNaN(parsedId)) throw new Error("Invalid Job Card ID");

  try {
    const data = await prisma.jobCard.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        docId: true,
        createdAt: true,
        runningQty: true,
        productionType: true,
        branchId: true,
        itemType: true,
        rollQty: true,
        totalMeter: true,
        LabelSize: true,
        Color: true,
        customer: { select: { id: true, name: true } },
        StyleItem: { select: { name: true } },
        gsm: { select: { id: true, name: true } },
        Branch: { select: { branchName: true } },
        Plate: { select: { id: true, name: true } },
        Die: { select: { id: true, name: true } },

        boardQualities: {
          select: {
            id: true,
            gsm: true,
            noOfSheets: true,
            processId: true,
            Process: true,
            FullBoardSize: true,
            Board: true,
            Board: { select: { id: true, name: true } },
          },
        },
        processDetails: {
          select: {
            id: true,
            Process: { select: { id: true, name: true } },
          },
        },
        laminationDetails: {
          select: {
            id: true,
            Lamination: { select: { id: true, name: true } },
          },
        },
        varnishDetails: {
          select: {
            id: true,
            Varnish: { select: { id: true, name: true } },
          },
        },
        machineDetails: {
          select: {
            id: true,
            Machine: { select: { id: true, name: true } },
            Mac: true,
          },
        },

        // ─── Process Route ─────────────────
        processRoute: {
          select: {
            id: true,
            status: true,
            sequence: true,
            completedQty: true,
            sendQty: true,
            actualQty: true,
            pendingQty: true,
            Process: { select: { id: true, name: true } },
            productionAllocationDtls: {
              select: {
                id: true,
                isInHouse: true,
              },
            },
          },
          orderBy: { sequence: "asc" },
        },

        // ─── Other Details ─────────────────
        jobCardSizeDetails: {
          include: {
            Size: true,
          },
        },
        printingDetails: true,
        finishingProcesses: true,
        plateDetails: true,

        _count: {
          select: { productionAllocations: true },
        },
      },
    });

    var punch_result = await prisma.productionempPunch?.findFirst({
      where: {
        Userid: Number(userId || 0),
        jobCardId: Number(data?.id),
        processRouteId: Number(processRouteId || 0),
      },
      include: {
        pushLogs: {
          include: {
            splitSizes: {
              include: {
                JobCardSize: true,
              },
            },
          },
        },
        ProcessRoute: true,
      },

      orderBy: {
        createAt: "desc", // latest record first
      },
    });
    //const checkProcessNew = data?.processRoute?.slice(1)?.every((checkall) =>  checkall?.status === 'NOT_STARTED' )
    const checkProcessSeq = data?.processRoute?.find((checkall) => checkall?.id === processRouteId)
    //  const checkProcessSeq_inHose = data?.processRoute?.find((checkall) =>  checkall?.id === processRouteId )?.productionAllocationDtl?.[0]
    //  let isWaitingQty = false;
    var incomingData = await prisma.incomingQty?.findFirst({
      where: {
        jobCardId: data?.id,
        sendRoute: processRouteId,
        pendingQty: {
          gt: 0
        },
        AND: {
          outwardId: null
        }
      },
      orderBy: { id: 'asc' }
    })



    if ((!incomingData && checkProcessSeq?.status === "NOT_STARTED") || (checkProcessSeq?.sequence === 1 && checkProcessSeq?.status === "IN_PROGRESS" && Number(checkProcessSeq?.pendingQty || 0) === 0)) {
      incomingData = {
        pendingQty: data?.itemType === "LABEL" ? data?.rollQty : data?.runningQty,
        id: null
      }
    }

    const prevCheck = data?.processRoute?.find((seq) => (Number(checkProcessSeq?.sequence) - 1) === seq?.sequence)

    if ((!incomingData && checkProcessSeq?.status === "PARTIALLY_COMPLETED" && Number(checkProcessSeq?.pendingQty || 0) > 0) && (prevCheck?.pendingQty === 0 || prevCheck?.status === "COMPLETED" || !prevCheck)) {
      incomingData = {
        pendingQty: Number(checkProcessSeq?.pendingQty || 0),
        id: null
      }
    }

    if ((!incomingData && (checkProcessSeq?.sequence === 1 && checkProcessSeq?.status === "IN_PROGRESS" && Number(checkProcessSeq?.pendingQty || 0) > 0))) {
      incomingData = {
        pendingQty: Number(checkProcessSeq?.pendingQty || 0),
        id: null
      }
    }

    if (!incomingData && (prevCheck?.pendingQty === 0 || prevCheck?.status === "COMPLETED" || !prevCheck) && checkProcessSeq?.sequence !== 1) {
      incomingData = {
        pendingQty: Number(checkProcessSeq?.pendingQty || 0),
        id: null
      }
    }


    console.log("LL", incomingData)

    if (!data) return NoRecordFound("Job Card");
    if (incomingData?.pendingQty === 0 || !incomingData) return NoRecordFound("No quantity has been transferred to this process yet.")

    // ── Approval setup ────────────────────
    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      data.branchId,
    );

    let log = null;
    let shouldTrigger = false;

    if (hasApproval && module) {
      log = await prisma.approvalLog.findFirst({
        where: {
          referencePage: REFERENCE_PAGE,
          referenceId: data.id,
        },
        include: {
          LevelLogs: {
            include: { User: { select: { id: true, username: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!log) {
        const activeConfigs = await prisma.approvalConfig.findMany({
          where: {
            moduleId: module.id,
            branchId: parseInt(branchId || data.branchId),
            active: true,
          },
          include: {
            ConfigConditions: {
              include: {
                Field: true,
                Operator: true,
                CompareField: true,
              },
            },
          },
        });

        if (activeConfigs.length > 0) {
          shouldTrigger = evaluateConfigs(activeConfigs, data);
        }
      }
    }

    // ── Resolve approval status ───────────
    const resolvedData = {
      ...data,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
      approvalLog: log,
      processIncomingQty: incomingData?.pendingQty,
      processIncomingId: incomingData?.id ?? 0,
      childRecord: data._count.productionAllocations,
    };

    // ── Same logic as filtered_ but for single object ──
    const status = resolvedData?.approvalStatus?.status;
    const isAllowed = status === "APPROVED" || status === "NOT_CONFIGURED";

    if (!isAllowed) {
      return {
        statusCode: 1,
        message: "Job Card is not approved or configured",
      };
    }

    var Sorted_Sequence = resolvedData?.processRoute?.sort(
      (a, b) => a.sequence - b.sequence,
    );

    let selectedRoute = null;
    if (processRouteId) {
      selectedRoute = Sorted_Sequence?.find(r => r.id === processRouteId) ?? null;
    }

    if (!selectedRoute) {
      selectedRoute = Sorted_Sequence?.find(
        (last_taken) =>
          last_taken?.status === "NOT_STARTED" ||
          last_taken?.status === "IN_PROGRESS" ||
          last_taken?.status === "PARTIALLY_COMPLETED",
      ) ?? null;
    }



    return {
      statusCode: 0,
      data: {
        // ─── Core ──────────────────────────
        id: resolvedData?.id,
        docId: resolvedData?.docId,
        createdAt: resolvedData?.createdAt,
        productionType: resolvedData?.productionType,
        quantity: resolvedData?.quantity,
        runningQty: resolvedData?.runningQty,
        childRecord: resolvedData?.childRecord,
        machineDetails: resolvedData?.machineDetails,
        boardQualities: resolvedData?.boardQualities,
        StyleItem: resolvedData?.StyleItem,
        itemType: resolvedData?.itemType,
        LabelSize: resolvedData?.LabelSize,
        rollQty: resolvedData?.rollQty,
        totalMeter: resolvedData?.totalMeter,
        Color: resolvedData?.Color,
        punch_data: punch_result,
        processIncomingQty: resolvedData?.processIncomingQty,
        processIncomingId: resolvedData?.processIncomingId,
        // ─── Approval ──────────────────────
        approvalStatus: resolvedData?.approvalStatus, // ✅ full object not .status
        approvalLog: resolvedData?.approvalLog,
        // ─── Process Route ─────────────────
        processRoute: selectedRoute, // ✅ precise route selection
        allProcessRoutes: resolvedData?.processRoute, // ✅ full list for timeline

        // ─── Relations ─────────────────────
        customer: resolvedData?.customer,
        gsm: resolvedData?.gsm,
        Branch: resolvedData?.Branch,
        Plate: resolvedData?.Plate,
        Die: resolvedData?.Die,

        // ─── Details ───────────────────────
        boardQualities: resolvedData?.boardQualities,
        processDetails: resolvedData?.processDetails,
        laminationDetails: resolvedData?.laminationDetails,
        varnishDetails: resolvedData?.varnishDetails,
        machineDetails: resolvedData?.machineDetails,
        jobCardSizeDetails: resolvedData?.jobCardSizeDetails,
        printingDetails: resolvedData?.printingDetails,
        finishingProcesses: resolvedData?.finishingProcesses,
        plateDetails: resolvedData?.plateDetails,
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch job card: ${error.message}`);
  }
}

async function get_mob_compl_jobcard(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchProductionType,
    finYearId,
    searchCustomer,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(
      finYearDate?.startDateStartTime,
      finYearDate?.endDateEndTime,
    )
    : "";

  let newDocId = await getNextDocId(
    branchId,
    shortCode,
    finYearDate?.startDateStartTime,
    finYearDate?.endDateEndTime,
  );

  let data = await prisma.jobCard.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
          { createdAt: { gte: finYearDate.startTime } },
          { createdAt: { lte: finYearDate.endTime } },
        ]
        : undefined,
      docId: searchDocNo ? { contains: searchDocNo } : undefined,
      productionType: searchProductionType
        ? { contains: searchProductionType }
        : undefined,
      customer: {
        name: searchCustomer ? { contains: searchCustomer } : undefined,
      },
    },
    include: {
      processRoute: {
        include: {
          productionAllocationDtls: true,
          Process: {
            include: {
              Department: true,
            },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });
  if (searchDocDate) {
    data = data.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
    );
  }

  let totalCount = data.length;

  // if (pagination) {
  //   data = data.slice(
  //     (pageNumber - 1) * parseInt(dataPerPage),
  //     pageNumber * dataPerPage,
  //   );
  // }

  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    branchId,
  );

  // ── fetch all relevant approval logs in one query ─────────────────────────
  const jobCardIds = data.map((o) => o.id);

  const approvalLogs = await prisma.approvalLog.findMany({
    where: { referencePage: REFERENCE_PAGE, referenceId: { in: jobCardIds } },
    select: {
      id: true,
      referenceId: true,
      status: true,
      remarks: true,
      currentLevel: true,
      LevelLogs: {
        select: {
          action: true,
          levelNo: true,
          userId: true,
          createdAt: true,
          User: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const approvalLogMap = approvalLogs.reduce((acc, log) => {
    acc[log.referenceId] = log;
    return acc;
  }, {});

  // ── fetch active configs only if approval is set up ───────────────────────
  const activeConfigs =
    hasApproval && module
      ? await prisma.approvalConfig.findMany({
        where: {
          moduleId: module.id,
          branchId: branchId ? parseInt(branchId) : undefined,
          active: true,
        },
        include: {
          ConfigConditions: {
            include: { Field: true, Operator: true, CompareField: true },
          },
          approvalLevels: {
            include: { LevelUsers: true },
            orderBy: { levelNo: "asc" },
          },
        },
      })
      : [];

  // ── resolve approval status per record ───────────────────────────────────
  let resolvedData = data.map((jobCard) => {
    const log = approvalLogMap[jobCard.id] ?? null;

    let shouldTrigger = false;
    if (!log && hasApproval && activeConfigs.length > 0) {
      shouldTrigger = evaluateConfigs(activeConfigs, jobCard);
    }

    return {
      ...jobCard,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
    };
  });

  var filtered_ = resolvedData
    ?.filter((resolved_) => {
      const status = resolved_?.approvalStatus?.status;
      const Complted = resolved_?.processRoute?.every(
        (fe) => fe.status == "COMPLETED",
      );
      return (status === "APPROVED" || status === "NOT_CONFIGURED") && Complted;
    })
    ?.map((routes) => {
      var Sorted_Sequence = routes?.processRoute?.sort(
        (a, b) => a.sequence - b.sequence,
      );
      const lastNotStarted = Sorted_Sequence?.find(
        (last_taken) =>
          last_taken?.status === "NOT_STARTED" ||
          last_taken?.status === "IN_PROGRESS" ||
          last_taken?.status === "PARTIALLY_COMPLETED",
      );
      return {
        id: routes?.id,
        processRoute: lastNotStarted,
        docId: routes?.docId,
        approvalStatus: routes?.status,
        process: routes?.processRoute?.Process,
      };
    });

  //  data[1]?.processRoute[0]?.productionAllocationDtls[0]?.isInHouse

  if (pagination) {
    filtered_ = filtered_.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return { statusCode: 0, data: filtered_, nextDocId: newDocId, totalCount };
}

async function get_mob_joblist(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchProductionType,
    finYearId,
    searchCustomer,
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(
      finYearDate?.startDateStartTime,
      finYearDate?.endDateEndTime,
    )
    : "";

  let newDocId = await getNextDocId(
    branchId,
    shortCode,
    finYearDate?.startDateStartTime,
    finYearDate?.endDateEndTime,
  );

  let data = await prisma.jobCard.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
          { createdAt: { gte: finYearDate.startTime } },
          { createdAt: { lte: finYearDate.endTime } },
        ]
        : undefined,
      docId: searchDocNo ? { contains: searchDocNo } : undefined,
      productionType: searchProductionType
        ? { contains: searchProductionType }
        : undefined,
      customer: {
        name: searchCustomer ? { contains: searchCustomer } : undefined,
      },
      productionAllocations: {
        some: {
          allocationDetails: {
            some: {
              isInHouse: true
            }
          }
        }
      }
    },
    include: {
      productionAllocations: true,
      plateDetails: {
        select: {
          Machine: true
        }
      },
      processRoute: {
        where: {
          productionAllocationDtls: {
            some: {
              isInHouse: true
            }
          }
        },
        include: {
          productionAllocationDtls: true,
          Process: {
            include: {
              Department: true,
            },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });


  if (searchDocDate) {
    data = data.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
    );
  }

  let totalCount = data.length;

  // if (pagination) {
  //   data = data.slice(
  //     (pageNumber - 1) * parseInt(dataPerPage),
  //     pageNumber * dataPerPage,
  //   );
  // }

  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    branchId,
  );


  // ── fetch all relevant approval logs in one query ─────────────────────────
  const jobCardIds = data.map((o) => o.id);

  const approvalLogs = await prisma.approvalLog.findMany({
    where: { referencePage: REFERENCE_PAGE, referenceId: { in: jobCardIds } },
    select: {
      id: true,
      referenceId: true,
      status: true,
      remarks: true,
      currentLevel: true,
      LevelLogs: {
        select: {
          action: true,
          levelNo: true,
          userId: true,
          createdAt: true,
          User: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const approvalLogMap = approvalLogs.reduce((acc, log) => {
    acc[log.referenceId] = log;
    return acc;
  }, {});

  // ── fetch active configs only if approval is set up ───────────────────────
  const activeConfigs =
    hasApproval && module
      ? await prisma.approvalConfig.findMany({
        where: {
          moduleId: module.id,
          branchId: branchId ? parseInt(branchId) : undefined,
          active: true,
        },
        include: {
          ConfigConditions: {
            include: { Field: true, Operator: true, CompareField: true },
          },
          approvalLevels: {
            include: { LevelUsers: true },
            orderBy: { levelNo: "asc" },
          },
        },
      })
      : [];

  // ── resolve approval status per record ───────────────────────────────────
  let resolvedData = data.map((jobCard) => {
    const log = approvalLogMap[jobCard.id] ?? null;

    let shouldTrigger = false;
    if (!log && hasApproval && activeConfigs.length > 0) {
      shouldTrigger = evaluateConfigs(activeConfigs, jobCard);
    }

    return {
      ...jobCard,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
    };
  });

const routeIds = [];
     resolvedData.forEach((jobCard) => {
     jobCard.processRoute?.forEach((route) => {
    if (route.status === "PARTIALLY_COMPLETED" || route.status === "IN_PROGRESS" || route.status === "NOT_STARTED") {
         routeIds.push(route.id); // whatever field maps to `sendRoute`
      }
       });
       });

       const incomingQtys = await prisma.incomingQty.findMany({
       where: {
       jobCardId: { in: jobCardIds },      // already computed earlier in your function
        sendRoute: { in: routeIds },
       pendingQty: { gt: 0 },
       AND:{
        outwardId :null
       }
         },
          });

         

  var filtered_ = await resolvedData
    ?.filter((resolved_) => {
      const status = resolved_?.approvalStatus?.status;
      const Complted = resolved_?.processRoute?.some(
        (fe) => fe.status == "IN_PROGRESS" || fe.status == "NOT_STARTED" || fe.status == "PARTIALLY_COMPLETED",
      );
      return (status === "APPROVED" || status === "NOT_CONFIGURED") && Complted;
    })
    ?.flatMap(  (routes) => {
      var Sorted_Sequence = routes?.processRoute?.sort(
        (a, b) => a.sequence - b.sequence,
      );

      const availableRoutes = [];
      let foundNotStarted = false;

      


          const incomingQtyMap = new Map();
for (const iq of incomingQtys) {
  const key = `${iq.jobCardId}-${iq.sendRoute}`;
  if (!incomingQtyMap.has(key)) {
    incomingQtyMap.set(key, iq);
  }
}


     for (let route of (Sorted_Sequence || [])) {
  if (route.status === "COMPLETED") continue;

  console.log(
  "jobcard", routes?.id,
  "sorted:", Sorted_Sequence?.map(r => ({ id: r.id, seq: r.sequence, status: r.status }))
);

  if ((route.status === "PARTIALLY_COMPLETED" || route.status === "IN_PROGRESS" || route.status === "NOT_STARTED") &&  route?.sequence > 1) {
    const key = `${routes?.id}-${route.id}`;
    const incomingQty = incomingQtyMap.get(key); // instant, in-memory


     if (incomingQty) availableRoutes.push(route);
     if(route.status === "NOT_STARTED" && route?.sequence > 1 && incomingQty) foundNotStarted = true;
    // availableRoutes.push(route);
  } else if (route.status === "NOT_STARTED" && route?.sequence===1 && !foundNotStarted) {
    availableRoutes.push(route);
    foundNotStarted = true;
  }
}



      var machineList = routes?.plateDetails?.map((machineMap) => ({ ...machineMap?.Machine }))

      return availableRoutes.map((route) => ({
        id: routes?.id,
        processRoute: route,
        machineDetails: machineList,
        docId: routes?.docId,
        approvalStatus: routes?.status,
        process: route?.Process,
        priority: routes?.productionAllocations?.[0]?.priority ?? "LOW",
      }));
    });

  //  data[1]?.processRoute[0]?.productionAllocationDtls[0]?.isInHouse

  if (pagination) {
    filtered_ = filtered_.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return { statusCode: 0, data: filtered_, nextDocId: newDocId, totalCount };
}

async function getMachinebydep(req) {
  const { id } = req.query;

  var result = await prisma.department.findUnique({
    where: { id: Number(id || 0) },
    include: {
      machines: { select: { name: true, id: true } },
    },
  });

  return { statusCode: 0, data: result };
}

async function getEmployeeTakenJobcard(req) {
  const { userid } = req?.query;

  var result = await prisma.productionempPunch?.findFirst({
    where: {
      Userid: Number(userid || 0),
      endTime: null,
    },
    include: {
      pushLogs: true,
      ProcessRoute: true,
    },
    orderBy: {
      createAt: "desc",
    },
  });

  return { statusCode: 0, data: result };
}

/* End Mobile Api's*/

async function getJobCardList(req) {
  const { branchId, companyId, isDropdown, isProcessIssue } = req.query;

  let result = await prisma.jobCard.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      ...(isProcessIssue && {
        productionAllocations: {
          some: {},
        },
      }),
    },
    select: {
      id: true,
      docId: true,
      orderQty: true,
      styleItemId: true,
      runningQty: true,
      rollQty: true,
      customer: { select: { name: true } },
      processRoute: {
        orderBy: {
          sequence: "asc",
        },
      },
      OrderEntry: { select: { docId: true } },
      StyleItem: { select: { name: true } },
      productionAllocations: {
        select: {
          id: true,
          docId: true,
        },
      },
      ...(isDropdown && {
        _count: {
          select: {
            productionAllocations: true,
          },
        },
      }),
      ...(isProcessIssue && {
        _count: {
          select: {
            productionOutwards: true,
          },
        },
      }),
    },
    orderBy: {
      docId: "desc",
    },
  });

  let approvalLogMap = {};
  let activeConfigs = [];
  let hasApproval = false;

  if (isDropdown) {
    const approvalSetup = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );
    const module = approvalSetup?.module;
    hasApproval = approvalSetup?.hasApproval;

    const jobCardIds = result.map((o) => o.id);

    const approvalLogs = await prisma.approvalLog.findMany({
      where: { referencePage: REFERENCE_PAGE, referenceId: { in: jobCardIds } },
      select: {
        id: true,
        referenceId: true,
        status: true,
        remarks: true,
        currentLevel: true,
        LevelLogs: {
          select: {
            action: true,
            levelNo: true,
            userId: true,
            createdAt: true,
            User: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    approvalLogMap = approvalLogs.reduce((acc, log) => {
      acc[log.referenceId] = log;
      return acc;
    }, {});

    activeConfigs =
      hasApproval && module
        ? await prisma.approvalConfig.findMany({
          where: {
            moduleId: module.id,
            branchId: branchId ? parseInt(branchId) : undefined,
            active: true,
          },
          include: {
            ConfigConditions: {
              include: { Field: true, Operator: true, CompareField: true },
            },
            approvalLevels: {
              include: { LevelUsers: true },
              orderBy: { levelNo: "asc" },
            },
          },
        })
        : [];
  }

  const data = result.map((item) => {
    const log = approvalLogMap[item.id] ?? null;

    let shouldTrigger = false;

    if (!log && hasApproval && activeConfigs.length > 0) {
      shouldTrigger = evaluateConfigs(activeConfigs, item);
    }

    return {
      id: item.id,
      docId: item.docId,
      orderQty: item.orderQty,
      runningQty: item.runningQty,
      rollQty: item.rollQty,
      styleItemId: item.styleItemId,
      styleItemName: item.StyleItem?.name || "",
      customerName: item.customer?.name || "",
      orderEntryDocId: item.OrderEntry?.docId || "",
      processRoute: item.processRoute || [],
      productionAllocationId: item.productionAllocations?.[0]?.id || null,

      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
      childRecord: item?._count?.productionAllocations || 0,
      childRecordIssue: item?._count?.productionOutwards || 0,
    };
  });

  return { statusCode: 0, data };
}

async function getOne(id) {
  const data = await prisma.jobCard.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: { select: { id: true, name: true } },
      gsm: { select: { id: true, name: true } },
      Branch: { select: { branchName: true } },
      Plate: { select: { id: true, name: true } },
      Die: { select: { id: true, name: true } },
      boardQualities: {
        include: { Board: { select: { id: true, name: true } } },
      },
      processDetails: {
        include: { Process: { select: { id: true, name: true } } },
      },
      laminationDetails: {
        include: { Lamination: { select: { id: true, name: true } } },
      },
      varnishDetails: {
        include: { Varnish: { select: { id: true, name: true } } },
      },
      machineDetails: {
        include: { Machine: { select: { id: true, name: true } } },
      },
      processRoute: {
        include: { Process: { select: { id: true, name: true } } },
        orderBy: { sequence: "asc" },
      },
      jobCardSizeDetails: true,
      printingDetails: true,
      finishingProcesses: true,
      labelPrintingDetails: true,
      plateDetails: true,
      OrderEntry: {
        include: {
          orderItems: {
            include: {
              OrderStyleBreakup: {
                include: {
                  OrderSizeBreakup: {
                    include: {
                      PackingSizeBreakup: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          productionAllocations: true,
          productionempPunch: true,
          takenMachines: true,
        },
      },
    },
  });

  if (!data) return NoRecordFound("Job Card");

  for (const boardQuality of data.boardQualities) {
    let stockQty = 0;

    const boardData = await prisma.process.findFirst({
      where: {
        id: boardQuality.processId,
      },
      select: {
        name: true,
      },
    });

    if (boardData) {
      const itemData = await prisma.styleItem.findFirst({
        where: {
          name: boardData.name,
        },
        select: {
          id: true,
          uomId: true,
        },
      });
      if (itemData) {
        const stockData = await prisma.stock.aggregate({
          where: {
            styleItemId: itemData.id,
            branchId: data.branchId,
            storeId: data.storeId,
            gsmId: boardQuality.gsmId,
            sizeId: boardQuality.fullBoardId,
            uomId: itemData.uomId,
          },
          _sum: {
            qty: true,
          },
        });
        stockQty = stockData?._sum?.qty || 0;
      }
    }

    boardQuality.stockQty = stockQty + boardQuality.noOfSheets;
  }

  const { module, hasApproval } = await getModuleApprovalSetup(
    REFERENCE_PAGE,
    data.branchId,
  );
  let log = null;
  let shouldTrigger = false;

  if (hasApproval && module) {
    // 🔹 get approval log for this record
    log = await prisma.approvalLog.findFirst({
      where: {
        referencePage: REFERENCE_PAGE,
        referenceId: data.id,
      },
      include: {
        LevelLogs: {
          include: {
            User: { select: { id: true, username: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // 🔹 if no log → check config condition
    if (!log) {
      const activeConfigs = await prisma.approvalConfig.findMany({
        where: {
          moduleId: module.id,
          branchId: parseInt(branchId || data.branchId),
          active: true,
        },
        include: {
          ConfigConditions: {
            include: {
              Field: true,
              Operator: true,
              CompareField: true,
            },
          },
        },
      });

      if (activeConfigs.length > 0) {
        shouldTrigger = evaluateConfigs(activeConfigs, data);
      }
    }
  }
  return {
    statusCode: 0,
    data: {
      ...data,
      approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
      approvalLog: log,
      childRecord:
        (data._count?.productionAllocations || 0) +
        (data._count?.productionempPunch || 0) +
        (data._count?.takenMachines || 0),
    },
  };
}

// ─────────────────────────────────────────────
// SAFE ARRAY PARSER (NO JSON ERRORS)
// ─────────────────────────────────────────────
function safeArray(val) {
  // already array
  if (Array.isArray(val)) return val;

  // null / undefined / empty
  if (!val) return [];

  // string "undefined"
  if (val === "undefined") return [];

  // ONLY parse if it's actually a string
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch (err) {
      console.warn("⚠️ JSON Parse Failed:", val);
      return [];
    }
  }

  // fallback
  return [];
}

async function create(body) {
  try {
    const {
      userId,
      branchId,
      finYearId,
      docDate,
      orderEntryId,
      orderType,
      orderQty,
      customerId,
      plateSupplierId,
      gsmId,
      otherBoardId,
      fullBoardId,
      noOfPockets,
      cuttingSizeId,
      runningQty,
      isFourColor,
      isCutColor,
      isFront,
      isFrontAndBack,
      isCMYK,
      isCutColMachine,
      isFrontMachine,
      isFrontBackMachine,
      plateId,
      dieId,
      totalPlatesets,
      remarks,
      designerId,
      tagCardUps,
      jobRunTime,
      productionType,
      styleItemId,
      itemGroupId,
      itemType,
      followUpId,
      labelQuality,
      block,
      labelQty,
      rollQty,
      cutAndSeal,
      dieDescription,
      dieMethod,
      lenght,
      width,
      meter,
      // Arrays
      boardQualities,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
      trackingType,
      jobCardSizeDetails,
      selectedPrinting,
      selectedFinishing,
      orderItemId,
      plateDetails,
      labelSizeId,
      totalMeter,
      blockDate,
      isRepeatedJobCard,
      refJobCardId,
      splitType,
      storeId,
      selectedLabelPrinting,
      labelItemId,
      colorId,
      isHold,
      isCancelled,
      isNewPlate,
      isOldPlate,
    } = body;

    // ─────────────────────────────
    // ✅ SAFE ARRAYS
    // ─────────────────────────────
    const safeBoardItems = safeArray(boardQualities);
    const safeProcesses = safeArray(selectedProcesses);
    const safeLaminations = safeArray(laminations);
    const safeVarnishes = safeArray(varnishes);
    const safeMachines = safeArray(selectedMachines);
    const safeProcessRoute = safeArray(processRoute);
    const safeJobCardSizeDetails = safeArray(jobCardSizeDetails);
    const safeSelectedPrinting = safeArray(selectedPrinting);
    const safePlateDetails = safeArray(plateDetails);
    const safeLabelPrintingDetails = safeArray(selectedLabelPrinting);
    const safeFinishingDetails = safeArray(selectedFinishing);

    // ─────────────────────────────
    // FIN YEAR + DOC ID
    // ─────────────────────────────
    let finYearDate = await getFinYearStartTimeEndTime(finYearId);

    const shortCode = finYearDate
      ? getYearShortCodeForFinYear(
        finYearDate.startDateStartTime,
        finYearDate.endDateEndTime,
      )
      : "";

    const newDocId = await getNextDocId(
      branchId,
      shortCode,
      finYearDate?.startDateStartTime,
      finYearDate?.endDateEndTime,
    );

    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );
    let data;

    await prisma.$transaction(async (tx) => {
      data = await tx.jobCard.create({
        data: {
          docId: newDocId,
          docDate: docDate ? new Date(docDate) : null,

          createdById: userId ? Number(userId) : null,
          branchId: branchId ? Number(branchId) : null,

          orderEntryId: orderEntryId ? Number(orderEntryId) : null,
          orderType: orderType || null,
          orderQty: orderQty ? parseInt(orderQty) : null,
          orderItemId: orderItemId ? Number(orderItemId) : null,
          customerId: customerId ? Number(customerId) : null,
          plateSupplierId: plateSupplierId ? Number(plateSupplierId) : null,

          gsmId: gsmId ? Number(gsmId) : null,
          otherBoardId: otherBoardId ? Number(otherBoardId) : null,

          fullBoardId: fullBoardId ? Number(fullBoardId) : null,
          noOfPockets: noOfPockets ? parseInt(noOfPockets) : null,
          cuttingSizeId: cuttingSizeId ? Number(cuttingSizeId) : null,
          runningQty: runningQty ? parseInt(runningQty) : null,

          isFourColor: !!isFourColor,
          isCutColor: !!isCutColor,
          isFront: !!isFront,
          isFrontAndBack: !!isFrontAndBack,

          isCMYK: !!isCMYK,
          isCutColMachine: !!isCutColMachine,
          isFrontMachine: !!isFrontMachine,
          isFrontBackMachine: !!isFrontBackMachine,

          plateId: plateId ? Number(plateId) : null,
          dieId: dieId ? Number(dieId) : null,
          totalPlatesets: totalPlatesets || null,

          remarks: remarks || null,
          designerId: designerId ? Number(designerId) : null,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime || null,
          productionType: productionType || null,
          styleItemId: styleItemId ? Number(styleItemId) : null,
          itemGroupId: itemGroupId ? Number(itemGroupId) : null,
          itemType: itemType || null,
          followUpId: followUpId ? Number(followUpId) : null,
          labelQuality: labelQuality || null,
          block: block || null,
          labelQty: labelQty ? parseInt(labelQty) : null,
          rollQty: rollQty ? parseFloat(rollQty) : null,
          cutAndSeal: cutAndSeal || null,
          trackingType: trackingType || null,
          labelSizeId: labelSizeId ? Number(labelSizeId) : null,
          totalMeter: totalMeter ? parseInt(totalMeter) : null,
          blockDate: blockDate ? new Date(blockDate) : null,
          isRepeatedJobCard: !!isRepeatedJobCard,
          refJobCardId: refJobCardId ? Number(refJobCardId) : null,
          splitType: splitType || null,
          storeId: storeId ? Number(storeId) : null,
          labelItemId: labelItemId ? Number(labelItemId) : null,
          colorId: colorId ? Number(colorId) : null,
          dieDescription: dieDescription ?? null,
          dieMethod: dieMethod ?? null,
          isHold: isHold ?? false,
          isCancelled: isCancelled ?? false,
          lenght: lenght ? parseInt(lenght) : 0,
          width: width ? parseInt(width) : 0,
          meter: meter ? parseInt(meter) : 0,
          isNewPlate: !!isNewPlate,
          isOldPlate: !!isOldPlate,

          boardQualities: safeBoardItems.length
            ? {
              createMany: {
                data: safeBoardItems.map((item) => ({
                  processId: Number(item.processId),
                  gsmId: Number(item.gsmId),
                  fullBoardId: Number(item.fullBoardId),
                  noOfSheets: Number(item.noOfSheets),
                })),
              },
            }
            : undefined,

          printingDetails: safeSelectedPrinting.length
            ? {
              createMany: {
                data: safeSelectedPrinting.map((p) => ({
                  processId: Number(p.processId),
                  isFront: !!p.isFront,
                  isFrontAndBack: !!p.isFrontAndBack,
                })),
              },
            }
            : undefined,

          plateDetails: safePlateDetails.length
            ? {
              createMany: {
                data: safePlateDetails.map((p) => ({
                  plateId: p.plateId ? parseInt(p.plateId) : null,
                  machineId: p.machineId ? parseInt(p.machineId) : null,
                  plateName: p.plateName ?? "",
                  description: p.description ?? "",
                  qty: p.qty ? Number(p.qty) : null,
                })),
              },
            }
            : undefined,

          processDetails: safeProcesses.length
            ? {
              createMany: {
                data: safeProcesses.map((id) => ({
                  processId: Number(id),
                })),
              },
            }
            : undefined,

          laminationDetails: safeLaminations.length
            ? {
              createMany: {
                data: safeLaminations.map((l) => ({
                  laminationId: Number(l.processId),
                  isFront: !!l.isFront,
                  isFrontAndBack: !!l.isFrontAndBack,
                })),
              },
            }
            : undefined,

          varnishDetails: safeVarnishes.length
            ? {
              createMany: {
                data: safeVarnishes.map((v) => ({
                  varnishId: Number(v.processId),
                  isFront: !!v.isFront,
                  isFrontAndBack: !!v.isFrontAndBack,
                })),
              },
            }
            : undefined,

          machineDetails: safeMachines.length
            ? {
              createMany: {
                data: safeMachines.map((id) => ({
                  macId: Number(id),
                })),
              },
            }
            : undefined,

          processRoute: safeProcessRoute.length
            ? {
              createMany: {
                data: safeProcessRoute.map((r, idx) => ({
                  processId: r.processId ? Number(r.processId) : null,
                  type: r.type,
                  sequence: idx + 1,
                  isFront: !!r.isFront,
                  isFrontAndBack: !!r.isFrontAndBack,
                  status: "NOT_STARTED",
                })),
              },
            }
            : undefined,

          jobCardSizeDetails: safeJobCardSizeDetails.length
            ? {
              createMany: {
                data: safeJobCardSizeDetails.map((s) => ({
                  sizeId: s.sizeId ? Number(s.sizeId) : null,
                  qty: s.qty ? Number(s.qty) : null,
                  barcodeFrom: s.barcodeFrom || null,
                  barcodeTo: s.barcodeTo || null,
                })),
              },
            }
            : undefined,

          finishingProcesses: safeFinishingDetails.length
            ? {
              createMany: {
                data: safeFinishingDetails.map((id) => ({
                  processId: Number(id),
                })),
              },
            }
            : undefined,

          labelPrintingDetails: safeLabelPrintingDetails.length
            ? {
              createMany: {
                data: safeLabelPrintingDetails.map((id) => ({
                  processId: Number(id),
                })),
              },
            }
            : undefined,
        },
      });
      if (itemType !== "LABEL") {
        for (const boardQuality of boardQualities) {
          const process = await tx.process.findUnique({
            where: {
              id: Number(boardQuality.processId),
            },
            select: {
              name: true,
            },
          });

          if (!process) {
            throw new Error("Board process not found");
          }
          const styleItem = await tx.styleItem.findFirst({
            where: {
              name: process.name,
            },
            select: {
              id: true,
              uomId: true,
            },
          });

          if (!styleItem) {
            throw new Error(`Style Item not found for process ${process.name}`);
          }
          await tx.stock.create({
            data: {
              branchId: branchId ? parseInt(branchId) : undefined,
              storeId: parseInt(storeId),
              styleItemId: parseInt(styleItem.id),
              gsmId: parseInt(boardQuality.gsmId),
              sizeId: parseInt(boardQuality.fullBoardId),
              inOrOut: "Out",
              qty:
                boardQuality?.noOfSheets &&
                  !isNaN(parseFloat(boardQuality.noOfSheets))
                  ? -Math.abs(parseInt(boardQuality.noOfSheets))
                  : null,
              uomId: parseInt(styleItem.uomId),
              createdById: parseInt(userId),
              itemGroupId: parseInt(itemGroupId),
              jobCardId: parseInt(data.id),
              processName: "Job Card",
            },
          });
        }
      } else {
        const styleItem = await tx.styleItem.findUnique({
          where: {
            id: parseInt(labelItemId),
          },
          select: {
            id: true,
            uomId: true,
          },
        });

        await tx.stock.create({
          data: {
            branchId: branchId ? parseInt(branchId) : undefined,
            storeId: parseInt(storeId),
            styleItemId: parseInt(labelItemId),
            sizeId: parseInt(labelSizeId),
            inOrOut: "Out",
            qty:
              rollQty && !isNaN(parseFloat(rollQty))
                ? -Math.abs(parseFloat(rollQty))
                : null,
            uomId: parseInt(styleItem.uomId),
            createdById: parseInt(userId),
            itemGroupId: parseInt(itemGroupId),
            jobCardId: parseInt(data.id),
            processName: "Job Card",
            colorId: parseInt(colorId),
          },
        });
      }
      if (hasApproval && module) {
        // ✅ Dynamic include — pulls every relation any Field master references
        const includeClause = await buildIncludeForModule(module.id);

        const fullRecord = await tx.jobCard.findUnique({
          where: { id: data.id },
          include: includeClause,
        });

        await createApprovalLog(
          tx,
          branchId,
          module.id,
          data.id,
          REFERENCE_PAGE,
          fullRecord,
          data.docId,
          userId,
        );
      }
    });

    console.log("✅ CREATED SUCCESS:", data);

    return { statusCode: 0, data };
  } catch (err) {
    console.error("❌ SERVICE ERROR:", err);
    return { statusCode: 1, message: err.message };
  }
}

async function update(id, body) {
  try {
    const {
      userId,
      branchId,
      docDate,
      orderEntryId,
      orderType,
      orderQty,
      customerId,
      gsmId,
      otherBoardId,
      plateSupplierId,
      fullBoardId,
      noOfPockets,
      cuttingSizeId,
      runningQty,
      isFourColor,
      isCutColor,
      isFront,
      isFrontAndBack,
      isCMYK,
      isCutColMachine,
      isFrontMachine,
      isFrontBackMachine,
      plateId,
      dieId,
      totalPlatesets,
      remarks,
      designerId,
      tagCardUps,
      jobRunTime,
      boardQualities,
      selectedProcesses,
      laminations,
      varnishes,
      selectedMachines,
      processRoute,
      submitApproval,
      productionType,
      styleItemId,
      itemGroupId,
      itemType,
      followUpId,
      labelQuality,
      block,
      labelQty,
      rollQty,
      cutAndSeal,
      dieDescription,
      dieMethod,
      trackingType,
      jobCardSizeDetails,
      orderItemId,
      selectedPrinting,
      plateDetails,
      labelSizeId,
      selectedFinishing,
      totalMeter,
      blockDate,
      isRepeatedJobCard,
      refJobCardId,
      isAmendment,
      splitType,
      storeId,
      selectedLabelPrinting,
      labelItemId,
      colorId,
      isHold,
      isCancelled,
      lenght,
      width,
      meter,
      isNewPlate,
      isOldPlate,
    } = body;
    const dataFound = await prisma.jobCard.findUnique({
      where: { id: parseInt(id) },
    });
    if (!dataFound) return NoRecordFound("Job Card");

    // const parsedBoardItems = parseJsonField(boardItems, []);
    // const parsedProcesses = parseJsonField(selectedProcesses, []);
    // const parsedLaminations = parseJsonField(laminations, []);
    // const parsedVarnishes = parseJsonField(varnishes, []);
    // const parsedMachines = parseJsonField(selectedMachines, []);
    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );
    let data;
    await prisma.$transaction(async (tx) => {
      // Delete all child records first, then recreate (simplest safe strategy)
      await tx.boardQuality.deleteMany({ where: { jobCardId: parseInt(id) } });
      await tx.printingDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.plateDetails.deleteMany({ where: { jobCardId: parseInt(id) } });
      await tx.processDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.laminationDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.varnishDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.machineDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.jobCardSizeBreakup.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      await tx.finishingProcess.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      if (itemType !== "LABEL") {
        await tx.stock.deleteMany({
          where: {
            jobCardId: parseInt(id),
          },
        });
      }
      await tx.labelPrintingDetails.deleteMany({
        where: { jobCardId: parseInt(id) },
      });
      if (processRoute.length > 0) {
        // Fetch current DB rows for this job card
        const existingRouteRows = await tx.processRoute.findMany({
          where: { jobCardId: parseInt(id) },
          select: {
            id: true,
            processId: true,
            type: true,
            isFront: true,
            isFrontAndBack: true,
          },
        });

        // Build a lookup key identical to the frontend: "type:processId[:sub]"
        const makeRouteKey = (type, processId, isFront, isFrontAndBack) => {
          const sub = isFrontAndBack ? "frontback" : isFront ? "front" : "";
          return `${type}:${processId}${sub ? `:${sub}` : ""}`;
        };

        const existingKeyToRow = {};
        existingRouteRows.forEach((row) => {
          existingKeyToRow[
            makeRouteKey(
              row.type,
              row.processId,
              row.isFront,
              row.isFrontAndBack,
            )
          ] = row;
        });

        // Build desired key set from the incoming payload
        const incomingKeyToRoute = {};
        processRoute.forEach((r, idx) => {
          const key = makeRouteKey(
            r.type,
            Number(r.processId),
            Boolean(r.isFront),
            Boolean(r.isFrontAndBack),
          );
          incomingKeyToRoute[key] = { ...r, sequence: idx + 1 };
        });

        // Delete rows that are no longer in the incoming payload
        const keysToDelete = Object.keys(existingKeyToRow).filter(
          (k) => !incomingKeyToRoute[k],
        );
        if (keysToDelete.length > 0) {
          const idsToDelete = keysToDelete.map((k) => existingKeyToRow[k].id);
          await tx.processRoute.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        // Update sequence on rows that already exist (keep status/completedQty untouched)
        const keysToUpdate = Object.keys(incomingKeyToRoute).filter(
          (k) => existingKeyToRow[k],
        );
        for (const key of keysToUpdate) {
          await tx.processRoute.update({
            where: { id: existingKeyToRow[key].id },
            data: { sequence: incomingKeyToRoute[key].sequence },
          });
        }

        // Insert rows that are new
        const keysToInsert = Object.keys(incomingKeyToRoute).filter(
          (k) => !existingKeyToRow[k],
        );
        if (keysToInsert.length > 0) {
          await tx.processRoute.createMany({
            data: keysToInsert.map((k) => {
              const r = incomingKeyToRoute[k];
              return {
                jobCardId: parseInt(id),
                processId: r.processId ? Number(r.processId) : null,
                type: r.type,
                sequence: r.sequence,
                isFront: Boolean(r.isFront),
                isFrontAndBack: Boolean(r.isFrontAndBack),
                status: "NOT_STARTED",
              };
            }),
          });
        }
      } else {
        // Incoming payload has no routes — delete all existing rows
        await tx.processRoute.deleteMany({
          where: { jobCardId: parseInt(id) },
        });
      }
      if (isAmendment) {
        const allocation = await tx.productionAllocation.findFirst({
          where: { jobCardId: parseInt(id) },
          select: {
            id: true,
            allocationDetails: {
              select: { id: true, processId: true, type: true },
            },
          },
        });

        if (allocation) {
          // Build a sequence lookup from the (now-synced) incoming processRoute
          // key: "type:processId"  →  value: sequence (1-based)
          const existingDtlMap = {};
          allocation.allocationDetails.forEach((d) => {
            existingDtlMap[`${d.type}:${d.processId}`] = d;
          });

          const incomingDtlMap = {};
          processRoute.forEach((r, idx) => {
            incomingDtlMap[`${r.type}:${r.processId}`] = {
              ...r,
              sequence: idx + 1,
            };
          });

          // DELETE removed rows
          const deleteIds = Object.keys(existingDtlMap)
            .filter((k) => !incomingDtlMap[k])
            .map((k) => existingDtlMap[k].id);

          if (deleteIds.length) {
            await tx.productionAllocationDtl.deleteMany({
              where: { id: { in: deleteIds } },
            });
          }

          // UPDATE existing
          for (const key of Object.keys(incomingDtlMap)) {
            if (existingDtlMap[key]) {
              await tx.productionAllocationDtl.update({
                where: { id: existingDtlMap[key].id },
                data: {
                  sequence: incomingDtlMap[key].sequence,
                },
              });
            }
          }

          // INSERT new
          const insertRows = Object.keys(incomingDtlMap)
            .filter((k) => !existingDtlMap[k])
            .map((k) => ({
              productionAllocationId: allocation.id,
              processId: incomingDtlMap[k].processId,
              type: incomingDtlMap[k].type,
              sequence: incomingDtlMap[k].sequence,
              isInHouse: true,
              isOutSide: false,
            }));

          if (insertRows.length) {
            await tx.productionAllocationDtl.createMany({
              data: insertRows,
            });
          }
        }
      }

      data = await tx.jobCard.update({
        where: { id: parseInt(id) },
        data: {
          docDate: docDate ? new Date(docDate) : null,
          updatedById: parseInt(userId),
          branchId: branchId ? parseInt(branchId) : undefined,
          orderEntryId: orderEntryId ? parseInt(orderEntryId) : null,
          orderType: orderType || null,
          orderQty: orderQty ? parseInt(orderQty) : null,
          customerId: customerId ? parseInt(customerId) : null,
          plateSupplierId: plateSupplierId ? Number(plateSupplierId) : null,
          gsmId: gsmId ? parseInt(gsmId) : null,
          otherBoardId: otherBoardId ? parseInt(otherBoardId) : null,
          fullBoardId: fullBoardId ? parseInt(fullBoardId) : null,
          noOfPockets: noOfPockets ? parseInt(noOfPockets) : null,
          cuttingSizeId: cuttingSizeId ? Number(cuttingSizeId) : null,
          runningQty: runningQty ? parseInt(runningQty) : null,
          isFourColor: Boolean(isFourColor),
          isCutColor: Boolean(isCutColor),
          isFront: Boolean(isFront),
          isFrontAndBack: Boolean(isFrontAndBack),
          isCMYK: Boolean(isCMYK),
          isCutColMachine: Boolean(isCutColMachine),
          isFrontMachine: Boolean(isFrontMachine),
          isFrontBackMachine: Boolean(isFrontBackMachine),
          plateId: plateId ? parseInt(plateId) : null,
          dieId: dieId ? parseInt(dieId) : null,
          totalPlatesets: totalPlatesets || null,
          remarks: remarks || null,
          designerId: designerId ? parseInt(designerId) : null,
          tagCardUps: tagCardUps || null,
          jobRunTime: jobRunTime || null,
          productionType: productionType || null,
          styleItemId: styleItemId ? Number(styleItemId) : null,
          itemGroupId: itemGroupId ? Number(itemGroupId) : null,
          itemType: itemType || null,
          followUpId: followUpId ? Number(followUpId) : null,
          labelQuality: labelQuality || null,
          block: block || null,
          labelQty: labelQty ? Number(labelQty) : null,
          rollQty: rollQty ? Number(rollQty) : null,
          cutAndSeal: cutAndSeal || null,
          trackingType: trackingType || null,
          orderItemId: orderItemId ? Number(orderItemId) : null,
          labelSizeId: labelSizeId ? Number(labelSizeId) : null,
          totalMeter: totalMeter ? Number(totalMeter) : null,
          blockDate: blockDate ? new Date(blockDate) : null,
          isRepeatedJobCard: !!isRepeatedJobCard,
          refJobCardId: refJobCardId ? Number(refJobCardId) : null,
          splitType: splitType || null,
          storeId: storeId ? Number(storeId) : null,
          labelItemId: labelItemId ? Number(labelItemId) : null,
          colorId: colorId ? Number(colorId) : null,
          dieDescription: dieDescription ?? null,
          dieMethod: dieMethod ?? null,
          isHold: isHold ?? false,
          isCancelled: isCancelled ?? false,
          lenght: lenght ? parseInt(lenght) : 0,
          width: width ? parseInt(width) : 0,
          meter: meter ? parseInt(meter) : 0,
          isNewPlate: !!isNewPlate,
          isOldPlate: !!isOldPlate,

          boardQualities:
            boardQualities.length > 0
              ? {
                createMany: {
                  data: boardQualities.map((item) => ({
                    processId: Number(item.processId),
                    gsmId: Number(item.gsmId),
                    fullBoardId: Number(item.fullBoardId),
                    noOfSheets: Number(item.noOfSheets),
                  })),
                },
              }
              : undefined,

          printingDetails: selectedPrinting.length
            ? {
              createMany: {
                data: selectedPrinting.map((p) => ({
                  processId: Number(p.processId),
                  isFront: !!p.isFront,
                  isFrontAndBack: !!p.isFrontAndBack,
                })),
              },
            }
            : undefined,

          plateDetails: plateDetails.length
            ? {
              createMany: {
                data: plateDetails.map((p) => ({
                  plateId: p.plateId ? parseInt(p.plateId) : null,
                  machineId: p.machineId ? parseInt(p.machineId) : null,
                  plateName: p.plateName,
                  description: p.description ?? "",
                  qty: p.qty ? Number(p.qty) : null,
                })),
              },
            }
            : undefined,

          processDetails:
            selectedProcesses.length > 0
              ? {
                createMany: {
                  data: selectedProcesses.map((pId) => ({
                    processId: parseInt(pId),
                  })),
                },
              }
              : undefined,

          laminationDetails:
            laminations.length > 0
              ? {
                createMany: {
                  data: laminations.map((l) => ({
                    laminationId: parseInt(l.processId),
                    isFront: Boolean(l.isFront),
                    isFrontAndBack: Boolean(l.isFrontAndBack),
                  })),
                },
              }
              : undefined,

          varnishDetails:
            varnishes.length > 0
              ? {
                createMany: {
                  data: varnishes.map((v) => ({
                    varnishId: parseInt(v.processId),
                    isFront: Boolean(v.isFront),
                    isFrontAndBack: Boolean(v.isFrontAndBack),
                  })),
                },
              }
              : undefined,

          machineDetails:
            selectedMachines.length > 0
              ? {
                createMany: {
                  data: selectedMachines.map((mId) => ({
                    macId: parseInt(mId),
                  })),
                },
              }
              : undefined,

          jobCardSizeDetails: jobCardSizeDetails.length
            ? {
              createMany: {
                data: jobCardSizeDetails.map((s) => ({
                  sizeId: s.sizeId ? Number(s.sizeId) : null,
                  qty: s.qty ? Number(s.qty) : null,
                  barcodeFrom: s.barcodeFrom || null,
                  barcodeTo: s.barcodeTo || null,
                })),
              },
            }
            : undefined,
          finishingProcesses: selectedFinishing.length
            ? {
              createMany: {
                data: selectedFinishing.map((id) => ({
                  processId: Number(id),
                })),
              },
            }
            : undefined,
          labelPrintingDetails: selectedLabelPrinting.length
            ? {
              createMany: {
                data: selectedLabelPrinting.map((id) => ({
                  processId: Number(id),
                })),
              },
            }
            : undefined,
        },
      });
      if (itemType !== "LABEL") {
        for (const boardQuality of boardQualities) {
          const process = await tx.process.findUnique({
            where: {
              id: Number(boardQuality.processId),
            },
            select: {
              name: true,
            },
          });

          if (!process) {
            throw new Error("Board process not found");
          }
          const styleItem = await tx.styleItem.findFirst({
            where: {
              name: process.name,
            },
            select: {
              id: true,
              uomId: true,
            },
          });

          if (!styleItem) {
            throw new Error(`Style Item not found for process ${process.name}`);
          }
          await tx.stock.create({
            data: {
              branchId: Number(branchId),
              storeId: Number(storeId),
              styleItemId: parseInt(styleItem.id),
              gsmId: parseInt(boardQuality.gsmId),
              sizeId: parseInt(boardQuality.fullBoardId),
              inOrOut: "Out",
              qty:
                boardQuality?.noOfSheets &&
                  !isNaN(parseFloat(boardQuality.noOfSheets))
                  ? -Math.abs(parseInt(boardQuality.noOfSheets))
                  : null,
              uomId: parseInt(styleItem.uomId),
              createdById: parseInt(userId),
              itemGroupId: parseInt(itemGroupId),
              jobCardId: Number(id),
              processName: "Job Card",
            },
          });
        }
      } else {
        const styleItem = await tx.styleItem.findUnique({
          where: {
            id: parseInt(labelItemId),
          },
          select: {
            id: true,
            uomId: true,
          },
        });

        await tx.stock.updateMany({
          where: {
            jobCardId: parseInt(data.id),
          },
          data: {
            branchId: branchId ? parseInt(branchId) : undefined,
            storeId: parseInt(storeId),
            styleItemId: parseInt(labelItemId),
            sizeId: parseInt(labelSizeId),
            inOrOut: "Out",
            qty:
              rollQty && !isNaN(parseFloat(rollQty))
                ? -Math.abs(parseFloat(rollQty))
                : null,
            uomId: parseInt(styleItem.uomId),
            updatedById: parseInt(userId),
            itemGroupId: parseInt(itemGroupId),
            processName: "Job Card",
            colorId: parseInt(colorId),
          },
        });
      }
      if (submitApproval && hasApproval && module) {
        await tx.approvalLog.deleteMany({
          where: {
            referenceId: parseInt(id),
            referencePage: REFERENCE_PAGE,
            status: { in: ["REJECTED", "NOTAPPROVED"] },
          },
        });

        const fullRecord = await tx.jobCard.findUnique({
          where: { id: parseInt(id) },
          include: await buildIncludeForModule(module.id),
        });

        await createApprovalLog(
          tx,
          branchId,
          module.id,
          data.id,
          REFERENCE_PAGE,
          fullRecord,
          data.docId,
          userId,
        );
      }
    });

    return { statusCode: 0, data };
  } catch (err) {
    return { statusCode: 400, message: err.message };
  }
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
async function remove(id) {
  try {
    const jobCardId = parseInt(id);
    await prisma.approvalLog.deleteMany({
      where: { referencePage: REFERENCE_PAGE, referenceId: jobCardId },
    });
    const dataFound = await prisma.jobCard.findUnique({
      where: { id: jobCardId },
    });
    if (!dataFound) return NoRecordFound("Job Card");

    // Cascade delete handles child records (onDelete: Cascade in schema)
    const data = await prisma.jobCard.delete({
      where: { id: parseInt(id) },
    });

    await prisma.stock.deleteMany({
      where: { jobCardId: jobCardId },
    });

    return { statusCode: 0, data };
  } catch (err) {
    return { statusCode: 400, message: err.message };
  }
}

export {
  get,
  getOne,
  create,
  update,
  remove,
  getJobCardList,
  get_mob_joblist,
  get_mob_jobcard,
  getMachinebydep,
  getEmployeeTakenJobcard,
  get_mob_compl_jobcard,
};

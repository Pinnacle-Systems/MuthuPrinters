import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getYearShortCode,
  getDateFromDateTime,
  buildDateRange,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
import fs from "fs";
import path from "path";
import {
  getModuleApprovalSetup,
  getApprovalStatus,
  evaluateConfigs,
  buildIncludeForModule,
  createApprovalLog,
} from "../utils/approvalHelper.js";
import moment from "moment";
import { itemGroup, jobCard } from "../routes/index.js";
const REFERENCE_PAGE = "ORDER ENTRY";

async function getNextDocId(
  branchId,
  shortCode,
  startTime,
  endTime,
  saveType,
  docId,
  isUpdate,
) {
  // Case 1: Draft save
  if (saveType) {
    return "Draft Save";
  } else if (isUpdate === "drift") {
    lastObject = await prisma.packing.findFirst({
      where: {
        branchId: parseInt(branchId),
        draftSave: false,
        AND: [
          { createdAt: { gte: startTime } },
          { createdAt: { lte: endTime } },
        ],
      },
      orderBy: { id: "desc" },
    });
    const branchObj = await getTableRecordWithId(branchId, "branch");
    let newDocId = `${branchObj.branchCode}${getYearShortCode(
      new Date(),
    )}/PK/1`;

    if (lastObject) {
      newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/PK/${parseInt(lastObject.docId.split("/").at(-1)) + 1
        }`;
    }

    return newDocId;
  } else {
    let lastObject = await prisma.packing.findFirst({
      where: {
        branchId: parseInt(branchId),
        AND: [
          {
            createdAt: {
              gte: startTime,
            },
          },
          {
            createdAt: {
              lte: endTime,
            },
          },
        ],
      },
      orderBy: {
        id: "desc",
      },
    });

    const branchObj = await getTableRecordWithId(branchId, "branch");
    let newDocId = `${branchObj.branchCode}/${shortCode}/PK/1`;
    if (lastObject) {
      if (lastObject.docId === "Draft Save") {
        const records = await prisma.packing.findMany({
          select: {
            docId: true,
          },
          where: {
            branchId: parseInt(branchId),
            AND: [
              {
                createdAt: {
                  gte: startTime,
                },
              },
              {
                createdAt: {
                  lte: endTime,
                },
              },
            ],
          },
        });
        const maxDocId = records.reduce((max, current) => {
          const currentNo = Number(current.docId.split("/").pop());
          const maxNo = max ? Number(max.split("/").pop()) : 0;

          return currentNo > maxNo ? current.docId : max;
        }, null);
        newDocId = `${branchObj.branchCode}/${shortCode}/SO/${parseInt(maxDocId.split("/").at(-1)) + 1
          }`;
      } else {
        newDocId = `${branchObj.branchCode}/${shortCode}/SO/${parseInt(lastObject.docId.split("/").at(-1)) + 1
          }`;
      }
    }
    return newDocId;
  }
}

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    serachDocNo,
    searchDocDate,
    searchOrderType,
    finYearId,
    searchCustomer,
    serachJobCard
  } = req.query;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);
  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(finYearDate?.startTime, finYearDate?.endTime)
    : "";
  let newDocId = await getNextDocId(
    branchId,
    shortCode,
    finYearDate?.startDateStartTime,
    finYearDate?.endDateEndTime,
  );
  let data;
  let totalCount;
  data = await prisma.packing.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
      AND: finYearDate
        ? [
          {
            createdAt: {
              gte: finYearDate.startTime,
            },
          },
          {
            createdAt: {
              lte: finYearDate.endTime,
            },
          },
        ]
        : undefined,
      docId: Boolean(serachDocNo)
        ? {
          contains: serachDocNo.toUpperCase(),
        }
        : undefined,
      OrderEntry: {
        docId: searchOrderType
          ? {
            contains: searchOrderType.toUpperCase(),
          }
          : undefined,
      },
      OrderEntry: {
        customer: {
          name: searchCustomer
            ? {
              contains: searchCustomer.toUpperCase(),
            }
            : undefined,
        }
      },
      JobCard: {
        docId: serachJobCard
          ? {
            contains: serachJobCard.toUpperCase(),
          }
          : undefined,
      }



    },
    include: {
      PackingItems: {
        include: {
          PackingStyleBreakup: {
            include: {
              PackingSizeBreakup: true,
            }
          }
        }
      },
      OrderEntry: {
        include: {
          customer: true
        }
      },
      JobCard: true
    },
    orderBy: {
      id: "desc",
    },
  });
  if (searchDocDate) {
    data = data?.filter((item) =>
      String(getDateFromDateTime(item.createdAt)).includes(searchDocDate),
    );
  }
  totalCount = data.length;

  if (pagination) {
    data = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * parseInt(dataPerPage),
    );
  }

  return {
    statusCode: 0,
    data: data,
    nextDocId: newDocId,
    totalCount,
  };
}

async function getRefList(req) {
  const { branchId, companyId, isRefDistinct } = req.query;

  let data = await prisma.orderEntry.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,
    },
    select: {
      id: true,
      refNo: true,
      docId: true,
      customerId: true,
      orderItems: {
        select: {
          id: true,
          styleItemId: true,
          jobCards: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              jobCards: true,
            },
          },
        },
      },
    },
    distinct: isRefDistinct === "true" ? ["refNo"] : ["docId"],
    orderBy: {
      refNo: "asc",
    },
  });

  // ── only for non-distinct ref mode ─────────────────────────
  if (isRefDistinct !== "true") {
    const { module, hasApproval } = await getModuleApprovalSetup(
      REFERENCE_PAGE,
      branchId,
    );

    const orderIds = data.map((o) => o.id);

    const approvalLogs = await prisma.approvalLog.findMany({
      where: {
        referencePage: REFERENCE_PAGE,
        referenceId: { in: orderIds },
      },
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
            User: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    const approvalLogMap = approvalLogs.reduce((acc, log) => {
      acc[log.referenceId] = log;
      return acc;
    }, {});

    const activeConfigs =
      hasApproval && module
        ? await prisma.approvalConfig.findMany({
          where: {
            moduleId: module.id,
            branchId: parseInt(branchId),
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
            approvalLevels: {
              include: {
                LevelUsers: true,
              },
              orderBy: {
                levelNo: "asc",
              },
            },
          },
        })
        : [];

    data = data.map((order) => {
      const totalItems = order.orderItems.length;

      const createdItems = order.orderItems.filter(
        (item) => item._count.jobCards > 0,
      ).length;

      let creationStatus = "NOT_CREATED";

      if (totalItems > 0 && createdItems === totalItems) {
        creationStatus = "FULLY_CREATED";
      } else if (createdItems > 0) {
        creationStatus = "PARTIALLY_CREATED";
      }
      const log = approvalLogMap[order.id] ?? null;

      let shouldTrigger = false;

      if (!log && hasApproval && activeConfigs.length > 0) {
        shouldTrigger = evaluateConfigs(activeConfigs, order);
      }

      return {
        ...order,
        creationStatus,
        approvalStatus: getApprovalStatus(log, !!log || shouldTrigger),
        orderItems: order.orderItems.map((item) => ({
          ...item,
          childRecordCount: item._count.jobCards,
        })),
      };
    });
  }

  return { statusCode: 0, data };
}

async function geOrderItemsList(req) {
  const { orderEntryId } = req.query;

  let data = await prisma.SalesOrder.findMany({
    where: {
      orderEntryId: parseInt(orderEntryId),
    },
    select: {
      id: true,
      styleItemId: true,
      itemGroupId: true,
      ItemGroup: {
        select: {
          name: true,
        },
      },
      StyleItem: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          jobCards: true,
        },
      },
    },
  });

  const result = data.map((item) => ({
    id: item.styleItemId,
    childRecord: item._count.jobCards,
    name: item.StyleItem?.name || "",
    itemGroupId: item.itemGroupId,
    itemGroupName: item.ItemGroup?.name,
  }));

  return { statusCode: 0, data: result };
}

async function getOne(id) {
  const data = await prisma.Packing.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      PackingItems: {
        include: {
          PackingStyleBreakup: {
            include: {
              PackingSizeBreakup: {
                include: {
                  OrderSizeBreakup: {
                    include: {
                      PackingSizeBreakup: true
                    }
                  }
                }
              },
            }
          }
        }
      },
      OrderEntry: true
    },
  });

  if (!data) return NoRecordFound("Purchase Inward");


  return {
    statusCode: 0,
    data: {
      ...data,
      PackingItems: data.PackingItems.map((item) => ({
        ...item,
        styleBreakup: item.PackingStyleBreakup.map((size) => ({
          ...size,
          sizeBreakup: size.PackingSizeBreakup?.map((breakup) => ({
            ...breakup,
            alreadyPackingQty: breakup.OrderSizeBreakup?.PackingSizeBreakup
              ?.filter((i) => i?.id !== breakup?.id)
              ?.reduce((acc, size) => acc + (size.packingQty || 0), 0)
          })),
        })),
      })),

    },
  };
}

async function create(body) {
  const {
    userId,
    branchId,
    docDate,
    customerId,
    orderType,
    deliveryDate,
    remarks,
    requirements,
    finYearId,
    orderQty,
    attachments,
    draftSave,
    termsAndCondition,
    termsId,
    orderItems,
    productionType,
    proFormaId,
    refNo,
    isRepeatedPI,
    validDays,
    taxTemplateId,
    discountType,
    discountValue,
    conversionType,
    payTermId,
    bankId,
    currencyId,
    weightInKg,
    carriageCharge,
    loadingId,
    deliveryId,
    carriageTax,
    orderId,
    jobCardId
  } = await body;
  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  const shortCode = finYearDate ? getYearShortCodeForFinYear(finYearDate?.startDateStartTime, finYearDate?.endDateEndTime,) : "";

  let newDocId = await getNextDocId(branchId, shortCode, finYearDate?.startDateStartTime, finYearDate?.endDateEndTime, draftSave,);

  let data;


  const parsedOrderItems = typeof orderItems === "string" ? JSON.parse(orderItems) : orderItems;

  console.log(parsedOrderItems, "parsedOrderItems")
  const packingItems = parsedOrderItems?.length > 0
    ? parsedOrderItems.map((item) => ({
      styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
      itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
      itemSubGroupId: item?.itemSubGroupId
        ? parseInt(item?.itemSubGroupId)
        : null,
      labelWidth: item?.labelWidth ?? "",
      trackingType: item?.trackingType,
      price: item?.price ? parseFloat(item.price) : null,
      amount: item?.amount ? parseFloat(item.amount) : null,
      dozen: item?.dozen ? parseFloat(item.dozen) : null,
      taxPercent:
        item?.taxPercent && !isNaN(Number(item.taxPercent))
          ? parseFloat(item.taxPercent)
          : null,
      discountType: item?.discountType || null,
      discountValue:
        item?.discountValue && !isNaN(Number(item.discountValue))
          ? parseFloat(item.discountValue)
          : null,

      uomId: item?.uomId ? parseInt(item.uomId) : null,
      hsnId: item?.hsnId ? parseInt(item.hsnId) : null,

      PackingStyleBreakup:
        item?.styleBreakup?.length > 0
          ? {
            create: item.styleBreakup.map((st) => ({
              styleId: st.styleId ? parseInt(st.styleId) : null,
              PackingSizeBreakup: st?.sizeBreakup?.length > 0
                ? {
                  create: st.sizeBreakup.map((s) => ({
                    sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                    packingQty: s.packingQty ? parseInt(s.packingQty) : null,
                    qty: s.qty ? parseInt(s.qty) : null,
                    grossWeight: s.grossWeight ? String(s.grossWeight) : null,
                    netWeight: s.netWeight ? String(s.netWeight) : null,
                    dimensions: s.dimensions ?? "",
                    orderSizeBreakupId: s.id ? parseInt(s.id) : null
                  }))
                } : undefined
            })),
          }
          : undefined,
    }))
    : [];




  const validTo = moment(docDate).add(validDays, "days").endOf("day").toDate();

  let stockEntries = [];
  if (parsedOrderItems && parsedOrderItems.length > 0) {
    parsedOrderItems.forEach((item) => {
      const baseStock = {
        branchId: branchId ? parseInt(branchId) : null,
        jobCardId: jobCardId ? parseInt(jobCardId) : null,
        orderId: orderId ? parseInt(orderId) : null,
        createdById: userId ? parseInt(userId) : null,
        inOrOut: "In",
        processName: "Packing",
        styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
        itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
        uomId: item?.uomId ? parseInt(item.uomId) : null,
        hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
      };

      if (item?.styleBreakup?.length > 0) {
        item.styleBreakup.forEach((st) => {
          if (st?.sizeBreakup?.length > 0) {
            st.sizeBreakup.forEach((s) => {
              stockEntries.push({
                ...baseStock,
                styleId: st.styleId ? parseInt(st.styleId) : null,
                sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                qty: s?.packingQty ? parseFloat(s.packingQty) : null,
              });
            });
          } else {
            stockEntries.push({
              ...baseStock,
              styleId: st.styleId ? parseInt(st.styleId) : null,
              qty: s?.packingQty ? parseFloat(s.packingQty) : null,
            });
          }
        });
      } else {
        stockEntries.push({
          ...baseStock,
          qty: s?.packingQty ? parseFloat(s.packingQty) : null,
        });
      }
    });
  }

  console.log(stockEntries, "stockEntries")

  await prisma.$transaction(async (tx) => {
    data = await tx.Packing.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        orderId: orderId ? parseInt(orderId) : null,
        jobCardId: jobCardId ? parseInt(jobCardId) : null,

        createdById: parseInt(userId),
        branchId: branchId ? parseInt(branchId) : null,


        PackingItems:
          packingItems.length > 0
            ? {
              create: packingItems,
            }
            : undefined,

      },
    });



    if (stockEntries.length > 0) {
      const stockEntriesWithPackingId = stockEntries.map(entry => ({
        ...entry,
        packingId: data.id,
      }));
      await tx.Stock.createMany({
        data: stockEntriesWithPackingId
      });
    }

  });
  return { statusCode: 0, data };
}
async function update(id, body, files) {
  const {
    userId,
    attachments,

    orderItems,

  } = await body;



  const parseAttachments = JSON.parse(attachments || "[]");
  const incomingIds = parseAttachments
    ?.filter((i) => i.id)
    .map((i) => parseInt(i.id));

  const parsedItems = typeof orderItems === "string" ? JSON.parse(orderItems || "[]") : (orderItems || []);
  const incomingItemIds = parsedItems
    ?.filter((i) => i.id)
    .map((i) => parseInt(i.id));



  let data;

  const dataFound = await prisma.packing.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      PackingItems: true,
    },
  });
  if (!dataFound) return NoRecordFound("Packing");

  const removedItemIds = dataFound.PackingItems
    .filter((item) => !incomingItemIds.includes(item.id))
    .map((item) => item.id);


  let stockEntries = [];
  if (parsedItems && parsedItems.length > 0) {
    parsedItems.forEach((item) => {
      const baseStock = {
        branchId: dataFound.branchId,
        jobCardId: dataFound.jobCardId,
        orderId: dataFound.orderId,
        createdById: userId ? parseInt(userId) : dataFound.createdById,
        inOrOut: "In",
        processName: "Packing",
        styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
        itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
        uomId: item?.uomId ? parseInt(item.uomId) : null,
        hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
      };

      if (item?.styleBreakup?.length > 0) {
        item.styleBreakup.forEach((st) => {
          if (st?.sizeBreakup?.length > 0) {
            st.sizeBreakup.forEach((s) => {
              stockEntries.push({
                ...baseStock,
                styleId: st.styleId ? parseInt(st.styleId) : null,
                sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                qty: s?.packingQty ? parseFloat(s.packingQty) : null,
              });
            });
          } else {
            stockEntries.push({
              ...baseStock,
              styleId: st.styleId ? parseInt(st.styleId) : null,
              qty: st?.packingQty ? parseFloat(st.packingQty) : null,
            });
          }
        });
      } else {
        stockEntries.push({
          ...baseStock,
          qty: item?.packingQty ? parseFloat(item.packingQty) : null,
        });
      }
    });
  }


  await prisma.$transaction(async (tx) => {

    data = await tx.packing.update({
      where: {
        id: parseInt(id),
      },
      data: {
        PackingItems: {
          deleteMany: incomingItemIds.length
            ? { id: { notIn: incomingItemIds } }
            : {},
          update: parsedItems
            .filter((item) => item.id)
            .map((item) => ({
              where: { id: parseInt(item.id) },
              data: {
                styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
                itemGroupId: item.itemGroupId ? parseInt(item.itemGroupId) : null,
                itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
                labelWidth: item?.labelWidth ?? "",
                trackingType: item.trackingType,
                price: item?.price ? parseFloat(item.price) : null,
                amount: item?.amount ? parseFloat(item.amount) : null,
                dozen: item?.dozen ? parseFloat(item.dozen) : null,
                uomId: item.uomId ? parseInt(item.uomId) : null,
                gsmId: item.gsmId ? parseInt(item.gsmId) : null,
                PackingStyleBreakup: {
                  deleteMany: {},
                  create: item?.styleBreakup?.length > 0
                    ? item.styleBreakup.map((st) => ({
                      styleId: st.styleId ? parseInt(st.styleId) : null,
                      PackingSizeBreakup: st?.sizeBreakup?.length > 0
                        ? {
                          create: st.sizeBreakup.map((s) => ({
                            sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                            packingQty: s.packingQty ? parseInt(s.packingQty) : null,
                            qty: s.qty ? parseInt(s.qty) : null,
                            grossWeight: s.grossWeight ? String(s.grossWeight) : null,
                            netWeight: s.netWeight ? String(s.netWeight) : null,
                            dimensions: s.dimensions ?? "",
                          }))
                        } : undefined
                    }))
                    : []
                },
              },
            })),

          create: parsedItems
            .filter((item) => !item.id)
            .map((item) => ({
              styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
              itemGroupId: item.itemGroupId ? parseInt(item.itemGroupId) : null,
              itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
              labelWidth: item?.labelWidth ?? "",
              trackingType: item.trackingType,
              price: item?.price ? parseFloat(item.price) : null,
              amount: item?.amount ? parseFloat(item.amount) : null,
              dozen: item?.dozen ? parseFloat(item.dozen) : null,
              uomId: item.uomId ? parseInt(item.uomId) : null,
              gsmId: item.gsmId ? parseInt(item.gsmId) : null,
              PackingStyleBreakup:
                item?.styleBreakup?.length > 0
                  ? {
                    create: item.styleBreakup.map((st) => ({
                      styleId: st.styleId ? parseInt(st.styleId) : null,
                      PackingSizeBreakup: st?.sizeBreakup?.length > 0
                        ? {
                          create: st.sizeBreakup.map((s) => ({
                            sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                            packingQty: s.packingQty ? parseInt(s.packingQty) : null,
                            qty: s.qty ? parseInt(s.qty) : null,
                            grossWeight: s.grossWeight ? String(s.grossWeight) : null,
                            netWeight: s.netWeight ? String(s.netWeight) : null,
                            dimensions: s.dimensions ?? "",
                            orderSizeBreakupId: s.id ? parseInt(s.id) : null
                          }))
                        } : undefined
                    })),
                  }
                  : undefined,
            })),
        },

      },
    });

    await tx.Stock.deleteMany({
      where: {
        packingId: parseInt(id),
      }
    });

    if (stockEntries.length > 0) {
      const stockEntriesWithPackingId = stockEntries.map(entry => ({
        ...entry,
        packingId: data.id,
      }));
      await tx.Stock.createMany({
        data: stockEntriesWithPackingId
      });
    }

  });

  return { statusCode: 0, data };
}

async function remove(id) {
  const packingId = parseInt(id);

  const dataFound = await prisma.packing.findUnique({
    where: { id: packingId },
    include: {
      PackingItems: { select: { id: true } },
    },
  });

  const data = await prisma.packing.delete({
    where: {
      id: packingId,
    },
  });

  return { statusCode: 0, data };
}


export { get, getOne, create, update, remove, getRefList, geOrderItemsList };

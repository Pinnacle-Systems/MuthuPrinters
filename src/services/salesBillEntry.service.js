import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getYearShortCode,
  getDateFromDateTime,
  buildDateRange,
  childRecordCount,
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
    lastObject = await prisma.SalesOrder.findFirst({
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
    let newDocId = `${branchObj.branchCode}${getYearShortCode(new Date(),)}/SO/1`;

    if (lastObject) {
      newDocId = `${branchObj.branchCode}${getYearShortCode(new Date())}/SO/${parseInt(lastObject.docId.split("/").at(-1)) + 1
        }`;
    }

    return newDocId;
  } else {
    let lastObject = await prisma.SalesBillEntry.findFirst({
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
    let newDocId = `${branchObj.branchCode}/${shortCode}/SB/1`;
    if (lastObject) {
      if (lastObject.docId === "Draft Save") {
        const records = await prisma.SalesOrder.findMany({
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
        newDocId = `${branchObj.branchCode}/${shortCode}/SB/${parseInt(maxDocId.split("/").at(-1)) + 1
          }`;
      } else {
        newDocId = `${branchObj.branchCode}/${shortCode}/SB/${parseInt(lastObject.docId.split("/").at(-1)) + 1
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
    searchDocNo,
    searchDocDate,
    searchOrderNo,
    finYearId,
    searchCustomer,
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
  data = await prisma.SalesBillEntry.findMany({
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
      docId: Boolean(searchDocNo)
        ? {
          contains: searchDocNo.trim().toUpperCase(),
        }
        : undefined,
      SalesDelivery: {
        docId: Boolean(searchOrderNo)
          ? { contains: searchOrderNo.trim().toUpperCase() }
          : undefined,

      },
      customer: {
        name: searchCustomer ? { contains: searchCustomer.trim().toUpperCase() } : undefined,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      SalesDelivery: true

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
    data: data?.map((i) => {
      return {
        ...i,
        // childRecord: childRecordCount(i._count) || null
      };
    }),
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
  const data = await prisma.SalesBillEntry.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      SalesBillEntryItems: {
        include: {
          SaleBillEntryStyleBreakup: {
            include: {
              SaleBillEntrySizeBreakup: {
                include: {
                  SalesSizeBreakup: {
                    include: {
                      SaleBillEntrySizeBreakup: true
                    }
                  }
                }
              }
            },
          },
        },
      },

    },
  });

  if (!data) return NoRecordFound("Purchase Inward");


  return {
    statusCode: 0,
    data: {
      ...data,
      childRecord: childRecordCount(data._count) || null,
      SalesBillEntryItems: data.SalesBillEntryItems.map((item) => ({
        ...item,
        billQty: item.SaleBillEntryStyleBreakup.reduce((acc, size) => acc + size.SaleBillEntrySizeBreakup.reduce((acc1, size1) => acc1 + size1.billQty, 0), 0),

        styleBreakup: item.SaleBillEntryStyleBreakup.map((size) => ({
          ...size,
          sizeBreakup: size.SaleBillEntrySizeBreakup?.map((breakup) => ({
            ...breakup,
            alreadyBilledQty: breakup.SalesSizeBreakup?.SaleBillEntrySizeBreakup
              ?.filter((i) => i?.id !== breakup?.id)
              ?.reduce((acc, size) => acc + (size.billQty || 0), 0),
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
    salesDeliveryId,
    deliveryTaxType,
    deliveryTaxValue,
    amount
  } = await body;
  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  const shortCode = finYearDate ? getYearShortCodeForFinYear(finYearDate?.startDateStartTime, finYearDate?.endDateEndTime,) : "";

  let newDocId = await getNextDocId(branchId, shortCode, finYearDate?.startDateStartTime, finYearDate?.endDateEndTime, draftSave,);

  let data;

  const parsedOrderItems = typeof orderItems === "string" ? JSON.parse(orderItems) : orderItems;
  const safeOrderItems = parsedOrderItems?.length > 0
    ? parsedOrderItems.map((item) => ({
      styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
      deliveryQty: item?.deliveryQty ? parseInt(item?.deliveryQty) : null,
      sizeId: item?.sizeId ? parseInt(item.sizeId) : null,
      uomId: item?.uomId ? parseInt(item.uomId) : null,
      gsmId: item?.gsmId ? parseInt(item.gsmId) : null,
      itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
      hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
      trackingType: item?.trackingType,
      itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
      labelWidth: item?.labelWidth ?? "",
      price: item?.price ? parseFloat(item.price) : null,
      dozen: item?.dozen ? parseFloat(item.dozen) : null,
      taxPercent: item?.taxPercent && !isNaN(Number(item.taxPercent)) ? parseFloat(item.taxPercent) : null,
      discountType: item?.discountType || null,
      discountValue: item?.discountValue && !isNaN(Number(item.discountValue)) ? parseFloat(item.discountValue) : null,

      SaleBillEntryStyleBreakup:
        item?.styleBreakup?.length > 0
          ? {
            create: item.styleBreakup.map((st) => ({
              styleId: st.styleId ? parseInt(st.styleId) : null,
              SaleBillEntrySizeBreakup: st?.sizeBreakup?.length > 0
                ? {
                  create: st.sizeBreakup.map((s) => ({
                    sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                    billQty: s.billQty ? parseInt(s.billQty) : null,
                    deliveryQty: s.deliveryQty ? parseInt(s.deliveryQty) : null,
                    SalesSizeBreakupId: s.id ? parseInt(s.id) : null,

                  }))
                } : undefined
            })),
          }
          : undefined,
    }))
    : [];




  const validTo = moment(docDate).add(validDays, "days").endOf("day").toDate();
  await prisma.$transaction(async (tx) => {
    data = await tx.SalesBillEntry.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        createdById: parseInt(userId),
        branchId: branchId ? parseInt(branchId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        orderId: orderId ? parseInt(orderId) : null,
        salesDeliveryId: salesDeliveryId ? parseInt(salesDeliveryId) : null,
        remarks,
        validDays: validDays ? parseInt(validDays) : null,
        validTo: validTo,
        taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
        discountType: discountType || null,
        discountValue: discountValue ? parseFloat(discountValue) : null,
        payTermId: payTermId ? parseInt(payTermId) : null,


        termsAndCondition,
        deliveryTaxType: deliveryTaxType ? deliveryTaxType : null,
        deliveryTaxValue: deliveryTaxValue ? parseFloat(deliveryTaxValue) : null,

        currencyId: currencyId ? parseInt(currencyId) : null,
        loadingId: loadingId ? parseInt(loadingId) : null,
        deliveryId: deliveryId ? parseInt(deliveryId) : null,
        weightInKg: weightInKg ? parseFloat(weightInKg) : null,
        carriageCharge: carriageCharge ? parseFloat(carriageCharge) : null,
        conversionType: conversionType ? conversionType : 'DOZEN',
        carriageTax: carriageTax ? parseFloat(carriageTax) : null,
        bankId: bankId ? parseInt(bankId) : null,

        SalesBillEntryItems:
          safeOrderItems.length > 0
            ? {
              create: safeOrderItems,
            }
            : undefined,

      },
    });

    await tx.Ledger.create({
      data: {
        EntryType: "Sales",
        LedgerType: "Customer",
        creditOrDebit: "Debit",
        partyId: customerId ? parseInt(customerId) : null,
        amount: amount ? parseFloat(amount) : null,
        dcDate: docDate ? new Date(docDate) : null,
        // createdById: parseInt(userId),
        salesBillEntryId: data?.id ? parseInt(data.id) : null,
        currencyId: currencyId ? parseInt(currencyId) : null,

      }
    })

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

  const dataFound = await prisma.SalesOrder.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      SalesOrderItems: true,
    },
  });
  if (!dataFound) return NoRecordFound("Sales Order");

  const removedItemIds = dataFound.SalesOrderItems
    .filter((item) => !incomingItemIds.includes(item.id))
    .map((item) => item.id);





  await prisma.$transaction(async (tx) => {

    data = await tx.SalesOrder.update({
      where: {
        id: parseInt(id),
      },
      data: {
        SalesOrderItems: {
          deleteMany: incomingItemIds.length
            ? { id: { notIn: incomingItemIds } }
            : {},
          update: parsedItems
            .filter((item) => item.id)
            .map((item) => ({
              where: { id: parseInt(item.id) },
              data: {
                styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
                orderQty: item?.orderQty ? parseInt(item?.orderQty) : null,
                sizeId: item?.sizeId ? parseInt(item.sizeId) : null,
                uomId: item?.uomId ? parseInt(item.uomId) : null,
                gsmId: item?.gsmId ? parseInt(item.gsmId) : null,
                itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
                hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
                trackingType: item?.trackingType,
                itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
                labelWidth: item?.labelWidth ?? "",
                price: item?.price ? parseFloat(item.price) : null,

                dozen: item?.dozen ? parseFloat(item.dozen) : null,
                taxPercent: item?.taxPercent && !isNaN(Number(item.taxPercent)) ? parseFloat(item.taxPercent) : null,
                discountType: item?.discountType || null,
                discountValue: item?.discountValue && !isNaN(Number(item.discountValue)) ? parseFloat(item.discountValue) : null,

                SaleOrderStyleBreakup: {
                  deleteMany: {},
                  create: item?.styleBreakup?.length > 0
                    ? item.styleBreakup.map((st) => ({
                      styleId: st.styleId ? parseInt(st.styleId) : null,
                      SaleOrderSizeBreakup: st?.sizeBreakup?.length > 0
                        ? {
                          create: st.sizeBreakup.map((s) => ({
                            sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                            qty: s.billQty ? parseInt(s.billQty) : null,
                            deliveryQty: s.deliveryQty ? parseInt(s.deliveryQty) : null,
                            SalesSizeBreakupId: s.id ? parseInt(s.id) : null,

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
              styleItemId: item?.styleItemId ? parseInt(item.styleItemId) : null,
              orderQty: item?.orderQty ? parseInt(item?.orderQty) : null,
              sizeId: item?.sizeId ? parseInt(item.sizeId) : null,
              uomId: item?.uomId ? parseInt(item.uomId) : null,
              gsmId: item?.gsmId ? parseInt(item.gsmId) : null,
              itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
              hsnId: item?.hsnId ? parseInt(item.hsnId) : null,
              trackingType: item?.trackingType,
              itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
              labelWidth: item?.labelWidth ?? "",
              price: item?.price ? parseFloat(item.price) : null,

              dozen: item?.dozen ? parseFloat(item.dozen) : null,
              taxPercent: item?.taxPercent && !isNaN(Number(item.taxPercent)) ? parseFloat(item.taxPercent) : null,
              discountType: item?.discountType || null,
              discountValue: item?.discountValue && !isNaN(Number(item.discountValue)) ? parseFloat(item.discountValue) : null,

              SaleOrderStyleBreakup:
                item?.styleBreakup?.length > 0
                  ? {
                    create: item.styleBreakup.map((st) => ({
                      styleId: st.styleId ? parseInt(st.styleId) : null,
                      SaleOrderSizeBreakup: st?.sizeBreakup?.length > 0
                        ? {
                          create: st.sizeBreakup.map((s) => ({
                            sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                            qty: s.billQty ? parseInt(s.billQty) : null,
                            deliveryQty: s.deliveryQty ? parseInt(s.deliveryQty) : null,
                            SalesSizeBreakupId: s.id ? parseInt(s.id) : null,

                          }))
                        } : undefined
                    })),
                  }
                  : undefined,
            })),
        },

      },
    });




  });

  return { statusCode: 0, data };
}

async function remove(id) {
  const orderEntryId = parseInt(id);



  const data = await prisma.SalesBillEntry.delete({
    where: {
      id: orderEntryId,
    },
  });

  return { statusCode: 0, data };
}


export { get, getOne, create, update, remove, getRefList, geOrderItemsList };

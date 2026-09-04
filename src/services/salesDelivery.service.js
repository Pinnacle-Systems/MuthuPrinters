// salesDelivery.service.js

import { prisma } from "../lib/prisma.js";
import { NoRecordFound } from "../configs/Responses.js";
import {
  getYearShortCodeForFinYear,
  getDateFromDateTime,
  childRecordCount,
} from "../utils/helper.js";
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";
import { getTableRecordWithId } from "../utils/helperQueries.js";
// import { conversionTypes } from "../../client/src/Utils/DropdownData.js";

const REFERENCE_PAGE = "SALES DELIVERY";

// ─────────────────────────────────────────────────────────────
// DOC ID
// ─────────────────────────────────────────────────────────────

async function getNextDocId(branchId, shortCode, startTime, endTime, saveType) {
  if (saveType) return "Draft Save";

  let lastObject = await prisma.salesDelivery.findFirst({
    where: {
      branchId: parseInt(branchId),
      AND: [{ createdAt: { gte: startTime } }, { createdAt: { lte: endTime } }],
    },
    orderBy: { id: "desc" },
  });

  const branchObj = await getTableRecordWithId(branchId, "branch");

  let newDocId = `${branchObj.branchCode}/${shortCode}/SD/1`;

  if (lastObject) {
    if (lastObject.docId === "Draft Save") {
      const records = await prisma.salesDelivery.findMany({
        select: { docId: true },
        where: {
          branchId: parseInt(branchId),
          AND: [
            { createdAt: { gte: startTime } },
            { createdAt: { lte: endTime } },
          ],
        },
      });

      const maxDocId = records.reduce((max, current) => {
        const currentNo = Number(current.docId.split("/").pop());
        const maxNo = max ? Number(max.split("/").pop()) : 0;

        return currentNo > maxNo ? current.docId : max;
      }, null);

      newDocId = `${branchObj.branchCode}/${shortCode}/SD/${parseInt(maxDocId.split("/").at(-1)) + 1
        }`;
    } else {
      newDocId = `${branchObj.branchCode}/${shortCode}/SD/${parseInt(lastObject.docId.split("/").at(-1)) + 1
        }`;
    }
  }

  return newDocId;
}

// ─────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────

async function get(req) {
  const {
    branchId,
    pagination,
    pageNumber,
    dataPerPage,
    searchDocNo,
    searchDocDate,
    searchCustomer,
    finYearId,
    searchOrderNo
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

  let data = await prisma.salesDelivery.findMany({
    where: {
      branchId: branchId ? parseInt(branchId) : undefined,

      AND: finYearDate
        ? [
          { createdAt: { gte: finYearDate.startTime } },
          { createdAt: { lte: finYearDate.endTime } },
        ]
        : undefined,

      docId: Boolean(searchDocNo) ? { contains: searchDocNo.trim().toUpperCase() } : undefined,

      Customer: {
        name: searchCustomer ? { contains: searchCustomer.trim().toUpperCase() } : undefined,
      },

      SalesOrder: {
        docId: Boolean(searchOrderNo) ? { contains: searchOrderNo.trim().toUpperCase() } : undefined,
      },
    },

    include: {
      Customer: {
        select: {
          id: true,
          name: true,
        },
      },

      Branch: {
        select: {
          id: true,
          branchName: true,
        },
      },
      SalesOrder: {
        select: {
          id: true,
          docId: true,
        },
      },
      OrderEntry: {
        select: {
          id: true,
          docId: true,
        },
      },

      TaxTemplate: {
        select: {
          id: true,
          name: true,
        },
      },

      Terms: {
        select: {
          id: true,
          name: true,
        },
      },

      PayTerm: {
        select: {
          id: true,
          name: true,
        },
      },

      salesDeliveryItems: true,
      _count: {
        select: {
          SalesReturn: true
        }
      }
    },

    orderBy: {
      id: "desc",
    },
  });

  let totalCount = data.length;

  if (searchDocDate) {
    data = data.filter((item) =>
      String(getDateFromDateTime(item.docDate)).includes(searchDocDate),
    );
  }

  if (pagination) {
    data = data.slice(
      (pageNumber - 1) * parseInt(dataPerPage),
      pageNumber * dataPerPage,
    );
  }

  return {
    statusCode: 0,
    data: data?.map((i) => {
      return {
        ...i,
        childRecord: childRecordCount(i._count) || null
      };
    }),
    nextDocId: newDocId,
    totalCount,
  };
}

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────

async function getOne(id) {
  const data = await prisma.salesDelivery.findUnique({
    where: {
      id: parseInt(id),
    },

    include: {
      Customer: true,
      _count: {
        select: {
          SalesReturn: true
        }
      },
      Branch: true,

      OrderEntry: true,

      TaxTemplate: true,

      Terms: true,

      PayTerm: true,

      salesDeliveryItems: {
        include: {

          StyleItem: true,
          Uom: true,
          Hsn: true,
          SalesStyleBreakup: {
            include: {
              SalesSizeBreakup: {
                include: {
                  SaleOrderSizeBreakup: {
                    include: {
                      SalesSizeBreakup: true
                    },
                  },
                  SalesReturnSizeBreakup: true

                }
              },
            },
          },
        },
      },
    },
  });

  if (!data) {
    return NoRecordFound("Sales Delivery");
  }

  return {
    statusCode: 0,
    data: {
      ...data,
      childRecord: childRecordCount(data._count) || null,
      salesDeliveryItems: data.salesDeliveryItems.map((item) => ({
        ...item,
        deliveryQty: item.SalesStyleBreakup.reduce((acc, size) => acc + size.SalesSizeBreakup.reduce((acc1, size1) => acc1 + size1.deliveryQty, 0), 0),
        orderQty: item.SalesStyleBreakup.reduce((acc, size) => acc + size.SalesSizeBreakup.reduce((acc1, size1) => acc1 + size1.qty, 0), 0),
        styleBreakup: item.SalesStyleBreakup.map((size) => ({
          ...size,
          sizeBreakup: size.SalesSizeBreakup?.map((breakup) => ({
            ...breakup,
            alreadyDeliveryQty: breakup.SaleOrderSizeBreakup?.SalesSizeBreakup
              ?.filter((i) => i?.id !== breakup?.id)
              ?.reduce((acc, size) => acc + (size.deliveryQty || 0), 0),
            alreadyReturnQty: breakup.SalesReturnSizeBreakup
              ?.reduce((acc, size) => acc + (size.returnQty || 0), 0),
          })),
        })),
      })),

    },
  };
}

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────

async function create(body) {
  const {
    userId,
    branchId,
    finYearId,
    docDate,
    deliveryDate,
    customerId,
    orderEntryId,
    dcNo,
    vehicleNo,
    deliveryType,
    remarks,
    discountType,
    discountValue,
    taxTemplateId,
    termsAndCondition,
    termsId,
    payTermId,
    salesDeliveryItems,
    draftSave,
    conversionType,
    weightInKg,
    carriageCharge,
    currencyId,
    bankId,
    orderId,
    salesOrderId,
    amount,
    deliveryTaxType,
    deliveryTaxValue,
    loadingId,
    deliveryId,
    carriageTax
  } = body;

  let finYearDate = await getFinYearStartTimeEndTime(finYearId);

  const shortCode = finYearDate
    ? getYearShortCodeForFinYear(
      finYearDate.startDateStartTime,
      finYearDate.endDateEndTime,
    )
    : "";

  const newDocId = await getNextDocId(branchId, shortCode, finYearDate?.startDateStartTime, finYearDate?.endDateEndTime, draftSave);



  let stockEntries = [];
  if (salesDeliveryItems && salesDeliveryItems.length > 0) {
    salesDeliveryItems.forEach((item) => {
      const baseStock = {
        branchId: branchId ? parseInt(branchId) : null,
        orderId: orderId ? parseInt(orderId) : null,
        createdById: userId ? parseInt(userId) : null,
        inOrOut: "Out",
        processName: "Sales",
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
                qty: s?.deliveryQty ? parseFloat(s.deliveryQty) : null,
              });
            });
          } else {
            stockEntries.push({
              ...baseStock,
              styleId: st.styleId ? parseInt(st.styleId) : null,
              qty: s?.deliveryQty ? parseFloat(s.deliveryQty) : null,
            });
          }
        });
      } else {
        stockEntries.push({
          ...baseStock,
          qty: s?.deliveryQty ? parseFloat(s.deliveryQty) : null,
        });
      }
    });
  }

  const requestedQuantities = {};
  for (const entry of stockEntries) {
    const key = `${entry.styleItemId || 0}-${entry.styleId || 0}-${entry.sizeId || 0}`;
    if (!requestedQuantities[key]) {
      requestedQuantities[key] = {
        styleItemId: entry.styleItemId,
        styleId: entry.styleId,
        sizeId: entry.sizeId,
        qty: 0,
      };
    }
    requestedQuantities[key].qty += (entry.qty || 0);
  }

  for (const key in requestedQuantities) {
    const item = requestedQuantities[key];
    const inStockAgg = await prisma.stock.aggregate({
      _sum: { qty: true },
      where: {
        branchId: branchId ? parseInt(branchId) : null,
        styleItemId: item.styleItemId,
        styleId: item.styleId,
        sizeId: item.sizeId,
        inOrOut: "In",
      },
    });
    const outStockAgg = await prisma.stock.aggregate({
      _sum: { qty: true },
      where: {
        branchId: branchId ? parseInt(branchId) : null,
        styleItemId: item.styleItemId,
        styleId: item.styleId,
        sizeId: item.sizeId,
        inOrOut: "Out",
      },
    });
    const inQty = inStockAgg._sum.qty || 0;
    const outQty = outStockAgg._sum.qty || 0;
    const availableQty = inQty - outQty;

    if (item.qty > availableQty) {
      return { statusCode: 1, message: "Insufficient stock for one or more items." };
    }
  }

  let data
  await prisma.$transaction(async (tx) => {

    data = await tx.salesDelivery.create({
      data: {
        docId: newDocId,
        docDate: docDate ? new Date(docDate) : null,
        branchId: branchId ? parseInt(branchId) : null,
        customerId: customerId ? parseInt(customerId) : null,
        salesOrderId: salesOrderId ? parseInt(salesOrderId) : null,
        deliveryType: deliveryType ? deliveryType : null,
        conversionType,
        payTermId: payTermId ? parseInt(payTermId) : null,
        taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
        vehicleNo,
        weightInKg: weightInKg ? parseFloat(weightInKg) : null,
        bankId: bankId ? parseInt(bankId) : null,
        createdById: parseInt(userId),
        orderEntryId: orderEntryId ? parseInt(orderEntryId) : null,
        remarks,
        discountValue: discountValue ? parseFloat(discountValue) : null,
        termsAndCondition,
        termsId: termsId ? parseInt(termsId) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        discountType: discountType ? discountType : null,
        deliveryTaxType: deliveryTaxType ? deliveryTaxType : null,
        deliveryTaxValue: deliveryTaxValue ? parseFloat(deliveryTaxValue) : null,
        salesOrderId: salesOrderId ? parseInt(salesOrderId) : null,

        currencyId: currencyId ? parseInt(currencyId) : null,
        loadingId: loadingId ? parseInt(loadingId) : null,
        deliveryId: deliveryId ? parseInt(deliveryId) : null,
        weightInKg: weightInKg ? parseFloat(weightInKg) : null,
        carriageCharge: carriageCharge ? parseFloat(carriageCharge) : null,
        conversionType: conversionType ? conversionType : 'DOZEN',
        carriageTax: carriageTax ? parseFloat(carriageTax) : null,
        bankId: bankId ? parseInt(bankId) : null,

        salesDeliveryItems: {
          create: (salesDeliveryItems || []).map((item) => ({
            styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
            itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
            itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
            labelWidth: item?.labelWidth ?? "",
            hsnId: item.hsnId ? parseInt(item.hsnId) : null,
            uomId: item.uomId ? parseInt(item.uomId) : null,

            qty: item.deliveryQty ? parseFloat(item.deliveryQty) : null,
            price: item.price ? parseFloat(item.price) : null,
            amount: item.amount ? parseFloat(item.amount) : null,
            discountType: item.discountType,
            discountValue: item.discountValue ? parseFloat(item.discountValue) : null,
            taxPercent: item.taxPercent ? parseFloat(item.taxPercent) : null,
            trackingType: item.trackingType,

            SalesStyleBreakup:
              item?.styleBreakup?.length > 0
                ? {
                  create: item.styleBreakup.map((st) => ({
                    styleId: st.styleId ? parseInt(st.styleId) : null,
                    SalesSizeBreakup: st?.sizeBreakup?.length > 0
                      ? {
                        create: st.sizeBreakup.map((s) => ({
                          sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                          qty: s.qty ? String(s.qty) : null,
                          deliveryQty: s.deliveryQty ? String(s.deliveryQty) : null,
                          salesOrderSizeBreakupId: s.id ? parseInt(s.id) : null,

                        }))
                      } : undefined
                  })),
                }
                : undefined,
          })),




        },




      },



    });
    if (stockEntries.length > 0) {
      const stockEntriesWithSalesDeliveryId = stockEntries.map(entry => ({
        ...entry,
        salesDeliveryId: data.id,
      }));
      await tx.Stock.createMany({
        data: stockEntriesWithSalesDeliveryId
      });
    }
    if (deliveryType === "AGAINST_INVOICE") {
      await tx.Ledger.create({
        data: {
          EntryType: "Sales",
          LedgerType: "Customer",
          creditOrDebit: "Debit",
          partyId: customerId ? parseInt(customerId) : null,
          amount: amount ? parseFloat(amount) : null,
          dcDate: docDate ? new Date(docDate) : null,
          // createdById: parseInt(userId),
          salesDeliveryId: data?.id ? parseInt(data.id) : null,
        }
      })
    }
  });
  return {
    statusCode: 0,
    data,
  };
}

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────

async function update(id, body, files) {
  const {
    userId,
    branchId,
    finYearId,
    docDate,
    deliveryDate,
    customerId,
    orderEntryId,
    dcNo,
    vehicleNo,
    deliveryType,
    remarks,
    discountType,
    discountValue,
    taxTemplateId,
    termsAndCondition,
    termsId,
    payTermId,
    salesDeliveryItems,
    draftSave,
    conversionType,
    weightInKg,
    carriageCharge,
    currencyId,
    bankId,
    orderId,
    salesOrderId,
    amount,
    deliveryTaxType,
    deliveryTaxValue
  } = body;






  const parsedItems = typeof salesDeliveryItems === "string" ? JSON.parse(salesDeliveryItems || "[]") : (salesDeliveryItems || []);
  const incomingItemIds = parsedItems?.filter((i) => i.id)?.map((i) => parseInt(i.id));

  let data;

  const dataFound = await prisma.salesDelivery.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      salesDeliveryItems: true,
    },
  });
  if (!dataFound) return NoRecordFound("salesDelivery");

  const removedItemIds = dataFound.salesDeliveryItems.filter((item) => !incomingItemIds.includes(item.id)).map((item) => item.id);


  let stockEntries = [];
  if (parsedItems && parsedItems.length > 0) {
    parsedItems.forEach((item) => {
      const baseStock = {
        branchId: branchId ? parseInt(branchId) : null,
        orderId: orderId ? parseInt(orderId) : null,
        createdById: userId ? parseInt(userId) : null,
        inOrOut: "Out",
        processName: "Sales",
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
                qty: s?.deliveryQty ? parseFloat(s.deliveryQty) : null,
              });
            });
          } else {
            stockEntries.push({
              ...baseStock,
              styleId: st.styleId ? parseInt(st.styleId) : null,
              qty: st?.deliveryQty ? parseFloat(st.deliveryQty) : null,
            });
          }
        });
      } else {
        stockEntries.push({
          ...baseStock,
          qty: item?.deliveryQty ? parseFloat(item.deliveryQty) : null,
        });
      }
    });
  }
  console.log(stockEntries, "stockEntries for Delivery")

  const requestedQuantitiesUpdate = {};
  for (const entry of stockEntries) {
    const key = `${entry.styleItemId || 0}-${entry.styleId || 0}-${entry.sizeId || 0}`;
    if (!requestedQuantitiesUpdate[key]) {
      requestedQuantitiesUpdate[key] = {
        styleItemId: entry.styleItemId,
        styleId: entry.styleId,
        sizeId: entry.sizeId,
        qty: 0,
      };
    }
    requestedQuantitiesUpdate[key].qty += (entry.qty || 0);
  }

  for (const key in requestedQuantitiesUpdate) {
    const item = requestedQuantitiesUpdate[key];
    const inStockAgg = await prisma.stock.aggregate({
      _sum: { qty: true },
      where: {
        branchId: branchId ? parseInt(branchId) : null,
        styleItemId: item.styleItemId,
        styleId: item.styleId,
        sizeId: item.sizeId,
        inOrOut: "In",
      },
    });
    const outStockAgg = await prisma.stock.aggregate({
      _sum: { qty: true },
      where: {
        branchId: branchId ? parseInt(branchId) : null,
        styleItemId: item.styleItemId,
        styleId: item.styleId,
        sizeId: item.sizeId,
        inOrOut: "Out",
        salesDeliveryId: { not: parseInt(id) },
      },
    });
    const inQty = inStockAgg._sum.qty || 0;
    const outQty = outStockAgg._sum.qty || 0;
    const availableQty = inQty - outQty;

    if (item.qty > availableQty) {
      return { statusCode: 1, message: "Insufficient stock for one or more items." };
    }
  }

  await prisma.$transaction(async (tx) => {

    data = await tx.salesDelivery.update({
      where: {
        id: parseInt(id),
      },
      data: {
        customerId: customerId ? parseInt(customerId) : null,
        dcNo: dcNo ?? null,
        vehicleNo: vehicleNo ?? null,
        deliveryDate: deliveryDate ? moment(deliveryDate).toDate() : null,
        weightInKg: weightInKg ? parseFloat(weightInKg) : null,
        carriageCharge: carriageCharge ? parseFloat(carriageCharge) : null,
        deliveryTaxType: deliveryTaxType ? deliveryTaxType : null,
        deliveryTaxValue: deliveryTaxValue ? parseFloat(deliveryTaxValue) : null,
        orderId: orderId ? parseInt(orderId) : null,
        deliveryTaxType: deliveryTaxType ?? null,
        deliveryTaxValue: deliveryTaxValue ? parseFloat(deliveryTaxValue) : null,
        bankId: bankId ? parseInt(bankId) : null,
        salesDeliveryItems: {
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
                SalesStyleBreakup: {
                  deleteMany: {},
                  create: item?.styleBreakup?.length > 0
                    ? item.styleBreakup.map((st) => ({
                      styleId: st.styleId ? parseInt(st.styleId) : null,
                      SalesSizeBreakup: st?.sizeBreakup?.length > 0
                        ? {
                          create: st.sizeBreakup.map((s) => ({
                            sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                            qty: s.qty ? String(s.qty) : null,
                            deliveryQty: s.deliveryQty ? String(s.deliveryQty) : null,
                            salesOrderSizeBreakupId: s.salesOrderSizeBreakupId ? parseInt(s.salesOrderSizeBreakupId) : null,

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
              SalesStyleBreakup:
                item?.styleBreakup?.length > 0
                  ? {
                    create: item.styleBreakup.map((st) => ({
                      styleId: st.styleId ? parseInt(st.styleId) : null,
                      SalesSizeBreakup: st?.sizeBreakup?.length > 0
                        ? {
                          create: st.sizeBreakup.map((s) => ({
                            sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                            qty: s.qty ? String(s.qty) : null,
                            deliveryQty: s.deliveryQty ? String(s.deliveryQty) : null,
                            salesOrderSizeBreakupId: s.id ? parseInt(s.id) : null,

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
        salesDeliveryId: parseInt(id),
      }
    });

    if (stockEntries.length > 0) {
      const stockEntriesWithSalesDeliveryId = stockEntries.map(entry => ({
        ...entry,
        salesDeliveryId: data.id,
      }));
      await tx.Stock.createMany({
        data: stockEntriesWithSalesDeliveryId
      });
    }

  });

  return { statusCode: 0, data };
}

// ─────────────────────────────────────────────────────────────
// REMOVE
// ─────────────────────────────────────────────────────────────

async function remove(id) {
  const dataFound = await prisma.salesDelivery.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!dataFound) {
    return NoRecordFound("Sales Delivery");
  }

  await prisma.salesDelivery.delete({
    where: {
      id: parseInt(id),
    },
  });

  return {
    statusCode: 0,
    message: "Sales Delivery Deleted Successfully",
  };
}

export { get, getOne, create, update, remove };

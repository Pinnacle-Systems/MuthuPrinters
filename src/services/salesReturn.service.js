import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from '../configs/Responses.js';
import { exclude, getDateFromDateTime, getDateTimeRangeForCurrentYear, getYearShortCode, getYearShortCodeForFinYear } from '../utils/helper.js';
import { getTableRecordWithId } from '../utils/helperQueries.js';
import { getFinYearStartTimeEndTime } from "../utils/finYearHelper.js";



async function getNextDocId(branchId) {
    const { startTime, endTime } = getDateTimeRangeForCurrentYear(new Date());
    let lastObject = await prisma.salesReturn.findFirst({
        where: {
            branchId: parseInt(branchId),
            AND: [
                {
                    createdAt: {
                        gte: startTime

                    }
                },
                {
                    createdAt: {
                        lte: endTime
                    }
                }
            ],
        },
        orderBy: {
            id: 'desc'
        }
    });
    const branchObj = await getTableRecordWithId(branchId, "branch")
    let newDocId = `${branchObj.branchCode}/${getYearShortCode(new Date())}/SR/1`

    console.log(getYearShortCode(new Date()), "shortcode")
    if (lastObject) {

        newDocId = `${branchObj.branchCode}/${getYearShortCode(new Date())}/SR/${parseInt(lastObject.docId.split("/").at(-1)) + 1}`


    }
    return newDocId
}

function manualFilterSearchData(searchBillDate, data) {
    return data.filter(item =>
        (searchBillDate ? String(getDateFromDateTime(item.createdAt)).includes(searchBillDate) : true)
        // (searchSupplierDcDate ? String(getDateFromDateTime(item.dueDate)).includes(searchSupplierDcDate) : true) 
        // (searchPurchaseBillNo ?String(item.purchaseBillId).includes(searchPurchaseBillNo) : true) 
    )
}

async function get(req) {
    const { companyId, active, branchId, pagination, pageNumber, dataPerPage, searchDocId, searchBillDate, searchSupplierName, } = req.query
    let data = await prisma.salesReturn.findMany({
        where: {
            companyId: companyId ? parseInt(companyId) : undefined,
            active: active ? Boolean(active) : undefined,
            docId: Boolean(searchDocId) ?
                {
                    contains: searchDocId
                }
                : undefined,
            Customer: {
                name: Boolean(searchSupplierName) ? { contains: searchSupplierName } : undefined
            }
        },
        include: {
            Customer: true,
            SalesDelivery: {
                include: {
                    SalesOrder: {
                        include: {
                            OrderEntry: true
                        }
                    }
                }
            }
        },
        orderBy: {
            id: "desc"
        }

    });
    data = manualFilterSearchData(searchBillDate, data)
    const totalCount = data.length
    console.log(data, 'data');
    if (pagination) {
        data = data.slice(((pageNumber - 1) * parseInt(dataPerPage)), pageNumber * dataPerPage)
    }
    let newDocId = await getNextDocId(branchId)
    return { statusCode: 0, nextDocId: newDocId, data };
}


async function getOne(id) {
    const data = await prisma.salesReturn.findUnique({
        where: {
            id: parseInt(id),
        },

        include: {
            Customer: true,
            Branch: true,
            SalesReturnItems: {
                include: {
                    StyleItem: true,
                    Uom: true,
                    Hsn: true,
                    SalesReturnStyleBreakup: {
                        include: {
                            SalesReturnSizeBreakup: {
                                include: {
                                    SalesSizeBreakup: {
                                        include: {
                                            SalesReturnSizeBreakup: true
                                        }
                                    }
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
            SalesReturnItems: data.SalesReturnItems.map((item) => ({
                ...item,
                returnQty: item.SalesReturnStyleBreakup.reduce((acc, size) => acc + size.SalesReturnSizeBreakup.reduce((acc1, size1) => acc1 + size1.returnQty, 0), 0),
                salesDeliveryQty: item.SalesReturnStyleBreakup.reduce((acc, size) => acc + size.SalesReturnSizeBreakup.reduce((acc1, size1) => acc1 + size1.qty, 0), 0),
                styleBreakup: item.SalesReturnStyleBreakup.map((size) => ({
                    ...size,
                    sizeBreakup: size.SalesReturnSizeBreakup?.map((breakup) => ({
                        ...breakup,
                        deliveryQty: breakup?.qty,
                        alreadyReturnQty: breakup.SalesSizeBreakup?.SalesReturnSizeBreakup
                            ?.filter((i) => i?.id !== breakup?.id)
                            ?.reduce((acc, size) => parseInt(acc) + parseInt(size.returnQty || 0), 0)
                    })),
                })),
            })),

        },
    };
}

async function getSearch(req) {
    const { searchKey } = req.params
    const { companyId, active } = req.query
    const data = await prisma.salesReturn.findMany({
        where: {
            companyId: companyId ? parseInt(companyId) : undefined,
            active: active ? Boolean(active) : undefined,
            OR: [
                {
                    name: {
                        contains: searchKey,
                    },
                },
            ],
        }
    })
    return { statusCode: 0, data: data };
}



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
        salesDeliveryId,
        amount,
        deliveryTaxType,
        deliveryTaxValue
    } = body;

    let finYearDate = await getFinYearStartTimeEndTime(finYearId);

    const shortCode = finYearDate
        ? getYearShortCodeForFinYear(
            finYearDate.startDateStartTime,
            finYearDate.endDateEndTime,
        )
        : "";

    const newDocId = await getNextDocId(branchId);



    let stockEntries = [];
    if (salesDeliveryItems && salesDeliveryItems.length > 0) {
        salesDeliveryItems.forEach((item) => {
            const baseStock = {
                branchId: branchId ? parseInt(branchId) : null,
                orderId: orderId ? parseInt(orderId) : null,
                createdById: userId ? parseInt(userId) : null,
                inOrOut: "In",
                processName: "Return",
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
                                qty: s?.returnQty ? parseFloat(s.returnQty) : null,
                            });
                        });
                    } else {
                        stockEntries.push({
                            ...baseStock,
                            styleId: st.styleId ? parseInt(st.styleId) : null,
                            qty: s?.returnQty ? parseFloat(s.returnQty) : null,
                        });
                    }
                });
            } else {
                stockEntries.push({
                    ...baseStock,
                    qty: s?.returnQty ? parseFloat(s.returnQty) : null,
                });
            }
        });
    }
    let data
    await prisma.$transaction(async (tx) => {

        data = await tx.SalesReturn.create({
            data: {
                docId: newDocId,
                docDate: docDate ? new Date(docDate) : null,
                branchId: branchId ? parseInt(branchId) : null,
                customerId: customerId ? parseInt(customerId) : null,
                salesDeliveryId: salesDeliveryId ? parseInt(salesDeliveryId) : null,
                deliveryType: deliveryType ? deliveryType : null,
                conversionType,
                payTermId: payTermId ? parseInt(payTermId) : null,
                taxTemplateId: taxTemplateId ? parseInt(taxTemplateId) : null,
                vehicleNo,
                weightInKg: weightInKg ? parseFloat(weightInKg) : null,
                createdById: parseInt(userId),
                remarks,
                discountValue: discountValue ? parseFloat(discountValue) : null,
                termsAndCondition,
                termsId: termsId ? parseInt(termsId) : null,
                discountType: discountType ? discountType : null,


                SalesReturnItems: {
                    create: (salesDeliveryItems || []).map((item) => ({
                        styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
                        itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
                        itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
                        labelWidth: item?.labelWidth ?? "",
                        hsnId: item.hsnId ? parseInt(item.hsnId) : null,
                        uomId: item.uomId ? parseInt(item.uomId) : null,
                        price: item.price ? parseFloat(item.price) : null,
                        amount: item.amount ? parseFloat(item.amount) : null,
                        discountType: item.discountType,
                        discountValue: item.discountValue ? parseFloat(item.discountValue) : null,
                        taxPercent: item.taxPercent ? parseFloat(item.taxPercent) : null,
                        trackingType: item.trackingType,
                        deliveryQty: item?.deliveryQty ? parseFloat(item?.deliveryQty) : null,
                        SalesReturnStyleBreakup:
                            item?.styleBreakup?.length > 0
                                ? {
                                    create: item.styleBreakup.map((st) => ({
                                        styleId: st.styleId ? parseInt(st.styleId) : null,
                                        SalesReturnSizeBreakup: st?.sizeBreakup?.length > 0
                                            ? {
                                                create: st.sizeBreakup.map((s) => ({
                                                    sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                                                    qty: s.deliveryQty ? String(s.deliveryQty) : null,
                                                    returnQty: s.returnQty ? String(s.returnQty) : null,
                                                    salesSizeBreakupId: s.id ? parseInt(s.id) : null,

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
                salesReturnId: data.id,
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
                    salesReturnId: data?.id ? parseInt(data.id) : null,
                }
            })
        }
    });
    return {
        statusCode: 0,
        data,
    };
}



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

    const dataFound = await prisma.SalesReturn.findUnique({
        where: {
            id: parseInt(id),
        },
        include: {
            SalesReturnItems: true,
        },
    });
    if (!dataFound) return NoRecordFound("SalesReturn");

    const removedItemIds = dataFound.SalesReturnItems.filter((item) => !incomingItemIds.includes(item.id)).map((item) => item.id);


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
                                qty: s?.returnQty ? parseFloat(s.returnQty) : null,
                            });
                        });
                    } else {
                        stockEntries.push({
                            ...baseStock,
                            styleId: st.styleId ? parseInt(st.styleId) : null,
                            qty: st?.returnQty ? parseFloat(st.returnQty) : null,
                        });
                    }
                });
            } else {
                stockEntries.push({
                    ...baseStock,
                    qty: item?.returnQty ? parseFloat(item.returnQty) : null,
                });
            }
        });
    }
    console.log(stockEntries, "stockEntries for Delivery")

    await prisma.$transaction(async (tx) => {

        data = await tx.salesReturn.update({
            where: {
                id: parseInt(id),
            },
            data: {
                SalesReturnItems: {
                    deleteMany: incomingItemIds.length
                        ? { id: { notIn: incomingItemIds } }
                        : {},
                    update: parsedItems
                        .filter((item) => item.id)
                        .map((item) => ({
                            where: { id: parseInt(item.id) },
                            data: {
                                styleItemId: item.styleItemId ? parseInt(item.styleItemId) : null,
                                itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
                                itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
                                labelWidth: item?.labelWidth ?? "",
                                hsnId: item.hsnId ? parseInt(item.hsnId) : null,
                                uomId: item.uomId ? parseInt(item.uomId) : null,
                                price: item.price ? parseFloat(item.price) : null,
                                amount: item.amount ? parseFloat(item.amount) : null,
                                discountType: item.discountType,
                                discountValue: item.discountValue ? parseFloat(item.discountValue) : null,
                                taxPercent: item.taxPercent ? parseFloat(item.taxPercent) : null,
                                trackingType: item.trackingType,
                                SalesReturnStyleBreakup: {
                                    deleteMany: {},
                                    create: item?.styleBreakup?.length > 0
                                        ? item.styleBreakup.map((st) => ({
                                            styleId: st.styleId ? parseInt(st.styleId) : null,
                                            SalesReturnSizeBreakup: st?.sizeBreakup?.length > 0
                                                ? {
                                                    create: st.sizeBreakup.map((s) => ({
                                                        sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                                                        qty: s.qty ? String(s.qty) : null,
                                                        returnQty: s.returnQty ? String(s.returnQty) : null,
                                                        salesSizeBreakupId: s.salesSizeBreakupId ? parseInt(s.salesSizeBreakupId) : null,

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
                            itemGroupId: item?.itemGroupId ? parseInt(item.itemGroupId) : null,
                            itemSubGroupId: item?.itemSubGroupId ? parseInt(item?.itemSubGroupId) : null,
                            labelWidth: item?.labelWidth ?? "",
                            hsnId: item.hsnId ? parseInt(item.hsnId) : null,
                            uomId: item.uomId ? parseInt(item.uomId) : null,
                            price: item.price ? parseFloat(item.price) : null,
                            amount: item.amount ? parseFloat(item.amount) : null,
                            discountType: item.discountType,
                            discountValue: item.discountValue ? parseFloat(item.discountValue) : null,
                            taxPercent: item.taxPercent ? parseFloat(item.taxPercent) : null,
                            trackingType: item.trackingType,
                            deliveryQty: item?.deliveryQty ? parseFloat(item?.deliveryQty) : null,

                            SalesReturnStyleBreakup: {
                                create: item?.styleBreakup?.length > 0
                                    ? item.styleBreakup.map((st) => ({
                                        styleId: st.styleId ? parseInt(st.styleId) : null,
                                        SalesReturnSizeBreakup: st?.sizeBreakup?.length > 0
                                            ? {
                                                create: st.sizeBreakup.map((s) => ({
                                                    sizeId: s.sizeId ? parseInt(s.sizeId) : null,
                                                    qty: s.qty ? String(s.qty) : null,
                                                    returnQty: s.returnQty ? String(s.returnQty) : null,
                                                    salesSizeBreakupId: s.id ? parseInt(s.id) : null,

                                                }))
                                            } : undefined
                                    }))
                                    : []
                            },
                        })),
                },

            },
        });

        await tx.Stock.deleteMany({
            where: {
                salesReturnId: parseInt(id),
            }
        });

        if (stockEntries.length > 0) {
            const stockEntriesWithSalesDeliveryId = stockEntries.map(entry => ({
                ...entry,
                salesReturnId: data.id,
            }));
            await tx.Stock.createMany({
                data: stockEntriesWithSalesDeliveryId
            });
        }

    });

    return { statusCode: 0, data };
}

async function remove(id) {
    const data = await prisma.salesReturn.delete({
        where: {
            id: parseInt(id)
        },
    })
    return { statusCode: 0, data };
}

export {
    get,
    getOne,
    getSearch,
    create,
    update,
    remove
}

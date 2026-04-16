import { Prisma } from "../lib/prisma.js";
import { prisma } from "../lib/prisma.js";

import { NoRecordFound } from '../configs/Responses.js';
import { getDateFromDateTime, getDateTimeRange, getStockProperty } from '../utils/helper.js';


const xprisma = prisma.$extends({
    result: {
        stock: {
            gross: {
                needs: { price: true, qty: true },
                compute(stock) {
                    return stock.price * stock.qty
                }
            },
        }
    },
})

export async function getPcsStock(req) {
    const {
        pagination = false, dataPerPage = 5, pageNumber = 1, storeId, prevProcessId, styleId, productionDeliveryId, isPacking, finishedGoodsSalesId
    } = req.query
    let processId;
    if (prevProcessId) {
        let processData = await prisma.process.findUnique({
            where: {
                id: parseInt(prevProcessId)
            }
        })
        processId = prevProcessId;
        if (processData?.isCutting) {
            processId = null
        }
    }
    const storeFilter = Prisma.sql`stockForPcs.storeId = ${storeId}`
    const processFilter = processId ? Prisma.sql`stockForPcs.prevProcessId = ${prevProcessId}` : Prisma.sql`stockForPcs.prevProcessId IS NULL`
    const productionDeliveryIdFilter = Prisma.sql`(productionDelivery.id < ${productionDeliveryId} or productionDelivery.id IS NULL)`
    const isPackingFilter = isPacking ? Prisma.sql`process.isPacking = true` : Prisma.sql`(process.isPacking = false OR process.isPacking IS NULL)`
    let filterConditions = []
    if (styleId) {
        filterConditions.push(Prisma.sql`stockForPcs.styleId = ${styleId}`)
    }
    if (productionDeliveryId) {
        filterConditions.push(productionDeliveryIdFilter)
    }
    if (finishedGoodsSalesId) {
        filterConditions.push(Prisma.sql`(finishedGoodsSales.id < ${finishedGoodsSalesId} or finishedGoodsSales.id IS NULL)`)
    }
    if (!isPacking) {
        filterConditions.push(processFilter)
    }
    filterConditions = [...filterConditions, storeFilter, isPackingFilter]
    const where = Prisma.sql`where ${Prisma.join(filterConditions, ' and ')}`
    let data = await prisma.$queryRaw`
    select style.sku as styleName, stockForPcs.styleId,stockForPcs.portionId,portion.name as portionName, stockForPcs.sizeId,stockForPcs.colorId,color.name as colorName, stockForPcs.uomId, unitOfMeasurement.name as uomName, 
    size.name as sizeName, stockForPcs.prevProcessId, CASE WHEN stockForPcs.prevProcessId is null THEN 'Cutting' ELSE process.name END as processName, sum(stockforpcs.qty) as qty
    from stockforpcs
    left join productionDeliveryDetails on productionDeliveryDetails.id = stockforpcs.productionDeliveryDetailsId 
    left join productionDelivery on productionDelivery.id = productionDeliveryDetails.productionDeliveryId
    left join finishedGoodsSalesDetails on finishedGoodsSalesDetails.id = stockForPcs.finishedGoodsSalesDetailsId 
    left join finishedGoodsSales on finishedGoodsSales.id = finishedGoodsSalesDetails.finishedGoodsSalesId 
    left join style on style.id = stockForPcs.styleId
    left join size on size.id = stockForPcs.sizeId
    left join color on color.id = stockForPcs.colorId
    left join process on process.id = stockForPcs.prevProcessId 
    left join portion on portion.id = stockForPcs.portionId 
    left join unitOfMeasurement on unitOfMeasurement.id = stockForPcs.uomId 
    ${where}
    group by style.sku, stockForPcs.styleId, stockForPcs.portionId, portion.name, stockForPcs.sizeId, stockForPcs.colorId, color.name, stockForPcs.uomId, unitOfMeasurement.name, size.name, stockForPcs.prevProcessId, process.name
    having sum(stockforpcs.qty) > 0
    `
    let totalCount = data.length
    if (pagination) {
        data = data.slice(((pageNumber - 1) * parseInt(dataPerPage)), pageNumber * dataPerPage)
    }
    return { statusCode: 0, data, totalCount };
}
async function get(req) {
    const {
        branchId,
        fromDate,
        productId,
        searchProduct,
        pagination = false, 
        dataPerPage = 5, 
        pageNumber = 1,
        stockData,
        stockReport,
    } = req.query;

    let data;
    let totalCount;

    // Fetch QuatationStock data once
    const quatationStockData = await prisma.$queryRaw`
    SELECT
        sbi."productId",
        COALESCE(SUM(sbi.qty), 0) AS "totalQty"
    FROM "SalesBillItems" sbi
    JOIN "SalesBill" sb ON sbi."salesBillId" = sb.id
    WHERE sb."isOn" = false
    GROUP BY sbi."productId"
    `;
    console.log(quatationStockData,"quatationStockData")

    const quatationStockMap = new Map(
        quatationStockData.map(item => [item.productId, item.totalQty])
    );
    console.log(quatationStockMap,"quatationStockMap")

    if (stockData) {
        data = await prisma.$queryRaw`
        SELECT
            stock."productId",
            product.name,
            COALESCE(SUM(stock.qty), 0) AS sum
        FROM "Stock" stock
        LEFT JOIN "Product" product ON product.id = stock."productId"
        WHERE stock."branchId" = ${parseInt(branchId)}
        GROUP BY
            stock."productId", product.name;
        `;
        data = data.map(item => ({
            ...item,
            QuatationStock: quatationStockMap.get(item.productId) || 0
        }));

        totalCount = data.length;
        if (pagination) {
            data = data.slice(((pageNumber - 1) * parseInt(dataPerPage)), pageNumber * parseInt(dataPerPage));
        }
        return { statusCode: 0, data, totalCount };
    }

    if (stockReport) {
        data = await prisma.$queryRaw`
        SELECT
            stock."productId",
            product.name AS Product,
            COALESCE(SUM(stock.qty), 0) AS Stock,
            product.price AS "SaleRate",
            (product.price * COALESCE(SUM(stock.qty), 0)) AS "SaleValue"
        FROM "Stock" stock
        LEFT JOIN "Product" product ON product.id = stock."productId"
        GROUP BY
            stock."productId", product.name, product.price
        ORDER BY
            product.name;
        `;
        data = data.map(item => ({
            ...item,
            QuatationStock: quatationStockMap.get(item.productId) || 0
        }));

        totalCount = data.length;
        if (pagination) {
            data = data.slice(((pageNumber - 1) * parseInt(dataPerPage)), pageNumber * parseInt(dataPerPage));
        }
        return { statusCode: 0, data, totalCount };
    }

    data = await xprisma.stock.groupBy({
        by: ["productId"],
        _sum: {
            qty: true,
        },
        where: {
            productId: productId ? parseInt(productId) : undefined,
            Product: searchProduct ? {
                name: {
                    contains: searchProduct,
                },
            } : undefined,
        },
    });

  
    const productIds = data.map(item => item.productId);
    const products = await xprisma.product.findMany({
        where: {
            id: {
                in: productIds,
            },
        },
        select: {
            id: true,
            name: true,
        },
    });

   
    data = data.map(item => ({
        ...item,
        Product: products.find(product => product.id === item.productId)?.name || null,
        QuatationStock: quatationStockMap.get(item.productId) || 0
    }));

  
    data = data.filter(item => item._sum.qty !== 0);
    totalCount = data.length;

    if (pagination) {
        data = data.slice(((pageNumber - 1) * parseInt(dataPerPage)), pageNumber * parseInt(dataPerPage));
    }

    return { statusCode: 0, data, totalCount };
}




async function getOne(id, query) {

    const { productId,salesBillItemsId,isOn } = query;
    isOn: typeof(isOn) === "undefined" ? undefined : JSON.parse(isOn)
    let data;

    try {
         if(isOn == 'false'){
            data = await prisma.$queryRaw`
            SELECT
               COALESCE(SUM(qty), 0) AS "stockQty",
               "productId"
           FROM "Stock"
           WHERE "productId" = ${productId}
           GROUP BY "productId"
       `;
         }
     else if(salesBillItemsId)
        {
            data = await prisma.$queryRaw`
             SELECT
                COALESCE(SUM(qty), 0) AS "stockQty",
                "productId"
            FROM "Stock"
            WHERE "productId" = ${productId}
              AND (
                id < (
                    SELECT MAX(id)
                    FROM "Stock"
                    WHERE "salesBillItemsId" = ${salesBillItemsId}
                )
              )
            GROUP BY "productId"
        `;
        }
        
        else{
            data = await prisma.$queryRaw`
            SELECT
                COALESCE(SUM(qty), 0) AS "stockQty",
                "productId"
            FROM "Stock"
            WHERE "productId" = ${productId}
            GROUP BY "productId"
        `;
        }
      
    } catch (error) {
        console.error("Database query error: ", error);
        throw new Error("Failed to fetch stock data");
    }

    if (!data || data.length === 0) {
        return NoRecordFound("stock");
    }

    return { statusCode: 0, data };
}



async function getSearch(req) {
    const { companyId, active } = req.query
    const { searchKey } = req.params
    const data = await prisma.stock.findMany({
        where: {
            country: {
                companyId: companyId ? parseInt(companyId) : undefined,
            },
            active: active ? Boolean(active) : undefined,
            OR: [
                {
                    aliasName: {
                        contains: searchKey,
                    },
                }
            ],
        }
    })
    return { statusCode: 0, data: data };
}

async function create(body) {
    const { aliasName, accessoryItemId, hsn, accessoryCategory, active, companyId } = await body
    const data = await prisma.stock.create({
        data: {
            aliasName, accessoryItemId: parseInt(accessoryItemId), hsn, accessoryCategory,
            active, companyId: parseInt(companyId)
        },
    });
    return { statusCode: 0, data };
}

async function update(id, body) {
    const { aliasName, accessoryItemId, hsn, accessoryCategory, active, companyId } = await body
    const dataFound = await prisma.stock.findUnique({
        where: {
            id: parseInt(id)
        }
    })
    if (!dataFound) return NoRecordFound("stock");
    const data = await prisma.stock.update({
        where: {
            id: parseInt(id),
        },
        data: {
            aliasName, accessoryItemId: parseInt(accessoryItemId), hsn, accessoryCategory,
            active, companyId: parseInt(companyId)
        },
    })
    return { statusCode: 0, data };
};

async function remove(id) {
    const data = await prisma.stock.delete({
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
    remove,
}

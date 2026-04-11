// import prisma from "../../models/getPrisma";
import { prisma } from '../../lib/prisma.js'

export default async function profitReport(startDateStartTime, endDateEndTime) {
    return await prisma.$queryRaw`
   select Product, Qty, FORMAT(purchaseAmount,2) as 'Purchase Amount', FORMAT(saleAmount,2) as 'Sale Amount', FORMAT(saleAmount - purchaseAmount, 2) as Profit from (SELECT 
    product.name AS Product,
    sum(qty) as Qty,
    sum(salesbillitemsout.price * qty) as saleAmount,
    ROUND((SELECT 
                    SUM(e.purchaseAmount)
                FROM
                    (SELECT 
                        d.product,
                            d.purchaseRate,
                            d.qty,
                            d.purchaseRate * qty AS purchaseAmount
                    FROM
                        (SELECT 
                        product.name AS product,
                            qty,
                            (SELECT 
                                    SUM(e.amount) / SUM(e.qty)
                                FROM
                                    (SELECT 
                                    pobillitems.price,
                                        pobillitems.qty,
                                        pobillitems.price * pobillitems.qty AS amount 
                                FROM
                                    pobillitems
                                JOIN purchasebill pb ON pb.id = pobillitems.purchaseBillId
                                WHERE
                                    pb.createdAt < sb.createdAt
                                        AND pobillitems.productId = salesbillitems.productId
                                      ) e) AS purchaseRate
                            
                    FROM
                        salesbillitems
                    JOIN salesbill sb ON sb.id = salesbillitems.salesbillid
                    LEFT JOIN product ON product.id = salesbillitems.productId
                    WHERE
                        salesbillitems.productId = salesbillitemsout.productId AND isOn = '1'
                            AND
                sb.createdAt BETWEEN ${startDateStartTime} AND ${endDateEndTime}
                            ) d) e),
            2) AS purchaseAmount
FROM
    salesbillitems salesbillitemsout
        LEFT JOIN
    product ON product.id = salesbillitemsout.productId
    LEFT JOIN
    SalesBill salebill ON salebill.id = salesbillitemsout.salesBillId
    WHERE salebill.createdAt BETWEEN ${startDateStartTime} AND ${endDateEndTime} AND isOn = '1'
GROUP BY salesbillitemsout.productId , product.name )f
    ORDER BY Product
    `
}
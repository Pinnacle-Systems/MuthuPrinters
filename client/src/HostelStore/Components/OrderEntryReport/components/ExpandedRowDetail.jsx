import React, { useState } from "react";
import { fmtDate } from "../orderEntryReportUtils";

const TABS = [
  { key: "items", label: (r) => `Order Items (${r.orderItems?.length ?? 0})` },
  { key: "job", label: (r) => `Job Cards (${r.JobCard?.length ?? 0})` },
  { key: "sale", label: (r) => `Sale Orders (${r.SalesOrder?.length ?? 0})` },
  { key: "pack", label: (r) => `Packing (${r.Packing?.length ?? 0})` },
  {
    key: "deliv",
    label: (r) => {
      const ds = r.SalesOrder?.flatMap((so) => so.SalesDelivery || []) || [];
      return `Sales Deliveries (${ds.length})`;
    },
  },
];

export default function ExpandedRowDetail({ row }) {
  const [tab, setTab] = useState("items");
  const salesDeliveries = [
    ...(row.salesDeliveries?.map((sd) => ({ ...sd, SaleOrderNo: sd.SalesOrder?.docId || "-" })) || []),
    ...(row.SalesOrder?.flatMap((so) =>
      (so.SalesDelivery || []).map((sd) => ({
        ...sd,
        SaleOrderNo: so.docId,
      }))
    ) || [])
  ];

  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 text-xs">
      {/* tabs */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
              tab === t.key
                ? "bg-blue-50 text-blue-700 border-blue-300 font-medium"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t.label(row)}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {tab === "items" && (
          <OrderItemsTab
            items={row.orderItems || []}
            jobCards={row.JobCard || []}
            salesDeliveries={salesDeliveries}
          />
        )}
        {tab === "job" && (
          <SimpleDocTab
            title="Job Cards"
            docName="Job Card"
            docs={row.JobCard || []}
            showProcessRoute={true}
          />
        )}
        {tab === "sale" && (
          <SimpleDocTab
            title="Sale Orders"
            docName="Sale Order"
            docs={row.SalesOrder || []}
          />
        )}
        {tab === "pack" && (
          <SimpleDocTab
            title="Packing"
            docName="Packing"
            docs={row.Packing || []}
            showJobCard={true}
          />
        )}
        {tab === "deliv" && (
          <SimpleDocTab
            title="Sales Deliveries"
            docName="Sales Delivery"
            docs={salesDeliveries}
            showSaleOrder={true}
          />
        )}
      </div>
    </div>
  );
}

function OrderItemsTab({ items, jobCards, salesDeliveries = [] }) {
  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No items found for this order.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-2">
      <table className="text-left border-collapse whitespace-nowrap w-full">
        <thead>
          <tr className="bg-gray-50 text-xs font-medium text-gray-500 tracking-wider border-b">
            <th className="py-2 px-4 w-[200px]">Item Name</th>
            <th className="py-2 px-4 w-[150px]">Style</th>
            <th className="py-2 px-4 w-[250px]">Size Details</th>
            <th className="py-2 px-4 text-right w-[80px]">Qty</th>
            <th className="py-2 px-4 text-right w-[100px]">Prod Qty</th>
            <th className="py-2 px-4 w-[120px]">Prod Status</th>
            <th className="py-2 px-4 w-[120px]">Delivery Status</th>
            <th className="py-2 px-4 w-[150px]">Job Card No</th>
            <th className="py-2 px-4 w-[300px]">Process Route</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
          {items.map((item, idx) => {
            const breakups = item.OrderStyleBreakup || [];
            const hasBreakups = breakups.length > 0;

            const matchingJobCard = jobCards.find(
              (jc) => (jc.styleItemId && jc.styleItemId === item.styleItemId) || jc.StyleItem?.name === item.StyleItem?.name,
            );

            const prodQty = matchingJobCard ? (matchingJobCard.runningQty || matchingJobCard.rollQty || matchingJobCard.orderQty || 0) : 0;
            
            let prodStatus = "Not Started";
            if (matchingJobCard && matchingJobCard.processRoute?.length > 0) {
              const routes = matchingJobCard.processRoute;
              const allCompleted = routes.every(pr => pr.status?.toLowerCase() === "completed");
              const anyStarted = routes.some(pr => pr.status && !["pending", "not_started"].includes(pr.status.toLowerCase()));
              
              if (allCompleted) {
                prodStatus = "Completed";
              } else if (anyStarted) {
                prodStatus = "Partially Completed";
              }
            }

            let deliveryStatus = "Not Started";
            const relatedDeliveries = salesDeliveries.flatMap(sd => sd.salesDeliveryItems || []).filter(sdi => (sdi.styleItemId && sdi.styleItemId === item.styleItemId) || sdi.StyleItem?.name === item.StyleItem?.name);
            const totalDelivered = relatedDeliveries.reduce((sum, d) => sum + (d.qty || 0), 0);
            
            if (totalDelivered >= (item.orderQty || 0) && (item.orderQty || 0) > 0) {
              deliveryStatus = "Delivered Fully";
            } else if (totalDelivered > 0) {
              deliveryStatus = "Partially Delivered";
            }

            return (
              <tr key={item.id || idx} className="hover:bg-gray-50">
                <td className="py-2 px-4 align-top text-black font-medium">
                  {item.StyleItem?.name || "—"}
                </td>
                <td className="py-2 px-4 align-top">
                  {hasBreakups ? (
                    <ul className="list-disc pl-4 text-xs text-black space-y-1">
                      {breakups.map((bk, bIdx) => (
                        <li key={bk.id || bIdx}>{bk.Style?.name || "—"}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-2 align-top">
                  {hasBreakups ? (
                    <ul className="list-disc pl-4 text-xs text-black space-y-1">
                      {breakups.map((bk, bIdx) => {
                        const sizes = bk.OrderSizeBreakup || [];
                        if (sizes.length === 0) return <li key={bIdx}>—</li>;
                        return (
                          <li key={bIdx}>
                            {sizes.map((sz, szIdx) => (
                              <React.Fragment key={szIdx}>
                                {sz.Size?.name || "Size"}:{" "}
                                <span className="font-semibold text-black">
                                  {sz.qty || 0}
                                </span>
                                {szIdx < sizes.length - 1 && ", "}
                              </React.Fragment>
                            ))}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 px-4 text-right align-top font-semibold text-gray-800">
                  {item.orderQty ?? 0}
                </td>
                <td className="py-2 px-4 text-right align-top text-gray-800">
                  {prodQty}
                </td>
                <td className="py-2 px-4 align-top">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${
                    prodStatus === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                    prodStatus === "Partially Completed" ? "bg-orange-50 text-orange-700 border-orange-200" :
                    "bg-gray-50 text-gray-600 border-gray-200"
                  }`}>
                    {prodStatus}
                  </span>
                </td>
                <td className="py-2 px-4 align-top">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${
                    deliveryStatus === "Delivered Fully" ? "bg-green-50 text-green-700 border-green-200" :
                    deliveryStatus === "Partially Delivered" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-gray-50 text-gray-600 border-gray-200"
                  }`}>
                    {deliveryStatus}
                  </span>
                </td>
                <td className="py-2 px-4 align-top text-black">
                  {matchingJobCard?.docId || "—"}
                </td>
                <td className="py-2 px-4 align-top">
                  {(() => {
                    const processRoutes = matchingJobCard?.processRoute || [];
                    return <ProcessRouteBadges processRoutes={processRoutes} />;
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SimpleDocTab({ title, docName, docs, showJobCard, showSaleOrder, showProcessRoute }) {
  if (docs.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No {title.toLowerCase()} found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-2">
      <table className="text-left border-collapse whitespace-nowrap">
        <thead>
          <tr className="bg-gray-50 text-xs font-medium text-gray-500 tracking-wider border-b uppercase">
            <th className="py-2 px-4 w-[100px]">{docName} No</th>
            <th className="py-2 px-4 w-[150px] text-left">{docName} Date</th>
            {showJobCard && (
              <th className="py-2 px-4 w-[150px] text-left">Job Card No</th>
            )}
            {showSaleOrder && (
              <th className="py-2 px-4 w-[150px] text-left">Sale Order No</th>
            )}
            <th className="py-2 px-4 w-[250px]">Item Name</th>
            {showProcessRoute && (
              <th className="py-2 px-4 w-[300px]">Process Route</th>
            )}
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
          {docs.map((doc, i) => {
            const itemName =
              doc.StyleItem?.name ||
              doc.SalesOrderItems?.map((i) => i.StyleItem?.name)
                .filter(Boolean)
                .join(", ") ||
              doc.PackingItems?.map((i) => i.StyleItem?.name)
                .filter(Boolean)
                .join(", ") ||
              doc.salesDeliveryItems
                ?.map((i) => i.StyleItem?.name)
                .filter(Boolean)
                .join(", ") ||
              "—";

            return (
              <tr key={i} className="hover:bg-gray-50 text-xs">
                <td className="py-2 px-4 align-top text-black">{doc.docId}</td>
                <td className="py-2 px-4 align-top text-black text-left">
                  {fmtDate(doc.docDate)}
                </td>
                {showJobCard && (
                  <td className="py-2 px-4 align-top text-black text-left">
                    {doc.JobCard?.docId || "—"}
                  </td>
                )}
                {showSaleOrder && (
                  <td className="py-2 px-4 align-top text-black text-left">
                    {doc.SaleOrderNo || "—"}
                  </td>
                )}
                <td className="py-2 px-4 align-top text-black font-medium">
                  {itemName}
                </td>
                {showProcessRoute && (
                  <td className="py-2 px-4 align-top">
                    <ProcessRouteBadges processRoutes={doc.processRoute || []} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProcessRouteBadges({ processRoutes }) {
  if (!processRoutes || processRoutes.length === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  return (
    <div className="flex flex-col gap-2">
      {processRoutes.map((pr, i) => (
        <div
          key={pr.id || i}
          className="flex items-center gap-2 border border-blue-400 rounded-lg px-2 py-1 text-[10px] w-max bg-white"
        >
          <span className="font-semibold text-gray-700">
            {pr.sequence}. {pr.Process?.name?.toUpperCase()}
          </span>
          {pr.Process?.isOutsideJob ? (
            <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200">
              → Outside
            </span>
          ) : (
            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
              ↓ Inside
            </span>
          )}
          <span
            className={`px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
              pr.status?.toLowerCase() === "completed"
                ? "text-green-600 bg-green-50 border-green-200"
                : "text-orange-600 bg-orange-50 border-orange-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                pr.status?.toLowerCase() === "completed"
                  ? "bg-green-500"
                  : "bg-orange-500"
              }`}
            ></span>
            {pr.status || "Pending"}
          </span>
          <span className="text-green-600 font-semibold px-1.5 py-0.5 rounded-full border border-green-200 bg-green-50">
            Qty: {pr.completedQty || 0}
          </span>
        </div>
      ))}
    </div>
  );
}

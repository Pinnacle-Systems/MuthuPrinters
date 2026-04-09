// ─────────────────────────────────────────────────────────────────────────────
//  ExpandedRowDetail.jsx
//  Fixed: cancel / return / inward qty now matched per item using
//         styleItemId + sizeId + colorId + uomId composite key
//         instead of item name string match (which caused qty bleed across items)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import { fmtDate, dueBadgeCls } from "../purchaseReportUtils";

const TABS = [
  { key: "po", label: (r) => `PO Items (${r.poItems?.length ?? 0})` },
  { key: "inward", label: (r) => `Inward (${r.inwardDocs?.length ?? 0})` },
  { key: "cancel", label: (r) => `Cancel (${r.cancelDocs?.length ?? 0})` },
  { key: "return", label: (r) => `Return (${r.returnDocs?.length ?? 0})` },
  { key: "bill", label: (r) => `Bill Entry (${r.billDocs?.length ?? 0})` },
];

export default function ExpandedRowDetail({ row }) {
  const [tab, setTab] = useState("po");

  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 text-xs">
      {/* meta row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 mb-3">
        {/* <span>
          Branch: <strong className="text-gray-700">{row.branch}</strong>
        </span> */}
        <span>
          Remarks:{" "}
          <strong className="text-gray-700">{row.remarks || "—"}</strong>
        </span>
        <span>
          Balance Qty:{" "}
          <strong
            className={
              row.balanceQty > 0
                ? "text-red-700 text-xs"
                : "text-green-700 text-xs"
            }
          >
            {row.balanceQty}
          </strong>
        </span>
        <span>
          Due:{" "}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full  text-xs ${dueBadgeCls(row.dueAlert)}`}
          >
            {row.dueStatus}
          </span>
        </span>
      </div>

      {/* tab bar */}
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

      {/* tab content */}
      <div>
        {tab === "po" && <POItemsTab row={row} />}
        {tab === "inward" && <InwardTab row={row} />}
        {tab === "cancel" && <CancelTab row={row} />}
        {tab === "return" && <ReturnTab row={row} />}
        {tab === "bill" && <BillTab row={row} />}
      </div>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// Build a composite match key from an item using IDs (most accurate)
// Falls back to name strings if IDs are not present
function itemKey(item) {
  const styleId = item.styleItemId ?? item.StyleItem?.id ?? "";
  const sizeId = item.sizeId ?? item.Size?.id ?? "";
  const colorId = item.colorId ?? item.Color?.id ?? "";
  const uomId = item.uomId ?? item.Uom?.id ?? "";
  return `${styleId}|${sizeId}|${colorId}|${uomId}`;
}

// Sum a qty field from child items that match the given PO item key
function sumMatchingQty(childItems, poItem, qtyField) {
  const key = itemKey(poItem);
  return childItems.reduce((sum, child) => {
    if (itemKey(child) === key) {
      return sum + (child[qtyField] || 0);
    }
    return sum;
  }, 0);
}

// Flatten all items from all docs into a single array
function flatItems(docs) {
  return (docs || []).flatMap((d) => d.items || []);
}

// ─── sub-table wrapper ────────────────────────────────────────────────────────
function SubTable({ headers, rows, empty }) {
  if (!rows || rows.length === 0) {
    return (
      <p className="text-xs text-gray-400 py-2">{empty || "No records"}</p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap border-b border-gray-200"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {cells.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 border-b border-gray-100 whitespace-nowrap"
                >
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinkedBadge({ poDocId, color = "green" }) {
  const cls = {
    green: "bg-green-50  text-green-700  border-green-200",
    red: "bg-red-50    text-red-700    border-red-200",
    amber: "bg-amber-50  text-amber-700  border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  }[color];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${cls}`}
    >
      Linked to {poDocId}
    </span>
  );
}

// ─── tab: PO Items ────────────────────────────────────────────────────────────
// KEY FIX: uses itemKey() composite match — not item name string comparison
// This ensures cancel/return/inward qty is shown only for the matching item
function POItemsTab({ row }) {
  const isDone = [
    "Fully Received",
    "Cancelled",
    "Closed (Inward + Cancelled)",
  ].includes(row.status);

  // flatten all child items once
  const allInwardItems = flatItems(row.inwardDocs);
  const allCancelItems = flatItems(row.cancelDocs);
  const allReturnItems = flatItems(row.returnDocs);

  const tableRows = (row.poItems || []).map((item) => {
    const qty = item.qty || 0;

    // ── match by composite key (styleItemId + sizeId + colorId + uomId) ──────
    const iq = sumMatchingQty(allInwardItems, item, "inwardQty");
    const cq = sumMatchingQty(allCancelItems, item, "cancelQty");
    const rq = sumMatchingQty(allReturnItems, item, "returnQty");
    const bal = Math.max(0, qty - iq - cq + rq);
    const pend = Math.max(0, qty - iq - cq);

    const itemName = item.StyleItem?.name || "—";
    const uomName = item.Uom?.name || "—";
    const colorName = item.Color?.name || "—";
    const sizeName = item.Size?.name || "—";
    const gsmName = item.Gsm?.name || "—";
    // const hsnName = item.Hsn?.name || "—";

    return [
      itemName,
      uomName,
      qty,
      iq,
      // cancel qty — only shown if > 0 for this specific item
      cq > 0 ? (
        <span className="font-semibold text-red-600">{cq}</span>
      ) : (
        <span className="text-gray-400">0</span>
      ),
      rq > 0 ? (
        <span className="font-semibold text-amber-600">{rq}</span>
      ) : (
        <span className="text-gray-400">0</span>
      ),
      // balance qty coloured by due alert
      <span
        className={`font-semibold ${bal > 0 ? (row.dueAlert === "overdue" ? "text-red-700" : "text-green-700") : "text-gray-400"}`}
      >
        {bal}
      </span>,
      // pending to inward — only show if not fully done
      !isDone && pend > 0 ? (
        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full text-[10px] font-medium">
          {pend} pending
        </span>
      ) : (
        <span className="text-gray-400">0</span>
      ),
      `₹${item.price ?? 0}`,
      colorName,
      sizeName,
      gsmName,
      // hsnName,
    ];
  });

  return (
    <SubTable
      headers={[
        "Item",
        "UOM",
        "PO Qty",
        "Inward Qty",
        "Cancel Qty",
        "Return Qty",
        "Balance Qty",
        "Pending to Inward",
        "Price",
        "Color",
        "Size",
        "GSM",
        // "HSN",
      ]}
      rows={tableRows}
      empty="No PO items"
    />
  );
}

// ─── tab: Inward ──────────────────────────────────────────────────────────────
function InwardTab({ row }) {
  if (!row.inwardDocs?.length) {
    return (
      <p className="text-xs text-gray-400 py-2">
        No inward records for this PO
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {row.inwardDocs.map((doc, di) => (
        <div key={di}>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
            <span>
              Doc:{" "}
              <strong className="text-gray-700 text-[12px]">{doc.docId}</strong>
            </span>
            <span>
              Date:{" "}
              <strong className="text-gray-700">{fmtDate(doc.docDate)}</strong>
            </span>
            <span>
              Type: <strong className="text-gray-700">{doc.inwardType}</strong>
            </span>
            {doc.store && (
              <span>
                Location: <strong className="text-gray-700">{doc.store}</strong>
              </span>
            )}
            {doc.dcNo && (
              <span>
                DC No: <strong className="text-gray-700">{doc.dcNo}</strong>
              </span>
            )}
            {doc.invNo && (
              <span>
                Inv No: <strong className="text-gray-700">{doc.invNo}</strong>
              </span>
            )}
            <LinkedBadge poDocId={row.docId} color="green" />
          </div>
          <SubTable
            headers={[
              "Item",
              "UOM",
              "PO Qty",
              "Inward Qty",
              "Price",
              "Color",
              "Size",
              "Batch No",
              "Inv No",
            ]}
            rows={(doc.items || []).map((item) => [
              item.StyleItem?.name || "—",
              item.Uom?.name || "—",
              item.poQty,
              item.inwardQty,
              `₹${item.price ?? 0}`,
              item.Color?.name || "—",
              item.Size?.name || "—",
              item.batchNo || "—",
              item.invNo || "—",
            ])}
          />
        </div>
      ))}
    </div>
  );
}

// ─── tab: Cancel ──────────────────────────────────────────────────────────────
function CancelTab({ row }) {
  if (!row.cancelDocs?.length) {
    return (
      <p className="text-xs text-gray-400 py-2">
        No cancel records for this PO
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {row.cancelDocs.map((doc, di) => (
        <div key={di}>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
            <span>
              Doc: <strong className="text-gray-700">{doc.docId}</strong>
            </span>
            <span>
              Date:{" "}
              <strong className="text-gray-700">{fmtDate(doc.docDate)}</strong>
            </span>
            {doc.poType && (
              <span>
                Type:{" "}
                <strong className="text-gray-600 text-xs">{doc.poType}</strong>
              </span>
            )}
            <LinkedBadge poDocId={row.docId} color="red" />
          </div>
          <SubTable
            headers={[
              "Item",
              "UOM",
              "Cancel Qty",
              "Color",
              "Size",
              "Ref PO",
              "Batch No",
              "Inv No",
            ]}
            rows={(doc.items || []).map((item) => [
              item.StyleItem?.name || "—",
              item.Uom?.name || "—",
              <span className="font-semibold text-red-600">
                {item.cancelQty}
              </span>,
              item.Color?.name || "—",
              item.Size?.name || "—",
              item.poDocId || row.docId,
              item.batchNo || "—",
              item.invNo || "—",
            ])}
          />
        </div>
      ))}
    </div>
  );
}

// ─── tab: Return ──────────────────────────────────────────────────────────────
function ReturnTab({ row }) {
  if (!row.returnDocs?.length) {
    return (
      <p className="text-xs text-gray-400 py-2">
        No return records for this PO
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {row.returnDocs.map((doc, di) => (
        <div key={di}>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
            <span>
              Doc: <strong className="text-gray-700">{doc.docId}</strong>
            </span>
            <span>
              Date:{" "}
              <strong className="text-gray-700">{fmtDate(doc.docDate)}</strong>
            </span>
            {doc.returnType && (
              <span>
                Type:{" "}
                <strong className="text-gray-700">{doc.returnType}</strong>
              </span>
            )}
            <LinkedBadge poDocId={row.docId} color="amber" />
          </div>
          <SubTable
            headers={[
              "Item",
              "UOM",
              "Return Qty",
              "Color",
              "Size",
              "Inward Doc",
              "Batch No",
              "Inv No",
            ]}
            rows={(doc.items || []).map((item) => [
              item.StyleItem?.name || "—",
              item.Uom?.name || "—",
              <span className="font-semibold text-amber-600">
                {item.returnQty}
              </span>,
              item.Color?.name || "—",
              item.Size?.name || "—",
              item.PurchaseInward?.docId || "—",
              item.batchNo || "—",
              item.invNo || "—",
            ])}
          />
        </div>
      ))}
    </div>
  );
}

// ─── tab: Bill Entry ──────────────────────────────────────────────────────────
function BillTab({ row }) {
  if (!row.billDocs?.length) {
    return (
      <p className="text-xs text-gray-400 py-2">
        No bill entry records for this PO
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {row.billDocs.map((doc, di) => (
        <div key={di}>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
            <span>
              Doc: <strong className="text-gray-700">{doc.docId}</strong>
            </span>
            <span>
              Date:{" "}
              <strong className="text-gray-700">{fmtDate(doc.docDate)}</strong>
            </span>
            <span>
              Net Bill:{" "}
              <strong className="text-gray-700">
                ₹{doc.netBillValue?.toLocaleString()}
              </strong>
            </span>
            {doc.billType && (
              <span>
                Type: <strong className="text-gray-700">{doc.billType}</strong>
              </span>
            )}
            <LinkedBadge poDocId={row.docId} color="purple" />
          </div>
          <SubTable
            headers={[
              "Item",
              "UOM",
              "Billed Qty",
              "Price",
              "Tax %",
              "Discount",
              "Color",
              "Size",
              "Inv No",
              "DC No",
              "Inward Doc",
            ]}
            rows={(doc.items || []).map((item) => [
              item.StyleItem?.name || "—",
              item.Uom?.name || "—",
              item.inwardQty,
              `₹${item.price ?? 0}`,
              item.taxPercent ?? "—",
              item.discountValue
                ? `${item.discountValue}${item.discountType === "%" ? "%" : ""}`
                : "—",
              item.Color?.name || "—",
              item.Size?.name || "—",
              item.invNo || "—",
              item.dcNo || "—",
              item.PurchaseInward?.docId || "—",
            ])}
          />
        </div>
      ))}
    </div>
  );
}

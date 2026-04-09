// ─────────────────────────────────────────────────────────────────────────────
//  purchaseReportUtils.js
//  Pure helpers used by the report component.
//
//  IMPORTANT: computePORow trusts the backend for billedQty.
//  The backend already handles the "Against Invoice" receiptType logic.
//  The frontend must NOT recalculate billedQty from raw docs —
//  it doesn't have access to PurchaseInward.receiptType on the frontend.
// ─────────────────────────────────────────────────────────────────────────────

export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(d) {
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}

export function getPOStatus({ poQty = 0, inwardQty = 0, cancelQty = 0 }) {
  const processed = inwardQty + cancelQty;
  if (inwardQty === 0 && cancelQty === 0) return "Pending";
  if (cancelQty >= poQty) return "Cancelled";
  if (inwardQty >= poQty) return "Fully Received";
  if (processed >= poQty) return "Closed (Inward + Cancelled)";
  if (inwardQty > 0 && cancelQty > 0) return "Partially Received & Cancelled";
  if (inwardQty > 0) return "Partially Received";
  if (cancelQty > 0) return "Partially Cancelled";
  return "Pending";
}

export function getDueInfo(dueDate, status) {
  const done = ["Fully Received", "Cancelled", "Closed (Inward + Cancelled)"];
  if (done.includes(status))
    return { dueAlert: "done", dueStatus: "Completed", days: null };

  const days = daysUntil(dueDate);
  if (days === null) return { dueAlert: "ok", dueStatus: "—", days: null };
  if (days < 0)
    return {
      dueAlert: "overdue",
      dueStatus: `${Math.abs(days)}d Overdue`,
      days,
    };
  if (days === 0) return { dueAlert: "soon", dueStatus: "Due Today", days };
  if (days <= 3)
    return { dueAlert: "soon", dueStatus: `${days}d Remaining`, days };
  return { dueAlert: "ok", dueStatus: `${days}d Remaining`, days };
}

// ─────────────────────────────────────────────────────────────────────────────
//  computePORow
//
//  The backend already computes and returns:
//    poQty, inwardQty, cancelQty, returnQty, billedQty,
//    balanceQty, pendingInward, status, dueAlert, dueStatus
//
//  This function ONLY adds/refreshes:
//    - dueAlert / dueStatus / days  (recalculated from today's date)
//    - status                       (recalculated from qty fields)
//
//  It does NOT recalculate billedQty — that requires PurchaseInward.receiptType
//  which is only available on the backend.
// ─────────────────────────────────────────────────────────────────────────────
export function computePORow(r) {
  // Use backend-provided qty values — do NOT recalculate from raw docs
  const poQty = r.poQty ?? 0;
  const inwardQty = r.inwardQty ?? 0;
  const cancelQty = r.cancelQty ?? 0;
  const returnQty = r.returnQty ?? 0;
  const billedQty = r.billedQty ?? 0; // ✅ trust backend — includes Against Invoice logic
  const balanceQty =
    r.balanceQty ?? Math.max(0, poQty - inwardQty - cancelQty + returnQty);
  const pendingInward =
    r.pendingInward ?? Math.max(0, poQty - inwardQty - cancelQty);

  // Recalculate status from qty fields (cheap, no DB needed)
  const status = getPOStatus({ poQty, inwardQty, cancelQty });

  // Recalculate due info from today's date (date changes daily)
  const dueInfo = getDueInfo(r.dueDate, status);

  return {
    ...r, // spread all backend fields first (includes billedQty)
    poQty,
    inwardQty,
    cancelQty,
    returnQty,
    billedQty, // ✅ from backend — NOT recalculated
    balanceQty,
    pendingInward,
    status,
    ...dueInfo, // overwrite dueAlert/dueStatus/days with fresh calculation
  };
}

// Badge CSS class for PO status
export function statusBadgeCls(status) {
  if (status === "Pending")
    return "bg-amber-50 text-amber-800 border border-amber-200";
  if (status.includes("Fully Received"))
    return "bg-green-50 text-green-800 border border-green-200";
  if (status.includes("Partial"))
    return "bg-blue-50 text-blue-800 border border-blue-200";
  if (status.includes("Cancel"))
    return "bg-red-50 text-red-800 border border-red-200";
  return "bg-purple-50 text-purple-800 border border-purple-200";
}

// Badge CSS class for due status
export function dueBadgeCls(dueAlert) {
  if (dueAlert === "done") return "bg-gray-100 text-gray-500";
  if (dueAlert === "overdue")
    return "bg-red-50 text-red-800 border border-red-300";
  if (dueAlert === "soon")
    return "bg-amber-50 text-amber-800 border border-amber-300";
  return "bg-green-50 text-green-800 border border-green-200";
}

// Build groups for the grouping bar feature
export function buildGroups(data, keys, dirs, depth = 0) {
  if (!keys.length) return data;
  const [k, ...rest] = keys;
  const map = new Map();
  data.forEach((r) => {
    const v = String(r[k] ?? "");
    if (!map.has(v)) map.set(v, []);
    map.get(v).push(r);
  });
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]) * (dirs[k] || 1))
    .map(([val, rows]) => ({
      _group: true,
      _key: k,
      _val: val,
      _depth: depth,
      _count: rows.length,
      _children: buildGroups(rows, rest, dirs, depth + 1),
    }));
}

export const COLUMNS = [
  { key: "docId", label: "PO No", w: "w-28" },
  { key: "docDate", label: "PO Date", w: "w-24" },
  { key: "dueDate", label: "Due Date", w: "w-24" },
  { key: "dueStatus", label: "Due Status", w: "w-32" },
  { key: "supplier", label: "Supplier", w: "w-36" },
  { key: "poType", label: "PO Type", w: "w-24" },
  { key: "inwardType", label: "Inward Type", w: "w-44" },
  // { key: "branch", label: "Branch", w: "w-24" },
  { key: "poQty", label: "PO Qty", w: "w-20" },
  { key: "inwardQty", label: "Inward Qty", w: "w-32" },
  { key: "cancelQty", label: "Cancel Qty", w: "w-24" },
  { key: "returnQty", label: "Return Qty", w: "w-24" },
  { key: "billedQty", label: "Billed Qty", w: "w-22" },
  { key: "balanceQty", label: "Balance Qty", w: "w-26" },
  { key: "pendingInward", label: "To Inward", w: "w-26" },
  { key: "status", label: "PO Status", w: "w-52" },
];

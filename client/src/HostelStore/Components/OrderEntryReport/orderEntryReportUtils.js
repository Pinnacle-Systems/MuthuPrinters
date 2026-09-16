export function fmtDate(d) {
  if (!d) return "—";
  let str = d;
  if (typeof d !== "string") {
    try {
      str = new Date(d).toISOString();
    } catch (e) {
      return "—";
    }
  }
  const dateOnly = str.substring(0, 10);
  const [yyyy, mm, dd] = dateOnly.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

export function daysUntil(d) {
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}

export function getDeliveryInfo(dueDate) {
  const days = daysUntil(dueDate);
  if (days === null)
    return { deliveryAlert: "ok", deliveryStatus: "—", days: null };
  if (days < 0)
    return {
      deliveryAlert: "overdue",
      deliveryStatus: `${Math.abs(days)}d Overdue`,
      days,
    };
  if (days === 0)
    return { deliveryAlert: "soon", deliveryStatus: "Due Today", days };
  if (days <= 3)
    return {
      deliveryAlert: "soon",
      deliveryStatus: `${days}d Remaining`,
      days,
    };
  return { deliveryAlert: "ok", deliveryStatus: `${days}d Remaining`, days };
}

export function deliveryBadgeCls(alert) {
  if (alert === "done") return "bg-gray-100 text-gray-500";
  if (alert === "overdue")
    return "bg-red-50 text-red-800 border border-red-300";
  if (alert === "soon")
    return "bg-amber-50 text-amber-800 border border-amber-300";
  return "bg-green-50 text-green-800 border border-green-200";
}

export function computeOrderEntryRow(r) {
  // Join docIds and docDates for related arrays
  const jobCardIds =
    r.JobCard?.map((j) => j.docId)
      .filter(Boolean)
      .join(", ") || "—";
  const jobCardDates =
    r.JobCard?.map((j) => fmtDate(j.docDate))
      .filter((d) => d !== "—")
      .join(", ") || "—";

  const saleOrderIds =
    r.SalesOrder?.map((s) => s.docId)
      .filter(Boolean)
      .join(", ") || "—";
  const saleOrderDates =
    r.SalesOrder?.map((s) => fmtDate(s.docDate))
      .filter((d) => d !== "—")
      .join(", ") || "—";

  const packingIds =
    r.Packing?.map((p) => p.docId)
      .filter(Boolean)
      .join(", ") || "—";
  const packingDates =
    r.Packing?.map((p) => fmtDate(p.docDate))
      .filter((d) => d !== "—")
      .join(", ") || "—";

  const allSalesDeliveries =
    r.SalesOrder?.flatMap((so) => so.SalesDelivery || []) || [];
  const salesDeliveryIds =
    allSalesDeliveries
      .map((s) => s.docId)
      .filter(Boolean)
      .join(", ") || "—";
  const salesDeliveryDates =
    allSalesDeliveries
      .map((s) => fmtDate(s.docDate))
      .filter((d) => d !== "—")
      .join(", ") || "—";

  const totalOrderQty =
    r.orderItems?.reduce((sum, item) => sum + (item.orderQty || 0), 0) || 0;

  const { deliveryAlert, deliveryStatus, days } = getDeliveryInfo(
    r.deliveryDate,
  );

  return {
    ...r,
    orderQty: totalOrderQty,
    deliveryAlert,
    deliveryStatus,
    days,
    customerName: r.customer?.name || "—",
    branchName: r.Branch?.name || "—",
    jobCardIds,
    jobCardDates,
    saleOrderIds,
    saleOrderDates,
    packingIds,
    packingDates,
    salesDeliveryIds,
    salesDeliveryDates,
  };
}

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
  { key: "docId", label: "Order No", w: "160px" },
  { key: "docDate", label: "Order Date", w: "130px" },
  { key: "deliveryDate", label: "Delivery Date", w: "130px" },
  { key: "deliveryStatus", label: "Delivery Status", w: "150px" },
  { key: "customerName", label: "Customer", w: "320px" },
  { key: "orderType", label: "Order Type", w: "130px" },
  { key: "productionType", label: "Production Type", w: "150px" },
  { key: "orderQty", label: "Order Qty", w: "120px" },
];

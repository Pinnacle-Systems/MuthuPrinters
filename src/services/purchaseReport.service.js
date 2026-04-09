// ─────────────────────────────────────────────────────────────────────────────
//  purchaseReport.service.js
//  Fetches PO + all linked child records in one query,
//  computes status, balance qty, due alert for the report.
// ─────────────────────────────────────────────────────────────────────────────
import { prisma } from "../lib/prisma.js";

function isAgainstInvoice(receiptType) {
  if (!receiptType) return false;
  return receiptType.trim().toLowerCase() === "against invoice";
}

function getPOStatus({
  poItems = [],
  inwardItems = [],
  purchaseCancelItems = [],
}) {
  const totalPoQty = poItems.reduce((s, i) => s + (i.qty || 0), 0);
  const totalInwardQty = inwardItems.reduce(
    (s, i) => s + (i.inwardQty || 0),
    0,
  );
  const totalCancelQty = purchaseCancelItems.reduce(
    (s, i) => s + (i.cancelQty || 0),
    0,
  );
  const totalProcessed = totalInwardQty + totalCancelQty;

  if (totalInwardQty === 0 && totalCancelQty === 0) return "Pending";
  if (totalCancelQty >= totalPoQty) return "Cancelled";
  if (totalInwardQty >= totalPoQty) return "Fully Received";
  if (totalProcessed >= totalPoQty) return "Closed (Inward + Cancelled)";
  if (totalInwardQty > 0 && totalCancelQty > 0)
    return "Partially Received & Cancelled";
  if (totalInwardQty > 0) return "Partially Received";
  if (totalCancelQty > 0) return "Partially Cancelled";
  return "Pending";
}

function getDueAlert(dueDate, status) {
  const doneStatuses = [
    "Fully Received",
    "Cancelled",
    "Closed (Inward + Cancelled)",
  ];
  if (doneStatuses.includes(status)) {
    return { dueAlert: "done", dueStatus: "Completed", days: null };
  }
  if (!dueDate) return { dueAlert: "ok", dueStatus: "—", days: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.ceil((due - today) / 86400000);

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

function groupByDoc(items, docKeyFn, docDataFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = docKeyFn(item);
    const data = docDataFn(item);
    if (!key) return;
    if (!map.has(key)) map.set(key, { ...data, items: [] });
    map.get(key).items.push(item);
  });
  return [...map.values()];
}

// ─── main service ─────────────────────────────────────────────────────────────

async function getPurchaseReport({
  branchId,
  finYearId,
  startDate,
  endDate,
  supplierId,
  poType,
}) {
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      },
    };
  }

  // ── STEP 1: fetch POs ──────────────────────────────────────────────────────
  const pos = await prisma.po.findMany({
    where: {
      ...(branchId && { branchId: parseInt(branchId) }),
      ...(supplierId && { supplierId: parseInt(supplierId) }),
      ...(poType && { poType: { contains: poType } }),
      ...dateFilter,
    },
    include: {
      Supplier: { select: { id: true, name: true, aliasName: true } },
      Branch: { select: { id: true, branchName: true } },
      poItems: {
        select: {
          id: true,
          qty: true,
          price: true,
          discountType: true,
          discountValue: true,
          taxPercent: true,
          styleItemId: true,
          sizeId: true,
          colorId: true,
          uomId: true,
          StyleItem: { select: { id: true, name: true } },
          Uom: { select: { id: true, name: true } },
          Hsn: { select: { id: true, name: true, tax: true } },
          Itemgroup: { select: { id: true, name: true } },
          Size: { select: { id: true, name: true } },
          Color: { select: { id: true, name: true } },
          Gsm: { select: { id: true, name: true } },
        },
      },
      // InwardItems — we need purchaseInwardId to join PurchaseInward
      inwardItems: {
        select: {
          id: true,
          inwardQty: true,
          poQty: true,
          price: true,
          batchNo: true,
          invNo: true,
          dcNo: true,
          inwardType: true,
          discountType: true,
          discountValue: true,
          taxPercent: true,
          styleItemId: true,
          sizeId: true,
          colorId: true,
          uomId: true,
          purchaseInwardId: true, // ✅ foreign key — used for map lookup below
          StyleItem: { select: { id: true, name: true } },
          Uom: { select: { id: true, name: true } },
          Hsn: { select: { id: true, name: true, tax: true } },
          Itemgroup: { select: { id: true, name: true } },
          Size: { select: { id: true, name: true } },
          Color: { select: { id: true, name: true } },
          Gsm: { select: { id: true, name: true } },
        },
      },
      purchaseCancelItems: {
        select: {
          id: true,
          cancelQty: true,
          poType: true,
          batchNo: true,
          invNo: true,
          poDocId: true,
          styleItemId: true,
          sizeId: true,
          colorId: true,
          uomId: true,
          StyleItem: { select: { id: true, name: true } },
          Uom: { select: { id: true, name: true } },
          Hsn: { select: { id: true, name: true, tax: true } },
          Itemgroup: { select: { id: true, name: true } },
          Size: { select: { id: true, name: true } },
          Color: { select: { id: true, name: true } },
          Gsm: { select: { id: true, name: true } },
          PurchaseCancel: {
            select: {
              id: true,
              docId: true,
              docDate: true,
              remarks: true,
              poType: true,
            },
          },
        },
      },
      purchaseReturnItems: {
        select: {
          id: true,
          returnQty: true,
          poQty: true,
          returnType: true,
          batchNo: true,
          invNo: true,
          styleItemId: true,
          sizeId: true,
          colorId: true,
          uomId: true,
          StyleItem: { select: { id: true, name: true } },
          Uom: { select: { id: true, name: true } },
          Hsn: { select: { id: true, name: true, tax: true } },
          Itemgroup: { select: { id: true, name: true } },
          Size: { select: { id: true, name: true } },
          Color: { select: { id: true, name: true } },
          Gsm: { select: { id: true, name: true } },
          PurchaseInwardReturn: {
            select: {
              id: true,
              docId: true,
              docDate: true,
              returnType: true,
              remarks: true,
            },
          },
          PurchaseInward: { select: { id: true, docId: true } },
        },
      },
      purchaseBillEntryItems: {
        select: {
          id: true,
          inwardQty: true,
          price: true,
          invNo: true,
          dcNo: true,
          docId: true,
          docDate: true,
          taxPercent: true,
          discountType: true,
          discountValue: true,
          styleItemId: true,
          sizeId: true,
          colorId: true,
          uomId: true,
          purchaseInwardId: true, // ✅ foreign key — used for map lookup below
          StyleItem: { select: { id: true, name: true } },
          Uom: { select: { id: true, name: true } },
          Hsn: { select: { id: true, name: true, tax: true } },
          Itemgroup: { select: { id: true, name: true } },
          Size: { select: { id: true, name: true } },
          Color: { select: { id: true, name: true } },
          Gsm: { select: { id: true, name: true } },
          PurchaseBillEntry: {
            select: {
              id: true,
              docId: true,
              docDate: true,
              netBillValue: true,
              billType: true,
              remarks: true,
            },
          },
        },
      },
    },
    orderBy: { docId: "desc" },
  });

  // ── STEP 2: collect all unique purchaseInwardIds across all POs ────────────
  const allPurchaseInwardIds = new Set();
  pos.forEach((po) => {
    po.inwardItems.forEach((i) => {
      if (i.purchaseInwardId) allPurchaseInwardIds.add(i.purchaseInwardId);
    });
    po.purchaseBillEntryItems.forEach((i) => {
      if (i.purchaseInwardId) allPurchaseInwardIds.add(i.purchaseInwardId);
    });
  });

  // ── STEP 3: fetch PurchaseInward records directly — guaranteed receiptType ─
  // This is the ONLY reliable source for receiptType.
  // We query PurchaseInward directly instead of relying on nested Prisma joins
  // which can silently return null if the relation is not perfectly set up.
  const purchaseInwardMap = new Map(); // id → PurchaseInward
  if (allPurchaseInwardIds.size > 0) {
    const purchaseInwards = await prisma.purchaseInward.findMany({
      where: {
        id: { in: [...allPurchaseInwardIds] },
      },
      select: {
        id: true,
        docId: true,
        docDate: true,
        inwardType: true,
        receiptType: true, // ✅ the critical field
        vehicleNo: true,
        dcNo: true,
        invNo: true,
        Store: { select: { id: true, storeName: true } },
        supplier: { select: { id: true, name: true, aliasName: true } },
      },
    });

    // Log receiptType values in dev so you can verify exact DB string
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[purchaseReport] PurchaseInward receiptTypes:",
        purchaseInwards.map((p) => ({
          id: p.id,
          docId: p.docId,
          receiptType: p.receiptType,
        })),
      );
    }

    purchaseInwards.forEach((pi) => purchaseInwardMap.set(pi.id, pi));
  }

  // ── STEP 4: compute derived fields per PO ─────────────────────────────────
  const result = pos.map((po) => {
    const poQty = po.poItems.reduce((s, i) => s + (i.qty || 0), 0);
    const inwardQty = po.inwardItems.reduce(
      (s, i) => s + (i.inwardQty || 0),
      0,
    );
    const cancelQty = po.purchaseCancelItems.reduce(
      (s, i) => s + (i.cancelQty || 0),
      0,
    );
    const returnQty = po.purchaseReturnItems.reduce(
      (s, i) => s + (i.returnQty || 0),
      0,
    );

    // ── billedQty ──────────────────────────────────────────────────────────
    //
    // Flow B — Against Invoice:
    //   PurchaseInward.receiptType = "Against Invoice"
    //   → inwardItems.inwardQty for those inwards counts as billedQty
    //   → no separate PurchaseBillEntry is created for these
    //
    const againstInvoiceQty = po.inwardItems.reduce((s, i) => {
      const pi = purchaseInwardMap.get(i.purchaseInwardId);
      const receiptType = pi?.receiptType;
      return isAgainstInvoice(receiptType) ? s + (i.inwardQty || 0) : s;
    }, 0);

    // Flow A — Delivery (normal bill entry):
    //   PurchaseBillEntryItems linked to a Delivery inward
    //   (exclude any bill entries linked to Against Invoice inwards
    //    to avoid double counting if such records exist)
    //
    const billEntryQty = po.purchaseBillEntryItems.reduce((s, i) => {
      const pi = purchaseInwardMap.get(i.purchaseInwardId);
      const receiptType = pi?.receiptType;
      return !isAgainstInvoice(receiptType) ? s + (i.inwardQty || 0) : s;
    }, 0);

    // ✅ Total billedQty = Delivery bill entries + Against Invoice inwards
    const billedQty = billEntryQty + againstInvoiceQty;

    const balanceQty = Math.max(0, poQty - inwardQty - cancelQty + returnQty);
    const pendingInward = Math.max(0, poQty - inwardQty - cancelQty);

    const status = getPOStatus(po);
    const dueInfo = getDueAlert(po.dueDate, status);

    // ── inwardType: from PurchaseInward via map ────────────────────────────
    const inwardTypeSet = new Set(
      po.inwardItems
        .map((i) => purchaseInwardMap.get(i.purchaseInwardId)?.inwardType)
        .filter(Boolean),
    );
    const inwardType =
      inwardTypeSet.size > 0 ? [...inwardTypeSet].join(", ") : "—";

    // ── group inward items by PurchaseInward document ──────────────────────
    const inwardDocs = groupByDoc(
      po.inwardItems,
      (i) => i.purchaseInwardId,
      (i) => {
        const pi = purchaseInwardMap.get(i.purchaseInwardId);
        return {
          id: pi?.id,
          docId: pi?.docId,
          docDate: pi?.docDate,
          inwardType: pi?.inwardType,
          receiptType: pi?.receiptType,
          dcNo: pi?.dcNo,
          invNo: pi?.invNo,
          vehicleNo: pi?.vehicleNo,
          store: pi?.Store?.storeName,
          supplier: pi?.supplier?.name || pi?.supplier?.aliasName,
        };
      },
    );

    const cancelDocs = groupByDoc(
      po.purchaseCancelItems,
      (i) => i.PurchaseCancel?.id,
      (i) => ({
        id: i.PurchaseCancel?.id,
        docId: i.PurchaseCancel?.docId,
        docDate: i.PurchaseCancel?.docDate,
        poType: i.PurchaseCancel?.poType,
        remarks: i.PurchaseCancel?.remarks,
      }),
    );

    const returnDocs = groupByDoc(
      po.purchaseReturnItems,
      (i) => i.PurchaseInwardReturn?.id,
      (i) => ({
        id: i.PurchaseInwardReturn?.id,
        docId: i.PurchaseInwardReturn?.docId,
        docDate: i.PurchaseInwardReturn?.docDate,
        returnType: i.PurchaseInwardReturn?.returnType,
        remarks: i.PurchaseInwardReturn?.remarks,
      }),
    );

    const billDocs = groupByDoc(
      po.purchaseBillEntryItems,
      (i) => i.PurchaseBillEntry?.id,
      (i) => ({
        id: i.PurchaseBillEntry?.id,
        docId: i.PurchaseBillEntry?.docId,
        docDate: i.PurchaseBillEntry?.docDate,
        netBillValue: i.PurchaseBillEntry?.netBillValue,
        billType: i.PurchaseBillEntry?.billType,
        remarks: i.PurchaseBillEntry?.remarks,
      }),
    );

    return {
      id: po.id,
      docId: po.docId,
      docDate: po.docDate,
      dueDate: po.dueDate,
      supplier: po.Supplier?.name || po.Supplier?.aliasName || "—",
      supplierId: po.supplierId,
      poType: po.poType || "—",
      inwardType,
      branch: po.Branch?.branchName || "—",
      branchId: po.branchId,
      remarks: po.remarks || "",
      poQty,
      inwardQty,
      cancelQty,
      returnQty,
      billedQty,
      balanceQty,
      pendingInward,
      status,
      ...dueInfo,
      poItems: po.poItems,
      inwardDocs,
      cancelDocs,
      returnDocs,
      billDocs,
    };
  });

  return { statusCode: 0, data: result, totalCount: result.length };
}

export { getPurchaseReport };

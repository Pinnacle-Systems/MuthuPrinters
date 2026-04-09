// ─────────────────────────────────────────────────────────────────────────────
//  PurchaseReport.jsx  — Main report page
//
//  Features:
//   • RTK Query data fetch with loading/error states
//   • Drag-column-to-group-bar (multi-level grouping)
//   • Per-column filter menu (sort A/Z, search, checkbox list)
//   • Column header drag-to-reorder
//   • Alternating white/grey rows (colour only in field badges)
//   • Balance Qty + Due Status as separate columns
//   • Overdue / Due Soon badges per row
//   • Expand row → 5 tabs (PO Items, Inward, Cancel, Return, Bill Entry)
//   • Active filter chips above table
//   • Summary metric cards
//   • CSV export
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useGetPurchaseReportQuery } from "../../../../redux/services/purchaseReportApi";
import ColumnFilterMenu from "./components/ColumnFilterMenu";
import ExpandedRowDetail from "./components/ExpandedRowDetail";
import {
  COLUMNS,
  buildGroups,
  computePORow,
  dueBadgeCls,
  fmtDate,
  statusBadgeCls,
} from "./purchaseReportUtils";

// ─────────────────────────────────────────────────────────────────────────────
export default function PurchaseReport() {
  // ── query params (wire up your branch/finYear selectors here) ─────────────
  const [queryParams, setQueryParams] = useState({ branchId: undefined });

  const {
    data: apiData,
    isLoading,
    isFetching,
    isError,
  } = useGetPurchaseReportQuery(queryParams);

  // compute derived fields on the raw API data
  const allData = useMemo(
    () => (apiData?.data || []).map(computePORow),
    [apiData],
  );

  // ── column order ──────────────────────────────────────────────────────────
  const [colOrder, setColOrder] = useState(() => COLUMNS.map((c) => c.key));

  // ── grouping ──────────────────────────────────────────────────────────────
  const [groupKeys, setGroupKeys] = useState([]);
  const [groupDirs, setGroupDirs] = useState({});
  const [collapsed, setCollapsed] = useState({});

  // ── per-column filters ────────────────────────────────────────────────────
  const [colFilters, setColFilters] = useState({}); // { colKey: Set<string> }
  const [openMenuCol, setOpenMenuCol] = useState(null);

  // ── sort ──────────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  // ── row expand ────────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState({});

  // ── drag refs ─────────────────────────────────────────────────────────────
  const dragColRef = useRef(null);
  const dragGbOver = useRef(false);

  // ── unique values per column (for filter menu) ───────────────────────────
  const uniqueVals = useMemo(() => {
    const map = {};
    COLUMNS.forEach(({ key }) => {
      map[key] = [...new Set(allData.map((r) => String(r[key] ?? "")))].sort();
    });
    return map;
  }, [allData]);

  // ── filtered data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allData.filter((r) => {
      for (const [k, allowed] of Object.entries(colFilters)) {
        if (allowed && !allowed.has(String(r[k] ?? ""))) return false;
      }
      return true;
    });
  }, [allData, colFilters]);

  // ── sorted + grouped data ─────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey],
        bv = b[sortKey];
      return (
        (typeof av === "string"
          ? av.localeCompare(bv)
          : (av || 0) - (bv || 0)) * sortDir
      );
    });
  }, [filtered, sortKey, sortDir]);

  const tree = useMemo(
    () =>
      groupKeys.length ? buildGroups(sorted, groupKeys, groupDirs) : sorted,
    [sorted, groupKeys, groupDirs],
  );

  // ── summary metrics ───────────────────────────────────────────────────────
  const metrics = useMemo(
    () => ({
      total: filtered.length,
      overdue: filtered.filter((r) => r.dueAlert === "overdue").length,
      soon: filtered.filter((r) => r.dueAlert === "soon").length,
      fullR: filtered.filter((r) => r.status === "Fully Received").length,
      totalBal: filtered.reduce((s, r) => s + r.balanceQty, 0),
    }),
    [filtered],
  );

  // ── visible columns (grouped cols hidden from main table) ─────────────────
  const visibleCols = useMemo(
    () =>
      colOrder
        .filter((k) => !groupKeys.includes(k))
        .map((k) => COLUMNS.find((c) => c.key === k))
        .filter(Boolean),
    [colOrder, groupKeys],
  );

  // ─── handlers ─────────────────────────────────────────────────────────────

  function handleSort(k, dir) {
    setSortKey(k);
    setSortDir(dir);
  }

  function handleFilterApply(k, valSet) {
    setColFilters((prev) => {
      const next = { ...prev };
      if (!valSet) delete next[k];
      else next[k] = valSet;
      return next;
    });
    setOpenMenuCol(null);
  }

  function removeFilterChip(k) {
    setColFilters((prev) => {
      const n = { ...prev };
      delete n[k];
      return n;
    });
  }

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleGroup(gid) {
    setCollapsed((prev) => ({ ...prev, [gid]: !prev[gid] }));
  }

  function removeGroupKey(k) {
    setGroupKeys((prev) => prev.filter((g) => g !== k));
    setGroupDirs((prev) => {
      const n = { ...prev };
      delete n[k];
      return n;
    });
  }

  function toggleGroupDir(k) {
    setGroupDirs((prev) => ({ ...prev, [k]: (prev[k] || 1) * -1 }));
  }

  // ── drag-to-group-bar ─────────────────────────────────────────────────────
  function onColDragStart(e, k) {
    dragColRef.current = k;
    e.dataTransfer.setData("col", k);
    e.dataTransfer.effectAllowed = "move";
  }

  function onGbDragOver(e) {
    e.preventDefault();
    dragGbOver.current = true;
  }

  function onGbDrop(e) {
    e.preventDefault();
    dragGbOver.current = false;
    const k = e.dataTransfer.getData("col") || dragColRef.current;
    if (!k || groupKeys.includes(k)) return;
    setGroupKeys((prev) => [...prev, k]);
    setGroupDirs((prev) => ({ ...prev, [k]: 1 }));
  }

  // ── drag-to-reorder columns ───────────────────────────────────────────────
  function onColDrop(e, tgtKey) {
    e.preventDefault();
    const srcKey = e.dataTransfer.getData("col") || dragColRef.current;
    if (!srcKey || srcKey === tgtKey) return;
    setColOrder((prev) => {
      const arr = [...prev];
      const si = arr.indexOf(srcKey),
        ti = arr.indexOf(tgtKey);
      if (si < 0 || ti < 0) return arr;
      arr.splice(si, 1);
      arr.splice(ti, 0, srcKey);
      return arr;
    });
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportCSV() {
    const keys = colOrder;
    const header = keys
      .map((k) => COLUMNS.find((c) => c.key === k)?.label || k)
      .join(",");
    const rows = filtered
      .map((r) => keys.map((k) => `"${r[k] ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "purchase_report.csv";
    a.click();
  }

  // ─── render helpers ───────────────────────────────────────────────────────
  function renderCellValuee(row, key) {
    switch (key) {
      // ── PO No ─────────────────────────────────────────────────────────────────
      case "docId":
        return (
          <span className="text-xs font-medium text-gray-800">
            {row.docId ?? "—"}
          </span>
        );

      // ── PO Date ───────────────────────────────────────────────────────────────
      case "docDate":
        return (
          <span className="text-xs text-gray-500">{fmtDate(row.docDate)}</span>
        );

      // ── Due Date ──────────────────────────────────────────────────────────────
      case "dueDate":
        return (
          <span className="text-xs text-gray-500">{fmtDate(row.dueDate)}</span>
        );

      // ── Due Status ────────────────────────────────────────────────────────────
      case "dueStatus":
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${dueBadgeCls(row.dueAlert)}`}
          >
            {row.dueStatus}
          </span>
        );

      // ── Supplier ──────────────────────────────────────────────────────────────
      case "supplier":
        return (
          <span className="text-xs font-medium text-gray-700">
            {row.supplier ?? "—"}
          </span>
        );

      // ── PO Type ───────────────────────────────────────────────────────────────
      case "poType": {
        const isOrder = row.poType === "ORDER";
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
              isOrder
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {row.poType ?? "—"}
          </span>
        );
      }

      // ── Inward Type ───────────────────────────────────────────────────────────
      case "inwardType": {
        const colorMap = {
          "Order Purchase Inward":
            "bg-indigo-50 text-indigo-700 border border-indigo-200",
          "General Purchase Inward":
            "bg-teal-50   text-teal-700   border border-teal-200",
          "Direct Inward":
            "bg-orange-50 text-orange-700 border border-orange-200",
        };
        const cls =
          colorMap[row.inwardType] ??
          "bg-gray-100 text-gray-500 border border-gray-200";
        return row.inwardType && row.inwardType !== "—" ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cls}`}
          >
            {row.inwardType}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      }

      // ── Branch ────────────────────────────────────────────────────────────────
      case "branch":
        return (
          <span className="text-xs text-gray-600">{row.branch ?? "—"}</span>
        );

      // ── PO Qty ────────────────────────────────────────────────────────────────
      case "poQty":
        return (
          <span className="text-xs font-medium text-gray-700">
            {row.poQty ?? 0}
          </span>
        );

      // ── Inward Qty ────────────────────────────────────────────────────────────
      case "inwardQty": {
        const pct =
          row.poQty > 0
            ? Math.min(100, Math.round((row.inwardQty / row.poQty) * 100))
            : 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-700 min-w-[22px]">
              {row.inwardQty ?? 0}
            </span>
            <div className="h-1.5 rounded-full bg-gray-200 flex-1 min-w-[32px]">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{pct}%</span>
          </div>
        );
      }

      // ── Cancel Qty ────────────────────────────────────────────────────────────
      case "cancelQty":
        return (
          <span
            className={`text-xs font-medium ${
              row.cancelQty > 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            {row.cancelQty ?? 0}
          </span>
        );

      // ── Return Qty ────────────────────────────────────────────────────────────
      case "returnQty":
        return (
          <span
            className={`text-xs font-medium ${
              row.returnQty > 0 ? "text-amber-600" : "text-gray-400"
            }`}
          >
            {row.returnQty ?? 0}
          </span>
        );

      // ── Billed Qty ────────────────────────────────────────────────────────────
      case "billedQty": {
        const isFullyBilled =
          row.billedQty >= row.inwardQty && row.inwardQty > 0;
        const isPartial = row.billedQty > 0 && row.billedQty < row.inwardQty;
        return (
          <span
            className={`text-xs font-medium ${
              isFullyBilled
                ? "text-green-600"
                : isPartial
                  ? "text-amber-600"
                  : "text-gray-400"
            }`}
          >
            {row.billedQty ?? 0}
          </span>
        );
      }

      // ── Balance Qty ───────────────────────────────────────────────────────────
      case "balanceQty":
        return row.balanceQty === 0 ? (
          <span className="text-xs text-gray-400">0</span>
        ) : (
          <span
            className={`text-xs font-semibold ${
              row.dueAlert === "overdue" ? "text-red-700" : "text-green-700"
            }`}
          >
            {row.balanceQty}
          </span>
        );

      // ── Pending to Inward ─────────────────────────────────────────────────────
      case "pendingInward": {
        const isDone = [
          "Fully Received",
          "Cancelled",
          "Closed (Inward + Cancelled)",
        ].includes(row.status);
        return !isDone && row.pendingInward > 0 ? (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-medium">
            {row.pendingInward} pending
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      }

      // ── PO Status ─────────────────────────────────────────────────────────────
      case "status":
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadgeCls(row.status)}`}
          >
            {row.status}
          </span>
        );

      // ── fallback ──────────────────────────────────────────────────────────────
      default:
        return <span className="text-xs text-gray-600">{row[key] ?? "—"}</span>;
    }
  }
  function renderCellValue(row, key) {
    switch (key) {
      case "docId":
        return <span className="text-xs text-gray-600">{row.docId}</span>;
      case "docDate":
        return (
          <span className="text-xs text-gray-600">{fmtDate(row.docDate)}</span>
        );
      case "dueDate":
        return (
          <span className="text-xs text-gray-600">{fmtDate(row.dueDate)}</span>
        );
      case "dueStatus":
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${dueBadgeCls(row.dueAlert)}`}
          >
            {row.dueStatus}
          </span>
        );
      case "supplier":
        return <span className="text-xs text-gray-600">{row.supplier}</span>;
      case "inwardQty": {
        const pct =
          row.poQty > 0
            ? Math.min(100, Math.round((row.inwardQty / row.poQty) * 100))
            : 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600 text-xs  min-w-[22px]">
              {row.inwardQty}
            </span>
            <div className="h-1.5 rounded-full bg-gray-200 flex-1 min-w-[32px]">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{pct}%</span>
          </div>
        );
      }
      case "balanceQty":
        if (row.balanceQty === 0)
          return <span className="text-gray-400 text-xs">0</span>;
        return (
          <span
            className={`text-xs ${row.dueAlert === "overdue" ? "text-red-700" : "text-green-700"}`}
          >
            {row.balanceQty}
          </span>
        );
      case "pendingInward": {
        const isDone = [
          "Fully Received",
          "Cancelled",
          "Closed (Inward + Cancelled)",
        ].includes(row.status);
        return !isDone && row.pendingInward > 0 ? (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded-full text-xs font-medium">
            {row.pendingInward} pending
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      }
      case "status":
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeCls(row.status)}`}
          >
            {row.status}
          </span>
        );
      default:
        return <span className="text-gray-600 text-xs">{row[key] ?? "—"}</span>;
    }
  }

  // ── recursive tree renderer ───────────────────────────────────────────────
  let rowIndex = 0;

  function renderNode(node, visibleCols) {
    if (node._group) {
      const gid = `${node._key}:${node._val}:${node._depth}`;
      const isCol = collapsed[gid];
      const col = COLUMNS.find((c) => c.key === node._key);
      return (
        <React.Fragment key={gid}>
          <tr className="bg-indigo-50 hover:bg-indigo-100">
            <td
              colSpan={visibleCols.length + 2}
              className="px-3 py-2 text-xs font-medium text-indigo-700"
              style={{ paddingLeft: `${node._depth * 18 + 12}px` }}
            >
              <button
                onClick={() => toggleGroup(gid)}
                className="mr-2 text-indigo-500 hover:text-indigo-700"
              >
                {isCol ? "▶" : "▼"}
              </button>
              {col?.label || node._key}:{" "}
              <strong>{node._val || "(blank)"}</strong>
              <span className="ml-2 text-indigo-400 font-normal">
                — {node._count} item{node._count !== 1 ? "s" : ""}
              </span>
            </td>
          </tr>
          {!isCol &&
            node._children.map((child) => renderNode(child, visibleCols))}
        </React.Fragment>
      );
    }

    // data row
    const r = node;
    const stripe = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50";
    rowIndex++;

    return (
      <React.Fragment key={r.id}>
        <tr className={`${stripe} hover:bg-indigo-50 transition-colors`}>
          {/* expand button */}
          <td className="px-2 py-2 w-7">
            <button
              onClick={() => toggleExpand(r.id)}
              className="text-gray-400 hover:text-gray-700 text-xs w-5 h-5 flex items-center justify-center"
            >
              {expanded[r.id] ? "▼" : "▶"}
            </button>
          </td>
          {/* row number */}
          <td className="px-1 py-2 text-[10px] text-gray-300 w-6 text-right">
            {r.id}
          </td>
          {/* data cells */}
          {visibleCols.map((col) => (
            <td key={col.key} className="px-2.5 py-2 whitespace-nowrap">
              {renderCellValue(r, col.key)}
            </td>
          ))}
        </tr>
        {expanded[r.id] && (
          <tr className={stripe}>
            <td colSpan={visibleCols.length + 2} className="p-0">
              <ExpandedRowDetail row={r} />
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading || isFetching) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading purchase report…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        Failed to load report. Please try again.
      </div>
    );
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      {/* ── top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-medium text-gray-800">Purchase Report</h2>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="h-8 px-3 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Download Excel
          </button>
          <button
            onClick={() => window.print()}
            className="h-8 px-3 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Print PDF
          </button>
        </div>
      </div>

      {/* ── summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total POs", val: metrics.total, color: "text-gray-800" },
          { label: "Overdue", val: metrics.overdue, color: "text-red-700" },
          { label: "Due soon", val: metrics.soon, color: "text-amber-700" },
          {
            label: "Fully received",
            val: metrics.fullR,
            color: "text-green-700",
          },
          {
            label: "Total balance qty",
            val: metrics.totalBal,
            color: "text-red-700",
          },
        ].map((m) => (
          <div key={m.label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500">{m.label}</p>
            <p className={`text-xl font-medium mt-0.5 ${m.color}`}>
              {m.val.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* ── active filter chips ────────────────────────────────────────────── */}
      {Object.keys(colFilters).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(colFilters).map(([k, vals]) => {
            const col = COLUMNS.find((c) => c.key === k);
            const allV = uniqueVals[k] || [];
            const summary =
              vals.size === 1
                ? [...vals][0]
                : `${vals.size} of ${allV.length} selected`;
            return (
              <span
                key={k}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-0.5 text-xs"
              >
                {col?.label}: <strong>{summary}</strong>
                <button
                  onClick={() => removeFilterChip(k)}
                  className="text-blue-400 hover:text-blue-700 text-sm leading-none"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── group-by bar ──────────────────────────────────────────────────── */}
      <div
        className="min-h-10 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl flex items-center px-3 py-2 gap-2 flex-wrap"
        onDragOver={onGbDragOver}
        onDrop={onGbDrop}
        onDragLeave={() => {
          dragGbOver.current = false;
        }}
      >
        {groupKeys.length === 0 && (
          <span className="text-xs text-indigo-400">
            Drag a column header here to group by that column
          </span>
        )}
        {groupKeys.map((k) => {
          const col = COLUMNS.find((c) => c.key === k);
          const dir = groupDirs[k] === 1 ? "↑" : "↓";
          return (
            <span
              key={k}
              className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-full px-3 py-1 text-xs font-medium"
            >
              {col?.label}
              <button
                onClick={() => toggleGroupDir(k)}
                className="opacity-80 hover:opacity-100"
              >
                {dir}
              </button>
              <button
                onClick={() => removeGroupKey(k)}
                className="opacity-80 hover:opacity-100 text-sm leading-none"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>

      {/* ── table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table
          className="w-full border-collapse"
          style={{ minWidth: "1100px" }}
        >
          <thead className="bg-gray-100">
            <tr>
              {/* expand col */}
              <th className="w-7 px-2" />
              {/* # col */}
              <th className="w-6 px-1 text-[10px] font-normal text-gray-400">
                #
              </th>

              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  draggable
                  onDragStart={(e) => onColDragStart(e, col.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onColDrop(e, col.key)}
                  className="px-2.5 py-2.5 text-left text-xs font-medium text-gray-500 whitespace-nowrap cursor-grab select-none relative group"
                >
                  <div className="flex items-center gap-1">
                    <span className="flex-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-indigo-500 ml-1">
                          {sortDir === 1 ? "↑" : "↓"}
                        </span>
                      )}
                      {colFilters[col.key] && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 ml-1 align-middle" />
                      )}
                    </span>
                    {/* filter icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuCol(
                          openMenuCol === col.key ? null : col.key,
                        );
                      }}
                      className={`text-[11px] px-0.5 rounded hover:bg-blue-100 hover:text-blue-600 ${colFilters[col.key] ? "text-indigo-500" : "text-gray-400"}`}
                    >
                      ⇅
                    </button>
                  </div>

                  {/* filter dropdown */}
                  {openMenuCol === col.key && (
                    <ColumnFilterMenu
                      colKey={col.key}
                      allValues={uniqueVals[col.key] || []}
                      activeFilter={colFilters[col.key]}
                      onApply={handleFilterApply}
                      onSort={handleSort}
                      onClose={() => setOpenMenuCol(null)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {tree.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCols.length + 2}
                  className="text-center py-10 text-sm text-gray-400"
                >
                  No records found
                </td>
              </tr>
            ) : (
              (() => {
                rowIndex = 0;
                return tree.map((node) => renderNode(node, visibleCols));
              })()
            )}
          </tbody>
        </table>
      </div>

      {/* ── footer ────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center text-xs text-gray-400 flex-wrap gap-2">
        <span>
          Showing {filtered.length} of {allData.length} records
        </span>
        <div className="flex gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-200 inline-block" />
            Overdue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-200 inline-block" />
            Due soon
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-200 inline-block" />
            On track
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  PurchaseReport.jsx — fixed height table + pagination (40 rows per page)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useRef, useState } from "react";
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
  formatQtyByUOM,
  getExcelQtyFormatByUOM,
} from "./purchaseReportUtils";
// import { dummyData } from "./dummyPurchaseReport";
// Add at top of PurchaseReport.jsx
import XLSXStyle from "xlsx-js-style";
const PAGE_SIZE = 40;

export default function PurchaseReport() {
  const [queryParams] = useState({ branchId: undefined });
  const {
    data: apiData,
    isLoading,
    isFetching,
    isError,
  } = useGetPurchaseReportQuery(queryParams);

  const allData = useMemo(
    () => (apiData?.data || []).map(computePORow),
    [apiData],
  );
  // const allData = useMemo(() => dummyData.map(computePORow), []);
  const [colOrder, setColOrder] = useState(() => COLUMNS.map((c) => c.key));
  const [groupKeys, setGroupKeys] = useState([]);
  const [groupDirs, setGroupDirs] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [colFilters, setColFilters] = useState({});
  const [openMenuCol, setOpenMenuCol] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(1);

  const dragColRef = useRef(null);
  const dragGbOver = useRef(false);

  const uniqueVals = useMemo(() => {
    const map = {};
    COLUMNS.forEach(({ key }) => {
      if (key === "dueStatus") {
        // Normalize dueStatus to categories instead of raw "29d Remaining" etc.
        map[key] = [
          ...new Set(
            allData.map((r) => {
              if (r.dueAlert === "overdue") return "Overdue";
              if (r.dueAlert === "soon") return "Due Today / Due Soon";
              if (r.dueAlert === "done") return "Completed";
              return "Remaining";
            }),
          ),
        ].sort();
      } else {
        map[key] = [
          ...new Set(allData.map((r) => String(r[key] ?? ""))),
        ].sort();
      }
    });
    return map;
  }, [allData]);

  const filtered = useMemo(() => {
    return allData.filter((r) => {
      for (const [k, allowed] of Object.entries(colFilters)) {
        if (!allowed) continue;

        if (k === "dueStatus") {
          // Map dueAlert to the normalized category for comparison
          const category =
            r.dueAlert === "overdue"
              ? "Overdue"
              : r.dueAlert === "soon"
                ? "Due Today / Due Soon"
                : r.dueAlert === "done"
                  ? "Completed"
                  : "Remaining";
          if (!allowed.has(category)) return false;
        } else {
          if (!allowed.has(String(r[k] ?? ""))) return false;
        }
      }
      return true;
    });
  }, [allData, colFilters]);

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const tree = useMemo(
    () =>
      groupKeys.length
        ? buildGroups(paginated, groupKeys, groupDirs)
        : paginated,
    [paginated, groupKeys, groupDirs],
  );

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

  const visibleCols = useMemo(
    () =>
      colOrder
        .filter((k) => !groupKeys.includes(k))
        .map((k) => COLUMNS.find((c) => c.key === k))
        .filter(Boolean),
    [colOrder, groupKeys],
  );

  // ─── handlers ──────────────────────────────────────────────────────────────
  function handleSort(k, dir) {
    setSortKey(k);
    setSortDir(dir);
    setPage(1);
  }

  function handleFilterApply(k, vs) {
    setColFilters((p) => {
      const n = { ...p };
      if (!vs) delete n[k];
      else n[k] = vs;
      return n;
    });
    setOpenMenuCol(null);
    setPage(1);
  }

  function removeFilterChip(k) {
    setColFilters((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
    setPage(1);
  }

  function toggleExpand(id) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }
  function toggleGroup(gid) {
    setCollapsed((p) => ({ ...p, [gid]: !p[gid] }));
  }

  function removeGroupKey(k) {
    setGroupKeys((p) => p.filter((g) => g !== k));
    setGroupDirs((p) => {
      const n = { ...p };
      delete n[k];
      return n;
    });
  }

  function toggleGroupDir(k) {
    setGroupDirs((p) => ({ ...p, [k]: (p[k] || 1) * -1 }));
  }

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
    setGroupKeys((p) => [...p, k]);
    setGroupDirs((p) => ({ ...p, [k]: 1 }));
  }

  function onColDrop(e, tgtKey) {
    e.preventDefault();
    const srcKey = e.dataTransfer.getData("col") || dragColRef.current;
    if (!srcKey || srcKey === tgtKey) return;
    setColOrder((p) => {
      const a = [...p],
        si = a.indexOf(srcKey),
        ti = a.indexOf(tgtKey);
      if (si < 0 || ti < 0) return a;
      a.splice(si, 1);
      a.splice(ti, 0, srcKey);
      return a;
    });
  }

  // ─── cell renderer ─────────────────────────────────────────────────────────
  function renderCellValue(row, key) {
    switch (key) {
      case "docId":
        return <div className="text-xs text-gray-600">{row.docId ?? "—"}</div>;
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
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dueBadgeCls(row.dueAlert)}`}
          >
            {row.dueStatus}
          </span>
        );
      case "supplier":
        return (
          <span className="text-xs text-gray-600">{row.supplier ?? "—"}</span>
        );
      case "poType": {
        const isOrder = row.poType === "ORDER";
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${isOrder ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
          >
            {row.poType ?? "—"}
          </span>
        );
      }
      case "inwardType": {
        const colorMap = {
          "Order Purchase Inward":
            "bg-indigo-50 text-indigo-700 border border-indigo-200",
          "General Purchase Inward":
            "bg-teal-50 text-teal-700 border border-teal-200",
          "Direct Inward":
            "bg-orange-50 text-orange-700 border border-orange-200",
        };
        const cls =
          colorMap[row.inwardType] ??
          "bg-gray-100 text-gray-500 border border-gray-200";
        return row.inwardType && row.inwardType !== "—" ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${cls}`}
          >
            {row.inwardType}
          </span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        );
      }
      case "branch":
        return (
          <span className="text-xs text-gray-600">{row.branch ?? "—"}</span>
        );
      case "poQty":
        return (
          <div className="text-xs text-right text-gray-600">
            {formatQtyByUOM(row.poQty, row.uom)}
          </div>
        );
      case "inwardQty": {
        const pct =
          row.poQty > 0
            ? Math.min(100, Math.round((row.inwardQty / row.poQty) * 100))
            : 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-600 min-w-[22px]">
              {formatQtyByUOM(row.inwardQty, row.uom)}
            </span>
            <div className="h-1.5 rounded-full bg-gray-200 flex-1 min-w-[32px]">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{pct}%</span>
          </div>
        );
      }
      case "cancelQty":
        return (
          <div
            className={`text-xs text-right ${row.cancelQty > 0 ? "text-red-600" : "text-gray-600"}`}
          >
            {formatQtyByUOM(row.cancelQty, row.uom)}
          </div>
        );
      case "returnQty":
        return (
          <div
            className={`text-xs text-right ${row.returnQty > 0 ? "text-[#6B3A2A] f" : "text-gray-600"
              }`}
          >
            {formatQtyByUOM(row.returnQty, row.uom)}
          </div>
        );
      case "billedQty": {
        const isFullyBilled =
          row.billedQty >= row.inwardQty && row.inwardQty > 0;
        const isPartial = row.billedQty > 0 && row.billedQty < row.inwardQty;
        return (
          <div
            className={`text-xs text-right ${isFullyBilled ? "text-green-600" : isPartial ? "text-amber-600" : "text-gray-600"}`}
          >
            {formatQtyByUOM(row.billedQty, row.uom)}
          </div>
        );
      }
      case "balanceQty":
        return row.balanceQty === 0 ? (
          <div className="text-xs text-right text-gray-600">0</div>
        ) : (
          <div className={`text-xs text-right text-amber-600`}>
            {formatQtyByUOM(row.balanceQty, row.uom)}
          </div>
        );
      case "pendingInward": {
        const isDone = [
          "Fully Received",
          "Cancelled",
          "Closed (Inward + Cancelled)",
        ].includes(row.status);
        return !isDone && row.pendingInward > 0 ? (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs">
            {row.pendingInward} pending
          </span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        );
      }
      case "status":
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${statusBadgeCls(row.status)}`}
          >
            {row.status}
          </span>
        );
      default:
        return <span className="text-xs text-gray-600">{row[key] ?? "—"}</span>;
    }
  }

  // ─── tree renderer ─────────────────────────────────────────────────────────
  let rowIndex = 0;
  function renderNode(node, vc) {
    if (node._group) {
      const gid = `${node._key}:${node._val}:${node._depth}`;
      const col = COLUMNS.find((c) => c.key === node._key);
      return (
        <React.Fragment key={gid}>
          <tr className="bg-indigo-50 hover:bg-indigo-100">
            <td
              colSpan={vc.length + 2}
              className="px-3 py-2 text-xs font-medium text-indigo-700"
              style={{ paddingLeft: `${node._depth * 18 + 12}px` }}
            >
              <button
                onClick={() => toggleGroup(gid)}
                className="mr-2 text-indigo-500 hover:text-indigo-700"
              >
                {collapsed[gid] ? "▶" : "▼"}
              </button>
              {col?.label || node._key}:{" "}
              <strong>{node._val || "(blank)"}</strong>
              <span className="ml-2 text-indigo-400 font-normal">
                — {node._count} item{node._count !== 1 ? "s" : ""}
              </span>
            </td>
          </tr>
          {!collapsed[gid] &&
            node._children.map((child) => renderNode(child, vc))}
        </React.Fragment>
      );
    }
    const r = node;
    const stripe = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50";
    const isOverdue = r.dueAlert === "overdue";
    rowIndex++;
    return (
      <React.Fragment key={r.id}>
        <tr
          className={`${isOverdue ? "bg-red-50 hover:bg-red-100" : `${stripe} hover:bg-indigo-50`} transition-colors`}
        >
          <td
            className={`px-2 py-1.5 w-8 border-r border-b border-gray-100 ${isOverdue ? "border-l-2 border-l-red-500" : ""}`}
          >
            {" "}
            <button
              onClick={() => toggleExpand(r.id)}
              className="text-gray-400 hover:text-gray-700 text-xs w-5 h-5 flex items-center justify-center"
            >
              {expanded[r.id] ? "▼" : "▶"}
            </button>
          </td>

          {vc.map((col) => (
            <td
              key={col.key}
              className="px-2.5 py-1.5 whitespace-nowrap border-r border-b border-gray-100 last:border-r-0"
            >
              {renderCellValue(r, col.key)}
            </td>
          ))}
        </tr>
        {expanded[r.id] && (
          <tr className={stripe}>
            <td colSpan={vc.length + 2} className="p-0">
              <ExpandedRowDetail row={r} />
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }

  if (isLoading || isFetching)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading purchase report…
      </div>
    );
  if (isError)
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        Failed to load report. Please try again.
      </div>
    );

  function exportExcel() {
    const keys = colOrder;
    const labels = keys.map(
      (k) => COLUMNS.find((c) => c.key === k)?.label || k,
    );

    // ── helpers ──────────────────────────────────────────────────────────────────
    function fmtExcelDate(d) {
      if (!d) return "—";
      const dt = new Date(d);
      if (isNaN(dt)) return String(d);
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}/${dt.getFullYear()}`;
    }

    const RIGHT_KEYS = new Set([
      "poQty",
      "inwardQty",
      "cancelQty",
      "returnQty",
      "billedQty",
      "balanceQty",
      "pendingInward",
    ]);
    const DATE_KEYS = new Set(["docDate", "dueDate"]);

    const BORDER = {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } },
    };

    function cell(value, opts = {}) {
      const {
        bold = false,
        fontColor = "1F2937",
        fgColor = null,
        align = "left",
        fontSize = 9,
        indent = 1,
        numFmt = null,
      } = opts;

      const fill = fgColor
        ? { fgColor: { rgb: fgColor }, patternType: "solid" }
        : { patternType: "none" };

      const c = {
        v: value ?? "",
        t: typeof value === "number" ? "n" : "s",
        s: {
          font: {
            bold,
            color: { rgb: fontColor },
            sz: fontSize,
            name: "Arial",
          },
          fill,
          alignment: {
            horizontal: align,
            vertical: "center",
            indent,
            wrapText: false,
          },
          border: BORDER,
        },
      };
      if (numFmt) c.z = numFmt;
      return c;
    }

    function qtyCell(k, row) {
      const raw = row[k];
      const numVal = typeof raw === "number" ? raw : parseFloat(raw) || 0;
      const fmt = getExcelQtyFormatByUOM(row.uom);
      const colorMap = {
        cancelQty: numVal > 0 ? "DC2626" : "6B7280",
        returnQty: numVal > 0 ? "92400E" : "6B7280", // dark coffee
        billedQty:
          row.billedQty >= row.inwardQty && row.inwardQty > 0
            ? "15803D"
            : row.billedQty > 0
              ? "D97706"
              : "9CA3AF",
        balanceQty: numVal > 0 ? "D97706" : "6B7280", // always amber/orange
      };
      return cell(numVal, {
        fontColor: colorMap[k] || "1F2937",
        bold: ["billedQty", "balanceQty"].includes(k) && numVal > 0,
        align: "right",
        indent: 0,
        numFmt: fmt,
      });
    }

    function dueStatusCell(row) {
      const colorMap = {
        overdue: "DC2626",
        soon: "D97706",
        done: "6B7280",
        ok: "16A34A",
      };
      return cell(String(row.dueStatus ?? "—"), {
        fontColor: colorMap[row.dueAlert] || "374151",
        bold: true,
        align: "left",
      });
    }

    function poTypeCell(row) {
      return cell(String(row.poType ?? "—"), {
        fontColor: row.poType === "ORDER" ? "1D4ED8" : "374151",
        bold: row.poType === "ORDER",
        align: "left",
      });
    }

    function inwardTypeCell(row) {
      const colorMap = {
        "Order Purchase Inward": "3730A3",
        "General Purchase Inward": "0D7377",
        "Direct Inward": "9A3412",
      };
      return cell(String(row.inwardType ?? "—"), {
        fontColor: colorMap[row.inwardType] || "374151",
        bold: !!colorMap[row.inwardType],
        align: "left",
      });
    }

    function statusCell(row) {
      const colorMap = {
        "Fully Received": "15803D",
        "Partially Received": "1D4ED8",
        "Partially Received & Cancelled": "1D4ED8",
        "Closed (Inward + Cancelled)": "6D28D9",
        Cancelled: "DC2626",
        "Partially Cancelled": "DC2626",
        Pending: "D97706",
      };
      return cell(String(row.status ?? "—"), {
        fontColor: colorMap[row.status] || "374151",
        bold: true,
        align: "left",
      });
    }

    // ── flatten rows ─────────────────────────────────────────────────────────────
    const allSheetRows = []; // { cells, isGroup, depth }

    // Group bg gets slightly darker per depth — matches reference
    const GROUP_BG = ["F6F6F6", "F0F0F0", "EBEBEB", "E5E5E5"];

    function flattenNode(node, depth) {
      if (node._group) {
        const col = COLUMNS.find((c) => c.key === node._key);
        const label = `${col?.label || node._key}: ${node._val || "(blank)"}  -  ${node._count} item${node._count !== 1 ? "s" : ""}`;
        const bg = GROUP_BG[depth] || "F6F6F6";
        const fs = depth === 0 ? 10 : 9;

        // ── KEY: label goes in column = depth index ──────────────────────────
        // depth 0 → col 0 (A) has label, rest empty
        // depth 1 → col 0 empty, col 1 (B) has label, rest empty
        // depth 2 → cols 0,1 empty, col 2 (C) has label, rest empty
        const groupRow = keys.map((_, ci) =>
          cell(ci === depth ? label : "", {
            bold: false, // NOT bold — matches reference screenshot
            fontColor: "1F2937",
            fgColor: bg,
            align: "left",
            fontSize: fs,
            indent: 1,
          }),
        );

        allSheetRows.push({ cells: groupRow, isGroup: true, depth });
        node._children.forEach((child) => flattenNode(child, depth + 1));
      } else {
        const r = node;
        const isOdd = allSheetRows.filter((x) => !x.isGroup).length % 2 === 1;
        const bg = isOdd ? "F9FAFB" : "FFFFFF";

        const dataRow = keys.map((k) => {
          if (DATE_KEYS.has(k))
            return cell(fmtExcelDate(r[k]), { fgColor: bg });
          if (k === "dueStatus") return dueStatusCell(r);
          if (k === "poType") return poTypeCell(r);
          if (k === "inwardType") return inwardTypeCell(r);
          if (k === "status") return statusCell(r);
          if (RIGHT_KEYS.has(k)) return qtyCell(k, r);
          if (k === "docId")
            return cell(String(r[k] ?? ""), {
              fontColor: "111827",
              bold: true,
              fgColor: bg,
            });
          if (k === "supplier")
            return cell(String(r[k] ?? ""), {
              fontColor: "1F2937",
              bold: true,
              fgColor: bg,
            });
          return cell(String(r[k] ?? ""), { fgColor: bg });
        });

        allSheetRows.push({ cells: dataRow, isGroup: false, depth: 0 });
      }
    }

    if (groupKeys.length > 0) {
      buildGroups(sorted, groupKeys, groupDirs).forEach((n) =>
        flattenNode(n, 0),
      );
    } else {
      sorted.forEach((r) => flattenNode(r, 0));
    }

    // ── header row ───────────────────────────────────────────────────────────────
    const headerRow = labels.map((label, i) =>
      cell(label, {
        bold: true,
        fgColor: "1E3A5F",
        fontColor: "FFFFFF",
        align: RIGHT_KEYS.has(keys[i]) ? "right" : "left",
        fontSize: 10,
        indent: 1,
      }),
    );

    // ── assemble worksheet ────────────────────────────────────────────────────────
    const wsData = [headerRow, ...allSheetRows.map((r) => r.cells)];

    const ws = XLSXStyle.utils.aoa_to_sheet(
      wsData.map((row) => row.map((c) => c.v)),
    );

    // inject styles
    wsData.forEach((row, ri) => {
      row.forEach((c, ci) => {
        const addr = XLSXStyle.utils.encode_cell({ r: ri, c: ci });
        ws[addr] = { ...(ws[addr] || {}), ...c };
        if (c.z) ws[addr].z = c.z;
      });
    });

    // ── merges: each group row merged from depth col → last col ──────────────────
    // This makes the label visually span full remaining width
    const merges = [];
    allSheetRows.forEach((row, i) => {
      if (row.isGroup) {
        const ri = i + 1; // +1 for header row
        merges.push({
          s: { r: ri, c: row.depth }, // start at depth column
          e: { r: ri, c: keys.length - 1 }, // end at last column
        });
      }
    });
    if (merges.length > 0) ws["!merges"] = merges;

    // ── column widths ─────────────────────────────────────────────────────────────
    const COL_WIDTHS = {
      docId: 20,
      docDate: 14,
      dueDate: 14,
      dueStatus: 16,
      supplier: 55,
      poType: 16,
      inwardType: 30,
      branch: 18,
      poQty: 13,
      inwardQty: 15,
      cancelQty: 13,
      returnQty: 13,
      billedQty: 13,
      balanceQty: 15,
      pendingInward: 16,
      status: 30,
    };
    ws["!cols"] = keys.map((k) => ({ wch: COL_WIDTHS[k] || 14 }));

    // ── row heights ───────────────────────────────────────────────────────────────
    ws["!rows"] = [
      { hpt: 24 },
      ...allSheetRows.map((r) => ({ hpt: r.isGroup ? 18 : 17 })),
    ];

    // ── freeze header ─────────────────────────────────────────────────────────────
    ws["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: "A2",
      activePane: "bottomLeft",
    };

    // ── write ─────────────────────────────────────────────────────────────────────
    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Purchase Report");
    const today = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    XLSXStyle.writeFile(wb, `Purchase_Report_${today}.xlsx`);
  }

  return (
    <div className="p-4 space-y-3">
      {/* top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white py-0.5 px-2 rounded-lg">
        <h2 className="text-base font-medium text-gray-800">Purchase Report</h2>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="h-8 px-3 text-xs border border-green-300 rounded-lg text-green-600 hover:bg-green-50"
          >
            Download Excel
          </button>
          <button
            onClick={() => window.print()}
            className="h-8 px-3 text-xs border border-red-300 rounded-lg text-red-600 hover:bg-red-50"
          >
            Print PDF
          </button>
        </div>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Total POs",
            val: metrics.total,
            color: "text-gray-700",
            bg: "bg-gray-100",
            icon: (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            ),
          },
          {
            label: "Overdue",
            val: metrics.overdue,
            color: "text-red-700",
            bg: "bg-red-50",
            icon: (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            ),
          },
          {
            label: "Due soon",
            val: metrics.soon,
            color: "text-amber-700",
            bg: "bg-amber-50",
            icon: (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            ),
          },
          {
            label: "Fully received",
            val: metrics.fullR,
            color: "text-green-700",
            bg: "bg-green-50",
            icon: (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            ),
          },
          {
            label: "Total balance qty",
            val: metrics.totalBal,
            color: "text-red-700",
            bg: "bg-red-50",
            icon: (
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.3 7l8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            ),
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm"
          >
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${m.bg} ${m.color}`}
            >
              {m.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 leading-tight truncate">
                {m.label}
              </p>
              <p
                className={`text-lg font-semibold leading-tight mt-0.5 ${m.color}`}
              >
                {typeof m.val === "number" ? m.val.toLocaleString() : m.val}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* active filter chips */}
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

      {/* group-by bar */}
      <div
        className="min-h-10 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl flex items-center px-3 py-2 gap-2 flex-wrap"
        onDragOver={onGbDragOver}
        onDrop={onGbDrop}
        onDragLeave={() => {
          dragGbOver.current = false;
        }}
      >
        {groupKeys.length === 0 ? (
          <span className="text-xs text-indigo-400">
            Drag a column header here to group by that column
          </span>
        ) : (
          groupKeys.map((k) => {
            const col = COLUMNS.find((c) => c.key === k);
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
                  {groupDirs[k] === 1 ? "↑" : "↓"}
                </button>
                <button
                  onClick={() => removeGroupKey(k)}
                  className="opacity-80 hover:opacity-100 text-sm leading-none"
                >
                  ×
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* ── TABLE: one container, sticky thead, scrollable body ────────── */}
      <div
        className="border border-gray-200 rounded-xl overflow-auto"
        style={{ height: "60vh" }}
      >
        <table
          className="w-full table-fixed border-collapse"
          style={{ width: "1700px" }}
        >
          {/* thead is sticky — scrolls horizontally with the table, fixed vertically */}
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th
                style={{ width: "32px", minWidth: "32px" }}
                className="px-2 border-r border-b border-gray-200"
              />

              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  draggable
                  onDragStart={(e) => onColDragStart(e, col.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onColDrop(e, col.key)}
                  style={{ width: col.w, minWidth: col.w }}
                  className="px-2.5 py-2.5 text-center text-xs font-medium text-black whitespace-nowrap cursor-grab select-none relative border-r border-b border-gray-200 last:border-r-0"
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

      {/* ── pagination + footer ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-gray-600">
        {/* record count */}
        <span>
          Showing {sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}{" "}
          records
          {filtered.length < allData.length &&
            ` (filtered from ${allData.length})`}
        </span>

        {/* page controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 text-gray-500 text-xs"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 text-gray-500 text-xs"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
              )
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="px-1 text-gray-300">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-7 min-w-[28px] px-1.5 rounded-lg border text-xs font-medium transition-colors ${p === safePage ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 text-gray-500 text-xs"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 text-gray-500 text-xs"
            >
              »
            </button>
          </div>
        )}

        {/* legend */}
        <div className="flex gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm text-gray-700 text-lg bg-red-200 inline-block" />
            Overdue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm text-gray-700 text-xs bg-amber-200 inline-block" />
            Due soon
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm text-gray-700 bg-green-200 inline-block" />
            On track
          </span>
        </div>
      </div>
    </div>
  );
}

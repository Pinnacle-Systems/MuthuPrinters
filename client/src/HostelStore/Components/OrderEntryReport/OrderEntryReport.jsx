// ─────────────────────────────────────────────────────────────────────────────
//  OrderEntryReport.jsx — S.No col, fixed 2dp qty, PDF fix, inward bar-first,
//                       expanded border, group qty summary
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useRef, useState } from "react";
import { useGetOrderEntryReportQuery } from "../../../redux/uniformService/OrderEntryService";
import ColumnFilterMenu from "./components/ColumnFilterMenu";
import ExpandedRowDetail from "./components/ExpandedRowDetail";
import {
  COLUMNS,
  buildGroups,
  computeOrderEntryRow,
  fmtDate,
  deliveryBadgeCls,
} from "./orderEntryReportUtils";
import XLSXStyle from "xlsx-js-style";
import mpLogo from "../../../assets/mplogo.png";
const PAGE_SIZE = 40;

// ── fixed 2-decimal formatter (no UOM logic) ─────────────────────────────────
function fmt2(val) {
  const n = typeof val === "number" ? val : parseFloat(val) || 0;
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}
// ── Inward type short codes for PDF ──────────────────────────────────────────
const INWARD_SHORT = {
  "Order Purchase Inward": "OPI",
  "General Purchase Inward": "GPI",
  "Direct Inward": "DI",
};
// ── Excel number format: always 2dp ──────────────────────────────────────────
const EXCEL_NUM_FMT = "#,##0.000";

export default function OrderEntryReport() {
  const [queryParams] = useState({ branchId: undefined });
  const [page, setPage] = useState(1);

  const {
    data: apiData,
    isLoading,
    isFetching,
    isError,
  } = useGetOrderEntryReportQuery({ ...queryParams, page, limit: PAGE_SIZE });
  console.log(apiData, "apiData");

  const allData = useMemo(
    () => (apiData?.data || []).map(computeOrderEntryRow),
    [apiData],
  );
  const [colOrder, setColOrder] = useState(() => COLUMNS.map((c) => c.key));
  const [groupKeys, setGroupKeys] = useState([]);
  const [groupDirs, setGroupDirs] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [colFilters, setColFilters] = useState({});
  const [openMenuCol, setOpenMenuCol] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [expanded, setExpanded] = useState({});
  const dragColRef = useRef(null);
  const dragGbOver = useRef(false);

  const uniqueVals = useMemo(() => {
    const map = {};
    COLUMNS.forEach(({ key }) => {
      map[key] = [...new Set(allData.map((r) => String(r[key] ?? "")))].sort();
    });
    return map;
  }, [allData]);

  const filtered = useMemo(() => {
    return allData.filter((r) => {
      for (const [k, allowed] of Object.entries(colFilters)) {
        if (!allowed) continue;
        if (!allowed.has(String(r[k] ?? ""))) return false;
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

  const totalPages = apiData?.totalPages || 1;
  const safePage = Math.min(page, totalPages);
  const paginated = sorted;

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
      case "docDate":
        return (
          <span className="text-xs text-gray-600">{fmtDate(row[key])}</span>
        );
      case "deliveryDate":
        return (
          <span className="text-xs text-gray-600">{fmtDate(row[key])}</span>
        );
      case "deliveryStatus": {
        const cls = deliveryBadgeCls(row.deliveryAlert);
        return (
          <span
            className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${cls}`}
          >
            {row.deliveryStatus}
          </span>
        );
      }
      case "orderQty":
        return (
          <div className="text-xs text-right text-gray-600">
            {row[key] ?? 0}
          </div>
        );
      default:
        return <span className="text-xs text-gray-600">{row[key] ?? "—"}</span>;
    }
  }

  // ─── tree renderer ─────────────────────────────────────────────────────────
  const QTY_KEYS = ["orderQty"];

  let rowIndex = 0;
  // globalSno tracks absolute serial number across pages
  const globalSnoStart = (safePage - 1) * PAGE_SIZE;

  function renderNode(node, vc, localIdx) {
    if (node._group) {
      const gid = `${node._key}:${node._val}:${node._depth}`;
      const col = COLUMNS.find((c) => c.key === node._key);

      // ── compute qty totals for this group ──────────────────────────────────
      function collectRows(n) {
        if (n._group) return n._children.flatMap(collectRows);
        return [n];
      }
      const groupRows = collectRows(node);
      const qtyTotals = {};
      QTY_KEYS.forEach((k) => {
        qtyTotals[k] = groupRows.reduce(
          (s, r) => s + (parseFloat(r[k]) || 0),
          0,
        );
      });

      return (
        <React.Fragment key={gid}>
          <tr className="bg-indigo-50 hover:bg-indigo-100">
            {/* S.No cell for group row — blank */}
            <td className="px-2 py-1.5 border-r border-b border-gray-200 w-10 text-center text-xs text-gray-400" />
            {/* expand col — hidden in print */}
            <td className="col-expand px-2 border-r border-b border-gray-200 w-8" />
            <td
              colSpan={vc.length}
              className="px-3 py-2 text-xs font-medium text-indigo-700 border-b border-gray-200"
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
              {/* qty summary badges */}
              <span className="ml-3 inline-flex flex-wrap gap-2">
                {QTY_KEYS.filter((k) => qtyTotals[k] > 0).map((k) => {
                  const label = COLUMNS.find((c) => c.key === k)?.label || k;
                  return (
                    <span
                      key={k}
                      className="bg-white border border-indigo-200 text-indigo-600 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    >
                      {label}: {fmt2(qtyTotals[k])}
                    </span>
                  );
                })}
              </span>
            </td>
          </tr>
          {!collapsed[gid] &&
            node._children.map((child, ci) => renderNode(child, vc, ci))}
        </React.Fragment>
      );
    }

    const r = node;
    const stripe = rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50";
    const isOverdue = r.deliveryAlert === "overdue";
    const rowBg = isOverdue ? "bg-red-50/50" : stripe;
    const sno = globalSnoStart + rowIndex + 1;
    rowIndex++;

    return (
      <React.Fragment key={r.id}>
        <tr className={`${rowBg} hover:bg-indigo-50 transition-colors`}>
          {/* S.No */}
          <td className="px-2 py-1.5 w-10 text-center border-r border-b border-gray-100 text-xs text-gray-400 select-none">
            {sno}
          </td>
          {/* Expand toggle */}
          <td
            className={`col-expand px-2 py-1.5 w-8 border-r border-b border-gray-100`}
          >
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
              className={`px-2.5 py-1.5 whitespace-nowrap border-r border-b border-gray-100 last:border-r-0
    ${["orderQty"].includes(col.key) ? "col-qty" : ""}`}
            >
              {renderCellValue(r, col.key)}
            </td>
          ))}
        </tr>

        {/* ── expanded detail with full border ────────────────────────────── */}
        {expanded[r.id] && (
          <tr className={rowBg}>
            <td colSpan={vc.length + 2} className="p-0">
              <div className="mx-2 my-1.5 border-2 border-indigo-300 rounded-xl overflow-hidden shadow-sm ring-1 ring-indigo-100">
                <ExpandedRowDetail row={r} />
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }

  if (isLoading || isFetching)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading Order Entry Report…
      </div>
    );
  if (isError)
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        Failed to load report. Please try again.
      </div>
    );

  // ─── Excel export ───────────────────────────────────────────────────────────
  function exportExcel() {
    const keys = colOrder;
    const labels = keys.map(
      (k) => COLUMNS.find((c) => c.key === k)?.label || k,
    );

    function fmtExcelDate(d) {
      if (!d) return "—";
      const dt = new Date(d);
      if (isNaN(dt)) return String(d);
      return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
    }

    const RIGHT_KEYS = new Set(["orderQty"]);
    const DATE_KEYS = new Set(["docDate", "deliveryDate"]);

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

    function qtyCell(k, row, bg = null) {
      const raw = row[k];
      const numVal = typeof raw === "number" ? raw : parseFloat(raw) || 0;
      return cell(numVal, {
        fontColor: "1F2937",
        bold: false,
        align: "right",
        indent: 0,
        numFmt: EXCEL_NUM_FMT,
        fgColor: bg,
      });
    }

    // S.No column prepended
    const allKeys = ["sno", ...keys];
    const allLabels = ["S.No", ...labels];

    const allSheetRows = [];
    const customMerges = [];
    const GROUP_BG = ["F6F6F6", "F0F0F0", "EBEBEB", "E5E5E5"];
    let dataRowCount = 0;

    function flattenNode(node, depth) {
      if (node._group) {
        const col = COLUMNS.find((c) => c.key === node._key);

        // group qty totals
        function collectRows(n) {
          return n._group ? n._children.flatMap(collectRows) : [n];
        }
        const gRows = collectRows(node);
        const qtyTotals = {};
        QTY_KEYS.forEach((k) => {
          qtyTotals[k] = gRows.reduce((s, r) => s + (parseFloat(r[k]) || 0), 0);
        });
        const qtyStr = QTY_KEYS.filter((k) => qtyTotals[k] > 0)
          .map(
            (k) =>
              `${COLUMNS.find((c) => c.key === k)?.label || k}: ${Number(qtyTotals[k]).toFixed(3)}`
          )
          .join("  |  ");

        const label = `${col?.label || node._key}: ${node._val || "(blank)"}  -  ${node._count} item${node._count !== 1 ? "s" : ""}${qtyStr ? "  |  " + qtyStr : ""}`;
        const bg = GROUP_BG[depth] || "F6F6F6";
        const fs = depth === 0 ? 10 : 9;

        // S.No cell blank for group; label at depth+1 offset (accounting for sno col)
        const groupRow = allKeys.map((_, ci) => {
          const labelColIndex = depth + 1; // +1 because sno is col 0
          return cell(ci === labelColIndex ? label : "", {
            fontColor: "1F2937",
            fgColor: bg,
            align: "left",
            fontSize: fs,
            indent: 1,
          });
        });

        allSheetRows.push({ cells: groupRow, isGroup: true, depth: depth + 1 });
        customMerges.push({
          s: { r: allSheetRows.length, c: depth + 1 },
          e: { r: allSheetRows.length, c: allKeys.length - 1 },
        });
        
        node._children.forEach((child) => flattenNode(child, depth + 1));
      } else {
        const r = node;
        dataRowCount++;
        const isOdd = dataRowCount % 2 === 1;
        const bg = isOdd ? "FFFFFF" : "F9FAFB";

        const baseDataRow = allKeys.map((k, ki) => {
          if (k === "sno")
            return cell(dataRowCount, {
              fontColor: "9CA3AF",
              align: "center",
              indent: 0,
              fgColor: bg,
            });
          if (DATE_KEYS.has(k))
            return cell(fmtExcelDate(r[k]), { fgColor: bg });
          if (RIGHT_KEYS.has(k)) return qtyCell(k, r, bg);
          if (k === "docId")
            return cell(String(r[k] ?? ""), {
              fontColor: "1F2937",
              bold: false,
              fgColor: bg,
            });
          return cell(String(r[k] ?? ""), { fgColor: bg });
        });

        const orderItems = r.orderItems || [];
        const jobCards = r.JobCard || [];
        const saleOrders = r.SalesOrder || [];
        const packing = r.Packing || [];
        const salesDeliveries = r.SalesOrder?.flatMap((so) => 
          (so.SalesDelivery || []).map(sd => ({ ...sd, SaleOrderNo: so.docId }))
        ) || [];

        const maxChildRows = Math.max(0, orderItems.length, jobCards.length, saleOrders.length, packing.length, salesDeliveries.length);
        const blockRows = maxChildRows > 0 ? maxChildRows + 2 : 1;
        const startRowIndex = allSheetRows.length + 1; // +1 because row 0 is the sheet headers
        
        const emptyBaseCells = allKeys.map(() => cell("", { fgColor: bg }));
        
        const rows = [];
        for (let i = 0; i < blockRows; i++) {
           rows.push({ cells: i === 0 ? baseDataRow : [...emptyBaseCells], isGroup: false });
        }

        if (maxChildRows > 0) {
            const formatProcessRoute = (prList) => {
              if (!Array.isArray(prList)) return "-";
              return prList.map(pr => {
                const name = pr.Process?.name?.toUpperCase() || "PROCESS";
                const outside = pr.Process?.isOutsideJob ? ", Outside" : "";
                const status = pr.status || "Pending";
                const qty = pr.completedQty || 0;
                return `${pr.sequence || ""}. ${name} [${status}, Qty: ${qty}${outside}]`;
              }).join("\n");
            };
    
            const getDocItemName = (doc) => {
              return doc.StyleItem?.name ||
                doc.SalesOrderItems?.map((i) => i.StyleItem?.name).filter(Boolean).join(", ") ||
                doc.PackingItems?.map((i) => i.StyleItem?.name).filter(Boolean).join(", ") ||
                doc.salesDeliveryItems?.map((i) => i.StyleItem?.name).filter(Boolean).join(", ") ||
                "-";
            };

            let currentColOffset = allKeys.length;
            
            const injectTable = (title, items, headers, rowMapper, themeColor, textColor) => {
               const colSpan = headers.length;
               // Row 0: Title
               rows[0].cells[currentColOffset] = cell(title, { bold: true, fgColor: themeColor, fontColor: textColor });
               for (let c = 1; c < colSpan; c++) {
                  rows[0].cells[currentColOffset + c] = cell("", { fgColor: themeColor });
               }
               // Row 1: Headers
               for (let c = 0; c < colSpan; c++) {
                  rows[1].cells[currentColOffset + c] = cell(headers[c], { bold: true, fgColor: "F3F4F6", fontColor: "000000" });
               }
               // Row 2+: Data
               for (let i = 0; i < maxChildRows; i++) {
                  if (i < items.length) {
                     const rowData = rowMapper(items[i]);
                     for (let c = 0; c < colSpan; c++) {
                        rows[2 + i].cells[currentColOffset + c] = cell(rowData[c], { fgColor: bg });
                     }
                  } else {
                     for (let c = 0; c < colSpan; c++) {
                        rows[2 + i].cells[currentColOffset + c] = cell("", { fgColor: bg });
                     }
                  }
               }
               
               customMerges.push({ s: { r: startRowIndex, c: currentColOffset }, e: { r: startRowIndex, c: currentColOffset + colSpan - 1 } });
               currentColOffset += colSpan;
            };

            injectTable("Order Items", orderItems, ["Item Name", "Style", "Size Details", "Qty", "Job Card No", "Process Route"], (item) => {
               const breakups = item.OrderStyleBreakup || [];
               const styleStr = breakups.map(bk => bk.Style?.name || "-").join("\n") || "-";
               const sizeStr = breakups.map(bk => {
                 const sizes = bk.OrderSizeBreakup || [];
                 return sizes.map(sz => `${sz.Size?.name || "Size"}: ${sz.qty || 0}`).join(", ");
               }).filter(Boolean).join("\n") || "-";
               const matchingJc = r.JobCard?.find((j) => j.StyleItem?.name === item.StyleItem?.name);
               return [item.StyleItem?.name || "-", styleStr, sizeStr, item.orderQty || 0, matchingJc?.docId || "-", formatProcessRoute(matchingJc?.processRoute)];
            }, "DBEAFE", "1E3A8A");

            injectTable("Job Cards", jobCards, ["Job Card No", "Job Card Date", "Item Name", "Process Route"], (item) => [
               item.docId || "-", fmtExcelDate(item.docDate), getDocItemName(item), formatProcessRoute(item.processRoute)
            ], "E0E7FF", "312E81");

            injectTable("Sale Orders", saleOrders, ["Sale Order No", "Sale Order Date", "Item Name"], (item) => [
               item.docId || "-", fmtExcelDate(item.docDate), getDocItemName(item)
            ], "DCFCE7", "14532D");

            injectTable("Packing", packing, ["Packing No", "Packing Date", "Job Card No", "Item Name"], (item) => [
               item.docId || "-", fmtExcelDate(item.docDate), item.JobCard?.docId || "-", getDocItemName(item)
            ], "FFEDD5", "7C2D12");

            injectTable("Sales Deliveries", salesDeliveries, ["Delivery No", "Delivery Date", "Sale Order No", "Item Name"], (item) => [
               item.docId || "-", fmtExcelDate(item.docDate), item.SaleOrderNo || "-", getDocItemName(item)
            ], "FCE7F3", "831843");

            // Merge base columns vertically
            if (blockRows > 1) {
              for (let c = 0; c < allKeys.length; c++) {
                 customMerges.push({ s: { r: startRowIndex, c: c }, e: { r: startRowIndex + blockRows - 1, c: c } });
              }
            }
        }

        rows.forEach(row => allSheetRows.push(row));
        
        // Divider row between orders (ensure it spans all columns!)
        const totalCols = allKeys.length + 6 + 4 + 3 + 4 + 4;
        const dividerCells = Array(totalCols).fill(0).map(() => cell("", { fgColor: "D1D5DB" }));
        allSheetRows.push({ cells: dividerCells, isGroup: false, isDivider: true });
      }
    }

    if (groupKeys.length > 0) {
      buildGroups(sorted, groupKeys, groupDirs).forEach((n) =>
        flattenNode(n, 0),
      );
    } else {
      sorted.forEach((r) => flattenNode(r, 0));
    }

    const headerRow = allLabels.map((label, i) =>
      cell(label, {
        bold: true,
        fgColor: "1E3A8A",
        fontColor: "FFFFFF",
        align:
          RIGHT_KEYS.has(allKeys[i]) || allKeys[i] === "sno"
            ? "center"
            : "left",
        fontSize: 10,
        indent: 1,
      })
    );

    const wsData = [headerRow, ...allSheetRows.map((r) => r.cells)];
    const ws = XLSXStyle.utils.aoa_to_sheet(
      wsData.map((row) => row.map((c) => (c ? c.v : "")))
    );

    // re-apply styles
    wsData.forEach((row, ri) => {
      row.forEach((c, ci) => {
        if (!c) return;
        const addr = XLSXStyle.utils.encode_cell({ r: ri, c: ci });
        ws[addr] = { ...(ws[addr] || {}), ...c };
        if (c.s && c.s.alignment) {
          ws[addr].s.alignment.wrapText = true;
        }
        if (c.z) ws[addr].z = c.z;
      });
    });

    if (customMerges.length > 0) ws["!merges"] = customMerges;

    const COL_WIDTHS = {
      sno: 6,
      docId: 20,
      docDate: 14,
      deliveryDate: 14,
      deliveryStatus: 18,
      customerName: 50,
      orderType: 16,
      productionType: 18,
      orderQty: 12,
    };
    
    ws["!cols"] = [
      ...allKeys.map((k) => ({ wch: COL_WIDTHS[k] || 14 })),
      // Order Items (6 columns)
      { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 30 },
      // Job Cards (4 columns)
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
      // Sale Orders (3 columns)
      { wch: 15 }, { wch: 15 }, { wch: 25 },
      // Packing (4 columns)
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
      // Sales Deliveries (4 columns)
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
    ];
    
    ws["!rows"] = [
      { hpt: 24 },
      ...allSheetRows.map((r) => ({ hpt: r.isDivider ? 3 : r.isGroup ? 18 : 36 })),
    ];
    
    ws["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: "A2",
      activePane: "bottomLeft",
    };

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Order Entry Report");
    const today = new Date().toLocaleDateString("en-IN").replace(/\//g, "-");
    XLSXStyle.writeFile(wb, `Order_Entry_Report_${today}.xlsx`);
  }

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── print styles ──────────────────────────────────────────────────── */}
      {/* <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .purchase-report-print, .purchase-report-print * { visibility: visible !important; }
          .purchase-report-print { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          .purchase-report-table { overflow: visible !important; height: auto !important; }
          table { width: 100% !important; page-break-inside: auto; font-size: 9pt; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style> */}

      <style>{`
  @media print {
    body * { visibility: hidden !important; }
    .purchase-report-print, .purchase-report-print * { visibility: visible !important; }
    .purchase-report-print { position: absolute; top: 0; left: 0; width: 100%; padding: 0; }

    .no-print { display: none !important; }
    .print-header { display: flex !important; }
    .print-only-inline { display: inline-flex !important; }
    .print-only-block  { display: block !important; }
    .print-hide        { display: none !important; }

    .purchase-report-table {
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
      border: none !important;
    }

    .inward-bar { display: none !important; }
    .inward-pct { display: none !important; }
    .inward-num { display: block !important; width: 100% !important; text-align: right !important; min-width: unset !important; }

    /* hide expand column — no border override so it doesn't bleed */
    .col-expand { display: none !important; width: 0 !important; min-width: 0 !important; max-width: 0 !important; padding: 0 !important; overflow: hidden !important; }

    thead button { display: none !important; }

    table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; font-size: 8pt; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; page-break-after: auto; }

    /* unified border for all cells including th */
    th, td {
       border: 1px solid #374151 !important;  
      padding: 3px 5px !important;
      white-space: normal !important;
      word-break: break-word !important;
    }

    th {
      background-color: #F3F4F6 !important;
      color: #000000 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      border: 1px solid #374151 !important;  /* ← darker border for th */
      outline: 1px solid #374151 !important;
    }

    tr.row-overdue td {
      background-color: #FFF5F5 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    th.col-inward, td.col-inward {
      width: 65px !important;
      min-width: 65px !important;
      max-width: 65px !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      text-align: right !important;
    }

    th.col-inwardtype, td.col-inwardtype {
      width: 55px !important;
      min-width: 55px !important;
      max-width: 55px !important;
      text-align: center !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow: visible !important;
    }

    td.col-qty { text-align: right !important; }

    @page { size: A4 ; margin: 8mm 10mm; }
  }

  @media screen {
    .print-header      { display: none; }
    .print-only-inline { display: none; }
    .print-only-block  { display: none; }
    .print-only        { display: none; }
  }
`}</style>

      <div
        className="p-4 space-y-3 purchase-report-print overflow-y-auto"
        style={{ height: "90vh" }}
      >
        {/* top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white py-0.5 px-2 rounded-lg no-print">
          <h2 className="text-base font-medium text-gray-800">
            Order Entry Report
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportExcel}
              className="h-8 px-3 text-xs border border-green-300 rounded-lg text-green-600 hover:bg-green-50"
            >
              Download Excel
            </button>
            {/* <button
              onClick={() => {
                const today = new Date()
                  .toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace(/\//g, "-");
                const prev = document.title;
                document.title = `Order Entry Report ${today}`;
                window.print();
                document.title = prev; // restore after print
              }}
              className="h-8 px-3 text-xs border border-red-300 rounded-lg text-red-600 hover:bg-red-50"
            >
              Print PDF
            </button> */}
          </div>
        </div>

        {/* print header (visible only in print) */}
        {/* print header — logo left, title centre, date right */}
        <div
          className="print-header items-center justify-between mb-3 pb-2"
          style={{ borderBottom: "2px solid #1E3A5F" }}
        >
          <img
            src={mpLogo}
            alt="Muthu Printers"
            style={{ height: "52px", objectFit: "contain" }}
          />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                fontSize: "16pt",
                fontWeight: "800",
                letterSpacing: "0.1em",
                color: "#1E3A5F",
              }}
            >
              Order Entry Report
            </div>
          </div>
          <div style={{ textAlign: "right", minWidth: "120px" }}>
            <div style={{ fontSize: "8pt", color: "#6B7280" }}>
              {/* Downloaded on */}
            </div>
            <div
              style={{ fontSize: "10pt", fontWeight: "700", color: "#111827" }}
            >
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
        {/* print-only inward type legend */}
        {/* <div
          className="print-only-block mb-2 p-2"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "8pt",
          }}
        >
          <strong style={{ color: "#1E3A5F" }}>Inward Type: </strong>
          {Object.entries(INWARD_SHORT).map(([full, short]) => (
            <span key={short} style={{ marginRight: "16px" }}>
              <strong>{short}</strong> = {full}
            </span>
          ))}
        </div> */}
        {/* summary cards */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 no-print">
          {[
            {
              label: "Total Orders",
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
                  {m.val}
                </p>
              </div>
            </div>
          ))}
        </div> */}

        {/* active filter chips */}
        {Object.keys(colFilters).length > 0 && (
          <div className="flex gap-2 flex-wrap no-print">
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
          className="min-h-10 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl flex items-center px-3 py-2 gap-2 flex-wrap no-print"
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

        {/* ── TABLE ──────────────────────────────────────────────────────────── */}
        <div
          className="border border-gray-400 rounded-xl overflow-auto  purchase-report-table"
          style={{ height: "60vh" }}
        >
          <table
            className="w-full table-fixed border-collapse"
            style={{ width: "1600px" }}
          >
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {/* S.No header */}
                <th
                  style={{ width: "40px", minWidth: "40px" }}
                  className="px-2 py-2.5 text-center text-xs font-medium text-black border-r border-b border-gray-200 select-none"
                >
                  S.No
                </th>
                {/* expand toggle header */}
                <th
                  style={{ width: "32px", minWidth: "32px" }}
                  className="col-expand px-2 border-r border-b border-gray-200"
                />

                {/* {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={(e) => onColDragStart(e, col.key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onColDrop(e, col.key)}
                    style={{ width: col.w, minWidth: col.w }}
                    className={`px-2.5 py-2.5 text-center text-xs font-medium text-black whitespace-nowrap cursor-grab select-none relative border-r border-b border-gray-200 last:border-r-0 
                      ${col.key === "inwardType" ? "col-inwardtype" : ""}
                      ${col.key === "inwardQty" ? "col-inward" : ""}`}
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
                ))} */}
                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={(e) => onColDragStart(e, col.key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onColDrop(e, col.key)}
                    style={{ width: col.w, minWidth: col.w }}
                    className={`px-2.5 py-2.5 text-center text-xs font-medium text-black whitespace-nowrap cursor-grab select-none relative border-r border-b border-gray-200 last:border-r-0 
      ${col.key === "inwardType" ? "col-inwardtype" : ""}
      ${col.key === "inwardQty" ? "col-inward" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="flex-1">
                        {/* screen: full label | print: short label */}
                        <span className="print-hide">{col.label}</span>
                        {col.key === "inwardType" && (
                          <span className="print-only-inline">Inw Type</span>
                        )}
                        {col.key !== "inwardType" && (
                          <span className="print-only-inline">{col.label}</span>
                        )}
                        {sortKey === col.key && (
                          <span className="text-indigo-500 ml-1 print-hide">
                            {sortDir === 1 ? "↑" : "↓"}
                          </span>
                        )}
                        {colFilters[col.key] && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 ml-1 align-middle print-hide" />
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

        {/* ── pagination + footer ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3 text-xs text-gray-600 no-print">
          <span>
            Showing{" "}
            {apiData?.totalCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
            {Math.min(safePage * PAGE_SIZE, apiData?.totalCount || 0)} of{" "}
            {apiData?.totalCount || 0} records
            {filtered.length < allData.length &&
              ` (filtered from ${allData.length})`}
          </span>

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
    </>
  );
}

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import Logo from "../../../assets/mplogo.png";
import moment from "moment";
import { findFromList, formatCurrencyAmount } from "../../../Utils/helper";
import { numberToWords } from "number-to-words";
const BORDER_LIGHT = "#ddd";
const LIGHT_BG = "#fafafa";
const DARK = "#1a1a2e";
const DARK2 = "#2d2d44";
// ─── COLOR PALETTE ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  borderBox: { border: "1 solid #ccc", margin: 0, padding: 0 },
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    padding: 0,
    paddingBottom: 60,
    backgroundColor: "#fff",
  },

  // ── TOP ACCENT BAR ──
  topBar: { height: 4, backgroundColor: "#1a1a2e" },

  // ── HEADER ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottom: "1.5 solid #1a1a2e",
  },
  logo: { height: 52, width: 52 },
  companyLeft: { width: 140, alignItems: "flex-start" },
  companyCenter: { alignItems: "center", flex: 1 },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
    letterSpacing: 0.5,
  },
  companyRight: { width: 140, alignItems: "flex-start" },
  companyRightRow: { flexDirection: "row", marginBottom: 2, width: "100%" },
  companyLabel: { fontSize: 7.5, color: "#888", width: 38 },
  companyColon: { fontSize: 7.5, color: "#888", width: 8 },
  companyValue: {
    fontSize: 7.5,
    color: "#1a1a2e",
    fontWeight: "bold",
    flex: 1,
  },

  titleBand: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 3,
    paddingVertical: 6,
    marginBottom: 10,
  },

  // ── META PILLS ──
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 6,
  },
  metaPill: {
    flexDirection: "row",
    backgroundColor: "#f4f4f6",
    border: "1 solid #ddd",
    borderLeft: "2 solid #1a1a2e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  metaLabel: { fontSize: 7.5, color: "#888", marginRight: 3 },
  metaValue: { fontSize: 7.5, fontWeight: "bold", color: "#1a1a2e" },

  // ── FROM / TO SECTION ──
  twoCol: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 10,
    border: "1 solid #ddd",
    borderRadius: 3,
  },
  colHalf: { flex: 1 },
  sectionHeader: {
    backgroundColor: "#2d2d44",
    color: "#e8e8f0",
    fontSize: 7.5,
    fontWeight: "bold",
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionBody: { padding: 8 },
  partyName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 3,
  },
  partyAddr: {
    fontSize: 7.5,
    color: "#555",
    textTransform: "uppercase",
    marginBottom: 4,
    lineHeight: 1.5,
  },
  partyRow: { flexDirection: "row", marginBottom: 1.5 },
  partyLabel: { fontSize: 7.5, color: "#888", width: 58 },
  partyValue: { fontSize: 7.5, color: "#222", fontWeight: "bold" },
  // ── EXPORT DETAILS GRID ──
  exportGrid: {
    marginHorizontal: 20,
    marginBottom: 8,
    border: `1 solid ${BORDER_LIGHT}`,
    borderRadius: 3,
    flexDirection: "row",
    backgroundColor: LIGHT_BG,
  },
  exportCol: { flex: 1, padding: 8, borderRight: `1 solid ${BORDER_LIGHT}` },
  exportItem: { flexDirection: "row", marginBottom: 4 },
  exportLabel: { fontSize: 7.5, color: "#888", width: 88 },
  exportValue: {
    fontSize: 7.5,
    color: DARK,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },

  // ── ORDER DETAILS BOX ──
  detailsGrid: {
    marginHorizontal: 20,
    marginBottom: 10,
    border: "1 solid #ddd",
    borderRadius: 3,
    flexDirection: "row",
    backgroundColor: "#fafafa",
  },
  detailsCol: { flex: 1, padding: 8, borderRight: "1 solid #ddd" },
  detailsItem: { flexDirection: "row", marginBottom: 4 },
  detailsLabel: { fontSize: 7.5, color: "#888", width: 80 },
  detailsValue: { fontSize: 7.5, color: "#1a1a2e", fontWeight: "bold" },

  // ── TABLE ──
  tableWrap: { marginHorizontal: 20, border: "1 solid #b0b0b8" },
  tableHeader: { flexDirection: "row", backgroundColor: "#1a1a2e" },
  th: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    borderRight: "1 solid #4a4a60",
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  trOdd: {
    flexDirection: "row",
    borderBottom: "1 solid #c8c8d0",
    backgroundColor: "#fff",
  },
  trEven: {
    flexDirection: "row",
    borderBottom: "1 solid #c8c8d0",
    backgroundColor: "#fafafa",
  },
  td: {
    fontSize: 7.5,
    color: "#333",
    textAlign: "center",
    borderRight: "1 solid #c8c8d0",
    paddingVertical: 4,
    paddingHorizontal: 3,
  },

  // ── REQUIREMENTS SECTION ──
  requirementsBox: {
    marginHorizontal: 20,
    marginBottom: 10,
    border: "1 solid #ddd",
    borderRadius: 3,
  },
  requirementsBody: {
    padding: 10,
    fontSize: 8,
    lineHeight: 1.5,
    color: "#333",
    minHeight: 40,
  },

  // ── FOOTER BAR ──
  footerBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
  },
  footerRight: {
    textAlign: "center",
    fontSize: 8,
    color: "#1a1a2e",
    fontWeight: "bold",
  },
  // ── AMOUNT IN WORDS ──
  wordsBar: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: "#f8f8f9",
    padding: 6,
    border: "1 solid #ddd",
    borderRadius: 3,
  },
  wordsText: { fontSize: 7.5, color: "#555" },
  wordsValue: { fontWeight: "bold", color: "#1a1a2e" },
  summaryRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: "#888",
    textAlign: "right",
    flex: 1,
  },
  summaryColon: {
    fontSize: 7.5,
    color: "#888",
    width: 8,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 7.5,
    color: "#1a1a2e",
    fontWeight: "bold",
    width: 65,
    textAlign: "right",
  },
});

// ── TABLE COLUMNS ─────────────────────────────────────────────────────────────
const getColumns = (isExport) => [
  { label: "S.No", flex: 0.4 },
  { label: "Description of Goods", flex: 2.5 },
  { label: "Item Sub Group", flex: 1.2 },
  { label: "Item Group", flex: 1.2 },
  { label: "HSN", flex: 0.8 },
  { label: "UOM", flex: 0.7 },

  { label: "Order Qty", flex: 0.9 },
  { label: "Price", flex: 0.9 },
  ...(!isExport ? [{ label: "Tax %", flex: 0.7 }] : []),
  { label: "Gross", flex: 1.2 },
];

const ROWS_PAGE_1 = 10;
const ROWS_PAGE_CONT = 22;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const forceWrap = (text) => {
  if (typeof text !== "string") return text || "";
  return text
    .split(" ")
    .map((word) => {
      if (word.length > 20) {
        return word.match(/.{1,20}/g).join("\n");
      }
      return word;
    })
    .join(" ");
};

const chunkItems = (items) => {
  const pages = [];
  let rem = [...items];
  pages.push(rem.splice(0, ROWS_PAGE_1));
  while (rem.length > 0) pages.push(rem.splice(0, ROWS_PAGE_CONT));
  return pages;
};

const TableHeader = ({ isExport, currencySymbol }) => {
  const cols = getColumns(isExport);
  return (
    <View style={styles.tableHeader}>
      {cols.map(({ label, flex }, i) => (
        <Text
          key={label}
          style={[
            styles.th,
            { flex },
            i === cols.length - 1 && { borderRight: "none" },
          ]}
        >
          {label === "Price" && currencySymbol
            ? `Price (${currencySymbol})`
            : label === "Gross" && currencySymbol
              ? `Gross (${currencySymbol})`
              : label}
        </Text>
      ))}
    </View>
  );
};

const ContinuationBar = ({ docId, branchName }) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#1a1a2e",
      paddingHorizontal: 20,
      paddingVertical: 6,
    }}
  >
    <Text
      style={{
        fontSize: 9,
        fontWeight: "bold",
        color: "#fff",
        letterSpacing: 2,
      }}
    >
      ORDER ENTRY — Continued
    </Text>
    <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.7)" }}>
      Order No: {docId} | {branchName}
    </Text>
  </View>
);

// ── COMPONENT ─────────────────────────────────────────────────────────────────
const OrderEntryPrintFormat = ({
  data,
  customerDetails,
  branchData,
  qrCodeDataUrl,
  styleItemList,
  sizeList,
  uomList,
  itemGroupList,
  itemSubGroupList,
  hsnList,
  totals,
  discountType,
  currencyCode,
  isCurrencySymbol,
  isCustomerExport: isExportProp,
  cityList,
}) => {
  if (!data) return null;

  const isExport = isExportProp ?? data?.customer?.isCustomerExport ?? false;
  let currencySymbol = isCurrencySymbol || currencyCode || "";
  if (currencySymbol.includes("₹")) currencySymbol = currencySymbol.replace("₹", "Rs.");
  const loadingPort =
    findFromList(data?.loadingId, cityList?.data, "name") || "";
  const deliveryPort =
    findFromList(data?.deliveryId, cityList?.data, "name") || "";
  const taxSlabBreakup = (totals?.slabBreakup || []).filter(
    (s) => (s.amount || 0) > 0,
  );

  const consolidatedTaxSlabs = (() => {
    const gstMap = {};
    const others = [];
    taxSlabBreakup.forEach((slab) => {
      const cgstMatch = slab.tax.match(/^CGST\s+([\d.]+)%$/i);
      const sgstMatch = slab.tax.match(/^SGST\s+([\d.]+)%$/i);
      const igstMatch = slab.tax.match(/^IGST\s+([\d.]+)%$/i);

      if (cgstMatch || sgstMatch) {
        const rate = parseFloat((cgstMatch || sgstMatch)[1]);
        const totalRate = rate * 2;
        const key = `GST @${totalRate}%`;
        if (!gstMap[key]) {
          gstMap[key] = { tax: key, amount: 0, order: totalRate };
        }
        gstMap[key].amount += slab.amount;
      } else if (igstMatch) {
        const rate = parseFloat(igstMatch[1]);
        const key = `IGST @${rate}%`;
        if (!gstMap[key]) {
          gstMap[key] = { tax: key, amount: 0, order: rate };
        }
        gstMap[key].amount += slab.amount;
      } else {
        others.push(slab);
      }
    });

    const combined = Object.values(gstMap).sort((a, b) => a.order - b.order);
    return [...combined, ...others];
  })();

  const taxableTotal = totals?.taxable || 0;

  const carriageCharge = parseFloat(data?.carriageCharge) || 0;
  const grandTotalExport = taxableTotal + carriageCharge;
  const netAmountDomestic = (totals?.net || 0) + carriageCharge;

  const orderItems = (data?.orderItems || []).filter(
    (item) => item.styleItemId,
  );

  // ── Grand total ──
  const totalOrderQty = orderItems.reduce(
    (s, r) => s + (parseFloat(r.orderQty) || 0),
    0,
  );
  const totalPrice = orderItems.reduce(
    (s, r) => s + (parseFloat(r.price) || 0),
    0,
  );

  // ── Pagination ──
  const pageChunks = chunkItems(orderItems);
  const pageOffsets = pageChunks.reduce((acc, chunk, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + pageChunks[i - 1].length);
    return acc;
  }, []);

  // If no items, render a single empty page
  const renderChunks = pageChunks.length === 0 ? [[]] : pageChunks;

  // ── Helper: build size breakup label lines ──
  const getSizeBreakupText = (row) => {
    const breakup = row?.sizeBreakup?.filter((sb) => (Number(sb.qty) || 0) > 0);
    if (!breakup || breakup.length === 0) return null;

    return breakup
      .map((sb) => {
        const size = findFromList(sb.sizeId, sizeList?.data, "name");
        const qty = Number(sb.qty);

        return `${size || "All"}: ${qty}`;
      })
      .filter(Boolean)
      .join("  |  ");
  };

  return (
    <Document>
      {renderChunks.map((chunkRows, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === renderChunks.length - 1;
        const globalOffset = pageOffsets[pageIndex] || 0;
        const minRows = isFirstPage ? ROWS_PAGE_1 : ROWS_PAGE_CONT;
        const emptyCount = Math.max(0, minRows - chunkRows.length);

        return (
          <Page key={pageIndex} size="A4" style={styles.borderBox}>
            <View style={styles.page}>
              {isFirstPage ? (
                <>
                  {/* ── FULL HEADER ── */}
                  <View style={styles.header}>
                    <View style={styles.companyLeft}>
                      <Image src={Logo} style={styles.logo} />
                    </View>
                    <View style={styles.companyCenter}>
                      <Text style={styles.companyName}>
                        {branchData?.branchName || "MUTHU PRINTERS"}
                      </Text>
                      <Text style={styles.companyAddress}>
                        {branchData?.address || ""}
                      </Text>
                      {branchData?.contactEmail ? (
                        <Text
                          style={{ fontSize: 7.5, color: "#555", marginTop: 1 }}
                        >
                          {branchData.contactEmail}
                          {branchData?.contactMobile
                            ? `  |  ${branchData.contactMobile}`
                            : ""}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ width: 60 }} />
                  </View>

                  {/* TITLE BAND */}
                  <Text style={styles.titleBand}>ORDER ENTRY</Text>

                  {/* META PILLS */}
                  <View style={styles.metaRow}>
                    {[
                      { label: "Order No", value: data?.docId },
                      {
                        label: "Order Date",
                        value: moment(data?.docDate).format("DD-MM-YYYY"),
                      },
                      { label: "Order Type", value: data?.orderType },
                      { label: "Production Type", value: data?.productionType },

                      {
                        label: "Delivery Date",
                        value: moment(data?.deliveryDate).format("DD-MM-YYYY"),
                      },
                    ].map(({ label, value }) => (
                      <View key={label} style={styles.metaPill}>
                        <Text style={styles.metaLabel}>{label}:</Text>
                        <Text style={styles.metaValue}>{value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* FROM / TO */}
                  <View style={styles.twoCol}>
                    {/* FROM */}
                    <View
                      style={[styles.colHalf, { borderRight: "1 solid #ddd" }]}
                    >
                      <Text style={styles.sectionHeader}>FROM</Text>
                      <View style={styles.sectionBody}>
                        <Text style={styles.partyName}>
                          {branchData?.branchName || "MUTHU PRINTERS"}
                        </Text>
                        <Text style={styles.partyAddr}>
                          {branchData?.address || ""}
                        </Text>
                        {[
                          {
                            label: "Mobile No",
                            value: branchData?.contactMobile,
                          },
                          { label: "GST No", value: branchData?.gstNo },
                          { label: "Email", value: branchData?.contactEmail },
                        ].map(({ label, value }) =>
                          value ? (
                            <View key={label} style={styles.partyRow}>
                              <Text style={styles.partyLabel}>{label}</Text>
                              <Text style={styles.partyValue}>: {value}</Text>
                            </View>
                          ) : null,
                        )}
                      </View>
                    </View>
                    {/* TO */}
                    <View style={styles.colHalf}>
                      <Text style={styles.sectionHeader}>CUSTOMER DETAILS</Text>
                      <View style={styles.sectionBody}>
                        <Text style={styles.partyName}>
                          {customerDetails?.name || "N/A"}
                        </Text>
                        <Text style={styles.partyAddr}>
                          {customerDetails?.address || ""}
                        </Text>
                        {[
                          {
                            label: "Contact Person",
                            value: customerDetails?.contactPersonName,
                          },
                          {
                            label: "Mobile No",
                            value: customerDetails?.contactNumber,
                          },
                          { label: "GST No", value: customerDetails?.gstNo },
                        ].map(({ label, value }) =>
                          value ? (
                            <View key={label} style={styles.partyRow}>
                              <Text style={styles.partyLabel}>{label}</Text>
                              <Text style={styles.partyValue}>: {value}</Text>
                            </View>
                          ) : null,
                        )}
                      </View>
                    </View>
                  </View>

                  {isExport && (
                    <View style={styles.exportGrid}>
                      <View style={styles.exportCol}>
                        <View style={styles.exportItem}>
                          <Text style={styles.exportLabel}>
                            Country of Origin
                          </Text>
                          <Text style={styles.exportValue}>: INDIA</Text>
                        </View>
                        <View style={styles.exportItem}>
                          <Text style={styles.exportLabel}>
                            Port of Loading
                          </Text>
                          <Text style={styles.exportValue}>
                            : {loadingPort || "—"}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.exportCol, { borderRight: "none" }]}>
                        <View style={styles.exportItem}>
                          <Text style={styles.exportLabel}>
                            Port of Delivery
                          </Text>
                          <Text style={styles.exportValue}>
                            : {deliveryPort || "—"}
                          </Text>
                        </View>
                        <View style={styles.exportItem}>
                          <Text style={styles.exportLabel}>Weight (KG)</Text>
                          <Text style={styles.exportValue}>
                            :{" "}
                            {data?.weightInKg
                              ? parseFloat(data.weightInKg).toFixed(3)
                              : "—"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <ContinuationBar
                  docId={data?.docId}
                  branchName={branchData?.branchName || ""}
                />
              )}

              {/* ── TABLE ── */}
              <View style={styles.tableWrap}>
                <TableHeader
                  isExport={isExport}
                  currencySymbol={currencySymbol}
                />

                {/* Item rows */}
                {chunkRows.map((row, index) => {
                  const rowStyle =
                    index % 2 === 0 ? styles.trOdd : styles.trEven;
                  const breakupText = getSizeBreakupText(row);
                  return (
                    <View
                      key={globalOffset + index}
                      style={rowStyle}
                      wrap={false}
                    >
                      {/* S.No */}
                      <Text style={[styles.td, { flex: 0.4 }]}>
                        {globalOffset + index + 1}
                      </Text>

                      {/* Description + size breakup inline */}
                      <View
                        style={[
                          styles.td,
                          {
                            flex: 2.5,
                            textAlign: "left",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 7.5,
                            fontWeight: "bold",
                            color: "#1a1a2e",
                          }}
                        >
                          {forceWrap(
                            row?.StyleItem?.name ||
                              findFromList(
                                row.styleItemId,
                                styleItemList?.data,
                                "name",
                              ),
                          )}
                        </Text>
                        {breakupText ? (
                          <Text
                            style={{
                              fontSize: 6.5,
                              color: "#555",
                              marginTop: 2,
                            }}
                          >
                            {breakupText}
                          </Text>
                        ) : null}
                      </View>

                      {/* Item Sub Group */}
                      <Text
                        style={[styles.td, { flex: 1.2, textAlign: "left" }]}
                      >
                        {forceWrap(
                          row?.ItemSubGroup?.name ||
                            findFromList(
                              row.itemSubGroupId,
                              itemSubGroupList?.data,
                              "name",
                            ),
                        )}
                      </Text>
                      {/* Item Group */}
                      <Text
                        style={[styles.td, { flex: 1.2, textAlign: "left" }]}
                      >
                        {forceWrap(
                          row?.ItemGroup?.name ||
                            findFromList(
                              row.itemGroupId,
                              itemGroupList?.data,
                              "name",
                            ),
                        )}
                      </Text>

                      {/* HSN */}
                      <Text style={[styles.td, { flex: 0.8 }]}>
                        {row?.Hsn?.name ||
                          findFromList(row.hsnId, hsnList?.data, "name")}
                      </Text>
                      {/* UOM */}
                      <Text
                        style={[styles.td, { flex: 0.7, textAlign: "left" }]}
                      >
                        {row?.Uom?.name ||
                          findFromList(row.uomId, uomList?.data, "name")}
                      </Text>
                      {/* Order Qty */}
                      <Text
                        style={[styles.td, { flex: 0.9, textAlign: "right" }]}
                      >
                        {row?.orderQty
                          ? parseFloat(row.orderQty).toFixed(2)
                          : ""}
                      </Text>
                      {/* Price */}
                      <Text
                        style={[styles.td, { flex: 0.9, textAlign: "right" }]}
                      >
                        {row?.price
                          ? `${currencySymbol} ${formatCurrencyAmount(row.price)}`
                          : ""}
                      </Text>

                      {!isExport && (
                        <Text
                          style={[styles.td, { flex: 0.7, textAlign: "right" }]}
                        >
                          {row?.taxPercent
                            ? `${parseFloat(row.taxPercent).toFixed(1)}%`
                            : ""}
                        </Text>
                      )}

                      {/* Gross */}
                      <Text
                        style={[
                          styles.td,
                          {
                            flex: 1.2,
                            textAlign: "right",
                            borderRight: "none",
                          },
                        ]}
                      >
                        {row?.amount
                          ? `${currencySymbol} ${formatCurrencyAmount(row.amount)}`
                          : ""}
                      </Text>
                    </View>
                  );
                })}

                {/* Empty filler rows */}
                {Array.from({ length: emptyCount }).map((_, i) => {
                  const rowStyle =
                    (chunkRows.length + i) % 2 === 0
                      ? styles.trOdd
                      : styles.trEven;
                  return (
                    <View key={`empty-${i}`} style={rowStyle}>
                      <Text
                        style={[styles.td, { flex: 0.4, color: "transparent" }]}
                      >
                        {" "}
                      </Text>
                      <Text style={[styles.td, { flex: 2.5 }]}> </Text>
                      <Text style={[styles.td, { flex: 1.2 }]}> </Text>
                      <Text style={[styles.td, { flex: 1.2 }]}> </Text>
                      <Text style={[styles.td, { flex: 0.8 }]}> </Text>
                      <Text style={[styles.td, { flex: 0.7 }]}> </Text>
                      <Text style={[styles.td, { flex: 0.9 }]}> </Text>
                      <Text style={[styles.td, { flex: 0.9 }]}> </Text>
                      {!isExport && (
                        <Text style={[styles.td, { flex: 0.7 }]}> </Text>
                      )}
                      <Text
                        style={[styles.td, { flex: 1.2, borderRight: "none" }]}
                      >
                        {" "}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* ── GRAND TOTAL — last page only ── */}
              {isLastPage && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      marginHorizontal: 20,
                      backgroundColor: "#e8e8ec",
                      borderLeft: "1 solid #b0b0b8",
                      borderRight: "1 solid #b0b0b8",
                      borderBottom: "1 solid #b0b0b8",
                    }}
                  >
                    <Text
                      style={[styles.td, { flex: 0.4, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 2.5,
                          fontWeight: "bold",
                          color: "#1a1a2e",
                          textAlign: "right",
                          paddingRight: 1,
                        },
                      ]}
                    >
                      TOTAL
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1.2, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1.2, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 0.8, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 0.7, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 0.9,
                          fontWeight: "bold",
                          color: "#1a1a2e",
                          textAlign: "right",
                        },
                      ]}
                    >
                      {totalOrderQty.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 0.9,
                          fontWeight: "bold",
                          color: "#1a1a2e",
                          textAlign: "right",
                        },
                      ]}
                    >
                      {totalPrice > 0
                        ? `${currencySymbol} ${formatCurrencyAmount(totalPrice)}`
                        : ""}
                    </Text>
                    {!isExport && (
                      <Text
                        style={[styles.td, { flex: 0.7, color: "transparent" }]}
                      >
                        {" "}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 1.2,
                          fontWeight: "bold",
                          color: "#1a1a2e",
                          textAlign: "right",
                          borderRight: "none",
                        },
                      ]}
                    >
                      {totals?.gross
                        ? `${currencySymbol} ${formatCurrencyAmount(totals.gross, currencyCode)}`
                        : ""}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      marginHorizontal: 20,
                      marginTop: 8,
                      gap: 8,
                      justifyContent: "space-between",
                    }}
                  >
                    {/* CUSTOMER REQUIREMENTS & REMARKS */}
                    <View style={{ flex: 1, gap: 5 }}>
                      {data?.requirements ? (
                        <View
                          style={{ border: "1 solid #ddd", borderRadius: 3 }}
                        >
                          <View
                            style={{
                              backgroundColor: "#2d2d44",
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                            }}
                          >
                            <Text
                              style={{
                                color: "#e8e8f0",
                                fontSize: 7.5,
                                fontWeight: "bold",
                              }}
                            >
                              CUSTOMER REQUIREMENTS
                            </Text>
                          </View>
                          <View style={styles.requirementsBody}>
                            <Text>{data.requirements}</Text>
                          </View>
                        </View>
                      ) : null}

                      {data?.remarks ? (
                        <View
                          style={{
                            border: "1 solid #ddd",
                            borderRadius: 3,
                            backgroundColor: "#f8f8f9",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: "#2d2d44",
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                            }}
                          >
                            <Text
                              style={{
                                color: "#e8e8f0",
                                fontSize: 7.5,
                                fontWeight: "bold",
                              }}
                            >
                              REMARKS
                            </Text>
                          </View>
                          <View style={styles.sectionBody}>
                            <Text style={{ fontSize: 7.5, color: "#555" }}>
                              {data.remarks}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    {/* SUMMARY */}
                    <View
                      style={{
                        width: "45%",
                        border: "1 solid #ddd",
                        borderRadius: 3,
                      }}
                    >
                      <Text
                        style={[styles.sectionHeader, { textAlign: "center" }]}
                      >
                        SUMMARY
                      </Text>
                      <View style={{ padding: 8 }}>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Gross Amount</Text>
                          <Text style={styles.summaryColon}>:</Text>
                          <Text style={styles.summaryValue}>
                            {currencySymbol}{" "}
                            {formatCurrencyAmount(
                              totals?.gross || 0,
                              currencyCode,
                            )}
                          </Text>
                        </View>
                        {(totals?.itemDiscount > 0 ||
                          totals?.overallDiscount > 0) && (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              Total Discount
                            </Text>
                            <Text style={styles.summaryColon}>:</Text>
                            <Text style={styles.summaryValue}>
                              {currencySymbol}{" "}
                              {formatCurrencyAmount(
                                (totals?.itemDiscount || 0) +
                                  (totals?.overallDiscount || 0),
                                currencyCode,
                              )}
                            </Text>
                          </View>
                        )}
                        {((!isExport && totals?.discountValue > 0) ||
                          isExport) && (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              {isExport ? "Net Amount" : "Taxable Amount"}
                            </Text>
                            <Text style={styles.summaryColon}>:</Text>
                            <Text style={styles.summaryValue}>
                              {currencySymbol}{" "}
                              {formatCurrencyAmount(taxableTotal, currencyCode)}
                            </Text>
                          </View>
                        )}
                        {!isExport &&
                          consolidatedTaxSlabs.map((slab) => (
                            <View key={slab.tax} style={styles.summaryRow}>
                              <Text style={styles.summaryLabel}>
                                {slab.tax}
                              </Text>
                              <Text style={styles.summaryColon}>:</Text>
                              <Text style={styles.summaryValue}>
                                {currencySymbol}{" "}
                                {formatCurrencyAmount(
                                  slab.amount || 0,
                                  currencyCode,
                                )}
                              </Text>
                            </View>
                          ))}
                        {carriageCharge > 0 && (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              Carriage & Air Freight
                            </Text>
                            <Text style={styles.summaryColon}>:</Text>
                            <Text style={styles.summaryValue}>
                              {currencySymbol}{" "}
                              {formatCurrencyAmount(
                                carriageCharge,
                                currencyCode,
                              )}
                            </Text>
                          </View>
                        )}
                        {!isExport &&
                          totals?.roundOff !== 0 &&
                          totals?.roundOff !== undefined && (
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryLabel}>Round Off</Text>
                              <Text style={styles.summaryColon}>:</Text>
                              <Text style={styles.summaryValue}>
                                {totals?.roundOff > 0 ? "+" : ""}{" "}
                                {currencySymbol}{" "}
                                {formatCurrencyAmount(
                                  Math.abs(totals?.roundOff || 0),
                                  currencyCode,
                                )}
                              </Text>
                            </View>
                          )}
                        <View
                          style={[
                            styles.summaryRow,
                            {
                              backgroundColor: "#1a1a2e",
                              borderBottom: "none",
                              borderRadius: 2,
                              marginTop: "auto",
                              paddingTop: 4,
                              paddingBottom: 4,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.summaryLabel,
                              {
                                fontWeight: "bold",
                                color: "#ccc",
                                marginLeft: 4,
                              },
                            ]}
                          >
                            {isExport ? "Grand Total" : "Net Amount"}
                          </Text>
                          <Text
                            style={[styles.summaryColon, { color: "#ccc" }]}
                          >
                            :
                          </Text>
                          <Text
                            style={[
                              styles.summaryValue,
                              { fontSize: 9, color: "#fff" },
                            ]}
                          >
                            {currencySymbol}{" "}
                            {formatCurrencyAmount(
                              isExport ? grandTotalExport : netAmountDomestic,
                              currencyCode,
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {(isExport ? grandTotalExport : netAmountDomestic) > 0 && (
                    <View style={styles.wordsBar}>
                      <Text style={styles.wordsText}>
                        Amount in Words (
                        {(currencyCode || currencySymbol || "").trim()}
                        ):{" "}
                        <Text style={styles.wordsValue}>
                          {numberToWords
                            .toWords(
                              Math.round(
                                isExport ? grandTotalExport : netAmountDomestic,
                              ),
                            )
                            .replace(/\b\w/g, (c) => c.toUpperCase()) + " Only"}
                        </Text>
                      </Text>
                    </View>
                  )}

                  {/* Spacer to reserve space for the fixed absolute signature block at the bottom */}
                  <View style={{ height: 80 }} />
                </>
              )}
            </View>

            {/* ── FOOTER: SIGNATURES (ABSOLUTE BOTTOM) ── */}
            <View
              style={{ position: "absolute", bottom: 40, left: 20, right: 20 }}
              fixed
              render={({ pageNumber, totalPages }) => {
                if (pageNumber === totalPages) {
                  return (
                    <View>
                      <Text
                        style={{
                          textAlign: "right",
                          fontSize: 8,
                          fontWeight: "bold",
                          color: "#1a1a2e",
                          marginBottom: 30,
                        }}
                      >
                        For {branchData?.branchName || ""}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          borderTop: "1 solid #ddd",
                          paddingTop: 4,
                        }}
                      >
                        {[
                          "Prepared By",
                          "Checked By",
                          "Approved By",
                          "Customer Sign",
                        ].map((role) => (
                          <Text
                            key={role}
                            style={{
                              flex: 1,
                              textAlign: "center",
                              fontSize: 7.5,
                              color: "#555",
                              fontWeight: "bold",
                            }}
                          >
                            {role}
                          </Text>
                        ))}
                      </View>
                    </View>
                  );
                }
                return null;
              }}
            />

            {/* FOOTER BAR — all pages */}
            <View style={styles.footerBar} fixed>
              <Text
                style={styles.footerRight}
                render={({ pageNumber, totalPages }) =>
                  `Page ${pageNumber} of ${totalPages}`
                }
              />
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default OrderEntryPrintFormat;

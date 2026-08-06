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
const COLUMNS = [
  { label: "S.No", flex: 0.4 },
  { label: "Description of Goods", flex: 2.5 },
  { label: "Item Sub Group", flex: 1.2 },
  { label: "Item Group", flex: 1.2 },
  { label: "HSN", flex: 0.8 },
  { label: "UOM", flex: 0.7 },

  { label: "Order Qty", flex: 0.9 },
  { label: "Price", flex: 0.9 },
  { label: "Tax %", flex: 0.7 },
  { label: "Gross", flex: 1.2 },
];

const ROWS_PAGE_1 = 15;
const ROWS_PAGE_CONT = 22;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const chunkItems = (items) => {
  const pages = [];
  let rem = [...items];
  pages.push(rem.splice(0, ROWS_PAGE_1));
  while (rem.length > 0) pages.push(rem.splice(0, ROWS_PAGE_CONT));
  return pages;
};

const TableHeader = () => (
  <View style={styles.tableHeader}>
    {COLUMNS.map(({ label, flex }, i) => (
      <Text
        key={label}
        style={[
          styles.th,
          { flex },
          i === COLUMNS.length - 1 && { borderRight: "none" },
        ]}
      >
        {label}
      </Text>
    ))}
  </View>
);

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
}) => {
  if (!data) return null;

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
  const carriageCharge = parseFloat(data?.carriageCharge) || 0;
  const finalNetAmount = (totals?.net || 0) + carriageCharge;

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
    const breakup = row.sizeBreakup?.filter((sb) => (Number(sb.qty) || 0) > 0);
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
              {/* TOP ACCENT BAR */}
              <View style={styles.topBar} />

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
                    </View>
                    <View style={styles.companyRight}>
                      {qrCodeDataUrl && (
                        <View
                          style={{
                            border: "none",
                            width: 60,
                            height: 60,
                            marginTop: 5,
                            alignSelf: "flex-end",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Image
                            src={qrCodeDataUrl}
                            style={{ width: 50, height: 50 }}
                          />
                        </View>
                      )}
                    </View>
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
                      ...(parseFloat(data?.carriageCharge) > 0
                        ? [
                            {
                              label: "Carriage Charge",
                              value: data?.carriageCharge,
                            },
                          ]
                        : []),
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
                </>
              ) : (
                <ContinuationBar
                  docId={data?.docId}
                  branchName={branchData?.branchName || ""}
                />
              )}

              {/* ── TABLE ── */}
              <View style={styles.tableWrap}>
                <TableHeader />

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
                          {row?.StyleItem?.name ||
                            findFromList(
                              row.styleItemId,
                              styleItemList?.data,
                              "name",
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
                        {row?.ItemSubGroup?.name ||
                          findFromList(
                            row.itemSubGroupId,
                            itemSubGroupList?.data,
                            "name",
                          )}
                      </Text>
                      {/* Item Group */}
                      <Text
                        style={[styles.td, { flex: 1.2, textAlign: "left" }]}
                      >
                        {row?.ItemGroup?.name ||
                          findFromList(
                            row.itemGroupId,
                            itemGroupList?.data,
                            "name",
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
                        {row?.price ? formatCurrencyAmount(row.price) : ""}
                      </Text>

                      {/* Tax % */}
                      <Text
                        style={[styles.td, { flex: 0.7, textAlign: "right" }]}
                      >
                        {row?.taxPercent
                          ? `${parseFloat(row.taxPercent).toFixed(1)}%`
                          : ""}
                      </Text>

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
                        {row?.amount ? formatCurrencyAmount(row.amount) : ""}
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
                      <Text style={[styles.td, { flex: 0.7 }]}> </Text>
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
                      {totalPrice > 0 ? formatCurrencyAmount(totalPrice) : ""}
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
                          flex: 1.2,
                          fontWeight: "bold",
                          color: "#1a1a2e",
                          textAlign: "right",
                          borderRight: "none",
                        },
                      ]}
                    >
                      {totals?.gross
                        ? formatCurrencyAmount(totals.gross, currencyCode)
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
                      <View style={{ border: "1 solid #ddd", borderRadius: 3 }}>
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
                          <Text>
                            {data?.requirements ||
                              "No specific requirements mentioned."}
                          </Text>
                        </View>
                      </View>
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
                            {data?.remarks || ""}
                          </Text>
                        </View>
                      </View>
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
                          <Text style={styles.summaryLabel}>Total Qty</Text>
                          <Text style={styles.summaryColon}>:</Text>
                          <Text style={styles.summaryValue}>
                            {Number(totalOrderQty).toFixed(3)}
                          </Text>
                        </View>
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Gross Amount</Text>
                          <Text style={styles.summaryColon}>:</Text>
                          <Text style={styles.summaryValue}>
                            {currencyCode || ""}{" "}
                            {formatCurrencyAmount(
                              totals?.gross || 0,
                              currencyCode,
                            )}
                          </Text>
                        </View>
                        {(totals?.itemDiscount || 0) +
                          (totals?.overallDiscount || 0) >
                          0 && (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              Total Discount
                            </Text>
                            <Text style={styles.summaryColon}>:</Text>
                            <Text style={styles.summaryValue}>
                              {currencyCode || ""}{" "}
                              {formatCurrencyAmount(
                                (totals?.itemDiscount || 0) +
                                  (totals?.overallDiscount || 0),
                                currencyCode,
                              )}
                            </Text>
                          </View>
                        )}
                        {totals?.taxable > 0 && (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              Taxable Amount
                            </Text>
                            <Text style={styles.summaryColon}>:</Text>
                            <Text style={styles.summaryValue}>
                              {currencyCode || ""}{" "}
                              {formatCurrencyAmount(
                                totals.taxable,
                                currencyCode,
                              )}
                            </Text>
                          </View>
                        )}
                        {totals?.slabBreakup
                          ?.filter((slab) => (slab.amount || 0) > 0)
                          .map((slab) => (
                            <View key={slab.tax} style={styles.summaryRow}>
                              <Text style={styles.summaryLabel}>
                                {slab.tax}
                              </Text>
                              <Text style={styles.summaryColon}>:</Text>
                              <Text style={styles.summaryValue}>
                                {currencyCode || ""}{" "}
                                {formatCurrencyAmount(
                                  slab.amount || 0,
                                  currencyCode,
                                )}
                              </Text>
                            </View>
                          ))}
                        {parseFloat(data?.carriageCharge || 0) > 0 && (
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                              Carriage Charge
                            </Text>
                            <Text style={styles.summaryColon}>:</Text>
                            <Text style={styles.summaryValue}>
                              {currencyCode || ""}{" "}
                              {formatCurrencyAmount(
                                data.carriageCharge,
                                currencyCode,
                              )}
                            </Text>
                          </View>
                        )}
                        {totals?.roundOff !== 0 &&
                          totals?.roundOff !== undefined && (
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryLabel}>Round Off</Text>
                              <Text style={styles.summaryColon}>:</Text>
                              <Text style={styles.summaryValue}>
                                {totals?.roundOff > 0 ? "+" : ""}{" "}
                                {currencyCode || ""}{" "}
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
                            Net Amount
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
                            {currencyCode || ""}{" "}
                            {formatCurrencyAmount(finalNetAmount, currencyCode)}
                          </Text>
                        </View>
                        {finalNetAmount > 0 && (
                          <View
                            style={{
                              marginTop: 6,
                              paddingTop: 4,
                              borderTop: "1 solid #ddd",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 7,
                                fontStyle: "italic",
                                color: "#555",
                              }}
                            >
                              Amount in Words:
                            </Text>
                            <Text
                              style={{
                                fontSize: 7.5,
                                fontWeight: "bold",
                                color: "#1a1a2e",
                                marginTop: 2,
                              }}
                            >
                              {numberToWords
                                .toWords(Math.round(finalNetAmount))
                                .replace(/\b\w/g, (c) => c.toUpperCase()) +
                                " Only"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

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
                          marginBottom: 18,
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

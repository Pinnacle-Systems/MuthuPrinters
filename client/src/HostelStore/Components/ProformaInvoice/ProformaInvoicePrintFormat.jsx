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
const DARK = "#1a1a2e";
const DARK2 = "#2d2d44";
const LIGHT_BG = "#fafafa";
const BORDER = "#b0b0b8";
const BORDER_LIGHT = "#ddd";
const BORDER_ROW = "#c8c8d0";

const styles = StyleSheet.create({
  borderBox: { border: `1 solid #ccc`, margin: 0, padding: 0 },
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    padding: 0,
    paddingBottom: 52,
    backgroundColor: "#fff",
  },

  // ── TOP ACCENT BAR ──
  topBar: { height: 4, backgroundColor: DARK },

  // ── HEADER ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottom: `1.5 solid ${DARK}`,
  },
  logo: { height: 52, width: 52 },
  companyCenter: { alignItems: "center", flex: 1 },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: 0.5,
  },
  companyAddress: {
    fontSize: 7.5,
    color: "#555",
    textAlign: "center",
    marginTop: 2,
  },

  titleBand: {
    backgroundColor: DARK,
    color: "#fff",
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 3,
    paddingVertical: 6,
    marginBottom: 8,
  },

  // ── META PILLS ──
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 6,
  },
  metaPill: {
    flexDirection: "row",
    backgroundColor: "#f4f4f6",
    border: `1 solid ${BORDER_LIGHT}`,
    borderLeft: `2 solid ${DARK}`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
  },
  metaLabel: { fontSize: 7.5, color: "#888", marginRight: 3 },
  metaValue: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: DARK },

  // ── FROM / TO SECTION ──
  twoCol: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 8,
    border: `1 solid ${BORDER_LIGHT}`,
    borderRadius: 3,
  },
  colHalf: { flex: 1 },
  sectionHeader: {
    backgroundColor: DARK2,
    color: "#e8e8f0",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionBody: { padding: 8 },
  partyName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  partyAddr: {
    fontSize: 7.5,
    color: "#555",
    textTransform: "uppercase",
    marginBottom: 4,
    lineHeight: 1.5,
  },
  partyRow: { flexDirection: "row", marginBottom: 2 },
  partyLabel: { fontSize: 7.5, color: "#888", width: 72 },
  partyValue: { fontSize: 7.5, color: "#222", fontFamily: "Helvetica-Bold" },

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

  // ── TABLE ──
  tableWrap: { marginHorizontal: 20, border: `1 solid ${BORDER}` },
  tableHeader: { flexDirection: "row", backgroundColor: DARK },
  th: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    textAlign: "center",
    borderRight: `1 solid #4a4a60`,
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  trOdd: {
    flexDirection: "row",
    borderBottom: `1 solid ${BORDER_ROW}`,
    backgroundColor: "#fff",
  },
  trEven: {
    flexDirection: "row",
    borderBottom: `1 solid ${BORDER_ROW}`,
    backgroundColor: LIGHT_BG,
  },
  td: {
    fontSize: 7.5,
    color: "#333",
    textAlign: "center",
    borderRight: `1 solid ${BORDER_ROW}`,
    paddingVertical: 4,
    paddingHorizontal: 3,
  },

  // ── TOTALS ROW ──
  totalRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#e8e8ec",
    borderLeft: `1 solid ${BORDER}`,
    borderRight: `1 solid ${BORDER}`,
    borderBottom: `1 solid ${BORDER}`,
  },

  // ── PO-STYLE TAX BOX ──
  taxBox: {
    width: 160,
    marginTop: 8,
    marginRight: 20,
    alignSelf: "flex-end",
    border: `1 solid ${BORDER_LIGHT}`,
    borderRadius: 3,
    overflow: "hidden",
  },
  taxHeader: {
    backgroundColor: DARK2,
    color: "#e8e8f0",
    textAlign: "center",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    paddingVertical: 4,
  },
  taxRow: {
    flexDirection: "row",
    borderTop: `1 solid #ebebeb`,
  },
  taxRowNet: {
    flexDirection: "row",
    borderTop: `1 solid ${DARK}`,
    backgroundColor: DARK,
  },
  taxLabel: { flex: 1, fontSize: 7.5, color: "#333", padding: 4 },
  taxValue: {
    fontSize: 7.5,
    color: "#333",
    textAlign: "right",
    padding: 4,
    minWidth: 55,
  },
  taxLabelNet: {
    flex: 1,
    fontSize: 7.5,
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    padding: 4,
  },
  taxValueNet: {
    fontSize: 7.5,
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    padding: 4,
    minWidth: 55,
  },

  // ── BANK + SUMMARY ──
  bankSummaryRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 8,
    gap: 8,
  },
  bankBox: {
    flex: 1,
    border: `1 solid ${BORDER_LIGHT}`,
    borderRadius: 3,
  },
  summaryBox: {
    width: 200,
    border: `1 solid ${BORDER_LIGHT}`,
    borderRadius: 3,
  },
  summaryRow: {
    flexDirection: "row",
    borderBottom: `1 solid ${BORDER_LIGHT}`,
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
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "right",
    width: 55,
  },

  // ── BOTTOM SECTION ──
  bottomSection: {
    marginHorizontal: 20,
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  remarksBox: {
    flex: 1,
    border: `1 solid ${BORDER_LIGHT}`,
    borderRadius: 3,
  },
  termsBox: {
    flex: 2,
    border: `1 solid ${BORDER_LIGHT}`,
    borderRadius: 3,
  },

  // ── FOOTER ──
  footerBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
  },
  footerRight: { fontSize: 8, color: DARK, fontFamily: "Helvetica-Bold" },

  // ── AMOUNT IN WORDS ──
  wordsBar: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: LIGHT_BG,
    padding: 6,
    border: `1 solid ${BORDER_LIGHT}`,
    borderRadius: 3,
  },
  wordsText: { fontSize: 7.5, color: "#555" },
  wordsValue: { fontFamily: "Helvetica-Bold", color: DARK },
});

// ── TABLE COLUMNS ─────────────────────────────────────────────────────────────
// For export: no Tax% or Net Amount columns
// For domestic: include Tax% and Net Amount
const getColumns = (isExport) => [
  { label: "S.No", flex: 0.4 },
  { label: "Description of Goods", flex: 3.8 },
  { label: "Item Sub Group", flex: 1.6 },
  { label: "Item Group", flex: 1.6 },
  { label: "HSN", flex: 1.2 },
  // { label: "UOM", flex: 0.8 },
  { label: "Qty", flex: 0.8 },
  // { label: "Dozen", flex: 0.8 },
  { label: "Price", flex: 1 },
  ...(!isExport ? [{ label: "Tax %", flex: 0.7 }] : []),
  { label: "Gross Amount", flex: 1.2 },
  // Tax% and Net Amount only for domestic
];

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
            : label}
          {label === "Gross Amount" && currencySymbol
            ? `\n(${currencySymbol})`
            : ""}
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
      backgroundColor: DARK,
      paddingHorizontal: 20,
      paddingVertical: 6,
      marginBottom: 2,
    }}
  >
    <Text
      style={{
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: "#fff",
        letterSpacing: 2,
      }}
    >
      PROFORMA INVOICE — Continued
    </Text>
    <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.7)" }}>
      PI No: {docId} | {branchName}
    </Text>
  </View>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const ProformaInvoicePrintFormat = ({
  data,
  taxDetails,
  isCustomerExport: isExportProp,
  cityList,
  currencyList,
  payTermList,
  carriageFinalAmt,
}) => {
  if (!data) return null;
  console.log(data, "data");

  const isExport = isExportProp ?? data?.customer?.isCustomerExport ?? false;
  let currencySymbol =
    findFromList(data?.currencyId, currencyList?.data, "symbol") || "Rs.";
  if (currencySymbol.includes("₹"))
    currencySymbol = currencySymbol.replace("₹", "Rs.");
  const currencyCode =
    findFromList(data?.currencyId, currencyList?.data, "code") || "INR";

  const ROWS_PAGE_1 = isExport ? 6 : 8;
  const ROWS_PAGE_CONT = 18;

  const chunkItems = (items) => {
    const pages = [];
    let rem = [...items];
    pages.push(rem.splice(0, ROWS_PAGE_1));
    while (rem.length > 0) pages.push(rem.splice(0, ROWS_PAGE_CONT));
    return pages;
  };

  const branch = data?.Branch || {};
  const customer = data?.customer || {};
  const bank = data?.Bank || {};

  // Filter only real items
  const allItems = (data?.items || []).filter((i) => i.styleItemId);
  const getSizeBreakupText = (row) => {
    const breakup = row?.pisizeBreakups?.filter(
      (sb) => (Number(sb.qty) || 0) > 0,
    );
    if (!breakup || breakup.length === 0) return null;

    return breakup
      .map((sb) => {
        const size = sb?.Size?.name;
        const qty = Number(sb.qty);

        return `${size || "All"}: ${qty}`;
      })
      .filter(Boolean)
      .join("  |  ");
  };
  // Totals
  const totalQty = allItems?.reduce((s, i) => s + (parseFloat(i?.qty) || 0), 0);
  const totalDozen = allItems?.reduce(
    (s, i) => s + (parseFloat(i?.dozen) || 0),
    0,
  );
  const totalGross = allItems?.reduce(
    (s, i) => s + (parseFloat(i?.amount) || 0),
    0,
  );
  const totalPrice = allItems?.reduce(
    (s, i) => s + (parseFloat(i?.price) || 0),
    0,
  );
  // ── DOMESTIC TAX: per-slab breakup (mirrors PurchaseOrderPrintFormat taxBox) ──
  // Each item carries taxPercent; group by slab, sum taxable + tax amounts
  const taxableTotal = parseFloat(taxDetails?.taxable || 0);

  const carriageCharge = parseFloat(carriageFinalAmt) || 0;
  const grandTotal = isExport ? taxableTotal + carriageCharge : totalGross;

  const totalTaxAmt = parseFloat(taxDetails?.net || 0) - taxableTotal;
  const netAmount = parseFloat(taxDetails?.net || 0);
  const taxSlabBreakup = (taxDetails?.slabBreakup || [])?.filter(
    (s) => (s?.amount || 0) > 0,
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

  const finalAmountForWords = isExport
    ? grandTotal
    : netAmount + carriageCharge;
  const netInt = Math.floor(finalAmountForWords);
  const netDecimal = Math.round((finalAmountForWords - netInt) * 100);
  const amountWords =
    numberToWords
      .toWords(netInt || 0)
      .replace(/,/g, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) +
    (netDecimal > 0
      ? " And " +
        numberToWords
          .toWords(netDecimal)
          .replace(/\b\w/g, (c) => c.toUpperCase()) +
        " Paise"
      : "") +
    " Only";

  const loadingPort =
    findFromList(data?.loadingId, cityList?.data, "name") || "";
  const deliveryPort =
    findFromList(data?.deliveryId, cityList?.data, "name") || "";

  // Pagination
  // const pageChunks = chunkItems(allItems);
  // const renderChunks = pageChunks.length === 0 ? [[]] : pageChunks;
  // Only chunk if items exceed page 1 capacity
  const pageChunks = (() => {
    if (allItems.length === 0) return [[]];
    const pages = [];
    let rem = [...allItems];
    pages.push(rem.splice(0, ROWS_PAGE_1));
    while (rem.length > 0) pages.push(rem.splice(0, ROWS_PAGE_CONT));
    return pages;
  })();

  // Never render a page that has zero real items AND is not page 1
  const renderChunks = pageChunks.filter(
    (chunk, i) => i === 0 || chunk.length > 0,
  );
  const pageOffsets = renderChunks.reduce((acc, chunk, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + renderChunks[i - 1].length);
    return acc;
  }, []);

  const cols = getColumns(isExport);

  return (
    <Document>
      {renderChunks?.map((chunkRows, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === renderChunks.length - 1;
        const globalOffset = pageOffsets[pageIndex] || 0;
        const minRows = isFirstPage ? ROWS_PAGE_1 : ROWS_PAGE_CONT;
        const emptyCount = Math.max(0, minRows - chunkRows.length);

        return (
          <Page key={pageIndex} size="A4" style={styles.borderBox}>
            <View style={styles.page}>
              {/* TOP ACCENT BAR */}
              {/* <View style={styles.topBar} /> */}

              {isFirstPage ? (
                <>
                  {/* ── HEADER ── */}
                  <View style={styles.header}>
                    <View style={{ width: 60 }}>
                      <Image src={Logo} style={styles.logo} />
                    </View>
                    <View style={styles.companyCenter}>
                      <Text style={styles.companyName}>
                        {branch?.branchName || "MUTHU PRINTERS"}
                      </Text>
                      <Text style={styles.companyAddress}>
                        {branch?.address || ""}
                      </Text>
                      {branch?.contactEmail ? (
                        <Text
                          style={{ fontSize: 7.5, color: "#555", marginTop: 1 }}
                        >
                          {branch.contactEmail}
                          {branch?.contactMobile
                            ? `  |  ${branch.contactMobile}`
                            : ""}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ width: 60 }} />
                  </View>

                  {/* TITLE BAND */}
                  <Text style={styles.titleBand}>PROFORMA INVOICE</Text>

                  {/* INTRO TEXT */}
                  <View
                    style={{
                      marginHorizontal: 20,
                      marginBottom: 6,
                      backgroundColor: "#f9f9fb",
                      border: `1 solid ${BORDER_LIGHT}`,
                      borderRadius: 3,
                      padding: 8,
                    }}
                  >
                    {isExport && (
                      <Text
                        style={{
                          fontSize: 7.5,
                          color: DARK,
                          fontFamily: "Helvetica-Bold",
                          marginBottom: 3,
                          letterSpacing: 0.3,
                        }}
                      >
                        Accessories For 100% Export Oriented Ready Made Garments
                        Industry.
                      </Text>
                    )}
                    <Text
                      style={{ fontSize: 7.5, color: "#555", marginBottom: 2 }}
                    >
                      Herewith we are giving our rate quotation for the
                      following items.If you have any questions about the rate
                      quotations, please contact us.
                    </Text>
                  </View>

                  {/* META PILLS */}
                  <View style={styles.metaRow}>
                    {[
                      { label: "PI No", value: data?.docId },
                      {
                        label: "PI Date",
                        value: data?.docDate
                          ? moment(data.docDate).format("DD-MM-YYYY")
                          : "",
                      },
                      {
                        label: "Payment Term",
                        value:
                          findFromList(
                            data?.payTermId,
                            payTermList?.data,
                            "name",
                          ) || "",
                      },
                      {
                        label: "Valid To",
                        value: data?.validityTo
                          ? moment(data.validityTo).format("DD-MM-YYYY")
                          : "",
                      },
                      {
                        label: "Delivery Date",
                        value: data?.deliveryDate
                          ? moment(data.deliveryDate).format("DD-MM-YYYY")
                          : "",
                      },
                      ...(data?.quoteVersion > 1
                        ? [
                            {
                              label: "Revised PI",
                              value: `V${data.quoteVersion}`,
                              valueColor: "red",
                            },
                          ]
                        : []),
                    ].map(({ label, value, valueColor }) => (
                      <View key={label} style={styles.metaPill}>
                        <Text
                          style={[
                            styles.metaLabel,
                            valueColor ? { color: valueColor } : {},
                          ]}
                        >
                          {label}:
                        </Text>
                        <Text
                          style={[
                            styles.metaValue,
                            valueColor ? { color: valueColor } : {},
                          ]}
                        >
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* FROM / TO */}
                  <View style={styles.twoCol}>
                    <View
                      style={[
                        styles.colHalf,
                        { borderRight: `1 solid ${BORDER_LIGHT}` },
                      ]}
                    >
                      <Text style={styles.sectionHeader}>FROM</Text>
                      <View style={styles.sectionBody}>
                        <Text style={styles.partyName}>
                          {branch?.branchName || "MUTHU PRINTERS"}
                        </Text>
                        <Text style={styles.partyAddr}>
                          {branch?.address || ""}
                        </Text>
                        {[
                          { label: "Mobile No", value: branch?.contactMobile },
                          { label: "GST No", value: branch?.company?.gstNo },
                          { label: "Email", value: branch?.contactEmail },
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
                    <View style={styles.colHalf}>
                      <Text style={styles.sectionHeader}>CUSTOMER DETAILS</Text>
                      <View style={styles.sectionBody}>
                        <Text style={styles.partyName}>
                          {customer?.name || "N/A"}
                        </Text>
                        <Text style={styles.partyAddr}>
                          {customer?.address || ""}
                        </Text>
                        {[
                          {
                            label: "Contact Person",
                            value: customer?.contactPersonName,
                          },
                          {
                            label: "Mobile No",
                            value: customer?.contactNumber,
                          },
                          { label: "GST No", value: customer?.gstNo },
                          {
                            label: "Email",
                            value: customer?.contactPersonEmail,
                          },
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

                  {/* EXPORT DETAILS GRID */}
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
                  branchName={branch?.branchName || ""}
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
                  const gross = parseFloat(row.amount) || 0;
                  const taxPct = parseFloat(row.taxPercent) || 0;
                  const netAmt = gross + (gross * taxPct) / 100;
                  const breakupText = getSizeBreakupText(row);

                  return (
                    <View key={globalOffset + index} style={rowStyle}>
                      <Text style={[styles.td, { flex: 0.4 }]}>
                        {globalOffset + index + 1}
                      </Text>
                      <View
                        style={[
                          styles.td,
                          {
                            flex: 3.8,
                            flexDirection: "column",
                            alignItems: "flex-start",
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text style={{ textAlign: "left" }}>
                          {row?.StyleItem?.name || ""}
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
                      <Text
                        style={[styles.td, { flex: 1.6, textAlign: "left" }]}
                      >
                        {row?.ItemSubGroup?.name || ""}
                      </Text>
                      <Text
                        style={[styles.td, { flex: 1.6, textAlign: "left" }]}
                      >
                        {row?.ItemGroup?.name || ""}
                      </Text>
                      <Text
                        style={[styles.td, { flex: 1.2, textAlign: "left" }]}
                      >
                        {row?.Hsn?.name || ""}
                      </Text>
                      {/* <Text
                        style={[styles.td, { flex: 0.8, textAlign: "left" }]}
                      >
                        {row?.Uom?.name || ""}
                      </Text> */}
                      <Text
                        style={[styles.td, { flex: 0.8, textAlign: "right" }]}
                      >
                        {row.qty ? parseFloat(row.qty).toFixed(3) : ""}
                      </Text>
                      {/* <Text
                        style={[styles.td, { flex: 0.8, textAlign: "right" }]}
                      >
                        {row.dozen ? parseFloat(row.dozen).toFixed(2) : ""}
                      </Text> */}
                      <Text
                        style={[styles.td, { flex: 1, textAlign: "right" }]}
                      >
                        {row.price
                          ? `${currencySymbol} ${formatCurrencyAmount(row.price, currencyCode || currencySymbol)}`
                          : ""}
                      </Text>
                      {!isExport && (
                        <>
                          <Text
                            style={[
                              styles.td,
                              { flex: 0.7, textAlign: "right" },
                            ]}
                          >
                            {taxPct ? `${taxPct}%` : ""}
                          </Text>
                        </>
                      )}
                      <Text
                        style={[
                          styles.td,
                          { flex: 1.2, textAlign: "right" },
                          { borderRight: "none" },
                        ]}
                      >
                        {gross
                          ? `${currencySymbol} ${formatCurrencyAmount(gross, currencyCode || currencySymbol)}`
                          : ""}
                      </Text>
                      {/* Tax % and Net Amount — domestic only */}
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
                      {cols.map(({ flex }, ci) => (
                        <Text
                          key={ci}
                          style={[
                            styles.td,
                            { flex },
                            ci === cols.length - 1 && { borderRight: "none" },
                          ]}
                        >
                          {" "}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>

              {/* ── TOTALS ROW ── */}
              {isLastPage && (
                <>
                  {/* Totals bar */}
                  <View style={styles.totalRow}>
                    <Text
                      style={[styles.td, { flex: 0.4, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 3.8,
                          fontFamily: "Helvetica-Bold",
                          color: DARK,
                          textAlign: "right",
                        },
                      ]}
                    >
                      TOTAL
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1.6, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1.6, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1.2, color: "transparent" }]}
                    >
                      {" "}
                    </Text>
                    {/* <Text
                      style={[styles.td, { flex: 0.8, color: "transparent" }]}
                    >
                      {" "}
                    </Text> */}
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 0.8,
                          fontFamily: "Helvetica-Bold",
                          color: DARK,
                          textAlign: "right",
                        },
                      ]}
                    >
                      {totalQty.toFixed(3)}
                    </Text>
                    {/* <Text
                      style={[
                        styles.td,
                        {
                          flex: 0.8,
                          fontFamily: "Helvetica-Bold",
                          color: DARK,
                          textAlign: "right",
                        },
                      ]}
                    >
                      {totalDozen.toFixed(2)}
                    </Text> */}
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 1,
                          fontFamily: "Helvetica-Bold",
                          color: DARK,
                          textAlign: "right",
                        },
                      ]}
                    >
                      {totalPrice > 0
                        ? `${currencySymbol} ${formatCurrencyAmount(totalPrice, currencyCode || currencySymbol)}`
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
                          fontFamily: "Helvetica-Bold",
                          color: DARK,
                          textAlign: "right",
                        },
                        { borderRight: "none" },
                      ]}
                    >
                      {currencySymbol}{" "}
                      {formatCurrencyAmount(
                        totalGross,
                        currencyCode || currencySymbol,
                      )}
                    </Text>
                  </View>

                  {/* ── BOTTOM SECTION: TERMS, REMARKS, SUMMARY ── */}
                  <View style={styles.bankSummaryRow} wrap={false}>
                    {/* LEFT SIDE: TERMS & REMARKS */}
                    <View style={{ flex: 1, flexDirection: "column", gap: 8 }}>
                      {/* TERMS & CONDITIONS */}
                      {data?.termsAndCondition ? (
                        <View
                          style={{
                            border: `1 solid ${BORDER_LIGHT}`,
                            borderRadius: 3,
                          }}
                        >
                          <Text style={styles.sectionHeader}>
                            TERMS &amp; CONDITIONS
                          </Text>
                          <View style={styles.sectionBody}>
                            <Text
                              style={{
                                fontSize: 7.5,
                                color: "#555",
                                lineHeight: 1.5,
                              }}
                            >
                              {data.termsAndCondition}
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      {/* REMARKS */}
                      {data?.remarks ? (
                        <View
                          style={{
                            border: `1 solid ${BORDER_LIGHT}`,
                            borderRadius: 3,
                          }}
                        >
                          <Text style={styles.sectionHeader}>REMARKS</Text>
                          <View style={styles.sectionBody}>
                            <Text style={{ fontSize: 7.5, color: "#555" }}>
                              {data.remarks}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    {/* RIGHT SIDE: SUMMARY */}
                    <View
                      style={{
                        width: "45%",
                        border: `1 solid ${BORDER_LIGHT}`,
                        borderRadius: 3,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Text
                        style={[styles.sectionHeader, { textAlign: "center" }]}
                      >
                        SUMMARY
                      </Text>

                      {(taxDetails?.itemDiscount > 0 ||
                        taxDetails?.overallDiscount > 0) && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>
                            Total Discount
                          </Text>
                          <Text style={styles.summaryColon}>:</Text>
                          <Text style={styles.summaryValue}>
                            {currencySymbol}{" "}
                            {formatCurrencyAmount(
                              (taxDetails?.itemDiscount || 0) +
                                (taxDetails?.overallDiscount || 0),
                              currencyCode || currencySymbol,
                            )}
                          </Text>
                        </View>
                      )}

                      {((!isExport && data?.discountValue > 0) || isExport) && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>
                            {isExport ? "Net Amount" : "Taxable Amount"}
                          </Text>
                          <Text style={styles.summaryColon}>:</Text>
                          <Text style={styles.summaryValue}>
                            {currencySymbol}{" "}
                            {formatCurrencyAmount(
                              taxableTotal,
                              currencyCode || currencySymbol,
                            )}
                          </Text>
                        </View>
                      )}

                      {!isExport &&
                        consolidatedTaxSlabs.map((slab) => (
                          <View key={slab.tax} style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{slab.tax}</Text>
                            <Text style={styles.summaryColon}>:</Text>
                            <Text style={styles.summaryValue}>
                              {currencySymbol}{" "}
                              {formatCurrencyAmount(
                                slab.amount || 0,
                                currencyCode || currencySymbol,
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
                              currencyCode || currencySymbol,
                            )}
                          </Text>
                        </View>
                      )}

                      {!isExport && taxDetails?.roundOff !== 0 && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Round Off</Text>
                          <Text style={styles.summaryColon}>:</Text>
                          <Text style={styles.summaryValue}>
                            {taxDetails?.roundOff > 0 ? "+" : ""}
                            {currencySymbol}{" "}
                            {formatCurrencyAmount(
                              Math.abs(taxDetails?.roundOff || 0),
                              currencyCode || currencySymbol,
                            )}
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          styles.summaryRow,
                          {
                            backgroundColor: DARK,
                            borderBottom: "none",
                            borderRadius: 2,
                            marginTop: "auto",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.summaryLabel,
                            { color: "#ccc", fontFamily: "Helvetica-Bold" },
                          ]}
                        >
                          {isExport ? "Grand Total" : "Net Amount"}
                        </Text>
                        <Text
                          style={[
                            styles.summaryColon,
                            { color: "#ccc", fontFamily: "Helvetica-Bold" },
                          ]}
                        >
                          :
                        </Text>
                        <Text style={[styles.summaryValue, { color: "#fff" }]}>
                          {currencySymbol}{" "}
                          {formatCurrencyAmount(
                            isExport ? grandTotal : netAmount + carriageCharge,
                            currencyCode || currencySymbol,
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ── AMOUNT IN WORDS ── */}
                  <View style={styles.wordsBar}>
                    <Text style={styles.wordsText}>
                      Amount in Words ({(currencyCode || currencySymbol).trim()}
                      ): <Text style={styles.wordsValue}>{amountWords}</Text>
                    </Text>
                  </View>

                  {/* ── BANK DETAILS ── */}
                  <View
                    style={{
                      marginHorizontal: 20,
                      marginTop: 8,
                      border: `1 solid ${BORDER_LIGHT}`,
                      borderRadius: 3,
                      padding: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 8,
                        fontFamily: "Helvetica-Bold",
                        color: DARK,
                        marginBottom: 4,
                      }}
                    >
                      Bank Details
                    </Text>
                    <View style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={{ width: 80, fontSize: 7.5, color: "#555" }}>
                        Account Name
                      </Text>
                      <Text
                        style={{
                          fontSize: 7.5,
                          color: "#333",
                          fontFamily: "Helvetica-Bold",
                        }}
                      >
                        : {bank?.bankHolderName || data?.bankHolderName || "-"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={{ width: 80, fontSize: 7.5, color: "#555" }}>
                        Bank Name
                      </Text>
                      <Text
                        style={{
                          fontSize: 7.5,
                          color: "#333",
                          fontFamily: "Helvetica-Bold",
                        }}
                      >
                        : {bank?.name || data?.name || "-"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={{ width: 80, fontSize: 7.5, color: "#555" }}>
                        Account No.
                      </Text>
                      <Text
                        style={{
                          fontSize: 7.5,
                          color: "#333",
                          fontFamily: "Helvetica-Bold",
                        }}
                      >
                        : {bank?.accNo || data?.accNo || "-"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={{ width: 80, fontSize: 7.5, color: "#555" }}>
                        Branch Name
                      </Text>
                      <Text
                        style={{
                          fontSize: 7.5,
                          color: "#333",
                          fontFamily: "Helvetica-Bold",
                        }}
                      >
                        : {bank?.Branch?.name || data?.Branch?.name || "-"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ width: 80, fontSize: 7.5, color: "#555" }}>
                        IFSC Code
                      </Text>
                      <Text
                        style={{
                          fontSize: 7.5,
                          color: "#333",
                          fontFamily: "Helvetica-Bold",
                        }}
                      >
                        : {bank?.ifsc || data?.ifsc || "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Spacer to reserve space for the fixed absolute signature block at the bottom */}
                  <View style={{ height: 80 }} />
                </>
              )}

              {/* ── SUB-TOTAL (non-last pages) ── */}
              {!isLastPage && (
                <View
                  style={{
                    flexDirection: "row",
                    marginHorizontal: 20,
                    backgroundColor: "#f4f4f6",
                    borderLeft: `1 solid ${BORDER}`,
                    borderRight: `1 solid ${BORDER}`,
                    borderBottom: `1 solid ${BORDER}`,
                  }}
                >
                  <Text
                    style={[
                      styles.td,
                      {
                        flex: isExport ? 8 : 8.7,
                        color: "#888",
                        fontStyle: "italic",
                        textAlign: "right",
                      },
                    ]}
                  >
                    Sub Total (Continued on next page...)
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      {
                        flex: 1.2,
                        fontFamily: "Helvetica-Bold",
                        color: DARK,
                        textAlign: "right",
                      },
                      isExport && { borderRight: "none" },
                    ]}
                  >
                    {currencySymbol}{" "}
                    {formatCurrencyAmount(
                      chunkRows.reduce(
                        (s, r) => s + (parseFloat(r.amount) || 0),
                        0,
                      ),
                      currencyCode || currencySymbol,
                    )}
                  </Text>
                </View>
              )}
            </View>

            {/* SIGNATURES — pinned to the absolute bottom of the LAST page */}
            <View
              style={{ position: "absolute", bottom: 40, left: 20, right: 20 }}
              fixed
            >
              <View
                render={({ pageNumber, totalPages }) => {
                  if (pageNumber === totalPages) {
                    return (
                      <View>
                        <Text
                          style={{
                            textAlign: "right",
                            fontSize: 8,
                            fontFamily: "Helvetica-Bold",
                            color: DARK,
                            marginBottom: 30,
                          }}
                        >
                          For {branch?.branchName || "MUTHU PRINTERS"}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            borderTop: `1 solid ${BORDER_LIGHT}`,
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
                                fontFamily: "Helvetica-Bold",
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
            </View>

            {/* FOOTER BAR */}
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

export default ProformaInvoicePrintFormat;

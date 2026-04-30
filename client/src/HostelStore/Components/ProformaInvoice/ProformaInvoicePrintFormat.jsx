import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
} from "@react-pdf/renderer";
// import Logo from "../../../assets/NationalPrintLogo.jpeg";
import moment from "moment";

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 7,
        padding: 20,
        paddingBottom: 60,
        backgroundColor: "#fff",
    },
    topBar: { height: 4, backgroundColor: "#1a1a2e", marginBottom: 10 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 15,
        borderBottom: "1.5 solid #1a1a2e",
        marginBottom: 15,
    },
    logoContainer: { width: 140, alignItems: "flex-start" },
    logo: { height: 80, width: 80 },
    companyCenter: { flex: 1, alignItems: "center" },
    companyName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1a1a2e",
        marginBottom: 4,
    },
    companyAddr: {
        fontSize: 8,
        color: "#444",
        textAlign: "center",
        lineHeight: 1.3,
    },
    companyRight: { width: 140, alignItems: "flex-end" },
    companyRightRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 3,
    },
    companyLabel: { fontSize: 8, color: "#888", marginRight: 4 },
    companyValue: { fontSize: 8, color: "#1a1a2e", fontWeight: "bold" },

    titleBand: {
        backgroundColor: "#1a1a2e",
        color: "#fff",
        textAlign: "center",
        fontSize: 12,
        fontWeight: "bold",
        letterSpacing: 2,
        paddingVertical: 5,
        marginBottom: 15,
    },

    infoGrid: {
        flexDirection: "row",
        marginBottom: 15,
        gap: 20,
    },
    billToBox: {
        flex: 1,
        border: "1 solid #eee",
        borderRadius: 4,
    },
    piDetailsBox: {
        width: 160,
        border: "1 solid #eee",
        borderRadius: 4,
    },
    sectionHeader: {
        backgroundColor: "#f8f9fa",
        borderBottom: "1 solid #eee",
        padding: "4 8",
        fontSize: 8,
        fontWeight: "bold",
        color: "#1a1a2e",
    },
    sectionBody: { padding: 8 },
    partyName: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 4,
    },
    partyAddr: { fontSize: 8, color: "#555", lineHeight: 1.4, marginBottom: 6 },
    labelValueRow: { flexDirection: "row", marginBottom: 2 },
    label: { width: 50, fontSize: 7.5, color: "#888" },
    value: { flex: 1, fontSize: 7.5, color: "#000", fontWeight: "bold" },

    table: {
        marginTop: 10,
        border: "1 solid #eee",
        borderRadius: 4,
        overflow: "hidden",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1a1a2e",
        color: "#fff",
        padding: "6 4",
        fontSize: 7.5,
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "1 solid #f0f0f0",
        padding: "6 4",
        alignItems: "center",
    },
    colSno: { width: 25, textAlign: "center" },
    colDesc: { flex: 1, paddingRight: 10 },
    colSize: { width: 45, textAlign: "center" },
    colGSM: { width: 40, textAlign: "center" },
    colHSN: { width: 45, textAlign: "center" },
    colUOM: { width: 40, textAlign: "center" },
    colQty: { width: 40, textAlign: "center" },
    colPrice: { width: 55, textAlign: "right" },
    colGross: { width: 65, textAlign: "right" },

    summaryContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 15,
    },
    summaryBox: {
        width: 180,
        border: "1 solid #eee",
        borderRadius: 4,
        overflow: "hidden",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: "4 8",
        borderBottom: "1 solid #f9f9f9",
    },
    grandTotalRow: {
        backgroundColor: "#1a1a2e",
        color: "#fff",
        fontWeight: "bold",
    },

    notesSection: {
        marginTop: 20,
        flexDirection: "row",
        gap: 15,
    },
    noteBox: {
        flex: 1,
        border: "1 solid #eee",
        borderRadius: 4,
    },
    noteContent: { padding: 8, fontSize: 7.5, color: "#555", lineHeight: 1.4 },

    pageFooter: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        borderTop: "1 solid #eee",
        paddingTop: 10,
        textAlign: "center",
        fontSize: 7,
        color: "#999",
    },
});

const ProformaInvoicePrintFormat = ({ data }) => {
    if (!data) return null;

    const items = data.items || [];

    // Calculations
    const subTotal = items.reduce(
        (acc, item) =>
            acc + parseFloat(item.qty || 0) * parseFloat(item.price || 0),
        0,
    );

    const totalDiscount = items.reduce((acc, item) => {
        const rowGross = parseFloat(item.qty || 0) * parseFloat(item.price || 0);
        let disc = 0;
        if (item.discountType === "PERCENTAGE") {
            disc = rowGross * (parseFloat(item.discountValue || 0) / 100);
        } else {
            disc = parseFloat(item.discountValue || 0);
        }
        return acc + disc;
    }, 0);

    const taxableAmount = subTotal - totalDiscount;

    const totalTax = items.reduce((acc, item) => {
        const rowGross = parseFloat(item.qty || 0) * parseFloat(item.price || 0);
        let disc = 0;
        if (item.discountType === "PERCENTAGE") {
            disc = rowGross * (parseFloat(item.discountValue || 0) / 100);
        } else {
            disc = parseFloat(item.discountValue || 0);
        }
        const rowTaxable = rowGross - disc;
        return acc + rowTaxable * (parseFloat(item.taxPercent || 0) / 100);
    }, 0);

    const grandTotal = taxableAmount + totalTax;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.topBar} />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        {/* <Image src={Logo} style={styles.logo} /> */}
                    </View>
                    <View style={styles.companyCenter}>
                        <Text style={styles.companyName}>{data.Branch?.companyName}</Text>
                        <Text style={styles.companyAddr}>
                            {data.Branch?.address || "N/A"}
                        </Text>
                    </View>
                    <View style={styles.companyRight}>
                        <View style={styles.companyRightRow}>
                            <Text style={styles.companyLabel}>GSTIN :</Text>
                            <Text style={styles.companyValue}>
                                {data.Branch?.gstNo || "33BHEPC9190H1ZE"}
                            </Text>
                        </View>
                        <View style={styles.companyRightRow}>
                            <Text style={styles.companyLabel}>Mobile :</Text>
                            <Text style={styles.companyValue}>
                                {data.Branch?.contactMobile || "N/A"}
                            </Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.titleBand}>PROFORMA INVOICE</Text>

                {/* Info Grid */}
                <View style={styles.infoGrid}>
                    <View style={styles.billToBox}>
                        <Text style={styles.sectionHeader}>BILL TO</Text>
                        <View style={styles.sectionBody}>
                            <Text style={styles.partyName}>{data.customer?.name}</Text>
                            <Text style={styles.partyAddr}>{data.customer?.address}</Text>
                            <View style={styles.labelValueRow}>
                                <Text style={styles.label}>GSTIN</Text>
                                <Text style={styles.value}>
                                    : {data.customer?.gstNo || "N/A"}
                                </Text>
                            </View>
                            <View style={styles.labelValueRow}>
                                <Text style={styles.label}>Contact</Text>
                                <Text style={styles.value}>
                                    : {data.customer?.contactNumber || "N/A"}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.piDetailsBox}>
                        <Text style={styles.sectionHeader}>INVOICE DETAILS</Text>
                        <View style={styles.sectionBody}>
                            <View style={styles.labelValueRow}>
                                <Text style={styles.label}>PI NO</Text>
                                <Text style={styles.value}>: {data.docId}</Text>
                            </View>
                            <View style={styles.labelValueRow}>
                                <Text style={styles.label}>PI Date</Text>
                                <Text style={styles.value}>
                                    : {moment(data.docDate).format("DD-MM-YYYY")}
                                </Text>
                            </View>
                            <View style={styles.labelValueRow}>
                                <Text style={styles.label}>Order No</Text>
                                <Text style={styles.value}>
                                    : {data.OrderEntry?.docId || "-"}
                                </Text>
                            </View>
                            {data.quoteVersion > 1 && (
                                <View style={styles.labelValueRow}>
                                    <Text style={styles.label}>Revised PI</Text>
                                    <Text style={[styles.value, { color: "#b91c1c" }]}>
                                        : v{data.quoteVersion}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colSno}>S.No</Text>
                        <Text style={styles.colDesc}>Description of Goods</Text>
                        <Text style={styles.colSize}>Size</Text>
                        <Text style={styles.colGSM}>GSM</Text>
                        <Text style={styles.colHSN}>HSN</Text>
                        <Text style={styles.colUOM}>UOM</Text>
                        <Text style={styles.colQty}>Qty</Text>
                        <Text style={styles.colPrice}>Price</Text>
                        <Text style={styles.colGross}>Gross</Text>
                    </View>
                    {items.map((item, index) => {
                        const gross =
                            parseFloat(item.qty || 0) * parseFloat(item.price || 0);
                        return (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.colSno}>{index + 1}</Text>
                                <Text style={[styles.colDesc, { fontWeight: "bold" }]}>
                                    {item.StyleItem?.name || "N/A"}
                                </Text>
                                <Text style={styles.colSize}>{item.Size?.name || "-"}</Text>
                                <Text style={styles.colGSM}>{item.Gsm?.name || "-"}</Text>
                                <Text style={styles.colHSN}>{item.Hsn?.name || "-"}</Text>
                                <Text style={styles.colUOM}>{item.Uom?.name || "-"}</Text>
                                <Text style={styles.colQty}>{item.qty?.toFixed(3)}</Text>
                                <Text style={styles.colPrice}>
                                    Rs. {parseFloat(item.price || 0).toFixed(2)}
                                </Text>
                                <Text style={styles.colGross}>Rs. {gross.toFixed(2)}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Summary Section */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 8 }}>Total Gross</Text>
                            <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                                Rs. {subTotal.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 8 }}>Discount</Text>
                            <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                                (-) Rs. {totalDiscount.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 8 }}>Taxable Value</Text>
                            <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                                Rs. {taxableAmount.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 8 }}>GST Total</Text>
                            <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                                (+) Rs. {totalTax.toFixed(2)}
                            </Text>
                        </View>
                        <View style={[styles.summaryRow, styles.grandTotalRow]}>
                            <Text style={{ fontSize: 9 }}>GRAND TOTAL</Text>
                            <Text style={{ fontSize: 9 }}>Rs. {grandTotal.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Terms and Remarks */}
                <View style={styles.notesSection}>
                    <View style={styles.noteBox}>
                        <Text style={styles.sectionHeader}>TERMS & CONDITIONS</Text>
                        <View style={styles.noteContent}>
                            <Text>{data.termsAndCondition || "N/A"}</Text>
                        </View>
                    </View>
                    <View style={styles.noteBox}>
                        <Text style={styles.sectionHeader}>REMARKS</Text>
                        <View style={styles.noteContent}>
                            <Text>{data.remarks || "N/A"}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.pageFooter} fixed>
                    Generated on {moment().format("DD-MM-YYYY HH:mm")}
                </Text>
            </Page>
        </Document>
    );
};

export default ProformaInvoicePrintFormat;
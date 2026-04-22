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

// ─── COLOR PALETTE (Matched with Purchase Return) ──────────────────────────────
const styles = StyleSheet.create({
    borderBox: { border: "1 solid #ccc", margin: 0, padding: 0 },
    page: { fontFamily: "Helvetica", fontSize: 8, padding: 0, paddingBottom: 60, backgroundColor: "#fff" },

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
    companyName: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", letterSpacing: 0.5 },
    companyRight: { width: 140, alignItems: "flex-start" },
    companyRightRow: { flexDirection: "row", marginBottom: 2, width: "100%" },
    companyLabel: { fontSize: 7.5, color: "#888", width: 38 },
    companyColon: { fontSize: 7.5, color: "#888", width: 8 },
    companyValue: { fontSize: 7.5, color: "#1a1a2e", fontWeight: "bold", flex: 1 },

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
        justifyContent: "flex-end",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 8,
    },
    metaPill: {
        flexDirection: "row",
        backgroundColor: "#f4f4f6",
        border: "1 solid #ddd",
        borderLeft: "2 solid #1a1a2e",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
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
    partyName: { fontSize: 9, fontWeight: "bold", color: "#1a1a2e", marginBottom: 3 },
    partyAddr: { fontSize: 7.5, color: "#555", textTransform: "uppercase", marginBottom: 4, lineHeight: 1.5 },
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
        backgroundColor: "#fafafa"
    },
    detailsCol: { flex: 1, padding: 8, borderRight: "1 solid #ddd" },
    detailsItem: { flexDirection: "row", marginBottom: 4 },
    detailsLabel: { fontSize: 7.5, color: "#888", width: 70 },
    detailsValue: { fontSize: 7.5, color: "#1a1a2e", fontWeight: "bold" },

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
        minHeight: 100,
    },

    // ── QR CODE & SIGNATURES ──
    bottomRow: {
        flexDirection: "row",
        marginHorizontal: 20,
        marginTop: 10,
        justifyContent: "space-between",
        alignItems: "flex-end"
    },
    qrContainer: {
        width: 80,
        height: 80,
        border: "1 solid #ddd",
        padding: 4,
        alignItems: "center",
        justifyContent: "center"
    },
    qrImage: { width: 70, height: 70 },
    sigArea: { width: 300 },
    sigCompany: { textAlign: "right", fontSize: 8, fontWeight: "bold", color: "#1a1a2e", marginBottom: 30 },
    sigRow: { flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #ddd", paddingTop: 4 },
    sigItem: { flex: 1, textAlign: "center", fontSize: 7.5, color: "#555", fontWeight: "bold" },

    // ── FOOTER BAR ──
    footerBar: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        position: "absolute",
        bottom: 20,
        left: 0,
        right: 0,
    },
    footerRight: { fontSize: 8, color: "#1a1a2e", fontWeight: "bold" },
});

const OrderEntryPrintFormat = ({ data, customerDetails, branchData, qrCodeDataUrl }) => {
    if (!data) return null;

    return (
        <Document>
            <Page size="A4" style={styles.borderBox}>
                <View style={styles.page}>
                    {/* TOP ACCENT BAR */}
                    <View style={styles.topBar} />

                    {/* HEADER */}
                    <View style={styles.header}>
                        <View style={styles.companyLeft}>
                            <Image src={Logo} style={styles.logo} />
                        </View>
                        <View style={styles.companyCenter}>
                            <Text style={styles.companyName}>{branchData?.branchName || "MUTHU PRINTERS"}</Text>
                        </View>
                        <View style={styles.companyRight}>
                            <Text style={{ fontSize: 7.5, color: "#555", marginBottom: 2, textAlign: "right" }}>
                                {branchData?.address || ""}
                            </Text>
                            {[
                                { label: "Mobile", value: branchData?.contactMobile },
                                { label: "GST No", value: branchData?.gstNo },
                                { label: "Email", value: branchData?.contactEmail },
                            ].map(({ label, value }) =>
                                value ? (
                                    <View key={label} style={styles.companyRightRow}>
                                        <Text style={styles.companyLabel}>{label}</Text>
                                        <Text style={styles.companyColon}> : </Text>
                                        <Text style={styles.companyValue}>{value}</Text>
                                    </View>
                                ) : null
                            )}
                            {qrCodeDataUrl && (
                                <View style={[styles.qrContainer, { border: "none", width: 60, height: 60, marginTop: 5, alignSelf: "flex-end" }]}>
                                    <Image src={qrCodeDataUrl} style={{ width: 50, height: 50 }} />
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
                            { label: "Order Date", value: moment(data?.docDate).format('DD-MM-YYYY') },
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
                        <View style={[styles.colHalf, { borderRight: "1 solid #ddd" }]}>
                            <Text style={styles.sectionHeader}>FROM</Text>
                            <View style={styles.sectionBody}>
                                <Text style={styles.partyName}>{branchData?.branchName || "MUTHU PRINTERS"}</Text>
                                <Text style={styles.partyAddr}>{branchData?.address || ""}</Text>
                                {[
                                    { label: "Mobile No", value: branchData?.contactMobile },
                                    { label: "GST No", value: branchData?.gstNo },
                                    { label: "Email", value: branchData?.contactEmail },
                                ].map(({ label, value }) =>
                                    value ? (
                                        <View key={label} style={styles.partyRow}>
                                            <Text style={styles.partyLabel}>{label}</Text>
                                            <Text style={styles.partyValue}>: {value}</Text>
                                        </View>
                                    ) : null
                                )}
                            </View>
                        </View>
                        {/* TO */}
                        <View style={styles.colHalf}>
                            <Text style={styles.sectionHeader}>CUSTOMER DETAILS</Text>
                            <View style={styles.sectionBody}>
                                <Text style={styles.partyName}>{customerDetails?.name || "N/A"}</Text>
                                <Text style={styles.partyAddr}>{customerDetails?.address || ""}</Text>
                                {[
                                    { label: "Contact Person", value: customerDetails?.contactPersonName },
                                    { label: "Mobile No", value: customerDetails?.contactNumber },
                                    { label: "GST No", value: customerDetails?.gstNo },
                                ].map(({ label, value }) =>
                                    value ? (
                                        <View key={label} style={styles.partyRow}>
                                            <Text style={styles.partyLabel}>{label}</Text>
                                            <Text style={styles.partyValue}>: {value}</Text>
                                        </View>
                                    ) : null
                                )}
                            </View>
                        </View>
                    </View>

                    {/* ORDER DETAILS GRID */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailsCol}>
                            <View style={styles.detailsItem}>
                                <Text style={styles.detailsLabel}>Order Type</Text>
                                <Text style={styles.detailsValue}>: {data?.orderType}</Text>
                            </View>
                            <View style={styles.detailsItem}>
                                <Text style={styles.detailsLabel}>Order Quantity</Text>
                                <Text style={styles.detailsValue}>: {data?.orderQty}</Text>
                            </View>
                        </View>
                        <View style={[styles.detailsCol, { borderRight: "none" }]}>
                            <View style={styles.detailsItem}>
                                <Text style={styles.detailsLabel}>Delivery Date</Text>
                                <Text style={styles.detailsValue}>: {data?.deliveryDate ? moment(data.deliveryDate).format('DD-MM-YYYY') : 'N/A'}</Text>
                            </View>
                            <View style={styles.detailsItem}>
                                <Text style={styles.detailsLabel}>Job Type</Text>
                                <Text style={styles.detailsValue}>: {data?.jobType || 'Internal'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* REQUIREMENTS SECTION */}
                    <View style={styles.requirementsBox}>
                        <View style={{ backgroundColor: "#2d2d44", paddingHorizontal: 10, paddingVertical: 5 }}>
                            <Text style={{ color: "#e8e8f0", fontSize: 7.5, fontWeight: "bold" }}>CUSTOMER REQUIREMENTS</Text>
                        </View>
                        <View style={styles.requirementsBody}>
                            <Text>{data?.requirements || "No specific requirements mentioned."}</Text>
                        </View>
                    </View>

                    {/* REMARKS & TERMS */}
                    <View style={[styles.twoCol, { marginTop: 5 }]}>
                        <View style={[styles.colHalf, { borderRight: "1 solid #ddd", backgroundColor: "#f8f8f9" }]}>
                            <Text style={styles.sectionHeader}>REMARKS</Text>
                            <View style={styles.sectionBody}>
                                <Text style={{ fontSize: 7.5, color: "#555" }}>{data?.remarks || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.colHalf}>
                            <Text style={styles.sectionHeader}>TERMS & CONDITIONS</Text>
                            <View style={styles.sectionBody}>
                                <Text style={{ fontSize: 7.5, color: "#555" }}>{data?.termsAndCondition || "N/A"}</Text>
                            </View>
                        </View>
                    </View>

                    </View>

                {/* FOOTER BAR */}
                <View style={styles.footerBar} fixed>
                    <Text style={styles.footerRight} render={({ pageNumber, totalPages }) => (
                        `Page ${pageNumber} of ${totalPages}`
                    )} />
                </View>
            </Page>
        </Document>
    );
};

export default OrderEntryPrintFormat;

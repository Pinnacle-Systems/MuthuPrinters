import {
    Document, Page, View, Text, StyleSheet, Image,
} from "@react-pdf/renderer";
import { findFromList, getDateFromDateTimeToDisplay } from "../../../../Utils/helper";
import Logo from "../../../../../src/assets/mplogo.png";

const styles = StyleSheet.create({
    borderBox: { border: "1 solid #000", margin: 0, padding: 8 },
    page: { fontSize: 8, padding: 0, border: "1 solid #000" },
    header: { alignItems: "center", marginBottom: 7, justifyContent: "space-between", flexDirection: "row", padding: 7 },
    companyText: { fontSize: 9, marginBottom: 1, textAlign: "left", marginRight: 4 },
    greenTitle: { textAlign: "center", fontSize: 15, color: "#FFFF", backgroundColor: "#1D3A76", paddingVertical: 4, fontWeight: "500" },
    sectionTitle: { fontSize: 8, fontWeight: "bold", color: "#FFFF", backgroundColor: "#1D3A76", padding: 6, marginBottom: 2 },
    boxContent: { padding: 4, fontSize: 8 },
    logo: { height: 40, marginRight: 6 },
    tableHeader: {
        flexDirection: "row",
        borderTop: "1 solid #000",
        borderBottom: "1 solid #000",
        borderLeft: "1 solid #000",
        borderRight: "1 solid #000",
        marginTop: 6,
        backgroundColor: "#1D3A76",
        color: "#FFFF",
    },
    th: {
        flex: 1,
        fontSize: 7,
        fontWeight: "bold",
        textAlign: "center",
        borderRight: "1 solid #fff",
        padding: 3,
        color: "#FFFF",
    },
    td: {
        flex: 1,
        fontSize: 8,
        textAlign: "center",
        borderRight: "1 solid #000",
        borderBottom: "1 solid #000",
        padding: 3,
    },
});

const PurchaseReturnPrintFormat = ({
    singleData,
    supplierList,
    styleItemList,
    uomList,
    sizeList,
    colorList,
    branchData,
}) => {
    if (!singleData) return null;

    const docId = singleData?.docId || "";
    const docDate = singleData?.docDate || "";
    const dcNo = singleData?.dcNo || "";
    const dcDate = singleData?.dcDate || "";
    const remarks = singleData?.remarks || "";
    const termsAndCondition = singleData?.termsAndCondition || "";
    const supplierDetails = singleData?.Supplier ||
        supplierList?.data?.find(s => parseInt(s.id) === parseInt(singleData?.supplierId)) || {};

    const returnItems = (singleData?.purchaseReturnItems || []).filter(
        (item) => item.styleItemId || item.StyleItem?.id
    );

    const totalPoQty = returnItems.reduce((s, r) => s + (parseFloat(r.poQty) || 0), 0);
    const totalInwardQty = returnItems.reduce((s, r) => s + (parseFloat(r.inwardQty) || 0), 0);
    const totalAlreadyReturnQty = returnItems.reduce((s, r) => s + (parseFloat(r.alreadyReturnQty) || 0), 0);
    const totalBalQty = returnItems.reduce((s, r) => s + (parseFloat(r.balQty) || 0), 0);
    const totalReturnQty = returnItems.reduce((s, r) => s + (parseFloat(r.returnQty) || 0), 0);

    const columns = [
        { label: "S.No", flex: 0.5 },
        { label: "Description", flex: 3.5 },
        { label: "Size", flex: 1.2 },
        { label: "Color", flex: 1.2 },
        { label: "UOM", flex: 1 },
        { label: "PO Qty", flex: 1 },
        { label: "Inward Qty", flex: 1 },
        { label: "Already\nReturn Qty", flex: 1.2 },
        { label: "Balance Qty", flex: 1 },
        { label: "Return Qty", flex: 1 },
    ];

    const ROW_HEIGHT = 18;

    return (
        <Document>
            <Page size="A4" style={styles.borderBox}>
                <View style={styles.page}>

                    {/* ── HEADER ── */}
                    <View style={styles.header}>
                        <View style={{ width: 140, flexWrap: "wrap" }}>
                            <Text style={styles.companyText}>{branchData?.address || ""}</Text>
                            {[
                                { label: "Mobile", value: branchData?.contactMobile },
                                { label: "Email", value: branchData?.contactEmail },
                                { label: "GST No", value: branchData?.gstNo },
                            ].map(({ label, value }) => (
                                <View key={label} style={{ flexDirection: "row" }}>
                                    <Text style={[styles.companyText, { width: 45 }]}>{label}</Text>
                                    <Text style={styles.companyText}>: {value || ""}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 19, color: "#1D3A76", fontWeight: "bold", marginBottom: 4, marginTop: 10 }}>
                                {branchData?.branchName || ""}
                            </Text>
                        </View>

                        <Image src={Logo} style={styles.logo} />
                    </View>

                    {/* ── TITLE ── */}
                    <Text style={styles.greenTitle}>PURCHASE RETURN</Text>

                    {/* ── DOC META ── */}
                    <View style={{ alignItems: "flex-end", marginTop: 5, marginBottom: 3, marginRight: 7 }}>
                        {[
                            { label: "Return No", value: docId },
                            { label: "Return Date", value: getDateFromDateTimeToDisplay(docDate) },
                            { label: "DC No", value: dcNo },
                            { label: "DC Date", value: dcDate ? getDateFromDateTimeToDisplay(dcDate) : "" },
                        ].map(({ label, value }) => (
                            <View key={label} style={{ flexDirection: "row", marginBottom: 3 }}>
                                <Text style={[styles.companyText, { width: 65 }]}>{label}</Text>
                                <Text style={[styles.companyText, { width: 80 }]}>: {value}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── FROM / TO ── */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <View style={{ flex: 1, border: "" }}>
                            <Text style={styles.sectionTitle}>FROM</Text>
                            <View style={styles.boxContent}>
                                <Text style={{ fontWeight: "bold", color: "#0F766E", marginBottom: 4 }}>
                                    {branchData?.branchName || ""}
                                </Text>
                                <Text style={{ textTransform: "uppercase", marginBottom: 2 }}>
                                    {branchData?.address || ""}
                                </Text>
                                {[
                                    { label: "GST No", value: branchData?.gstNo },
                                    { label: "Mobile", value: branchData?.contactMobile },
                                ].map(({ label, value }) => value ? (
                                    <View key={label} style={{ flexDirection: "row" }}>
                                        <Text style={[styles.companyText, { width: 55 }]}>{label}</Text>
                                        <Text style={styles.companyText}>: {value}</Text>
                                    </View>
                                ) : null)}
                            </View>
                        </View>

                        <View style={{ flex: 1, border: "" }}>
                            <Text style={styles.sectionTitle}>TO</Text>
                            <View style={styles.boxContent}>
                                <Text style={{ fontWeight: "bold", color: "#0F766E", marginBottom: 4 }}>
                                    {supplierDetails?.name || ""}
                                </Text>
                                <Text style={{ textTransform: "uppercase", marginBottom: 2 }}>
                                    {supplierDetails?.address || ""}
                                </Text>
                                {[
                                    { label: "Mobile No", value: supplierDetails?.contactPersonNumber },
                                    { label: "GST No", value: supplierDetails?.gstNo },
                                    { label: "Email", value: supplierDetails?.email },
                                ].map(({ label, value }) => value ? (
                                    <View key={label} style={{ flexDirection: "row" }}>
                                        <Text style={[styles.companyText, { width: 55 }]}>{label}</Text>
                                        <Text style={styles.companyText}>: {value}</Text>
                                    </View>
                                ) : null)}
                            </View>
                        </View>
                    </View>

                    {/* ── TABLE HEADER ── */}
                    <View style={styles.tableHeader}>
                        {columns.map(({ label, flex }, i) => (
                            <Text
                                key={label}
                                style={[
                                    styles.th,
                                    { flex },
                                    i === columns.length - 1 && { borderRight: 0 },
                                ]}
                            >
                                {label}
                            </Text>
                        ))}
                    </View>

                    {/* ── TABLE ROWS ── */}
                    {(() => {
                        const minRows = 16;

                        const filledRows = returnItems.map((row, index) => (
                            <View
                                key={index}
                                style={{
                                    flexDirection: "row",
                                    borderBottom: "1 solid #d1d5db",
                                    minHeight: ROW_HEIGHT
                                }}
                            >
                                <Text style={[styles.td, { flex: 0.5 }]}>{index + 1}</Text>

                                <Text style={[styles.td, { flex: 3.5, textAlign: "left" }]}>
                                    {row?.StyleItem?.name ||
                                        findFromList(row.styleItemId, styleItemList?.data, "name")}
                                </Text>

                                <Text style={[styles.td, { flex: 1.2 }]}>
                                    {row?.Size?.name ||
                                        findFromList(row.sizeId, sizeList?.data, "name")}
                                </Text>

                                <Text style={[styles.td, { flex: 1.2 }]}>
                                    {row?.Color?.name ||
                                        findFromList(row.colorId, colorList?.data, "name")}
                                </Text>

                                <Text style={[styles.td, { flex: 1 }]}>
                                    {row?.Uom?.name ||
                                        findFromList(row.uomId, uomList?.data, "name")}
                                </Text>

                                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                                    {row?.poQty ? parseFloat(row.poQty).toFixed(2) : ""}
                                </Text>

                                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                                    {row?.inwardQty ? parseFloat(row.inwardQty).toFixed(2) : ""}
                                </Text>

                                <Text style={[styles.td, { flex: 1.2, textAlign: "right" }]}>
                                    {row?.alreadyReturnQty
                                        ? parseFloat(row.alreadyReturnQty).toFixed(2)
                                        : ""}
                                </Text>

                                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                                    {row?.balQty ? parseFloat(row.balQty).toFixed(2) : ""}
                                </Text>

                                <Text style={[styles.td, { flex: 1, textAlign: "right", borderRight: 0 }]}>
                                    {row?.returnQty ? parseFloat(row.returnQty).toFixed(2) : ""}
                                </Text>
                            </View>
                        ));

                        // ✅ Empty rows
                        const emptyRowsCount = Math.max(0, minRows - returnItems.length);

                        const emptyRows = Array.from({ length: emptyRowsCount }).map((_, i) => (
                            <View
                                key={`empty-${i}`}
                                style={{
                                    flexDirection: "row",
                                    borderBottom: "1 solid #d1d5db",
                                    minHeight: ROW_HEIGHT
                                }}
                            >
                                <Text style={[styles.td, { flex: 0.5 }]} />
                                <Text style={[styles.td, { flex: 3.5 }]} />
                                <Text style={[styles.td, { flex: 1.2 }]} />
                                <Text style={[styles.td, { flex: 1.2 }]} />
                                <Text style={[styles.td, { flex: 1 }]} />
                                <Text style={[styles.td, { flex: 1 }]} />
                                <Text style={[styles.td, { flex: 1 }]} />
                                <Text style={[styles.td, { flex: 1.2 }]} />
                                <Text style={[styles.td, { flex: 1 }]} />
                                <Text style={[styles.td, { flex: 1, borderRight: 0 }]} />
                            </View>
                        ));

                        return [...filledRows, ...emptyRows];
                    })()}

                    {/* ── TOTAL ROW ── */}
                    <View style={{
                        flexDirection: "row",
                        border: "1 solid #000",
                        backgroundColor: "#1D3A76",
                    }}>
                        <Text style={{ flex: 0.5, fontSize: 8, fontWeight: "bold", padding: 3, color: "#fff", textAlign: "center", borderRight: "1 solid #fff" }}>
                            {returnItems.length}
                        </Text>
                        <Text style={{ flex: 3.5, fontSize: 8, fontWeight: "bold", padding: 3, color: "#fff", borderRight: "1 solid #fff" }}>
                            TOTAL
                        </Text>
                        <Text style={{ flex: 1.2, fontSize: 8, padding: 3, color: "#fff", borderRight: "1 solid #fff" }} />
                        <Text style={{ flex: 1.2, fontSize: 8, padding: 3, color: "#fff", borderRight: "1 solid #fff" }} />
                        <Text style={{ flex: 1, fontSize: 8, padding: 3, color: "#fff", borderRight: "1 solid #fff" }} />
                        <Text style={{ flex: 1, fontSize: 8, fontWeight: "bold", textAlign: "right", padding: 3, color: "#fff", borderRight: "1 solid #fff" }}>
                            {totalPoQty.toFixed(2)}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 8, fontWeight: "bold", textAlign: "right", padding: 3, color: "#fff", borderRight: "1 solid #fff" }}>
                            {totalInwardQty.toFixed(2)}
                        </Text>
                        <Text style={{ flex: 1.2, fontSize: 8, fontWeight: "bold", textAlign: "right", padding: 3, color: "#fff", borderRight: "1 solid #fff" }}>
                            {totalAlreadyReturnQty.toFixed(2)}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 8, fontWeight: "bold", textAlign: "right", padding: 3, color: "#fff", borderRight: "1 solid #fff" }}>
                            {totalBalQty.toFixed(2)}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 8, fontWeight: "bold", textAlign: "right", padding: 3, color: "#fff" }}>
                            {totalReturnQty.toFixed(2)}
                        </Text>
                    </View>

                    {/* ── REMARKS & TERMS ── */}
                    <View style={{ marginTop: 6, border: "1 solid #000", borderRadius: 4 }}>
                        <View style={{ backgroundColor: "#1D3A76", paddingVertical: 5, paddingHorizontal: 6 }}>
                            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#FFFFFF" }}>
                                Additional Information
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", minHeight: 60 }}>
                            <View style={{ flex: 0.5, borderRight: "1 solid #000", padding: 6, backgroundColor: "#f0f4ff" }}>
                                <Text style={{ fontSize: 8, fontWeight: "bold", color: "#1D3A76", marginBottom: 3 }}>
                                    Remarks:
                                </Text>
                                <Text style={{ fontSize: 8 }}>{remarks || ""}</Text>
                            </View>
                            <View style={{ flex: 0.5, padding: 6 }}>
                                <Text style={{ fontSize: 8, fontWeight: "bold", color: "#1D3A76", marginBottom: 3 }}>
                                    Terms & Conditions:
                                </Text>
                                <Text style={{ fontSize: 8 }}>{termsAndCondition || ""}</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── SIGNATURES ── */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ fontSize: 8, textAlign: "right", fontWeight: "bold", marginRight: 4 }}>
                            For {branchData?.branchName || ""}
                        </Text>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                            {["Prepared By", "Verified By", "Received By", "Approved By"].map((role) => (
                                <Text key={role} style={{ fontSize: 8, textAlign: "center", fontWeight: "bold", flex: 1 }}>
                                    {role}
                                </Text>
                            ))}
                        </View>
                    </View>

                </View>

                {/* ── PAGE NUMBER ── */}
                <View style={{ marginTop: 10 }}>
                    <Text
                        style={{ fontSize: 7, textAlign: "center", color: "#555" }}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};

export default PurchaseReturnPrintFormat;
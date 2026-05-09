import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
} from "@react-pdf/renderer";
import Logo from "../../../../src/assets/mplogo.png";
import { findFromList, getDateFromDateTimeToDisplay } from "../../../Utils/helper";

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 8,
        padding: 0,
        backgroundColor: "#fff",
    },
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
    companyCenter: { alignItems: "center", flex: 1, paddingHorizontal: 10 },
    companyName: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", letterSpacing: 0.5 },
    companyRight: { width: 150, alignItems: "flex-start" },
    companyRightRow: { flexDirection: "row", marginBottom: 2, width: "100%" },
    companyLabel: { fontSize: 7.5, color: "#888", width: 38 },
    companyColon: { fontSize: 7.5, color: "#888", width: 8 },
    companyValue: { fontSize: 7.5, color: "#1a1a2e", fontWeight: "bold", flex: 1 },

    // ── TITLE BAND ──
    titleBand: {
        backgroundColor: "#1a1a2e",
        color: "#fff",
        textAlign: "center",
        fontSize: 13,
        fontWeight: "bold",
        letterSpacing: 3,
        paddingVertical: 6,
    },

    // ── META PILLS ──
    metaRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 8,
        flexWrap: "wrap",
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

    // ── TWO COLUMN ──
    twoCol: {
        flexDirection: "row",
        marginHorizontal: 20,
        marginBottom: 8,
        border: "1 solid #ddd",
        borderRadius: 3,
    },
    colHalf: { flex: 1 },
    colThird: { flex: 1 },
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
    infoName: { fontSize: 9, fontWeight: "bold", color: "#1a1a2e", marginBottom: 3 },
    infoRow: { flexDirection: "row", marginBottom: 2 },
    infoLabel: { fontSize: 7.5, color: "#888", width: 70 },
    infoValue: { fontSize: 7.5, color: "#222", fontWeight: "bold", flex: 1 },

    // ── SECTION WRAPPER ──
    sectionWrap: {
        marginHorizontal: 20,
        marginBottom: 8,
        border: "1 solid #ddd",
        borderRadius: 3,
        overflow: "hidden",
    },
    sectionTitle: {
        backgroundColor: "#2d2d44",
        color: "#e8e8f0",
        fontSize: 7.5,
        fontWeight: "bold",
        letterSpacing: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    sectionContent: { padding: 8 },

    // ── GRID / CHECKBOX ──
    gridRow: { flexDirection: "row", flexWrap: "wrap" },
    gridCell: { width: "25%", flexDirection: "row", alignItems: "center", paddingVertical: 2 },
    checkboxBox: {
        width: 9, height: 9,
        border: "1 solid #888",
        borderRadius: 1,
        marginRight: 4,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: { backgroundColor: "#1a1a2e", border: "1 solid #1a1a2e" },
    checkboxTick: { color: "#fff", fontSize: 6 },
    checkLabel: { fontSize: 7.5, color: "#333" },

    // ── SPEC FIELDS ──
    specTable: { flexDirection: "row", flexWrap: "wrap" },
    specCell: { width: "25%", paddingVertical: 3, paddingRight: 8 },
    specLabel: { fontSize: 6.5, color: "#888", fontWeight: "bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 1 },
    specValue: { fontSize: 8, color: "#1a1a2e", fontWeight: "bold" },

    // ── LV TABLE (Lamination / Varnish) ──
    lvTableHeader: { flexDirection: "row", borderBottom: "1 solid #ddd", paddingBottom: 3, marginBottom: 3 },
    lvHeaderType: { flex: 3, fontSize: 7, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
    lvHeaderCenter: { flex: 1, fontSize: 7, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
    lvRow: { flexDirection: "row", alignItems: "center", paddingVertical: 2, borderBottom: "1 solid #f0f0f0" },
    lvName: { flex: 3, fontSize: 7.5, color: "#333" },
    lvCheck: { flex: 1, alignItems: "center" },

    // ── THREE COLUMN ──
    threeCol: { flexDirection: "row", marginHorizontal: 20, marginBottom: 8, gap: 8 },
    threeColItem: { flex: 1, border: "1 solid #ddd", borderRadius: 3, overflow: "hidden" },

    // ── REMARKS ──
    remarksBar: { marginHorizontal: 20, marginBottom: 8, border: "1 solid #ddd", borderRadius: 3, overflow: "hidden" },
    remarksBody: { padding: 8, minHeight: 30 },
    remarksText: { fontSize: 7.5, color: "#555", lineHeight: 1.5 },

    // ── SIGNATURES ──
    sigArea: { marginHorizontal: 20, marginTop: 14, marginBottom: 8 },
    sigCompany: { textAlign: "right", fontSize: 8, fontWeight: "bold", color: "#1a1a2e", marginBottom: 18 },
    sigRow: { flexDirection: "row", justifyContent: "space-between", borderTop: "1 solid #ddd", paddingTop: 4 },
    sigItem: { flex: 1, textAlign: "center", fontSize: 7.5, color: "#555", fontWeight: "bold" },

    // ── FOOTER ──
    footerBar: {
        backgroundColor: "#1a1a2e",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 4,
        marginTop: 8,
    },
    footerLeft: { fontSize: 7, color: "rgba(255,255,255,0.5)" },
    footerRight: { fontSize: 7, color: "rgba(255,255,255,0.5)" },

    // ── SIZE BREAKUP TABLE ──
    breakupTable: { border: "1 solid #ddd", borderRadius: 2, overflow: "hidden", marginTop: 6 },
    breakupTh: {
        backgroundColor: "#1a1a2e",
        flexDirection: "row",
    },
    breakupThCell: {
        fontSize: 7,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        paddingVertical: 4,
        paddingHorizontal: 3,
        borderRight: "1 solid #4a4a60",
    },
    breakupTrOdd: { flexDirection: "row", borderBottom: "1 solid #eee", backgroundColor: "#fff" },
    breakupTrEven: { flexDirection: "row", borderBottom: "1 solid #eee", backgroundColor: "#fafafa" },
    breakupTd: {
        fontSize: 7.5,
        color: "#333",
        textAlign: "center",
        paddingVertical: 3,
        paddingHorizontal: 3,
        borderRight: "1 solid #eee",
    },

    // ── LABEL DETAIL FIELDS ──
    labelFieldRow: { flexDirection: "row", marginBottom: 4 },
    labelFieldLabel: { fontSize: 7.5, color: "#888", width: 70 },
    labelFieldValue: { fontSize: 7.5, color: "#1a1a2e", fontWeight: "bold", flex: 1 },

    // ── ORDER INFO FIELD ROW ──
    orderInfoRow: { flexDirection: "row", marginBottom: 3 },
    orderInfoLabel: { fontSize: 7, color: "#888", width: 72 },
    orderInfoColon: { fontSize: 7, color: "#888", width: 8 },
    orderInfoValue: { fontSize: 7, color: "#1a1a2e", fontWeight: "bold", flex: 1 },

    // ── QR ──
    qrBox: { alignItems: "center", justifyContent: "center", padding: 6 },
    qrImage: { width: 56, height: 56 },
    qrLabel: { fontSize: 6, color: "#aaa", marginTop: 2, textAlign: "center" },
});

// ── SHARED HELPERS ────────────────────────────────────────────────────────────

const Checkbox = ({ checked, label, width }) => (
    <View style={[styles.gridCell, width ? { width } : {}]}>
        <View style={[styles.checkboxBox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkLabel}>{label}</Text>
    </View>
);

const SpecField = ({ label, value, width }) => (
    <View style={[styles.specCell, width ? { width } : {}]}>
        <Text style={styles.specLabel}>{label}</Text>
        <Text style={styles.specValue}>{value || "—"}</Text>
    </View>
);

const LVSection = ({ title, items, selectedList }) => (
    <View style={styles.threeColItem}>
        <Text style={styles.sectionHeader}>{title}</Text>
        <View style={styles.sectionContent}>
            {items && items.length > 0 ? (
                <>
                    <View style={styles.lvTableHeader}>
                        <Text style={styles.lvHeaderType}>Type</Text>
                        <Text style={styles.lvHeaderCenter}>Front</Text>
                        <Text style={styles.lvHeaderCenter}>F&B</Text>
                    </View>
                    {items.map((item) => {
                        const sel = selectedList?.find((s) => s.processId === item.id);
                        const isSelected = !!sel;
                        return (
                            <View key={item.id} style={styles.lvRow}>
                                <View style={{ flex: 3, flexDirection: "row", alignItems: "center" }}>
                                    <View style={[styles.checkboxBox, isSelected && styles.checkboxChecked]}>
                                        {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
                                    </View>
                                    <Text style={[styles.lvName, { marginLeft: 3 }]}>{item.name}</Text>
                                </View>
                                <View style={styles.lvCheck}>
                                    <View style={[styles.checkboxBox, sel?.isFront && styles.checkboxChecked]}>
                                        {sel?.isFront && <Text style={styles.checkboxTick}>✓</Text>}
                                    </View>
                                </View>
                                <View style={styles.lvCheck}>
                                    <View style={[styles.checkboxBox, sel?.isFrontAndBack && styles.checkboxChecked]}>
                                        {sel?.isFrontAndBack && <Text style={styles.checkboxTick}>✓</Text>}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </>
            ) : (
                <Text style={{ fontSize: 7.5, color: "#aaa", fontStyle: "italic" }}>No options configured.</Text>
            )}
        </View>
    </View>
);

// ── SIZE BREAKUP TABLE (PDF) ──────────────────────────────────────────────────

const SizeBreakupTable = ({ trackingType, sizeDetails, sizeList }) => {
    if (!sizeDetails || sizeDetails.length === 0) return null;
    const filtered = sizeDetails.filter(
        (sb) => (Number(sb.qty) || 0) > 0 || sb.barcodeFrom
    );
    if (filtered.length === 0) return null;

    if (trackingType === "Barcode") {
        return (
            <View style={styles.breakupTable}>
                <View style={styles.breakupTh}>
                    <Text style={[styles.breakupThCell, { flex: 0.4 }]}>S.No</Text>
                    <Text style={[styles.breakupThCell, { flex: 2 }]}>Barcode From</Text>
                    <Text style={[styles.breakupThCell, { flex: 2 }]}>Barcode To</Text>
                    <Text style={[styles.breakupThCell, { flex: 1, borderRight: "none" }]}>Qty</Text>
                </View>
                {filtered.map((item, idx) => (
                    <View key={idx} style={idx % 2 === 0 ? styles.breakupTrOdd : styles.breakupTrEven}>
                        <Text style={[styles.breakupTd, { flex: 0.4 }]}>{idx + 1}</Text>
                        <Text style={[styles.breakupTd, { flex: 2 }]}>{item.barcodeFrom || ""}</Text>
                        <Text style={[styles.breakupTd, { flex: 2 }]}>{item.barcodeTo || ""}</Text>
                        <Text style={[styles.breakupTd, { flex: 1, textAlign: "right", borderRight: "none" }]}>{Number(item.qty) || ""}</Text>
                    </View>
                ))}
            </View>
        );
    }

    if (trackingType === "SizeTemplate") {
        return (
            <View style={styles.breakupTable}>
                <View style={styles.breakupTh}>
                    <Text style={[styles.breakupThCell, { flex: 0.4 }]}>S.No</Text>
                    <Text style={[styles.breakupThCell, { flex: 2 }]}>Size</Text>
                    <Text style={[styles.breakupThCell, { flex: 1, borderRight: "none" }]}>Qty</Text>
                </View>
                {filtered.map((item, idx) => (
                    <View key={idx} style={idx % 2 === 0 ? styles.breakupTrOdd : styles.breakupTrEven}>
                        <Text style={[styles.breakupTd, { flex: 0.4 }]}>{idx + 1}</Text>
                        <Text style={[styles.breakupTd, { flex: 2, textAlign: "left" }]}>
                            {findFromList(item.sizeId, sizeList?.data, "name") || "—"}
                        </Text>
                        <Text style={[styles.breakupTd, { flex: 1, textAlign: "right", borderRight: "none" }]}>{Number(item.qty) || ""}</Text>
                    </View>
                ))}
            </View>
        );
    }

    if (trackingType === "SizeTemplateBarcode") {
        return (
            <View style={styles.breakupTable}>
                <View style={styles.breakupTh}>
                    <Text style={[styles.breakupThCell, { flex: 0.4 }]}>S.No</Text>
                    <Text style={[styles.breakupThCell, { flex: 1.5 }]}>Size</Text>
                    <Text style={[styles.breakupThCell, { flex: 1.5 }]}>From</Text>
                    <Text style={[styles.breakupThCell, { flex: 1.5 }]}>To</Text>
                    <Text style={[styles.breakupThCell, { flex: 1, borderRight: "none" }]}>Qty</Text>
                </View>
                {filtered.map((item, idx) => (
                    <View key={idx} style={idx % 2 === 0 ? styles.breakupTrOdd : styles.breakupTrEven}>
                        <Text style={[styles.breakupTd, { flex: 0.4 }]}>{idx + 1}</Text>
                        <Text style={[styles.breakupTd, { flex: 1.5, textAlign: "left" }]}>
                            {findFromList(item.sizeId, sizeList?.data, "name") || "—"}
                        </Text>
                        <Text style={[styles.breakupTd, { flex: 1.5 }]}>{item.barcodeFrom || ""}</Text>
                        <Text style={[styles.breakupTd, { flex: 1.5 }]}>{item.barcodeTo || ""}</Text>
                        <Text style={[styles.breakupTd, { flex: 1, textAlign: "right", borderRight: "none" }]}>{Number(item.qty) || ""}</Text>
                    </View>
                ))}
            </View>
        );
    }

    return null;
};

// ── FOOTER BLOCK (shared) ─────────────────────────────────────────────────────

const FooterBlock = ({ remarks, branchName }) => (
    <>
        {/* REMARKS */}
        <View style={styles.remarksBar}>
            <Text style={styles.sectionTitle}>REMARKS</Text>
            <View style={styles.remarksBody}>
                <Text style={styles.remarksText}>{remarks || ""}</Text>
            </View>
        </View>

        {/* SIGNATURES */}
        <View style={styles.sigArea}>
            <Text style={styles.sigCompany}>For {branchName || ""}</Text>
            <View style={styles.sigRow}>
                {["Designer Sign", "Incharge Sign", "Proprietor Sign", "Operator Sign"].map((role) => (
                    <Text key={role} style={styles.sigItem}>{role}</Text>
                ))}
            </View>
        </View>

        {/* FOOTER BAR */}
        <View style={styles.footerBar}>
            <Text style={styles.footerLeft}></Text>
            <Text
                style={styles.footerRight}
                render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
            />
        </View>
    </>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

const JobCardPrintFormat = ({
    singleData,
    customerList,
    boardList,
    gsmList,
    plateList,
    dieList,
    defaultList,
    laminationList,
    varnishList,
    machineList,
    branchData,
    orderList,
    sizeList,
    qrCodeDataUrl,
    employeeList,
    styleItemList,
}) => {
    if (!singleData) return null;

    const {
        docId,
        docDate,
        orderQty,
        customerId,
        remarks,
        gsmId,
        boardId,
        fullBoardId,
        cuttingSizeId,
        noOfPockets,
        runningQty,
        isFourColor,
        isCutColor,
        isFront,
        isFrontAndBack,
        isCMYK,
        isCutColMachine,
        isFrontMachine,
        isFrontBackMachine,
        plateId,
        dieId,
        totalPlatesets,
        boardQualities,
        processDetails,
        laminationDetails,
        varnishDetails,
        machineDetails,
        jobRunTime,
        itemType,
        styleItemId,
        labelQuality,
        block,
        rollQty,
        cutAndSeal,
        jobCardSizeDetails,
        trackingType,
        productionType,
        tagCardUps,
        followUpId,
        designerId,
    } = singleData;

    const isLabel = itemType === "LABEL";
    const customer = customerList?.data?.find((c) => c.id === customerId);
    const orderEntry = orderList?.data?.find((o) => o.id === singleData?.orderEntryId);
    const styleItemName = singleData?.StyleItem?.name || findFromList(styleItemId, styleItemList?.data, "name") || "";
    const followUpName = employeeList?.data?.find((e) => e.id === followUpId)?.name || "";
    const designerName = employeeList?.data?.find((e) => e.id === designerId)?.name || "";
    const fullBoardName = findFromList(fullBoardId, sizeList?.data, "name");
    const cuttingSizeName = findFromList(cuttingSizeId, sizeList?.data, "name");

    // Normalise arrays
    const selectedBoardIds = boardQualities?.map((b) => b.boardId) || [];
    const selectedProcessIds = processDetails?.map((p) => p.processId) || [];
    const selectedMachineIds = machineDetails?.map((m) => m.machineId) || [];
    const savedLaminations = laminationDetails?.map((l) => ({
        processId: l.laminationId,
        isFront: l.isFront,
        isFrontAndBack: l.isFrontAndBack,
    })) || [];
    const savedVarnishes = varnishDetails?.map((v) => ({
        processId: v.varnishId,
        isFront: v.isFront,
        isFrontAndBack: v.isFrontAndBack,
    })) || [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ── TOP ACCENT BAR ── */}
                <View style={styles.topBar} />

                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <Image src={Logo} style={styles.logo} />
                    <View style={styles.companyCenter}>
                        <Text style={styles.companyName}>{branchData?.branchName || ""}</Text>
                        {branchData?.address ? (
                            <Text style={{ fontSize: 7.5, color: "#666", marginTop: 2, textAlign: "center" }}>
                                {branchData.address}
                            </Text>
                        ) : null}
                    </View>
                    <View style={styles.companyRight}>
                        {[
                            { label: "Mobile", value: branchData?.contactMobile },
                            { label: "GST No", value: branchData?.company?.gstNo },
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
                    </View>
                </View>

                {/* ── TITLE BAND ── */}
                <Text style={styles.titleBand}>
                    {isLabel ? "JOB CARD — LABEL" : "JOB CARD"}
                </Text>

                {/* ── META PILLS: Job Card No, Date, Order No, Order Qty ── */}
                <View style={styles.metaRow}>
                    {[
                        { label: "Job Card No", value: docId },
                        { label: "Date", value: getDateFromDateTimeToDisplay(docDate) },
                        { label: "Order No", value: orderEntry?.docId || "-" },
                        { label: "Order Qty", value: orderQty ? Number(orderQty) : "" },
                    ].map(({ label, value }) => (
                        <View key={label} style={styles.metaPill}>
                            <Text style={styles.metaLabel}>{label}:</Text>
                            <Text style={styles.metaValue}>{value}</Text>
                        </View>
                    ))}
                </View>

                {/* ── CUSTOMER + ORDER DETAILS + QR (three-column row) ── */}
                <View style={[styles.twoCol, { alignItems: "stretch" }]}>
                    {/* Customer — compact */}
                    <View style={[styles.colThird, { borderRight: "1 solid #ddd", flex: 1.2 }]}>
                        <Text style={styles.sectionHeader}>CUSTOMER</Text>
                        <View style={styles.sectionBody}>
                            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#1a1a2e" }}>
                                {customer?.name || "—"}
                            </Text>
                            <Text style={{ fontSize: 7, color: "#888", marginTop: 2 }}>
                                Production: {productionType || "—"}
                            </Text>
                        </View>
                    </View>

                    {/* Order Details: Item Desc, Tag/Card Ups, Job Run Time, Follow Up, Designer */}
                    <View style={[styles.colThird, { borderRight: "1 solid #ddd", flex: 2 }]}>
                        <Text style={styles.sectionHeader}>ORDER DETAILS</Text>
                        <View style={styles.sectionBody}>
                            {[
                                { label: "Item Description", value: styleItemName },
                                ...(!isLabel ? [
                                    { label: "Tag / Card Ups", value: tagCardUps },
                                    { label: "Job Run Time", value: jobRunTime },
                                ] : []),
                                { label: "Follow Up", value: followUpName },
                                { label: "Designer", value: designerName },
                            ].map(({ label, value }) => (
                                <View key={label} style={styles.orderInfoRow}>
                                    <Text style={styles.orderInfoLabel}>{label}</Text>
                                    <Text style={styles.orderInfoColon}> : </Text>
                                    <Text style={styles.orderInfoValue}>{value || "—"}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* QR Code */}
                    <View style={{ flex: 0.6, alignItems: "center", justifyContent: "center", padding: 8 }}>
                        {qrCodeDataUrl ? (
                            <>
                                <Image src={qrCodeDataUrl} style={styles.qrImage} />
                                <Text style={styles.qrLabel}>Scan to identify</Text>
                            </>
                        ) : (
                            <View style={{ width: 56, height: 56, border: "1 dashed #ccc", borderRadius: 2, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontSize: 6, color: "#bbb", textAlign: "center" }}>QR Code</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ══════════════════════════════════════════════════
                    NON-LABEL LAYOUT
                ══════════════════════════════════════════════════ */}
                {!isLabel && (
                    <>
                        {/* ── SPECIFICATIONS ── */}
                        <View style={styles.sectionWrap}>
                            <Text style={styles.sectionTitle}>SPECIFICATIONS</Text>
                            <View style={styles.sectionContent}>
                                <View style={styles.specTable}>
                                    <SpecField label="GSM" value={findFromList(gsmId, gsmList?.data, "name")} />
                                    <SpecField label="Others / Board" value={findFromList(boardId, boardList, "name")} />
                                    <SpecField label="Full Board" value={fullBoardName} />
                                    <SpecField label="Cutting Size" value={cuttingSizeName} />
                                    <SpecField label="No. of Pockets" value={noOfPockets || "—"} />
                                    <SpecField label="Running Qty" value={runningQty || "—"} />
                                    <SpecField label="Plate Details" value={findFromList(plateId, plateList?.data, "name")} />
                                    <SpecField label="Die Details" value={findFromList(dieId, dieList?.data, "name")} />
                                    <SpecField label="Total Plate Sets" value={totalPlatesets || "—"} />
                                </View>
                            </View>
                        </View>

                        {/* ── BOARD QUALITY ── */}
                        {boardList?.length > 0 && (
                            <View style={styles.sectionWrap}>
                                <Text style={styles.sectionTitle}>BOARD QUALITY</Text>
                                <View style={[styles.sectionContent, { paddingVertical: 6 }]}>
                                    <View style={styles.gridRow}>
                                        {boardList.map((item) => (
                                            <Checkbox
                                                key={item.id}
                                                checked={selectedBoardIds.includes(item.id)}
                                                label={item.name}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ── PRINTING OPTIONS ── */}
                        <View style={styles.sectionWrap}>
                            <Text style={styles.sectionTitle}>PRINTING OPTIONS</Text>
                            <View style={[styles.sectionContent, { paddingVertical: 6 }]}>
                                <View style={styles.gridRow}>
                                    <Checkbox checked={isFourColor} label="4 Color" />
                                    <Checkbox checked={isCutColor} label="Cut Color" />
                                    <Checkbox checked={isFront} label="Front" />
                                    <Checkbox checked={isFrontAndBack} label="Front & Back" />
                                </View>
                            </View>
                        </View>

                        {/* ── PROCESS / VARNISH / LAMINATION ── */}
                        <View style={styles.threeCol}>
                            {/* Process */}
                            <View style={styles.threeColItem}>
                                <Text style={styles.sectionHeader}>PROCESS</Text>
                                <View style={styles.sectionContent}>
                                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                        {defaultList?.map((item) => (
                                            <View key={item.id} style={{ width: "50%", flexDirection: "row", alignItems: "center", paddingVertical: 2 }}>
                                                <View style={[styles.checkboxBox, selectedProcessIds.includes(item.id) && styles.checkboxChecked]}>
                                                    {selectedProcessIds.includes(item.id) && <Text style={styles.checkboxTick}>✓</Text>}
                                                </View>
                                                <Text style={[styles.checkLabel, { marginLeft: 4 }]}>{item.name}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Varnish */}
                            <LVSection title="VARNISH" items={varnishList} selectedList={savedVarnishes} />

                            {/* Lamination */}
                            <LVSection title="LAMINATION" items={laminationList} selectedList={savedLaminations} />
                        </View>

                        {/* ── MACHINE DETAILS ── */}
                        {machineList?.length > 0 && (
                            <View style={styles.sectionWrap}>
                                <Text style={styles.sectionTitle}>MACHINE DETAILS</Text>
                                <View style={[styles.sectionContent, { paddingVertical: 6 }]}>
                                    <View style={styles.gridRow}>
                                        {machineList.map((item) => (
                                            <Checkbox
                                                key={item.id}
                                                checked={selectedMachineIds.includes(item.id)}
                                                label={item.name}
                                            />
                                        ))}
                                    </View>
                                    {/* Machine Specifications — inline, no heading */}
                                    <View style={[styles.gridRow, { marginTop: 6, paddingTop: 5, borderTop: "1 solid #eee" }]}>
                                        <Checkbox checked={isCMYK} label="CMYK" />
                                        <Checkbox checked={isCutColMachine} label="Cut Col" />
                                        <Checkbox checked={isFrontMachine} label="Front" />
                                        <Checkbox checked={isFrontBackMachine} label="Front & Back" />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* ── SIZE DETAILS (non-label) ── */}
                        {jobCardSizeDetails && jobCardSizeDetails.length > 0 && trackingType && trackingType !== "None" && (
                            <View style={styles.sectionWrap}>
                                <Text style={styles.sectionTitle}>
                                    {trackingType === "Barcode"
                                        ? "BARCODE WISE DETAILS"
                                        : trackingType === "SizeTemplateBarcode"
                                            ? "SIZE + BARCODE WISE DETAILS"
                                            : "SIZE WISE DETAILS"}
                                </Text>
                                <View style={styles.sectionContent}>
                                    <SizeBreakupTable
                                        trackingType={trackingType}
                                        sizeDetails={jobCardSizeDetails}
                                        sizeList={sizeList}
                                    />
                                </View>
                            </View>
                        )}
                    </>
                )}

                {/* ══════════════════════════════════════════════════
                    LABEL LAYOUT
                ══════════════════════════════════════════════════ */}
                {isLabel && (
                    <>
                        {/* ── LABEL DETAILS + SIZE BREAKUP ── */}
                        <View style={styles.twoCol}>
                            <View style={[styles.colHalf, { borderRight: "1 solid #ddd" }]}>
                                <Text style={styles.sectionHeader}>LABEL DETAILS</Text>
                                <View style={styles.sectionBody}>
                                    {[
                                        { label: "Label Quality", value: labelQuality },
                                        { label: "Block", value: block },
                                        { label: "Label Qty", value: orderQty ? Number(orderQty) : "" },
                                        { label: "Roll Qty", value: rollQty },
                                        { label: "Cut & Seal", value: cutAndSeal },
                                    ].map(({ label, value }) => (
                                        <View key={label} style={styles.labelFieldRow}>
                                            <Text style={styles.labelFieldLabel}>{label}</Text>
                                            <Text style={styles.labelFieldValue}>: {value || "—"}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Size breakup for label — size name shown, never "All Items" */}
                            <View style={styles.colHalf}>
                                <Text style={styles.sectionHeader}>
                                    {trackingType === "Barcode"
                                        ? "BARCODE WISE DETAILS"
                                        : trackingType === "SizeTemplateBarcode"
                                            ? "SIZE + BARCODE WISE DETAILS"
                                            : "SIZE WISE DETAILS"}
                                </Text>
                                <View style={styles.sectionBody}>
                                    {jobCardSizeDetails && jobCardSizeDetails.length > 0 ? (
                                        <SizeBreakupTable
                                            trackingType={trackingType}
                                            sizeDetails={jobCardSizeDetails}
                                            sizeList={sizeList}
                                        />
                                    ) : (
                                        <Text style={{ fontSize: 7.5, color: "#aaa", fontStyle: "italic" }}>
                                            No size details available.
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Label layout: push remarks + signatures + footer to bottom */}
                        <View style={{ flex: 1 }} />
                    </>
                )}

                {/* ── REMARKS + SIGNATURES + FOOTER (both layouts, always at bottom for label) ── */}
                <FooterBlock remarks={remarks} branchName={branchData?.branchName} />

            </Page>
        </Document>
    );
};

export default JobCardPrintFormat;
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

// ─── COLOR PALETTE (mirrors PO theme) ─────────────────────────────────────────
// Primary Dark  : #1a1a2e   (deep charcoal navy)
// Secondary Dark: #2d2d44   (slate)
// Accent Light  : #f4f4f6   (near-white surface)
// Border        : #ddd / #ebebeb
// Text Primary  : #1a1a2e
// Text Muted    : #555 / #888
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // ── PAGE ──
    page: {
        fontFamily: "Helvetica",
        fontSize: 8,
        padding: 0,
        backgroundColor: "#fff",
    },

    // ── TOP ACCENT BAR ──
    topBar: {
        height: 4,
        backgroundColor: "#1a1a2e",
    },

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
    logo: {
        height: 52,
        width: 52,
    },
    companyCenter: {
        alignItems: "center",
    },
    companyName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1a1a2e",
        letterSpacing: 0.5,
    },
    companyRight: {
        width: 150,
        alignItems: "flex-start",
    },
    companyRightRow: {
        flexDirection: "row",
        marginBottom: 2,
        width: "100%",
    },
    companyLabel: {
        fontSize: 7.5,
        color: "#888",
        width: 38,
    },
    companyColon: {
        fontSize: 7.5,
        color: "#888",
        width: 8,
    },
    companyValue: {
        fontSize: 7.5,
        color: "#1a1a2e",
        fontWeight: "bold",
        flex: 1,
    },

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
    metaLabel: {
        fontSize: 7.5,
        color: "#888",
        marginRight: 3,
    },
    metaValue: {
        fontSize: 7.5,
        fontWeight: "bold",
        color: "#1a1a2e",
    },

    // ── TWO COLUMN CUSTOMER / ORDER INFO ──
    twoCol: {
        flexDirection: "row",
        marginHorizontal: 20,
        marginBottom: 10,
        border: "1 solid #ddd",
        borderRadius: 3,
    },
    colHalf: {
        flex: 1,
    },
    sectionHeader: {
        backgroundColor: "#2d2d44",
        color: "#e8e8f0",
        fontSize: 7.5,
        fontWeight: "bold",
        letterSpacing: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    sectionBody: {
        padding: 8,
    },
    infoName: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#1a1a2e",
        marginBottom: 3,
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    infoLabel: {
        fontSize: 7.5,
        color: "#888",
        width: 70,
    },
    infoValue: {
        fontSize: 7.5,
        color: "#222",
        fontWeight: "bold",
        flex: 1,
    },

    // ── SECTION WRAPPER (full-width cards) ──
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
    sectionContent: {
        padding: 8,
    },

    // ── GRID ROWS (checkbox-style display) ──
    gridRow: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    gridCell: {
        width: "25%",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 2,
    },
    checkboxBox: {
        width: 9,
        height: 9,
        border: "1 solid #888",
        borderRadius: 1,
        marginRight: 4,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: "#1a1a2e",
        border: "1 solid #1a1a2e",
    },
    checkboxTick: {
        color: "#fff",
        fontSize: 6,
    },
    checkLabel: {
        fontSize: 7.5,
        color: "#333",
    },

    // ── SPECIFICATIONS TABLE ──
    specTable: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    specCell: {
        width: "25%",
        paddingVertical: 3,
        paddingRight: 8,
    },
    specLabel: {
        fontSize: 6.5,
        color: "#888",
        fontWeight: "bold",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 1,
    },
    specValue: {
        fontSize: 8,
        color: "#1a1a2e",
        fontWeight: "bold",
    },

    // ── LV TABLE (Lamination / Varnish) ──
    lvTableHeader: {
        flexDirection: "row",
        borderBottom: "1 solid #ddd",
        paddingBottom: 3,
        marginBottom: 3,
    },
    lvHeaderType: {
        flex: 3,
        fontSize: 7,
        fontWeight: "bold",
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    lvHeaderCenter: {
        flex: 1,
        fontSize: 7,
        fontWeight: "bold",
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        textAlign: "center",
    },
    lvRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 2,
        borderBottom: "1 solid #f0f0f0",
    },
    lvName: {
        flex: 3,
        fontSize: 7.5,
        color: "#333",
    },
    lvCheck: {
        flex: 1,
        alignItems: "center",
    },

    // ── THREE COLUMN LAYOUT for process/lv/machine ──
    threeCol: {
        flexDirection: "row",
        marginHorizontal: 20,
        marginBottom: 8,
        gap: 8,
    },
    threeColItem: {
        flex: 1,
        border: "1 solid #ddd",
        borderRadius: 3,
        overflow: "hidden",
    },

    // ── REMARKS BAR ──
    remarksBar: {
        marginHorizontal: 20,
        marginBottom: 8,
        border: "1 solid #ddd",
        borderRadius: 3,
        overflow: "hidden",
    },
    remarksBody: {
        padding: 8,
        minHeight: 30,
    },
    remarksText: {
        fontSize: 7.5,
        color: "#555",
        lineHeight: 1.5,
    },

    // ── SIGNATURES ──
    sigArea: {
        marginHorizontal: 20,
        marginTop: 18,
        marginBottom: 8,
    },
    sigCompany: {
        textAlign: "right",
        fontSize: 8,
        fontWeight: "bold",
        color: "#1a1a2e",
        marginBottom: 18,
    },
    sigRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderTop: "1 solid #ddd",
        paddingTop: 4,
    },
    sigItem: {
        flex: 1,
        textAlign: "center",
        fontSize: 7.5,
        color: "#555",
        fontWeight: "bold",
    },

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
    footerLeft: {
        fontSize: 7,
        color: "rgba(255,255,255,0.5)",
    },
    footerRight: {
        fontSize: 7,
        color: "rgba(255,255,255,0.5)",
    },
});

// ── HELPERS ──────────────────────────────────────────────────────────────────

const Checkbox = ({ checked, label }) => (
    <View style={styles.gridCell}>
        <View style={[styles.checkboxBox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkLabel}>{label}</Text>
    </View>
);

const SpecField = ({ label, value }) => (
    <View style={styles.specCell}>
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

// ─────────────────────────────────────────────────────────────────────────────

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
}) => {
    if (!singleData) return null;

    const {
        docId,
        docDate,
        deliveryDate,
        orderType,
        orderQty,
        customerId,
        remarks,
        gsmId,
        boardId,
        fullBoard,
        cuttingSize,
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
        totalPlateSet,
        boardQualities,
        processDetails,
        laminationDetails,
        varnishDetails,
        machineDetails,
        jobRunTime
    } = singleData;

    const customer = customerList?.data?.find((c) => c.id === customerId);
    const orderEntry = orderList?.data?.find((o) => o.id === singleData?.orderEntryId);

    // Normalise arrays from saved detail records
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

                    </View>

                    <View style={styles.companyRight}>
                        <Text style={{ fontSize: 7.5, color: "#666", marginTop: 2 }}>
                            {branchData?.address || ""}
                        </Text>
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
                <Text style={styles.titleBand}>JOB CARD</Text>

                {/* ── META PILLS ── */}
                <View style={styles.metaRow}>
                    {[
                        { label: "Job Card No", value: docId },
                        { label: "Date", value: getDateFromDateTimeToDisplay(docDate) },
                        { label: "Order No", value: orderEntry?.docId || "-" },
                        { label: "Order Type", value: orderType },
                        { label: "Order Qty", value: orderQty ? Number(orderQty).toFixed(3) : "" },
                    ].map(({ label, value }) => (
                        <View key={label} style={styles.metaPill}>
                            <Text style={styles.metaLabel}>{label}:</Text>
                            <Text style={styles.metaValue}>{value}</Text>
                        </View>
                    ))}
                </View>

                {/* ── CUSTOMER / ORDER INFO ── */}
                <View style={styles.twoCol}>
                    {/* Customer */}
                    <View style={[styles.colHalf, { borderRight: "1 solid #ddd" }]}>
                        <Text style={styles.sectionHeader}>CUSTOMER DETAILS</Text>
                        <View style={styles.sectionBody}>
                            <Text style={styles.infoName}>{customer?.name || "—"}</Text>
                            {customer?.address ? (
                                <Text style={{ fontSize: 7.5, color: "#555", marginBottom: 4, lineHeight: 1.5 }}>
                                    {customer.address}
                                </Text>
                            ) : null}
                            {[
                                { label: "Contact Person", value: customer?.contactPersonName },
                                { label: "Phone", value: customer?.contactNumber },
                                { label: "GST No", value: customer?.gstNo },
                            ].map(({ label, value }) =>
                                value ? (
                                    <View key={label} style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>{label}</Text>
                                        <Text style={styles.infoValue}>: {value}</Text>
                                    </View>
                                ) : null
                            )}
                        </View>
                    </View>

                    {/* Order Info */}
                    <View style={styles.colHalf}>
                        <Text style={styles.sectionHeader}>OTHER DETAILS</Text>
                        <View style={styles.sectionBody}>
                            <View style={styles.specTable}>
                                <SpecField label="GSM" value={findFromList(gsmId, gsmList?.data, "name")} />
                                <SpecField label="Full Board" value={fullBoard || "—"} />
                                <SpecField label="No. of Pockets" value={noOfPockets || "—"} />
                                <SpecField label="Others / Board" value={findFromList(boardId, boardList, "name")} />
                                <SpecField label="Cutting Size" value={cuttingSize || "—"} />
                                <SpecField label="Running Qty" value={runningQty || "—"} />
                                <SpecField label="Plate Type" value={findFromList(plateId, plateList?.data, "name")} />
                                <SpecField label="Total Plate Set" value={totalPlateSet || "—"} />
                                <SpecField label="Die" value={findFromList(dieId, dieList?.data, "name")} />
                                <SpecField label="Job Run Time" value={jobRunTime || "—"} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── BOARD QUALITY SECTION (like PRINTING OPTIONS) ── */}
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

                {/* ── PRINTING FLAGS ── */}
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
                            {defaultList?.map((item) => (
                                <View key={item.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 2 }}>
                                    <View style={[styles.checkboxBox, selectedProcessIds.includes(item.id) && styles.checkboxChecked]}>
                                        {selectedProcessIds.includes(item.id) && <Text style={styles.checkboxTick}>✓</Text>}
                                    </View>
                                    <Text style={[styles.checkLabel, { marginLeft: 4 }]}>{item.name}</Text>
                                </View>
                            ))}
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
                                <Checkbox checked={isCMYK} label="CMYK" />
                                <Checkbox checked={isCutColMachine} label="Cut Col" />
                                <Checkbox checked={isFrontMachine} label="Front" />
                                <Checkbox checked={isFrontBackMachine} label="Front & Back" />
                            </View>
                        </View>
                    </View>
                )}

                {/* ── REMARKS ── */}
                <View style={styles.remarksBar}>
                    <Text style={styles.sectionTitle}>REMARKS</Text>
                    <View style={styles.remarksBody}>
                        <Text style={styles.remarksText}>{remarks || ""}</Text>
                    </View>
                </View>

                {/* ── SIGNATURES ── */}
                <View style={styles.sigArea} >
                    <Text style={styles.sigCompany}>For {branchData?.branchName || ""}</Text>
                    <View style={styles.sigRow}>
                        {["Designer sign", "Incharge sign", "Proprietor sign", "Operator sign"].map((role) => (
                            <Text key={role} style={styles.sigItem}>{role}</Text>
                        ))}
                    </View>
                </View>

                {/* ── FOOTER BAR ── */}
                <View style={styles.footerBar}>
                    <Text style={styles.footerLeft}></Text>
                    <Text
                        style={styles.footerRight}
                        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
                    />
                </View>

            </Page>
        </Document>
    );
};

export default JobCardPrintFormat;
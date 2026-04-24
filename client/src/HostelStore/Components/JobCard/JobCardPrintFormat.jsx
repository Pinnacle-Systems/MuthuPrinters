import {
    Document,
    Page,
    View,
    Text,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";
import moment from "moment";

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 8,
        fontFamily: "Helvetica",
    },

    topBar: {
        height: 6,
        backgroundColor: "#4f46e5",
        marginBottom: 10,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    companyName: {
        fontSize: 12,
        fontWeight: "bold",
    },

    title: {
        marginTop: 10,
        textAlign: "center",
        fontSize: 12,
        fontWeight: "bold",
        backgroundColor: "#eef2ff",
        padding: 4,
    },

    section: {
        marginTop: 10,
        border: "1 solid #ddd",
    },

    sectionHeader: {
        backgroundColor: "#f1f5f9",
        padding: 4,
        fontWeight: "bold",
    },

    sectionBody: {
        padding: 5,
    },

    row: {
        flexDirection: "row",
        marginBottom: 3,
    },

    label: {
        width: "30%",
        color: "#555",
    },

    value: {
        width: "70%",
        fontWeight: "bold",
    },

    grid2: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    gridItem: {
        width: "50%",
        marginBottom: 3,
    },

    tableRow: {
        flexDirection: "row",
        borderBottom: "1 solid #eee",
        paddingVertical: 3,
    },

    th: {
        fontWeight: "bold",
    },

    footer: {
        marginTop: 15,
        borderTop: "1 solid #ddd",
        paddingTop: 5,
        flexDirection: "row",
        justifyContent: "space-between",
    },
});

const JobCardPrintFormat = ({ singleData, branchData, customerList }) => {
    if (!singleData) return null;

    const customer =
        customerList?.data?.find((c) => c.id === singleData.customerId) || {};

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* TOP BAR */}
                <View style={styles.topBar} />

                {/* HEADER */}
                {/* <View style={styles.header}>
                    <Text style={styles.companyName}>
                        {branchData?.branchName}
                    </Text>
                    <Text>{branchData?.address}</Text>
                </View> */}

                {/* TITLE */}
                <Text style={styles.title}>JOB CARD</Text>

                {/* BASIC DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>BASIC DETAILS</Text>
                    <View style={styles.sectionBody}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Doc No</Text>
                            <Text style={styles.value}>{singleData.docId}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>
                                {moment(singleData.docDate).format("DD-MM-YYYY")}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Order Type</Text>
                            <Text style={styles.value}>{singleData.orderType}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Order Qty</Text>
                            <Text style={styles.value}>{singleData.orderQty}</Text>
                        </View>
                    </View>
                </View>

                {/* CUSTOMER */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>CUSTOMER DETAILS</Text>
                    <View style={styles.sectionBody}>
                        <Text>{customer.name}</Text>
                        <Text>{customer.contactNumber}</Text>
                    </View>
                </View>

                {/* BOARD DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>BOARD DETAILS</Text>
                    <View style={styles.sectionBody}>
                        <Text>GSM: {singleData.gsmId}</Text>
                        <Text>Cutting Size: {singleData.cuttingSize}</Text>
                        <Text>Running Qty: {singleData.runningQty}</Text>
                    </View>
                </View>

                {/* PROCESS */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PROCESS</Text>
                    <View style={styles.sectionBody}>
                        {singleData.processDetails?.map((p, i) => (
                            <Text key={i}>• {p.name}</Text>
                        ))}
                    </View>
                </View>

                {/* LAMINATION / VARNISH TABLE */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>LAMINATION / VARNISH</Text>

                    <View style={[styles.tableRow, styles.th]}>
                        <Text style={{ width: "50%" }}>Type</Text>
                        <Text style={{ width: "25%" }}>Front</Text>
                        <Text style={{ width: "25%" }}>F&B</Text>
                    </View>

                    {[...(singleData.laminationDetails || []), ...(singleData.varnishDetails || [])].map((l, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={{ width: "50%" }}>{l.name}</Text>
                            <Text style={{ width: "25%" }}>{l.isFront ? "✔" : ""}</Text>
                            <Text style={{ width: "25%" }}>{l.isFrontAndBack ? "✔" : ""}</Text>
                        </View>
                    ))}
                </View>

                {/* MACHINE */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>MACHINE DETAILS</Text>
                    <View style={styles.sectionBody}>
                        {singleData.machineDetails?.map((m, i) => (
                            <Text key={i}>• {m.name}</Text>
                        ))}
                    </View>
                </View>

                {/* PLATE & DIE */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>PLATE & DIE</Text>
                    <View style={styles.sectionBody}>
                        <Text>Plate: {singleData.plateId}</Text>
                        <Text>Total Plates: {singleData.totalPlateSet}</Text>
                        <Text>Die: {singleData.dieId}</Text>
                    </View>
                </View>

                {/* REMARKS */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>REMARKS</Text>
                    <View style={styles.sectionBody}>
                        <Text>{singleData.remarks}</Text>
                    </View>
                </View>

                {/* SIGNATURE */}
                <View style={styles.footer}>
                    <Text>Prepared By</Text>
                    <Text>Approved By</Text>
                </View>

            </Page>
        </Document>
    );
};

export default JobCardPrintFormat;
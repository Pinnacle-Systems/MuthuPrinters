


import {
  Document,
  Page,
  View,
  Text,
  Image,
  Font,
  StyleSheet,
} from "@react-pdf/renderer";
import Logo from "../../../../../src/assets/mplogo.png";
import { numberToWords } from "number-to-words";
import { findFromList, getCommonParams, getDateFromDateTimeToDisplay } from "../../../../Utils/helper";


// Font registration
Font.register({
  family: "Roboto",
  src: "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,600;1,400;1,600&display=swap",
});

const styles = StyleSheet.create({
  // page: {
  //   fontFamily: "Helvetica",
  //   fontSize: 8,
  //   padding: 10,
  //   border: "1 solid #000",
  // },
  borderBox: { border: "1 solid black", margin: 0, padding: 8, },
  page: {
    // fontFamily: "Helvetica",
    fontSize: 8,
    padding: 0,
    border: "1 solid #000",
  },
  header: {
    alignItems: "center",
    textAlign: "center",
    marginBottom: 7,
    justifyContent: "space-between",
    flexDirection: "row",
    padding: 7,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,

  },
  logo: {
    // width: 60,
    height: 40,
    marginRight: 6,
  },
  companyText: {
    fontSize: 9,
    marginBottom: 1,
    textAlign: "left",
    marginRight: 4
  },
  greenTitle: {
    textAlign: "center",
    fontSize: 15,
    color: "#FFFF",
    backgroundColor: "#1D3A76",
    paddingVertical: 4,
    // borderBottom: "18 solid #1D3A76",

    fontWeight: "500",
    // marginVertical: 4,
    // textDecoration: "underline",
    // marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    border: "1 solid #000",
    justifyContent: "space-between",
    padding: 4,
  },
  infoLeft: { flex: 1 },
  infoRight: {
    width: 80,
    height: 80,
    border: "1 solid #000",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFF",
    // backgroundColor: "#e6ffe6",
    backgroundColor: "#1D3A76",
    padding: 6,
    marginBottom: 2
  },
  boxRow: {
    flexDirection: "row",
    border: "1 solid #000",
    marginTop: 4,
  },
  boxCol: {
    flex: 1,
    borderRight: "1 solid #000",
  },
  boxContent: {
    padding: 4,
    fontSize: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderTop: "1 solid #000",
    borderBottom: "1 solid #000",
    marginTop: 6,
    backgroundColor: "#1D3A76",
    // padding: 3,
    color: "#FFFF"
  },
  th: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    borderRight: "1 solid #fff",
    padding: 4,
    color: "#FFFF",
  },
  td: {
    flex: 1,
    fontSize: 8,
    textAlign: "center",
    borderRight: "1 solid #e5e7eb",      // was "1 solid #000"
    // borderBottom: "1 solid #e5e7eb", 
    padding: 3,
  },
  totalRow: {
    flexDirection: "row",
    borderTop: "1 solid #000",
  },
  totalLabel: {
    flex: 8,
    textAlign: "center",
    fontSize: 8,
    fontWeight: "bold",
    padding: 3,
  },
  totalValue: {
    flex: 1.2,
    textAlign: "right",
    fontSize: 8,
    padding: 3,
  },
  taxBox: {
    width: 180,
    border: "1 solid #000",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  taxHeader: {
    backgroundColor: "#d1fae5",
    borderBottom: "1 solid #000",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 8,
    padding: 3,
  },
  taxRow: {
    flexDirection: "row",
    borderTop: "1 solid #000",
  },
  taxLabel: { flex: 1, padding: 3, fontSize: 8 },
  taxValue: {
    flex: 1,
    textAlign: "right",
    padding: 3,
    fontSize: 8,
  },
  remarksSection: {
    marginTop: 6,
  },
  footer: {
    marginTop: 10,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  signature: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 8,
  },
  pageNumber: {
    position: "absolute",
    bottom: 10,
    right: 30,
    fontSize: 7,
    color: "#555",
  },
  poDetails: {
    marginTop: 10,
    width: "50%", // adjust as needed
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  label: {
    fontSize: 8,
    fontWeight: "bold",
  },

  value: {
    fontSize: 8,
    textAlign: "right",
    flexShrink: 1, // helps long text wrap properly
  },
});
const PurchaseOrderPrintFormat = ({
  singleData,
  supplierDetails,
  deliveryTo,
  deliveryType,
  branchData,
  taxDetails,
  taxGroupWise,
  colorList,
  uomList,
  sizeList,
  styleItemList,
  discountType,
  discountValue,
}) => {

  // ✅ Pull all fields from singleData
  const poNumber = singleData?.docId || "";
  const quoteVersion = singleData?.quoteVersion || "";
  const poDate = singleData?.docDate || "";
  const dueDate = singleData?.dueDate || "";
  const remarks = singleData?.remarks || "";
  const term = singleData?.termsAndCondtion || "";
  const poItems = singleData?.poItems || [];

  const filledPoItems = poItems.filter((i) => i.styleItemId && i.quoteVersion === quoteVersion);

  if (!singleData) return null;

  return (
    <Document>
      <Page size="A4" style={styles.borderBox}>
        <View style={styles.page}>

          {/* ── HEADER ── */}
          <View style={styles.header}>
            <View style={{ width: 125, flexWrap: "wrap" }}>
              <Text style={styles.companyText}>{branchData?.address || ""}</Text>
              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.companyText, { width: 40 }]}>Mobile</Text>
                <Text style={styles.companyText}>: {branchData?.contactMobile || ""}</Text>
              </View>

              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.companyText, { width: 40 }]}>GST No</Text>
                <Text style={styles.companyText}>: {branchData?.company?.gstNo || ""}</Text>
              </View>
              <View >
                <Text style={[styles.companyText, { width: 40 }]}>Email :</Text>
                <Text style={[styles.companyText,]}>{branchData?.contactEmail || ""}</Text>
              </View>
            </View>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 19, color: "#1D3A76", fontWeight: "bold", marginBottom: 4, marginTop: 10 }}>
                {branchData?.branchName || ""}
              </Text>
            </View>
            <Image src={Logo} style={styles.logo} />
          </View>

          {/* ── TITLE ── */}
          <Text style={styles.greenTitle}>PURCHASE ORDER</Text>

          {/* ── PO META ── */}
          <View style={{ alignItems: "flex-end", marginTop: 5, marginBottom: 3, marginRight: 7 }}>
            {[
              { label: "PO No", value: poNumber },
              { label: "PO Date", value: getDateFromDateTimeToDisplay(poDate) },
              { label: "Due Date", value: getDateFromDateTimeToDisplay(dueDate) },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: "row", marginBottom: 3 }}>
                <Text style={[styles.companyText, { width: 50 }]}>{label}</Text>
                <Text style={[styles.companyText, { width: 70 }]}>: {value}</Text>
              </View>
            ))}
            {
              quoteVersion > 1 && (
                <View style={{ flexDirection: "row", marginBottom: 3 }}>
                  <Text style={[styles.companyText, { width: 50, color: "red" }]}>Revised PO</Text>
                  <Text style={[styles.companyText, { width: 70 }]}>: {quoteVersion}</Text>
                </View>
              )
            }
          </View>

          {/* ── SUPPLIER & DELIVERY ── */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>SUPPLIER DETAILS</Text>
              <View style={styles.boxContent}>
                <Text style={{ fontWeight: "bold", color: "#0F766E", marginBottom: 4 }}>{supplierDetails?.name}</Text>
                <Text style={{ textTransform: "uppercase", marginBottom: 2 }}>{supplierDetails?.address}</Text>
                {[
                  { label: "Mobile No", value: supplierDetails?.contactNumber },
                  { label: "GST No", value: supplierDetails?.gstNo },
                  { label: "Email", value: supplierDetails?.contactPersonEmail },
                ].map(({ label, value }) => value ? (
                  <View key={label} style={{ flexDirection: "row" }}>
                    <Text style={[styles.companyText, { width: 70 }]}>{label}</Text>
                    <Text style={styles.companyText}>: {value}</Text>
                  </View>
                ) : null)}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>DELIVERY TO</Text>
              <View style={styles.boxContent}>
                <Text style={{ fontWeight: "bold", color: "#0F766E", marginBottom: 4 }}>
                  {deliveryType === "ToSelf" ? deliveryTo?.branchName : deliveryTo?.name}
                </Text>
                <Text style={{ textTransform: "uppercase", marginBottom: 2 }}>{deliveryTo?.address}</Text>
                {[
                  { label: "Mobile No", value: deliveryTo?.contactMobile },
                  { label: "GST No", value: deliveryTo?.gstNo },
                  { label: "Email", value: deliveryType === "ToSelf" ? deliveryTo?.contactEmail : deliveryTo?.email },
                ].map(({ label, value }) => value ? (
                  <View key={label} style={{ flexDirection: "row" }}>
                    <Text style={[styles.companyText, { width: 70 }]}>{label}</Text>
                    <Text style={styles.companyText}>: {value}</Text>
                  </View>
                ) : null)}
              </View>
            </View>
          </View>

          {/* ── TABLE HEADER ── */}
          <View style={styles.tableHeader}>
            {[
              { label: "S.No", flex: 0.5 },
              { label: "Item", flex: 4 },
              { label: "Size", flex: 1.5 },
              { label: "Color", flex: 1.5 },
              { label: "UOM", flex: 1 },
              { label: "Qty", flex: 1 },
              { label: "Rate", flex: 1 },
              { label: "Tax(%)", flex: 1 },
              { label: "Amount", flex: 1.2 },
            ].map(({ label, flex }) => (
              <Text key={label} style={[styles.th, { flex }]}>{label}</Text>
            ))}
          </View>

          {/* ── TABLE ROWS ── */}
          {/* {filledPoItems.map((val, index) => {
            const gross = !isNaN(val.qty * val.price) ? (val.qty * val.price).toFixed(2) : "";
            return (
              <View key={index} style={{ flexDirection: "row", borderBottom: "1 solid #d1d5db" }}>
                <Text style={[styles.td, { flex: 0.5 }]}>{index + 1}</Text>
                <Text style={[styles.td, { flex: 4 }]}>
                  {findFromList(val.styleItemId, styleItemList?.data, "name")}
                </Text>
                <Text style={[styles.td, { flex: 1.5 }]}>
                  {val.Size?.name || findFromList(val.sizeId, sizeList?.data, "name")}
                </Text>
                <Text style={[styles.td, { flex: 1.5 }]}>
                  {val.Color?.name || findFromList(val.colorId, colorList?.data, "name")}
                </Text>
                <Text style={[styles.td, { flex: 1 }]}>
                  {val.Uom?.name || findFromList(val.uomId, uomList?.data, "name")}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                  {isNaN(val.qty) ? "" : parseFloat(val.qty).toFixed(3)}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                  {isNaN(val.price) ? "" : parseFloat(val.price).toFixed(2)}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                  {isNaN(val.taxPercent) ? "" : parseFloat(val.taxPercent).toFixed(2)}
                </Text>
                <Text style={[styles.td, { flex: 1.2, textAlign: "right" }]}>
                  {gross}
                </Text>
              </View>
            );
          })} */}
          {/* ── TABLE ROWS ── */}
          {(() => {
            const minRows = 14;
            const filledRows = filledPoItems.map((val, index) => {
              const gross = !isNaN(val.qty * val.price) ? (val.qty * val.price).toFixed(2) : "";
              return (
                <View key={index} style={{ flexDirection: "row", borderBottom: "1 solid #e5e7eb" }}>
                  <Text style={[styles.td, { flex: 0.5 }]}>{index + 1}</Text>
                  <Text style={[styles.td, { flex: 4, textAlign: "left" },]}>
                    {findFromList(val.styleItemId, styleItemList?.data, "name")}
                  </Text>
                  <Text style={[styles.td, { flex: 1.5, textAlign: "left" }]}>
                    {val.Size?.name || findFromList(val.sizeId, sizeList?.data, "name")}
                  </Text>
                  <Text style={[styles.td, { flex: 1.5, textAlign: "left" }]}>
                    {val.Color?.name || findFromList(val.colorId, colorList?.data, "name")}
                  </Text>
                  <Text style={[styles.td, { flex: 1, textAlign: "left" }]}>
                    {val.Uom?.name || findFromList(val.uomId, uomList?.data, "name")}
                  </Text>
                  <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                    {isNaN(val.qty) ? "" : parseFloat(val.qty).toFixed(3)}
                  </Text>
                  <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                    {isNaN(val.price) ? "" : parseFloat(val.price).toFixed(2)}
                  </Text>
                  <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                    {isNaN(val.taxPercent) ? "" : parseFloat(val.taxPercent).toFixed(2)}
                  </Text>
                  <Text style={[styles.td, { flex: 1.2, textAlign: "right" }]}>{gross}</Text>
                </View>
              );
            });

            const emptyRowsCount = Math.max(0, minRows - filledPoItems.length);
            const emptyRows = Array.from({ length: emptyRowsCount }).map((_, i) => (
              <View key={`empty-${i}`} style={{ flexDirection: "row", borderBottom: "1 solid #e5e7eb" }}>
                <Text style={[styles.td, { flex: 0.5 }]}> </Text>
                <Text style={[styles.td, { flex: 4 }]}> </Text>
                <Text style={[styles.td, { flex: 1.5 }]}> </Text>
                <Text style={[styles.td, { flex: 1.5 }]}> </Text>
                <Text style={[styles.td, { flex: 1 }]}> </Text>
                <Text style={[styles.td, { flex: 1 }]}> </Text>
                <Text style={[styles.td, { flex: 1 }]}> </Text>
                <Text style={[styles.td, { flex: 1 }]}> </Text>
                <Text style={[styles.td, { flex: 1.2 }]}> </Text>
              </View>
            ));

            return [...filledRows, ...emptyRows];
          })()}

          {/* ── TOTAL ROW ── */}
          <View style={{ flexDirection: "row", borderBottom: "1 solid #e5e7eb" }}>
            <Text style={{ flex: 10, textAlign: "center", fontSize: 8, fontWeight: "bold", padding: 3 }}>
              TOTAL
            </Text>
            <Text style={{ flex: 1, textAlign: "right", fontSize: 8, padding: 3, borderLeft: "1 solid #e5e7eb" }}>
              {parseFloat(taxDetails?.taxable || 0).toFixed(2)}
            </Text>
          </View>

          {/* ── TAX BOX ── */}
          <View style={{ alignSelf: "flex-end", border: "1 solid #e5e7eb", width: 120 }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", textAlign: "center", padding: 2, backgroundColor: "#1D3A76", color: "#FFFF" }}>
              TAX DETAILS
            </Text>
            <View style={{ flexDirection: "row", borderTop: "1 solid #9ca3af" }}>
              <Text style={{ flex: 1, fontSize: 8, padding: 3 }}>Taxable</Text>
              <Text style={{ flex: 1, textAlign: "right", fontSize: 8, padding: 3 }}>
                {parseFloat(taxDetails?.taxable || 0).toFixed(2)}
              </Text>
            </View>
            {
              taxDetails?.slabBreakup?.filter((item) => item.amount > 0)?.map((i) => (
                <View key={i.tax} style={{ flexDirection: "row", borderTop: "1 solid #e5e7eb" }}>
                  <Text style={{ flex: 1, fontSize: 8, padding: 3 }}>{i.tax}</Text>
                  <Text style={{ flex: 1, textAlign: "right", fontSize: 8, padding: 3 }}>
                    {parseFloat(i.amount || 0).toFixed(2)}
                  </Text>
                </View>
              ))
            }
            <View style={{ flexDirection: "row", borderTop: "1 solid #9ca3af", backgroundColor: "#1D3A76", color: "#FFFF" }}>
              <Text style={{ flex: 1, fontSize: 8, padding: 3, color: "#FFFF" }}>Net Amount</Text>
              <Text style={{ flex: 1, textAlign: "right", fontSize: 8, padding: 3, color: "#FFFF" }}>
                {parseFloat(taxDetails?.net || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* ── REMARKS & TERMS ── */}
          <View style={{ marginTop: 6, border: "1 solid #e5e7eb", borderRadius: 4 }}>
            <View style={{ backgroundColor: "#1D3A76", paddingVertical: 5, paddingHorizontal: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: "bold", color: "#FFFFFF"}}>
                Amount in Words :  

                {numberToWords
                  .toWords(taxDetails?.net || 0)
                  .replace(/,/g, "")           // remove commas only
                  .replace(/-/g, " ")          // ✅ hyphen → space (gives "Fifty Five")
                  .replace(/\b\w/g, (c) => c.toUpperCase()) +
                  " Only"}

              </Text>
            </View>
            <View style={{ flexDirection: "row", borderTop: "1 solid #e5e7eb", minHeight: 60 }}>
              <View style={{ flex: 0.4, borderRight: "1 solid #e5e7eb", padding: 6, backgroundColor: "#f0f4ff", }}>
                <Text style={{ fontSize: 8, fontWeight: "bold", color: "#1D3A76" }}>Remarks:</Text>
                <Text style={{ fontSize: 8 }}>{remarks || ""}</Text>
              </View>
              <View style={{ flex: 0.6, padding: 6 }}>
                <Text style={{ fontSize: 8, fontWeight: "bold", color: "#1D3A76" }}>Terms & Conditions:</Text>
                <Text style={{ fontSize: 8 }}>{term || ""}</Text>
              </View>
            </View>
          </View>

          {/* ── SIGNATURES ── */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 8, textAlign: "right", fontWeight: "bold", marginRight: 4 }}>
              For {branchData?.branchName}
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
        <View style={{ marginTop: 10, textAlign: "center" }}>
          <Text
            style={{ fontSize: 7, textAlign: "center", color: "#555" }}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};


export default PurchaseOrderPrintFormat;


import React, { useEffect, useState, useRef, useMemo } from "react";
import Swal from "sweetalert2";
import { TextInput, DropdownInput, DateInputNew } from "../../../Inputs";
import {
  useAddSalesDeliveryMutation,
  useUpdateSalesDeliveryMutation,
  useDeleteSalesDeliveryMutation,
  useGetSalesDeliveryByIdQuery,
  useGetSalesDeliveryQuery,
} from "../../../redux/uniformService/SalesDeliveryService";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import { dropDownListObject } from "../../../Utils/contructObject";
import SalesDeliveryItems from "./SalesDeliveryItems.jsx";
import moment from "moment";
import { PDFViewer } from "@react-pdf/renderer";
import Modal from "../../../UiComponents/Modal";
import SalesDeliveryPrintFormat from "./SalesDeliveryPrintFormat.jsx";
import tw from "../../../Utils/tailwind-react-pdf";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { FiEdit2, FiSave, FiPrinter, FiEye } from "react-icons/fi";
import { HiOutlineRefresh, HiX } from "react-icons/hi";
import {
  CommonFormFooter,
  TransactionActions,
  TransactionLayout,
} from "../../../Basic/components/Reuseable";
import { useGetTaxTemplateQuery } from "../../../redux/services/TaxTemplateServices.js";
import { calculateTaxWithHSNBreakupAndInsertIntoPoItems } from "../../../Utils/taxSummary";
import PoSummary from "../PurchaseOrder/PoSummary";
import { useGetPartyByIdQuery } from "../../../redux/services/PartyMasterService";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import { PartyMaster } from "../index.js";
import { PayTermMaster } from "../../../Basic/components/index.js";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { useDispatch } from "react-redux";

export const receiptTypes = [
  { show: "Delivery cum Invoice", value: "AGAINST_INVOICE" },
  { show: "Delivery only", value: "WITHOUT_INVOICE" },
];

const EMPTY_ROW = {
  styleItemId: "",
  uomId: "",
  hsnId: "",
  qty: "",
  price: "",
  amount: "",
};

const padItems = (itemsArray = []) => {
  const minLength = 14;
  const currentLength = itemsArray.length;
  if (currentLength < minLength) {
    const padding = Array.from({ length: minLength - currentLength }, () => ({
      ...EMPTY_ROW,
    }));
    return [...itemsArray, ...padding];
  }
  return itemsArray;
};

const SalesDeliveryForm = ({
  readOnly,
  setReadOnly,
  id,
  setId,
  onClose,
  termsData,
  customerList,
  payTermList,
  hasPermission,
}) => {
  const { branchId, companyId, finYearId, userId } = getCommonParams();

  const [docId, setDocId] = useState("New");
  const [docDate, setDocDate] = useState(moment().format("YYYY-MM-DD"));
  const [deliveryDate, setDeliveryDate] = useState(
    moment().format("YYYY-MM-DD"),
  );
  const [customerId, setCustomerId] = useState("");
  const [dcNo, setDcNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [deliveryType, setDeliveryType] = useState("AGAINST_INVOICE");
  const [remarks, setRemarks] = useState("");
  const [termsAndCondition, setTermsAndCondition] = useState("");
  const [termsId, setTermsId] = useState("");
  const [items, setItems] = useState(padItems([]));
  const [taxTemplateId, setTaxTemplateId] = useState("");
  const [summary, setSummary] = useState(false);
  const [discountType, setDiscountType] = useState("Percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [payTermId, setPayTermId] = useState("");
  const childRecord = useRef(0);

  const customerRef = useRef(null);
  const termsRef = useRef(null);

  const effectiveReadOnly = readOnly || childRecord.current > 0;
  const isCumInvoice = deliveryType === "AGAINST_INVOICE";

  const dispatch = useDispatch();

  const { data: allData } = useGetSalesDeliveryQuery({ params: { branchId } });
  const { data: singleData } = useGetSalesDeliveryByIdQuery(id, { skip: !id });
  const { data: taxTypeList } = useGetTaxTemplateQuery({
    params: { companyId },
  });
  const { data: supplierData } = useGetPartyByIdQuery(customerId, {
    skip: !customerId,
  });
  const [dispatchInvalidate] = useInvalidateTags();

  const [addData] = useAddSalesDeliveryMutation();
  const [updateData] = useUpdateSalesDeliveryMutation();

  useEffect(() => {
    if (!id && allData?.nextDocId) {
      setDocId(allData.nextDocId);
    }
  }, [id, allData]);

  useEffect(() => {
    if (id && singleData?.data) {
      const data = singleData.data;
      setDocId(data.docId);
      setDocDate(moment(data.docDate).format("YYYY-MM-DD"));
      setDeliveryDate(
        data.deliveryDate
          ? moment(data.deliveryDate).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
      );
      setCustomerId(data.customerId);
      setDcNo(data.dcNo || "");
      setVehicleNo(data.vehicleNo || "");
      setDeliveryType(data.deliveryType || "AGAINST_INVOICE");
      setRemarks(data.remarks || "");
      setTermsAndCondition(data.termsAndCondition || "");
      setTermsId(data.termsId || "");
      setTaxTemplateId(data.taxTemplateId || "");
      setPayTermId(data.payTermId || "");
      setDiscountType(data.discountType || "Percentage");
      setDiscountValue(data.discountValue || 0);
      childRecord.current = data?.childRecord ? data?.childRecord : 0;
      setItems(padItems(data.salesDeliveryItems || []));
    }
  }, [id, singleData]);

  useEffect(() => {
    customerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (termsId && termsData?.data && !id) {
      const term = termsData.data.find((t) => t.id === termsId);
      if (term) setTermsAndCondition(term.description);
    }
  }, [termsId, termsData]);

  useEffect(() => {
    if (!id) {
      setTaxTemplateId(
        taxTypeList?.data?.filter((item) => item.name === "DEFAULT")[0]?.id,
      );
    }
  }, []);

  const validateRows = (items) => {
    const errors = [];
    const seen = new Set();
    items.forEach((item, index) => {
      if (!item.styleItemId) errors.push(`Row ${index + 1}: Style is required`);
      if (!item.hsnId) errors.push(`Row ${index + 1}: HSN is required`);
      if (!item.uomId) errors.push(`Row ${index + 1}: UOM is required`);
      if (!item.qty || Number(item.qty) <= 0)
        errors.push(`Row ${index + 1}: Qty is required`);
      const key = `${item.styleItemId}_${item.uomId}`;
      if (seen.has(key)) {
        errors.push(`Row ${index + 1}: Duplicate item found`);
      } else {
        seen.add(key);
      }
    });
    return errors;
  };

  const handleSave = async (pendingAction = null) => {
    if (!customerId) {
      Swal.fire({
        title: "Warning",
        text: "Please select a Customer.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    if (isCumInvoice && !taxTemplateId) {
      Swal.fire({
        title: "Warning",
        text: "Please select a Tax Template.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    if (isCumInvoice && !payTermId) {
      Swal.fire({
        title: "Warning",
        text: "Please select a Pay Term.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    if (!deliveryDate) {
      Swal.fire({
        title: "Warning",
        text: "Delivery Date is required",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const filteredItems = items.filter((item) => item.styleItemId);
    if (filteredItems.length === 0) {
      Swal.fire({
        title: "Warning",
        text: "Please add at least one item.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    const rowErrors = validateRows(filteredItems);
    if (rowErrors.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Row Validation Error",
        html: `<div style="text-align:left">${rowErrors.join("<br/>")}</div>`,
      });
      return false;
    }
    if (isCumInvoice) {
      const hasMissingPrice = filteredItems.some(
        (item) => !item.price || parseFloat(item.price) <= 0,
      );
      if (hasMissingPrice) {
        Swal.fire({
          title: "Warning",
          text: "Please enter a valid price for all selected items.",
          icon: "warning",
          confirmButtonColor: "#3085d6",
        });
        return;
      }
    }

    const payload = {
      userId,
      branchId,
      companyId,
      finYearId,
      docDate,
      deliveryDate,
      customerId,
      dcNo,
      vehicleNo,
      deliveryType,
      remarks,
      termsAndCondition,
      termsId,
      taxTemplateId: isCumInvoice ? taxTemplateId : null,
      salesDeliveryItems: filteredItems,
      payTermId: isCumInvoice ? payTermId : null,
      discountType,
      discountValue,
      id,
    };

    try {
      let savedId = id;
      if (id && !window.confirm("Are you sure you want to update the details?"))
        return;
      if (id) {
        await updateData(payload).unwrap();
        Swal.fire({
          title: "Success",
          text: "Sales Delivery updated successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          didClose: () => {
            customerRef.current?.focus();
          },
        });
      } else {
        const res = await addData(payload).unwrap();
        savedId = res.data.id;
        setId(savedId);
        Swal.fire({
          title: "Success",
          text: "Sales Delivery created successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          didClose: () => {
            customerRef.current?.focus();
          },
        });
      }
      setReadOnly(true);
      dispatchInvalidate();

      if (pendingAction === "new") onNew();
      else if (pendingAction === "close") onClose();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.data?.message || "Failed to save Sales Delivery",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      handleSave();
    }
  };

  const onNew = () => {
    setId("");
    setReadOnly(false);
    setDocId("New");
    setDocDate(moment().format("YYYY-MM-DD"));
    setDeliveryDate(moment().format("YYYY-MM-DD"));
    setCustomerId("");
    setDcNo("");
    setVehicleNo("");
    setDeliveryType("AGAINST_INVOICE");
    setRemarks("");
    setTermsAndCondition("");
    setTermsId("");
    setTaxTemplateId("");
    setPayTermId("");
    setItems(padItems([]));
    setDiscountType("Percentage");
    setDiscountValue(0);
  };

  const actionButtonClass =
    "px-3 py-2 rounded-md flex items-center justify-center text-sm text-white transition";

  const leftActions = [
    ...(!effectiveReadOnly
      ? [
          {
            key: "saveAndClose",
            icon: (
              <span className="flex items-center gap-1">
                <FiSave className="h-4 w-4" />
                <HiX className="h-4 w-4" />
              </span>
            ),
            hoverLabel: "Save & Close",
            iconOnly: true,
            onClick: () => handleSave("close"),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleSave("close");
              }
            },
            className: `bg-indigo-500 hover:bg-indigo-600 ${actionButtonClass}`,
          },
          {
            key: "saveAndNew",
            icon: (
              <span className="flex items-center gap-1">
                <FiSave className="h-4 w-4" />
                <HiOutlineRefresh className="h-4 w-4" />
              </span>
            ),
            hoverLabel: "Save & New",
            iconOnly: true,
            onClick: () => handleSave("new"),
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleSave("new");
              }
            },
            className: `bg-indigo-600 hover:bg-indigo-700 ${actionButtonClass}`,
          },
        ]
      : []),
  ];

  const rightActions = [
    {
      key: "edit",
      icon: <FiEdit2 className="h-4 w-4" />,
      hoverLabel: "Edit",
      iconOnly: true,
      onClick: () => hasPermission(() => setReadOnly(false), "edit"),
      className: `bg-yellow-600 hover:bg-yellow-700 ${actionButtonClass}`,
      hidden: !readOnly || !id,
    },
    ...(isCumInvoice
      ? [
          {
            key: "summary",
            icon: <FiEye className="h-4 w-4" />,
            hoverLabel: "View Summary",
            iconOnly: true,
            onClick: () => {
              if (!taxTemplateId) {
                Swal.fire({
                  title: "Information",
                  text: "Please Select Tax Template!",
                  icon: "info",
                  confirmButtonColor: "#3085d6",
                });
                return;
              }
              setSummary(true);
            },
            className:
              "bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition",
          },
        ]
      : []),
    ...(id
      ? [
          {
            key: "print",
            icon: <FiPrinter className="h-4 w-4" />,
            hoverLabel: "Print",
            iconOnly: true,
            onClick: () => setPrintModalOpen(true),
            className: `bg-slate-600 hover:bg-slate-700 ${actionButtonClass}`,
          },
        ]
      : []),
  ].filter((a) => !a.hidden);

  const isSupplierOutside = useMemo(() => {
    return supplierData?.data?.City?.state?.name !== "TAMILNADU";
  }, [supplierData]);

  const enrichedData = useMemo(() => {
    const filteredItems = items.filter((i) => i.styleItemId);
    if (!filteredItems.length || !isCumInvoice)
      return {
        items: [],
        gross: 0,
        taxable: 0,
        net: 0,
        slabBreakup: [],
        roundOff: 0,
      };
    return calculateTaxWithHSNBreakupAndInsertIntoPoItems(
      filteredItems,
      isSupplierOutside,
      discountType,
      discountValue,
      false,
    );
  }, [items, isSupplierOutside, discountType, discountValue, isCumInvoice]);

  const totalQty = items.reduce(
    (sum, item) => sum + (parseFloat(item.qty) || 0),
    0,
  );
  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0,
  );

  const headerContent = (
    <div className="flex flex-col md:flex-row gap-1 w-full">
      {/* Basic Details */}
      <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Basic Details
        </h2>
        <div className="flex gap-2">
          <div className="w-36">
            <TextInput name="DC No" value={docId} disabled={true} />
          </div>
          <div className="w-28">
            <DateInputNew
              name="Doc Date"
              value={docDate}
              setValue={setDocDate}
              disabled={true}
              required={true}
              type="date"
            />
          </div>
          <div className="md:col-span-1">
            <DropdownInput
              name="Receipt Basis"
              options={receiptTypes}
              value={deliveryType}
              setValue={(value) => setDeliveryType(value)}
              required={true}
              readOnly={readOnly}
              disabled={childRecord.current > 0 || readOnly}
            />
          </div>
        </div>
      </div>

      {/* Customer & Receipt Details */}
      <div className="flex-1 border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Customer Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="md:col-span-2">
            <DropdownWithModal
              name="Customer"
              options={dropDownListObject(
                id
                  ? customerList?.data?.filter((item) => item?.isCustomer)
                  : customerList?.data?.filter(
                      (item) => item?.active && item?.isCustomer,
                    ),
                "name",
                "id",
              )}
              value={customerId}
              setValue={setCustomerId}
              required={true}
              readOnly={readOnly}
              className="w-[150px]"
              addNewLabel="+ Add New Customer"
              childComponent={PartyMaster}
              addNewModalWidth="w-[90%] h-[95%]"
              disabled={readOnly || childRecord.current > 0}
              openOnFocus={true}
              ref={customerRef}
            />
          </div>
          <div className="md:col-span-1">
            <TextInput
              name="Contact Person"
              value={findFromList(
                customerId,
                customerList?.data,
                "contactPersonName",
              )}
              disabled={true}
            />
          </div>
          <div className="md:col-span-1">
            <TextInput
              name="Phone"
              value={findFromList(
                customerId,
                customerList?.data,
                "contactNumber",
              )}
              disabled={true}
            />
          </div>

          {isCumInvoice && (
            <>
              <div className="md:col-span-1">
                <DropdownWithModal
                  name="Pay Term"
                  options={dropDownListObject(
                    id
                      ? payTermList?.data
                      : payTermList?.data?.filter((item) => item?.active),
                    "name",
                    "id",
                  )}
                  value={payTermId}
                  setValue={setPayTermId}
                  required={true}
                  readOnly={readOnly}
                  className="w-full max-w-none"
                  dropdownMinWidth={240}
                  addNewLabel="+ Add New Pay Term"
                  childComponent={PayTermMaster}
                  addNewModalWidth="w-[40%] h-[66%]"
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Delivery Details
        </h2>
        <div className="flex  gap-2">
          <div className="w-28">
            <DateInputNew
              name="Delivery Date"
              value={deliveryDate}
              setValue={setDeliveryDate}
              disabled={effectiveReadOnly}
              required={true}
              type="date"
            />
          </div>
          <div className="w-28">
            <TextInput
              name="DC No"
              value={dcNo}
              setValue={setDcNo}
              disabled={effectiveReadOnly}
            />
          </div>
          <div className="w-32">
            <TextInput
              name="Vehicle No"
              value={vehicleNo}
              setValue={setVehicleNo}
              disabled={effectiveReadOnly}
            />
          </div>
          {isCumInvoice && (
            <div className="md:col-span-1 w-28">
              <DropdownInput
                name="Tax Type"
                options={dropDownListObject(
                  taxTypeList ? taxTypeList?.data : [],
                  "name",
                  "id",
                )}
                value={taxTemplateId}
                setValue={setTaxTemplateId}
                required={true}
                readOnly={effectiveReadOnly}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const footerContent = (
    <>
      <CommonFormFooter
        remarks={remarks}
        setRemarks={setRemarks}
        terms={termsAndCondition}
        setTerms={setTermsAndCondition}
        readOnly={readOnly}
        showTermSelect={true}
        termsRef={termsRef}
        termValue={termsId}
        onTermChange={(value) => setTermsId(value)}
        termOptions={
          termsData?.data?.map((item) => ({
            value: item.id,
            label: item.name,
            templateText: item.description || "",
          })) || []
        }
        totalsRows={[
          {
            key: "totalQty",
            label: "Total Qty",
            value: totalQty.toFixed(3),
            summaryColumn: "right",
            emphasized: true,
          },
          {
            key: "grossAmount",
            label: "Gross Amount",
            value: `${isCumInvoice ? enrichedData.gross?.toFixed(2) : totalAmount.toFixed(2)}`,
            summaryColumn: "right",
            emphasized: true,
          },
          ...(isCumInvoice
            ? [
                {
                  key: "netAmount",
                  label: "Net Amount",
                  value: `${enrichedData.net?.toFixed(2)}`,
                  summaryColumn: "right",
                  emphasized: true,
                },
              ]
            : []),
        ]}
      />
      <TransactionActions
        leftActions={leftActions}
        rightActions={rightActions}
      />
    </>
  );

  return (
    <>
      {isCumInvoice && (
        <Modal isOpen={summary} onClose={() => setSummary(false)} widthClass="">
          <PoSummary
            poItems={items}
            totals={enrichedData}
            readOnly={effectiveReadOnly}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            setSummary={setSummary}
            isCustomerExport={false}
          />
        </Modal>
      )}

      <Modal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        widthClass="w-[90%] h-[90%]"
      >
        <PDFViewer style={tw("w-full h-full")}>
          <SalesDeliveryPrintFormat
            data={{
              ...singleData?.data,
              salesDeliveryItems: items.filter((i) => i.styleItemId),
            }}
            taxDetails={enrichedData}
            isCumInvoice={isCumInvoice}
            payTermList={payTermList}
          />
        </PDFViewer>
      </Modal>

      <TransactionLayout
        title="Sales Delivery"
        badge={<ModeChip id={id} readOnly={readOnly} />}
        closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        header={headerContent}
        detailsLayout="default"
        detailsLayouts={["default"]}
        gridItems={
          <SalesDeliveryItems
            items={items}
            enrichedItems={enrichedData}
            setItems={setItems}
            readOnly={effectiveReadOnly}
            taxTemplateId={taxTemplateId}
            id={id}
            termsRef={termsRef}
            isCumInvoice={isCumInvoice}
            isSupplierOutside={isSupplierOutside}
          />
        }
        footer={footerContent}
      />
    </>
  );
};

export default SalesDeliveryForm;

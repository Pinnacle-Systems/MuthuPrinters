import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { TextInput, DropdownInput, DateInputNew } from "../../../Inputs";
import {
  useAddSalesDeliveryMutation,
  useUpdateSalesDeliveryMutation,
  useDeleteSalesDeliveryMutation,
  useGetSalesDeliveryByIdQuery,
  useGetSalesDeliveryQuery,
} from "../../../redux/uniformService/SalesDeliveryService";
import { findFromList, formatCurrencyAmount, getCommonParams, ModeChip } from "../../../Utils/helper";
import {
  dropDownListObject,
  dropDownListObjectMultiple,
} from "../../../Utils/contructObject";
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
import {
  BankMaster,
  CurrencyMaster,
  PayTermMaster,
} from "../../../Basic/components/index.js";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { useDispatch } from "react-redux";
import { conversionTypes, receiptTypes } from "../../../Utils/DropdownData.js";
import { useGetCurrenciesQuery } from "../../../redux/services/CurrencyMasterService.js";
import { useGetbankQuery } from "../../../redux/services/BankMasterService.js";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService.js";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService.js";
import { useGetItemSubGroupMasterQuery } from "../../../redux/services/ItemSubGroupService.js";
import { useGetSalesOrderByIdQuery, useGetSalesOrderQuery } from "../../../redux/uniformService/SalesOrderService.js";
import { padRows } from "../OrderEntry/OrderItemsUtils.js";
import ReusableFormFooter from "../../../Basic/components/Reuseable/ReuseableFormFooter.jsx";

const EMPTY_ROW = {
  itemGroupId: "",
  itemSubGroupId: "",
  styleItemId: "",
  uomId: "",
  hsnId: "",
  qty: "",
  labelWidth: "",
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
  invalidateTagsDispatch,
  cityList
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
  const [weightInKg, setWeightInKg] = useState("");
  const [carriageCharge, setCarriageCharge] = useState("");
  const childRecord = useRef(0);
  const [conversionType, setConversionType] = useState("PCS");
  const [currencyId, setCurrencyId] = useState("");
  const [bankId, setBankId] = useState("");
  const customerRef = useRef(null);
  const termsRef = useRef(null);
  const [salesOrderId, setSalesOrderId] = useState("");

  const [loadingId, setLoadingId] = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const [carriageTax, setCarriageTax] = useState("");
  const [carriageFinalAmt, setCarriageFinalAmt] = useState("");
  const [deliveryTaxValue, setDeliveryTaxValue] = useState("");
  const [deliveryTaxType, setDeliveryTaxType] = useState("Flat");
  const [requirements, setRequirements] = useState("");

  const effectiveReadOnly = readOnly || childRecord.current > 0;
  const isCumInvoice = deliveryType === "AGAINST_INVOICE";
  const requirementRef = useRef(null);


  const { data: singleData, isFetching: isSingleFetching, isLoading: isSingleLoading } = useGetSalesDeliveryByIdQuery(id, { skip: !id });
  const { data: taxTypeList } = useGetTaxTemplateQuery({
    params: { companyId },
  });
  const { data: supplierData } = useGetPartyByIdQuery(customerId, {
    skip: !customerId,
  });
  const { data: currencyList } = useGetCurrenciesQuery({
    params: { companyId },
  });
  const isCustomerExport = supplierData?.data?.isCustomerExport;
  const isCurrencySymbol = currencyList?.data?.find(
    (item) => item?.id === currencyId,
  )?.symbol;

  const { data: bankList } = useGetbankQuery({ params: { companyId } });
  const { data: sizeList } = useGetSizeMasterQuery({ params: { companyId } });
  const { data: itemGroupList } = useGetItemGroupMasterQuery({ params: { companyId } });
  const { data: itemSubGroupList } = useGetItemSubGroupMasterQuery({ params: { companyId } });
  const [dispatchInvalidate] = useInvalidateTags();

  const currencyCode = currencyList?.data?.find(
    (item) => item?.id === currencyId,
  )?.code;

  const [addData] = useAddSalesDeliveryMutation();
  const [updateData] = useUpdateSalesDeliveryMutation();



  const { data: salesOrderData, } = useGetSalesOrderQuery({ params: { branchId } });
  const { data: singleSaleOrderData, refetch: refetchSalesOrderData, isFetching: isSingleorderFetching, isLoading: isSingleorderLoading } = useGetSalesOrderByIdQuery(salesOrderId, { skip: !salesOrderId || id });


  const syncFormWithDb = useCallback(
    (data) => {

      console.log(data, "datadata")
      setDocId(data?.docId ? data.docId : "New");
      setDocDate(moment(data?.docDate).format("YYYY-MM-DD"));
      setDeliveryDate(
        data?.deliveryDate
          ? moment(data?.deliveryDate).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
      );
      setCustomerId(data?.customerId ? data?.customerId : "");
      setDcNo(data?.dcNo ? data?.dcNo : "");
      setVehicleNo(data?.vehicleNo ? data?.vehicleNo : "");
      setDeliveryType(data?.deliveryType ? data?.deliveryType : "AGAINST_INVOICE");
      setRemarks(data?.remarks ? data?.remarks : "");
      setTermsAndCondition(data?.termsAndCondition ? data?.termsAndCondition : "");
      setTermsId(data?.termsId ? data?.termsId : "");
      setTaxTemplateId(data?.taxTemplateId ? data?.taxTemplateId : "");
      setPayTermId(data?.payTermId ? data?.payTermId : "");
      setDiscountType(data?.discountType ? data?.discountType : "Percentage");
      setDiscountValue(data?.discountValue ? data?.discountValue : 0);
      childRecord.current = data?.childRecord ? data?.childRecord : 0;
      setItems(padItems(data?.salesDeliveryItems || []));
      setConversionType(data?.conversionType ? data?.conversionType : "PCS");
      setCurrencyId(data?.currencyId ? data?.currencyId : "");
      setWeightInKg(data?.weightInKg ? data?.weightInKg : "");
      setCarriageCharge(data?.carriageCharge ? data?.carriageCharge : "");
      setBankId(data?.bankId ? data?.bankId : "");
      setSalesOrderId(data?.orderId ? data?.orderId : "");
      setDeliveryTaxType(data?.deliveryTaxType ? data?.deliveryTaxType : "Flat");
      setDeliveryTaxValue(data?.deliveryTaxValue ? data?.deliveryTaxValue : "");
    },
    [id],
  );


  useEffect(() => {
    if (id && singleData?.data) {
      syncFormWithDb(singleData.data);
    } else {
      syncFormWithDb(undefined);
    }
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const syncFormWithDbForOrder = useCallback(
    (data) => {
      setCustomerId(data?.customerId ? data?.customerId : "")
      setItems(padRows(data?.SalesOrderItems || []));
      setSalesOrderId(data?.id || "");
      setPayTermId(data?.payTermId ? data?.payTermId : "");
      setCurrencyId(data?.currencyId ? (data?.currencyId) : "");
      setLoadingId(data?.loadingId ? data?.loadingId : "");
      setDeliveryId(data?.deliveryId ? data?.deliveryId : "");
      setWeightInKg(data?.weightInKg ? data?.weightInKg?.toFixed(3) : "");
      setCarriageCharge(data?.carriageCharge ? data?.carriageCharge?.toFixed(2) : "");
      setCarriageTax(data?.carriageTax ? data?.carriageTax?.toFixed(2) : "");
      setBankId(data?.bankId ? data?.bankId : "");
      setConversionType(data?.conversionType ? data?.conversionType : "");
      setTaxTemplateId(data?.taxTemplateId ? data?.taxTemplateId : "");
    },
    [id],
  );

  useEffect(() => {
    if (id) return
    if (salesOrderId && singleSaleOrderData?.data) {
      syncFormWithDbForOrder(singleSaleOrderData.data);
    }
  }, [isSingleorderFetching, isSingleorderLoading, salesOrderId, syncFormWithDbForOrder, singleSaleOrderData]);


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
      setConversionType(data.conversionType || "PCS");
      setCurrencyId(data.currencyId || "");
      setWeightInKg(data.weightInKg || "");
      setCarriageCharge(data.carriageCharge || "");
      setBankId(data.bankId || "");
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

  const isSupplierOutside = useMemo(() => {
    return supplierData?.data?.City?.state?.name !== "TAMILNADU";
  }, [supplierData]);


  const filteredItems = useMemo(() => items.filter((i) => i.styleItemId), [items]);

  const isDeliveryQty = filteredItems?.some((i) => i.deliveryQty > 0)

  const enrichedData = useMemo(() => {
    if (!filteredItems.length)
      return {
        items: [],
        gross: 0,
        taxable: 0,
        net: 0,
        slabBreakup: [],
        roundOff: 0,
      };
    return calculateTaxWithHSNBreakupAndInsertIntoPoItems(filteredItems, isSupplierOutside, discountType, discountValue, (conversionType === "DOZEN" && isDeliveryQty) ? true : false,
      "deliveryQty",
      deliveryTaxValue,
      deliveryTaxType,
    );
  }, [filteredItems, isSupplierOutside, discountType, discountValue, conversionType, deliveryTaxValue, deliveryTaxType]);

  console.log(filteredItems, "filteredItems")
  console.log(enrichedData, "enrichedData")

  const amount = enrichedData?.net;
  const data = {
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
    conversionType,
    currencyId,
    weightInKg,
    carriageCharge,
    bankId,
    salesOrderId,
    amount: amount,
    enrichedData,
    deliveryTaxType,
    deliveryTaxValue,
  };

  useEffect(() => {
    const charge = parseFloat(carriageCharge) || 0;
    const tax = parseFloat(carriageTax) || 0;
    const finalAmt = charge + (charge * tax) / 100;
    setCarriageFinalAmt(finalAmt ? finalAmt.toFixed(2) : "");
  }, [carriageCharge, carriageTax]);

  const validateRows = (items) => {
    const errors = [];
    const seen = new Set();
    items.forEach((item, index) => {
      if (!item.styleItemId) {
        errors.push(`Row ${index + 1}: Style is required`);
      }
      if (!item.itemGroupId) {
        errors.push(`Row ${index + 1}: Item Group is required`);
      }
      if (!item.hsnId) {
        errors.push(`Row ${index + 1}: HSN is required`);
      }
      if (!item.uomId) {
        errors.push(`Row ${index + 1}: UOM is required`);
      }


      const key = `${item.styleItemId}_${item.uomId}_${item.itemGroupId}`;
      if (seen.has(key)) {
        errors.push(`Row ${index + 1}: Duplicate item found`);
      } else {
        seen.add(key);
      }
      if (item.styleBreakup?.length) {
        let sizeSum = 0;
        item.styleBreakup.forEach((style, styleIndex) => {
          if (!style.styleId) {
            errors.push(`Row ${index + 1}, Style Row ${styleIndex + 1}: Style is required`);
          }

          if (style.sizeBreakup?.length) {
            const sizeSeen = new Set();
            style.sizeBreakup.forEach((size, sizeIndex) => {
              if (!size.sizeId) {
                errors.push(`Row ${index + 1}, Style ${styleIndex + 1}, Size Row ${sizeIndex + 1}: Size is required`);
              }

              const qty = Number(size.qty || 0);
              sizeSum += qty;

              if (qty <= 0) {
                errors.push(`Row ${index + 1}, Style ${styleIndex + 1}, Size Row ${sizeIndex + 1}: Qty must be greater than 0`);
              }

              if (size.sizeId) {
                if (sizeSeen.has(size.sizeId)) {
                  errors.push(`Row ${index + 1}, Style ${styleIndex + 1}: Duplicate size found`);
                } else {
                  sizeSeen.add(size.sizeId);
                }
              }
            });
          } else {
            errors.push(`Row ${index + 1}, Style Row ${styleIndex + 1}: Size Breakup is required`);
          }
        });

      } else {
        errors.push(`Row ${index + 1}: Style Breakup is required for Order Qty`);
      }
      if (isCustomerExport && !loadingId) {
        errors.push(`Loading Port is required`);
      }

      if (isCustomerExport && !deliveryId) {
        errors.push(`Delivery Port is required`);
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
    if (isCumInvoice && !payTermId) {
      Swal.fire({
        title: "Warning",
        text: "Please select a Pay Term.",
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

    if (!deliveryDate) {
      Swal.fire({
        title: "Warning",
        text: "Delivery Date is required",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (isCustomerExport && !currencyId) {
      Swal.fire({
        title: "Warning",
        text: "Currency is required",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (isCustomerExport && !bankId) {
      Swal.fire({
        title: "Warning",
        text: "Bank is required",
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



    try {
      let savedId = id;
      if (id && !window.confirm("Are you sure you want to update the details?"))
        return;
      if (id) {
        await updateData(data).unwrap();
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
        invalidateTagsDispatch()

      } else {
        const res = await addData(data).unwrap();
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
        invalidateTagsDispatch()

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
    setConversionType("PCS");
    setCurrencyId("");
    setWeightInKg("");
    setCarriageCharge("");
    setBankId("");
  };

  useEffect(() => {
    if (!conversionType) return;

    setItems((prev) =>
      prev.map((item) => {
        const qty = parseFloat(item.deliveryQty) || 0;
        const price = parseFloat(item.price) || 0;
        const dozen = qty / 12;

        return {
          ...item,
          dozen: dozen ? dozen.toFixed(2) : "",
          amount:
            (conversionType === "DOZEN" && isDeliveryQty)
              ? dozen && price
                ? (dozen * price).toFixed(2)
                : ""
              : qty && price
                ? (qty * price).toFixed(2)
                : "",
        };
      }),
    );
  }, [conversionType]);

  const actionButtonClass =
    "px-3 py-2 rounded-md flex items-center justify-center text-sm text-white transition";






  const totalQty = items?.reduce(
    (sum, item) => sum + (parseFloat(item.deliveryQty) || 0),
    0,
  );
  const [accordionOpen, setAccordionOpen] = useState(true);

  const shippingAccordion = (
    <div className="border border-slate-200 rounded-md bg-white shadow-sm mt-1">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setAccordionOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-left"
      >
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          Other Details
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${accordionOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Accordion Body */}
      {accordionOpen && (
        <div className="px-3 pb-2 border-t border-slate-100">
          <div className="flex gap-2 gap-x-4 w-fit">
            {isCustomerExport && (
              <>
                <div className="w-60">
                  <DropdownInput
                    name="Loading Port"
                    options={dropDownListObject(
                      cityList?.data?.filter((item) => item.active),
                      "name",
                      "id",
                    )}
                    value={loadingId}
                    setValue={setLoadingId}
                    readOnly={effectiveReadOnly}
                    required={true}
                  />
                </div>
                <div className="w-60">
                  <DropdownInput
                    name="Delivery Port"
                    options={dropDownListObject(
                      cityList?.data?.filter((item) => item.active),
                      "name",
                      "id",
                    )}
                    value={deliveryId}
                    setValue={setDeliveryId}
                    readOnly={effectiveReadOnly}
                    required={true}
                  />
                </div>
              </>
            )}
            <div className="w-[105px]">
              <DateInputNew
                name="Delivery Date"
                value={deliveryDate}
                setValue={setDeliveryDate}
                disabled={effectiveReadOnly}
                type="date"
                required={true}
              />
            </div>
            <div className="w-32">
              <DropdownInput
                name="Conversion"
                options={conversionTypes}
                value={conversionType}
                setValue={(value) => setConversionType(value)}
                required={true}
                readOnly={effectiveReadOnly}
                disabled={childRecord.current > 0 || readOnly}
              />
            </div>
            <div className="w-24">
              <TextInput
                name="WeightInKg (KG)"
                value={weightInKg}
                setValue={setWeightInKg}
                disabled={effectiveReadOnly}
                type="number"
                min="0"
                className="text-right"
                required={true}
                onBlur={(e) =>
                  setWeightInKg(
                    e.target.value ? Number(e.target.value).toFixed(3) : "",
                  )
                }
                onFocus={(e) => {
                  e.target.select();
                }}
              />
            </div>

            <TextInput
              name={`Carriage and Air Freight ${currencyId ? `(${isCurrencySymbol})` : ""}`}
              value={carriageCharge}
              setValue={setCarriageCharge}
              disabled={effectiveReadOnly}
              type="number"
              min="0"
              className="text-right"
              onBlur={(e) =>
                setCarriageCharge(
                  e.target.value ? Number(e.target.value).toFixed(2) : "",
                )
              }
              onFocus={(e) => {
                e.target.select();
              }}
            />
            <div className="w-24">
              <TextInput
                name="Carriage Tax%"
                value={carriageTax}
                setValue={setCarriageTax}
                disabled={effectiveReadOnly}
                type="number"
                min="0"
                className="text-right"
                onBlur={(e) =>
                  setCarriageTax(
                    e.target.value ? Number(e.target.value).toFixed(2) : "",
                  )
                }
                onFocus={(e) => {
                  e.target.select();
                }}
              />
            </div>
            <div className="w-32">
              <TextInput
                name="Carriage Final Amount"
                value={carriageFinalAmt}
                disabled={true}
                type="number"
                min="0"
                className="text-right"
                onFocus={(e) => {
                  e.target.select();
                }}
              />
            </div>
            <div className="w-72">
              <DropdownWithModal
                name="Advising Bank"
                options={dropDownListObjectMultiple(
                  id
                    ? bankList?.data
                    : bankList?.data?.filter((item) => item?.active),
                  ["name", "Branch.name"],
                  "id",
                )}
                value={bankId}
                setValue={setBankId}
                required={isCustomerExport}
                readOnly={effectiveReadOnly}
                className={`w-[150px]`}
                addNewLabel="+ Add New Bank"
                childComponent={BankMaster}
                addNewModalWidth="w-[45%] h-[64%]"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const headerContent = (
    <>
      <div className="flex flex-col md:flex-row gap-1 w-full">
        {/* Basic Details */}
        <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
          <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
            Basic Details
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="w-36">
              <TextInput name="Sales Delivery No" value={docId} disabled={true} />
            </div>
            <div className="w-28">
              <DateInputNew
                name="Sales Delivery Date"
                value={docDate}
                setValue={setDocDate}
                disabled={true}
                required={true}
                type="date"
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
              />
            </div>
            <div className="md:col-span-1">
              <DropdownWithModal
                name="Sale Order No"
                options={dropDownListObject(
                  id
                    ? salesOrderData?.data?.filter((item) => item?.customerId === customerId)
                    : salesOrderData?.data?.filter(
                      (item) => item?.customerId === customerId,
                    ),
                  "docId",
                  "id",
                )}
                value={salesOrderId}
                setValue={setSalesOrderId}
                required={true}
                readOnly={readOnly}
                className="w-[150px]"
                disabled={readOnly || childRecord.current > 0}
                openOnFocus={true}
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
            {/* <div className="md:col-span-1">
            <TextInput
              name="Phone"
              value={findFromList(
                customerId,
                customerList?.data,
                "contactNumber",
              )}
              disabled={true}
            />
          </div> */}


          </div>
        </div>
        <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
          <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
            Delivery Details
          </h2>
          <div className="grid grid-cols-4  gap-2">
            {/* <div className="">
            <DateInputNew
              name="Delivery Date"
              value={deliveryDate}
              setValue={setDeliveryDate}
              disabled={effectiveReadOnly}
              required={true}
              type="date"
            />
          </div>
          <div className="">
            <TextInput
              name="DC No"
              value={dcNo}
              setValue={setDcNo}
              disabled={effectiveReadOnly}
            />
          </div> */}
            <div className="md:col-span-1">
              <DropdownInput
                name="Receipt Basis"
                options={receiptTypes}
                value={deliveryType}
                setValue={(value) => setDeliveryType(value)}
                required={true}
                readOnly={readOnly}
                disabled={childRecord.current > 0 || readOnly}
                ref={customerRef}
              />
            </div>
            {/* <div className="w-28">
              <DropdownInput
                name="Conversion"
                options={conversionTypes}
                value={conversionType}
                setValue={(value) => setConversionType(value)}
                required={true}
                readOnly={readOnly}
                disabled={childRecord.current > 0 || readOnly}
              />
            </div> */}
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
                <div className="md:col-span-1">
                  <DropdownInput
                    name="Tax Type"
                    options={dropDownListObject(
                      taxTypeList ? taxTypeList?.data : [],
                      "name",
                      "id",
                    )}
                    value={taxTemplateId}
                    setValue={setTaxTemplateId}
                    required={!isCustomerExport}
                    readOnly={effectiveReadOnly}
                  />
                </div>
                {isCustomerExport && (
                  <div className="md:col-span-1">
                    <DropdownWithModal
                      name="Currency"
                      options={dropDownListObject(
                        id
                          ? currencyList?.data
                          : currencyList?.data?.filter((item) => item?.active),
                        "name",
                        "id",
                      )}
                      value={currencyId}
                      setValue={setCurrencyId}
                      required={true}
                      readOnly={readOnly}
                      className={`w-full max-w-none`}
                      dropdownMinWidth={240}
                      addNewLabel="+ Add New Currency"
                      childComponent={CurrencyMaster}
                      addNewModalWidth="w-[40%] h-[66%]"
                    />
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      </div>
      <div>
        {shippingAccordion}

      </div>

    </>



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
            key: "returnCharge",
            label: "Return Charges",
            summaryColumn: "right",
            renderValue: () => (
              <div className="flex items-center gap-1">
                <select
                  value={deliveryTaxType}
                  onChange={(e) => setDeliveryTaxType(e.target.value)}
                  disabled={readOnly}
                  className={`h-7 rounded border border-slate-300 bg-white px-1 text-[11px] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200 ${readOnly ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""}`}
                >
                  <option value="Flat">Flat</option>
                  <option value="Percentage">Percentage</option>
                </select>
                <input
                  type="number"
                  value={deliveryTaxValue}
                  onChange={(event) => setDeliveryTaxValue(event.target.value)}
                  onBlur={() => setDeliveryTaxValue(deliveryTaxValue)}
                  readOnly={readOnly}
                  className={`h-7 w-16 rounded border border-slate-300 px-1.5 py-0 text-right text-[11px] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200 ${readOnly ? "cursor-not-allowed bg-slate-100 text-slate-500" : "bg-white"}`}
                />
              </div>
            ),
          },
          ...(isCustomerExport
            ? [
              {
                key: "carriageCharge",
                label: "Carraige Charges",
                value: `${isCurrencySymbol ? isCurrencySymbol : ""} ${carriageCharge}`,
                summaryColumn: "right",
                emphasized: true,
              },
            ]
            : []),
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
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
        {/* Left Buttons */}
        <div className="flex gap-2 flex-wrap">
          {!readOnly && (
            <button
              onClick={() => handleSave("close")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave("close");
                  e.stopPropagation();
                }
              }}
              disabled={readOnly}
              className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs font-medium"
            >
              <HiOutlineRefresh className="w-3.5 h-3.5 mr-2" />
              Save & Close
            </button>
          )}
          {!readOnly && (
            <button
              onClick={() => handleSave("new")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave("new");
                }
              }}
              disabled={readOnly}
              className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs font-medium"
            >
              <FiSave className="w-3.5 h-3.5 mr-2" />
              Save & New
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {!id ||
            (readOnly && (
              <button
                className="bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 flex items-center text-xs font-medium"
                onClick={() => setReadOnly(false)}
              >
                <FiEdit2 className="w-3.5 h-3.5 mr-2" />
                Edit
              </button>
            ))}
          {isCumInvoice && (
            <button
              className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center text-xs font-medium"
              onClick={() => setSummary(true)}
            >
              <FiEye className="h-4 w-4 mr-2" />
              View Summary
            </button>
          )}

          {id && (
            <button
              className="bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-700 flex items-center text-xs font-medium"
              onClick={() => setPrintModalOpen(true)}
            >
              <FiPrinter className="h-4 w-4 mr-2" />
              Print
            </button>
          )}
        </div>
      </div>
    </>
  );

  console.log(items, "itemsitems")

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
            isCustomerExport={isCustomerExport}
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
            isCustomerExport={isCustomerExport}
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
            sizeList={sizeList}
            itemGroupList={itemGroupList}
            itemSubGroupList={itemSubGroupList}
            conversionType={conversionType}
            isCustomerExport={isCustomerExport}
            isCurrencySymbol={isCurrencySymbol}
          />
        }
        // footer={footerContent}
        footer={
          <>
            <ReusableFormFooter
              sections={[
                {
                  title: "Terms & Condtions",
                  value: requirements,
                  onChange: setRequirements,
                  placeholder: "Enter Terms & Condtions...",
                  readOnly: readOnly || childRecord,
                  ref: requirementRef,
                },
                {
                  title: "Remarks",
                  value: remarks,
                  onChange: setRemarks,
                  placeholder: "Additional notes...",
                  readOnly: readOnly || childRecord,
                },
              ]}
              hasSummaryTitle={
                <span className="block text-center w-full">Summary</span>
              }
              sectionColClass="md:col-span-4"
              summaryColClass="md:col-span-4"
              totalsRows={[
                {
                  key: "summary_grid",
                  label: "",
                  valueContainerClassName: "w-full",
                  renderValue: () => {
                    const taxTotals = !isCustomerExport
                      ? (enrichedData.slabBreakup || []).reduce((acc, curr) => {
                        const type = curr?.tax?.split(" ")[0];
                        acc[type] = (acc[type] || 0) + curr.amount;
                        return acc;
                      }, {})
                      : {};

                    return (
                      <div className="grid grid-cols-2 w-full gap-x-4 gap-y-1">
                        {/* Left Column */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between w-full max-w-[210px]">
                            <div className="flex justify-between w-[130px] text-slate-800">
                              <span>Total Discount</span>
                              <span>:</span>
                            </div>
                            <span className="font-medium text-slate-800 text-right w-[65px]">
                              {isCurrencySymbol ? isCurrencySymbol : ""}{" "}
                              {formatCurrencyAmount(
                                enrichedData.itemDiscount +
                                  enrichedData.overallDiscount >
                                  0
                                  ? enrichedData.itemDiscount +
                                  enrichedData.overallDiscount
                                  : 0,
                                currencyCode || isCurrencySymbol,
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between w-full max-w-[210px]">
                            <div className="flex justify-between w-[130px] text-slate-800">
                              <span>Taxable Amount</span>
                              <span>:</span>
                            </div>
                            <span className="font-medium text-slate-800 text-right w-[65px]">
                              {isCurrencySymbol ? isCurrencySymbol : ""}{" "}
                              {formatCurrencyAmount(
                                enrichedData.taxable || 0,
                                currencyCode || isCurrencySymbol,
                              )}
                            </span>
                          </div>

                          {taxTotals.CGST !== undefined &&
                            taxTotals.SGST !== undefined ? (
                            <div className="flex items-center justify-between w-full max-w-[210px]">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-800 w-[32px]">
                                  CGST
                                </span>
                                <span className="text-slate-800">:</span>
                                <span className="font-medium text-slate-800">
                                  {formatCurrencyAmount(
                                    taxTotals.CGST,
                                    currencyCode || isCurrencySymbol,
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-800 w-[32px]">
                                  SGST
                                </span>
                                <span className="text-slate-800">:</span>
                                <span className="font-medium text-slate-800 text-right">
                                  {formatCurrencyAmount(
                                    taxTotals.SGST,
                                    currencyCode || isCurrencySymbol,
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            Object.keys(taxTotals).map((type) => (
                              <div
                                key={type}
                                className="flex items-center justify-between w-full max-w-[210px]"
                              >
                                <div className="flex justify-between w-[130px] text-slate-800">
                                  <span>{type}</span>
                                  <span>:</span>
                                </div>
                                <span className="font-medium text-slate-800 text-right w-[65px]">
                                  {isCurrencySymbol ? isCurrencySymbol : ""}{" "}
                                  {formatCurrencyAmount(
                                    taxTotals[type],
                                    currencyCode || isCurrencySymbol,
                                  )}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Right Column */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between w-full max-w-[210px]">
                            <div className="flex justify-between w-[130px] text-slate-800">
                              <span>Carriage Charges</span>
                              <span>:</span>
                            </div>
                            <span className="font-medium text-slate-800 text-right w-[65px]">
                              {isCurrencySymbol ? isCurrencySymbol : ""}{" "}
                              {!isNaN(parseFloat(carriageFinalAmt)) &&
                                carriageFinalAmt !== ""
                                ? formatCurrencyAmount(
                                  carriageFinalAmt,
                                  currencyCode || isCurrencySymbol,
                                )
                                : "0.00"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between w-full max-w-[210px]">
                            <div className="flex justify-between w-[130px] text-slate-800">
                              <span>Round Off</span>
                              <span>:</span>
                            </div>
                            <span className="font-medium text-slate-800 text-right w-[65px]">
                              {isCurrencySymbol ? isCurrencySymbol : ""}{" "}
                              {formatCurrencyAmount(
                                enrichedData.roundOff || 0,
                                currencyCode || isCurrencySymbol,
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-between w-full max-w-[210px]">
                            <div className="flex justify-between w-[130px] text-slate-800 font-bold">
                              <span>Net Amount</span>
                              <span>:</span>
                            </div>
                            <span className="font-bold text-indigo-700 text-right w-[65px]">
                              {isCurrencySymbol ? isCurrencySymbol : ""}{" "}
                              {formatCurrencyAmount(
                                (!isCustomerExport
                                  ? enrichedData.net
                                  : (enrichedData.items?.reduce(
                                    (sum, item) =>
                                      sum + (parseFloat(item.amount) || 0),
                                    0,
                                  ) || 0) -
                                  (enrichedData.itemDiscount +
                                    enrichedData.overallDiscount >
                                    0
                                    ? enrichedData.itemDiscount +
                                    enrichedData.overallDiscount
                                    : 0)) +
                                (parseFloat(carriageFinalAmt) || 0),
                                currencyCode || isCurrencySymbol,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  },
                  summaryColumn: "left",
                  emphasized: false,
                },
              ]}
            />
            <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
              {/* Left Buttons */}
              <div className="flex gap-2 flex-wrap">
                {!readOnly && (
                  <>
                    <button
                      onClick={() => handleSave("close")}
                      disabled={readOnly}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSave("close");
                          e.stopPropagation();
                        }
                      }}
                      className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs"
                    >
                      <HiOutlineRefresh className="w-4 h-4 mr-2" />
                      {id ? "Update & Close" : "Save & Close"}
                    </button>
                    <button
                      onClick={() => handleSave("new")}
                      disabled={readOnly}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSave("new");
                        }
                      }}
                      className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs"
                    >
                      <FiSave className="w-4 h-4 mr-2" />
                      {id ? "Update & New" : " Save & New"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (!taxTemplateId) {
                      Swal.fire({
                        title: "Information",
                        text: "Please Select Tax Template !",
                        icon: "info",
                        confirmButtonColor: "#3085d6",
                      });
                      return;
                    }
                    setSummary(true);
                  }}
                  onKeyDown={(e) => {
                    if (!taxTemplateId) {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.info("Please Select Tax Template !", {
                        position: "top-center",
                      });
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      setSummary(true);
                    }
                  }}
                  className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center text-xs"
                >
                  <FiEye className="w-4 h-4 mr-2" />
                  View Summary
                </button>

              </div>

              <div className="flex gap-2 flex-wrap">
                {!id ||
                  (readOnly && (
                    <button
                      className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700 flex items-center text-xs"
                      onClick={() =>
                        hasPermission(() => setReadOnly(false), "edit")
                      }
                      disabled={readOnly}
                    >
                      <FiEdit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  ))}

                {
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAttachmentIndex(null);
                      setAttachmentModal(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    📎 Upload
                  </button>
                }
              </div>
            </div>
          </>
        }
      />
    </>
  );
};

export default SalesDeliveryForm;

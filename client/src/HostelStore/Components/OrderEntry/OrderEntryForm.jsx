import { IoArrowBackCircleSharp } from "react-icons/io5";

import {
  CheckBox,
  CheckBoxNew,
  DateInputNew,
  DropdownInput,
  DropdownNew,
  ReusableInput,
  TextInput,
} from "../../../Inputs";
import {
  orderTypes,
  productionTypes,
  conversionTypes,
} from "../../../Utils/DropdownData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import {
  findFromList,
  formatCurrencyAmount,
  getCommonParams,
  ModeChip,
  renameFile,
} from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiCheck, FiEdit2, FiSave, FiSend } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { TransactionLayout } from "../../../Basic/components/Reuseable";
import {
  dropDownListObject,
  dropDownListObjectMultiple,
} from "../../../Utils/contructObject";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { PartyMaster } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import Modal from "../../../UiComponents/Modal/index.js";
import { getImageUrlPath } from "../../../Constants/index.js";
import { Plus } from "lucide-react";
import {
  useAddOrderEntryMutation,
  useGetOrderEntryByIdQuery,
  useGetOrderEntryQuery,
  useGetRefListQuery,
  useUpdateOrderEntryMutation,
} from "../../../redux/uniformService/OrderEntryService.js";
import { QRCodeCanvas } from "qrcode.react";
import CommonFormFooter from "../../../Basic/components/Reuseable/CommonFormFooter.jsx";
import { PDFViewer } from "@react-pdf/renderer";
import OrderEntryPrintFormat from "./OrderEntryPrintFormat.jsx";
import { FiFileText, FiPrinter, FiEye } from "react-icons/fi";
import OrderItems from "./OrderItems.jsx";
import { padRows } from "./OrderItemsUtils.js";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService.js";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService.js";
import ReusableFormFooter from "../../../Basic/components/Reuseable/ReuseableFormFooter.jsx";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import { useAddApprovalStausMutation } from "../../../redux/uniformService/PoServices.js";
import { useGetUomQuery } from "../../../redux/services/UomMasterService.js";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService.js";
import ProformaInvoiceApi, {
  useGetPIListQuery,
  useLazyGetProformaInvoiceByIdQuery,
} from "../../../redux/uniformService/ProformaInvoiceService.js";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService.js";
import { useGetSizeTemplateQuery } from "../../../redux/services/SizeTemplateMaster.js";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices.js";
import { useDispatch } from "react-redux";
import JobCardApi from "../../../redux/uniformService/JobCardService.js";
import { useGetItemSubGroupMasterQuery } from "../../../redux/services/ItemSubGroupService";
import PoSummary from "../PurchaseOrder/PoSummary";
import { calculateTaxWithHSNBreakupAndInsertIntoPoItems } from "../../../Utils/taxSummary";
import { useGetTaxTemplateQuery } from "../../../redux/services/TaxTemplateServices.js";
import { useGetPartyByIdQuery } from "../../../redux/services/PartyMasterService";
import { useGetPaytermMasterQuery } from "../../../redux/services/payTermMasterService.js";
import { useGetbankQuery } from "../../../redux/services/BankMasterService.js";
import { useGetCurrenciesQuery } from "../../../redux/services/CurrencyMasterService.js";
import {
  PayTermMaster,
  BankMaster,
  CurrencyMaster,
} from "../../../Basic/components";

const OrderEntryForm = ({
  onClose,
  id,
  setId,
  readOnly,
  setReadOnly,
  customerList,
  termsData,
  branchList,
  canApprove,
  userData,
  branchData,
  hasPermission,
  cityList,
}) => {
  const today = new Date();
  const [docDate, setDocDate] = useState(
    moment.utc(today).format("YYYY-MM-DD"),
  );
  const [customerId, setCustomerId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [requirements, setRequirements] = useState("");
  const [orderType, setOrderType] = useState("GENERAL");
  const [productionType, setProductionType] = useState("SAMPLE");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [jobType, setJobType] = useState("Internal");
  const [docId, setDocId] = useState("");
  const [searchDocId, setSearchDocId] = useState("");
  const [searchDocDate, setSearchDocDate] = useState("");
  const [summary, setSummary] = useState(false);
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [orderQty, setOrderQty] = useState("");
  const [termsAndCondition, setTermsAndCondition] = useState("");
  const [termsId, setTermsId] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [approvalModal, setApprovalModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [proFormaId, setProFormaId] = useState("");
  const [refNo, setRefNo] = useState("");
  const [isRepeatedPI, setIsRepeatedPI] = useState(false);
  const [validDays, setValidDays] = useState("");
  const [taxTemplateId, setTaxTemplateId] = useState("");
  const [discountType, setDiscountType] = useState("Percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [conversionType, setConversionType] = useState("DOZEN");
  const [payTermId, setPayTermId] = useState("");
  const [bankId, setBankId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [weightInKg, setWeightInKg] = useState("");
  const [carriageCharge, setCarriageCharge] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [deliveryId, setDeliveryId] = useState("");
  const dispatch = useDispatch();
  const qrRef = useRef(null);
  const customerRef = useRef(null);
  const childRecord = useRef(0);
  const requirementRef = useRef(null);

  const [dispatchInvalidate] = useInvalidateTags();
  const { userId, finYearId, branchId, companyId } = getCommonParams();
  const params = {
    branchId,
    companyId,
    finYearId,
  };

  const { data: payTermList } = useGetPaytermMasterQuery({ params });
  const { data: bankList } = useGetbankQuery({ params });
  const { data: currencyList } = useGetCurrenciesQuery({ params });

  const {
    data: singleData,
    status: queryStatus,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetOrderEntryByIdQuery(id, {
    params,
    skip: !id,
  });
  const { data: styleItemList } = useGetStyleItemMasterQuery({
    params: { ...params },
  });
  const { data: uomList } = useGetUomQuery({ params });
  const { data: sizeList } = useGetSizeMasterQuery({ params });
  const { data: gsmList } = useGetGsmMasterQuery({ params });
  const { data: PIList } = useGetPIListQuery({
    params: { companyId, branchId },
  });
  const { data: itemGroupList } = useGetItemGroupMasterQuery({ params });
  const { data: sizeTemplateList } = useGetSizeTemplateQuery({
    params: { companyId },
  });
  const { data: hsnList } = useGetHsnMasterQuery({ params });
  const { data: taxTypeList } = useGetTaxTemplateQuery({
    params: { companyId },
  });
  const { data: supplierData } = useGetPartyByIdQuery(customerId, {
    skip: !customerId,
  });

  const isCustomerExport = supplierData?.data?.isCustomerExport;
  const isCurrencySymbol = currencyList?.data?.find(
    (item) => item?.id === currencyId,
  )?.symbol;
  const currencyCode = currencyList?.data?.find(
    (item) => item?.id === currencyId,
  )?.code;

  const { data: refList } = useGetRefListQuery({
    params: { branchId, isRefDistinct: "true" },
  });
  const { data: itemSubGroupList } = useGetItemSubGroupMasterQuery({
    params,
  });
  const [addData] = useAddOrderEntryMutation();
  const [updateData] = useUpdateOrderEntryMutation();
  const [addApprovalStatus] = useAddApprovalStausMutation();
  const [getPIById] = useLazyGetProformaInvoiceByIdQuery();

  const status = singleData?.data?.approvalStatus?.status;
  const isDisabled =
    (status === "APPROVED" || status === "PENDING") && !canApprove;

  const syncFormWithDb = useCallback(
    (data) => {
      setDocId(data?.docId ? data?.docId : "New");
      setDocDate(
        data?.docDate
          ? moment.utc(data.docDate).format("YYYY-MM-DD")
          : moment.utc(new Date()).format("YYYY-MM-DD"),
      );
      setOrderType(data?.orderType || "GENERAL");
      setCustomerId(data?.customerId || "");
      setRemarks(data?.remarks || "");
      setAttachments(data?.attachments ? data?.attachments : []);
      setOrderQty(data?.orderQty || "");
      setRequirements(data?.requirements || "");
      setDeliveryDate(
        data?.deliveryDate
          ? moment.utc(data.deliveryDate).format("YYYY-MM-DD")
          : "",
      );
      setTermsAndCondition(data?.termsAndCondition || "");
      setTermsId(data?.termsId || "");
      childRecord.current = data?.childRecord ? data?.childRecord : 0;
      setOrderItems(padRows(data?.orderItems || []));
      setProductionType(data?.productionType || "SAMPLE");
      setProFormaId(data?.proFormaId || "");
      setRefNo(data?.refNo || "");
      setIsRepeatedPI(data?.isRepeatedPI || false);
      setValidDays(data?.validDays ? data?.validDays : "");
      setTaxTemplateId(data?.taxTemplateId || "");
      setDiscountType(data?.discountType || "Percentage");
      setDiscountValue(data?.discountValue || 0);
      setConversionType(data?.conversionType || "DOZEN");
      setPayTermId(data?.payTermId || "");
      setBankId(data?.bankId || "");
      setCurrencyId(data?.currencyId || "");
      setWeightInKg(data?.weightInKg?.toFixed(3) || "");
      setCarriageCharge(data?.carriageCharge?.toFixed(2) || "");
      setLoadingId(data?.loadingId || "");
      setDeliveryId(data?.deliveryId || "");
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

  let data = {
    id,
    docDate,
    branchId,
    userId,
    orderType,
    productionType,
    jobType,
    customerId,
    remarks,
    finYearId,
    attachments: attachments?.filter((i) => i.filePath),
    orderQty,
    requirements,
    deliveryDate,
    termsAndCondition,
    termsId,
    docId,
    orderItems: orderItems?.filter((i) => i.styleItemId),
    proFormaId,
    refNo,
    isRepeatedPI,
    validDays,
    taxTemplateId,
    discountType,
    discountValue,
    conversionType,
    payTermId,
    bankId,
    currencyId,
    weightInKg,
    carriageCharge,
    deliveryId,
    loadingId,
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      const formData = new FormData();
      for (let key in data) {
        if (key == "attachments") {
          formData.append(
            key,
            JSON.stringify(
              data[key].map((i) => ({
                ...i,
                filePath:
                  i.filePath instanceof File ? i.filePath.name : i.filePath,
              })),
            ),
          );
          data[key].forEach((option) => {
            if (option?.filePath instanceof File) {
              formData.append("images", option.filePath);
            }
          });
        } else if (
          Array.isArray(data[key]) ||
          (typeof data[key] === "object" && data[key] !== null)
        ) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
      let returnData;
      if (text === "Updated") {
        returnData = await callback({ id, body: formData }).unwrap();
      } else {
        returnData = await callback(formData).unwrap();
      }
      if (returnData.statusCode === 1) {
        toast.error(returnData.message);
      } else {
        Swal.fire({
          icon: "success",
          title: `${text || "Saved"} Successfully`,
          showConfirmButton: false,
          timer: 2000,
          didClose: () => {
            if (returnData.statusCode === 0) {
              if (nextProcess == "new") {
                setId(0);
                setDocId("New");
                syncFormWithDb(undefined);
                setTimeout(() => {
                  customerRef.current?.focus();
                }, 100);
              }
              if (nextProcess == "close") {
                onClose();
              }
            } else {
              toast.error(returnData?.message);
            }
          },
        });
        dispatchInvalidate();
        dispatch(ProformaInvoiceApi.util.invalidateTags(["proformaInvoice"]));
        dispatch(JobCardApi.util.invalidateTags(["jobCard"]));
      }
    } catch (error) {
      console.log("handle", error);
    }
  };

  const findDuplicates = (items) => {
    const seen = new Map();
    const duplicates = [];

    items.forEach((item, index) => {
      const key = `${item.styleItemId}-${item.sizeId}-${item.uomId}-${item.gsmId}`;

      if (seen.has(key)) {
        duplicates.push({
          firstIndex: seen.get(key),
          duplicateIndex: index,
        });
      } else {
        seen.set(key, index);
      }
    });

    return duplicates;
  };

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

      if (!item.orderQty || Number(item.orderQty) <= 0) {
        errors.push(`Row ${index + 1}: Order Qty must be greater than 0`);
      }
      if (item.orderQty > 0 && item.sizeBreakup.length == 0) {
        errors.push(`Row ${index + 1}: Size Qty is required for Order Qty`);
      }
      const key = `${item.styleItemId}_${item.uomId}_${item.itemGroupId}`;
      if (seen.has(key)) {
        errors.push(`Row ${index + 1}: Duplicate item found`);
      } else {
        seen.add(key);
      }
      if (item.sizeBreakup?.length) {
        const sizeSeen = new Set();
        let sizeSum = 0;

        item.sizeBreakup.forEach((size, sizeIndex) => {
          // size required
          if (!size.sizeId) {
            errors.push(
              `Row ${index + 1}, Size Row ${sizeIndex + 1}: Size is required`,
            );
          }

          // qty validation
          const qty = Number(size.qty || 0);
          sizeSum += qty;

          if (qty <= 0) {
            errors.push(
              `Row ${index + 1}, Size Row ${sizeIndex + 1}: Qty must be greater than 0`,
            );
          }

          // duplicate sizeId check
          if (size.sizeId) {
            if (sizeSeen.has(size.sizeId)) {
              errors.push(`Row ${index + 1}: Duplicate size found`);
            } else {
              sizeSeen.add(size.sizeId);
            }
          }
        });

        if (orderType === "AGAINSTPI" && sizeSum !== Number(item.orderQty)) {
          errors.push(
            `Row ${index + 1}: Sum of size quantities (${sizeSum}) must match the PI quantity (${item.orderQty})`,
          );
        }
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

  const validateData = (data) => {
    const items = data?.orderItems || [];
    const checks = [
      { condition: !data.customerId, title: "Customer is required!" },
      { condition: !data.orderType, title: "Order Type is required!" },
      {
        condition: data.orderType === "AGAINSTPI" && !data.proFormaId,
        title: "PI No is required!",
      },
      {
        condition: !data.productionType,
        title: "Production Type is required!",
      },
      {
        condition:
          data.productionType === "BULK" &&
          data.orderType === "AGAINSTPI" &&
          !data.refNo,
        title: "RefNo is required!",
      },
      { condition: !data.deliveryDate, title: "Delivery Date is required!" },
      { condition: !data.validDays, title: "Valid To is required!" },
      { condition: items.length === 0, title: "Order Items are required!" },
      {},
    ];

    const failed = checks.find((c) => c.condition);
    if (failed) {
      Swal.fire({
        icon: "warning",
        title: failed.title,
        html: failed.html,
        timer: failed.html ? undefined : 1500,
        showConfirmButton: !!failed.html,
        confirmButtonText: "OK",
      });
      return false;
    }
    const rowErrors = validateRows(items);
    if (rowErrors.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Row Validation Error",
        html: `<div style="text-align:left">${rowErrors.join("<br/>")}</div>`,
      });
      return false;
    }

    // 🔹 Duplicate validation
    const duplicates = findDuplicates(items);
    if (duplicates.length > 0) {
      const message = duplicates
        .map(
          (d) =>
            `Row ${d.duplicateIndex + 1} is duplicate of Row ${d.firstIndex + 1}`,
        )
        .join("<br/>");

      Swal.fire({
        icon: "warning",
        title: "Duplicate Items Found",
        html: `<div style="text-align:left">${message}</div>`,
      });
      return false;
    }

    return true;
  };

  const saveData = (nextProcess, options = {}) => {
    const submitApprovalFlag = !!options.submitApproval;
    if (!validateData(data)) {
      return;
    }
    if (id) {
      if (!window.confirm("Are you sure update the details ...?")) {
        return;
      }
    }
    if (nextProcess == "draft" && !id) {
      handleSubmitCustom(
        addData,
        (data = { ...data, draftSave: true }),
        "Added",
        nextProcess,
      );
    } else if (id && nextProcess == "draft") {
      handleSubmitCustom(
        updateData,
        { ...data, draftSave: true },
        "Updated",
        nextProcess,
      );
    } else if (id) {
      handleSubmitCustom(
        updateData,
        { ...data, ...(submitApprovalFlag ? { submitApproval: true } : {}) },
        "Updated",
        nextProcess,
      );
    } else {
      handleSubmitCustom(
        addData,
        { ...data, ...(submitApprovalFlag ? { submitApproval: true } : {}) },
        "Added",
        nextProcess,
      );
    }
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveData("close");
    }
  };

  useEffect(() => {
    customerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (attachments?.length >= 5) return;
    setAttachments((prev) => {
      let newArray = Array.from({ length: 5 - prev?.length }, () => {
        return { date: today, filePath: "", log: "", name: "" };
      });
      return [...prev, ...newArray];
    });
  }, [setAttachments, attachments]);

  function handleInputChange(value, index, field) {
    const newBlend = structuredClone(attachments);
    newBlend[index][field] = value;
    setAttachments(newBlend);
  }

  function openPreview(filePath) {
    window.open(
      filePath instanceof File
        ? URL.createObjectURL(filePath)
        : getImageUrlPath(filePath),
    );
  }

  function addNewComments() {
    setAttachments((prev) => [...prev, { log: "", date: today, filePath: "" }]);
  }

  function deleteRow(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  const handleApprovalAction = (type) => {
    setActionType(type);
    setApprovalRemarks("");
    setApprovalModal(true);
  };

  const handleConfirmAction = async () => {
    if (actionType === "REJECT" && !approvalRemarks.trim()) {
      toast.warning("Remarks required for sending back!");
      return;
    }
    setActionLoading(true);
    try {
      const result = await addApprovalStatus({
        userId: userData?.id,
        remarks: approvalRemarks || null,
        actionType,
        referenceId: id,
        referencePage: "ORDER ENTRY",
        recordData: {},
      }).unwrap();

      if (result.statusCode === 0) {
        toast.success(
          result.message ||
            (actionType === "APPROVE"
              ? "Order Entry Approved!"
              : "Sent Back for Review!"),
        );
        setApprovalModal(false);
        // dispatchInvalidate();
        onClose();
      } else {
        toast.error(result.message || "Action failed");
        setApprovalModal(false);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong!");
      setApprovalModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  // const fillWithDefaultRows = (items, total = 10) => {
  //     const EMPTY_ROW = {
  //         styleItemId: "",
  //         uomId: "",
  //         hsnId: "",
  //         orderQty: "",
  //         itemGroupId: "",
  //         type: "",
  //         sizeBreakup: [],
  //     };

  //     const filled = [...items];

  //     if (filled.length < total) {
  //         const remaining = total - filled.length;
  //         for (let i = 0; i < remaining; i++) {
  //             filled.push({ ...EMPTY_ROW });
  //         }
  //     }

  //     return filled;
  // };

  // useEffect(() => {
  //     if (!id) {
  //         setOrderItems(fillWithDefaultRows([]));
  //     }
  const fillWithDefaultRows = (items = []) => padRows(items);

  const isSupplierOutside = useMemo(() => {
    return supplierData?.data?.City?.state?.name !== "TAMILNADU";
  }, [supplierData]);

  const enrichedData = useMemo(() => {
    const filteredItems = orderItems
      .filter((i) => i.styleItemId)
      .map((i) => ({
        ...i,
        qty: i.orderQty,
      }));
    if (!filteredItems.length)
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
      conversionType === "DOZEN" ? true : false,
    );
  }, [
    orderItems,
    isSupplierOutside,
    discountType,
    discountValue,
    conversionType,
  ]);
  const handleConversionChange = (newVal) => {
    setConversionType(newVal);
    setOrderItems((prev) =>
      prev.map((row) => {
        const qty = parseFloat(row.orderQty) || 0;
        const price = parseFloat(row.price) || 0;
        const dozen = qty / 12;
        let amount = "";

        if (newVal === "DOZEN") {
          amount = dozen > 0 && price > 0 ? (dozen * price).toFixed(2) : "";
        } else {
          amount = qty > 0 && price > 0 ? (qty * price).toFixed(2) : "";
        }

        return {
          ...row,
          dozen: dozen > 0 ? dozen.toFixed(2) : "",
          amount,
        };
      }),
    );
  };

  return (
    <>
      <Modal isOpen={summary} onClose={() => setSummary(false)} widthClass="">
        <PoSummary
          poItems={orderItems}
          totals={enrichedData}
          readOnly={readOnly || isDisabled || childRecord.current > 0}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          setSummary={setSummary}
          isCustomerExport={isCustomerExport}
        />
      </Modal>

      <Modal
        isOpen={approvalModal}
        onClose={() => setApprovalModal(false)}
        widthClass="w-[420px]"
      >
        <div className="space-y-4">
          <h2
            className={`text-base font-semibold ${
              actionType === "APPROVE" ? "text-green-700" : "text-blue-700"
            }`}
          >
            {actionType === "APPROVE"
              ? "✅ Approve Order Entry"
              : "↩️ Send Back for Review"}
          </h2>

          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Order Entry No</span>
              <span className="font-medium text-gray-800">{docId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-800">
                {findFromList(customerId, customerList?.data, "name")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Current Approval</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : status === "REJECTED"
                      ? "bg-red-100 text-red-700"
                      : status === "SUPERSEDED"
                        ? "bg-orange-100 text-orange-700" // ✅ NEW
                        : "bg-orange-100 text-orange-700"
                }`}
              >
                {status === "PENDING"
                  ? "Waiting For Approval"
                  : status === "SUPERSEDED"
                    ? "Re-approval Required" // ✅ NEW
                    : status}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Remarks{" "}
              {actionType === "REJECT" && (
                <span className="text-red-500">* required</span>
              )}
            </label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
              placeholder={
                actionType === "APPROVE"
                  ? "Optional remarks..."
                  : "Reason for sending back (required)..."
              }
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setApprovalModal(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setApprovalModal(false);
                }
              }}
              className="px-4 py-1.5 text-xs rounded text-white hover:bg-red-600 bg-red-500"
            >
              Cancel
            </button>
            <button
              disabled={actionLoading}
              onClick={handleConfirmAction}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleConfirmAction();
                }
              }}
              className={`px-4 py-1.5 text-xs rounded text-white font-semibold transition ${
                actionType === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
            >
              {actionLoading ? (
                <>
                  <svg
                    className="animate-spin h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Processing...
                </>
              ) : actionType === "APPROVE" ? (
                "Confirm Approve"
              ) : (
                "Send Back"
              )}
            </button>
          </div>
        </div>
      </Modal>
      {attachmentModal && (
        <Modal
          isOpen={attachmentModal}
          onClose={() => {
            setAttachmentModal(false);
            setSelectedAttachmentIndex(null);
          }}
          widthClass="p-4 w-[600px] h-[420px]"
        >
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-700">
              Attachments
            </h2>

            {/* Drag & Drop Zone */}
            <div
              className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center cursor-pointer hover:bg-indigo-50 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && selectedAttachmentIndex !== null) {
                  handleInputChange(
                    renameFile(file),
                    selectedAttachmentIndex,
                    "filePath",
                  );
                }
              }}
              onClick={() =>
                document.getElementById("modal-file-upload")?.click()
              }
            >
              <p className="text-sm text-slate-500">
                Drag & drop here, or{" "}
                <span className="text-indigo-600 font-medium underline">
                  click to browse
                </span>
              </p>
              {selectedAttachmentIndex !== null ? (
                <p className="text-xs text-indigo-500 mt-1">
                  Uploading to row:{" "}
                  <strong>{selectedAttachmentIndex + 1}</strong>
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Select a row below first
                </p>
              )}
            </div>

            {/* Hidden file input for drag & drop zone */}
            <input
              type="file"
              id="modal-file-upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files[0] && selectedAttachmentIndex !== null) {
                  handleInputChange(
                    renameFile(e.target.files[0]),
                    selectedAttachmentIndex,
                    "filePath",
                  );
                  e.target.value = "";
                }
              }}
              disabled={readOnly}
            />

            {/* Attachments Table */}
            <div className="max-h-[200px] overflow-auto">
              <div className="border-collapse bg-[#F1F1F0] shadow-sm overflow-auto">
                <table className="bg-gray-200 text-gray-800 text-sm table-auto w-full">
                  <thead className="py-2 font-medium sticky top-0">
                    <tr>
                      <th className="py-2 text-xs w-10 text-center border-r border-white/50">
                        S.No
                      </th>
                      <th className="py-2 text-xs w-60 text-center border-r border-white/50">
                        Name
                      </th>
                      <th className="py-2 text-xs w-60 text-center border-r border-white/50">
                        File
                      </th>
                      <th className="py-2 text-xs w-10 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attachments?.map((item, index) => (
                      <tr
                        key={index}
                        onClick={() => setSelectedAttachmentIndex(index)}
                        className={`transition-colors border-b border-gray-200 text-[12px] cursor-pointer ${
                          index === selectedAttachmentIndex
                            ? "bg-indigo-100 border-l-2 border-l-indigo-500"
                            : index % 2 === 0
                              ? "bg-white hover:bg-gray-50"
                              : "bg-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        {/* S.No */}
                        <td className="border-r border-white/50 h-8 text-center">
                          {index + 1}
                        </td>

                        {/* Name */}
                        <td className="border-r border-white/50 h-8">
                          <input
                            type="text"
                            className="text-left rounded py-1 px-2 w-full focus:outline-none focus:ring focus:border-blue-300 bg-transparent"
                            value={item?.name}
                            onChange={(e) =>
                              handleInputChange(e.target.value, index, "name")
                            }
                            onClick={(e) => e.stopPropagation()}
                            disabled={readOnly}
                          />
                        </td>

                        {/* File */}
                        <td className="border-r border-white/50 h-8 px-2">
                          <div className="flex items-center gap-2">
                            {!readOnly && (
                              <label
                                htmlFor={`modal-row-upload-${index}`}
                                className="cursor-pointer flex items-center justify-center p-1 bg-gray-100 rounded hover:bg-gray-200"
                                title="Attach file"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📎
                                <input
                                  type="file"
                                  id={`modal-row-upload-${index}`}
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handleInputChange(
                                        renameFile(e.target.files[0]),
                                        index,
                                        "filePath",
                                      );
                                      e.target.value = "";
                                    }
                                  }}
                                  disabled={readOnly}
                                />
                              </label>
                            )}

                            {item.filePath ? (
                              <>
                                <span className="truncate max-w-[120px] text-green-700 font-medium">
                                  ✅ {item.filePath?.name ?? item.filePath}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPreview(item.filePath);
                                  }}
                                  className="text-blue-600 text-xs hover:underline"
                                >
                                  View
                                </button>
                                {!readOnly && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInputChange("", index, "filePath");
                                    }}
                                    className="text-red-600 text-xs"
                                    title="Remove file"
                                    disabled={readOnly}
                                  >
                                    ✕
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 italic text-xs">
                                No file
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="w-[30px] border-gray-200 h-8">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addNewComments();
                              }}
                              disabled={readOnly}
                              className="flex items-center px-1 bg-blue-50 rounded"
                            >
                              <Plus size={18} className="text-blue-800" />
                            </button>
                            <button
                              className="flex items-center px-1 bg-red-50 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRow(index);
                                if (selectedAttachmentIndex === index) {
                                  setSelectedAttachmentIndex(null);
                                }
                              }}
                              disabled={readOnly}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-red-800"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setAttachmentModal(false);
                  setSelectedAttachmentIndex(null);
                }}
                className="px-2 py-1 text-sm rounded bg-green-700 text-white hover:bg-green-800 border border-green-800"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {printModalOpen && (
        <Modal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          widthClass="w-[90%] h-[90%]"
        >
          <PDFViewer className="w-full h-full border-none">
            <OrderEntryPrintFormat
              data={data}
              customerDetails={customerList?.data?.find(
                (c) => c.id === customerId,
              )}
              branchData={branchData?.data}
              qrCodeDataUrl={qrCodeDataUrl}
              styleItemList={styleItemList}
              itemSubGroupList={itemSubGroupList}
              itemGroupList={itemGroupList}
              gsmList={gsmList}
              uomList={uomList}
              sizeList={sizeList}
              hsnList={hsnList}
              totals={enrichedData}
              discountType={discountType}
              currencyCode={currencyCode}
              isCurrencySymbol={isCurrencySymbol}
              isCustomerExport={isCustomerExport}
              cityList={cityList}
            />
          </PDFViewer>
        </Modal>
      )}
      <TransactionLayout
        title="Order Entry"
        badge={<ModeChip id={id} readOnly={readOnly} />}
        closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        header={
          <div className="flex flex-col gap-2">
            <div className="flex flex-col xl:flex-row gap-1">
              {/* Basic Details */}

              <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
                  Basic Details
                </h2>
                <div className="flex gap-2">
                  <div className="w-36">
                    <TextInput name="Order No" value={docId} disabled={true} />
                  </div>
                  <div className="w-24">
                    <DateInputNew
                      name="Order Date"
                      value={docDate}
                      setValue={setDocDate}
                      disabled={true}
                      required={true}
                      type="date"
                    />
                  </div>
                </div>
              </div>
              {/* Customer Details */}

              <div className=" w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
                  Customer Details
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="md:col-span-2">
                    <DropdownWithModal
                      name="Customer"
                      options={dropDownListObject(
                        id
                          ? customerList?.data?.filter(
                              (item) => item?.isCustomer,
                            )
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
                      className={`w-full`}
                      addNewLabel="+ Add New Customer"
                      childComponent={PartyMaster}
                      addNewModalWidth="w-[90%] h-[95%]"
                      disabled={childRecord.current > 0 || readOnly}
                      ref={customerRef}
                      openOnFocus={true}
                    />
                  </div>
                  <div className="">
                    <TextInput
                      name="Contact Person"
                      placeholder="Contact name"
                      value={findFromList(
                        customerId,
                        customerList?.data,
                        "contactPersonName",
                      )}
                      disabled={true}
                    />
                  </div>
                  <div className="">
                    <TextInput
                      name="Phone"
                      placeholder="Contact number"
                      value={findFromList(
                        customerId,
                        customerList?.data,
                        "contactNumber",
                      )}
                      disabled={true}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
              {/* Order Details */}

              <div className="flex-1 border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
                  Order Details
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <DropdownInput
                    name="Order Type"
                    options={orderTypes}
                    value={orderType}
                    setValue={(value) => {
                      setOrderType(value);
                      setProFormaId("");
                      if (value === "GENERAL") {
                        setOrderItems(fillWithDefaultRows([]));
                        setTaxTemplateId("");
                        setDiscountType("Percentage");
                        setDiscountValue(0);
                        setConversionType("DOZEN");
                        setTermsId("");
                        setTermsAndCondition("");
                        setDeliveryDate("");
                        setRemarks("");
                        setPayTermId("");
                        setBankId("");
                        setCurrencyId("");
                        setWeightInKg("");
                        setCarriageCharge("");
                        setLoadingId("");
                        setDeliveryId("");
                      }
                    }}
                    required={true}
                    readOnly={readOnly}
                    disabled={childRecord.current > 0 || readOnly}
                  />
                  <div className="col-span-1">
                    <DropdownNew
                      name="PI No"
                      dataList={PIList?.data?.filter((item) =>
                        id
                          ? item?.customerId === customerId
                          : isRepeatedPI
                            ? item?.customerId === customerId && item?.hasBulk
                            : item?.customerId === customerId && !item?.hasBulk,
                      )}
                      value={proFormaId}
                      setValue={setProFormaId}
                      required={orderType === "AGAINSTPI"}
                      readOnly={
                        childRecord.current > 0 ||
                        readOnly ||
                        orderType === "GENERAL"
                      }
                      disabled={
                        childRecord.current > 0 ||
                        readOnly ||
                        orderType === "GENERAL"
                      }
                      otherField={"docId"}
                      beforeChange={async (selectedValue) => {
                        if (!selectedValue) {
                          setOrderItems(fillWithDefaultRows([]));
                          return;
                        }

                        const res = await getPIById(selectedValue?.id).unwrap();
                        {
                          console.log("res", res);
                        }

                        setTaxTemplateId(res?.data?.taxTemplateId || "");
                        setDiscountType(
                          res?.data?.discountType || "Percentage",
                        );
                        setDiscountValue(res?.data?.discountValue || 0);
                        setConversionType(res?.data?.conversionType || "DOZEN");
                        if (res?.data?.termsId) setTermsId(res.data.termsId);
                        if (res?.data?.termsAndCondition)
                          setTermsAndCondition(res.data.termsAndCondition);
                        if (res?.data?.deliveryDate)
                          setDeliveryDate(
                            moment
                              .utc(res.data.deliveryDate)
                              .format("YYYY-MM-DD"),
                          );
                        if (res?.data?.remarks) setRemarks(res.data.remarks);

                        setPayTermId(res?.data?.payTermId || "");
                        setBankId(res?.data?.bankId || "");
                        setCurrencyId(res?.data?.currencyId || "");
                        setWeightInKg(res?.data?.weightInKg || "");
                        setCarriageCharge(res?.data?.carriageCharge || "");
                        setLoadingId(res?.data?.loadingId || "");
                        setDeliveryId(res?.data?.deliveryId || "");

                        const mappedItems =
                          Object.values(
                            (res?.data?.items || []).reduce((acc, item) => {
                              const key = item.styleItemId;

                              if (
                                !acc[key] ||
                                acc[key].quoteVersion < item.quoteVersion
                              ) {
                                acc[key] = item;
                              }

                              return acc;
                            }, {}),
                          )
                            .sort((a, b) => a.id - b.id)
                            .map((item) => ({
                              styleItemId: item.styleItemId,
                              orderQty: item.qty || "",
                              piQty: Number(item.qty) || 0,
                              sizeId: item.sizeId || "",
                              uomId: item.uomId || "",
                              gsmId: item.gsmId || "",
                              hsnId: item.hsnId || "",
                              price: item.price || "",
                              amount: item.amount || "",
                              dozen: item.dozen || "",
                              discountType: item.discountType || "",
                              discountValue: item.discountValue || "",
                              taxPercent: item.taxPercent || "",
                              taxType: item.taxType || "",
                              sizeBreakup: [],
                              itemGroupId: item.StyleItem?.itemGroupId,
                              itemSubGroupId: item.StyleItem?.itemSubGroupId,
                            })) || [];

                        setOrderItems(fillWithDefaultRows(mappedItems));
                      }}
                    />
                  </div>
                  <DropdownInput
                    name="Production Type"
                    options={productionTypes}
                    value={productionType}
                    setValue={(value) => setProductionType(value)}
                    required={true}
                    readOnly={readOnly}
                    disabled={childRecord.current > 0 || readOnly}
                    beforeChange={() => {
                      setRefNo("");
                    }}
                  />
                  {productionType === "SAMPLE" ? (
                    <TextInput
                      name="Ref No"
                      value={refNo}
                      setValue={setRefNo}
                      disabled={
                        productionType === "SAMPLE" ||
                        childRecord.current > 0 ||
                        readOnly
                      }
                      required={productionType === "BULK"}
                    />
                  ) : (
                    <DropdownNew
                      name="Ref No"
                      dataList={refList?.data?.filter(
                        (item) => item?.customerId === customerId,
                      )}
                      value={refNo}
                      setValue={setRefNo}
                      required={
                        productionType === "BULK" && orderType === "AGAINSTPI"
                      }
                      disabled={childRecord.current > 0 || readOnly}
                      otherField={"refNo"}
                      otherValue={"refNo"}
                    />
                  )}

                  <TextInput
                    name="ValidDays"
                    value={validDays}
                    setValue={setValidDays}
                    disabled={childRecord.current > 0 || readOnly}
                    type="number"
                    min="0"
                    className="text-right"
                    required={true}
                    onBlur={(e) =>
                      setValidDays(e.target.value ? Number(e.target.value) : "")
                    }
                    onFocus={(e) => {
                      e.target.select();
                    }}
                  />
                  {/* <div className="m-2 p-0 flex items-center">
                  <CheckBoxNew
                    name="Repeated PI"
                    readOnly={readOnly}
                    value={isRepeatedPI}
                    setValue={setIsRepeatedPI}
                    disabled={readOnly || childRecord.current > 0}
                    className="text-[11px] font-medium"
                  />
                </div> */}
                </div>
              </div>
            </div>
            {/* Other Details */}

            <div className="border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
              <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
                Other Details
              </h2>
              <div className="flex gap-2 gap-x-2">
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
                        readOnly={
                          childRecord.current > 0 ||
                          readOnly ||
                          orderType === "AGAINSTPI"
                        }
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
                        readOnly={
                          childRecord.current > 0 ||
                          readOnly ||
                          orderType === "AGAINSTPI"
                        }
                        required={true}
                      />
                    </div>
                  </>
                )}
                <div className="w-32">
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
                    readOnly={
                      childRecord.current > 0 ||
                      readOnly ||
                      orderType === "AGAINSTPI"
                    }
                  />
                </div>
                <div className="w-32">
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
                    required={false}
                    readOnly={readOnly || orderType === "AGAINSTPI"}
                    className={`w-full max-w-none`}
                    dropdownMinWidth={240}
                    addNewLabel="+ Add New Pay Term"
                    childComponent={PayTermMaster}
                    addNewModalWidth="w-[40%] h-[66%]"
                    disabled={
                      childRecord.current > 0 ||
                      readOnly ||
                      orderType === "AGAINSTPI"
                    }
                  />
                </div>
                <div className="w-28">
                  <DropdownInput
                    name="Conversion"
                    options={conversionTypes}
                    value={conversionType}
                    setValue={handleConversionChange}
                    required={false}
                    readOnly={
                      childRecord.current > 0 ||
                      readOnly ||
                      orderType === "AGAINSTPI"
                    }
                  />
                </div>
                <div className="w-24">
                  <TextInput
                    name="Weight In Kg(KG)"
                    value={weightInKg}
                    setValue={setWeightInKg}
                    type="number"
                    min="0"
                    className="text-right"
                    disabled={
                      childRecord.current > 0 ||
                      readOnly ||
                      orderType === "AGAINSTPI"
                    }
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
                <div className="col-span-1">
                  <TextInput
                    name={`Carriage and Air Freight ${currencyId ? `(${isCurrencySymbol})` : ""}`}
                    value={carriageCharge}
                    setValue={setCarriageCharge}
                    type="number"
                    min="0"
                    className="text-right"
                    disabled={
                      childRecord.current > 0 ||
                      readOnly ||
                      orderType === "AGAINSTPI"
                    }
                    onBlur={(e) =>
                      setCarriageCharge(
                        e.target.value ? Number(e.target.value).toFixed(2) : "",
                      )
                    }
                    onFocus={(e) => {
                      e.target.select();
                    }}
                  />
                </div>
                <div className="w-44">
                  <DropdownWithModal
                    name="Advising Bank"
                    options={dropDownListObjectMultiple(
                      bankList?.data,
                      ["name", "Branch.name"],
                      "id",
                    )}
                    value={bankId}
                    setValue={setBankId}
                    required={false}
                    readOnly={
                      childRecord.current > 0 ||
                      readOnly ||
                      orderType === "AGAINSTPI"
                    }
                    className={`w-[150px]`}
                    addNewLabel="+ Add New Bank"
                    childComponent={BankMaster}
                    addNewModalWidth="w-[45%] h-[64%]"
                    disabled={
                      childRecord.current > 0 ||
                      readOnly ||
                      orderType === "AGAINSTPI"
                    }
                  />
                </div>
                {isCustomerExport && (
                  <div className="w-24">
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
                      readOnly={
                        childRecord.current > 0 ||
                        readOnly ||
                        orderType === "AGAINSTPI"
                      }
                      className={`w-full max-w-none`}
                      dropdownMinWidth={240}
                      addNewLabel="+ Add New Currency"
                      childComponent={CurrencyMaster}
                      addNewModalWidth="w-[40%] h-[66%]"
                      disabled={
                        childRecord.current > 0 ||
                        readOnly ||
                        orderType === "AGAINSTPI"
                      }
                    />
                  </div>
                )}
                <div className="w-[105px]">
                  <DateInputNew
                    name="Delivery Date"
                    value={deliveryDate}
                    setValue={setDeliveryDate}
                    required={true}
                    readOnly={
                      childRecord.current > 0 ||
                      readOnly ||
                      orderType === "AGAINSTPI"
                    }
                    type={"date"}
                  />
                </div>
              </div>
            </div>
          </div>
        }
        detailsLayout="default"
        detailsLayouts={["default"]}
        gridItems={
          <OrderItems
            orderItems={orderItems}
            setOrderItems={setOrderItems}
            readOnly={readOnly || childRecord?.current > 0}
            styleItemList={styleItemList}
            sizeList={sizeList}
            uomList={uomList}
            gsmList={gsmList}
            id={id}
            itemGroupList={itemGroupList}
            sizeTemplateList={sizeTemplateList}
            hsnList={hsnList}
            requirementRef={requirementRef}
            childRecord={childRecord}
            itemSubGroupList={itemSubGroupList}
            enrichedItems={enrichedData}
            taxTemplateId={taxTemplateId}
            conversionType={conversionType}
            isSupplierOutside={isSupplierOutside}
            orderType={orderType}
            isCustomerExport={isCustomerExport}
            currencyCode={currencyCode}
            isCurrencySymbol={isCurrencySymbol}
          />
        }
        footer={
          <>
            <ReusableFormFooter
              sections={[
                {
                  title: "Customer Requirements",
                  value: requirements,
                  onChange: setRequirements,
                  placeholder: "Enter requirements...",
                  readOnly: readOnly || childRecord.current > 0,
                  ref: requirementRef,
                },
                {
                  title: "Remarks",
                  value: remarks,
                  onChange: setRemarks,
                  placeholder: "Additional notes...",
                  readOnly: readOnly || childRecord.current > 0,
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
                              {!isNaN(parseFloat(carriageCharge)) &&
                              carriageCharge !== ""
                                ? formatCurrencyAmount(
                                    carriageCharge,
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
                                      : 0)) + (parseFloat(carriageCharge) || 0),
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
                {!isDisabled && !readOnly && (
                  <>
                    <button
                      onClick={() => saveData("close")}
                      disabled={isDisabled || readOnly}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveData("close");
                          e.stopPropagation();
                        }
                      }}
                      className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs"
                    >
                      <HiOutlineRefresh className="w-4 h-4 mr-2" />
                      {id ? "Update & Close" : "Save & Close"}
                    </button>
                    <button
                      onClick={() => saveData("new")}
                      disabled={isDisabled || readOnly}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          saveData("new");
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
                {status === "REJECTED" && (
                  <button
                    onClick={() => saveData("close", { submitApproval: true })}
                    disabled={readOnly}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        saveData("close", { submitApproval: true });
                      }
                    }}
                    title="Submit Approval"
                    className="bg-green-700 text-white px-2 py-1 rounded hover:bg-green-800 flex items-center text-xs"
                  >
                    <FiSend className="w-4 h-4" />
                  </button>
                )}
                {id && status === "PENDING" && canApprove && (
                  <button
                    onClick={() => {
                      handleApprovalAction("REJECT");
                    }}
                    disabled={readOnly}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApprovalAction("REJECT");
                      }
                    }}
                    title="Send Back for Review"
                    className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center text-xs"
                  >
                    <MdKeyboardDoubleArrowLeft className="w-4 h-4" />
                  </button>
                )}
                {id && status === "PENDING" && canApprove && (
                  <button
                    onClick={() => {
                      handleApprovalAction("APPROVE");
                    }}
                    disabled={readOnly}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApprovalAction("APPROVE");
                      }
                    }}
                    title="Approve"
                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center text-xs"
                  >
                    <FiCheck className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {!id ||
                  (readOnly && (
                    <button
                      className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700 flex items-center text-xs"
                      onClick={() =>
                        hasPermission(() => setReadOnly(false), "edit")
                      }
                      disabled={isDisabled}
                    >
                      <FiEdit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  ))}
                {id &&
                  (status === "APPROVED" || status === "NOT_CONFIGURED") && (
                    <button
                      onClick={() => {
                        if (qrRef.current) {
                          setQrCodeDataUrl(
                            qrRef.current.toDataURL("image/png"),
                          );
                        }
                        setPrintModalOpen(true);
                      }}
                      className="bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-700 flex items-center text-xs"
                    >
                      <FiFileText className="w-4 h-4 mr-2" />
                      PDF Export
                    </button>
                  )}
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
export default OrderEntryForm;

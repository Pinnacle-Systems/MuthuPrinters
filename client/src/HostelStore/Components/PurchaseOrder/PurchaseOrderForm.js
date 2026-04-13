import { IoArrowBackCircleSharp } from "react-icons/io5";

import {
  CheckBox,
  DateInputNew,
  DropdownInput,
  ReusableInput,
  ReusableSearchableInput,
  TextInput,
} from "../../../Inputs";
import { deliveryTypes, poTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import { useGetPartyByIdQuery } from "../../../redux/services/PartyMasterService";
import { toast } from "react-toastify";
import { FiEdit2, FiPrinter, FiSave, FiSend } from "react-icons/fi";
import { HiOutlineRefresh, HiX } from "react-icons/hi";
import {
  useAddPoMutation,
  useGetPoByIdQuery,
  useUpdatePoMutation,
} from "../../../redux/uniformService/PoServices";
import Swal from "sweetalert2";
import { PDFViewer } from "@react-pdf/renderer";
import tw from "../../../Utils/tailwind-react-pdf";
import Modal from "../../../UiComponents/Modal";
import { dropDownListObject } from "../../../Utils/contructObject";
import PoSummary from "./PoSummary";
import { useGetBranchByIdQuery } from "../../../redux/services/BranchMasterService";
import { groupBy } from "lodash";
import PoItems from "./PoItems";
import PurchaseOrderPrintFormat from "./PrintFormat-PO";
import { invalidatePurchaseModule } from "../../../redux/Dispatch/PurchaseInvalidateTags";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags";
import { DropdownWithModal } from "../../../Inputs/Reuseable";
import { PayTermMaster, TermsAndCondition } from "../../../Basic/components";
import { PartyMaster, TaxTemplate } from "..";
import { useSelector } from "react-redux";
import { useGetPagesQuery } from "../../../redux/services/PageMasterService";
import {
  CommonFormFooter,
  TransactionActions,
  TransactionLayout,
} from "../../../Basic/components/Reuseable";
import {
  createPurchaseOrderRows,
  getPurchaseOrderPayload,
  getPurchaseOrderTaxSnapshot,
  showValidationResult,
  validatePurchaseOrderData,
} from "./purchaseOrder.module";

const PurchaseOrderForm = ({
  onClose,
  id,
  setId,
  readOnly,
  setReadOnly,
  taxTypeList,
  supplierList,
  yarnList,
  uomList,
  styleItemList,
  termsData,
  branchList,
  hsnList,
  payTermList,
  itemGroupList,
  sizeList,
  colorList,
  branchData,
  gsmList,
}) => {
  const today = new Date();
  const [pendingAction, setPendingAction] = useState(null);
  const [docDate, setDocDate] = useState(
    moment.utc(today).format("YYYY-MM-DD"),
  );
  const [taxTemplateId, setTaxTemplateId] = useState("");
  const [payTermId, setPayTermId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [poType, setPoType] = useState("Order Purchase");
  const [poMaterial, setPoMaterial] = useState("DyedYarn");
  const [supplierId, setSupplierId] = useState("");
  const [termsAndCondtion, setTermsAndCondtion] = useState("");
  const [termsId, setTermsId] = useState("");
  const [poItems, setPoItems] = useState([]);
  const [discountType, setDiscountType] = useState("Percentage");
  const [discountValue, setDiscountValue] = useState();
  const [taxPercent, setTaxPercent] = useState();
  const [orderId, setOrderId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [PurchaseType, setPurchaseType] = useState("General Purchase");
  const [summary, setSummary] = useState(false);
  const [docId, setDocId] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryToId, setDeliveryToId] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [quoteVersion, setQuoteVersion] = useState("");
  const [submitApproval, setSubmitApproval] = useState(false);
  const supplierRef = useRef(null);
  const termsRef = useRef(null);
  const [dispatchInvalidate] = useInvalidateTags();

  const [requirementId, setRequirementId] = useState("");

  const { branchId, userId, finYearId } = getCommonParams();
  const params = { branchId, userId, finYearId, poMaterial: poMaterial };
  const { data: supplierDetails } = useGetPartyByIdQuery(supplierId, {
    skip: !supplierId,
  });
  const openTabs = useSelector((state) => state.openTabs);

  const activeTab = openTabs.tabs.find((tab) => tab.active);
  const { data: pageData } = useGetPagesQuery({});

  const currentPageId =
    (pageData?.data || []).find((i) => i.name === activeTab.name)?.id || "";

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetPoByIdQuery(id, { skip: !id });

  const childRecordCount =
    singleData?.data?.childRecordInward + singleData?.data?.childRecordCancel;

  const [addData] = useAddPoMutation();
  const [updateData] = useUpdatePoMutation();

  const syncFormWithDb = useCallback(
    (data) => {
      setReadOnly(
        data?.approvalStatus?.status === "APPROVED" ||
          data?.approvalStatus?.status === "REJECTED",
      );
      setPoType(data?.poType ? data?.poType : "GENERAL");
      setDocDate(
        data?.docDate
          ? moment.utc(data.docDate).format("YYYY-MM-DD")
          : moment.utc(new Date()).format("YYYY-MM-DD"),
      );

      setPoItems(
        data?.poItems
          ? data?.poItems
          : createPurchaseOrderRows(4, quoteVersion),
      );
      setDocId(data?.docId ? data?.docId : "New");
      setDiscountType(data?.discountType || "Percentage");
      setTaxPercent(data?.taxPercent ? data?.taxPercent : "");
      setDiscountValue(data?.discountValue || "0");
      setSupplierId(data?.supplierId || "");
      setDueDate(
        data?.dueDate ? moment.utc(data.dueDate).format("YYYY-MM-DD") : "",
      );
      setDeliveryType(data?.deliveryType || "");
      setDeliveryToId(
        data?.deliveryType === "ToSelf"
          ? data?.deliveryBranchId
          : data?.deliveryToId || "",
      );
      setRemarks(data?.remarks || "");
      setPurchaseType(data?.PurchaseType ? data?.PurchaseType : "");
      setOrderId(data?.orderId ? data?.orderId : "");
      setRequirementId(data?.requirementId ? data?.requirementId : "");
      setTaxTemplateId(data?.taxTemplateId ? data?.taxTemplateId : "");
      setTermsAndCondtion(data?.termsAndCondtion ? data?.termsAndCondtion : "");
      setTermsId(data?.termsId ? data?.termsId : "");
      setIsNewVersion(false);
      setQuoteVersion(data?.quoteVersion || "");
      setPayTermId(data?.payTermId ? data?.payTermId : "");
    },
    [id],
  );

  useEffect(() => {
    if (id) {
      syncFormWithDb(singleData?.data);
    } else {
      syncFormWithDb(undefined);
    }
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      let returnData;
      if (text === "Updated") {
        returnData = await callback(data).unwrap();
      } else {
        returnData = await callback(data).unwrap();
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
            // ✅ Runs after Swal completely closes
            invalidatePurchaseModule();
            dispatchInvalidate();

            if (returnData.statusCode === 0) {
              // ✅ Show print confirmation only for new entries
              if (!id) {
                Swal.fire({
                  icon: "question",
                  title: "Do You Want to Print?",
                  showCancelButton: true,
                  confirmButtonText: "Yes, Print",
                  cancelButtonText: "No, Thanks [Esc]",
                  confirmButtonColor: "#3085d6",
                  cancelButtonColor: "#6b7280",
                  focusConfirm: true, // ✅ Auto-focus confirm button
                  allowEnterKey: true, // ✅ Allow Enter to confirm
                  allowEscapeKey: true, // ✅ Allow Escape to cancel
                  didOpen: () => {
                    // ✅ Ensure confirm button is focused when modal opens
                    const confirmButton = Swal.getConfirmButton();
                    const cancelButton = Swal.getCancelButton();

                    if (confirmButton) {
                      confirmButton.focus();

                      // ✅ Add keyboard navigation
                      confirmButton.addEventListener("keydown", (e) => {
                        if (e.key === "Tab" && !e.shiftKey) {
                          e.preventDefault();
                          cancelButton?.focus();
                        }
                      });
                    }

                    if (cancelButton) {
                      cancelButton.addEventListener("keydown", (e) => {
                        if (e.key === "Tab" && e.shiftKey) {
                          e.preventDefault();
                          confirmButton?.focus();
                        }
                      });
                    }
                  },
                }).then((result) => {
                  if (result.isConfirmed) {
                    // ✅ User clicked "Yes, Print"
                    setPrintModalOpen(true);
                    // Set the ID so the print modal can access the saved data
                    if (returnData?.data?.id) {
                      setId(returnData.data.id);
                    }
                    setPendingAction(nextProcess);
                  } else {
                    // ✅ User clicked "No, Thanks" - proceed with normal flow
                    if (nextProcess === "new") {
                      syncFormWithDb(undefined);
                      setId("");
                      setDocId("New");

                      setTimeout(() => {
                        supplierRef.current?.focus();
                      }, 300);
                    }
                    if (nextProcess === "close") {
                      onClose();
                    }
                  }
                });
              } else {
                // ✅ For updates, proceed normally without print prompt
                if (nextProcess === "new") {
                  setId("");
                  setDocId("New");
                  syncFormWithDb(undefined);

                  setTimeout(() => {
                    supplierRef.current?.focus();
                  }, 100);
                }
                if (nextProcess === "close") {
                  onClose();
                }
              }
            } else {
              toast.error(returnData?.message);
            }
          },
        });
      }
    } catch (error) {
      console.log("handle", error);
    }
  };

  const findDuplicates = (items) => {
    return items;
  };

  const validateData = (data) => {
    const result = validatePurchaseOrderData({
      data,
      id,
      isNewVersion,
      quoteVersion,
      styleItemList,
      sizeList,
      colorList,
      gsmList,
    });
    return showValidationResult(result);
  };

  const saveData = (nextProcess, options = {}) => {
    const submitApprovalFlag = options.submitApprovalOverride ?? submitApproval;
    const payload = getPurchaseOrderPayload({
      supplierId,
      dueDate,
      docDate,
      branchId,
      id,
      userId,
      remarks,
      poItems,
      deliveryType,
      deliveryToId,
      discountType,
      discountValue,
      taxPercent,
      finYearId,
      poType,
      taxTemplateId,
      termsAndCondtion,
      termsId,
      isNewVersion,
      quoteVersion,
      payTermId,
      pageId: currentPageId,
      totalNetAmount: totals?.net,
      submitApproval: submitApprovalFlag,
    });

    if (!validateData(payload)) {
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
        { ...payload, draftSave: true },
        "Added",
        nextProcess,
      );
    } else if (id && nextProcess == "draft") {
      handleSubmitCustom(
        updateData,
        { ...payload, draftSave: true },
        "Updated",
        nextProcess,
      );
    } else if (id) {
      handleSubmitCustom(updateData, payload, "Updated", nextProcess);
    } else {
      handleSubmitCustom(addData, payload, "Added", nextProcess);
    }

    if (submitApproval || submitApprovalFlag) {
      setSubmitApproval(false);
    }
  };

  const dateRef = useRef(null);

  useEffect(() => {
    if (dateRef.current && !id) {
      dateRef.current.focus();
    }
  }, []);

  const allSuppliers = supplierList ? supplierList.data : [];

  function filterSupplier() {
    let finalSupplier = [];
    if (poMaterial.toLowerCase().includes("yarn")) {
      finalSupplier = allSuppliers.filter((s) => s.yarn);
    } else if (poMaterial.toLowerCase().includes("fabric")) {
      finalSupplier = allSuppliers.filter((s) => s.fabric);
    } else {
      finalSupplier = allSuppliers.filter(
        (s) => s.PartyOnAccessoryItems?.length > 0,
      );
    }
    return finalSupplier;
  }
  let supplierListBasedOnSupply = filterSupplier();

  const { data: deliveryToBranch } = useGetBranchByIdQuery(deliveryToId, {
    skip: deliveryType === "ToParty",
  });
  const { data: deliveryToSupplier } = useGetPartyByIdQuery(deliveryToId, {
    skip: deliveryType === "ToSelf",
  });

  let deliveryTo =
    deliveryType === "ToParty"
      ? deliveryToSupplier?.data
      : deliveryToBranch?.data;

  const { isSupplierOutside, enrichedPoItems, totals } =
    getPurchaseOrderTaxSnapshot({
      poItems,
      supplierDetails,
      discountType,
      discountValue,
      id,
      isNewVersion,
      quoteVersion,
    });

  const taxGroupWise = groupBy(poItems, "taxPercent");

  const filtered = Object.fromEntries(
    Object.entries(taxGroupWise)
      .filter(([key]) => key && key !== "undefined")
      .map(([key, arr]) => [key, arr.filter((item) => item && item.yarnId)])
      .filter(([_, arr]) => arr.length > 0),
  );

  const quoteVersionOptions = [
    ...new Set(
      poItems
        .filter(
          (i) => i?.styleItemId && i?.quoteVersion && i?.quoteVersion !== "New",
        )
        .map((i) => Number(i.quoteVersion))
        .filter((n) => n > 0),
    ),
  ].sort((a, b) => a - b);

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      saveData("close");
    }
  };

  function getTotalQty() {
    const filteredRows = poItems?.filter((item) => {
      if (!item.styleItemId) return false;

      if (!id) return true;

      if (isNewVersion) return item.quoteVersion === "New";

      return parseInt(item.quoteVersion) === parseInt(quoteVersion ?? "");
    });

    const qty = filteredRows?.reduce((acc, curr) => {
      return acc + (parseFloat(curr?.qty) || 0);
    }, 0);

    return parseFloat(qty || 0);
  }

  useEffect(() => {
    supplierRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!id) {
      setTaxTemplateId(
        taxTypeList?.data?.filter((item) => item.name === "DEFAULT")[0]?.id,
      );
    }
  }, []);

  useEffect(() => {
    if (!id) {
      const selectedTerm = termsData?.data?.find(
        (item) => String(item.id) === String(termsId),
      );
      setTermsAndCondtion(selectedTerm?.description || "");
    }
  }, [id, termsData, termsId]);

  const getTitleChip = (text) => {
    if (id && readOnly) {
      return {
        label: `View ${text}`,
        className: "bg-gray-200 text-gray-700",
      };
    }
    if (id && !readOnly) {
      return {
        label: `Edit ${text}`,
        className: "bg-blue-100 text-blue-700",
      };
    }
    if (!id && !readOnly) {
      return {
        label: `Create ${text}`,
        className: "bg-green-100 text-green-700",
      };
    }
    return { label: "", className: "" };
  };

  const getModeChip = () => {
    if (id && readOnly) {
      return { label: "Read", className: "bg-red-600 text-white" };
    }
    if (id && !readOnly) {
      return { label: "Edit", className: "bg-yellow-600 text-white" };
    }
    if (!id && !readOnly) {
      return;
    }
    return null;
  };

  const chip = getModeChip();

  const actionButtonClass =
    "px-4 py-1 rounded-md flex items-center text-sm text-white";

  const leftActions = [
    {
      key: "save-close",
      label: (
        <>
          <HiOutlineRefresh className="w-4 h-4 mr-2" />
          Save & Close
        </>
      ),
      onClick: () => saveData("close"),
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveData("close");
          e.stopPropagation();
        }
      },
      disabled: readOnly,
      className: `bg-indigo-500 hover:bg-indigo-600 ${actionButtonClass}`,
    },
    {
      key: "save-new",
      label: (
        <>
          <FiSave className="w-4 h-4 mr-2" />
          Save & New
        </>
      ),
      onClick: () => saveData("new"),
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          saveData("new");
        }
      },
      disabled: readOnly,
      className: `bg-indigo-500 hover:bg-indigo-600 ${actionButtonClass}`,
    },
    {
      key: "submit-approval",
      label: (
        <>
          <FiSend className="w-4 h-4 mr-2" />
          Submit Approval
        </>
      ),
      onClick: () => {
        setSubmitApproval(true);
        saveData("new", { submitApprovalOverride: true });
      },
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          setSubmitApproval(true);
          e.preventDefault();
          e.stopPropagation();
          saveData("new", { submitApprovalOverride: true });
        }
      },
      disabled: readOnly,
      className: `bg-green-700 hover:bg-green-800 ${actionButtonClass}`,
    },
  ];

  const rightActions = [
    ...(!id || !readOnly
      ? []
      : [
          {
            key: "edit",
            label: (
              <>
                <FiEdit2 className="w-4 h-4 mr-2" />
                Edit
              </>
            ),
            onClick: () => setReadOnly(false),
            className: `bg-yellow-600 hover:bg-yellow-700 ${actionButtonClass}`,
          },
        ]),
    {
      key: "summary",
      label: "View Po Summary",
      onClick: () => {
        if (!taxTemplateId) {
          toast.info("Please Select Tax Template !", {
            position: "top-center",
          });
          return;
        }
        setSummary(true);
      },
      onKeyDown: (e) => {
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
      },
      className:
        "text-sm bg-blue-600 text-white font-semibold hover:bg-blue-800 transition p-1 rounded",
    },
    {
      key: "print",
      label: (
        <>
          <FiPrinter className="w-4 h-4 mr-2" />
          Print
        </>
      ),
      onClick: () => {
        setPrintModalOpen(true);
      },
      onKeyDown: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          setPrintModalOpen(true);
        }
      },
      className: `bg-slate-600 hover:bg-slate-700 ${actionButtonClass}`,
    },
  ];

  const compactFieldClass = "px-2 py-1 text-[10px]";
  const compactModalFieldClass = "w-full px-2 py-1 text-[10px]";
  const compactCardClass =
    "border border-slate-200 px-1.5 py-1 bg-white rounded-md shadow-sm";
  const compactSectionTitleClass =
    "font-medium text-[11px] text-slate-700 mb-0.5";
  const fieldWidthShort = "w-full min-w-0";
  const fieldWidthMedium = "w-full min-w-0";
  const fieldWidthDate = "w-full min-w-0";
  const narrowFieldWrap = "min-w-0";

  const headerContent = (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-1">
      <div className={`${compactCardClass} lg:col-span-4`}>
        <h2 className={compactSectionTitleClass}>Basic Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-1 items-end">
          <div className={narrowFieldWrap}>
            <ReusableInput
              label="Order No"
              readOnly
              value={docId}
              className={`${compactFieldClass} ${fieldWidthMedium}`}
            />
          </div>
          <div className={narrowFieldWrap}>
            <ReusableInput
              label="Order Date"
              value={docDate}
              type={"date"}
              required={true}
              readOnly={true}
              disabled
              className={`${compactFieldClass} ${fieldWidthDate}`}
            />
          </div>
          <div className={narrowFieldWrap}>
            <DropdownInput
              name="Po Type"
              options={poTypes}
              value={poType}
              setValue={(value) => {
                setPoType(value);
              }}
              required={true}
              readOnly={readOnly}
              disabled={orderId || id}
              ref={supplierRef}
              className={`${compactFieldClass} w-full max-w-none`}
            />
          </div>
          <div className={narrowFieldWrap}>
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
              readOnly={readOnly}
              className={`${compactFieldClass} w-full max-w-none`}
            />
          </div>
          <div className={narrowFieldWrap}>
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
              className={`${compactModalFieldClass} w-full max-w-none`}
              dropdownMinWidth={240}
              addNewLabel="+ Add New Pay Term"
              childComponent={PayTermMaster}
              addNewModalWidth="w-[40%] h-[66%]"
            />
          </div>
        </div>
      </div>

      <div className={`${compactCardClass} lg:col-span-4`}>
        <h2 className={compactSectionTitleClass}>Supplier Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1 items-end">
          <div className="min-w-0 md:col-span-2 xl:col-span-1">
            <DropdownWithModal
              name="Supplier"
              options={dropDownListObject(
                id
                  ? supplierList?.data?.filter((item) => item?.isSupplier)
                  : supplierList?.data?.filter(
                      (item) => item?.active && item?.isSupplier,
                    ),
                "name",
                "id",
              )}
              value={supplierId}
              setValue={setSupplierId}
              required={true}
              readOnly={readOnly}
              className={compactModalFieldClass}
              addNewLabel="+ Add New Supplier"
              childComponent={PartyMaster}
              addNewModalWidth="w-[90%] h-[95%]"
              disabled={id}
            />
          </div>

          <div className={narrowFieldWrap}>
            <TextInput
              name="Contact Person"
              placeholder="Contact name"
              value={findFromList(
                supplierId,
                supplierList?.data,
                "contactPersonName",
              )}
              disabled={true}
              className={`${compactFieldClass} ${fieldWidthMedium}`}
            />
          </div>

          <div className={narrowFieldWrap}>
            <TextInput
              name="Phone"
              placeholder="Contact name"
              value={findFromList(
                supplierId,
                supplierList?.data,
                "contactNumber",
              )}
              disabled={true}
              className={`${compactFieldClass} ${fieldWidthMedium}`}
            />
          </div>
        </div>
      </div>

      <div className={`${compactCardClass} lg:col-span-4`}>
        <h2 className={compactSectionTitleClass}>Delivery Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 items-end">
          <div className={narrowFieldWrap}>
            <DropdownInput
              name="Delivery Type"
              options={deliveryTypes}
              value={deliveryType}
              setValue={setDeliveryType}
              required={true}
              readOnly={readOnly}
              className={`${compactFieldClass} ${fieldWidthShort}`}
            />
          </div>
          <div className="col-span-2">
            {deliveryType == "ToSelf" ? (
              <DropdownInput
                name="Delivery To"
                options={
                  deliveryType === "ToSelf"
                    ? dropDownListObject(
                        branchList ? branchList.data : [],
                        "branchName",
                        "id",
                      )
                    : dropDownListObject(
                        supplierListBasedOnSupply,
                        "name",
                        "id",
                      )
                }
                value={deliveryToId}
                setValue={setDeliveryToId}
                required={true}
                readOnly={readOnly}
                className={compactFieldClass}
              />
            ) : (
              <DropdownWithModal
                name="Delivery To"
                options={dropDownListObject(
                  id
                    ? supplierList?.data
                    : supplierList?.data?.filter((item) => item?.active),
                  "name",
                  "id",
                )}
                value={deliveryToId}
                setValue={setDeliveryToId}
                required={true}
                readOnly={readOnly}
                className={compactModalFieldClass}
                addNewLabel="+ Add New Customer"
                childComponent={PartyMaster}
                addNewModalWidth="w-[90%] h-[95%]"
              />
            )}
          </div>
          <div className={narrowFieldWrap}>
            <DateInputNew
              name="Delivery Date"
              value={dueDate}
              setValue={setDueDate}
              type={"date"}
              required={true}
              readOnly={readOnly}
              className={`${compactFieldClass} ${fieldWidthDate}`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const footerContent = (
    <>
      <CommonFormFooter
        remarks={remarks}
        setRemarks={setRemarks}
        terms={termsAndCondtion}
        setTerms={setTermsAndCondtion}
        readOnly={readOnly}
        showTermSelect={true}
        termValue={termsId}
        onTermChange={(value) => setTermsId(value)}
        termOptions={
          (id
            ? termsData?.data
            : termsData?.data?.filter((item) => item?.active)
          )?.map((item) => ({
            value: item?.id,
            label: item?.name,
            templateText: item?.description || "",
          })) || []
        }
        totalsRows={[
          {
            key: "totalQty",
            label: "Total Qty",
            value: parseFloat(getTotalQty()).toFixed(3),
            summaryColumn: "left",
          },
          {
            key: "taxableAmount",
            label: "Taxable Amount",
            value: `Rs.${parseFloat(totals?.taxable || 0).toFixed(2)}`,
            summaryColumn: "right",
          },
          {
            key: "netAmount",
            label: "Net Amount",
            value: `Rs.${parseFloat(totals?.net || 0).toFixed(2)}`,
            summaryColumn: "right",
            emphasized: true,
          },
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
      <Modal
        isOpen={summary}
        onClose={() => setSummary(false)}
        widthClass={"p-10"}
      >
        <PoSummary
          remarks={remarks}
          setRemarks={setRemarks}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          poItems={poItems}
          taxTypeId={taxTemplateId}
          readOnly={readOnly}
          // isSupplierOutside={isSupplierOutside()}
          isNewVersion={isNewVersion}
          quoteVersion={quoteVersion}
          totals={totals}
          id={id}
          setSummary={setSummary}
        />
      </Modal>
      <Modal
        isOpen={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false);

          // Execute pending action after print modal closes
          if (pendingAction === "new") {
            setId("");
            setDocId("New");
            syncFormWithDb(undefined);
            setTimeout(() => {
              supplierRef.current?.focus();
            }, 100);
          }
          if (pendingAction === "close") {
            onClose();
          }
          setPendingAction(null);
        }}
        widthClass={"w-[90%] h-[90%]"}
      >
        <PDFViewer style={tw("w-full h-full")}>
          <PurchaseOrderPrintFormat
            singleData={singleData?.data}
            supplierDetails={supplierDetails?.data}
            deliveryTo={deliveryTo}
            deliveryType={deliveryType}
            branchData={branchData?.data}
            taxDetails={totals}
            taxGroupWise={taxGroupWise}
            colorList={colorList}
            uomList={uomList}
            styleItemList={styleItemList}
            discountType={discountType}
            sizeList={sizeList}
            discountValue={discountValue}
          />
        </PDFViewer>
      </Modal>
      <TransactionLayout
        title="Purchase Order"
        badge={<ModeChip id={id} readOnly={readOnly} />}
        closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        header={headerContent}
        gridItems={
          <PoItems
            id={id}
            poItems={poItems}
            enrichedPoItems={enrichedPoItems}
            setPoItems={setPoItems}
            readOnly={readOnly}
            uomList={uomList}
            hsnList={hsnList}
            styleItemList={styleItemList}
            taxTemplateId={taxTemplateId}
            isNewVersion={isNewVersion}
            quoteVersion={quoteVersion}
            itemGroupList={itemGroupList}
            sizeList={sizeList}
            colorList={colorList}
            termsRef={termsRef}
            gsmList={gsmList}
          />
        }
        footer={footerContent}
      />
    </>
  );
};
export default PurchaseOrderForm;

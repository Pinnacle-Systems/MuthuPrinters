import { FaFileAlt } from "react-icons/fa";

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
import {
  findFromList,
  getCommonParams,
  isGridDatasValid,
} from "../../../Utils/helper";
import { useGetPartyByIdQuery } from "../../../redux/services/PartyMasterService";
import { toast } from "react-toastify";
import { FiEdit2, FiPrinter, FiSave } from "react-icons/fi";
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
import { calculateTaxWithHSNBreakupAndInsertIntoPoItems } from "../../../Utils/taxSummary";
import { invalidatePurchaseModule } from "../../../redux/Dispatch/PurchaseInvalidateTags";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags";

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
}) => {
  const today = new Date();

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
  const supplierRef = useRef(null);
  const [dispatchInvalidate] = useInvalidateTags();

  const [requirementId, setRequirementId] = useState("");

  const { branchId, userId, finYearId } = getCommonParams();
  const params = { branchId, userId, finYearId, poMaterial: poMaterial };
  const { data: supplierDetails } = useGetPartyByIdQuery(supplierId, {
    skip: !supplierId,
  });

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
      // setReadOnly(true)

      setPoType(data?.poType ? data?.poType : "GENERAL");
      setDocDate(
        data?.docDate
          ? moment.utc(data.docDate).format("YYYY-MM-DD")
          : moment.utc(new Date()).format("YYYY-MM-DD"),
      );

      setPoItems(
        data?.poItems
          ? data?.poItems
          : Array.from({ length: 4 }, () => ({
              styleItemId: "",
              hsnId: "",
              uomId: "",
              price: "",
              qty: "",
              quoteVersion: quoteVersion,
              netAmount: 0,
              itemGroupId: "",
              sizeId: "",
              colorId: "",
            })),
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

  let data = {
    supplierId,
    dueDate,
    docDate,
    branchId,
    id,
    userId,
    remarks,
    poItems: poItems?.filter((po) => po.styleItemId),
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
  };

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
              if (nextProcess == "new") {
                setId("");
                setDocId("New");
                syncFormWithDb(undefined);

                // ✅ Focus the Bill Type dropdown after all state updates
                setTimeout(() => {
                  supplierRef.current?.focus();
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
      }
    } catch (error) {
      console.log("handle", error);
    }
  };

  const findDuplicates = (items) => {
    const versionFilteredItems = items.filter((row) => {
      if (!id) return true; // new entry — all rows
      if (isNewVersion) return row.quoteVersion === "New";
      return parseInt(row.quoteVersion) === parseInt(quoteVersion ?? "");
    });
    const seen = new Map(); // key -> first index
    const duplicates = [];

    versionFilteredItems.forEach((row, index) => {
      const key = [
        row.styleItemId || "",
        row.sizeId || "",
        row.colorId || "",
      ].join("-");

      if (seen.has(key)) {
        duplicates.push({
          firstIndex: seen.get(key),
          duplicateIndex: index,
          styleItemId: row.styleItemId,
          sizeId: row.sizeId,
          colorId: row.colorId,
        });
      } else {
        seen.set(key, index);
      }
    });

    return duplicates; // empty array = no duplicates
  };

  const validateData = (data) => {
    const filledItems = (data?.poItems || []).filter(
      (item) => item.styleItemId,
    );
    const duplicates = findDuplicates(filledItems);
    const dup = duplicates[0];

    const checks = [
      { condition: !data.dueDate, title: "Delivery Date is required!" },
      { condition: !data.poType, title: "PO Type is required!" },
      { condition: !data.taxTemplateId, title: "Tax Template is required!" },
      { condition: !data.supplierId, title: "Supplier is required!" },
      { condition: !data.deliveryType, title: "Delivery Type is required!" },
      { condition: !data.deliveryToId, title: "Delivery To is required!" },
      {
        condition: filledItems.length === 0,
        title: "Please add at least one item!",
      },
      {
        condition: !isGridDatasValid(data?.poItems, false, [
          "styleItemId",
          "uomId",
          "qty",
          "price",
        ]),
        title: "Please fill all required item fields!",
      },
      {
        condition: duplicates.length > 0,
        title: "Duplicate Item Found!",
        html: dup
          ? `Item - ${findFromList(dup?.styleItemId, styleItemList?.data, "name")}, Size - ${findFromList(dup?.sizeId, sizeList?.data, "name")}, Color - ${findFromList(dup?.colorId, colorList?.data, "name")}`
          : "",
      },
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

    return true;
  };

  const saveData = (nextProcess) => {
    if (!validateData(data)) {
      return;
    }
    if (!window.confirm("Are you sure save the details ...?")) {
      return;
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
      handleSubmitCustom(updateData, data, "Updated", nextProcess);
    } else {
      handleSubmitCustom(addData, data, "Added", nextProcess);
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

  const taxGroupWise = groupBy(poItems, "taxPercent");

  const filtered = Object.fromEntries(
    Object.entries(taxGroupWise)
      .filter(([key]) => key && key !== "undefined")
      .map(([key, arr]) => [key, arr.filter((item) => item && item.yarnId)])
      .filter(([_, arr]) => arr.length > 0),
  );

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

  function isSupplierOutside() {
    if (supplierDetails) {
      return supplierDetails?.data?.City?.state?.name !== "TAMILNADU";
    }
    return false;
  }

  const quoteVersionOptions = [
    ...new Set(
      poItems
        .filter(
          (i) =>
            i?.styleItemId && // ⬅️ only rows with actual data
            i?.quoteVersion &&
            i?.quoteVersion !== "New",
        )
        .map((i) => Number(i.quoteVersion))
        .filter((n) => n > 0),
    ),
  ].sort((a, b) => a - b);

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      saveData();
    }
  };

  const { items: enrichedPoItems } =
    calculateTaxWithHSNBreakupAndInsertIntoPoItems(
      poItems,
      isSupplierOutside(),
      discountType,
      discountValue,
    );

  const { items: _, ...totals } =
    calculateTaxWithHSNBreakupAndInsertIntoPoItems(
      poItems?.filter((i) => {
        if (!i.styleItemId) return false;
        if (!id) return true;
        if (isNewVersion) return i.quoteVersion === "New";
        return parseInt(i.quoteVersion) === parseInt(quoteVersion ?? "");
      }),
      isSupplierOutside(),
      discountType,
      discountValue,
    );

  function getTotalQty() {
    const filtered = poItems?.filter((item) => {
      if (!item.styleItemId) return false; // skip empty rows

      if (!id) return true; // new entry — all rows

      if (isNewVersion) return item.quoteVersion === "New";

      return parseInt(item.quoteVersion) === parseInt(quoteVersion ?? "");
    });

    const qty = filtered?.reduce((acc, curr) => {
      return acc + (parseFloat(curr?.qty) || 0); // ✅ parseFloat not parseInt
    }, 0);

    return parseFloat(qty || 0);
  }

  useEffect(() => {
    supplierRef.current?.focus();
  }, []);

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
        />
      </Modal>
      <Modal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
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
      <div className="w-full  mx-auto rounded-md shadow-lg px-2 py-1 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-800">Purchase Order</h1>
          <button
            onClick={() => {
              onClose();
            }}
            className="text-indigo-600 hover:text-indigo-700"
            title="Open Report"
          >
            <FaFileAlt className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="space-y-2 py-2" onKeyDown={handleKeyDown}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">Basic Details</h2>
            <div className="grid grid-cols-2 gap-1">
              <ReusableInput label="Purchase Order No" readOnly value={docId} />
              <ReusableInput
                label="Purchase Order Date"
                value={docDate}
                type={"date"}
                required={true}
                readOnly={true}
                disabled
              />
              <DropdownInput
                name="Pay Term"
                options={dropDownListObject(
                  payTermList ? payTermList?.data : [],
                  "name",
                  "id",
                )}
                value={payTermId}
                setValue={(val) => {
                  setPayTermId(val);
                }}
                required={false}
                readOnly={readOnly}
                // autoFocus={true}
                ref={supplierRef}
              />
              <DateInputNew
                name="Delivery Date"
                value={dueDate}
                setValue={setDueDate}
                type={"date"}
                required={true}
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">Po Details</h2>
            <div className="grid grid-cols-2 gap-1 ">
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
              />

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
              />
              {!readOnly && id && (
                <div className="col-span-1 mt-3">
                  <CheckBox
                    name="New Version"
                    value={isNewVersion}
                    setValue={setIsNewVersion}
                    readOnly={readOnly}
                    className="w-full"
                    disabled={childRecordCount > 0}
                  />
                </div>
              )}
              {Boolean(id) && quoteVersionOptions.length > 0 && (
                <DropdownInput
                  readOnly={readOnly}
                  name="Current Version"
                  value={quoteVersion}
                  setValue={(value) => setQuoteVersion(value)}
                  options={quoteVersionOptions.map((i) => ({
                    show: i,
                    value: i,
                  }))}
                  className="w-full"
                />
              )}
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">
              Supplier Details
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <ReusableSearchableInput
                  label="Supplier"
                  component="PartyMaster"
                  placeholder="Search Supplier ..."
                  optionList={supplierList?.data?.filter(
                    (item) => item.isSupplier,
                  )}
                  setSearchTerm={(value) => {
                    setSupplierId(value);
                  }}
                  searchTerm={supplierId}
                  show={"isSupplier"}
                  required={true}
                  disabled={id}
                  isSupplier={true}
                />
              </div>

              <TextInput
                name="Contact Person"
                placeholder="Contact name"
                value={findFromList(
                  supplierId,
                  supplierList?.data,
                  "contactPersonName",
                )}
                disabled={true}
              />

              <TextInput
                name="Phone"
                placeholder="Contact name"
                value={findFromList(
                  supplierId,
                  supplierList?.data,
                  "contactNumber",
                )}
                disabled={true}
              />
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">
              Delivery Details
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <DropdownInput
                name="Delivery Type"
                options={deliveryTypes}
                // option={delivery}
                value={deliveryType}
                setValue={setDeliveryType}
                required={true}
                readOnly={readOnly}
              />
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
                  />
                ) : (
                  <DropdownInput
                    name="Delivery To"
                    options={dropDownListObject(
                      supplierList?.data,
                      "name",
                      "id",
                    )}
                    value={deliveryToId}
                    setValue={setDeliveryToId}
                    required={true}
                    readOnly={readOnly}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <fieldset className="">
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
          />
        </fieldset>

        <div className="grid grid-cols-4 gap-3">
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm ">
            <div className="flex flex-col gap-2">
              <h2 className="font-bold text-slate-700 mb-2 text-base">
                Terms & Conditions
              </h2>

              <select
                value={termsId}
                onChange={(e) => {
                  const selectedId = e.target.value;

                  setTermsId(selectedId);

                  const selectedTerm = termsData?.data?.find(
                    (item) => String(item.id) === String(selectedId),
                  );

                  setTermsAndCondtion(selectedTerm?.description || "");
                }}
                readOnly={readOnly}
                className="text-left h-15  w-full rounded py-1 border-2 border-gray-200 text-[13px]"
              >
                <option></option>
                {(id
                  ? termsData?.data
                  : termsData?.data?.filter((item) => item?.active)
                )?.map((blend) => (
                  <option value={blend.id} key={blend.id}>
                    {blend?.name.substring(0, 50)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm flex items-center">
            <textarea
              disabled={readOnly}
              className="w-full h-14 overflow-auto px-2.5 py-2 text-xs border border-slate-300 rounded-md  focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
              value={termsAndCondtion}
              onChange={(e) => setTermsAndCondtion(e.target.value)}
              placeholder="Type Terms & Conditions..."
            />
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm ">
            <h2 className="font-medium text-slate-700 mb-2 text-base">
              Remarks
            </h2>
            <textarea
              readOnly={readOnly}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
              }}
              className="w-full h-10 overflow-auto px-2.5 py-2 text-xs border border-slate-300 rounded-md  focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Additional notes..."
            />
          </div>
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm ">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-600">Total Qty</span>
              <span className="font-medium">
                {parseFloat(getTotalQty()).toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-600">Taxable Amount</span>
              <span className="font-medium">
                Rs.{parseFloat(totals?.taxable || 0).toFixed(2)}{" "}
              </span>
            </div>
            {/* <div className="flex justify-between py-1 text-sm">
                  <span className="text-slate-600">Tax Amount</span>
                  <span className="font-medium">Rs.{taxDetails?.grossAmount}</span>
                </div> */}
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-600">Net Amount</span>
              <span className="font-medium">
                Rs.{parseFloat(totals?.net || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
            <h2 className="font-bold text-slate-800 mb-2 text-base">
              Po Summary
            </h2>

            <button
              className="text-sm bg-blue-600 text-white font-semibold hover:bg-blue-800 transition p-1 ml-5 rounded"
              onClick={() => {
                if (!taxTemplateId) {
                  toast.info("Please Select Tax Template !", {
                    position: "top-center",
                  });
                  return;
                }
                setSummary(true);
              }}
            >
              View Po Summary
            </button>
          </div> */}
        </div>

        <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
          {/* Left Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => saveData("new")}
              className="bg-indigo-500 text-white px-4 py-1 rounded-md hover:bg-indigo-600 flex items-center text-sm"
            >
              <FiSave className="w-4 h-4 mr-2" />
              Save & New
            </button>
            <button
              onClick={() => saveData("close")}
              className="bg-indigo-500 text-white px-4 py-1 rounded-md hover:bg-indigo-600 flex items-center text-sm"
            >
              <HiOutlineRefresh className="w-4 h-4 mr-2" />
              Save & Close
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {!id ||
              (readOnly && (
                <button
                  className="bg-yellow-600 text-white px-4 py-1 rounded-md hover:bg-yellow-700 flex items-center text-sm"
                  onClick={() => setReadOnly(false)}
                >
                  <FiEdit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
              ))}
            <button
              className="text-sm bg-blue-600 text-white font-semibold hover:bg-blue-800 transition p-1  rounded"
              onClick={() => {
                if (!taxTemplateId) {
                  toast.info("Please Select Tax Template !", {
                    position: "top-center",
                  });
                  return;
                }
                setSummary(true);
              }}
            >
              View Po Summary
            </button>
            <button
              className="bg-slate-600 text-white px-4 py-1 rounded-md hover:bg-slate-700 flex items-center text-sm"
              onClick={() => {
                // handlePrint()
                setPrintModalOpen(true);
              }}
            >
              <FiPrinter className="w-4 h-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default PurchaseOrderForm;

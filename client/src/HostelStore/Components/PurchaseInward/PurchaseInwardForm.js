import { IoArrowBackCircleSharp } from "react-icons/io5";

import {
  DateInputNew,
  DropdownInput,
  ReusableInput,
  ReusableSearchableInput,
  TextInput,
} from "../../../Inputs";
import { inwardTypes, receiptTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import {
  findFromList,
  getCommonParams,
  isGridDatasValid,
  ModeChip,
} from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiEdit2, FiSave } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import InwardItems from "./InwardItems";
import {
  useAddPurchaseInwardEntryMutation,
  useGetPurchaseInwardEntryByIdQuery,
  useUpdatePurchaseInwardEntryMutation,
} from "../../../redux/uniformService/PurchaseInwardEntry";
import { useGetLocationMasterQuery } from "../../../redux/services/LocationMasterService";
import { useGetPoItemsQuery } from "../../../redux/uniformService/PoServices";
import { invalidatePurchaseModule } from "../../../redux/Dispatch/PurchaseInvalidateTags";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { PartyMaster, TaxTemplate } from "../index.js";
import { LocationMaster } from "../../../Basic/components/index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import { calculateTaxWithHSNBreakupAndInsertIntoInwardItems } from "../PurchaseBillEntry/taxSummary.js";
import PoSummary from "../PurchaseOrder/PoSummary.js";
import Modal from "../../../UiComponents/Modal/index.js";

const PurchaseInwardForm = ({
  onClose,
  id,
  setId,
  readOnly,
  setReadOnly,
  supplierList,
  uomList,
  styleItemList,
  branchList,
  hsnList,
  sizeList,
  colorList,
  fromPoId,
  fromPoSupplierId,
  fromPoType,
  setFromPoId,
  setFromPoSupplierId,
  setFromPoType,
  taxTypeList,
}) => {
  const today = new Date();

  const [docDate, setDocDate] = useState(
    moment.utc(today).format("YYYY-MM-DD"),
  );
  const [supplierId, setSupplierId] = useState("");
  const [inwardItems, setInwardItems] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [inwardType, setInwardType] = useState("General Purchase Inward");
  const [storeId, setStoreId] = useState("");
  const [docId, setDocId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [dcNo, setDcNo] = useState("");
  const [dcDate, setDcDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [invNo, setInvNo] = useState("");
  const [tempItems, setTempItems] = useState([]);
  const [searchDocId, setSearchDocId] = useState("");
  const [searchDocDate, setSearchDocDate] = useState("");
  const [dataPerPage, setDataPerPage] = useState("10");
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [receiptType, setReceiptType] = useState("");
  const [taxTemplateId, setTaxTemplateId] = useState("");
  const [discountType, setDiscountType] = useState("Percentage");
  const [discountValue, setDiscountValue] = useState();
  const [summary, setSummary] = useState(false);
  const [netBillValue, setNetBillValue] = useState("");

  const supplierRef = useRef(null);
  const [dispatchInvalidate] = useInvalidateTags();
  const vehicleRef = useRef(null);

  const { userId, finYearId, branchId } = getCommonParams();
  const { data: locationData } = useGetLocationMasterQuery({
    params: { branchId },
  });

  const storeOptions = locationData
    ? locationData.data.filter(
        (item) => parseInt(item.locationId) === parseInt(locationId),
      )
    : [];

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetPurchaseInwardEntryByIdQuery(id, { skip: !id });

  const [addData] = useAddPurchaseInwardEntryMutation();
  const [updateData] = useUpdatePurchaseInwardEntryMutation();

  const searchFields = {
    searchDocId,
    searchDocDate,
  };

  useEffect(() => {
    if (fromPoSupplierId && fromPoType && !id) {
      setSupplierId(fromPoSupplierId);
      setInwardType(fromPoType);
    }
  }, [fromPoSupplierId, fromPoType]);

  useEffect(() => {
    setCurrentPageNumber(1);
  }, [searchDocId, searchDocDate]);

  const {
    data: poItemsData,
    isLoading: isPoItemsLoading,
    isFetching: isPoItemsFetching,
  } = useGetPoItemsQuery({
    params: {
      branchId,
      supplierId,
      ...searchFields,
      pagination: true,
      dataPerPage,
      pageNumber: currentPageNumber,
      poType: inwardType,
    },
  });

  const syncFormWithDbItems = useCallback(
    (data) => {
      setTempItems(data);
    },
    [inwardType, supplierId],
  );

  useEffect(() => {
    if (poItemsData?.data) {
      syncFormWithDbItems(poItemsData?.data);
    }
  }, [isPoItemsLoading, isPoItemsFetching, syncFormWithDbItems, poItemsData]);

  const syncFormWithDb = useCallback(
    (data) => {
      setDocId(data?.docId ? data?.docId : "New");
      setDocDate(
        data?.docDate
          ? moment.utc(data.docDate).format("YYYY-MM-DD")
          : moment.utc(new Date()).format("YYYY-MM-DD"),
      );
      setInwardType(
        data?.inwardType || fromPoType || "General Purchase Inward",
      );
      setLocationId(data?.Store ? data.Store.locationId : branchId);
      setStoreId(data?.storeId ? data.storeId : "");
      setInwardItems(data?.inwardItems ? data?.inwardItems : []);
      setSupplierId(data?.supplierId || fromPoSupplierId || "");
      setDcDate(
        data?.dcDate ? moment.utc(data.dcDate).format("YYYY-MM-DD") : "",
      );
      setRemarks(data?.remarks || "");
      setDcNo(data?.dcNo ? data.dcNo : "");
      setVehicleNo(data?.vehicleNo ? data.vehicleNo : "");
      setInvNo(data?.invNo ? data?.invNo : "");
      setReceiptType(data?.receiptType || "");
      setTaxTemplateId(data?.taxTemplateId || "");
      setDiscountType(data?.discountType || "");
      setDiscountValue(data?.discountValue || "");
      setNetBillValue(data?.netBillValue || "");
    },
    [id, fromPoSupplierId, fromPoType],
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
    inwardType,
    locationId,
    storeId,
    supplierId,
    dcNo,
    dcDate,
    remarks,
    vehicleNo,
    inwardItems: inwardItems?.filter((po) => po.styleItemId),
    finYearId,
    invNo,
    receiptType,
    taxTemplateId,
    discountType,
    discountValue,
    netBillValue,
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
                setId(0);
                setDocId("New");
                syncFormWithDb(undefined);
                setFromPoId("");
                setFromPoSupplierId("");
                setFromPoType("");
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
    const seen = new Map(); // key -> first index
    const duplicates = [];

    items.forEach((row, index) => {
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
    const items = data?.inwardItems || [];
    const filledItems = items.filter((item) => item.styleItemId);

    const checks = [
      { condition: !data.inwardType, title: "Inward Type is required!" },
      { condition: !data.locationId, title: "Location is required!" },
      { condition: !data.storeId, title: "Location is required!" },
      { condition: !data.invNo, title: "Invoice No is required!" },
      { condition: !data.supplierId, title: "Supplier is required!" },
      { condition: !data.dcNo, title: "DC No is required!" },
      { condition: !data.dcDate, title: "DC Date is required!" },
      { condition: !data.netBillValue, title: "Bill Value is required!" },
      {
        condition: filledItems.length === 0,
        title: "Please add at least one item!",
      },
      {
        condition: !isGridDatasValid(data?.inwardItems, false, [
          "styleItemId",
          "uomId",
          "inwardQty",
        ]),
        title: "Please fill all required item fields!",
      },
      {
        condition: findDuplicates(filledItems).length > 0,
        title: "Duplicate Item Found!",
        html: (() => {
          const dup = findDuplicates(filledItems)[0];
          return `Item - ${findFromList(dup?.styleItemId, styleItemList?.data, "name")}, Size - ${findFromList(dup?.sizeId, sizeList?.data, "name")}, Color - ${findFromList(dup?.colorId, colorList?.data, "name")}`;
        })(),
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

  const enrichedItems = useMemo(() => {
    if (!inwardItems?.length) return inwardItems;
    const { items, ...totals } =
      calculateTaxWithHSNBreakupAndInsertIntoInwardItems(
        structuredClone(inwardItems), // clone to avoid mutating state
        false,
        discountType,
        discountValue,
      );
    return { items, totals };
  }, [inwardItems, discountType, discountValue]);

  const enrichedItemsList = enrichedItems?.items || [];
  const totals = enrichedItems?.totals || {};

  const saveData = (nextProcess) => {
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
      handleSubmitCustom(updateData, data, "Updated", nextProcess);
    } else {
      handleSubmitCustom(addData, data, "Added", nextProcess);
    }
  };

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      saveData("close");
    }
  };

  useEffect(() => {
    if (!id && !fromPoId) {
      // ⬅️ guard
      setInwardItems([]);
    }
  }, [supplierId]);

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
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          poItems={inwardItems}
          taxTypeId={taxTemplateId}
          readOnly={readOnly}
          totals={totals}
          setSummary={setSummary}
        />
      </Modal>
      <div className="w-full  mx-auto rounded-md shadow-lg px-2 py-1 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold flex items-center gap-2">
            Purchase Inward
            <ModeChip id={id} readOnly={readOnly} />
          </h1>
          <button
            onClick={() => {
              onClose();
            }}
            className="text-indigo-600 hover:text-indigo-700"
            title="Back to Report"
          >
            <IoArrowBackCircleSharp className="w-7 h-7" />
          </button>
        </div>
      </div>
      <div className="space-y-2 py-2" onKeyDown={handleKeyDown}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">Basic Details</h2>
            <div className="grid grid-cols-2 gap-1">
              <ReusableInput
                label="Purchase Inward No"
                readOnly
                value={docId}
              />
              <ReusableInput
                label="Purchase Inward Date"
                value={docDate}
                type={"date"}
                required={true}
                readOnly={true}
                disabled
              />
              <DropdownInput
                name="Branch"
                options={
                  branchList
                    ? dropDownListObject(
                        id
                          ? branchList?.data
                          : branchList?.data?.filter((item) => item.active),
                        "branchName",
                        "id",
                      )
                    : []
                }
                value={locationId}
                setValue={(value) => {
                  setLocationId(value);
                  setStoreId("");
                }}
                required={true}
                readOnly={id}
                // autoFocus={true}
                ref={supplierRef}
              />
              <DropdownWithModal
                name="Location"
                options={dropDownListObject(
                  id
                    ? storeOptions
                    : storeOptions?.filter((item) => item?.active),
                  "storeName",
                  "id",
                )}
                value={storeId}
                setValue={setStoreId}
                required={true}
                readOnly={readOnly}
                className={`w-[150px]`}
                // disabled={childRecord.current > 0}
                addNewLabel="+ Add New Location"
                childComponent={LocationMaster}
                addNewModalWidth="w-[40%] h-[48%]"
                disabled={id}
              />
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">Inward Details</h2>
            <div className="grid grid-cols-2 gap-1 ">
              <DropdownInput
                name="Inward Type"
                options={inwardTypes}
                value={inwardType}
                setValue={(value) => {
                  setInwardType(value);
                }}
                required={true}
                readOnly={readOnly}
                disabled={id || fromPoType}
                beforeChange={() => {
                  setInwardItems([]);
                }}
              />
              <DropdownInput
                name="Receipt Basis"
                options={receiptTypes}
                value={receiptType}
                setValue={(value) => {
                  setReceiptType(value);
                }}
                required={true}
                readOnly={readOnly}
                disabled={id || fromPoType}
                beforeChange={() => {
                  setInwardItems([]);
                }}
              />
              <TextInput
                name={"Inv No"}
                value={invNo}
                setValue={setInvNo}
                readOnly={id}
                required={receiptType === "Against Invoice"}
                disabled={receiptType !== "Against Invoice"}
              />
              <TextInput
                name={"Bill Value"}
                value={netBillValue}
                setValue={setNetBillValue}
                readOnly={readOnly}
                required={receiptType === "Against Invoice"}
                type={"number"}
                onFocus={(e) => {
                  e.target.select();
                }}
                disabled={receiptType !== "Against Invoice"}
              />
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">
              Supplier Details
            </h2>
            <div className="grid grid-cols-2 gap-1">
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
                className={`w-[150px]`}
                // disabled={childRecord.current > 0}
                addNewLabel="+ Add New Supplier"
                childComponent={PartyMaster}
                addNewModalWidth="w-[90%] h-[95%]"
                disabled={id || !!fromPoSupplierId}
              />
              <DropdownWithModal
                name="Tax Type"
                options={dropDownListObject(
                  id
                    ? taxTypeList?.data
                    : taxTypeList?.data?.filter((item) => item?.active),
                  "name",
                  "id",
                )}
                value={taxTemplateId}
                setValue={setTaxTemplateId}
                required={true}
                readOnly={readOnly}
                className={`w-[150px]`}
                // disabled={childRecord.current > 0}
                addNewLabel="+ Add New Tax Template"
                childComponent={TaxTemplate}
                addNewModalWidth="w-[82%] h-[85%]"
              />
              <TextInput
                name={"Dc No."}
                value={dcNo}
                setValue={setDcNo}
                readOnly={readOnly}
                required
              />
              <div className="w-44">
                <DateInputNew
                  name="Dc Date"
                  value={dcDate}
                  setValue={setDcDate}
                  required={true}
                  readOnly={readOnly}
                  type={"date"}
                />
              </div>
            </div>
          </div>
        </div>
        <fieldset className="">
          <InwardItems
            id={id}
            inwardItems={enrichedItemsList}
            setInwardItems={setInwardItems}
            readOnly={readOnly}
            uomList={uomList}
            hsnList={hsnList}
            styleItemList={styleItemList}
            inwardType={inwardType}
            supplierId={supplierId}
            branchId={branchId}
            sizeList={sizeList}
            colorList={colorList}
            setTempItems={setTempItems}
            tempItems={tempItems}
            searchDocId={searchDocId}
            setSearchDocId={setSearchDocId}
            setSearchDocDate={setSearchDocDate}
            searchDocDate={searchDocDate}
            vehicleRef={vehicleRef}
            fromPoId={fromPoId}
            receiptType={receiptType}
            taxTemplateId={taxTemplateId}
          />
        </fieldset>

        <div className="grid grid-cols-3 gap-3">
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
            <h2 className="font-medium text-slate-700 mb-2 text-base">
              Vehicle Details
            </h2>
            <textarea
              ref={vehicleRef}
              readOnly={readOnly}
              value={vehicleNo}
              onChange={(e) => {
                setVehicleNo(e.target.value);
              }}
              className="w-full overflow-auto h-10 px-2.5 py-2 text-xs border border-slate-300 rounded-md  focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Vehicle Details..."
              disabled={readOnly}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === "Enter") {
                  e.preventDefault();

                  const textarea = e.target;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;

                  const newValue =
                    vehicleNo.substring(0, start) +
                    "\n" +
                    vehicleNo.substring(end);

                  setVehicleNo(newValue);

                  // ✅ Restore focus + cursor properly
                  requestAnimationFrame(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + 1, start + 1);
                  });
                }
              }}
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
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === "Enter") {
                  e.preventDefault();

                  const textarea = e.target;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;

                  const newValue =
                    remarks.substring(0, start) + "\n" + remarks.substring(end);

                  setRemarks(newValue);

                  // ✅ Restore focus + cursor properly
                  requestAnimationFrame(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + 1, start + 1);
                  });
                }
              }}
            />
          </div>
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-2 text-base">
              Qty Summary
            </h2>

            {inwardType !== "Direct Inward" && (
              <div className="space-y-1.5">
                <div className="flex justify-between  text-sm">
                  <span className="text-slate-600">Total Order Qty</span>
                  <span className="font-medium">
                    {inwardItems
                      .reduce((sum, row) => sum + (Number(row.poQty) || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex justify-between  text-sm">
                <span className="text-slate-600">Total Inward Qty</span>
                <span className="font-medium">
                  {inwardItems
                    .reduce((sum, row) => sum + (Number(row.inwardQty) || 0), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
          {/* Left Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => saveData("close")}
              disabled={readOnly}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveData("close");
                  e.stopPropagation();
                }
              }}
              className="bg-indigo-500 text-white px-4 py-1 rounded-md hover:bg-indigo-600 flex items-center text-sm"
            >
              <HiOutlineRefresh className="w-4 h-4 mr-2" />
              Save & Close
            </button>
            <button
              onClick={() => saveData("new")}
              disabled={readOnly}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  saveData("new");
                }
              }}
              className="bg-indigo-500 text-white px-4 py-1 rounded-md hover:bg-indigo-600 flex items-center text-sm"
            >
              <FiSave className="w-4 h-4 mr-2" />
              Save & New
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
            {receiptType === "Against Invoice" && (
              <button
                className="text-sm bg-blue-600 text-white font-semibold hover:bg-blue-800 transition p-1  rounded"
                onClick={() => {
                  console.log(taxTemplateId);
                  if (!taxTemplateId) {
                    toast.info("Please Select Tax Template !", {
                      position: "top-center",
                    });
                    return;
                  }
                  setSummary(true);
                }}
              >
                View Bill Summary
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default PurchaseInwardForm;

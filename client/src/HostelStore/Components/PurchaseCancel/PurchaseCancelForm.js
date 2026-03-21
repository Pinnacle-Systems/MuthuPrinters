import { FaEye, FaFileAlt } from "react-icons/fa";

import {
  DateInput,
  DateInputNew,
  DropdownInput,
  ReusableInput,
  ReusableSearchableInput,
  TextInput,
} from "../../../Inputs";
import { poTypes, returnTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import {
  findFromList,
  getCommonParams,
  isGridDatasValid,
} from "../../../Utils/helper";
import { useGetPartyByIdQuery } from "../../../redux/services/PartyMasterService";
import { toast } from "react-toastify";
import { FiEdit2, FiSave } from "react-icons/fi";
import { HiOutlineRefresh, HiX } from "react-icons/hi";
import Swal from "sweetalert2";
import { PDFViewer } from "@react-pdf/renderer";
import tw from "../../../Utils/tailwind-react-pdf";
import Modal from "../../../UiComponents/Modal";
import { Loader } from "../../../Basic/components";
import { dropDownListObject } from "../../../Utils/contructObject";
import { useGetBranchByIdQuery } from "../../../redux/services/BranchMasterService";
import CancelItems from "./CancelItems";
import { useGetLocationMasterQuery } from "../../../redux/services/LocationMasterService";
import purchaseCancelApi, {
  useAddPurchaseCancelMutation,
  useGetPurchaseCancelByIdQuery,
  useUpdatePurchaseCancelMutation,
} from "../../../redux/uniformService/PurchaseCancelService";
import { useDispatch } from "react-redux";
import purchaseInwardEntryApi from "../../../redux/uniformService/PurchaseInwardEntry";
import purchaseReturnApi from "../../../redux/services/PurchaseReturnService";
import { useGetPoItemsQuery } from "../../../redux/uniformService/PoServices";

const PurchaseCancelForm = ({
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
  onNew,
  sizeList,
  colorList,
}) => {
  const today = new Date();

  const [docDate, setDocDate] = useState(
    moment.utc(today).format("YYYY-MM-DD"),
  );
  const [supplierId, setSupplierId] = useState("");
  const [cancelItems, setCancelItems] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [poType, setPoType] = useState("");
  const [storeId, setStoreId] = useState("");
  const [docId, setDocId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [tempItems, setTempItems] = useState([]);
  const [searchDocId, setSearchDocId] = useState("");
  const [searchDocDate, setSearchDocDate] = useState("");
  const [searchInwardType, setSearchInwardType] = useState(poType);

  const [dataPerPage, setDataPerPage] = useState("10");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  const [termsAndCondition, setTermsAndCondition] = useState("");

  const { userId, finYearId, branchId } = getCommonParams();
  const { data: supplierDetails } = useGetPartyByIdQuery(supplierId, {
    skip: !supplierId,
  });
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
  } = useGetPurchaseCancelByIdQuery(id, { skip: !id });

  const [addData] = useAddPurchaseCancelMutation();
  const [updateData] = useUpdatePurchaseCancelMutation();
  const dispatch = useDispatch();

  const { data: branchdata } = useGetBranchByIdQuery(branchId, {
    skip: !branchId,
  });

  const syncFormWithDb = useCallback(
    (data) => {
      setDocId(data?.docId ? data?.docId : "New");
      setDocDate(
        data?.docDate
          ? moment.utc(data.docDate).format("YYYY-MM-DD")
          : moment.utc(new Date()).format("YYYY-MM-DD"),
      );
      setPoType(data?.poType ? data?.poType : "");
      setLocationId(data?.Store ? data.Store.locationId : branchId);
      setStoreId(data?.storeId ? data.storeId : "");
      setCancelItems(
        data?.purchaseCancelItems ? data?.purchaseCancelItems : [],
      );
      setSupplierId(data?.supplierId || "");

      setRemarks(data?.remarks || "");
      setTermsAndCondition(
        data?.termsAndCondition ? data.termsAndCondition : "",
      );
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

  const searchFields = {
    searchDocId,
    searchDocDate,
    searchInwardType,
  };

  useEffect(() => {
    setCurrentPageNumber(1);
  }, [searchDocId, searchDocDate, searchInwardType]);

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
    },
  });

  const syncFormWithDbItems = useCallback(
    (data) => {
      setTempItems(data);
    },
    [searchInwardType,supplierId],
  );

  useEffect(() => {
    if (poItemsData?.data) {
      syncFormWithDbItems(poItemsData?.data);
    }
  }, [
    isPoItemsLoading,
    isPoItemsFetching,
    syncFormWithDbItems,
    poItemsData,
  ]);

  let data = {
    id,
    docDate,
    branchId,
    userId,
    locationId,
    storeId,
    supplierId,
    remarks,
    termsAndCondition,
    cancelItems: cancelItems?.filter((po) => po.styleItemId),
    finYearId,
    poType,
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
        });

        if (returnData.statusCode === 0) {
          if (nextProcess == "new") {
            setId(0);
            setDocId("New");
            syncFormWithDb(undefined);
            // onNew();
          }
          if (nextProcess == "close") {
            onClose();
          }
        } else {
          toast.error(returnData?.message);
        }
      }
    } catch (error) {
      console.log("handle");
    }
  };

  const findDuplicates = (items) => {
    const seen = new Map(); // key -> first index
    const duplicates = [];

    items.forEach((row, index) => {
      const key = [row.styleItemId || "", row.hsnId || ""].join("-");

      if (seen.has(key)) {
        duplicates.push({
          firstIndex: seen.get(key),
          duplicateIndex: index,
          styleItemId: row.styleItemId,
          hsnId: row.hsnId,
        });
      } else {
        seen.set(key, index);
      }
    });

    return duplicates; // empty array = no duplicates
  };

  const validateData = (data) => {
    const items = data?.cancelItems || [];

    // remove blank rows
    const filledItems = items.filter((item) => item.styleItemId);
    const duplicates = findDuplicates(filledItems);
    // duplicate check
    if (duplicates.length > 0) {
      const dup = duplicates[0]; // show first duplicate
      Swal.fire({
        icon: "warning",
        title: "Duplicate Item Found",
        html: `
    Item - ${findFromList(dup?.styleItemId, styleItemList?.data, "name")},
    HSN - ${findFromList(dup?.hsnId, hsnList?.data, "name")},
  `,
        confirmButtonText: "OK",
      });
      return false;
    }
    let mandatoryFields = ["styleItemId", "hsnId", "uomId", "cancelQty"];
    console.log(data, "dataaaaa");
    if (
      !(
        data.poType &&
        data.locationId &&
        data.storeId &&
        data.supplierId &&
        isGridDatasValid(data?.cancelItems, false, mandatoryFields) &&
        data?.cancelItems?.length !== 0
      )
    ) {
      Swal.fire({
        // title: "Total percentage exceeds 100%",
        title: "Please fill all required fields...!",
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
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
        { ...data, draftSave: true },
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
    dispatch(
      purchaseInwardEntryApi.util.invalidateTags(["purchaseInwardEntry"]),
    );
    dispatch(purchaseReturnApi.util.invalidateTags(["PurchaseReturn"]));
    dispatch(purchaseCancelApi.util.invalidateTags(["PurchaseCancel"]));
  };

  const dateRef = useRef(null);
  const inputPartyRef = useRef(null);

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      saveData();
    }
  };

  return (
    <>
      <div className="w-full  mx-auto rounded-md shadow-lg px-2 py-1 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-800">Purchase Cancel</h1>
          <button
            onClick={() => {
              // onNew();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">Basic Details</h2>
            <div className="grid grid-cols-2 gap-1">
              <ReusableInput
                label="Purchase Cancel No"
                readOnly
                value={docId}
              />
              <ReusableInput
                label="Purchase Cancel Date"
                value={docDate}
                type={"date"}
                required={true}
                readOnly={true}
                disabled
              />
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">Cancel Details</h2>
            <div className="grid grid-cols-2 gap-1 ">
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
                autoFocus={true}
              />
              <DropdownInput
                name="Location"
                options={dropDownListObject(
                  id
                    ? storeOptions
                    : storeOptions?.filter((item) => item.active),
                  "storeName",
                  "id",
                )}
                value={storeId}
                setValue={setStoreId}
                required={true}
                readOnly={id}
              />
              <DropdownInput
                name="Po Type"
                options={poTypes}
                value={poType}
                setValue={(value) => {
                  setPoType(value);
                }}
                required={true}
                readOnly={readOnly}
                disabled={id}
                beforeChange={() => {
                  setCancelItems([]);
                }}
              />
              <div></div>
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">
              Supplier Details
            </h2>
            <div className="grid grid-cols-2 gap-1">
              <div className="col-span-2">
                <ReusableSearchableInput
                  label="Supplier Id"
                  component="PartyMaster"
                  placeholder="Search Supplier Id..."
                  optionList={supplierList?.data}
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
        </div>
        <fieldset className="">
          <CancelItems
            id={id}
            cancelItems={cancelItems}
            setCancelItems={setCancelItems}
            readOnly={readOnly}
            uomList={uomList}
            hsnList={hsnList}
            styleItemList={styleItemList}
            poType={poType}
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
          />
        </fieldset>

        <div className="grid grid-cols-3 gap-3">
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
            <h2 className="font-medium text-slate-700 mb-2 text-base">
              Terms & Conditions
            </h2>
            <textarea
              readOnly={readOnly}
              value={termsAndCondition}
              onChange={(e) => {
                setTermsAndCondition(e.target.value);
              }}
              className="w-full overflow-auto h-14 px-2.5 py-2 text-xs border border-slate-300 rounded-md  focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Terms Details..."
              disabled={readOnly}
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
              className="w-full h-14 overflow-auto px-2.5 py-2 text-xs border border-slate-300 rounded-md  focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Additional notes..."
            />
          </div>
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-2 text-base">
              Qty Summary
            </h2>

            <div className="space-y-1.5">
              <div className="flex justify-between  text-sm">
                <span className="text-slate-600">Total Cancel Qty</span>
                <span className="font-medium">
                  {cancelItems
                    .reduce((sum, row) => sum + (Number(row.cancelQty) || 0), 0)
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
            <button
              className="bg-yellow-600 text-white px-4 py-1 rounded-md hover:bg-yellow-700 flex items-center text-sm"
              onClick={() => setReadOnly(false)}
            >
              <FiEdit2 className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default PurchaseCancelForm;

import { FaFileAlt } from "react-icons/fa";

import {
  DateInputNew,
  DropdownInput,
  ReusableInput,
  ReusableSearchableInput,
  TextInput,
} from "../../../Inputs";
import { inwardTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import {
  findFromList,
  getCommonParams,
  isGridDatasValid,
} from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiEdit2, FiSave } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import InwardItems from "./InwardItems";
import purchaseInwardEntryApi, {
  useAddPurchaseInwardEntryMutation,
  useGetPurchaseInwardEntryByIdQuery,
  useUpdatePurchaseInwardEntryMutation,
} from "../../../redux/uniformService/PurchaseInwardEntry";
import { useGetLocationMasterQuery } from "../../../redux/services/LocationMasterService";
import { useDispatch } from "react-redux";
import purchaseReturnApi from "../../../redux/services/PurchaseReturnService";
import purchaseCancelApi from "../../../redux/uniformService/PurchaseCancelService";
import { useGetPoItemsQuery } from "../../../redux/uniformService/PoServices";

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
  const dispatch = useDispatch();

  const searchFields = {
    searchDocId,
    searchDocDate,
  };

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
      setInwardType(data?.inwardType || "General Purchase Inward");
      setLocationId(data?.Store ? data.Store.locationId : branchId);
      setStoreId(data?.storeId ? data.storeId : "");
      setInwardItems(data?.inwardItems ? data?.inwardItems : []);
      setSupplierId(data?.supplierId || "");
      setDcDate(
        data?.dcDate ? moment.utc(data.dcDate).format("YYYY-MM-DD") : "",
      );
      setRemarks(data?.remarks || "");
      setDcNo(data?.dcNo ? data.dcNo : "");
      setVehicleNo(data?.vehicleNo ? data.vehicleNo : "");
      setInvNo(data?.invNo ? data?.invNo : "");
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
        dispatch(
          purchaseInwardEntryApi.util.invalidateTags(["purchaseInwardEntry"]),
        );
        dispatch(purchaseReturnApi.util.invalidateTags(["PurchaseReturn"]));
        dispatch(purchaseCancelApi.util.invalidateTags(["PurchaseCancel"]));
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

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      saveData();
    }
  };

  useEffect(() => {
    if (!id) {
      setInwardItems([]);
    }
  }, [supplierId]);

  return (
    <>
      <div className="w-full  mx-auto rounded-md shadow-lg px-2 py-1 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-800">Purchase Inward</h1>
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
            </div>
          </div>

          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
            <h2 className="font-medium text-slate-700 mb-2">Inward Details</h2>
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
                name="Inward Type"
                options={inwardTypes}
                value={inwardType}
                setValue={(value) => {
                  setInwardType(value);
                }}
                required={true}
                readOnly={readOnly}
                disabled={id}
                beforeChange={() => {
                  setInwardItems([]);
                }}
              />
              <TextInput
                name={"Inv No"}
                value={invNo}
                setValue={setInvNo}
                readOnly={id}
                required
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
                  label="Supplier"
                  component="PartyMaster"
                  placeholder="Search Supplier"
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
            inwardItems={inwardItems}
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
          />
        </fieldset>

        <div className="grid grid-cols-3 gap-3">
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
            <h2 className="font-medium text-slate-700 mb-2 text-base">
              Vehicle No
            </h2>
            <textarea
              readOnly={readOnly}
              value={vehicleNo}
              onChange={(e) => {
                setVehicleNo(e.target.value);
              }}
              className="w-full overflow-auto h-10 px-2.5 py-2 text-xs border border-slate-300 rounded-md  focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Vehicle Details..."
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
              className="w-full h-10 overflow-auto px-2.5 py-2 text-xs border border-slate-300 rounded-md  focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
              placeholder="Additional notes..."
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
export default PurchaseInwardForm;

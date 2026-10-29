import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { TextInput, DateInputNew } from "../../../Inputs/index.js";
import {
  useAddRateQuotationMutation,
  useUpdateRateQuotationMutation,
  useGetRateQuotationByIdQuery,
  useGetRateQuotationQuery,
} from "../../../redux/uniformService/RateQuotationService.js";
import {
  findFromList,
  getCommonParams,
  ModeChip,
} from "../../../Utils/helper.js";
import { dropDownListObject } from "../../../Utils/contructObject.js";
import RateQuotationItems from "./RateQuotationItems.jsx";
import moment from "moment";
import { PDFViewer } from "@react-pdf/renderer";
import Modal from "../../../UiComponents/Modal/index.js";
import RateQuotationPrintFormat from "./RateQuotationPrintFormat.jsx";
import tw from "../../../Utils/tailwind-react-pdf.js";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { FiEdit2, FiSave, FiPrinter } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import {
  CommonFormFooter,
  TransactionLayout,
} from "../../../Basic/components/Reuseable/index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import { PartyMaster } from "../index.js";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService.js";
import { useGetItemSubGroupMasterQuery } from "../../../redux/services/ItemSubGroupService.js";

const EMPTY_ROW = {
  itemGroupId: "",
  itemSubGroupId: "",
  styleItemId: "",
  hsnId: "",
  price: "",
  taxPercent: "",
};

const padItems = (itemsArray = []) => {
  const minLength = 4;
  const currentLength = itemsArray.length;

  const formattedItems = itemsArray.map((item) =>
    item.rowId
      ? item
      : { ...item, rowId: Math.random().toString(36).substring(2, 9) },
  );

  if (currentLength < minLength) {
    const padding = Array.from({ length: minLength - currentLength }, () => ({
      ...EMPTY_ROW,
      rowId: Math.random().toString(36).substring(2, 9),
    }));
    return [...formattedItems, ...padding];
  }
  return formattedItems;
};

const RateQuotationForm = ({
  readOnly,
  setReadOnly,
  id,
  setId,
  onClose,
  termsData,
  customerList,
  payTermList,
  currencyList,
  cityList,
  hasPermission,
}) => {
  const { branchId, companyId, finYearId, userId } = getCommonParams();

  const [docId, setDocId] = useState("New");
  const [docDate, setDocDate] = useState(moment().format("YYYY-MM-DD"));
  const [userDate, setUserDate] = useState(moment().format("YYYY-MM-DD"));
  const [customerId, setCustomerId] = useState("");
  const [rateQuotationItems, setRateQuotationItems] = useState(padItems([]));
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const childRecord = useRef(0);

  const customerRef = useRef(null);

  const effectiveReadOnly = readOnly || childRecord.current > 0;

  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    contactPerson: "",
    phone: "",
  });

  const { data: allData } = useGetRateQuotationQuery({
    params: { branchId },
  });
  const { data: singleData } = useGetRateQuotationByIdQuery(id, {
    skip: !id,
  });

  const { data: itemGroupList } = useGetItemGroupMasterQuery({});
  const { data: itemSubGroupList } = useGetItemSubGroupMasterQuery({});

  const [dispatchInvalidate] = useInvalidateTags();

  const [addData, { isLoading: isSaving }] = useAddRateQuotationMutation();
  const [updateData, { isLoading: isUpdating }] =
    useUpdateRateQuotationMutation();

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
      setUserDate(
        data.userDate
          ? moment(data.userDate).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
      );
      setCustomerId(data.customerId);

      childRecord.current = data?.childRecord ? data?.childRecord : 0;

      const mappedItems = (data.rateQuotationItems || []).map((item) => ({
        ...item,
        rowId: Math.random().toString(36).substring(2, 9),
        itemGroupId: item?.itemGroupId,
        itemSubGroupId: item?.itemSubGroupId,
        styleItemId: item?.styleItemId,
        hsnId: item?.hsnId,
        price: item?.price?.toFixed(2),
        taxPercent: item?.taxPercent?.toFixed(2),
      }));

      setRateQuotationItems(padItems(mappedItems));

      const cust = data.customer;
      if (cust) {
        setCustomerDetails({
          name: cust.name || "",
          contactPerson: cust.contactPersonName || "",
          phone: cust.contactNumber || "",
        });
      }
    }
  }, [id, singleData]);

  useEffect(() => {
    customerRef.current?.focus();
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const validateRows = (itemsList) => {
    const errors = [];
    const seen = new Set();
    itemsList.forEach((item, index) => {
      if (!item.styleItemId) {
        errors.push(`Row ${index + 1}: Description of Goods is required`);
      }
      if (!item.price || parseFloat(item.price) <= 0) {
        errors.push(`Row ${index + 1}: Valid Price is required`);
      }
      if (item.styleItemId) {
        if (seen.has(item.styleItemId)) {
          errors.push(`Row ${index + 1}: Duplicate item found`);
        } else {
          seen.add(item.styleItemId);
        }
      }
    });

    return errors;
  };

  const handleSave = async (pendingAction = null) => {
    if (userDate < docDate) {
      Swal.fire({
        title: "Warning",
        text: "User Date cannot be smaller than Doc Date",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    if (!customerId) {
      Swal.fire({
        title: "Warning",
        text: "Please select a Customer.",
        icon: "warning",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const filteredItems = rateQuotationItems.filter((item) => item.styleItemId);

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

    const payload = {
      userId,
      branchId,
      companyId,
      finYearId,
      docDate,
      docId,
      userDate,
      customerId,

      rateQuotationItems: JSON.stringify(filteredItems),
    };

    try {
      let savedId = id;
      if (id) {
        await updateData({ id, body: payload }).unwrap();
        Swal.fire({
          title: "Success",
          text: "Rate Quotation updated successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          didClose: () => {
            customerRef.current?.focus?.();
          },
        });
      } else {
        const res = await addData(payload).unwrap();
        savedId = res.data.id;
        setId(savedId);
        Swal.fire({
          title: "Success",
          text: "Rate Quotation created successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          didClose: () => {
            customerRef.current?.focus?.();
          },
        });
      }
      setReadOnly(true);
      dispatchInvalidate();

      if (pendingAction === "new") {
        onNew();
      } else if (pendingAction === "close") {
        onClose();
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.data?.message || "Failed to save Rate Quotation",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      handleSave();
    }
  };

  const onNew = () => {
    setId("");
    setReadOnly(false);
    setDocId("New");
    setDocDate(moment().format("YYYY-MM-DD"));
    setUserDate(moment().format("YYYY-MM-DD"));
    setCustomerId("");
    setRemarks("");
    setTermsAndCondition("");
    setTermsId("");
    setItems(padItems([]));
    setCustomerDetails({ name: "", contactPerson: "", phone: "" });
  };

  const headerContent = (
    <div className="flex flex-col md:flex-row gap-1 w-full">
      <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Basic Details
        </h2>
        <div className="flex gap-2">
          <div className="w-36">
            <TextInput name="Rate Quotation No" value={docId} disabled={true} />
          </div>
          <div className="w-28">
            <DateInputNew
              name="Rate Quotation Date"
              value={docDate}
              setValue={setDocDate}
              disabled={true}
              required={true}
              type="date"
            />
          </div>
          <div className="w-[105px]">
            <DateInputNew
              name="User Date"
              value={userDate}
              setValue={setUserDate}
              disabled={effectiveReadOnly}
              required={false}
              type="date"
              min={docDate}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
        <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
          Customer Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
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
              className={`w-[150px]`}
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
              placeholder="Contact name"
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
              placeholder="Phone"
              value={findFromList(
                customerId,
                customerList?.data,
                "contactNumber",
              )}
              disabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const footerContent = (
    <>
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
        {/* Left Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleSave("close")}
            disabled={effectiveReadOnly || isSaving || isUpdating}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave("close");
                e.stopPropagation();
              }
            }}
            className={`bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs ${
              effectiveReadOnly || isSaving || isUpdating
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
          >
            <HiOutlineRefresh className="w-4 h-4 mr-2" />
            {id ? "Update & Close" : "Save & Close"}
          </button>
          <button
            onClick={() => handleSave("new")}
            disabled={effectiveReadOnly || isSaving || isUpdating}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleSave("new");
              }
            }}
            className={`bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs ${
              effectiveReadOnly || isSaving || isUpdating
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
          >
            <FiSave className="w-4 h-4 mr-2" />
            {id ? "Update & New" : " Save & New"}
          </button>
        </div>

        {/* Right Buttons */}
        <div className="flex gap-2 flex-wrap">
          {readOnly && id && (
            <button
              onClick={() => hasPermission(() => setReadOnly(false), "edit")}
              className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700 flex items-center text-xs"
            >
              <FiEdit2 className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
          {id && (
            <button
              onClick={() => setPrintModalOpen(true)}
              className="bg-slate-600 text-white px-4 py-1 rounded hover:bg-slate-700 flex items-center text-xs"
            >
              <FiPrinter className="w-4 h-4 mr-2" />
              Print
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      <Modal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        widthClass={"w-[90%] h-[90%]"}
      >
        <PDFViewer style={tw("w-full h-full")}>
          <RateQuotationPrintFormat
            data={{
              ...singleData?.data,
              rateQuotationItems: rateQuotationItems.filter(
                (i) => i.styleItemId,
              ),
              items: rateQuotationItems.filter((i) => i.styleItemId),
            }}
            taxDetails={{}}
            cityList={cityList}
            currencyList={currencyList}
            payTermList={payTermList}
          />
        </PDFViewer>
      </Modal>

      <TransactionLayout
        title="Rate Quotation"
        badge={<ModeChip id={id} readOnly={readOnly} />}
        closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        header={headerContent}
        detailsLayout="default"
        detailsLayouts={["default"]}
        gridItems={
          <RateQuotationItems
            rateQuotationItems={rateQuotationItems}
            setRateQuotationItems={setRateQuotationItems}
            readOnly={effectiveReadOnly}
            id={id}
            itemGroupList={itemGroupList}
            itemSubGroupList={itemSubGroupList}
          />
        }
        footer={footerContent}
      />
    </>
  );
};

export default RateQuotationForm;

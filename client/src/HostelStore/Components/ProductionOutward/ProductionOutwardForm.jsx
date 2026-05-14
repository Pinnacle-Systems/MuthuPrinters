import { IoArrowBackCircleSharp } from "react-icons/io5";

import {
    CheckBox,
    CheckBoxNew,
    DateInputNew,
    DropdownInput,
    DropdownNew,
    ReusableInput,
    TextInput,
} from "../../../Inputs/index.js";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import {
    findFromList,
    getCommonParams,
    ModeChip,
    renameFile,
} from "../../../Utils/helper.js";
import { toast } from "react-toastify";
import { FiCheck, FiEdit2, FiSave, FiSend } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { TransactionLayout } from "../../../Basic/components/Reuseable/index.js";
import { dropDownListObject } from "../../../Utils/contructObject.js";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { PartyMaster } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService.js";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService.js";
import ReusableFormFooter from "../../../Basic/components/Reuseable/ReuseableFormFooter.jsx";
import { useGetUomQuery } from "../../../redux/services/UomMasterService.js";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService.js";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService.js";
import { useGetSizeTemplateQuery } from "../../../redux/services/SizeTemplateMaster.js";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices.js";
import { useDispatch } from "react-redux";
import { useAddProductionOutwardMutation, useGetProductionOutwardByIdQuery, useUpdateProductionOutwardMutation } from "../../../redux/uniformService/ProductionOutwardService.js";
import OutwardDetails, { DEFAULT_ROW_COUNT, makeEmptyRow } from "./OutwardDetails.jsx";
import { useGetJobCardListQuery } from "../../../redux/uniformService/JobCardService.js";
import { useGetProcessMasterQuery } from "../../../redux/services/ProcessMasterService.js";

const ProductionOutwardForm = ({
    onClose,
    id,
    setId,
    readOnly,
    setReadOnly,
    vendorList,

}) => {
    const today = new Date();
    const [docDate, setDocDate] = useState(
        moment.utc(today).format("YYYY-MM-DD"),
    );
    const [vendorId, setVendorId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [docId, setDocId] = useState("");
    const [outwardDetails, setOutwardDetails] = useState(
        Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow)
    );
    const dispatch = useDispatch();
    const vendorRef = useRef(null);
    const childRecord = useRef(0);
    const [dispatchInvalidate] = useInvalidateTags();
    const { userId, finYearId, branchId, companyId } = getCommonParams();
    const params = {
        branchId,
        companyId,
        finYearId,
    };

    const {
        data: singleData,
        isFetching: isSingleFetching,
        isLoading: isSingleLoading,
    } = useGetProductionOutwardByIdQuery(id, { skip: !id });
    const { data: styleItemList } = useGetStyleItemMasterQuery({
        params: { ...params },
    });
    const { data: uomList } = useGetUomQuery({ params });
    const { data: sizeList } = useGetSizeMasterQuery({ params });
    const { data: gsmList } = useGetGsmMasterQuery({ params });
    const { data: itemGroupList } = useGetItemGroupMasterQuery({ params });
    const { data: sizeTemplateList } = useGetSizeTemplateQuery({
        params: { companyId },
    });
    const { data: hsnList } = useGetHsnMasterQuery({ params });
    const { data: jobCardList } = useGetJobCardListQuery({ params: { companyId, branchId } });
    const { data: processList } = useGetProcessMasterQuery({ params: { companyId } });
    const [addData] = useAddProductionOutwardMutation();
    const [updateData] = useUpdateProductionOutwardMutation();

    const status = singleData?.data?.approvalStatus?.status;

    const syncFormWithDb = useCallback(
        (data) => {
            setDocId(data?.docId ? data?.docId : "New");
            setDocDate(
                data?.docDate
                    ? moment.utc(data.docDate).format("YYYY-MM-DD")
                    : moment.utc(new Date()).format("YYYY-MM-DD"),
            );
            setVendorId(data?.vendorId || "");
            setRemarks(data?.remarks || "");
            childRecord.current = data?.childRecord ? data?.childRecord : 0;
            setOutwardDetails(data?.outwardDetails || []);
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
        vendorId,
        remarks,
        finYearId,
        outwardDetails: outwardDetails?.filter(i => i.jobCardId && i.processId),
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
                        dispatchInvalidate();

                        if (returnData.statusCode === 0) {
                            if (nextProcess == "new") {
                                setId(0);
                                setDocId("New");
                                syncFormWithDb(undefined);
                                setTimeout(() => {
                                    vendorRef.current?.focus();
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
                // dispatch(ProformaInvoiceApi.util.invalidateTags(["proformaInvoice"]));
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

    // const validateRows = (items) => {
    //     const errors = [];
    //     const seen = new Set();
    //     items.forEach((item, index) => {

    //         if (!item.styleItemId) {
    //             errors.push(`Row ${index + 1}: Style is required`);
    //         }
    //         if (!item.itemGroupId) {
    //             errors.push(`Row ${index + 1}: Item Group is required`);
    //         }
    //         if (!item.hsnId) {
    //             errors.push(`Row ${index + 1}: HSN is required`);
    //         }
    //         if (!item.uomId) {
    //             errors.push(`Row ${index + 1}: UOM is required`);
    //         }

    //         if (!item.orderQty || Number(item.orderQty) <= 0) {
    //             errors.push(`Row ${index + 1}: Order Qty must be greater than 0`);
    //         }
    //         if (item.orderQty > 0 && item.sizeBreakup.length == 0) {
    //             errors.push(`Row ${index + 1}: Size Qty is required for Order Qty`);
    //         }
    //         const key = `${item.styleItemId}_${item.uomId}_${item.itemGroupId}`;
    //         if (seen.has(key)) {
    //             errors.push(`Row ${index + 1}: Duplicate item found`);
    //         } else {
    //             seen.add(key);
    //         }
    //         if (item.sizeBreakup?.length) {

    //             const sizeSeen = new Set();

    //             item.sizeBreakup.forEach((size, sizeIndex) => {

    //                 // size required
    //                 if (!size.sizeId) {
    //                     errors.push(
    //                         `Row ${index + 1}, Size Row ${sizeIndex + 1}: Size is required`
    //                     );
    //                 }

    //                 // qty validation
    //                 const qty = Number(size.qty || 0);

    //                 if (qty <= 0) {
    //                     errors.push(
    //                         `Row ${index + 1}, Size Row ${sizeIndex + 1}: Qty must be greater than 0`
    //                     );
    //                 }


    //                 // duplicate sizeId check
    //                 if (size.sizeId) {

    //                     if (sizeSeen.has(size.sizeId)) {
    //                         errors.push(
    //                             `Row ${index + 1}: Duplicate size found`
    //                         );
    //                     } else {
    //                         sizeSeen.add(size.sizeId);
    //                     }
    //                 }
    //             });

    //         }
    //     });

    //     return errors;
    // };

    const validateData = (data) => {
        const items = data?.outwardDetails || [];
        const checks = [
            { condition: !data.vendorId, title: "Customer is required!" },
            { condition: !data.productionType, title: "Production Type is required!" },
            { condition: !data.validDays, title: "Valid To is required!" },
            { condition: items.length === 0, title: "Order Items are required!" },
            {}
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
                        `Row ${d.duplicateIndex + 1} is duplicate of Row ${d.firstIndex + 1}`
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
    };

    const handleKeyDown = (event) => {
        let charCode = String.fromCharCode(event.which).toLowerCase();
        if ((event.ctrlKey || event.metaKey) && charCode === "s") {
            event.preventDefault();
            saveData("close");
        }
    };

    useEffect(() => {
        vendorRef.current?.focus();
    }, []);


    return (
        <>
            <TransactionLayout
                title="Production Outward"
                badge={<ModeChip id={id} readOnly={readOnly} />}
                closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
                onClose={onClose}
                onKeyDown={handleKeyDown}
                header={
                    <div className="flex flex-col xl:flex-row gap-1">
                        <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                            <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Basic Details</h2>
                            <div className="flex gap-2">
                                <div className="w-36">
                                    <TextInput name="Outward No" value={docId} disabled={true} />
                                </div>
                                <div className="w-32">
                                    <DateInputNew
                                        name="Outward Date"
                                        value={docDate}
                                        setValue={setDocDate}
                                        disabled={true}
                                        required={true}
                                        type="date"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                            <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Job Card Details</h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">



                            </div>
                        </div>
                        <div className=" w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                            <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
                                Vendor Details
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="md:col-span-2">
                                    <DropdownWithModal
                                        name="Vendor"
                                        options={dropDownListObject(
                                            id
                                                ? vendorList?.data?.filter((item) => item?.isCustomer)
                                                : vendorList?.data?.filter((item) => item?.active && item?.isCustomer),
                                            "name",
                                            "id",
                                        )}
                                        value={vendorId}
                                        setValue={setVendorId}
                                        required={true}
                                        readOnly={readOnly}
                                        className={`w-full`}
                                        addNewLabel="+ Add New Vendor"
                                        childComponent={PartyMaster}
                                        addNewModalWidth="w-[90%] h-[95%]"
                                        disabled={childRecord.current > 0 || readOnly}
                                        ref={vendorRef}
                                        openOnFocus={true}
                                    />
                                </div>
                                <div className="">
                                    <TextInput
                                        name="Contact Person"
                                        placeholder="Contact name"
                                        value={findFromList(vendorId, vendorList?.data, "contactPersonName")}
                                        disabled={true}
                                    />
                                </div>
                                <div className="">
                                    <TextInput
                                        name="Phone"
                                        placeholder="Contact number"
                                        value={findFromList(vendorId, vendorList?.data, "contactNumber")}
                                        disabled={true}
                                        className="w-20"
                                    />
                                </div>
                            </div>
                        </div>




                    </div>
                }
                detailsLayout="default"
                detailsLayouts={["default"]}
                gridItems={
                    <OutwardDetails
                        outwardDetails={outwardDetails}
                        setOutwardDetails={setOutwardDetails}
                        readOnly={readOnly}
                        jobCardList={jobCardList}
                        processList={processList}
                        id={id}
                        childRecord={childRecord}
                    />
                }
                footer={
                    <>
                        <ReusableFormFooter
                            sections={[
                                {
                                    title: "Remarks",
                                    value: remarks,
                                    onChange: setRemarks,
                                    placeholder: "Additional notes...",
                                    readOnly: readOnly
                                },
                            ]}
                            hasSummaryTitle="Summary"
                            totalsRows={[
                                {
                                    key: "sentQty",
                                    label: "Sent Qty",
                                    value: outwardDetails?.reduce((acc, i) => acc + (Number(i.sentQty) || 0), 0),
                                    summaryColumn: "left",
                                },
                                {
                                    key: "pendingQty",
                                    label: "Pending Qty",
                                    value: outwardDetails?.reduce((acc, i) => acc + ((Number(i.sentQty) || 0) - (Number(i.receivedQty) || 0)), 0),
                                    summaryColumn: "left",
                                },
                            ]}
                        />
                        <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
                            {/* Left Buttons */}
                            <div className="flex gap-2 flex-wrap">
                                {
                                    (
                                        <>

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
                                                className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs"
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
                                                className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs"
                                            >
                                                <FiSave className="w-4 h-4 mr-2" />
                                                Save & New
                                            </button>
                                        </>
                                    )
                                }

                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {!id ||
                                    (readOnly && (
                                        <button
                                            className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700 flex items-center text-xs"
                                            onClick={() => setReadOnly(false)}

                                        >
                                            <FiEdit2 className="w-4 h-4 mr-2" />
                                            Edit
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </>
                }
            />
        </>
    );
};
export default ProductionOutwardForm;

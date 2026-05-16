import { IoArrowBackCircleSharp } from "react-icons/io5";

import {
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
import ReusableFormFooter from "../../../Basic/components/Reuseable/ReuseableFormFooter.jsx";
import { useDispatch } from "react-redux";
import { useAddProductionOutwardMutation, useGetProductionOutwardByIdQuery, useUpdateProductionOutwardMutation } from "../../../redux/uniformService/ProductionOutwardService.js";
import OutwardDetails, { DEFAULT_ROW_COUNT, makeEmptyRow } from "./OutwardDetails.jsx";
import { useGetJobCardListQuery } from "../../../redux/uniformService/JobCardService.js";
import { useGetProcessMasterQuery } from "../../../redux/services/ProcessMasterService.js";
import { useGetAllocationListQuery } from "../../../redux/uniformService/ProductionAllocationService.js";
import { outwardProcessTypes } from "../../../Utils/DropdownData.js";

const ProductionOutwardForm = ({
    onClose,
    id,
    setId,
    readOnly,
    setReadOnly,
    supplierList,
}) => {
    const today = new Date();
    const [docDate, setDocDate] = useState(
        moment.utc(today).format("YYYY-MM-DD"),
    );
    const [supplierId, setSupplierId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [docId, setDocId] = useState("");
    const [outwardDetails, setOutwardDetails] = useState(
        Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow)
    );
    const dispatch = useDispatch();
    const supplierRef = useRef(null);
    const childRecord = useRef(0);
    const [jobCardId, setJobCardId] = useState("");
    const [productionAllocationId, setProductionAllocationId] = useState("");
    const [processType, setProcessType] = useState("");
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
    const { data: jobCardList } = useGetJobCardListQuery({ params: { companyId, branchId } });
    const { data: productionAllocationList } = useGetAllocationListQuery({ params: { companyId, branchId } });
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
            setSupplierId(data?.supplierId || "");
            setRemarks(data?.remarks || "");
            childRecord.current = data?.childRecord ? data?.childRecord : 0;
            setOutwardDetails(
                data?.productionOutwardDetails?.length
                    ? data.productionOutwardDetails
                    : Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow)
            );
            setJobCardId(data?.jobCardId || "");
            setProductionAllocationId(data?.productionAllocationId || "");
            setProcessType(data?.processType || "");
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
        supplierId,
        remarks,
        finYearId,
        outwardDetails: outwardDetails?.filter(i => i.processId),
        jobCardId,
        productionAllocationId,
        processType
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
            // { condition: !data.supplierId, title: "Customer is required!" },
            // { condition: !data.processType, title: "Production Type is required!" },
            // { condition: items.length === 0, title: "Order Items are required!" },
            // { condition: !data.jobCardId, title: "Job Card is required!" },
            // { condition: !data.productionAllocationId, title: "Production Allocation is required!" },
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
        // const rowErrors = validateRows(items);
        // if (rowErrors.length > 0) {
        //     Swal.fire({
        //         icon: "warning",
        //         title: "Row Validation Error",
        //         html: `<div style="text-align:left">${rowErrors.join("<br/>")}</div>`,
        //     });
        //     return false;
        // }

        // // 🔹 Duplicate validation
        // const duplicates = findDuplicates(items);
        // if (duplicates.length > 0) {
        //     const message = duplicates
        //         .map(
        //             (d) =>
        //                 `Row ${d.duplicateIndex + 1} is duplicate of Row ${d.firstIndex + 1}`
        //         )
        //         .join("<br/>");

        //     Swal.fire({
        //         icon: "warning",
        //         title: "Duplicate Items Found",
        //         html: `<div style="text-align:left">${message}</div>`,
        //     });
        //     return false;
        // }

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
        supplierRef.current?.focus();
    }, []);

    const handleJobCardChange = (item) => {
        if (!item) return;

        setProductionAllocationId(item.productionAllocationId || "");

        const allocation = productionAllocationList?.data?.find(
            (s) => s.jobCardId === item.id
        );

        const allocationDetails = allocation?.allocationDetails || [];
        const processRoute = item.processRoute || [];

        if (!allocationDetails.length) {
            setOutwardDetails(Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow));
            setSupplierId("");
            return;
        }

        const sorted = [...allocationDetails].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

        // seq -> status from processRoute
        const seqStatusMap = {};
        processRoute.forEach(pr => { seqStatusMap[pr.sequence] = pr.status; });

        // seq -> processId from allocationDetails
        const seqProcessMap = {};
        sorted.forEach(d => { seqProcessMap[d.sequence] = d.processId; });

        const outsideProcesses = sorted.filter(d => d.isOutSide === true);

        if (!outsideProcesses.length) {
            setOutwardDetails(Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow));
            setSupplierId("");
            return;
        }

        // Find the FIRST outside process whose immediately previous seq is COMPLETED
        // Once found, collect all consecutive outside processes from that point
        // regardless of their own status — eligibility is only checked for the first one
        let startIndex = -1;
        for (let i = 0; i < outsideProcesses.length; i++) {
            const detail = outsideProcesses[i];
            const prevSeq = (detail.sequence || 1) - 1;
            const isPrevCompleted = prevSeq <= 0 || seqStatusMap[prevSeq] === "COMPLETED";
            if (isPrevCompleted) {
                startIndex = i;
                break;
            }
        }

        if (startIndex === -1) {
            // No eligible outside process found
            setOutwardDetails(Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow));
            setSupplierId("");
            return;
        }

        // From the first eligible, collect consecutive outside processes
        // that are contiguous by sequence (no gaps, no inhouse between them)
        const firstEligible = outsideProcesses[startIndex];
        const firstSupplierId = firstEligible.supplierId;

        // Get all consecutive outside processes starting from firstEligible
        // They must be consecutive by sequence number (seq+1, seq+2...)
        const consecutiveOutside = [];
        let expectedSeq = firstEligible.sequence;
        for (let i = startIndex; i < outsideProcesses.length; i++) {
            const detail = outsideProcesses[i];
            if (detail.sequence === expectedSeq) {
                consecutiveOutside.push(detail);
                expectedSeq++;
            } else {
                break; // gap in sequence, stop
            }
        }

        // Now group by same supplierId from the start
        const sameSupplierGroup = [];
        for (const detail of consecutiveOutside) {
            if (detail.supplierId === firstSupplierId) {
                sameSupplierGroup.push(detail);
            } else {
                break;
            }
        }

        // If different supplier exists next, only show first supplier's group
        // If same supplier all through, show all with only first row editable
        const rowsToShow = sameSupplierGroup; // always use same supplier group

        // Auto-set supplierId
        setSupplierId(firstSupplierId || "");

        const outsideRows = rowsToShow.map((detail, idx) => {
            const prevSeq = (detail.sequence || 1) - 1;
            const prevProcessId = prevSeq > 0 ? (seqProcessMap[prevSeq] || "") : "";

            return {
                ...makeEmptyRow(),
                sequence: detail.sequence,
                processId: detail.processId,
                allocationDetailId: detail.id,
                supplierId: detail.supplierId || "",
                prevProcessId,
                availableQty: "",
                // Only first row sentQty is editable
                isDisabled: idx > 0,
            };
        });

        const paddedRows = [
            ...outsideRows,
            ...Array.from(
                { length: Math.max(0, DEFAULT_ROW_COUNT - outsideRows.length) },
                makeEmptyRow
            ),
        ];

        setOutwardDetails(paddedRows);
    };

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
                                <div className="w-28">
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
                            <div className="flex gap-2 px-1">
                                <div className="w-40">

                                    <DropdownNew
                                        name="Job Card No"
                                        dataList={jobCardList?.data}
                                        value={jobCardId}
                                        setValue={setJobCardId}
                                        required
                                        readOnly={readOnly}
                                        disabled={readOnly}
                                        otherField={"docId"}
                                        beforeChange={handleJobCardChange}
                                        ref={supplierRef}
                                    />
                                </div>
                                <div className="w-40">

                                    <DropdownNew
                                        name="Production Allocation No"
                                        dataList={productionAllocationList?.data}
                                        value={productionAllocationId}
                                        setValue={setProductionAllocationId}
                                        required
                                        readOnly={true}
                                        disabled={true}
                                        otherField={"docId"}
                                    />
                                </div>
                                {/* <DropdownInput
                                    name="Process Type"
                                    options={outwardProcessTypes}
                                    value={processType}
                                    setValue={(value) => setProcessType(value)}
                                    required={true}
                                    readOnly={readOnly}
                                    disabled={childRecord.current > 0 || readOnly}
                                /> */}

                                <div className="w-64">

                                    <TextInput name="Item Description" value={findFromList(jobCardId, jobCardList?.data, "styleItemName")} readOnly={true} required
                                        className=" w-full " />
                                </div>

                            </div>
                        </div>
                        <div className=" w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                            <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
                                Supplier Details
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="md:col-span-2">
                                    <DropdownWithModal
                                        name="Supplier"
                                        options={dropDownListObject(
                                            id
                                                ? supplierList?.data?.filter((item) => item?.isSupplier)
                                                : supplierList?.data?.filter((item) => item?.active && item?.isSupplier),
                                            "name",
                                            "id",
                                        )}
                                        value={supplierId}
                                        setValue={setSupplierId}
                                        required={true}
                                        readOnly={readOnly}
                                        className={`w-full`}
                                        addNewLabel="+ Add New Supplier"
                                        childComponent={PartyMaster}
                                        addNewModalWidth="w-[90%] h-[95%]"
                                        disabled={childRecord.current > 0 || readOnly}

                                        openOnFocus={true}
                                    />
                                </div>
                                <div className="">
                                    <TextInput
                                        name="Contact Person"
                                        placeholder="Contact name"
                                        value={findFromList(supplierId, supplierList?.data, "contactPersonName")}
                                        disabled={true}
                                    />
                                </div>
                                <div className="">
                                    <TextInput
                                        name="Phone"
                                        placeholder="Contact number"
                                        value={findFromList(supplierId, supplierList?.data, "contactNumber")}
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
                        jobCardId={jobCardId}
                        productionAllocationList={productionAllocationList}  // add
                        setSupplierId={setSupplierId}
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
                                    key: "receivedQty",
                                    label: "Received Qty",
                                    value: outwardDetails?.reduce((acc, i) => acc + (Number(i.receivedQty) || 0), 0),
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

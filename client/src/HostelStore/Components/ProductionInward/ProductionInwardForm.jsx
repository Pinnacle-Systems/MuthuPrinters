import { IoArrowBackCircleSharp } from "react-icons/io5";
import {
    DateInputNew,
    DropdownInput,
    DropdownNew,
    TextInput,
} from "../../../Inputs/index.js";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper.js";
import { toast } from "react-toastify";
import { FiEdit2, FiSave } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { TransactionLayout } from "../../../Basic/components/Reuseable/index.js";
import { dropDownListObject } from "../../../Utils/contructObject.js";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { PartyMaster } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import ReusableFormFooter from "../../../Basic/components/Reuseable/ReuseableFormFooter.jsx";
import {
    useAddProductionInwardMutation,
    useGetProductionInwardByIdQuery,
    useUpdateProductionInwardMutation,
} from "../../../redux/uniformService/ProductionInwardService.js";
import InwardDetails, { DEFAULT_ROW_COUNT, makeEmptyRow } from "./InwardDetails.jsx";
import { useGetJobCardListQuery } from "../../../redux/uniformService/JobCardService.js";
import { useGetProcessMasterQuery } from "../../../redux/services/ProcessMasterService.js";
import { useGetProductionOutwardJobCardDtlsQuery, useGetProductionOutwardQuery } from "../../../redux/uniformService/ProductionOutwardService.js";
import { receiptTypes } from "../../../Utils/DropdownData.js";

const ProductionInwardForm = ({
    onClose,
    id,
    setId,
    readOnly,
    setReadOnly,
    supplierList,
}) => {
    const today = new Date();
    const [docDate, setDocDate] = useState(moment.utc(today).format("YYYY-MM-DD"));
    const [supplierId, setSupplierId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [docId, setDocId] = useState("");
    const [productionOutwardId, setProductionOutwardId] = useState("");
    const [jobCardId, setJobCardId] = useState("");
    const [receiptType, setReceiptType] = useState("");
    const [inwardDetails, setInwardDetails] = useState(
        Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow)
    );
    const [dcNo, setDcNo] = useState("");
    const [dcDate, setDcDate] = useState("");
    const supplierRef = useRef(null);
    const childRecord = useRef(0);
    const [dispatchInvalidate] = useInvalidateTags();
    const { userId, finYearId, branchId, companyId } = getCommonParams();
    const params = { branchId, companyId, finYearId };
    const [searchDocId, setSearchDocId] = useState("");
    const [searchDocDate, setSearchDocDate] = useState("");
    const [searchJobCard, setSearchJobCard] = useState("");
    const [currentPageNumber, setCurrentPageNumber] = useState(1);
    const [tempItems, setTempItems] = useState([]);
    const [dataPerPage, setDataPerPage] = useState("10");

    const searchFields = {
        searchDocId,
        searchDocDate,
        searchJobCard,
    };

    const {
        data: productionOutwardDtlsData,
        isLoading: isProductionOutwardDtlsLoading,
        isFetching: isProductionOutwardDtlsFetching,
    } = useGetProductionOutwardJobCardDtlsQuery({
        params: {
            branchId,
            supplierId,
            ...searchFields,
            pagination: true,
            dataPerPage,
            pageNumber: currentPageNumber,
        },
    });

    const {
        data: singleData,
        isFetching: isSingleFetching,
        isLoading: isSingleLoading,
    } = useGetProductionInwardByIdQuery(id, { skip: !id });

    const { data: jobCardList } = useGetJobCardListQuery({ params: { companyId, branchId } });
    const { data: processList } = useGetProcessMasterQuery({ params: { companyId } });
    const { data: outwardList } = useGetProductionOutwardQuery({ params: { branchId, companyId, finYearId } });

    const [addData] = useAddProductionInwardMutation();
    const [updateData] = useUpdateProductionInwardMutation();

    const syncFormWithDbItems = useCallback(
        (data) => {
            setTempItems(data);
        },
        [supplierId],
    );

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
            setReceiptType(data?.receiptType || "");
            setInwardDetails(
                data?.inwardDetails?.length
                    ? data.inwardDetails
                    : Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow)
            );
            setDcNo(data?.dcNo || "");
            setDcDate(data?.dcDate ? moment.utc(data.dcDate).format("YYYY-MM-DD") : "");
        },
        [id],
    );

    useEffect(() => {
        setCurrentPageNumber(1);
    }, [searchDocId, searchDocDate, searchJobCard]);

    useEffect(() => {
        if (productionOutwardDtlsData?.data) {
            syncFormWithDbItems(productionOutwardDtlsData?.data);
        }
    }, [isProductionOutwardDtlsLoading, isProductionOutwardDtlsFetching, syncFormWithDbItems, productionOutwardDtlsData]);

    useEffect(() => {
        if (id && singleData?.data) {
            syncFormWithDb(singleData.data);
        } else {
            syncFormWithDb(undefined);
        }
    }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

    const data = {
        id,
        docDate,
        branchId,
        userId,
        supplierId,
        remarks,
        finYearId,
        receiptType,
        inwardDetails: inwardDetails?.filter((i) => i.processId),
        dcNo,
        dcDate
    };

    const handleSubmitCustom = async (callback, data, text, nextProcess) => {
        try {
            const returnData = await callback(data).unwrap();
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
                            if (nextProcess === "new") {
                                setId(0);
                                setDocId("New");
                                syncFormWithDb(undefined);
                                setTimeout(() => { supplierRef.current?.focus(); }, 100);
                            }
                            if (nextProcess === "close") {
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

    const validateData = (data) => {
        const checks = [];
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
        if (!validateData(data)) return;
        if (id) {
            if (!window.confirm("Are you sure update the details ...?")) return;
        }
        if (id) {
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

    // When outward is selected, auto-fill supplier and jobCard
    const handleOutwardChange = (item) => {
        if (!item) return;
        setSupplierId(item.supplierId || "");
        setJobCardId(item.jobCardId || "");
        // Pre-fill inward details from outward details
        if (item.productionOutwardDetails?.length) {
            const rows = item.productionOutwardDetails.map((d) => ({
                ...makeEmptyRow(),
                processId: d.processId || "",
                outwardDetailId: d.id,
                receivedQty: "",
                wastageQty: "",
                acceptedQty: "",
            }));
            const padded = [
                ...rows,
                ...Array.from({ length: Math.max(0, DEFAULT_ROW_COUNT - rows.length) }, makeEmptyRow),
            ];
            setInwardDetails(padded);
        } else {
            setInwardDetails(Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow));
        }
    };

    return (
        <>
            <TransactionLayout
                title="Production Inward"
                badge={<ModeChip id={id} readOnly={readOnly} />}
                closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
                onClose={onClose}
                onKeyDown={handleKeyDown}
                header={
                    <div className="flex flex-col xl:flex-row gap-1">
                        {/* Basic Details */}
                        <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                            <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Basic Details</h2>
                            <div className="flex gap-2">
                                <div className="w-36">
                                    <TextInput name="Inward No" value={docId} disabled={true} />
                                </div>
                                <div className="w-28">
                                    <DateInputNew
                                        name="Inward Date"
                                        value={docDate}
                                        setValue={setDocDate}
                                        disabled={readOnly}
                                        required={true}
                                        type="date"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Supplier Details - shown first per requirement */}
                        <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
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
                                        className="w-full"
                                        addNewLabel="+ Add New Supplier"
                                        childComponent={PartyMaster}
                                        addNewModalWidth="w-[90%] h-[95%]"
                                        disabled={childRecord.current > 0 || readOnly}
                                        openOnFocus={true}
                                        ref={supplierRef}
                                    />
                                </div>
                                <div>
                                    <TextInput
                                        name="Contact Person"
                                        placeholder="Contact name"
                                        value={findFromList(supplierId, supplierList?.data, "contactPersonName")}
                                        disabled={true}
                                    />
                                </div>
                                <div>
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

                        {/* Outward & Job Card Details */}
                        <div className="flex-1 border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                            <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Inward Details</h2>
                            <div className="flex gap-2 px-1">
                                <div>
                                    <DropdownInput
                                        name="Receipt Basis"
                                        options={receiptTypes}
                                        value={receiptType}
                                        setValue={(value) => {
                                            setReceiptType(value);
                                        }}
                                        required={true}
                                        readOnly={readOnly}
                                        disabled={id}
                                        beforeChange={() => {

                                            // setInwardDetails([]);

                                        }}
                                    />
                                </div>
                                <TextInput
                                    name={"Dc No."}
                                    value={dcNo}
                                    setValue={setDcNo}
                                    readOnly={readOnly}
                                />
                                <div className="w-28">
                                    <DateInputNew
                                        name="Dc Date"
                                        value={dcDate}
                                        setValue={setDcDate}
                                        readOnly={readOnly}
                                        type={"date"}
                                    />
                                </div>
                                <div></div>

                            </div>
                        </div>
                    </div>
                }
                detailsLayout="default"
                detailsLayouts={["default"]}
                gridItems={
                    <InwardDetails
                        inwardDetails={inwardDetails}
                        setInwardDetails={setInwardDetails}
                        readOnly={readOnly}
                        processList={processList}
                        id={id}
                        childRecord={childRecord}
                        setTempItems={setTempItems}
                        tempItems={tempItems}
                        searchDocId={searchDocId}
                        setSearchDocId={setSearchDocId}
                        setSearchDocDate={setSearchDocDate}
                        searchDocDate={searchDocDate}
                        searchJobCard={searchJobCard}
                        setSearchJobCard={setSearchJobCard}
                        supplierId={supplierId}
                        receiptType={receiptType}
                        jobCardList={jobCardList}
                        productionOutwardList={outwardList}
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
                                    readOnly: readOnly,
                                },
                            ]}
                            hasSummaryTitle="Summary"
                            totalsRows={[
                                {
                                    key: "receivedQty",
                                    label: "Received Qty",
                                    value: inwardDetails?.reduce((acc, i) => acc + (Number(i.receivedQty) || 0), 0),
                                    summaryColumn: "left",
                                },
                                {
                                    key: "wastageQty",
                                    label: "Wastage Qty",
                                    value: inwardDetails?.reduce((acc, i) => acc + (Number(i.wastageQty) || 0), 0),
                                    summaryColumn: "left",
                                },
                                {
                                    key: "acceptedQty",
                                    label: "Accepted Qty",
                                    value: inwardDetails?.reduce((acc, i) => acc + (Number(i.acceptedQty) || 0), 0),
                                    summaryColumn: "left",
                                },
                            ]}
                        />
                        <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => saveData("close")}
                                    disabled={readOnly}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") { e.preventDefault(); saveData("close"); e.stopPropagation(); }
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
                                        if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); saveData("new"); }
                                    }}
                                    className="bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center text-xs"
                                >
                                    <FiSave className="w-4 h-4 mr-2" />
                                    Save & New
                                </button>
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

export default ProductionInwardForm;
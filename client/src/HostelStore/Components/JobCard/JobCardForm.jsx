// ─────────────────────────────────────────────────────────────
// CheckBox Component
// ─────────────────────────────────────────────────────────────
export const CheckBox = ({
    name,
    value,
    setValue,
    readOnly = false,
    className,
    required = false,
    disabled = false,
    tabIndex = null,
}) => {
    return (
        <label
            className={`inline-flex items-center gap-1.5 cursor-pointer select-none
        text-xs font-medium text-slate-700 leading-none
        ${readOnly || disabled ? "opacity-50 cursor-not-allowed" : "hover:text-indigo-600"}
        ${className || ""}`}
        >
            <input
                tabIndex={tabIndex ?? undefined}
                type="checkbox"
                required={required}
                checked={value}
                onChange={() => !readOnly && !disabled && setValue(!value)}
                disabled={readOnly || disabled}
                className="
          w-[14px] h-[14px] min-w-[14px] min-h-[14px]
          rounded
          border border-slate-400
          accent-indigo-600
          cursor-pointer
          disabled:cursor-not-allowed
        "
            />
            <span>{name}</span>
        </label>
    );
};


// ─────────────────────────────────────────────────────────────
// JobCardForm — 5-column card layout
// ─────────────────────────────────────────────────────────────
import { IoArrowBackCircleSharp } from "react-icons/io5";
import {
    DropdownInput,
    DropdownInputNew,
    DropdownNew,
    ReusableInput,
    TextInput,
} from "../../../Inputs";
import { orderTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiEdit2, FiPrinter, FiSave } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import { BoardMaster, DieMaster, Gsm, PartyMaster, PlateMaster } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import {
    useAddJobCardMutation,
    useGetJobCardByIdQuery,
    useUpdateJobCardMutation,
} from "../../../redux/uniformService/JobCardService.js";
import { useGetProcessMasterQuery } from "../../../redux/services/ProcessMasterService.js";
import { useGetProcessGroupMasterQuery } from "../../../redux/services/ProcessGroupMaster.service.js";
import secureLocalStorage from "react-secure-storage";
import { useGetBoardMasterQuery } from "../../../redux/services/boardService.js";
import Modal from "../../../UiComponents/Modal/index.js";
import { PDFViewer } from "@react-pdf/renderer";
import tw from "../../../Utils/tailwind-react-pdf.js";
import JobCardPrintFormat from "./JobCardPrintFormat.jsx";
import OrderEntryApi, { useGetOrderEntryQuery } from "../../../redux/uniformService/OrderEntryService.js";
import { useDispatch } from "react-redux";
import { invalidateOrderEntryModule } from "../../../redux/Dispatch/OrderInvalidateTags.js";

// ── Section card ─────────────────────────────────────────────
const SectionCard = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden ${className}`}>
        {title && (
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                    {title}
                </h3>
            </div>
        )}
        <div className="p-3">
            {children}
        </div>
    </div>
);

// ── Column wrapper ────────────────────────────────────────────
const Col = ({ title, children, className = "" }) => (
    <div className={`flex flex-col gap-2.5 gap-y-4 ${className}`}>
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800 pb-1.5 border-b-2 border-slate-700">
            {title}
        </h2>
        {children}
    </div>
);

// ── Field label + input wrapper ───────────────────────────────
const Field = ({ label, children }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {children}
    </div>
);

// ── LV Row (Lamination / Varnish) ─────────────────────────────
// type col is wider (flex-[2]) so long names don't crowd the checkboxes
const LVRow = ({ item, selected, onMain, onFront, onFrontBack, readOnly }) => (
    <div className="flex items-center gap-2 gap-y-4 py-1 border-b border-slate-100 last:border-0">
        <div className="flex-[2] min-w-0">
            <CheckBox
                name={item.name}
                value={!!selected}
                setValue={onMain}
                readOnly={readOnly}
            />
        </div>
        <div className="flex-1 flex justify-center">
            <CheckBox
                name=""
                value={selected?.isFront || false}
                setValue={onFront}
                readOnly={!selected || readOnly}
            />
        </div>
        <div className="flex-1 flex justify-center">
            <CheckBox
                name=""
                value={selected?.isFrontAndBack || false}
                setValue={onFrontBack}
                readOnly={!selected || readOnly}
            />
        </div>
    </div>
);

// ── Shared LV column header ───────────────────────────────────
const LVHeader = () => (
    <div className="flex items-center gap-2 pb-1 mb-1 border-b border-slate-200">
        <span className="flex-[2] text-[9px] font-bold uppercase tracking-wider text-slate-400">Type</span>
        <span className="flex-1 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">Front</span>
        <span className="flex-1 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">F&B</span>
    </div>
);

// ─────────────────────────────────────────────────────────────
const JobCardForm = ({
    onClose,
    id,
    setId,
    readOnly,
    setReadOnly,
    customerList,
    gsmList,
    plateList,
    dieList,
    branchData,
    formOrderCustomerId,
    setFormOrderCustomerId,
    fromOrderId,
    setFromOrderId,
    fromOrderType,
    setFromOrderType,
    fromOrderQty,
    setFromOrderQty,
}) => {
    const today = new Date();

    const [docDate, setDocDate] = useState(moment.utc(today).format("YYYY-MM-DD"));
    const [customerId, setCustomerId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [orderType, setOrderType] = useState("Sample");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [docId, setDocId] = useState("");
    const [orderQty, setOrderQty] = useState("");
    const [printModalOpen, setPrintModalOpen] = useState(false);

    const [gsmId, setGsmId] = useState("");
    const [boardId, setBoardId] = useState("");
    const [fullBoard, setFullBoard] = useState("");
    const [noOfPockets, setNoOfPockets] = useState("");
    const [cuttingSize, setCuttingSize] = useState("");
    const [runningQty, setRunningQty] = useState("");
    const [isFourColor, setIsFourColor] = useState(false);
    const [isCutColor, setIsCutColor] = useState(false);
    const [isFront, setIsFront] = useState(false);
    const [isFrontAndBack, setIsFrontAndBack] = useState(false);

    const [isCMYK, setIsCMYK] = useState(false);
    const [isCutColMachine, setIsCutColMachine] = useState(false);
    const [isFrontMachine, setIsFrontMachine] = useState(false);
    const [isFrontBackMachine, setIsFrontBackMachine] = useState(false);
    const [totalPlateSet, setTotalPlateSet] = useState("");
    const [plateId, setPlateId] = useState("");
    const [dieId, setDieId] = useState("");

    const [boardItems, setBoardItems] = useState([]);
    const [selectedProcesses, setSelectedProcesses] = useState([]);
    const [selectedMachines, setSelectedMachines] = useState([]);
    const [laminations, setLaminations] = useState([]);
    const [varnishes, setVarnishes] = useState([]);
    const [orderEntryId, setOrderEntryId] = useState("");
    const customerRef = useRef(null);
    const { userId, finYearId, branchId, companyId } = getCommonParams();
    const [pendingAction, setPendingAction] = useState(null);
    const [jobRunTime, setJobRunTime] = useState("")
    const dispatch = useDispatch();

    const params = {
        companyId: secureLocalStorage.getItem(
            sessionStorage.getItem("sessionId") + "userCompanyId"
        ),
    };

    const { data: processList, isFetching: isProcessFetching } =
        useGetProcessMasterQuery({ params });
    const { data: boardData, isFetching: isBoardListFetching } =
        useGetBoardMasterQuery({ params });
    const { data: processGroupList, isFetching: isProcessGroupFetching } =
        useGetProcessGroupMasterQuery({ params });
    const { data: orderList } = useGetOrderEntryQuery({
        params: { companyId, branchId },
    });
    // const getGroupIds = (groupName) =>
    //     processGroupList?.data
    //         ?.find((g) => g.name === groupName)
    //         ?.processGroupList?.map((i) => i.id) || [];

    const getGroupIds = (groupName) =>
        processGroupList?.data
            ?.find((g) => g.name === groupName)
            ?.processGroupList?.map((i) => i.processId) || [];

    const filterByGroup = (groupName) =>
        processList?.data?.filter((p) =>
            getGroupIds(groupName).includes(p.id)
        ) || [];

    const boardList = boardData?.data || [];
    const defaultList = filterByGroup("DEFAULT");
    const laminationList = filterByGroup("LAMINATION");
    const varnishList = filterByGroup("VARNISH");
    const machineList = filterByGroup("MACHINE");

    const {
        data: singleData,
        isFetching: isSingleFetching,
        isLoading: isSingleLoading,
    } = useGetJobCardByIdQuery(id, { skip: !id });

    const [addData] = useAddJobCardMutation();
    const [updateData] = useUpdateJobCardMutation();

    const syncFormWithDb = useCallback((data) => {
        setDocId(data?.docId || "New");
        setDocDate(
            data?.docDate
                ? moment.utc(data.docDate).format("YYYY-MM-DD")
                : moment.utc(new Date()).format("YYYY-MM-DD")
        );
        setOrderType(data?.orderType || "Sample");
        setCustomerId(data?.customerId || "");
        setRemarks(data?.remarks || "");
        setOrderQty(data?.orderQty || "");
        setDeliveryDate(
            data?.deliveryDate ? moment.utc(data.deliveryDate).format("YYYY-MM-DD") : ""
        );
        setGsmId(data?.gsmId || "");
        setFullBoard(data?.fullBoard || "");
        setNoOfPockets(data?.noOfPockets || "");
        setCuttingSize(data?.cuttingSize || "");
        setRunningQty(data?.runningQty || "");
        setIsFourColor(data?.isFourColor || false);
        setIsCutColor(data?.isCutColor || false);
        setIsFront(data?.isFront || false);
        setIsFrontAndBack(data?.isFrontAndBack || false);
        setIsCMYK(data?.isCMYK || false);
        setIsCutColMachine(data?.isCutColMachine || false);
        setIsFrontMachine(data?.isFrontMachine || false);
        setIsFrontBackMachine(data?.isFrontBackMachine || false);
        setPlateId(data?.plateId || "");
        setDieId(data?.dieId || "");
        setTotalPlateSet(data?.totalPlateSet || "");
        setBoardItems(data?.boardQualities?.map((b) => b.boardId) || []);
        setSelectedProcesses(data?.processDetails?.map((p) => p.processId) || []);
        setLaminations(
            data?.laminationDetails?.map((l) => ({
                processId: l.laminationId,
                isFront: l.isFront,
                isFrontAndBack: l.isFrontAndBack,
            })) || []
        );
        setVarnishes(
            data?.varnishDetails?.map((v) => ({
                processId: v.varnishId,
                isFront: v.isFront,
                isFrontAndBack: v.isFrontAndBack,
            })) || []
        );
        setSelectedMachines(data?.machineDetails?.map((m) => m.machineId) || []);
        setOrderEntryId(data?.orderEntryId || "");
        setBoardId(data?.boardId || "");
        setJobRunTime(data?.jobRunTime || "");
    }, []);

    useEffect(() => {
        if (id && singleData?.data) syncFormWithDb(singleData.data);
        else syncFormWithDb(undefined);
    }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

    const toggleArr = (setter, val) =>
        setter((prev) =>
            prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]
        );

    const toggleLV = (setter, id) =>
        setter((prev) => {
            const exists = prev.find((l) => l.processId === id);
            return exists
                ? prev.filter((l) => l.processId !== id)
                : [...prev, { processId: id, isFront: false, isFrontAndBack: false }];
        });

    const toggleLVProp = (setter, id, prop) =>
        setter((prev) =>
            prev.map((l) => (l.processId === id ? { ...l, [prop]: !l[prop] } : l))
        );

    const data = {
        id, docDate, branchId, userId, finYearId, orderType, orderQty, customerId,
        boardItems, gsmId, boardId, remarks, fullBoard, noOfPockets, cuttingSize,
        runningQty, isFourColor, isCutColor, isFront, isFrontAndBack, isCMYK,
        isCutColMachine, isFrontMachine, isFrontBackMachine, plateId, dieId,
        totalPlateSet, selectedProcesses, laminations, varnishes, selectedMachines,
        orderEntryId, jobRunTime
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
                        if (returnData.statusCode === 0) {
                            if (!id) {
                                Swal.fire({
                                    icon: "question",
                                    title: "Do You Want to Print?",
                                    showCancelButton: true,
                                    confirmButtonText: "Yes, Print",
                                    cancelButtonText: "No [Esc]",
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
                                if (nextProcess === "new") {
                                    setId(0);
                                    setDocId("New");
                                    syncFormWithDb(undefined);
                                    setTimeout(() => customerRef.current?.focus(), 100);
                                }
                                if (nextProcess === "close") onClose();
                            }
                        } else {
                            toast.error(returnData?.message);
                        }
                    },
                });
                // dispatch(OrderEntryApi.util.invalidateTags(["orderEntry"]));
                invalidateOrderEntryModule();
            }
        } catch (error) {
            console.error("submit error", error);
        }
    };

    const validateData = (data) => {
        const checks = [
            { condition: !data.orderType, title: "Order Type is required!" },
            { condition: !data.orderQty, title: "Order Quantity is required!" },
            { condition: !data.customerId, title: "Customer is required!" },
        ];
        const failed = checks.find((c) => c.condition);
        if (failed) {
            Swal.fire({ icon: "warning", title: failed.title, timer: 1500, showConfirmButton: false });
            return false;
        }
        return true;
    };

    const saveData = (nextProcess) => {
        if (!validateData(data)) return;
        if (id && !window.confirm("Are you sure you want to update the details?")) return;
        if (id) handleSubmitCustom(updateData, data, "Updated", nextProcess);
        else handleSubmitCustom(addData, data, "Added", nextProcess);
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            saveData("close");
        }
    };

    useEffect(() => {
        customerRef.current?.focus();
    }, []);

    useEffect(() => {
        if (formOrderCustomerId && fromOrderId && fromOrderType && fromOrderQty && !id) {
            setCustomerId(formOrderCustomerId);
            setOrderEntryId(fromOrderId);
            setOrderType(fromOrderType);
            setOrderQty(fromOrderQty);
        }
    }, [formOrderCustomerId, fromOrderId, fromOrderType, fromOrderQty]);

    return (
        <>
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
                            customerRef.current?.focus();
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
                    <JobCardPrintFormat
                        singleData={singleData?.data}
                        customerList={customerList}
                        boardList={boardList}
                        gsmList={gsmList}
                        machineList={machineList}
                        plateList={plateList}
                        dieList={dieList}
                        defaultList={defaultList}
                        laminationList={laminationList}
                        varnishList={varnishList}
                        branchData={branchData?.data}
                        orderList={orderList}
                    />
                </PDFViewer>
            </Modal>
            <div className="flex flex-col" onKeyDown={handleKeyDown}>

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex justify-between items-center px-4 py-1 bg-white rounded-md sticky top-0 z-10 shadow-sm">
                    <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        Job Card
                        <ModeChip id={id} readOnly={readOnly} />
                    </h1>
                    <button
                        onClick={onClose}
                        className="text-indigo-500 hover:text-indigo-700 transition-colors"
                        title="Back"
                    >
                        <IoArrowBackCircleSharp className="w-6 h-6" />
                    </button>
                </div>

                {/* ── Body — 5 card columns with gaps ─────────────────── */}
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="grid grid-cols-5 gap-3 items-start">

                        {/* ══ COL 5 — BASIC DETAILS ══════════════════════ */}
                        <Col title="Basic Details">

                            <SectionCard>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                                    <Field label="Job Card No">
                                        <ReusableInput label="" readOnly value={docId} />
                                    </Field>
                                    <Field label="Date">
                                        <ReusableInput label="" value={docDate} type="date" readOnly disabled />
                                    </Field>
                                    <div className="w-[135px]">

                                        <Field label="Order No">
                                            <DropdownNew
                                                name=""
                                                dataList={orderList?.data?.filter(item => item?.approvalStatus?.status === "APPROVED")}
                                                value={orderEntryId}
                                                setValue={setOrderEntryId}
                                                required
                                                readOnly={readOnly}
                                                disabled={readOnly}
                                                otherField={"docId"}
                                                ref={customerRef}
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Order Type">
                                        <DropdownInput
                                            name=""
                                            options={orderTypes}
                                            value={orderType}
                                            setValue={setOrderType}
                                            required
                                            readOnly={readOnly}
                                            disabled={readOnly}
                                        />
                                    </Field>
                                    <Field label="Order Qty">
                                        <TextInput
                                            name=""
                                            value={orderQty}
                                            setValue={setOrderQty}
                                            readOnly={readOnly}
                                            required
                                            type="number"
                                            className="text-right w-full"
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) =>
                                                setOrderQty(e.target.value ? Number(e.target.value).toFixed(3) : "")
                                            }
                                        />
                                    </Field>
                                    <Field label="Job Run Time">
                                        <TextInput
                                            name=""
                                            value={jobRunTime}
                                            setValue={setJobRunTime}
                                            readOnly={readOnly}
                                            required
                                            type="text"
                                            className=" w-full"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </Field>

                                </div>
                                <div className="mt-2">
                                    <Field label="Remarks">
                                        <TextInput name="" value={remarks} setValue={setRemarks}
                                            readOnly={readOnly} className="w-full" />
                                    </Field>
                                </div>
                            </SectionCard>
                            {/* <SectionCard title="">

                                <div className="grid grid-cols-2 gap-x-3 gap-y-2">

                                </div>
                               
                            </SectionCard> */}
                            <SectionCard title="Customer Details">
                                <div className="flex flex-col gap-2">
                                    <Field label="Customer">
                                        <DropdownWithModal
                                            name=""
                                            options={dropDownListObject(
                                                id
                                                    ? customerList?.data?.filter((i) => i?.isCustomer)
                                                    : customerList?.data?.filter((i) => i?.active && i?.isCustomer),
                                                "name", "id"
                                            )}
                                            value={customerId}
                                            setValue={setCustomerId}
                                            required
                                            readOnly={readOnly}
                                            addNewLabel="+ Add New Customer"
                                            childComponent={PartyMaster}
                                            addNewModalWidth="w-[90%] h-[95%]"
                                            disabled={!!id}
                                        />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                        <Field label="Contact Person">
                                            <TextInput name=""
                                                value={findFromList(customerId, customerList?.data, "contactPersonName")}
                                                disabled />
                                        </Field>
                                        <Field label="Phone">
                                            <TextInput name=""
                                                value={findFromList(customerId, customerList?.data, "contactNumber")}
                                                disabled />
                                        </Field>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* <SectionCard title="Order Info"> */}

                        </Col>

                        {/* ══ COL 1 — BOARD DETAILS ══════════════════════ */}
                        <Col title="Board Details">
                            {/* Board Quality — 2 checkboxes per row */}
                            <SectionCard title="Board Quality">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                                    {boardList?.map((item) => (
                                        <CheckBox
                                            key={item.id}
                                            name={item.name}
                                            value={boardItems.includes(item.id)}
                                            setValue={() => toggleArr(setBoardItems, item.id)}
                                            readOnly={readOnly}
                                        />
                                    ))}
                                </div>
                            </SectionCard>

                            {/* Specifications — inputs 2 per row */}
                            <SectionCard title="Specifications">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                    <Field label="GSM">
                                        <DropdownWithModal
                                            name=""
                                            options={dropDownListObject(
                                                id ? gsmList?.data : gsmList?.data?.filter((i) => i?.active),
                                                "name", "id"
                                            )}
                                            value={gsmId}
                                            setValue={setGsmId}
                                            readOnly={readOnly}
                                            addNewLabel="+ Add GSM"
                                            childComponent={Gsm}
                                            addNewModalWidth="w-[30%] h-[45%]"
                                        />
                                    </Field>
                                    <Field label="Others / Board">
                                        <DropdownWithModal
                                            name=""
                                            options={dropDownListObject(
                                                id ? boardData?.data : boardData?.data?.filter((i) => i?.active),
                                                "name", "id"
                                            )}
                                            value={boardId}
                                            setValue={setBoardId}
                                            readOnly={readOnly}
                                            addNewLabel="+ Add Board"
                                            childComponent={BoardMaster}
                                            addNewModalWidth="w-[30%] h-[45%]"
                                        />
                                    </Field>
                                    <Field label="Full Board">
                                        <TextInput name="" value={fullBoard} setValue={setFullBoard}
                                            readOnly={readOnly} type="number" className="text-right w-full" />
                                    </Field>
                                    <Field label="Cutting Size">
                                        <TextInput name="" value={cuttingSize} setValue={setCuttingSize}
                                            readOnly={readOnly} className="w-full" />
                                    </Field>
                                    <Field label="No. of Pockets">
                                        <TextInput name="" value={noOfPockets} setValue={setNoOfPockets}
                                            readOnly={readOnly} type="number" className="w-full text-right" />
                                    </Field>
                                    <Field label="Running Qty">
                                        <TextInput name="" value={runningQty} setValue={setRunningQty}
                                            readOnly={readOnly} type="number" className="w-full text-right" />
                                    </Field>
                                </div>

                                {/* Printing flags — 2 per row */}
                                <div className="grid grid-cols-2 gap-x-3 gap-y-4 mt-2.5 pt-2 border-t border-slate-100">
                                    <CheckBox name="4 Color" value={isFourColor} setValue={setIsFourColor} readOnly={readOnly} />
                                    <CheckBox name="Cut Color" value={isCutColor} setValue={setIsCutColor} readOnly={readOnly} />
                                    <CheckBox name="Front" value={isFront} setValue={setIsFront} readOnly={readOnly} />
                                    <CheckBox name="Front & Back" value={isFrontAndBack} setValue={setIsFrontAndBack} readOnly={readOnly} />
                                </div>
                            </SectionCard>
                        </Col>

                        {/* ══ COL 2 — PROCESS ════════════════════════════ */}
                        <Col title="Process Details">
                            <SectionCard title="Process">
                                <div className="grid grid-cols-1 gap-x-3 gap-y-4 min-h-[365px]">
                                    {defaultList?.map((item) => (
                                        <CheckBox
                                            key={item.id}
                                            name={item.name}
                                            value={selectedProcesses.includes(item.id)}
                                            setValue={() => toggleArr(setSelectedProcesses, item.id)}
                                            readOnly={readOnly}
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                        </Col>

                        {/* ══ COL 3 — VARNISH + LAMINATION (one column) ═ */}
                        <Col title="Varnish & Lamination Details">
                            <SectionCard title="Lamination" className="min-h-[195px]">
                                {laminationList?.length > 0 ? (
                                    <>
                                        <LVHeader />
                                        {laminationList.map((item) => {
                                            const selected = laminations.find((l) => l.processId === item.id);
                                            return (
                                                <LVRow
                                                    key={item.id}
                                                    item={item}
                                                    selected={selected}
                                                    onMain={() => toggleLV(setLaminations, item.id)}
                                                    onFront={() => toggleLVProp(setLaminations, item.id, "isFront")}
                                                    onFrontBack={() => toggleLVProp(setLaminations, item.id, "isFrontAndBack")}
                                                    readOnly={readOnly}
                                                />
                                            );
                                        })}
                                    </>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No lamination options configured.</p>
                                )}
                            </SectionCard>

                            <SectionCard title="Varnish">
                                {varnishList?.length > 0 ? (
                                    <>
                                        <LVHeader />
                                        {varnishList.map((item) => {
                                            const selected = varnishes.find((v) => v.processId === item.id);
                                            return (
                                                <LVRow
                                                    key={item.id}
                                                    item={item}
                                                    selected={selected}
                                                    onMain={() => toggleLV(setVarnishes, item.id)}
                                                    onFront={() => toggleLVProp(setVarnishes, item.id, "isFront")}
                                                    onFrontBack={() => toggleLVProp(setVarnishes, item.id, "isFrontAndBack")}
                                                    readOnly={readOnly}
                                                />
                                            );
                                        })}
                                    </>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No varnish options configured.</p>
                                )}
                            </SectionCard>


                        </Col>

                        {/* ══ COL 4 — MACHINE DETAILS ════════════════════ */}
                        <Col title="Machine Details">

                            <SectionCard title="Machines">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                                    {machineList?.map((item) => (
                                        <CheckBox
                                            key={item.id}
                                            name={item.name}
                                            value={selectedMachines.includes(item.id)}
                                            setValue={() => toggleArr(setSelectedMachines, item.id)}
                                            readOnly={readOnly}
                                        />
                                    ))}
                                    <CheckBox name="CMYK" value={isCMYK} setValue={setIsCMYK} readOnly={readOnly} />
                                    <CheckBox name="Cut Col" value={isCutColMachine} setValue={setIsCutColMachine} readOnly={readOnly} />
                                    <CheckBox name="Front" value={isFrontMachine} setValue={setIsFrontMachine} readOnly={readOnly} />
                                    <CheckBox name="Front & Back" value={isFrontBackMachine} setValue={setIsFrontBackMachine} readOnly={readOnly} />
                                </div>
                            </SectionCard>

                            <SectionCard title="Plate & Die Details">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 min-h-[110px]">
                                    <Field label="Plate Type">
                                        <DropdownWithModal
                                            name=""
                                            options={dropDownListObject(
                                                id ? plateList?.data : plateList?.data?.filter((i) => i?.active),
                                                "name", "id"
                                            )}
                                            value={plateId}
                                            setValue={setPlateId}
                                            readOnly={readOnly}
                                            addNewLabel="+ Add Plate"
                                            childComponent={PlateMaster}
                                            addNewModalWidth="w-[30%] h-[45%]"
                                        />
                                    </Field>
                                    <Field label="Total Plate Set">
                                        <TextInput name="" value={totalPlateSet} setValue={setTotalPlateSet}
                                            readOnly={readOnly} type="number" className="text-right w-full" />
                                    </Field>
                                    <div className="col-span-2">
                                        <Field label="Die Reference">
                                            <DropdownWithModal
                                                name=""
                                                options={dropDownListObject(
                                                    id ? dieList?.data : dieList?.data?.filter((i) => i?.active),
                                                    "name", "id"
                                                )}
                                                value={dieId}
                                                setValue={setDieId}
                                                readOnly={readOnly}
                                                addNewLabel="+ Add Die"
                                                childComponent={DieMaster}
                                                addNewModalWidth="w-[30%] h-[45%]"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </SectionCard>
                        </Col>

                    </div>
                </div>

                {/* ── Footer Actions ──────────────────────────────────── */}
                <div className="flex justify-between items-center px-4 py-2 sticky z-10 shadow-sm">
                    <div className="flex gap-2">
                        <button
                            onClick={() => saveData("close")}
                            disabled={readOnly}
                            className="bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded hover:bg-indigo-600 flex items-center gap-1.5 text-xs font-medium transition-colors"
                        >
                            <HiOutlineRefresh className="w-3.5 h-3.5" />
                            Save & Close
                        </button>
                        <button
                            onClick={() => saveData("new")}
                            disabled={readOnly}
                            className="bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded hover:bg-indigo-600 flex items-center gap-1.5 text-xs font-medium transition-colors"
                        >
                            <FiSave className="w-3.5 h-3.5" />
                            Save & New
                        </button>
                    </div>
                    <div>
                        {id && readOnly && (
                            <button
                                onClick={() => setReadOnly(false)}
                                className="bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 flex items-center gap-1.5 text-xs font-medium transition-colors"
                            >
                                <FiEdit2 className="w-3.5 h-3.5" />
                                Edit
                            </button>
                        )}
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
            </div >
        </>
    );
};

export default JobCardForm;
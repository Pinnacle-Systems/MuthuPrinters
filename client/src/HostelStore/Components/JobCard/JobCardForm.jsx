// ─────────────────────────────────────────────────────────────
// Updated CheckBox Component
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
// JobCardForm — restructured layout
// ─────────────────────────────────────────────────────────────
import { IoArrowBackCircleSharp } from "react-icons/io5";
import {
    DropdownInput,
    ReusableInput,
    TextInput,
} from "../../../Inputs";
import { orderTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiEdit2, FiSave } from "react-icons/fi";
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

// ── Small section heading ────────────────────────────────────
const SectionTitle = ({ children }) => (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 mb-1.5 border-b border-indigo-100 pb-0.5">
        {children}
    </h3>
);

// ── Fieldset card wrapper ────────────────────────────────────
const Card = ({ title, children, className = "" }) => (
    <div className={`border border-slate-200 rounded-md bg-white shadow-sm p-2 ${className}`}>
        {title && <SectionTitle>{title}</SectionTitle>}
        {children}
    </div>
);

// ── Lamination / Varnish row ─────────────────────────────────
const LVRow = ({ item, selected, onMain, onFront, onFrontBack, readOnly }) => (
    <div className="grid grid-cols-3 items-center gap-x-3 py-0.5 border-b border-slate-50 last:border-0">
        <CheckBox
            name={item.name}
            value={!!selected}
            setValue={onMain}
            readOnly={readOnly}
        />
        <CheckBox
            name="Front"
            value={selected?.isFront || false}
            setValue={onFront}
            readOnly={!selected || readOnly}
        />
        <CheckBox
            name="Front & Back"
            value={selected?.isFrontAndBack || false}
            setValue={onFrontBack}
            readOnly={!selected || readOnly}
        />
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
}) => {
    const today = new Date();

    const [docDate, setDocDate] = useState(moment.utc(today).format("YYYY-MM-DD"));
    const [customerId, setCustomerId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [orderType, setOrderType] = useState("Sample");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [docId, setDocId] = useState("");
    const [orderQty, setOrderQty] = useState("");

    // Board Details
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

    // Machine
    const [isCMYK, setIsCMYK] = useState(false);
    const [isCutColMachine, setIsCutColMachine] = useState(false);
    const [isFrontMachine, setIsFrontMachine] = useState(false);
    const [isFrontBackMachine, setIsFrontBackMachine] = useState(false);
    const [totalPlateSet, setTotalPlateSet] = useState("");
    const [plateId, setPlateId] = useState("");
    const [dieId, setDieId] = useState("");

    // Arrays
    const [boardItems, setBoardItems] = useState([]);
    const [selectedProcesses, setSelectedProcesses] = useState([]);
    const [selectedMachines, setSelectedMachines] = useState([]);
    const [laminations, setLaminations] = useState([]);
    const [varnishes, setVarnishes] = useState([]);

    const customerRef = useRef(null);
    const { userId, finYearId, branchId } = getCommonParams();

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

    const getGroupIds = (groupName) =>
        processGroupList?.data
            ?.find((g) => g.name === groupName)
            ?.processGroupList?.map((i) => i.id) || [];

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
    }, []);

    useEffect(() => {
        if (id && singleData?.data) syncFormWithDb(singleData.data);
        else syncFormWithDb(undefined);
    }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

    // ── Toggle helpers ───────────────────────────────────────
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

    // ── Build form payload ───────────────────────────────────
    const data = {
        id,
        docDate,
        branchId,
        userId,
        finYearId,
        orderType,
        orderQty,
        customerId,
        boardItems,
        gsmId,
        boardId,
        remarks,
        fullBoard,
        noOfPockets,
        cuttingSize,
        runningQty,
        isFourColor,
        isCutColor,
        isFront,
        isFrontAndBack,
        isCMYK,
        isCutColMachine,
        isFrontMachine,
        isFrontBackMachine,
        plateId,
        dieId,
        totalPlateSet,
        selectedProcesses,
        laminations,
        varnishes,
        selectedMachines,
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
                        if (returnData.statusCode === 0) {
                            if (nextProcess === "new") {
                                setId(0);
                                setDocId("New");
                                syncFormWithDb(undefined);
                                setTimeout(() => customerRef.current?.focus(), 100);
                            }
                            if (nextProcess === "close") onClose();
                        } else {
                            toast.error(returnData?.message);
                        }
                    },
                });
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

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="flex flex-col bg-slate-50" onKeyDown={handleKeyDown}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex justify-between items-center px-3 py-2 border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
                <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
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

            {/* ── Body ───────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">

                {/* Row 1 — Basic + Customer */}
                <div className="grid grid-cols-2 gap-2">
                    <Card title="Basic Details">
                        <div className="grid grid-cols-4 gap-x-2 gap-y-1">
                            <ReusableInput label="Job Card No" readOnly value={docId} />
                            <ReusableInput label="Date" value={docDate} type="date" readOnly disabled />
                            <DropdownInput
                                name="Order Type"
                                options={orderTypes}
                                value={orderType}
                                setValue={setOrderType}
                                required
                                readOnly={readOnly}
                                disabled={readOnly}
                                ref={customerRef}
                            />
                            <TextInput
                                name="Order Qty"
                                value={orderQty}
                                setValue={setOrderQty}
                                readOnly={readOnly}
                                required
                                type="number"
                                className="text-right"
                                onFocus={(e) => e.target.select()}
                                onBlur={(e) =>
                                    setOrderQty(e.target.value ? Number(e.target.value).toFixed(3) : "")
                                }
                            />
                        </div>
                    </Card>

                    <Card title="Customer Details">
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                            <DropdownWithModal
                                name="Customer"
                                options={dropDownListObject(
                                    id
                                        ? customerList?.data?.filter((i) => i?.isCustomer)
                                        : customerList?.data?.filter((i) => i?.active && i?.isCustomer),
                                    "name",
                                    "id"
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
                            <TextInput
                                name="Contact Person"
                                value={findFromList(customerId, customerList?.data, "contactPersonName")}
                                disabled
                            />
                            <TextInput
                                name="Phone"
                                value={findFromList(customerId, customerList?.data, "contactNumber")}
                                disabled
                            />
                        </div>
                    </Card>
                </div>

                {/* Row 2 — Left / Right columns */}
                <div className="grid grid-cols-2 gap-2">

                    {/* ── LEFT COLUMN ──────────────────────────────── */}
                    <div className="space-y-2">

                        {/* Board Quality checkboxes */}
                        <Card title="Board Quality">
                            <div className="flex flex-wrap gap-x-5 gap-y-2">
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
                        </Card>

                        {/* Board Specifications */}
                        <Card title="Board Specifications">
                            <div className="grid grid-cols-4 gap-x-2 gap-y-1">
                                <DropdownWithModal
                                    name="GSM"
                                    options={dropDownListObject(
                                        id ? gsmList?.data : gsmList?.data?.filter((i) => i?.active),
                                        "name",
                                        "id"
                                    )}
                                    value={gsmId}
                                    setValue={setGsmId}
                                    readOnly={readOnly}
                                    addNewLabel="+ Add New GSM"
                                    childComponent={Gsm}
                                    addNewModalWidth="w-[30%] h-[45%]"
                                />
                                <DropdownWithModal
                                    name="Others / Board"
                                    options={dropDownListObject(
                                        id ? boardData?.data : boardData?.data?.filter((i) => i?.active),
                                        "name",
                                        "id"
                                    )}
                                    value={boardId}
                                    setValue={setBoardId}
                                    readOnly={readOnly}
                                    addNewLabel="+ Add New Board"
                                    childComponent={BoardMaster}
                                    addNewModalWidth="w-[30%] h-[45%]"
                                />
                                <TextInput
                                    name="Full Board"
                                    value={fullBoard}
                                    setValue={setFullBoard}
                                    readOnly={readOnly}
                                    type="number"
                                    className="text-right"
                                />
                                <TextInput
                                    name="No. of Pockets"
                                    value={noOfPockets}
                                    setValue={setNoOfPockets}
                                    readOnly={readOnly}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                                <TextInput
                                    name="Cutting Size"
                                    value={cuttingSize}
                                    setValue={setCuttingSize}
                                    readOnly={readOnly}
                                />
                                <TextInput
                                    name="Running Qty"
                                    value={runningQty}
                                    setValue={setRunningQty}
                                    readOnly={readOnly}
                                    type="number"
                                    className="text-right"
                                />
                            </div>

                            {/* Printing flags */}
                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 pt-1.5 border-t border-slate-100">
                                <CheckBox name="4 Color" value={isFourColor} setValue={setIsFourColor} readOnly={readOnly} />
                                <CheckBox name="Cut Color" value={isCutColor} setValue={setIsCutColor} readOnly={readOnly} />
                                <CheckBox name="Front" value={isFront} setValue={setIsFront} readOnly={readOnly} />
                                <CheckBox name="Front & Back" value={isFrontAndBack} setValue={setIsFrontAndBack} readOnly={readOnly} />
                            </div>
                        </Card>

                        {/* Varnish */}
                        <Card title="Varnish Details">
                            {varnishList?.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-3 gap-x-3 mb-1 px-0.5">
                                        {["Type", "Front", "Front & Back"].map((h) => (
                                            <span key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                                {h}
                                            </span>
                                        ))}
                                    </div>
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
                        </Card>
                    </div>

                    {/* ── RIGHT COLUMN ─────────────────────────────── */}
                    <div className="space-y-2">

                        {/* Process */}
                        <Card title="Process">
                            <div className="flex flex-wrap gap-x-5 gap-y-2">
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
                        </Card>

                        {/* Lamination */}
                        <Card title="Lamination Details">
                            {laminationList?.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-3 gap-x-3 mb-1 px-0.5">
                                        {["Type", "Front", "Front & Back"].map((h) => (
                                            <span key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                                {h}
                                            </span>
                                        ))}
                                    </div>
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
                        </Card>

                        {/* Machine */}
                        <Card title="Machine Details">
                            <div className="flex flex-wrap gap-x-5 gap-y-2">
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

                            {/* Plate / Die / Total */}
                            <div className="grid grid-cols-3 gap-x-2 gap-y-1 mt-2 pt-1.5 border-t border-slate-100">
                                <DropdownWithModal
                                    name="Plate Details"
                                    options={dropDownListObject(
                                        id ? plateList?.data : plateList?.data?.filter((i) => i?.active),
                                        "name",
                                        "id"
                                    )}
                                    value={plateId}
                                    setValue={setPlateId}
                                    readOnly={readOnly}
                                    addNewLabel="+ Add Plate"
                                    childComponent={PlateMaster}
                                    addNewModalWidth="w-[30%] h-[45%]"
                                />
                                <TextInput
                                    name="Total Plate Sets"
                                    value={totalPlateSet}
                                    setValue={setTotalPlateSet}
                                    readOnly={readOnly}
                                    type="number"
                                    className="text-right"
                                />
                                <DropdownWithModal
                                    name="Die Details"
                                    options={dropDownListObject(
                                        id ? dieList?.data : dieList?.data?.filter((i) => i?.active),
                                        "name",
                                        "id"
                                    )}
                                    value={dieId}
                                    setValue={setDieId}
                                    readOnly={readOnly}
                                    addNewLabel="+ Add Die"
                                    childComponent={DieMaster}
                                    addNewModalWidth="w-[30%] h-[45%]"
                                />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Row 3 — Remarks */}
                {/* <Card>
                    <TextInput
                        name="Remarks"
                        value={remarks}
                        setValue={setRemarks}
                        readOnly={readOnly}
                    />
                </Card> */}
            </div>

            {/* ── Footer Actions ──────────────────────────────────── */}
            <div className="flex justify-between items-center px-3 py-2 border-t border-slate-200 bg-white sticky bottom-0 z-10 shadow-sm">
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
                </div>
            </div>
        </div>
    );
};

export default JobCardForm;
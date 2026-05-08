import { IoArrowBackCircleSharp } from "react-icons/io5";
import { DropdownInput, DropdownNew, ReusableInput, TextInput } from "../../../Inputs";
import { productionTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiCheck, FiEdit2, FiPrinter, FiSave, FiSend } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import { BoardMaster, DieMaster, Gsm, PlateMaster, Size } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import { useAddJobCardMutation, useGetJobCardByIdQuery, useUpdateJobCardMutation } from "../../../redux/uniformService/JobCardService.js";
import { useGetProcessMasterQuery } from "../../../redux/services/ProcessMasterService.js";
import { useGetProcessGroupMasterQuery } from "../../../redux/services/ProcessGroupMaster.service.js";
import secureLocalStorage from "react-secure-storage";
import { useGetBoardMasterQuery } from "../../../redux/services/boardService.js";
import Modal from "../../../UiComponents/Modal/index.js";
import { PDFViewer } from "@react-pdf/renderer";
import tw from "../../../Utils/tailwind-react-pdf.js";
import JobCardPrintFormat from "./JobCardPrintFormat.jsx";
import { useGetRefListQuery, useLazyGetOrderEntryByIdQuery } from "../../../redux/uniformService/OrderEntryService.js";
import { invalidateOrderEntryModule } from "../../../redux/Dispatch/OrderInvalidateTags.js";
import { ProcessRoutePanel, routeKeysToDb } from "./ProcessRoutePanel.jsx";
import { useAddApprovalStausMutation } from "../../../redux/uniformService/PoServices.js";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService.js";
import TransactionLayout from "../../../Basic/components/Reuseable/TransactionLayout.jsx";
import { QRCodeCanvas } from "qrcode.react";
import { CheckBox, Field, LVHeader, LVRow, SectionCard } from "./Utils.jsx";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService.js";

const JobCardForm = ({
    onClose, id, setId, readOnly, setReadOnly,
    customerList, gsmList, plateList, dieList, branchData,
    formOrderCustomerId, fromOrderId, fromOrderType, fromOrderQty,
    canApprove, userData, employeeList
}) => {
    const today = new Date();
    const [docDate, setDocDate] = useState(moment.utc(today).format("YYYY-MM-DD"));
    const [customerId, setCustomerId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [orderType, setOrderType] = useState("ORDER");
    const [docId, setDocId] = useState("");
    const [orderQty, setOrderQty] = useState("");
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [gsmId, setGsmId] = useState("");
    const [boardId, setBoardId] = useState("");
    const [fullBoardId, setFullBoardId] = useState("");
    const [noOfPockets, setNoOfPockets] = useState("");
    const [cuttingSizeId, setCuttingSizeId] = useState("");
    const [runningQty, setRunningQty] = useState("");
    const [isFourColor, setIsFourColor] = useState(false);
    const [isCutColor, setIsCutColor] = useState(false);
    const [isFront, setIsFront] = useState(false);
    const [isFrontAndBack, setIsFrontAndBack] = useState(false);
    const [isCMYK, setIsCMYK] = useState(false);
    const [isCutColMachine, setIsCutColMachine] = useState(false);
    const [isFrontMachine, setIsFrontMachine] = useState(false);
    const [isFrontBackMachine, setIsFrontBackMachine] = useState(false);
    const [totalPlatesets, setTotalPlatesets] = useState("");
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
    const [jobRunTime, setJobRunTime] = useState("");
    const [processRoute, setProcessRoute] = useState([]);
    const [approvalModal, setApprovalModal] = useState(false);
    const [actionType, setActionType] = useState("");
    const [approvalRemarks, setApprovalRemarks] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [productionType, setProductionType] = useState("SAMPLE");
    const [styleItemId, setStyleItemId] = useState("");
    const [tagCardUps, setTagCardUps] = useState("");
    const [itemGroupId, setItemGroupId] = useState("")
    const [itemType, setItemType] = useState("");
    const [followUpId, setFollowUpId] = useState("");
    const [designerId, setDesignerId] = useState("");
    const [labelQuality, setLabelQuality] = useState("");
    const [block, setBlock] = useState("");
    const [labelQty, setLabelQty] = useState("");
    const [rollQty, setRollQty] = useState("");
    const [cutAndSeal, setCutAndSeal] = useState("");
    const [orderStyleItems, setOrderStyleItems] = useState([]);
    const [jobCardSizeDetails, setJobCardSizeDetails] = useState([]);
    const [selectedOrderData, setSelectedOrderData] = useState(null);
    const [trackingType, setTrackingType] = useState("Barcode");
    const [sizeModalOpen, setSizeModalOpen] = useState(false);

    const qrRef = useRef(null);

    const params = { companyId: secureLocalStorage.getItem(sessionStorage.getItem("sessionId") + "userCompanyId") };

    const { data: processList } = useGetProcessMasterQuery({ params });
    const { data: boardData } = useGetBoardMasterQuery({ params });
    const { data: processGroupList } = useGetProcessGroupMasterQuery({ params });
    const { data: orderList } = useGetRefListQuery({ params: { companyId, branchId } });
    const { data: styleItemList } = useGetStyleItemMasterQuery({ params: { companyId, branchId } });
    const { data: sizeList } = useGetSizeMasterQuery({ params: { companyId, branchId } });

    const getGroupIds = (groupName) =>
        processGroupList?.data?.find((g) => g.name === groupName)?.processGroupList?.map((i) => i.processId) || [];
    const filterByGroup = (groupName) =>
        processList?.data?.filter((p) => getGroupIds(groupName).includes(p.id)) || [];

    const boardList = boardData?.data || [];
    const defaultList = filterByGroup("DEFAULT");
    const laminationList = filterByGroup("LAMINATION");
    const varnishList = filterByGroup("VARNISH");
    const machineList = filterByGroup("MACHINE");

    const { data: singleData, isFetching: isSingleFetching, isLoading: isSingleLoading } =
        useGetJobCardByIdQuery(id, { skip: !id });
    const status = singleData?.data?.approvalStatus?.status;
    const isDisabled = (status === "APPROVED" || status === "PENDING") && !canApprove;

    const [addData] = useAddJobCardMutation();
    const [updateData] = useUpdateJobCardMutation();
    const [addApprovalStatus] = useAddApprovalStausMutation();
    const [getOrderById] = useLazyGetOrderEntryByIdQuery()

    const syncFormWithDb = useCallback((data) => {
        setDocId(data?.docId || "New");
        setDocDate(data?.docDate ? moment.utc(data.docDate).format("YYYY-MM-DD") : moment.utc(new Date()).format("YYYY-MM-DD"));
        setOrderType(data?.orderType || "ORDER");
        setProductionType(data?.productionType || "SAMPLE");
        setCustomerId(data?.customerId || "");
        setRemarks(data?.remarks || "");
        setOrderQty(data?.orderQty || "");
        setGsmId(data?.gsmId || "");
        setFullBoardId(data?.fullBoardId || "");
        setNoOfPockets(data?.noOfPockets || "");
        setCuttingSizeId(data?.cuttingSizeId || "");
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
        setTotalPlatesets(data?.totalPlatesets || "");
        setBoardItems(data?.boardQualities?.map((b) => b.boardId) || []);
        setSelectedProcesses(data?.processDetails?.map((p) => p.processId) || []);
        setLaminations(data?.laminationDetails?.map((l) => ({ processId: l.laminationId, isFront: l.isFront, isFrontAndBack: l.isFrontAndBack })) || []);
        setVarnishes(data?.varnishDetails?.map((v) => ({ processId: v.varnishId, isFront: v.isFront, isFrontAndBack: v.isFrontAndBack })) || []);
        setSelectedMachines(data?.machineDetails?.map((m) => m.machineId) || []);
        setOrderEntryId(data?.orderEntryId || "");
        setBoardId(data?.boardId || "");
        setJobRunTime(data?.jobRunTime || "");
        setProcessRoute(
            data?.processRoute
                ? [...data.processRoute].sort((a, b) => a.sequence - b.sequence)
                    .map((r) => { const sub = r.isFront ? "front" : r.isFrontAndBack ? "frontback" : ""; return `${r.type}:${r.processId}${sub ? `:${sub}` : ""}`; })
                : []
        );
        setStyleItemId(data?.styleItemId || "");
        setTagCardUps(data?.tagCardUps || "");
        setItemGroupId(data?.itemGroupId || "");
        setItemType(data?.itemType || "");
        setFollowUpId(data?.followUpId || "");
        setDesignerId(data?.designerId || "");
        setLabelQuality(data?.labelQuality || "");
        setBlock(data?.block || "");
        setLabelQty(data?.labelQty || "");
        setRollQty(data?.rollQty || "");
        setCutAndSeal(data?.cutAndSeal || "");
        setJobCardSizeDetails(data?.jobCardSizeDetails || []);
        setTrackingType(data?.trackingType || "");
    }, []);

    useEffect(() => {
        if (id && singleData?.data) syncFormWithDb(singleData.data);
        else syncFormWithDb(undefined);
    }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

    const toggleArr = (setter, val) =>
        setter((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
    const toggleLV = (setter, pid) =>
        setter((prev) => { const exists = prev.find((l) => l.processId === pid); return exists ? prev.filter((l) => l.processId !== pid) : [...prev, { processId: pid, isFront: false, isFrontAndBack: false }]; });
    const toggleLVProp = (setter, pid, prop) =>
        setter((prev) => prev.map((l) => (l.processId === pid ? { ...l, [prop]: !l[prop] } : l)));

    const formData = {
        id, docDate, branchId, userId, finYearId, orderType, orderQty, customerId,
        boardItems, gsmId, boardId, remarks, fullBoardId, noOfPockets, cuttingSizeId,
        runningQty, isFourColor, isCutColor, isFront, isFrontAndBack, isCMYK,
        isCutColMachine, isFrontMachine, isFrontBackMachine, plateId, dieId,
        totalPlatesets, selectedProcesses, laminations, varnishes, selectedMachines,
        orderEntryId, jobRunTime, processRoute: routeKeysToDb(processRoute),
        productionType, styleItemId, tagCardUps, itemGroupId, itemType, followUpId, designerId,
        labelQuality, block, labelQty, rollQty, cutAndSeal,
        jobCardSizeDetails, trackingType
    };

    const handleSubmitCustom = async (callback, data, text, nextProcess) => {
        try {
            const returnData = await callback(data).unwrap();
            if (returnData.statusCode === 1) { toast.error(returnData.message); return; }
            Swal.fire({
                icon: "success", title: `${text || "Saved"} Successfully`, showConfirmButton: false, timer: 2000,
                didClose: () => {
                    if (returnData.statusCode === 0) {
                        if (!id) {
                            Swal.fire({ icon: "question", title: "Do You Want to Print?", showCancelButton: true, confirmButtonText: "Yes, Print", cancelButtonText: "No [Esc]", confirmButtonColor: "#3085d6", cancelButtonColor: "#6b7280", focusConfirm: true, allowEnterKey: true, allowEscapeKey: true })
                                .then((result) => {
                                    if (result.isConfirmed) { setPrintModalOpen(true); if (returnData?.data?.id) setId(returnData.data.id); setPendingAction(nextProcess); }
                                    else { if (nextProcess === "new") { syncFormWithDb(undefined); setId(""); setDocId("New"); setTimeout(() => customerRef.current?.focus(), 300); } if (nextProcess === "close") onClose(); }
                                });
                        } else {
                            if (nextProcess === "new") { setId(0); setDocId("New"); syncFormWithDb(undefined); setTimeout(() => customerRef.current?.focus(), 100); }
                            if (nextProcess === "close") onClose();
                        }
                    } else { toast.error(returnData?.message); }
                },
            });
            invalidateOrderEntryModule();
        } catch (error) { console.error("submit error", error); }
    };

    const validateData = (d) => {
        const checks = [
            { condition: !d.customerId, title: "Customer is required!" },
            { condition: !d.docDate, title: "Document Date is required!" },
            { condition: !d.orderType, title: "Order Type is required!" },
            { condition: !d.orderEntryId, title: "Order No is required!" },
            { condition: !d.productionType, title: "Production Type is required!" },
            { condition: !d.styleItemId, title: "Item Description is required!" },
            { condition: !d.orderQty, title: "Order Quantity is required!" },
            { condition: !d.customerId, title: "Customer is required!" },
            { condition: !d.followUpId, title: "Follow-Up is required!" },
            { condition: !d.designerId, title: "Designer is required!" }
        ];
        const failed = checks.find((c) => c.condition);
        if (failed) { Swal.fire({ icon: "warning", title: failed.title, timer: 1500, showConfirmButton: false }); return false; }
        return true;
    };

    const saveData = (nextProcess, options = {}) => {
        const submitApprovalFlag = !!options.submitApproval;
        if (!validateData(formData)) return;
        if (id && !window.confirm("Are you sure you want to update the details?")) return;
        const payload = { ...formData, ...(submitApprovalFlag ? { submitApproval: true } : {}) };
        if (id) handleSubmitCustom(updateData, payload, "Updated", nextProcess);
        else handleSubmitCustom(addData, payload, "Added", nextProcess);
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveData("close"); }
    };

    useEffect(() => { customerRef.current?.focus(); }, []);
    useEffect(() => {
        if (formOrderCustomerId && fromOrderId && fromOrderType && !id) {
            setCustomerId(formOrderCustomerId); setOrderEntryId(fromOrderId);
            setOrderType(fromOrderType); setOrderQty(fromOrderQty);
        }
    }, [formOrderCustomerId, fromOrderId, fromOrderType, fromOrderQty]);

    useEffect(() => {
        const loadOrderStyleItems = async () => {
            if (!orderEntryId) {
                setOrderStyleItems([]);
                return;
            }

            try {
                const res = await getOrderById(orderEntryId).unwrap();

                setOrderStyleItems(
                    res?.data?.orderItems?.map(item => item?.styleItemId) || []
                );
            } catch (err) {
                console.error("Failed to load order style items", err);
            }
        };

        loadOrderStyleItems();
    }, [orderEntryId]);

    const handleApprovalAction = (type) => { setActionType(type); setApprovalRemarks(""); setApprovalModal(true); };
    const handleConfirmAction = async () => {
        if (actionType === "REJECT" && !approvalRemarks.trim()) { toast.warning("Remarks required for sending back!"); return; }
        setActionLoading(true);
        try {
            const result = await addApprovalStatus({ userId: userData?.id, remarks: approvalRemarks || null, actionType, referenceId: id, referencePage: "JOB CARD", recordData: {} }).unwrap();
            if (result.statusCode === 0) { toast.success(result.message || (actionType === "APPROVE" ? "Job Card Approved!" : "Sent Back for Review!")); setApprovalModal(false); onClose(); }
            else { toast.error(result.message || "Action failed"); setApprovalModal(false); }
        } catch (err) { toast.error(err?.data?.message || "Something went wrong!"); setApprovalModal(false); }
        finally { setActionLoading(false); }
    };

    const headerContent = (
        <div className="flex flex-col xl:flex-row gap-1">
            <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Basic Details</h2>
                <div className="flex gap-2">
                    <div className="w-28"><ReusableInput label="Job Card No" readOnly value={docId} /></div>
                    <div className="w-28"><ReusableInput label="Job Card Date" value={docDate} type="date" readOnly disabled /></div>
                </div>
            </div>

            <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Customer Details</h2>
                <div className="w-64 px-1">
                    <DropdownNew name="Customer"
                        dataList={id ? customerList?.data?.filter((i) => i?.isCustomer) : customerList?.data?.filter((i) => i?.active && i?.isCustomer)}
                        value={customerId} setValue={setCustomerId} required readOnly={readOnly} disabled={readOnly} ref={customerRef} />

                </div>
            </div>

            <div className="flex-1 border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Order Details</h2>
                <div className="flex gap-2 flex-wrap px-1">
                    <div className="w-44">
                        <DropdownNew name="Order No"
                            dataList={orderList?.data?.filter(item =>
                                ["APPROVED", "NOT_CONFIGURED"].includes(
                                    item?.approvalStatus?.status
                                ) &&
                                item?.customerId === customerId
                            )} value={orderEntryId} setValue={setOrderEntryId} required readOnly={readOnly} disabled={readOnly} otherField={"docId"}
                            beforeChange={async (selectedValue) => {
                                if (!selectedValue) {
                                    setProductionType("SAMPLE");
                                    setStyleItemId("");
                                    setOrderQty("");
                                    setTagCardUps("");
                                    setJobRunTime("");
                                    setOrderStyleItems([]);
                                    setSelectedOrderData(null);
                                    setJobCardSizeDetails([]);
                                    return;
                                }

                                const res = await getOrderById(selectedValue?.id).unwrap();
                                setSelectedOrderData(res?.data);
                                setItemGroupId("");
                                setItemType("");
                                setStyleItemId("");
                                setOrderQty("");
                                setJobCardSizeDetails([]);
                                setBoardItems([]);
                                setSelectedProcesses([]);
                                setSelectedMachines([]);
                                setLaminations([]);
                                setVarnishes([]);
                                setProductionType(res?.data?.productionType);
                                setOrderStyleItems(res?.data?.orderItems?.map(item => item?.styleItemId) || []);
                            }}
                        />

                    </div>
                    <div className="w-28">
                        <DropdownInput name="Production Type" options={productionTypes} value={productionType} setValue={setProductionType} required readOnly={true} disabled={readOnly} />
                    </div>
                    <div className="w-48">
                        <DropdownNew name="Item Description" dataList={styleItemList?.data?.filter(item =>
                            orderStyleItems ? orderStyleItems.includes(item.id) : true
                        )} value={styleItemId} setValue={setStyleItemId} required readOnly={readOnly} disabled={readOnly}
                            beforeChange={
                                (selectedValue) => {
                                    setItemGroupId(selectedValue?.itemGroupId);
                                    setItemType(selectedValue?.ItemGroup?.name);
                                    const selectedOrderItem =
                                        selectedOrderData?.orderItems?.find(
                                            item => item.styleItemId === selectedValue?.id
                                        );

                                    // ✅ SET ORDER QTY
                                    setOrderQty(selectedOrderItem?.orderQty || "");
                                    setTrackingType(selectedOrderItem?.trackingType || "");
                                    // ✅ SET SIZE BREAKUP
                                    setJobCardSizeDetails(
                                        selectedOrderItem?.sizeBreakup?.map((s) => ({
                                            sizeId: s.sizeId || "",
                                            qty: s.qty || "",
                                            barcodeFrom: s.barcodeFrom || "",
                                            barcodeTo: s.barcodeTo || "",
                                        })) || []
                                    );
                                    setBoardItems([]);
                                    setSelectedProcesses([]);
                                    setSelectedMachines([]);
                                    setLaminations([]);
                                    setVarnishes([]);

                                }
                            }
                        />
                    </div>
                    {
                        itemType !== "LABEL" && (
                            <>

                                <div className="w-20">
                                    <TextInput name="Order Qty" value={orderQty} setValue={setOrderQty} readOnly={true} required type="number"
                                        className="text-right w-full" onFocus={(e) => e.target.select()}
                                        onBlur={(e) => setOrderQty(e.target.value ? Number(e.target.value).toFixed(3) : "")} />
                                </div>
                                <div className="w-28">
                                    <TextInput name="Tag/Card Ups" value={tagCardUps} setValue={setTagCardUps} readOnly={readOnly} className="w-full text-right" onFocus={(e) => e.target.select()} />
                                </div>
                                <div className="w-28">
                                    <TextInput name="Job Run Time" value={jobRunTime} setValue={setJobRunTime} readOnly={readOnly} className="w-full" onFocus={(e) => e.target.select()} />
                                </div>
                            </>)
                    }
                    <div className="w-56">

                        <DropdownNew name="Follow Up"
                            dataList={id ? employeeList?.data : employeeList?.data?.filter((i) => i?.active)}
                            value={followUpId} setValue={setFollowUpId} required readOnly={readOnly} disabled={readOnly} />
                    </div>
                    <div className="w-56">
                        <DropdownNew name="Designer"
                            dataList={id ? employeeList?.data : employeeList?.data?.filter((i) => i?.active)}
                            value={designerId} setValue={setDesignerId} required readOnly={readOnly} disabled={readOnly} />
                    </div>

                </div>
            </div>

            <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-xs font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">QR Code</h2>
                {docId && docId !== "New" ? (
                    <div className=" justify-center items-center gap-2">
                        <QRCodeCanvas
                            ref={qrRef}
                            value={JSON.stringify({ id, docId })}
                            size={80}
                            className="border border-slate-200 rounded mx-auto my-2"
                        />
                        <span className="text-xs text-slate-400 ">Scan to identify order</span>
                    </div>
                ) : (
                    <div className="flex justify-center items-center mt-2 gap-2 w-28">
                        <div className="w-20 h-20 flex items-center m-auto justify-center border border-dashed border-slate-300 rounded text-slate-400 text-xs text-center px-2">
                            QR appears after save
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const gridItemsContent = (
        <div className="h-full overflow-auto">
            {
                itemType !== "LABEL" && (
                    <div className="grid grid-cols-4  gap-x-2 items-start min-w-max">

                        {/* COL 1 — Board */}
                        <div className="flex flex-col gap-2">
                            <SectionCard title="Board Quality">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                                    {boardList?.map((item) => (
                                        <CheckBox key={item.id} name={item.name} value={boardItems.includes(item.id)}
                                            setValue={() => toggleArr(setBoardItems, item.id)} readOnly={readOnly} />
                                    ))}
                                </div>
                            </SectionCard>
                            <SectionCard title="Specifications">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                    <Field label="GSM">
                                        <DropdownWithModal name="" options={dropDownListObject(id ? gsmList?.data : gsmList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={gsmId} setValue={setGsmId} readOnly={readOnly} addNewLabel="+ Add GSM" childComponent={Gsm} addNewModalWidth="w-[30%] h-[45%]" />
                                    </Field>
                                    <Field label="Others / Board">
                                        <DropdownWithModal name="" options={dropDownListObject(id ? boardData?.data : boardData?.data?.filter((i) => i?.active), "name", "id")}
                                            value={boardId} setValue={setBoardId} readOnly={readOnly} addNewLabel="+ Add Board" childComponent={BoardMaster} addNewModalWidth="w-[30%] h-[45%]" />
                                    </Field>
                                    <Field label="Full Board">
                                        <DropdownWithModal name="" options={dropDownListObject(id ? sizeList?.data : sizeList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={fullBoardId} setValue={setFullBoardId} readOnly={readOnly} addNewLabel="+ Add Size" childComponent={Size} addNewModalWidth="w-[30%] h-[45%]" />
                                        {/* <TextInput name="" value={fullBoardId} setValue={setFullBoardId} readOnly={readOnly} type="number" className="text-right w-full" /> */}
                                    </Field>
                                    <Field label="Cutting Size">
                                        <DropdownWithModal name="" options={dropDownListObject(id ? sizeList?.data : sizeList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={cuttingSizeId} setValue={setCuttingSizeId} readOnly={readOnly} addNewLabel="+ Add Size" childComponent={Size} addNewModalWidth="w-[30%] h-[45%]" />
                                        {/* <TextInput name="" value={cuttingSizeId} setValue={setCuttingSizeId} readOnly={readOnly} className="w-full" /> */}
                                    </Field>
                                    <Field label="No. of Pockets">
                                        <TextInput name="" value={noOfPockets} setValue={setNoOfPockets} readOnly={readOnly} type="number" className="w-full text-right" />
                                    </Field>
                                    <Field label="Running Qty">
                                        <TextInput name="" value={runningQty} setValue={setRunningQty} readOnly={readOnly} type="number" className="w-full text-right" />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-3 mt-2.5 pt-2 border-t border-slate-100">
                                    <CheckBox name="4 Color" value={isFourColor} setValue={setIsFourColor} readOnly={readOnly} />
                                    <CheckBox name="Cut Color" value={isCutColor} setValue={setIsCutColor} readOnly={readOnly} />
                                    <CheckBox name="Front" value={isFront} setValue={setIsFront} readOnly={readOnly} />
                                    <CheckBox name="Front & Back" value={isFrontAndBack} setValue={setIsFrontAndBack} readOnly={readOnly} />
                                </div>
                            </SectionCard>
                        </div>

                        {/* COL 2 — Process */}
                        <div className="flex flex-col gap-2">
                            <SectionCard title="Process Details">
                                <div className="grid grid-cols-2 gap-y-4 min-h-[165px]">
                                    {defaultList?.map((item) => (
                                        <CheckBox key={item.id} name={item.name} value={selectedProcesses.includes(item.id)}
                                            setValue={() => toggleArr(setSelectedProcesses, item.id)} readOnly={readOnly} />
                                    ))}
                                </div>
                            </SectionCard>
                            <SectionCard title="Lamination Details">
                                {laminationList?.length > 0
                                    ? (<><LVHeader />{laminationList.map((item) => { const sel = laminations.find((l) => l.processId === item.id); return <LVRow key={item.id} item={item} selected={sel} onMain={() => toggleLV(setLaminations, item.id)} onFront={() => toggleLVProp(setLaminations, item.id, "isFront")} onFrontBack={() => toggleLVProp(setLaminations, item.id, "isFrontAndBack")} readOnly={readOnly} />; })}</>)
                                    : <p className="text-xs text-slate-400 italic">No lamination options configured.</p>}
                            </SectionCard>
                        </div>

                        {/* COL 3 — Lamination + Varnish */}
                        <div className="flex flex-col gap-2">

                            <SectionCard title="Varnish Details">
                                {varnishList?.length > 0
                                    ? (<><LVHeader />{varnishList.map((item) => { const sel = varnishes.find((v) => v.processId === item.id); return <LVRow key={item.id} item={item} selected={sel} onMain={() => toggleLV(setVarnishes, item.id)} onFront={() => toggleLVProp(setVarnishes, item.id, "isFront")} onFrontBack={() => toggleLVProp(setVarnishes, item.id, "isFrontAndBack")} readOnly={readOnly} />; })}</>)
                                    : <p className="text-xs text-slate-400 italic">No varnish options configured.</p>}
                            </SectionCard>
                            <SectionCard title="Machines">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-4 min-h-[132px]">
                                    {machineList?.map((item) => (
                                        <CheckBox key={item.id} name={item.name} value={selectedMachines.includes(item.id)}
                                            setValue={() => toggleArr(setSelectedMachines, item.id)} readOnly={readOnly} />
                                    ))}
                                </div>
                            </SectionCard>
                        </div>

                        {/* COL 4 — Machine */}
                        <div className="flex flex-col gap-2">

                            <SectionCard title="Machine Specifications">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                                    <CheckBox name="CMYK" value={isCMYK} setValue={setIsCMYK} readOnly={readOnly} />
                                    <CheckBox name="Cut Col" value={isCutColMachine} setValue={setIsCutColMachine} readOnly={readOnly} />
                                    <CheckBox name="Front" value={isFrontMachine} setValue={setIsFrontMachine} readOnly={readOnly} />
                                    <CheckBox name="Front & Back" value={isFrontBackMachine} setValue={setIsFrontBackMachine} readOnly={readOnly} />
                                </div>
                            </SectionCard>
                            <SectionCard title="Plate & Die Details">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                    <Field label="Plate Details">
                                        <DropdownWithModal name="" options={dropDownListObject(id ? plateList?.data : plateList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={plateId} setValue={setPlateId} readOnly={readOnly} addNewLabel="+ Add Plate" childComponent={PlateMaster} addNewModalWidth="w-[30%] h-[45%]" />
                                    </Field>
                                    <Field label="Die Details">
                                        <DropdownWithModal name="" options={dropDownListObject(id ? dieList?.data : dieList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={dieId} setValue={setDieId} readOnly={readOnly} addNewLabel="+ Add Die" childComponent={DieMaster} addNewModalWidth="w-[30%] h-[45%]" />
                                    </Field>
                                    <div className="col-span-2">

                                        <Field label="Total Plate Sets">
                                            <TextInput name="" value={totalPlatesets} setValue={setTotalPlatesets} readOnly={readOnly} className=" w-full" />
                                        </Field>
                                    </div>
                                </div>
                            </SectionCard>
                            <SectionCard title="Size Details">
                                <div className="flex-1 min-w-[120px] h-[70px] justify-center items-center">
                                    <button onClick={() => setSizeModalOpen(true)} className="border w-auto  rounded-md text-[10px] bg-green-700 font-semibold uppercase tracking-wider text-white p-1">
                                        View Size Details
                                    </button>
                                </div>
                            </SectionCard>
                        </div>

                    </div>

                )
            }
            {
                itemType === "LABEL" && (
                    <div className="flex items-start min-w-max mx-2">
                        <div className="w-full h-full">
                            <SectionCard title="Label Details" className="max-w-full">
                                <div className="flex gap-16">

                                    <div className="grid grid-cols-1 gap-x-3 gap-y-2 h-full">
                                        <div className="w-40">


                                            <TextInput name="Label Quality" value={labelQuality} setValue={setLabelQuality} readOnly={readOnly} className="w-full" />

                                        </div>
                                        <div className="w-40">

                                            <TextInput name="Block" value={block} setValue={setBlock} readOnly={readOnly} className="w-full" />

                                        </div>
                                        <div className="w-40">

                                            <TextInput name="Label Qty" value={orderQty} setValue={setOrderQty} readOnly={true} type="number" className="w-full text-right" />

                                        </div>
                                        <div className="w-40">

                                            <TextInput name="Roll Qty" value={rollQty} setValue={setRollQty} readOnly={readOnly} type="number" className="w-full text-right" />

                                        </div>
                                        <div className="w-40">


                                            <TextInput name="Cut & Seal" value={cutAndSeal} setValue={setCutAndSeal} readOnly={readOnly} className="w-full" />

                                        </div>

                                    </div>
                                    <div>
                                        {/* Main content area */}
                                        <div className="bg-white px-4 py-1 shadow-sm">
                                            <h3 className="text-[12px] font-medium text-slate-700 mb-3">
                                                {trackingType === "Barcode"
                                                    ? "Barcode wise Details"
                                                    : trackingType ===
                                                        "SizeTemplateBarcode"
                                                        ? "Size + Barcode wise Details"
                                                        : "Size wise Details"}
                                            </h3>
                                            <div className=" overflow-y-auto">
                                                {/* --- BARCODE TYPE TABLE --- */}
                                                {trackingType === "Barcode" && (
                                                    <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                                                        <thead>
                                                            <tr>
                                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-11">
                                                                    S.No
                                                                </th>
                                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase">
                                                                    Barcode From
                                                                </th>
                                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase">
                                                                    Barcode To
                                                                </th>
                                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-24">
                                                                    Qty
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {jobCardSizeDetails?.map(
                                                                (item, idx) => (
                                                                    <tr
                                                                        key={idx}
                                                                        className="hover:bg-slate-50 transition-colors"

                                                                    >
                                                                        <td className="border-b border-r border-slate-200 px-1 py-0.5 text-center text-[11px] text-slate-500 font-medium">
                                                                            {idx + 1}
                                                                        </td>
                                                                        <td className="border-b border-r border-slate-200 px-1">
                                                                            <input
                                                                                type="text"
                                                                                className="w-full border-none bg-transparent px-2 text-[11px] outline-none focus:bg-white"
                                                                                value={item.barcodeFrom}
                                                                                disabled={true}
                                                                                placeholder="From"
                                                                            />
                                                                        </td>
                                                                        <td className="border-b border-r border-slate-200 px-1 py-0">
                                                                            <input
                                                                                type="text"
                                                                                className="w-full h-7 border-none bg-transparent px-2 text-[11px] outline-none focus:bg-white"
                                                                                value={item.barcodeTo}
                                                                                disabled={true}
                                                                                placeholder="To"

                                                                            />
                                                                        </td>
                                                                        <td className="border-b border-r border-slate-200 px-1 py-0">
                                                                            <input
                                                                                type="number"
                                                                                className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                                                                value={item.qty}
                                                                                disabled={true}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                )}

                                                {/* --- SIZE TEMPLATE TYPE TABLE --- */}
                                                {trackingType ===
                                                    "SizeTemplate" && (
                                                        <table className="w-[450px] border-separate border-spacing-0 border-t border-l border-slate-200">
                                                            <thead>
                                                                <tr>
                                                                    <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-6">
                                                                        S.No
                                                                    </th>
                                                                    <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-40 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase">
                                                                        Size
                                                                    </th>
                                                                    <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-16 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase">
                                                                        Qty
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {jobCardSizeDetails?.map(
                                                                    (item, idx) => (
                                                                        <tr
                                                                            key={idx}
                                                                            className="h-8 hover:bg-slate-50 transition-colors"
                                                                        >
                                                                            <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black">
                                                                                {idx + 1}
                                                                            </td>
                                                                            <td className="border-b border-r border-slate-200 px-3 py-0 text-[11px] text-black">
                                                                                {sizeList?.data?.find((s) => s.id === item.sizeId)
                                                                                    ?.name || "All Items"}
                                                                            </td>
                                                                            <td className="border-b border-r border-slate-200 px-1 py-0">
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                                                                    value={item.qty}
                                                                                    disabled={true}

                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    )}

                                                {/* --- SIZE TEMPLATE + BARCODE TYPE TABLE --- */}
                                                {trackingType ===
                                                    "SizeTemplateBarcode" && (
                                                        <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                                                            <thead>
                                                                <tr>
                                                                    <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-10">
                                                                        S.No
                                                                    </th>
                                                                    <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-28">
                                                                        Size
                                                                    </th>
                                                                    <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-32">
                                                                        From
                                                                    </th>
                                                                    <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-32">
                                                                        To
                                                                    </th>
                                                                    <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-20">
                                                                        Qty
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {jobCardSizeDetails?.map(
                                                                    (item, idx) => (
                                                                        <tr
                                                                            key={idx}
                                                                            className="h-8 hover:bg-slate-50 transition-colors"
                                                                        >
                                                                            <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black ">
                                                                                {idx + 1}
                                                                            </td>
                                                                            <td className="border-b border-r border-slate-200 px-2 py-0 text-[11px]  text-black truncate ">
                                                                                {sizeList?.data?.find((s) => s.id === item.sizeId)
                                                                                    ?.name || "All Items"}
                                                                            </td>
                                                                            <td className="border-b border-r border-slate-200 px-1 py-0">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
                                                                                    value={item.barcodeFrom}
                                                                                    onChange={(e) =>
                                                                                        handleSizeBreakupChange(
                                                                                            idx,
                                                                                            "barcodeFrom",
                                                                                            e.target.value,
                                                                                        )
                                                                                    }
                                                                                    disabled={readOnly}
                                                                                    placeholder="From"
                                                                                    onFocus={(e) => {
                                                                                        e.target.select()
                                                                                    }}
                                                                                    autoFocus={idx == 0}

                                                                                />
                                                                            </td>
                                                                            <td className="border-b border-r border-slate-200 px-1 py-0">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
                                                                                    value={item.barcodeTo}
                                                                                    onChange={(e) =>
                                                                                        handleSizeBreakupChange(
                                                                                            idx,
                                                                                            "barcodeTo",
                                                                                            e.target.value,
                                                                                        )
                                                                                    }
                                                                                    disabled={readOnly}
                                                                                    placeholder="To"
                                                                                    onFocus={(e) => {
                                                                                        e.target.select()
                                                                                    }}
                                                                                />
                                                                            </td>
                                                                            <td className="border-b border-r border-slate-200 px-1 py-0">
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                                                                    value={item.qty}
                                                                                    onChange={(e) =>
                                                                                        handleSizeBreakupChange(
                                                                                            idx,
                                                                                            "qty",
                                                                                            e.target.value,
                                                                                        )
                                                                                    }
                                                                                    disabled={readOnly}
                                                                                    onBlur={(e) => {
                                                                                        const value = parseFloat(
                                                                                            e.target.value || 0,
                                                                                        ).toFixed(3);
                                                                                        handleSizeBreakupChange(idx, "qty", value);
                                                                                    }}
                                                                                    placeholder="0"
                                                                                    onFocus={(e) => {
                                                                                        e.target.select()
                                                                                    }}
                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    )}

                                                {(!jobCardSizeDetails ||
                                                    jobCardSizeDetails.length === 0) && (
                                                        <div className="text-center p-8 text-slate-400 text-sm font-medium italic">
                                                            No items found for this tracking mode.
                                                        </div>
                                                    )}
                                            </div>
                                            <div className="flex-1 min-w-[120px] mt-5">
                                                <label
                                                    className={`md:text-start block text-[11px] font-bold text-slate-700 mb-1`}
                                                >
                                                    Remarks
                                                </label>
                                                <textarea name="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} readOnly={readOnly} className="w-full h-full focus:outline-none border-slate-300 border focus:ring-1 text-[11px] p-1 rounded-md focus:border-indigo-500 " rows={3} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>
                )
            }

        </div>
    );

    const footerContent = (
        <>{
            itemType !== "LABEL" && (
                <div className="flex gap-2">
                    <div className="w-3/4">

                        <ProcessRoutePanel
                            selectedProcesses={selectedProcesses} laminations={laminations} varnishes={varnishes}
                            defaultList={defaultList} laminationList={laminationList} varnishList={varnishList}
                            processRoute={processRoute} setProcessRoute={setProcessRoute} readOnly={readOnly}
                        />
                    </div>
                    <div className="border border-slate-200 p-1 bg-white rounded-md shadow-sm w-1/4">
                        <h2 className="font-medium text-indigo-600 text-[11px]">
                            REMARKS
                        </h2>
                        <textarea
                            readOnly={readOnly}
                            value={remarks}
                            onChange={(e) => {
                                setRemarks(e.target.value);
                            }}
                            className="w-full h-11 overflow-auto px-2.5 py-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
                            placeholder="Additional Remarks..."
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

                </div>

            )
        }
            <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => saveData("close")} onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            saveData("close")
                        }
                    }} disabled={readOnly || isDisabled}
                        className="bg-indigo-500 disabled:opacity-50 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center gap-1.5 text-xs font-medium">
                        <HiOutlineRefresh className="w-3.5 h-3.5" /> Save & Close
                    </button>
                    <button onClick={() => saveData("new")} onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            saveData("new")
                        }
                    }} disabled={readOnly || isDisabled}
                        className="bg-indigo-500 disabled:opacity-50 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center gap-1.5 text-xs font-medium">
                        <FiSave className="w-3.5 h-3.5" /> Save & New
                    </button>
                    {status === "REJECTED" && (
                        <button onClick={() => saveData("close", { submitApproval: true })} disabled={readOnly}
                            title="Submit Approval" className="bg-green-700 text-white px-2 py-1 rounded hover:bg-green-800 flex items-center text-xs">
                            <FiSend className="w-4 h-4" />
                        </button>
                    )}
                    {(id && status === "PENDING" && canApprove) && (
                        <button onClick={() => handleApprovalAction("REJECT")} disabled={readOnly}
                            title="Send Back for Review" className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center text-xs">
                            <MdKeyboardDoubleArrowLeft className="w-4 h-4" />
                        </button>
                    )}
                    {(id && status === "PENDING" && canApprove) && (
                        <button onClick={() => handleApprovalAction("APPROVE")} disabled={readOnly}
                            title="Approve" className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center text-xs">
                            <FiCheck className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    {id && readOnly && (
                        <button disabled={status === "PENDING" && !canApprove} onClick={() => setReadOnly(false)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    setReadOnly(false)
                                }
                            }}
                            className="bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 flex items-center gap-1.5 text-xs font-medium">
                            <FiEdit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                    )}
                    <button onClick={() => setPrintModalOpen(true)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                setPrintModalOpen(true)
                            }
                        }}
                        className="bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-700 flex items-center text-xs">
                        <FiPrinter className="w-4 h-4 mr-2" /> Print
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <Modal
                isOpen={sizeModalOpen}
                onClose={() => {
                    setSizeModalOpen(false)
                }}
                widthClass="w-[750px]"
            >
                <div className="bg-slate-100 p-3 rounded-lg">
                    {/* Header section like the reference image */}
                    <div className="bg-white p-3 rounded-lg flex justify-between items-center mb-3 shadow-sm">
                        <h3 className="text-[16px] font-bold text-slate-800">
                            {trackingType === "Barcode"
                                ? "Barcode wise Details"
                                : trackingType ===
                                    "SizeTemplateBarcode"
                                    ? "Size + Barcode wise Details"
                                    : "Size Wise Details"}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                className="bg-white text-indigo-600 border border-indigo-600 px-4 py-0.5 rounded text-[12px] hover:bg-indigo-50 font-semibold transition-colors flex items-center gap-1 shadow-sm"
                                onClick={() => setSizeModalOpen(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>

                    {/* Main content area */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="h-[220px] overflow-y-auto">
                            {/* --- BARCODE TYPE TABLE --- */}
                            {trackingType === "Barcode" && (
                                <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                                    <thead>
                                        <tr>
                                            <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-11">
                                                S.No
                                            </th>
                                            <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                                                Barcode From
                                            </th>
                                            <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                                                Barcode To
                                            </th>
                                            <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-24">
                                                Qty
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobCardSizeDetails?.map(
                                            (item, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="border-b border-r border-slate-200 px-1 py-0.5 text-center text-[11px] text-slate-500 font-medium">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="border-b border-r border-slate-200 px-1">
                                                        <input
                                                            type="text"
                                                            className="w-full border-none bg-transparent px-2 text-[11px] outline-none focus:bg-white"
                                                            value={item.barcodeFrom}
                                                            disabled={true}
                                                            placeholder="From"
                                                        />
                                                    </td>
                                                    <td className="border-b border-r border-slate-200 px-1 py-0">
                                                        <input
                                                            type="text"
                                                            className="w-full h-7 border-none bg-transparent px-2 text-[11px] outline-none focus:bg-white"
                                                            value={item.barcodeTo}
                                                            disabled={true}
                                                        />
                                                    </td>
                                                    <td className="border-b border-r border-slate-200 px-1 py-0">
                                                        <input
                                                            type="number"
                                                            className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                                            value={item.qty}
                                                            disabled={true}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* --- SIZE TEMPLATE TYPE TABLE --- */}
                            {trackingType ===
                                "SizeTemplate" && (
                                    <table className="w-[450px] border-separate border-spacing-0 border-t border-l border-slate-200">
                                        <thead>
                                            <tr>
                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-6">
                                                    S.No
                                                </th>
                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-40 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                                                    Size
                                                </th>
                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-16 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">
                                                    Qty
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobCardSizeDetails?.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="h-8 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="border-b border-r border-slate-200 px-3 py-0 text-[11px] text-black">
                                                            {sizeList?.data?.find((s) => s.id === item.sizeId)
                                                                ?.name || "All Items"}
                                                        </td>
                                                        <td className="border-b border-r border-slate-200 px-1 py-0">
                                                            <input
                                                                type="number"
                                                                className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                                                value={item.qty}
                                                                disabled={true}
                                                            />
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                )}

                            {/* --- SIZE TEMPLATE + BARCODE TYPE TABLE --- */}
                            {trackingType ===
                                "SizeTemplateBarcode" && (
                                    <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                                        <thead>
                                            <tr>
                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-10">
                                                    S.No
                                                </th>
                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-28">
                                                    Size
                                                </th>
                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-32">
                                                    From
                                                </th>
                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-32">
                                                    To
                                                </th>
                                                <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-20">
                                                    Qty
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobCardSizeDetails?.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="h-8 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black ">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="border-b border-r border-slate-200 px-2 py-0 text-[11px]  text-black truncate ">
                                                            {sizeList?.data?.find((s) => s.id === item.sizeId)
                                                                ?.name || "All Items"}
                                                        </td>
                                                        <td className="border-b border-r border-slate-200 px-1 py-0">
                                                            <input
                                                                type="text"
                                                                className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
                                                                value={item.barcodeFrom}
                                                                onChange={(e) =>
                                                                    handleSizeBreakupChange(
                                                                        idx,
                                                                        "barcodeFrom",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                disabled={readOnly}
                                                                placeholder="From"
                                                                onFocus={(e) => {
                                                                    e.target.select()
                                                                }}
                                                                autoFocus={idx == 0}

                                                            />
                                                        </td>
                                                        <td className="border-b border-r border-slate-200 px-1 py-0">
                                                            <input
                                                                type="text"
                                                                className="w-full h-7 border-none bg-transparent px-1 text-[11px] outline-none focus:bg-white"
                                                                value={item.barcodeTo}
                                                                disabled={true}
                                                            />
                                                        </td>
                                                        <td className="border-b border-r border-slate-200 px-1 py-0">
                                                            <input
                                                                type="number"
                                                                className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white"
                                                                value={item.qty}
                                                                disabled={true}
                                                            />
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                )}

                            {!jobCardSizeDetails && (
                                <div className="text-center p-8 text-slate-400 text-sm font-medium italic">
                                    No size Details found for this Item.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={approvalModal} onClose={() => setApprovalModal(false)} widthClass="w-[420px]">
                <div className="space-y-4">
                    <h2 className={`text-base font-semibold ${actionType === "APPROVE" ? "text-green-700" : "text-blue-700"}`}>
                        {actionType === "APPROVE" ? "✅ Approve Job Card" : "↩️ Send Back for Review"}
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-xs space-y-1.5">
                        <div className="flex justify-between items-center"><span className="text-gray-500">Job Card No</span><span className="font-medium text-gray-800">{docId}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500">Customer</span><span className="font-medium text-gray-800">{findFromList(customerId, customerList?.data, "name")}</span></div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Current Approval</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${status === "APPROVED" ? "bg-green-100 text-green-700" : status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                                {status === "PENDING" ? "Waiting For Approval" : status === "SUPERSEDED" ? "Re-approval Required" : status}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Remarks {actionType === "REJECT" && <span className="text-red-500">* required</span>}
                        </label>
                        <textarea rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
                            placeholder={actionType === "APPROVE" ? "Optional remarks..." : "Reason for sending back (required)..."}
                            value={approvalRemarks} onChange={(e) => setApprovalRemarks(e.target.value)} autoFocus />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setApprovalModal(false)} className="px-4 py-1.5 text-xs rounded text-white hover:bg-red-600 bg-red-500">Cancel</button>
                        <button disabled={actionLoading} onClick={handleConfirmAction}
                            className={`px-4 py-1.5 text-xs rounded text-white font-semibold ${actionType === "APPROVE" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}>
                            {actionLoading
                                ? (<><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Processing...</>)
                                : actionType === "APPROVE" ? "Confirm Approve" : "Send Back"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Print Modal ─────────────────────────────────────── */}
            <Modal isOpen={printModalOpen}
                onClose={() => {
                    setPrintModalOpen(false);
                    if (pendingAction === "new") { setId(""); setDocId("New"); syncFormWithDb(undefined); setTimeout(() => customerRef.current?.focus(), 100); }
                    if (pendingAction === "close") onClose();
                    setPendingAction(null);
                }}
                widthClass="w-[90%] h-[90%]">
                <PDFViewer style={tw("w-full h-full")}>
                    <JobCardPrintFormat
                        singleData={singleData?.data} customerList={customerList} boardList={boardList}
                        gsmList={gsmList} machineList={machineList} plateList={plateList} dieList={dieList}
                        defaultList={defaultList} laminationList={laminationList} varnishList={varnishList}
                        branchData={branchData?.data} orderList={orderList}
                    />
                </PDFViewer>
            </Modal>

            <TransactionLayout
                title="Job Card"
                badge={<ModeChip id={id} readOnly={readOnly} />}
                closeIcon={<IoArrowBackCircleSharp className="w-7 h-7" />}
                onClose={onClose}
                onKeyDown={handleKeyDown}
                header={headerContent}
                gridItems={gridItemsContent}
                footer={footerContent}
            />
        </>
    );
};

export default JobCardForm;
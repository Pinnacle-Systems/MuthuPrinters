import { IoArrowBackCircleSharp } from "react-icons/io5";
import { CheckBoxNew, DateInputNew, DropdownInput, DropdownNew, ReusableInput, TextInput } from "../../../Inputs";
import { blockTypes, productionTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { findFromList, getCommonParams, ModeChip } from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiCheck, FiEdit2, FiPrinter, FiSave, FiSend } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import { BoardMaster, DieMaster, Gsm, PlateMaster, Size } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import { useAddJobCardMutation, useGetJobCardByIdQuery, useGetJobCardListQuery, useLazyGetJobCardByIdQuery, useUpdateJobCardMutation } from "../../../redux/uniformService/JobCardService.js";
import { useGetProcessMasterQuery } from "../../../redux/services/ProcessMasterService.js";
import { useGetProcessGroupMasterQuery } from "../../../redux/services/ProcessGroupMaster.service.js";
import secureLocalStorage from "react-secure-storage";
import { useGetBoardMasterQuery } from "../../../redux/services/boardService.js";
import Modal from "../../../UiComponents/Modal/index.js";
import { PDFViewer } from "@react-pdf/renderer";
import tw from "../../../Utils/tailwind-react-pdf.js";
import JobCardPrintFormat from "./JobCardPrintFormat.jsx";
import { useGetOrderItemsListQuery, useGetRefListQuery, useLazyGetOrderEntryByIdQuery } from "../../../redux/uniformService/OrderEntryService.js";
import { invalidateOrderEntryModule } from "../../../redux/Dispatch/OrderInvalidateTags.js";
import { ProcessRoutePanel, routeKeysToDb, buildCompletedSet } from "./ProcessRoutePanel.jsx";
import { useAddApprovalStausMutation } from "../../../redux/uniformService/PoServices.js";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService.js";
import TransactionLayout from "../../../Basic/components/Reuseable/TransactionLayout.jsx";
import { QRCodeCanvas } from "qrcode.react";
import { CheckBox, Field, LVHeader, LVRow, SectionCard } from "./Utils.jsx";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService.js";
import { Plus } from "lucide-react";
import { useGetMachineMasterQuery } from "../../../redux/services/MachineMasterService.js";
import { invalidateJobCardModule } from "../../../redux/Dispatch/JobCardInvalidateTags.js";
import QRCode from "qrcode";

const JobCardForm = ({
    onClose, id, setId, readOnly, setReadOnly,
    customerList, gsmList, plateList, dieList, branchData,
    formOrderCustomerId, fromOrderId, fromOrderType, fromOrderQty,
    canApprove, userData, employeeList, hasPermission,
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
    const [otherBoardId, setOtherBoardId] = useState("");
    const [fullBoardId, setFullBoardId] = useState("");
    const [noOfPockets, setNoOfPockets] = useState("");
    const [cuttingSizeId, setCuttingSizeId] = useState("");
    const [runningQty, setRunningQty] = useState("");
    const [totalPlatesets, setTotalPlatesets] = useState("");
    const [plateId, setPlateId] = useState("");
    const [dieId, setDieId] = useState("");
    const [boardItems, setBoardItems] = useState([]);
    const [selectedPrinting, setSelectedPrinting] = useState([]);
    const [selectedProcesses, setSelectedProcesses] = useState([]);
    const [selectedMachines, setSelectedMachines] = useState([]);
    const [selectedFinishing, setSelectedFinishing] = useState([]);
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
    const [block, setBlock] = useState("NEW");
    const [labelQty, setLabelQty] = useState("");
    const [rollQty, setRollQty] = useState("");
    const [cutAndSeal, setCutAndSeal] = useState("");
    // const [orderStyleItems, setOrderStyleItems] = useState([]);
    const [jobCardSizeDetails, setJobCardSizeDetails] = useState([]);
    const [selectedOrderData, setSelectedOrderData] = useState(null);
    const [trackingType, setTrackingType] = useState("Barcode");
    const [sizeModalOpen, setSizeModalOpen] = useState(false);
    const [plateModalOpen, setPlateModalOpen] = useState(false);
    const childRecord = useRef(0);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
    const [orderItemId, setOrderItemId] = useState("");
    const [plateDetails, setPlateDetails] = useState(
        Array.from({ length: 6 }, () => ({ plateName: "", qty: "" }))
    );
    const [labelSizeId, setLabelSizeId] = useState("");
    const [totalMeter, setTotalMeter] = useState("");
    const [blockDate, setBlockDate] = useState("");
    const [isRepeatedJobCard, setIsRepeatedJobCard] = useState();
    const [refJobCardId, setRefJobCardId] = useState("");
    const [pendingPrint, setPendingPrint] = useState(false);
    const [isAmendment, setIsAmendment] = useState(false);
    const qrRef = useRef(null);

    const params = { companyId: secureLocalStorage.getItem(sessionStorage.getItem("sessionId") + "userCompanyId") };

    const { data: processList } = useGetProcessMasterQuery({ params });
    // const { data: boardData } = useGetBoardMasterQuery({ params });
    const { data: processGroupList } = useGetProcessGroupMasterQuery({ params });
    const { data: orderList } = useGetRefListQuery({ params: { companyId, branchId } });
    // const { data: styleItemList } = useGetStyleItemMasterQuery({ params: { companyId, branchId } });
    const { data: sizeList } = useGetSizeMasterQuery({ params: { companyId, branchId } });
    const { data: machineList } = useGetMachineMasterQuery({ params: { companyId, branchId } });
    const { data: jobCardList } = useGetJobCardListQuery({ params: { companyId, branchId } });
    const { data: styleItemList } = useGetOrderItemsListQuery({ params: { orderEntryId } });

    const getGroupIds = (groupName) =>
        processGroupList?.data?.find((g) => g.name === groupName)?.processGroupList?.map((i) => i.processId) || [];
    const filterByGroup = (groupName) =>
        processList?.data?.filter((p) => getGroupIds(groupName).includes(p.id)) || [];

    // const boardList = boardData?.data?.filter((i) => id ? true : i?.active) || [];
    const boardList = filterByGroup("BOARD QUALITY");
    const printingList = filterByGroup("PRINTING");
    const defaultList = filterByGroup("DEFAULT");
    const laminationList = filterByGroup("LAMINATION");
    const varnishList = filterByGroup("VARNISH");
    const finishingList = filterByGroup("FINISHING");

    const { data: singleData, isFetching: isSingleFetching, isLoading: isSingleLoading } =
        useGetJobCardByIdQuery(id, { skip: !id });
    const status = singleData?.data?.approvalStatus?.status;
    const isDisabledPermission = (status === "APPROVED" || status === "PENDING") && !canApprove;

    // ─────────────────────────────────────────────────────────────
    // Task 3: Build a Set of "type:processId" strings for completed
    // route steps. Fields bound to these steps will be disabled.
    // ─────────────────────────────────────────────────────────────
    const dbProcessRoute = singleData?.data?.processRoute || [];
    const anyCompleted = dbProcessRoute.some((r) => r.status === "COMPLETED");
    const routeFieldsLocked = anyCompleted && !isAmendment;

    const completedSet = useMemo(
        () => buildCompletedSet(dbProcessRoute),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(dbProcessRoute)]
    );

    /**
     * Returns true when ALL route entries that reference the given
     * process IDs (by type) are COMPLETED, meaning the user should
     * NOT be able to edit the corresponding form field.
     *
     * @param {"boardQuality"|"board"|"printing"|"process"|"lamination"|"varnish"|"finishing"} type
     * @param {number|number[]} processIds  - single id or array of ids
     */
    const isCompletedInRoute = (type, processIds) => {
        const ids = Array.isArray(processIds) ? processIds : [processIds];
        // If none of the ids appear in the route at all, not locked
        const routeEntries = dbProcessRoute.filter(
            (r) => r.type === type && ids.includes(r.processId)
        );
        if (routeEntries.length === 0) return false;
        return routeEntries.every((r) => r.status === "COMPLETED");
    };

    /**
     * For checkbox-group fields (boardItems, selectedPrinting, etc.),
     * returns true if this SPECIFIC item id is completed in the route.
     */
    const isItemCompleted = (type, itemId) =>
        completedSet.has(`${type}:${itemId}`);

    // Derived: are ALL board qualities completed? → lock the whole board section
    const allBoardQualitiesCompleted =
        boardItems.length > 0 &&
        boardItems.every((bid) => isItemCompleted("boardQuality", bid));

    const boardCompleted = isCompletedInRoute("board", otherBoardId);

    // Cutting details are tied to boardQuality / board steps in route
    // We lock them when ALL board-related steps are completed
    const cuttingFieldsLocked = allBoardQualitiesCompleted && boardCompleted;

    // Printing: individual items may be locked
    // Process details: individual items
    // Lamination/Varnish: individual items
    // Machine: no route type for machines, so never locked by route

    const [addData] = useAddJobCardMutation();
    const [updateData] = useUpdateJobCardMutation();
    const [addApprovalStatus] = useAddApprovalStausMutation();
    const [getOrderById] = useLazyGetOrderEntryByIdQuery()
    const [getRefById] = useLazyGetJobCardByIdQuery();

    const syncFormWithDb = useCallback((data) => {
        setDocId(data?.docId || "New");
        setDocDate(data?.docDate ? moment.utc(data.docDate).format("YYYY-MM-DD") : moment.utc(new Date()).format("YYYY-MM-DD"));
        setOrderType(data?.orderType || "ORDER");
        setBlockDate(data?.blockDate ? moment.utc(data.blockDate).format("YYYY-MM-DD") : "");
        setProductionType(data?.productionType || "SAMPLE");
        setCustomerId(data?.customerId || "");
        setRemarks(data?.remarks || "");
        setOrderQty(data?.orderQty || "");
        setGsmId(data?.gsmId || "");
        setFullBoardId(data?.fullBoardId || "");
        setNoOfPockets(data?.noOfPockets || "");
        setCuttingSizeId(data?.cuttingSizeId || "");
        setRunningQty(data?.runningQty || "");
        setPlateId(data?.plateId || "");
        setDieId(data?.dieId || "");
        setTotalPlatesets(data?.totalPlatesets || "");
        setBoardItems(data?.boardQualities?.map((b) => b.processId) || []);
        setSelectedProcesses(data?.processDetails?.map((p) => p.processId) || []);
        setSelectedPrinting(data?.printingDetails?.map((p) => p.processId) || []);
        setSelectedFinishing(data?.finishingProcesses?.map((f) => f.processId) || []);
        setLaminations(data?.laminationDetails?.map((l) => ({ processId: l.laminationId, isFront: l.isFront, isFrontAndBack: l.isFrontAndBack })) || []);
        setVarnishes(data?.varnishDetails?.map((v) => ({ processId: v.varnishId, isFront: v.isFront, isFrontAndBack: v.isFrontAndBack })) || []);
        setSelectedMachines(data?.machineDetails?.map((m) => m.macId) || []);
        setOrderEntryId(data?.orderEntryId || "");
        setOtherBoardId(data?.otherBoardId || "");
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
        setBlock(data?.block || "NEW");
        setLabelQty(data?.labelQty || "");
        setRollQty(data?.rollQty || "");
        setCutAndSeal(data?.cutAndSeal || "");
        setJobCardSizeDetails(data?.jobCardSizeDetails || []);
        setTrackingType(data?.trackingType || "");
        setOrderItemId(data?.orderItemId || "");
        setLabelSizeId(data?.labelSizeId || "");
        setTotalMeter(data?.totalMeter || "");
        setIsRepeatedJobCard(data?.isRepeatedJobCard || false);
        setRefJobCardId(data?.refJobCardId || "");

        const rawPlates = data?.plateDetails || [];
        const paddedPlates = [...rawPlates];
        while (paddedPlates.length < 6) paddedPlates.push({ plateName: "", qty: "" });
        setPlateDetails(paddedPlates);
        childRecord.current = data?.childRecord ? data?.childRecord : 0;

    }, []);

    useEffect(() => {
        if (id && singleData?.data) syncFormWithDb(singleData.data);
        else syncFormWithDb(undefined);
    }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

    useEffect(() => {
        if (pendingPrint && singleData?.data && !isSingleFetching) {
            openPrintModal(singleData.data.id, singleData.data.docId);
            setPendingPrint(false);
        }
    }, [pendingPrint, singleData, isSingleFetching]);

    const toggleArr = (setter, val) =>
        setter((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
    const toggleLV = (setter, pid) =>
        setter((prev) => { const exists = prev.find((l) => l.processId === pid); return exists ? prev.filter((l) => l.processId !== pid) : [...prev, { processId: pid, isFront: false, isFrontAndBack: false }]; });
    const toggleLVProp = (setter, pid, prop) =>
        setter((prev) => prev.map((l) => (l.processId === pid ? { ...l, [prop]: !l[prop] } : l)));

    const formData = {
        id, docDate, branchId, userId, finYearId, orderType, orderQty, customerId,
        boardItems, gsmId, otherBoardId, remarks, fullBoardId, noOfPockets, cuttingSizeId,
        runningQty, plateId, dieId,
        totalPlatesets, selectedProcesses, laminations, varnishes, selectedMachines,
        orderEntryId, jobRunTime, processRoute: routeKeysToDb(processRoute),
        productionType, styleItemId, tagCardUps, itemGroupId, itemType, followUpId, designerId,
        labelQuality, block, labelQty, rollQty, cutAndSeal,
        jobCardSizeDetails, trackingType, orderItemId,
        selectedPrinting,
        plateDetails: plateDetails?.filter((plate) => plate?.plateName && plate?.qty), labelSizeId, totalMeter,
        selectedFinishing, blockDate,
        isRepeatedJobCard, refJobCardId, isAmendment
    };

    const openPrintModal = async (overrideId, overrideDocId) => {
        const printId = overrideId ?? id;
        const printDocId = overrideDocId ?? docId;
        try {
            const dataUrl = await QRCode.toDataURL(
                JSON.stringify({ id: printId, docId: printDocId }),
                { width: 120, margin: 1, errorCorrectionLevel: "H" }
            );
            setQrCodeDataUrl(dataUrl);
        } catch (err) {
            console.error("QR gen failed", err);
            setQrCodeDataUrl("");
        }
        setPrintModalOpen(true);
    };

    const handleSubmitCustom = async (callback, data, text, nextProcess) => {
        try {
            const returnData = await callback(data).unwrap();
            if (returnData.statusCode === 1) { toast.error(returnData.message); return; }
            Swal.fire({
                icon: "success", title: `${text || "Saved"} Successfully`, showConfirmButton: false, timer: 2000,
                didClose: () => {
                    invalidateJobCardModule();
                    if (returnData.statusCode === 0) {
                        if (!id) {
                            Swal.fire({ icon: "question", title: "Do You Want to Print?", showCancelButton: true, confirmButtonText: "Yes, Print", cancelButtonText: "No [Esc]", confirmButtonColor: "#3085d6", cancelButtonColor: "#6b7280", focusConfirm: true, allowEnterKey: true, allowEscapeKey: true })
                                .then((result) => {
                                    if (result.isConfirmed) {
                                        if (returnData?.data?.id) {
                                            setId(returnData.data.id);
                                        }
                                        setPendingPrint(true);
                                    } else {
                                        if (nextProcess === "new") {
                                            syncFormWithDb(undefined);
                                            setId("");
                                            setDocId("New");
                                            setTimeout(() => {
                                                customerRef.current?.focus();
                                            }, 300);
                                        }
                                        if (nextProcess === "close") {
                                            onClose();
                                        }
                                    }
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
            { condition: !d.docDate, title: "Document Date is required!" },
            { condition: !d.customerId, title: "Customer is required!" },
            { condition: !d.orderEntryId, title: "Order No is required!" },
            { condition: !d.productionType, title: "Production Type is required!" },
            { condition: !d.styleItemId, title: "Item Description is required!" },
            { condition: !d.orderQty, title: "Order Quantity is required!" },
            { condition: !d.followUpId, title: "Follow-Up is required!" },
            { condition: !d.designerId, title: "Designer is required!" },
            { condition: d.processRoute?.length === 0, title: " Select at Least One Process" },
            { condition: d.isRepeatedJobCard && !d.refJobCardId, title: "Reference Job Card is required!" },
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

    // useEffect(() => {
    //     const loadOrderStyleItems = async () => {
    //         if (!orderEntryId) {
    //             setOrderStyleItems([]);
    //             return;
    //         }
    //         try {
    //             const res = await getOrderById(orderEntryId).unwrap();
    //             setOrderStyleItems(
    //                 res?.data?.orderItems?.map(item => item?.styleItemId) || []
    //             );
    //         } catch (err) {
    //             console.error("Failed to load order style items", err);
    //         }
    //     };
    //     loadOrderStyleItems();
    // }, [orderEntryId]);

    const handleApprovalAction = (type) => { setActionType(type); setApprovalRemarks(""); setApprovalModal(true); };
    const handleConfirmAction = async () => {
        if (actionType === "REJECT" && !approvalRemarks.trim()) { toast.warning("Remarks required for sending back!"); return; }
        setActionLoading(true);
        try {
            const result = await addApprovalStatus({ userId: userData?.id, remarks: approvalRemarks || null, actionType, referenceId: id, referencePage: "JOB CARD", recordData: {} }).unwrap();
            if (result.statusCode === 0) {
                toast.success(result.message || (actionType === "APPROVE" ? "Job Card Approved!" : "Sent Back for Review!")); setApprovalModal(false); onClose();
                invalidateJobCardModule();
            }
            else { toast.error(result.message || "Action failed"); setApprovalModal(false); }
        } catch (err) { toast.error(err?.data?.message || "Something went wrong!"); setApprovalModal(false); }
        finally { setActionLoading(false); }
    };

    const handleJobCardChange = async (value) => {
        if (!value.id) return;
        try {
            const result = await getRefById(value?.id || value).unwrap();
            const data = result?.data;
            if (!data) return;
            setGsmId(data?.gsmId || "");
            setOtherBoardId(data?.otherBoardId || "");
            setFullBoardId(data?.fullBoardId || "");
            setNoOfPockets(data?.noOfPockets || "");
            setCuttingSizeId(data?.cuttingSizeId || "");
            setRunningQty(data?.runningQty || "");
            setPlateId(data?.plateId || "");
            setDieId(data?.dieId || "");
            setTotalPlatesets(data?.totalPlatesets || "");
            setBoardItems(data?.boardQualities?.map((b) => b.processId) || []);
            setSelectedProcesses(data?.processDetails?.map((p) => p.processId) || []);
            setSelectedPrinting(data?.printingDetails?.map((p) => p.processId) || []);
            setSelectedFinishing(data?.finishingProcesses?.map((f) => f.processId) || []);
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
            setSelectedMachines(data?.machineDetails?.map((m) => m.macId) || []);
            setJobRunTime(data?.jobRunTime || "");
            setTagCardUps(data?.tagCardUps || "");
            setProcessRoute(
                data?.processRoute
                    ? [...data.processRoute]
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((r) => {
                            const sub = r.isFront ? "front" : r.isFrontAndBack ? "frontback" : "";
                            return `${r.type}:${r.processId}${sub ? `:${sub}` : ""}`;
                        })
                    : []
            );
            setLabelQuality(data?.labelQuality || "");
            setBlock(data?.block || "NEW");
            setBlockDate(data?.blockDate ? moment.utc(data.blockDate).format("YYYY-MM-DD") : "");
            setLabelQty(data?.labelQty || "");
            setRollQty(data?.rollQty || "");
            setCutAndSeal(data?.cutAndSeal || "");
            setLabelSizeId(data?.labelSizeId || "");
            setTotalMeter(data?.totalMeter || "");
            setItemGroupId(data?.itemGroupId || "");
            setItemType(data?.itemType || "");
            setJobCardSizeDetails(
                data?.jobCardSizeDetails?.map((s) => ({
                    sizeId: s.sizeId || "",
                    qty: s.qty || "",
                    barcodeFrom: s.barcodeFrom || "",
                    barcodeTo: s.barcodeTo || "",
                })) || []
            );
            const rawPlates = data?.plateDetails || [];
            const paddedPlates = [...rawPlates];
            while (paddedPlates.length < 6) paddedPlates.push({ plateName: "", qty: "" });
            setPlateDetails(paddedPlates);
            setIsAmendment(data?.isAmendment || false);
        } catch (err) {
            console.error("Failed to load order style items", err);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Task 3 helpers — per-field completion-lock flags
    // ─────────────────────────────────────────────────────────────

    // Board quality checkboxes — each item locked individually
    const isBoardQualityLocked = (boardItemId) => isItemCompleted("boardQuality", boardItemId) || routeFieldsLocked;

    // Board (other/board dropdown) locked if its route step is completed
    const isBoardLocked = otherBoardId
        ? (isItemCompleted("board", otherBoardId) || routeFieldsLocked)
        : routeFieldsLocked;

    // Cutting detail fields locked when boardQuality AND board are both done
    // (they belong to the boardQuality stage in production flow)
    const isCuttingLocked = routeFieldsLocked ||
        boardItems.length > 0 &&
        boardItems.every((bid) => isItemCompleted("boardQuality", bid));

    // Printing checkboxes — each locked individually
    const isPrintingItemLocked = (printId) => isItemCompleted("printing", printId) || routeFieldsLocked;

    // Process details checkboxes — each locked individually
    const isProcessItemLocked = (procId) => isItemCompleted("process", procId) || routeFieldsLocked;

    // Lamination rows — each locked individually
    const isLaminationItemLocked = (laminationProcId) => isItemCompleted("lamination", laminationProcId) || routeFieldsLocked;

    // Varnish rows — each locked individually
    const isVarnishItemLocked = (varnishProcId) => isItemCompleted("varnish", varnishProcId) || routeFieldsLocked;

    // Finishing checkboxes — each locked individually
    const isFinishingItemLocked = (finId) => isItemCompleted("finishing", finId) || routeFieldsLocked;

    const headerContent = (
        <div className="flex flex-col xl:flex-row gap-1">
            <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Basic Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="w-40"><ReusableInput label="Job Card No" readOnly value={docId} /></div>
                    <div className="w-28"><ReusableInput label="Job Card Date" value={docDate} type="date" readOnly disabled /></div>
                    <div className="mt-4">
                        <CheckBoxNew
                            name="Is Repeated"
                            readOnly={readOnly}
                            value={isRepeatedJobCard}
                            setValue={setIsRepeatedJobCard}
                            disabled={readOnly || childRecord.current > 0}
                            className="text-[11px] font-medium"
                        />
                    </div>
                    {
                        isRepeatedJobCard && (
                            <div className="w-40">
                                <DropdownNew
                                    name="Job Card No"
                                    dataList={jobCardList?.data}
                                    value={refJobCardId}
                                    setValue={setRefJobCardId}
                                    required
                                    readOnly={readOnly}
                                    disabled={readOnly || childRecord.current > 0}
                                    otherField={"docId"}
                                    beforeChange={handleJobCardChange}
                                />
                            </div>
                        )
                    }
                </div>
            </div>

            <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-[10px] font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">Customer Details</h2>
                <div className="w-72 px-1">
                    <DropdownNew name="Customer"
                        dataList={id ? customerList?.data?.filter((i) => i?.isCustomer) : customerList?.data?.filter((i) => i?.active && i?.isCustomer)}
                        value={customerId} setValue={setCustomerId} required readOnly={readOnly} disabled={readOnly || childRecord.current > 0} ref={customerRef} />
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
                                item?.customerId === customerId &&
                                (
                                    id || item?.creationStatus !== "FULLY_CREATED"
                                )
                            )} value={orderEntryId} setValue={setOrderEntryId} required readOnly={readOnly} disabled={readOnly || childRecord.current > 0} otherField={"docId"}
                            beforeChange={async (selectedValue) => {
                                if (isRepeatedJobCard && refJobCardId) {
                                    const res = await getOrderById(selectedValue?.id).unwrap();
                                    setSelectedOrderData(res?.data);
                                    return;
                                }
                                if (!selectedValue) {
                                    setProductionType("SAMPLE");
                                    setStyleItemId("");
                                    setOrderQty("");
                                    setTagCardUps("");
                                    setJobRunTime("");
                                    // setOrderStyleItems([]);
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
                                setOtherBoardId("");
                                setSelectedPrinting([]);
                                setSelectedProcesses([]);
                                setSelectedMachines([]);
                                setLaminations([]);
                                setPlateDetails([]);
                                setVarnishes([]);
                                setProductionType(res?.data?.productionType);
                                // const filteredItems =
                                //     res?.data?.orderItems
                                //         ?.filter(item =>
                                //             item?.childRecord === 0 ||
                                //             item?.id === orderItemId
                                //         )
                                //         ?.map(item => item?.styleItemId) || [];

                                // setOrderStyleItems(filteredItems);

                            }}
                        />
                    </div>
                    <div className="w-28">
                        <DropdownInput name="Production Type" options={productionTypes} value={productionType} setValue={setProductionType} required readOnly={true} disabled={readOnly} />
                    </div>
                    <div className="w-48">
                        <DropdownNew name="Item Description" dataList={styleItemList?.data?.filter((item) => id ? true : item.childRecord === 0)
                        } value={styleItemId} setValue={setStyleItemId} required disabled={readOnly || childRecord.current > 0}
                            beforeChange={
                                (selectedValue) => {
                                    if (isRepeatedJobCard && refJobCardId) {
                                        const selectedOrderItem =
                                            selectedOrderData?.orderItems?.find(
                                                item => item.styleItemId === selectedValue?.id
                                            );
                                        setOrderQty(selectedOrderItem?.orderQty || "");
                                        return;
                                    }
                                    setItemGroupId(selectedValue?.itemGroupId);
                                    setItemType(selectedValue?.itemGroupName);
                                    const selectedOrderItem =
                                        selectedOrderData?.orderItems?.find(
                                            item => item.styleItemId === selectedValue?.id
                                        );
                                    setOrderQty(selectedOrderItem?.orderQty || "");
                                    setTrackingType(selectedOrderItem?.trackingType || "");
                                    setOrderItemId(selectedOrderItem?.id)
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
                                    setSelectedPrinting([]);
                                    setPlateDetails([]);
                                    setOtherBoardId("")
                                    setSelectedFinishing([]);
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
                                    <TextInput name="Tag/Card Ups" value={tagCardUps} setValue={setTagCardUps} readOnly={readOnly} className="w-full text-right" onFocus={(e) => e.target.select()} disabled={isDisabledPermission} />
                                </div>
                                <div className="w-28">
                                    <TextInput name="Job Run Time (Hours)" value={jobRunTime} setValue={setJobRunTime} readOnly={readOnly} className="w-full text-right" type="number" onFocus={(e) => e.target.select()} disabled={isDisabledPermission} />
                                </div>
                            </>)
                    }
                    <div className="w-56">
                        <DropdownNew name="Follow Up"
                            dataList={id ? employeeList?.data : employeeList?.data?.filter((i) => i?.active)}
                            value={followUpId} setValue={setFollowUpId} required readOnly={readOnly} disabled={isDisabledPermission || readOnly} />
                    </div>
                    <div className="w-56">
                        <DropdownNew name="Designer"
                            dataList={id ? employeeList?.data : employeeList?.data?.filter((i) => i?.active)}
                            value={designerId} setValue={setDesignerId} required readOnly={readOnly} disabled={isDisabledPermission || readOnly} />
                    </div>
                </div>
            </div>

            <div className="w-fit border border-slate-200 p-1.5 bg-white rounded-md shadow-sm">
                <h2 className="text-xs font-bold text-gray-500 mb-1 uppercase border-b pb-0.5">
                    QR Code
                </h2>
                {docId && docId !== "New" ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-slate-200 rounded bg-white">
                            <QRCodeCanvas
                                value={JSON.stringify({ id, docId })}
                                size={80}
                                className="border border-slate-200 rounded"
                                level="H"
                            />
                            <span className="text-[9px] font-bold text-slate-700 mt-1 tracking-tight">
                                {docId}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center mt-2 w-28">
                        <div className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded bg-white text-slate-400 text-[10px] font-medium text-center leading-tight">
                            <span>QR appears<br />after save</span>
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
                    <div className="grid grid-cols-4 gap-x-2 items-start min-w-max">

                        {/* COL 1 — Board */}
                        <div className="flex flex-col gap-2">
                            <SectionCard title="Board Quality">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                                    {boardList?.map((item) => (
                                        <CheckBox
                                            key={item.id}
                                            name={item.name}
                                            value={boardItems.includes(item.id)}
                                            setValue={() => toggleArr(setBoardItems, item.id)}
                                            readOnly={readOnly}
                                            // Task 3: disable if this board quality is completed in route
                                            disabled={isDisabledPermission || isBoardQualityLocked(item.id)}
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                            <SectionCard title="Cutting Details">
                                <div className="grid grid-cols-2 gap-x-3 min-h-[220px]">
                                    <Field label="GSM">
                                        <DropdownWithModal name=""
                                            options={dropDownListObject(id ? gsmList?.data : gsmList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={gsmId} setValue={setGsmId} readOnly={readOnly}
                                            addNewLabel="+ Add GSM" childComponent={Gsm} addNewModalWidth="w-[30%] h-[45%]"
                                            // Task 3: lock if cutting stage is completed
                                            disabled={isDisabledPermission || isCuttingLocked}
                                        />
                                    </Field>
                                    <Field label="Others / Board">
                                        <DropdownWithModal name=""
                                            options={dropDownListObject(id ? boardList : boardList?.filter((i) => i?.active), "name", "id")}
                                            value={otherBoardId} setValue={setOtherBoardId} readOnly={readOnly}
                                            addNewLabel="+ Add Board" childComponent={BoardMaster} addNewModalWidth="w-[30%] h-[45%]"
                                            disabled={isDisabledPermission || isBoardLocked}
                                        />
                                    </Field>
                                    <Field label="Full Board">
                                        <DropdownWithModal name=""
                                            options={dropDownListObject(id ? sizeList?.data : sizeList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={fullBoardId} setValue={setFullBoardId} readOnly={readOnly}
                                            addNewLabel="+ Add Size" childComponent={Size} addNewModalWidth="w-[30%] h-[45%]"
                                            disabled={isDisabledPermission || isCuttingLocked}
                                        />
                                    </Field>
                                    <Field label="Cutting Size">
                                        <DropdownWithModal name=""
                                            options={dropDownListObject(id ? sizeList?.data : sizeList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={cuttingSizeId} setValue={setCuttingSizeId} readOnly={readOnly}
                                            addNewLabel="+ Add Size" childComponent={Size} addNewModalWidth="w-[30%] h-[45%]"
                                            disabled={isDisabledPermission || isCuttingLocked}
                                        />
                                    </Field>
                                    <Field label="No. of Sheets">
                                        <TextInput name="" value={noOfPockets} setValue={setNoOfPockets} readOnly={readOnly}
                                            type="number" className="w-full text-right"
                                            disabled={isDisabledPermission || isCuttingLocked}
                                        />
                                    </Field>
                                    <Field label="Running Qty">
                                        <TextInput name="" value={runningQty} setValue={setRunningQty} readOnly={readOnly}
                                            type="number" className="w-full text-right"
                                            disabled={isDisabledPermission || isCuttingLocked}
                                        />
                                    </Field>
                                </div>
                            </SectionCard>
                        </div>

                        <div className="flex flex-col gap-2">
                            <SectionCard title="Printing Details">
                                <div className="grid grid-cols-2 gap-y-4">
                                    {printingList?.map((item) => (
                                        <CheckBox
                                            key={item.id}
                                            name={item.name}
                                            value={selectedPrinting.includes(item.id)}
                                            setValue={() => toggleArr(setSelectedPrinting, item.id)}
                                            readOnly={readOnly}
                                            // Task 3: lock if this printing step is completed
                                            disabled={isDisabledPermission || isPrintingItemLocked(item.id)}
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                            <SectionCard title="Plate & Die Details">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                    <Field label="Plate Details">
                                        <DropdownWithModal name=""
                                            options={dropDownListObject(id ? plateList?.data : plateList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={plateId} setValue={setPlateId} readOnly={readOnly}
                                            addNewLabel="+ Add Plate" childComponent={PlateMaster} addNewModalWidth="w-[30%] h-[45%]"
                                            disabled={isDisabledPermission}
                                        />
                                    </Field>
                                    <Field label="Die Details">
                                        <DropdownWithModal name=""
                                            options={dropDownListObject(id ? dieList?.data : dieList?.data?.filter((i) => i?.active), "name", "id")}
                                            value={dieId} setValue={setDieId} readOnly={readOnly}
                                            addNewLabel="+ Add Die" childComponent={DieMaster} addNewModalWidth="w-[30%] h-[45%]"
                                            disabled={isDisabledPermission}
                                        />
                                    </Field>
                                    <div className="col-span-1">
                                        <Field label="Total Plate Sets">
                                            <TextInput name="" value={totalPlatesets} setValue={setTotalPlatesets} type={"number"}
                                                readOnly={readOnly} className=" w-full text-right"
                                                disabled={isDisabledPermission}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </SectionCard>
                            <SectionCard title="Plate Set & Size Details">
                                <div className="min-h-[72px] space-y-3">
                                    <div className="justify-center items-center">
                                        <button onClick={() => setPlateModalOpen(true)} className="border flex justify-center gap-1 items-center w-auto rounded-md text-[10px] bg-green-700 font-semibold uppercase tracking-wider text-white p-1">
                                            Add Plate Set <Plus className="size-3" />
                                        </button>
                                    </div>
                                    <div className="justify-center items-center">
                                        <button onClick={() => setSizeModalOpen(true)} className="border w-auto rounded-md text-[10px] bg-blue-700 font-semibold uppercase tracking-wider text-white p-1">
                                            View Size Details
                                        </button>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        <div className="flex flex-col gap-2">
                            <SectionCard title="Process Details">
                                <div className="grid grid-cols-2 gap-y-4 min-h-[165px]">
                                    {defaultList?.map((item) => (
                                        <CheckBox
                                            key={item.id}
                                            name={item.name}
                                            value={selectedProcesses.includes(item.id)}
                                            setValue={() => toggleArr(setSelectedProcesses, item.id)}
                                            readOnly={readOnly}
                                            // Task 3: lock if this process step is completed
                                            disabled={isDisabledPermission || isProcessItemLocked(item.id)}
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                            <SectionCard title="Lamination Details">
                                {laminationList?.length > 0
                                    ? (
                                        <>
                                            <LVHeader />
                                            {laminationList.map((item) => {
                                                const sel = laminations.find((l) => l.processId === item.id);
                                                // Task 3: lock if this lamination step is completed
                                                const laminLocked = isLaminationItemLocked(item.id);
                                                return (
                                                    <LVRow
                                                        key={item.id} item={item} selected={sel}
                                                        onMain={() => toggleLV(setLaminations, item.id)}
                                                        onFront={() => toggleLVProp(setLaminations, item.id, "isFront")}
                                                        onFrontBack={() => toggleLVProp(setLaminations, item.id, "isFrontAndBack")}
                                                        readOnly={readOnly || isDisabledPermission || laminLocked}
                                                    />
                                                );
                                            })}
                                        </>
                                    )
                                    : <p className="text-xs text-slate-400 italic">No lamination options configured.</p>}
                            </SectionCard>
                        </div>

                        <div className="flex flex-col gap-2">
                            <SectionCard title="Varnish Details">
                                {varnishList?.length > 0
                                    ? (
                                        <>
                                            <LVHeader />
                                            {varnishList.map((item) => {
                                                const sel = varnishes.find((v) => v.processId === item.id);
                                                // Task 3: lock if this varnish step is completed
                                                const varnishLocked = isVarnishItemLocked(item.id);
                                                return (
                                                    <LVRow
                                                        key={item.id} item={item} selected={sel}
                                                        onMain={() => toggleLV(setVarnishes, item.id)}
                                                        onFront={() => toggleLVProp(setVarnishes, item.id, "isFront")}
                                                        onFrontBack={() => toggleLVProp(setVarnishes, item.id, "isFrontAndBack")}
                                                        readOnly={readOnly || isDisabledPermission || varnishLocked}
                                                    />
                                                );
                                            })}
                                        </>
                                    )
                                    : <p className="text-xs text-slate-400 italic">No varnish options configured.</p>}
                            </SectionCard>
                            <SectionCard title="Machines">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-4 min-h-[132px]">
                                    {machineList?.data?.filter((item) => id ? true : item.active).map((item) => (
                                        <CheckBox
                                            key={item.id}
                                            name={`${item.name}${item.Size?.name ? ` (${item.Size.name})` : ""}`}
                                            value={selectedMachines.includes(item.id)}
                                            setValue={() => toggleArr(setSelectedMachines, item.id)}
                                            readOnly={readOnly}
                                            // Machines have no route type, never locked by completion
                                            disabled={isDisabledPermission}
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                        </div>

                    </div>
                )
            }
            {
                itemType === "LABEL" && (
                    <div className="flex items-start min-w-max mx-2 h-full">
                        <div className="w-full h-full flex gap-2">
                            <SectionCard title="Label Details" className="max-w-full h-full">
                                <div className="flex gap-16">
                                    <div className="grid grid-cols-3 gap-y-2 gap-x-2 h-full">
                                        <div className="">
                                            <TextInput name="Label Quality" value={findFromList(styleItemId, styleItemList?.data, "name")} setValue={setLabelQuality} readOnly={true} className="w-full" disabled={isDisabledPermission} />
                                        </div>
                                        <div className="">
                                            <DropdownWithModal name="Label Size"
                                                options={dropDownListObject(id ? sizeList?.data : sizeList?.data?.filter((i) => i?.active), "name", "id")}
                                                value={labelSizeId} setValue={setLabelSizeId} readOnly={readOnly}
                                                addNewLabel="+ Add Size" childComponent={Size} addNewModalWidth="w-[30%] h-[45%]"
                                                disabled={isDisabledPermission}
                                            />
                                        </div>
                                        <div className="">
                                            <TextInput name="Total Meter" value={totalMeter} setValue={setTotalMeter} readOnly={readOnly} type="number" className="w-full text-right" disabled={isDisabledPermission} />
                                        </div>
                                        <div className="">
                                            <DropdownInput
                                                name="Block"
                                                options={blockTypes}
                                                value={block}
                                                setValue={(value) => setBlock(value)}
                                                required={true}
                                                readOnly={readOnly}
                                                disabled={childRecord.current > 0 || readOnly || isDisabledPermission}
                                                beforeChange={() => { setBlockDate(null) }}
                                            />
                                        </div>
                                        {
                                            block === "OLD" && (
                                                <div>
                                                    <DateInputNew
                                                        name="Block Date"
                                                        value={blockDate}
                                                        setValue={setBlockDate}
                                                        disabled={readOnly || isDisabledPermission}
                                                        required={false}
                                                        type="date"
                                                    />
                                                </div>
                                            )
                                        }
                                        <div className="">
                                            <TextInput name="Label Qty" value={orderQty} setValue={setOrderQty} readOnly={true} type="number" className="w-full text-right" disabled={isDisabledPermission} />
                                        </div>
                                        <div className="">
                                            <TextInput name="Roll Qty" value={rollQty} setValue={setRollQty} readOnly={readOnly} type="number" className="w-full text-right" disabled={isDisabledPermission} />
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                            <SectionCard title="Finishing Processes" className="w-1/3">
                                <div className="grid grid-cols-2 gap-y-4">
                                    {finishingList?.map((item) => (
                                        <CheckBox
                                            key={item.id}
                                            name={item.name}
                                            value={selectedFinishing.includes(item.id)}
                                            setValue={() => toggleArr(setSelectedFinishing, item.id)}
                                            readOnly={readOnly}
                                            // Task 3: lock if this finishing step is completed
                                            disabled={isDisabledPermission || isFinishingItemLocked(item.id)}
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                            <SectionCard title="Size Wise Qty Details" className="w-1/3">
                                <div>
                                    <div className="bg-white px-4 py-1 shadow-sm">
                                        <div className="overflow-y-auto">
                                            <table className="w-full border-separate border-spacing-0 border-t border-l border-slate-200">
                                                <thead>
                                                    <tr>
                                                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase w-6">S.No</th>
                                                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-20 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase">Size</th>
                                                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-16 px-1 py-1 text-center text-[11px] font-bold text-slate-700 uppercase">Qty</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {jobCardSizeDetails?.map((item, idx) => (
                                                        <tr key={idx} className="h-8 hover:bg-slate-50 transition-colors">
                                                            <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black">{idx + 1}</td>
                                                            <td className="border-b border-r border-slate-200 px-3 py-0 text-[11px] text-black">
                                                                {sizeList?.data?.find((s) => s.id === item.sizeId)?.name || "All Items"}
                                                            </td>
                                                            <td className="border-b border-r border-slate-200 px-1 py-0">
                                                                <input type="number" className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white" value={item.qty} disabled={true} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {(!jobCardSizeDetails || jobCardSizeDetails.length === 0) && (
                                                <div className="text-center p-8 text-slate-400 text-sm font-medium italic">
                                                    No items found for this tracking mode.
                                                </div>
                                            )}
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
        <>
            <div className="flex gap-2">
                <div className="w-3/4">
                    <ProcessRoutePanel
                        selectedProcesses={selectedProcesses} laminations={laminations} varnishes={varnishes}
                        defaultList={defaultList} laminationList={laminationList} varnishList={varnishList}
                        processRoute={processRoute} setProcessRoute={setProcessRoute} readOnly={readOnly}
                        boardItems={boardItems} otherBoardId={otherBoardId} printingList={printingList}
                        boardList={boardList} selectedPrinting={selectedPrinting}
                        selectedFinishing={selectedFinishing} finishingList={finishingList}
                        isAmendment={isAmendment} setIsAmendment={setIsAmendment}
                        // Task 1 & 2: pass raw DB route so panel can look up step statuses
                        dbProcessRoute={dbProcessRoute}
                    />
                </div>
                <div className="border border-slate-200 p-1 bg-white rounded-md shadow-sm w-1/4">
                    <h2 className="font-medium text-indigo-600 text-[11px]">REMARKS</h2>
                    <textarea
                        readOnly={readOnly}
                        value={remarks}
                        onChange={(e) => { setRemarks(e.target.value); }}
                        disabled={isDisabledPermission}
                        className="w-full h-11 overflow-auto px-2.5 py-2 text-xs border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
                        placeholder="Additional Remarks..."
                        onKeyDown={(e) => {
                            if (e.ctrlKey && e.key === "Enter") {
                                e.preventDefault();
                                const textarea = e.target;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const newValue = remarks.substring(0, start) + "\n" + remarks.substring(end);
                                setRemarks(newValue);
                                requestAnimationFrame(() => {
                                    textarea.focus();
                                    textarea.setSelectionRange(start + 1, start + 1);
                                });
                            }
                        }}
                    />
                </div>
            </div>

            <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2 flex-wrap">
                    {!readOnly && (
                        <button onClick={() => saveData("close")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveData("close") } }} disabled={readOnly || isDisabledPermission}
                            className="bg-indigo-500 disabled:opacity-50 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center gap-1.5 text-xs font-medium">
                            <HiOutlineRefresh className="w-3.5 h-3.5" /> Save & Close
                        </button>
                    )}
                    {!readOnly && (
                        <button onClick={() => saveData("new")} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveData("new") } }} disabled={readOnly || isDisabledPermission}
                            className="bg-indigo-500 disabled:opacity-50 text-white px-2 py-1 rounded hover:bg-indigo-600 flex items-center gap-1.5 text-xs font-medium">
                            <FiSave className="w-3.5 h-3.5" /> Save & New
                        </button>
                    )}
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
                        <button disabled={status === "PENDING" && !canApprove} onClick={() => hasPermission(() => setReadOnly(false), "edit")}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); hasPermission(() => setReadOnly(false), "edit") } }}
                            className="bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 flex items-center gap-1.5 text-xs font-medium">
                            <FiEdit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                    )}
                    <button onClick={() => openPrintModal()}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); openPrintModal() } }}
                        className="bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-700 flex items-center text-xs">
                        <FiPrinter className="w-4 h-4 mr-2" /> Print
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <Modal isOpen={plateModalOpen} onClose={() => { setPlateModalOpen(false) }} widthClass="w-[500px]">
                <div className="bg-slate-100 p-3 rounded-lg">
                    <div className="bg-white p-3 rounded-lg flex justify-between items-center mb-3 shadow-sm">
                        <h3 className="text-[16px] font-bold text-slate-800">Plate Set Details</h3>
                        <div className="flex gap-2">
                            <button className="bg-white text-indigo-600 border border-indigo-600 px-4 py-0.5 rounded text-[12px] hover:bg-indigo-50 font-semibold transition-colors flex items-center gap-1 shadow-sm" onClick={() => setPlateModalOpen(false)}>Done</button>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="h-[220px] overflow-y-auto">
                            <table className="w-full border-collapse text-[11px]">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-700 h-7">
                                        <th className="border border-gray-300 px-1 py-1 text-center w-8">S.No</th>
                                        <th className="border border-gray-300 px-1 py-1 text-left">Plate Name</th>
                                        <th className="border border-gray-300 px-1 py-1 text-center w-16">Qty</th>
                                        {!readOnly && (
                                            <th className="border border-gray-300 px-1 py-1 text-center w-10">
                                                <button onClick={() => setPlateDetails(prev => [...prev, { plateName: "", qty: "" }])} className="flex items-center justify-center mx-auto p-0.5 bg-indigo-100 hover:bg-indigo-200 rounded" title="Add plate row" tabIndex={-1} disabled={isDisabledPermission}>Actions</button>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {plateDetails.map((row, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? "bg-white h-7" : "bg-gray-50 h-7"}>
                                            <td className="border border-gray-300 text-center text-[10px] text-gray-500">{idx + 1}</td>
                                            <td className="border border-gray-300 p-0">
                                                <input type="text" className="w-full px-1 py-0.5 bg-transparent text-[11px] outline-none focus:bg-white" value={row.plateName}
                                                    onChange={e => { const next = [...plateDetails]; next[idx] = { ...next[idx], plateName: e.target.value }; setPlateDetails(next); }}
                                                    disabled={readOnly || isDisabledPermission} placeholder="Plate name" />
                                            </td>
                                            <td className="border border-gray-300 p-0">
                                                <input type="number" min="0" className="w-full px-1 py-0.5 text-right bg-transparent text-[11px] outline-none focus:bg-white" value={row.qty}
                                                    onChange={e => { const next = [...plateDetails]; next[idx] = { ...next[idx], qty: e.target.value }; setPlateDetails(next); }}
                                                    onBlur={e => { const next = [...plateDetails]; next[idx] = { ...next[idx], qty: e.target.value ? Number(e.target.value) : "" }; setPlateDetails(next); }}
                                                    onFocus={e => e.target.select()} disabled={readOnly || isDisabledPermission} placeholder="0" />
                                            </td>
                                            {!readOnly && (
                                                <td className="border border-gray-300 text-center">
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <button onClick={() => setPlateDetails(prev => [...prev, { plateName: "", qty: "" }])} className="p-0.5 bg-blue-50 hover:bg-blue-100 rounded" title="Add row" tabIndex={-1} disabled={isDisabledPermission}>
                                                            <Plus size={11} className="text-blue-700" />
                                                        </button>
                                                        <button onClick={() => setPlateDetails(prev => { const next = prev.filter((_, i) => i !== idx); return next.length > 0 ? next : [{ plateName: "", qty: "" }]; })} className="p-0.5 bg-red-50 hover:bg-red-100 rounded" title="Delete row" tabIndex={-1} disabled={isDisabledPermission}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-700" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={sizeModalOpen} onClose={() => { setSizeModalOpen(false) }} widthClass="w-[550px]">
                <div className="bg-slate-100 p-3 rounded-lg">
                    <div className="bg-white p-3 rounded-lg flex justify-between items-center mb-3 shadow-sm">
                        <h3 className="text-[16px] font-bold text-slate-800">Size Wise Details</h3>
                        <div className="flex gap-2">
                            <button className="bg-white text-indigo-600 border border-indigo-600 px-4 py-0.5 rounded text-[12px] hover:bg-indigo-50 font-semibold transition-colors flex items-center gap-1 shadow-sm" onClick={() => setSizeModalOpen(false)}>Done</button>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="h-[220px] overflow-y-auto">
                            <table className="w-[420px] border-separate border-spacing-0 border-t border-l border-slate-200">
                                <thead>
                                    <tr>
                                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-1 py-1 text-center text-[11px] font-bold text-black uppercase w-6">S.No</th>
                                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-40 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">Size</th>
                                        <th className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200 w-16 px-1 py-1 text-center text-[11px] font-bold text-black uppercase">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobCardSizeDetails?.map((item, idx) => (
                                        <tr key={idx} className="h-8 hover:bg-slate-50 transition-colors">
                                            <td className="border-b border-r border-slate-200 px-1 py-0 text-center text-[11px] text-black">{idx + 1}</td>
                                            <td className="border-b border-r border-slate-200 px-3 py-0 text-[11px] text-black">
                                                {sizeList?.data?.find((s) => s.id === item.sizeId)?.name || "All Items"}
                                            </td>
                                            <td className="border-b border-r border-slate-200 px-1 py-0">
                                                <input type="number" className="w-full h-7 border-none text-right pr-2 bg-transparent text-[11px] text-black outline-none focus:bg-white" value={item.qty} disabled={true} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                        sizeList={sizeList} styleItemList={styleItemList}
                        qrCodeDataUrl={qrCodeDataUrl}
                        employeeList={employeeList}
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
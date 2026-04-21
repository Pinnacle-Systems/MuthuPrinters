import { IoArrowBackCircleSharp } from "react-icons/io5";
import {
    CheckBox,
    DropdownInput,
    ReusableInput,
    TextInput,
} from "../../../Inputs";
import { orderTypes } from "../../../Utils/DropdownData";
import { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import {
    findFromList,
    getCommonParams,
    ModeChip,
} from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiEdit2, FiSave } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import { PartyMaster } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import { useAddJobCardMutation, useGetJobCardByIdQuery, useUpdateJobCardMutation } from "../../../redux/uniformService/JobCardService.js";
import { useGetProcessMasterQuery } from "../../../redux/services/ProcessMasterService.js";
import { useGetProcessGroupMasterQuery } from "../../../redux/services/ProcessGroupMaster.service.js";
import secureLocalStorage from "react-secure-storage";

const JobCardForm = ({
    onClose,
    id,
    setId,
    readOnly,
    setReadOnly,
    customerList,
    gsmList,
}) => {
    const today = new Date();

    const [docDate, setDocDate] = useState(
        moment.utc(today).format("YYYY-MM-DD"),
    );
    const [customerId, setCustomerId] = useState("");
    const [remarks, setRemarks] = useState("");
    const [requirements, setRequirements] = useState("");
    const [orderType, setOrderType] = useState("Sample");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [jobType, setJobType] = useState("Internal");
    const [docId, setDocId] = useState("");
    const [searchDocId, setSearchDocId] = useState("");
    const [searchDocDate, setSearchDocDate] = useState("");
    const [summary, setSummary] = useState(false);
    const [attachmentModal, setAttachmentModal] = useState(false);
    const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [orderQty, setOrderQty] = useState("");
    const [termsAndCondition, setTermsAndCondition] = useState("");
    const [termsId, setTermsId] = useState("");
    const customerRef = useRef(null);
    const [gsm, setGsm] = useState("");
    const [otherBoard, setOtherBoard] = useState("");
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
    const [boardItems, setBoardItems] = useState([]);
    const [selectedProcesses, setSelectedProcesses] = useState([]);
    const [selectedMachines, setSelectedMachines] = useState([]);
    const [laminations, setLaminations] = useState([]);
    const [varnishes, setVarnishes] = useState([]);
    const [plates, setPlates] = useState([]);
    const [dies, setDies] = useState([]);

    const { userId, finYearId, branchId } = getCommonParams();
    const params = {
        companyId: secureLocalStorage.getItem(
            sessionStorage.getItem("sessionId") + "userCompanyId"
        ),
    };
    const {
        data: processList,
        isLoading: isProcessLoading,
        isFetching: isProcessFetching,
    } = useGetProcessMasterQuery({ params });

    const {
        data: processGroupList,
        isLoading: isProcessGroupLoading,
        isFetching: isProcessGroupFetching,
    } = useGetProcessGroupMasterQuery({ params });

    const boardIds = processGroupList?.data?.find((item) => item.name === "BOARD QUALITY")?.processGroupList?.map((item) => item.id);
    const boardList = processList?.data?.filter((item) => boardIds?.includes(item.id));

    const defaultIds = processGroupList?.data?.find((item) => item.name === "DEFAULT")?.processGroupList?.map((item) => item.id);
    const defaultList = processList?.data?.filter((item) => defaultIds?.includes(item.id));

    const laminationIds = processGroupList?.data?.find((item) => item.name === "LAMINATION")?.processGroupList?.map((item) => item.id);
    const laminationList = processList?.data?.filter((item) => laminationIds?.includes(item.id));

    const varnishIds = processGroupList?.data?.find((item) => item.name === "VARNISH")?.processGroupList?.map((item) => item.id);
    const varnishList = processList?.data?.filter((item) => varnishIds?.includes(item.id));

    const machineIds = processGroupList?.data?.find((item) => item.name === "MACHINE")?.processGroupList?.map((item) => item.id);
    const machineList = processList?.data?.filter((item) => machineIds?.includes(item.id));

    const {
        data: singleData,
        isFetching: isSingleFetching,
        isLoading: isSingleLoading,
    } = useGetJobCardByIdQuery(id, { skip: !id });

    const [addData] = useAddJobCardMutation();
    const [updateData] = useUpdateJobCardMutation();

    const syncFormWithDb = useCallback(
        (data) => {
            setDocId(data?.docId ? data?.docId : "New");
            setDocDate(
                data?.docDate
                    ? moment.utc(data.docDate).format("YYYY-MM-DD")
                    : moment.utc(new Date()).format("YYYY-MM-DD"),
            );
            setOrderType(
                data?.orderType || "Sample",
            );
            setCustomerId(data?.customerId || "");
            setRemarks(data?.remarks || "");
            setAttachments(data?.attachments ? data?.attachments : []);
            setOrderQty(data?.orderQty || "");
            setRequirements(data?.requirements || "");
            setDeliveryDate(
                data?.deliveryDate
                    ? moment.utc(data.deliveryDate).format("YYYY-MM-DD")
                    : "",
            );
            setTermsAndCondition(data?.termsAndCondition || "");
            setTermsId(data?.termsId || "");
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
        orderType,
        jobType,
        customerId,
        remarks,
        finYearId,
        attachments: attachments?.filter((i) => i.filePath),
        orderQty,
        requirements,
        deliveryDate,
        termsAndCondition,
        termsId,
    };

    const handleSubmitCustom = async (callback, data, text, nextProcess) => {
        try {
            const formData = new FormData();
            for (let key in data) {
                if (key == "attachments") {
                    formData.append(
                        key,
                        JSON.stringify(
                            data[key].map((i) => ({
                                ...i,
                                filePath:
                                    i.filePath instanceof File ? i.filePath.name : i.filePath,
                            })),
                        ),
                    );
                    data[key].forEach((option) => {
                        if (option?.filePath instanceof File) {
                            formData.append("images", option.filePath);
                        }
                    });
                } else if (
                    Array.isArray(data[key]) ||
                    (typeof data[key] === "object" && data[key] !== null)
                ) {
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key]);
                }
            }
            let returnData;
            if (text === "Updated") {
                returnData = await callback({ id, body: formData }).unwrap();
            } else {
                returnData = await callback(formData).unwrap();
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
                                    customerRef.current?.focus();
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
            }
        } catch (error) {
            console.log("handle", error);
        }
    };

    const validateData = (data) => {
        const items = data?.inwardItems || [];
        const checks = [
            { condition: !data.orderType, title: "Order Type is required!" },
            { condition: !data.orderQty, title: "Order Quantity is required!" },
            { condition: !data.deliveryDate, title: "Delivery Date is required!" },
            { condition: !data.customerId, title: "Customer is required!" },
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
        if (id) {
            if (!window.confirm("Are you sure update the details ...?")) {
                return;
            }
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
            saveData("close");
        }
    };

    const handleBoardQualityChange = (boardId) => {
        setBoardItems((prev) =>
            prev.includes(boardId)
                ? prev.filter((id) => id !== boardId)
                : [...prev, boardId]
        );
    };

    const handleProcessChange = (boardId) => {
        setSelectedProcesses((prev) =>
            prev.includes(boardId)
                ? prev.filter((id) => id !== boardId)
                : [...prev, boardId]
        );
    };

    const handleMachineChange = (boardId) => {
        setSelectedMachines((prev) =>
            prev.includes(boardId)
                ? prev.filter((id) => id !== boardId)
                : [...prev, boardId]
        );
    };

    const handleMainCheck = (id) => {
        setLaminations((prev) => {
            const exists = prev.find((l) => l.processId === id);

            if (exists) {
                return prev.filter((l) => l.processId !== id);
            } else {
                return [...prev, { processId: id, isSelected: true, isFront: false, isFrontAndBack: false }];
            }
        });
    };

    const handleFrontCheck = (id) => {
        setLaminations((prev) =>
            prev.map((l) =>
                l.processId === id ? { ...l, isFront: !l.isFront } : l
            )
        );
    };

    const handleFrontBackCheck = (id) => {
        setLaminations((prev) =>
            prev.map((l) =>
                l.processId === id ? { ...l, isFrontAndBack: !l.isFrontAndBack } : l
            )
        );
    };

    const handleMainCheckVarnish = (id) => {
        setVarnishes((prev) => {
            const exists = prev.find((l) => l.processId === id);

            if (exists) {
                return prev.filter((l) => l.processId !== id);
            } else {
                return [...prev, { processId: id, isSelected: true, isFront: false, isFrontAndBack: false }];
            }
        });
    };

    const handleFrontVarnishCheck = (id) => {
        setVarnishes((prev) =>
            prev.map((l) =>
                l.processId === id ? { ...l, isFront: !l.isFront } : l
            )
        );
    };

    const handleFrontBackVarnishCheck = (id) => {
        setVarnishes((prev) =>
            prev.map((l) =>
                l.processId === id ? { ...l, isFrontAndBack: !l.isFrontAndBack } : l
            )
        );
    };

    return (
        <>
            <div className="w-full  mx-auto rounded-md shadow-lg px-2 py-1 overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        Job Card
                        <ModeChip id={id} readOnly={readOnly} />
                    </h1>
                    <button
                        onClick={() => {
                            onClose();
                        }}
                        className="text-indigo-600 hover:text-indigo-700"
                        title="Back to Report"
                    >
                        <IoArrowBackCircleSharp className="w-7 h-7" />
                    </button>
                </div>
            </div>
            <div className="space-y-1.5 py-2" onKeyDown={handleKeyDown}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
                        <h2 className="font-medium text-slate-700 mb-1 text-xs">Basic Details</h2>
                        <div className="grid grid-cols-4 gap-1">
                            <ReusableInput
                                label="Order Entry No"
                                readOnly
                                value={docId}
                            />
                            <ReusableInput
                                label="Order Entry Date"
                                value={docDate}
                                type={"date"}
                                required={true}
                                readOnly={true}
                                disabled
                            />
                            <DropdownInput
                                name="Order Type"
                                options={orderTypes}
                                value={orderType}
                                setValue={(value) => {
                                    setOrderType(value);
                                }}
                                required={true}
                                readOnly={readOnly}
                                disabled={readOnly}
                                ref={customerRef}
                            />

                            <div className="w-28">
                                <TextInput
                                    name={"Order Quantity"}
                                    value={orderQty}
                                    setValue={setOrderQty}
                                    readOnly={readOnly}
                                    required={true}
                                    type={"number"}
                                    onFocus={(e) => {
                                        e.target.select();
                                    }}
                                    onBlur={(e) =>
                                        setOrderQty(
                                            e.target.value ? Number(e.target.value).toFixed(3) : "",
                                        )
                                    }
                                    className={"text-right"}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
                        <h2 className="font-medium text-slate-700 mb-1 text-xs">
                            Customer Details
                        </h2>
                        <div className="grid grid-cols-4 gap-1">
                            <div className="col-span-2">
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
                                    disabled={id}
                                />
                            </div>
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

                            <TextInput
                                name="Phone"
                                placeholder="Contact name"
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
                <div className="border border-slate-200 p-2 py-3 bg-white rounded-md shadow-sm gap-x-2 flex">
                    <div className="w-1/2">
                        <fieldset className="border border-gray-300 rounded-md pb-2">
                            <legend className="font-medium text-slate-700 mb-2  bg-white text-xs px-1">Board Details</legend>
                            <div className="grid grid-cols-5 gap-x-2">
                                {boardList?.map((item) => (
                                    // <label key={item.id} className="text-xs font-medium gap-2 flex text-slate-700">
                                    //     <input
                                    //         type="checkbox"
                                    //         onClick={() => handleBoardQualityChange(item.id)}
                                    //         checked={boardItems.includes(item.id)}
                                    //         className={`px-2 py-1 rounded border ${boardList === item.id ? "bg-indigo-500 text-white" : "bg-white "
                                    //             }`}
                                    //     />
                                    //     {item.name}
                                    // </label>
                                    <CheckBox
                                        name={item.name}
                                        value={boardItems.includes(item.id)}
                                        setValue={() => handleBoardQualityChange(item.id)}
                                        readOnly={readOnly}
                                    />
                                ))}
                            </div>
                            <div className="grid grid-cols-4 gap-x-2 mt-3 px-2">
                                <DropdownWithModal
                                    name="Gsm"
                                    options={dropDownListObject(
                                        id
                                            ? gsmList?.data
                                            : gsmList?.data?.filter(
                                                (item) => item?.active,
                                            ),
                                        "name",
                                        "id",
                                    )}
                                    value={gsm}
                                    setValue={setGsm}
                                    required={true}
                                    readOnly={readOnly}
                                    className={`w-[150px]`}
                                    addNewLabel="+ Add New Gsm"
                                    // childComponent={GsmMaster}
                                    addNewModalWidth="w-[90%] h-[95%]"
                                />
                                <TextInput
                                    name="Others / Board"
                                    value={otherBoard}
                                    setValue={setOtherBoard}
                                    readOnly={readOnly}
                                    type={"text"}
                                // onFocus={(e) => {
                                //     e.target.select();
                                // }}
                                />
                                <TextInput
                                    name="Full Board"
                                    value={fullBoard}
                                    setValue={setFullBoard}
                                    readOnly={readOnly}
                                    type={"text"}
                                />
                                <TextInput
                                    name="No of Pocket"
                                    value={noOfPockets}
                                    setValue={setNoOfPockets}
                                    readOnly={readOnly}
                                    type={"text"}
                                />
                            </div>
                            <div className="px-2 mt-3">
                                <div className="flex gap-x-2 mt-2">

                                    <TextInput
                                        name="Cutting Size"
                                        value={cuttingSize}
                                        setValue={setCuttingSize}
                                        readOnly={readOnly}
                                        type={"text"}
                                    />
                                    <TextInput
                                        name="Running Qty"
                                        value={runningQty}
                                        setValue={setRunningQty}
                                        readOnly={readOnly}
                                        type={"text"}
                                        className={"text-right"}
                                    />
                                    <div className="flex items-center gap-2 mt-2 mx-2">
                                        <CheckBox
                                            name="4 COLOR"
                                            value={isFourColor}
                                            setValue={setIsFourColor}
                                            readOnly={readOnly}
                                        />
                                        <CheckBox
                                            name="CUT COLOR"
                                            value={isCutColor}
                                            setValue={setIsCutColor}
                                            readOnly={readOnly}
                                        />
                                        <CheckBox
                                            name="FRONT"
                                            value={isFront}
                                            setValue={setIsFront}
                                            readOnly={readOnly}
                                        />
                                        <CheckBox
                                            name="FRONT & BACK"
                                            value={isFrontAndBack}
                                            setValue={setIsFrontAndBack}
                                            readOnly={readOnly}
                                        />
                                    </div>

                                </div>


                            </div>
                        </fieldset>
                        <fieldset className="border border-gray-300 rounded-md pb-2 mt-2">
                            <legend className="font-medium text-slate-700 mb-2 bg-white text-xs px-1">
                                Varnish  Details
                            </legend>

                            <div className="flex flex-col gap-2">
                                {varnishList?.map((item) => {
                                    const selected = varnishes.find(l => l.processId === item.id);

                                    return (
                                        <div key={item.id} className="grid grid-cols-3 gap-2">

                                            {/* Main checkbox */}
                                            <CheckBox
                                                name={item.name}
                                                value={!!selected}
                                                setValue={() => handleMainCheckVarnish(item.id)}
                                                readOnly={readOnly}
                                            />

                                            {/* FRONT */}
                                            <CheckBox
                                                name="FRONT"
                                                value={selected?.isFront || false}
                                                setValue={() => handleFrontVarnishCheck(item.id)}
                                                readOnly={!selected}
                                            />

                                            {/* FRONT / BACK */}
                                            <CheckBox
                                                name="FRONT / BACK"
                                                value={selected?.isFrontAndBack || false}
                                                setValue={() => handleFrontBackVarnishCheck(item.id)}
                                                readOnly={!selected}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </fieldset>
                    </div>
                    <div className="w-1/2">
                        <fieldset className="border border-gray-300 rounded-md pb-2">
                            <legend className="font-medium text-slate-700 mb-2  bg-white text-xs px-1">Process</legend>
                            <div className="grid grid-cols-5 gap-x-2">
                                {defaultList?.map((item) => (
                                    <CheckBox
                                        name={item.name}
                                        value={selectedProcesses.includes(item.id)}
                                        setValue={() => handleProcessChange(item.id)}
                                        readOnly={readOnly}
                                    />
                                ))}
                            </div>
                        </fieldset>
                        <fieldset className="border border-gray-300 rounded-md pb-2 mt-2">
                            <legend className="font-medium text-slate-700 mb-2 bg-white text-xs px-1">
                                Lamination Details
                            </legend>

                            <div className="flex flex-col gap-2">
                                {laminationList?.map((item) => {
                                    const selected = laminations.find(l => l.processId === item.id);

                                    return (
                                        <div key={item.id} className="grid grid-cols-3 gap-2">

                                            {/* Main checkbox */}
                                            <CheckBox
                                                name={item.name}
                                                value={!!selected}
                                                setValue={() => handleMainCheck(item.id)}
                                                readOnly={readOnly}
                                            />

                                            {/* FRONT */}
                                            <CheckBox
                                                name="FRONT"
                                                value={selected?.isFront || false}
                                                setValue={() => handleFrontCheck(item.id)}
                                                readOnly={!selected}
                                            />

                                            {/* FRONT / BACK */}
                                            <CheckBox
                                                name="FRONT / BACK"
                                                value={selected?.isFrontAndBack || false}
                                                setValue={() => handleFrontBackCheck(item.id)}
                                                readOnly={!selected}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </fieldset>
                        <fieldset className="border border-gray-300 rounded-md pb-2">
                            <legend className="font-medium text-slate-700 mb-2  bg-white text-xs px-1">Machine Details</legend>
                            <div className="grid grid-cols-5 gap-x-2">
                                {machineList?.map((item) => (
                                    <CheckBox
                                        name={item.name}
                                        value={selectedMachines.includes(item.id)}
                                        setValue={() => handleMachineChange(item.id)}
                                        readOnly={readOnly}
                                    />
                                ))}

                                <CheckBox
                                    name="CMYK"
                                    value={isCMYK}
                                    setValue={setIsCMYK}
                                    readOnly={readOnly}
                                />
                                <CheckBox
                                    name="CUT COL"
                                    value={isCutColMachine}
                                    setValue={setIsCutColMachine}
                                    readOnly={readOnly}
                                />
                                <CheckBox
                                    name="FRONT"
                                    value={isFrontMachine}
                                    setValue={setIsFrontMachine}
                                    readOnly={readOnly}
                                />
                                <CheckBox
                                    name="FRONT & BACK"
                                    value={isFrontBackMachine}
                                    setValue={setIsFrontBackMachine}
                                    readOnly={readOnly}
                                />

                            </div>
                        </fieldset>
                    </div>

                </div>

            </div>

            <div className="flex flex-col md:flex-row gap-2 justify-between mt-4">
                {/* Left Buttons */}
                <div className="flex gap-2 flex-wrap">
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
                        className="bg-indigo-500 text-white px-4 py-1 rounded-md hover:bg-indigo-600 flex items-center text-xs"
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
                        className="bg-indigo-500 text-white px-4 py-1 rounded-md hover:bg-indigo-600 flex items-center text-xs"
                    >
                        <FiSave className="w-4 h-4 mr-2" />
                        Save & New
                    </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {!id ||
                        (readOnly && (
                            <button
                                className="bg-yellow-600 text-white px-4 py-1 rounded-md hover:bg-yellow-700 flex items-center text-xs"
                                onClick={() => setReadOnly(false)}
                            >
                                <FiEdit2 className="w-4 h-4 mr-2" />
                                Edit
                            </button>
                        ))}

                </div>
            </div>
        </>
    );
};
export default JobCardForm;

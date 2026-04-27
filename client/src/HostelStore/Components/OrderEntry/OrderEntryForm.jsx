import { IoArrowBackCircleSharp } from "react-icons/io5";

import {
    DateInputNew,
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
    renameFile,
} from "../../../Utils/helper";
import { toast } from "react-toastify";
import { FiEdit2, FiSave } from "react-icons/fi";
import { HiOutlineRefresh } from "react-icons/hi";
import Swal from "sweetalert2";
import { dropDownListObject } from "../../../Utils/contructObject";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";
import { PartyMaster } from "../index.js";
import { DropdownWithModal } from "../../../Inputs/Reuseable.js";
import Modal from "../../../UiComponents/Modal/index.js";
import { getImageUrlPath } from "../../../Constants/index.js";
import { Plus } from "lucide-react";
import { useAddOrderEntryMutation, useGetOrderEntryByIdQuery, useUpdateOrderEntryMutation } from "../../../redux/uniformService/OrderEntryService.js";
import { QRCodeCanvas } from "qrcode.react";
import CommonFormFooter from "../../../Basic/components/Reuseable/CommonFormFooter.jsx";
import { PDFViewer } from "@react-pdf/renderer";
import OrderEntryPrintFormat from "./OrderEntryPrintFormat.jsx";
import { FiFileText, FiPrinter } from "react-icons/fi";
const OrderEntryForm = ({
    onClose,
    id,
    setId,
    readOnly,
    setReadOnly,
    customerList,
    termsData,
    branchList,
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
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
    const qrRef = useRef(null);
    const customerRef = useRef(null);
    const childRecord = useRef(0);

    const [dispatchInvalidate] = useInvalidateTags();

    const { userId, finYearId, branchId } = getCommonParams();

    const {
        data: singleData,
        isFetching: isSingleFetching,
        isLoading: isSingleLoading,
    } = useGetOrderEntryByIdQuery(id, { skip: !id });

    const [addData] = useAddOrderEntryMutation();
    const [updateData] = useUpdateOrderEntryMutation();

    const searchFields = {
        searchDocId,
        searchDocDate,
    };

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
            childRecord.current = data?.childRecord ? data?.childRecord : 0;
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
        docId,
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

    const findDuplicates = (items) => {
        const seen = new Map(); // key -> first index
        const duplicates = [];

        return duplicates; // empty array = no duplicates
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

    useEffect(() => {
        customerRef.current?.focus();
    }, []);

    useEffect(() => {
        if (attachments?.length >= 4) return;
        setAttachments((prev) => {
            let newArray = Array.from({ length: 4 - prev?.length }, () => {
                return { date: today, filePath: "", log: "", name: "" };
            });
            return [...prev, ...newArray];
        });
    }, [setAttachments, attachments]);

    function handleInputChange(value, index, field) {
        const newBlend = structuredClone(attachments);
        newBlend[index][field] = value;
        setAttachments(newBlend);
    }

    function openPreview(filePath) {
        window.open(
            filePath instanceof File
                ? URL.createObjectURL(filePath)
                : getImageUrlPath(filePath),
        );
    }

    function addNewComments() {
        setAttachments((prev) => [...prev, { log: "", date: today, filePath: "" }]);
    }

    function deleteRow(index) {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    }

    return (
        <>
            {attachmentModal && (
                <Modal
                    isOpen={attachmentModal}
                    onClose={() => {
                        setAttachmentModal(false);
                        setSelectedAttachmentIndex(null);
                    }}
                    widthClass="p-4 w-[600px] h-[420px]"
                >

                </Modal>
            )}

            {printModalOpen && (
                <Modal
                    isOpen={printModalOpen}
                    onClose={() => setPrintModalOpen(false)}
                    widthClass="w-[90%] h-[90%]"
                >
                    <PDFViewer className="w-full h-full border-none">
                        <OrderEntryPrintFormat
                            data={data}
                            customerDetails={customerList?.data?.find(c => c.id === customerId)}
                            branchData={branchList?.data?.find(b => b.id === branchId)}
                            qrCodeDataUrl={qrCodeDataUrl}
                        />
                    </PDFViewer>
                </Modal>
            )}
            <div className="w-full  mx-auto rounded-md shadow-lg px-2 py-1 overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        Order Entry
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
            <div className="space-y-2 py-2" onKeyDown={handleKeyDown}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
                        <h2 className="font-medium text-slate-700 mb-1 text-xs">Basic Details</h2>
                        <div className="grid grid-cols-2 gap-1">
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

                        </div>
                    </div>

                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
                        <h2 className="font-medium text-slate-700 mb-1 text-xs">Order Details</h2>
                        <div className="grid grid-cols-3 gap-1 ">
                            <DropdownInput
                                name="Order Type"
                                options={orderTypes}
                                value={orderType}
                                setValue={(value) => {
                                    setOrderType(value);
                                }}
                                required={true}
                                readOnly={readOnly}
                                disabled={readOnly || childRecord.current > 0}
                                ref={customerRef}
                            />

                            <div className="w-28">
                                <TextInput
                                    name={"Order Quantity"}
                                    value={orderQty}
                                    setValue={setOrderQty}
                                    readOnly={readOnly || childRecord.current > 0}
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
                            <div className="w-28">
                                <DateInputNew
                                    name="Delivery Date"
                                    value={deliveryDate}
                                    setValue={setDeliveryDate}
                                    required={true}
                                    readOnly={readOnly}
                                    type={"date"}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
                        <h2 className="font-medium text-slate-700 mb-1 text-xs">
                            Customer Details
                        </h2>
                        <div className="grid grid-cols-2 gap-1">
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
                                    disabled={readOnly || childRecord.current > 0}
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
                    <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm col-span-1">
                        <h2 className="font-medium text-slate-700 mb-1 text-xs">QR Code</h2>
                        <div className="flex flex-col items-center justify-center gap-2">
                            {docId && docId !== "New" ? (
                                <>
                                    <QRCodeCanvas
                                        ref={qrRef}
                                        value={JSON.stringify({ id, docId })}
                                        size={96}
                                        className="border border-slate-200 rounded"
                                    />
                                    <span className="text-xs text-slate-400">Scan to identify order</span>
                                </>
                            ) : (
                                <div className="w-24 h-24 flex items-center justify-center border border-dashed border-slate-300 rounded text-slate-400 text-xs text-center px-2">
                                    QR appears after save
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="border border-slate-200 p-2 py-3 bg-white rounded-md shadow-sm gap-x-4 flex">
                    <div className="w-1/2 px-2">
                        <fieldset className="">
                            <legend className="font-medium text-slate-700 mb-2 text-xs">Customer Requirements</legend>
                            <textarea
                                readOnly={readOnly}
                                value={requirements}
                                onChange={(e) => {
                                    setRequirements(e.target.value);
                                }}
                                className="w-full overflow-auto px-2.5 py-2 text-xs border border-slate-300 rounded-md 
focus:outline-none focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"                            placeholder="Requirements..."
                                onKeyDown={(e) => {
                                    if (e.ctrlKey && e.key === "Enter") {
                                        e.preventDefault();

                                        const textarea = e.target;
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;

                                        const newValue =
                                            requirements.substring(0, start) + "\n" + requirements.substring(end);

                                        setRequirements(newValue);

                                        // ✅ Restore focus + cursor properly
                                        requestAnimationFrame(() => {
                                            textarea.focus();
                                            textarea.setSelectionRange(start + 1, start + 1);
                                        });
                                    }
                                }}
                                rows={9}
                            />
                        </fieldset>
                    </div>
                    <div className="w-1/2 space-y-2 px-2">
                        <h2 className="text-xs font-medium text-slate-700">
                            Attachments
                        </h2>

                        {/* Drag & Drop Zone */}
                        {/* <div
                            className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center cursor-pointer hover:bg-indigo-50 transition"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file && selectedAttachmentIndex !== null) {
                                    handleInputChange(
                                        renameFile(file),
                                        selectedAttachmentIndex,
                                        "filePath",
                                    );
                                }
                            }}
                            onClick={() =>
                                document.getElementById("modal-file-upload")?.click()
                            }
                        >
                            <p className="text-sm text-slate-500">
                                Drag & drop here, or{" "}
                                <span className="text-indigo-600 font-medium underline">
                                    click to browse
                                </span>
                            </p>
                            {selectedAttachmentIndex !== null ? (
                                <p className="text-xs text-indigo-500 mt-1">
                                    Uploading to row:{" "}
                                    <strong>{selectedAttachmentIndex + 1}</strong>
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400 mt-1">
                                    Select a row below first
                                </p>
                            )}
                        </div> */}

                        {/* Hidden file input for drag & drop zone */}
                        <input
                            type="file"
                            id="modal-file-upload"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files[0] && selectedAttachmentIndex !== null) {
                                    handleInputChange(
                                        renameFile(e.target.files[0]),
                                        selectedAttachmentIndex,
                                        "filePath",
                                    );
                                    e.target.value = "";
                                }
                            }}
                            disabled={readOnly}
                        />

                        {/* Attachments Table */}
                        <div className="max-h-[170px] overflow-auto">
                            <div className="border-collapse bg-[#F1F1F0] shadow-sm overflow-auto">
                                <table className="bg-gray-200 text-gray-700 text-xs table-auto w-full">
                                    <thead className="py-2 font-medium sticky top-0">
                                        <tr>
                                            <th className="py-2 text-xs w-10 text-center border-r border-white/50">
                                                S.No
                                            </th>
                                            <th className="py-2 text-xs w-60 text-center border-r border-white/50">
                                                Name
                                            </th>
                                            <th className="py-2 text-xs w-60 text-center border-r border-white/50">
                                                File
                                            </th>
                                            <th className="py-2 text-xs w-10 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attachments?.map((item, index) => (
                                            <tr
                                                key={index}
                                                onClick={() => setSelectedAttachmentIndex(index)}
                                                className={`transition-colors border-b border-gray-200 text-[12px] cursor-pointer ${index % 2 === 0
                                                    ? "bg-white hover:bg-gray-50"
                                                    : "bg-gray-100 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {/* S.No */}
                                                <td className="border-r border-white/50 h-8 text-center">
                                                    {index + 1}
                                                </td>

                                                {/* Name */}
                                                <td className="border-r border-white/50 h-8">
                                                    <input
                                                        type="text"
                                                        className="text-left rounded py-1 px-2 w-full focus:outline-none focus:ring focus:border-blue-300 bg-transparent"
                                                        value={item?.name}
                                                        onChange={(e) =>
                                                            handleInputChange(e.target.value, index, "name")
                                                        }
                                                        onClick={(e) => e.stopPropagation()}
                                                        disabled={readOnly}
                                                    />
                                                </td>

                                                {/* File */}
                                                <td className="border-r border-white/50 h-8 px-2">
                                                    <div className="flex items-center gap-2">
                                                        {!readOnly && (
                                                            <label
                                                                htmlFor={`modal-row-upload-${index}`}
                                                                className="cursor-pointer flex items-center justify-center p-1 bg-gray-100 rounded hover:bg-gray-200"
                                                                title="Attach file"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                📎
                                                                <input
                                                                    type="file"
                                                                    id={`modal-row-upload-${index}`}
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        if (e.target.files[0]) {
                                                                            handleInputChange(
                                                                                renameFile(e.target.files[0]),
                                                                                index,
                                                                                "filePath",
                                                                            );
                                                                            e.target.value = "";
                                                                        }
                                                                    }}
                                                                    disabled={readOnly}
                                                                />
                                                            </label>
                                                        )}

                                                        {item.filePath ? (
                                                            <>
                                                                <span className="truncate max-w-[120px] text-green-700 font-medium">
                                                                    ✅ {item.filePath?.name ?? item.filePath}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openPreview(item.filePath);
                                                                    }}
                                                                    className="text-blue-600 text-xs hover:underline"
                                                                >
                                                                    View
                                                                </button>
                                                                {!readOnly && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleInputChange("", index, "filePath");
                                                                        }}
                                                                        className="text-red-600 text-xs"
                                                                        title="Remove file"
                                                                        disabled={readOnly}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">
                                                                No file
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="w-[30px] border-gray-200 h-8">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addNewComments();
                                                            }}
                                                            disabled={readOnly}
                                                            className="flex items-center px-1 bg-blue-50 rounded"
                                                        >
                                                            <Plus size={18} className="text-blue-800" />
                                                        </button>
                                                        <button
                                                            className="flex items-center px-1 bg-red-50 rounded"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteRow(index);
                                                                if (selectedAttachmentIndex === index) {
                                                                    setSelectedAttachmentIndex(null);
                                                                }
                                                            }}
                                                            disabled={readOnly}
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4 text-red-800"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
            <CommonFormFooter
                remarks={remarks}
                hasSummaryTitle={"Summary"}
                setRemarks={setRemarks}
                terms={termsAndCondition}
                setTerms={setTermsAndCondition}
                readOnly={readOnly}
                showTermSelect={true}
                termValue={termsId}
                onTermChange={(value) => setTermsId(value)}
                termOptions={(
                    id ? termsData?.data : termsData?.data?.filter((item) => item?.active)
                )?.map((item) => ({
                    value: item?.id,
                    label: item?.name,
                    templateText: item?.description || "",
                })) || []}
                totalsRows={[
                    {
                        key: "orderType",
                        label: "Order Type",
                        value: orderType,
                        summaryColumn: "left",
                    },
                    {
                        key: "orderQty",
                        label: "Order Qty",
                        value: orderQty,
                        summaryColumn: "left",
                    },
                ]}
            />
            {/* <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm ">
                    <h2 className="font-medium text-slate-700 mb-2 text-xs">
                        Remarks
                    </h2>
                    <textarea
                        readOnly={readOnly}
                        value={remarks}
                        onChange={(e) => {
                            setRemarks(e.target.value);
                        }}
                        className="w-full h-10 overflow-auto px-2.5 py-2 text-xs border border-slate-300 rounded-md focus:outline-none   focus:ring-1 focus:ring-indigo-200 focus:border-indigo-500"
                        placeholder="Additional notes..."
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

                <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm flex">
                    <div className="w-1/2">

                        <h2 className="font-medium text-slate-700 mb-2 text-base">
                            Summary
                        </h2>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Order Type:</span>
                                <span className="text-sm text-slate-600">{orderType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Order Quantity:</span>
                                <span className="text-sm text-slate-600">{orderQty}</span>
                            </div>

                        </div>

                    </div>
                </div>

            </div> */}

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

                    {id && (
                        <button
                            onClick={() => {
                                if (qrRef.current) {
                                    setQrCodeDataUrl(qrRef.current.toDataURL("image/png"));
                                }
                                setPrintModalOpen(true);
                            }}
                            className="bg-slate-600 text-white px-4 py-1 rounded-md hover:bg-slate-700 flex items-center text-xs"
                        >
                            <FiFileText className="w-4 h-4 mr-2" />
                            PDF Export
                        </button>
                    )}
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
export default OrderEntryForm;

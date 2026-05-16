import React, { useState } from "react";
import { findFromList } from "../../../Utils/helper";

export const DEFAULT_ROW_COUNT = 5;

export const makeEmptyRow = () => ({
    processId: "",
    outwardDetailId: "",
    receivedQty: "",
    wastageQty: "",
    acceptedQty: "",
});

const InwardDetails = ({
    inwardDetails,
    setInwardDetails,
    readOnly,
    processList,
    id,
    childRecord,
}) => {
    const [contextMenu, setContextMenu] = useState(null);

    const deleteMainRow = (index) =>
        setInwardDetails((prev) => prev.filter((_, i) => i !== index));

    const handleDeleteAllRows = () =>
        setInwardDetails(Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow));

    const handleInputChange = (value, index, field) => {
        setInwardDetails((prev) => {
            const rows = [...prev];
            let row = { ...rows[index], [field]: value };

            // Auto-calculate acceptedQty = receivedQty - wastageQty
            if (field === "receivedQty" || field === "wastageQty") {
                const received = field === "receivedQty" ? Number(value) || 0 : Number(row.receivedQty) || 0;
                const wastage = field === "wastageQty" ? Number(value) || 0 : Number(row.wastageQty) || 0;
                row.acceptedQty = received - wastage;
            }

            rows[index] = row;
            return rows;
        });
    };

    const handleRightClick = (e, rowIndex) => {
        if (!inwardDetails[rowIndex]?.processId) return;
        e.preventDefault();
        setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, rowId: rowIndex });
    };

    let sNo = 0;

    return (
        <>
            <div className="w-full h-full overflow-y-auto bg-white py-1">
                <table className="table-fixed bg-white border-collapse">
                    <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
                        <tr>
                            <th className="w-10 px-2 py-2 text-center font-medium border border-gray-300">
                                S.No
                            </th>
                            <th className="w-44 px-2 py-2 text-center font-medium border border-gray-300">
                                Process <span className="text-red-500">*</span>
                            </th>
                            <th className="w-28 px-2 py-2 text-center font-medium border border-gray-300">
                                Received Qty <span className="text-red-500">*</span>
                            </th>
                            <th className="w-28 px-2 py-2 text-center font-medium border border-gray-300">
                                Wastage Qty
                            </th>
                            <th className="w-28 px-2 py-2 text-center font-medium border border-gray-300">
                                Accepted Qty
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {(inwardDetails || []).map((row, index) => {
                            const isEmpty = !row.processId;
                            if (!isEmpty) sNo++;

                            const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                            const isDisabled = readOnly || childRecord?.current > 0 || isEmpty;

                            return (
                                <tr
                                    key={index}
                                    className={`${rowBg} border-b border-gray-200 h-7`}
                                    onContextMenu={(e) => {
                                        if (!readOnly && !isEmpty) handleRightClick(e, index);
                                    }}
                                >
                                    {/* S.No */}
                                    <td className="w-10 border border-gray-300 text-[11px] text-center text-gray-500">
                                        {isEmpty ? "" : sNo}
                                    </td>

                                    {/* Process */}
                                    <td className="border border-gray-300 text-[11px] px-1 font-medium">
                                        {findFromList(row.processId, processList?.data, "name") || ""}
                                    </td>

                                    {/* Received Qty */}
                                    <td className="border border-gray-300 text-[11px]">
                                        <input
                                            type="number"
                                            min="0"
                                            className={`w-full text-right px-1 text-[11px] outline-none h-7 ${isDisabled
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-transparent focus:bg-white"
                                                }`}
                                            value={row.receivedQty}
                                            onChange={(e) => handleInputChange(e.target.value, index, "receivedQty")}
                                            onBlur={(e) =>
                                                handleInputChange(
                                                    e.target.value ? Number(e.target.value) : "",
                                                    index,
                                                    "receivedQty"
                                                )
                                            }
                                            onFocus={(e) => e.target.select()}
                                            disabled={isDisabled}
                                            placeholder={isEmpty ? "" : "0"}
                                        />
                                    </td>

                                    {/* Wastage Qty */}
                                    <td className="border border-gray-300 text-[11px]">
                                        <input
                                            type="number"
                                            min="0"
                                            className={`w-full text-right px-1 text-[11px] outline-none h-7 ${isDisabled
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-transparent focus:bg-white"
                                                }`}
                                            value={row.wastageQty}
                                            onChange={(e) => handleInputChange(e.target.value, index, "wastageQty")}
                                            onBlur={(e) =>
                                                handleInputChange(
                                                    e.target.value ? Number(e.target.value) : "",
                                                    index,
                                                    "wastageQty"
                                                )
                                            }
                                            onFocus={(e) => e.target.select()}
                                            disabled={isDisabled}
                                            placeholder={isEmpty ? "" : "0"}
                                        />
                                    </td>

                                    {/* Accepted Qty — auto-calculated, read-only */}
                                    <td className="border border-gray-300 text-[11px] text-right px-1 bg-gray-50">
                                        {isEmpty ? "" : (row.acceptedQty !== "" && row.acceptedQty !== undefined ? row.acceptedQty : "")}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                    <tfoot>
                        <tr className="bg-gray-100 h-7 font-medium text-gray-800 text-[12px]">
                            <td className="text-right px-2 border border-gray-300" colSpan={2}>Total</td>
                            <td className="text-right border border-gray-300 px-1">
                                {inwardDetails?.reduce((s, r) => s + (Number(r.receivedQty) || 0), 0) || ""}
                            </td>
                            <td className="text-right border border-gray-300 px-1">
                                {inwardDetails?.reduce((s, r) => s + (Number(r.wastageQty) || 0), 0) || ""}
                            </td>
                            <td className="text-right border border-gray-300 px-1">
                                {inwardDetails?.reduce((s, r) => s + (Number(r.acceptedQty) || 0), 0) || ""}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {contextMenu && (
                <div
                    style={{
                        position: "fixed",
                        top: `${contextMenu.mouseY - 20}px`,
                        left: `${contextMenu.mouseX + 20}px`,
                        boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
                        padding: "8px",
                        borderRadius: "4px",
                        zIndex: 1000,
                    }}
                    className="bg-gray-100"
                    onMouseLeave={() => setContextMenu(null)}
                >
                    <div className="flex flex-col gap-1">
                        <button
                            className="text-black text-[12px] text-left rounded px-1 hover:bg-gray-200"
                            onClick={() => { deleteMainRow(contextMenu.rowId); setContextMenu(null); }}
                        >
                            Delete Row
                        </button>
                        <button
                            className="text-black text-[12px] text-left rounded px-1 hover:bg-gray-200"
                            onClick={() => { handleDeleteAllRows(); setContextMenu(null); }}
                        >
                            Delete All
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default InwardDetails;
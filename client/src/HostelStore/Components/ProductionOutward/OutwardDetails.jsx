import React, { useState } from 'react';
import { DropdownNew } from '../../../Inputs';
import { findFromList } from '../../../Utils/helper';
import { Plus } from 'lucide-react';

export const DEFAULT_ROW_COUNT = 10;

export const makeEmptyRow = () => ({
    processId: "",
    sentQty: "",
    receivedQty: 0,
    pendingQty: "",
    sequence: "",
    remarks: "",
    allocationDetailId: "",
});

const OutwardDetails = ({
    outwardDetails,
    setOutwardDetails,
    readOnly,
    jobCardList,
    processList,
    id,
    childRecord,
}) => {
    const [contextMenu, setContextMenu] = useState(null);

    const addMainRow = () =>
        setOutwardDetails(prev => [...prev, makeEmptyRow()]);

    const deleteMainRow = (index) =>
        setOutwardDetails(prev => prev.filter((_, i) => i !== index));

    const handleDeleteAllRows = () =>
        setOutwardDetails(Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow));

    const handleInputChange = (value, index, field) => {
        setOutwardDetails(prev => {
            const rows = [...prev];
            let row = { ...rows[index], [field]: value };

            // Auto-calculate pendingQty when sentQty changes
            if (field === "sentQty") {
                const sent = Number(value) || 0;
                const received = Number(row.receivedQty) || 0;
                row.pendingQty = sent - received;
            }

            rows[index] = row;
            return rows;
        });
    };

    const handleRightClick = (e, rowIndex) => {
        e.preventDefault();
        setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, rowId: rowIndex });
    };

    return (
        <>
            <div className="w-full h-full overflow-y-auto bg-white">
                <table className="table-fixed min-h-full bg-white border-collapse">
                    <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
                        <tr>
                            <th className="w-10 px-2 py-2 text-center font-medium border border-gray-300">S.No</th>
                            <th className="w-10 px-2 py-2 text-center font-medium border border-gray-300">Seq</th>
                            <th className="w-48 px-2 py-2 text-center font-medium border border-gray-300">
                                Process <span className="text-red-500">*</span>
                            </th>
                            <th className="w-20 px-2 py-2 text-center font-medium border border-gray-300">
                                Sent Qty <span className="text-red-500">*</span>
                            </th>
                            <th className="w-20 px-2 py-2 text-center font-medium border border-gray-300">
                                Received Qty
                            </th>
                            <th className="w-20 px-2 py-2 text-center font-medium border border-gray-300">
                                Pending Qty
                            </th>
                            <th className="w-40 px-2 py-2 text-center font-medium border border-gray-300">
                                Remarks
                            </th>
                            <th className="w-14 px-2 py-2 text-center font-medium border border-gray-300">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {(outwardDetails || []).map((row, index) => {
                            const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                            return (
                                <tr
                                    key={index}
                                    className={`${rowBg} border-b border-gray-200 h-7 cursor-pointer`}
                                    onContextMenu={(e) => {
                                        if (!readOnly) handleRightClick(e, index);
                                    }}
                                >
                                    {/* S.No */}
                                    <td className="w-10 border border-gray-300 text-[11px] text-center">
                                        {index + 1}
                                    </td>

                                    {/* Sequence */}
                                    <td className="border border-gray-300 text-[11px]">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full text-center px-1 bg-transparent text-[11px] outline-none focus:bg-white h-7"
                                            value={row.sequence}
                                            onChange={(e) => handleInputChange(e.target.value, index, "sequence")}
                                            onFocus={(e) => e.target.select()}
                                            disabled={readOnly || childRecord?.current > 0}
                                            placeholder="0"
                                        />
                                    </td>

                                    {/* Process */}
                                    <td className="border border-gray-300 text-[11px]">
                                        <DropdownNew
                                            name=""
                                            dataList={processList?.data?.filter(i => id ? true : i?.active !== false)}
                                            value={row.processId}
                                            setValue={(val) => handleInputChange(val, index, "processId")}
                                            readOnly={readOnly || childRecord?.current > 0}
                                        />
                                    </td>

                                    {/* Sent Qty */}
                                    <td className="border border-gray-300 text-[11px]">
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full text-right px-1 bg-transparent text-[11px] outline-none focus:bg-white h-7"
                                            value={row.sentQty}
                                            onChange={(e) => handleInputChange(e.target.value, index, "sentQty")}
                                            onBlur={(e) => handleInputChange(
                                                e.target.value ? Number(e.target.value) : "",
                                                index, "sentQty"
                                            )}
                                            onFocus={(e) => e.target.select()}
                                            disabled={readOnly || childRecord?.current > 0}
                                            placeholder="0"
                                        />
                                    </td>

                                    {/* Received Qty — read only, filled on inward */}
                                    <td className="border border-gray-300 text-[11px] text-right px-1 bg-gray-50">
                                        {row.receivedQty || 0}
                                    </td>

                                    {/* Pending Qty — auto calculated */}
                                    <td className="border border-gray-300 text-[11px] text-right px-1 bg-gray-50">
                                        {row.sentQty !== "" ? (Number(row.sentQty) || 0) - (Number(row.receivedQty) || 0) : ""}
                                    </td>

                                    {/* Remarks */}
                                    <td className="border border-gray-300 text-[11px]">
                                        <input
                                            type="text"
                                            className="w-full px-1 bg-transparent text-[11px] outline-none focus:bg-white h-7"
                                            value={row.remarks || ""}
                                            onChange={(e) => handleInputChange(e.target.value, index, "remarks")}
                                            disabled={readOnly}
                                            placeholder=""
                                        />
                                    </td>

                                    {/* Actions */}
                                    <td className="w-14 border border-gray-300 bg-gray-50 text-center">
                                        {!readOnly && (
                                            <div className="flex items-center justify-center gap-0.5 px-0.5">
                                                <button
                                                    onClick={addMainRow}
                                                    className="flex items-center justify-center p-0.5 bg-blue-50 hover:bg-blue-100 rounded"
                                                    title="Add row"
                                                    tabIndex={-1}
                                                >
                                                    <Plus size={13} className="text-blue-700" />
                                                </button>
                                                <button
                                                    onClick={() => deleteMainRow(index)}
                                                    className="flex items-center justify-center p-0.5 bg-red-50 hover:bg-red-100 rounded"
                                                    title="Delete row"
                                                    tabIndex={-1}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-700" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                    <tfoot>
                        <tr className="bg-gray-100 h-7 font-medium text-gray-800 text-[12px]">
                            <td className="text-right px-2 border border-gray-300 font-medium" colSpan={4}>Total</td>
                            <td className="text-right border border-gray-300 px-1 font-medium">
                                {outwardDetails?.reduce((s, r) => s + (Number(r.sentQty) || 0), 0)}
                            </td>
                            <td className="text-right border border-gray-300 px-1 font-medium">
                                {outwardDetails?.reduce((s, r) => s + (Number(r.receivedQty) || 0), 0)}
                            </td>
                            <td className="text-right border border-gray-300 px-1 font-medium">
                                {outwardDetails?.reduce((s, r) => s + ((Number(r.sentQty) || 0) - (Number(r.receivedQty) || 0)), 0)}
                            </td>
                            <td className="border border-gray-300" />
                            <td className="border border-gray-300 bg-gray-50" />
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

export default OutwardDetails;
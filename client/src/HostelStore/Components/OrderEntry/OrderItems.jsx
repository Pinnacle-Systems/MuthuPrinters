import React, { useState, useEffect } from 'react'
import FxSelect, { FxSelectWithAdd } from '../../../Inputs';
import { Gsm, Size, StyleItemMaster, UomMaster } from '..';

const OrderItems = ({ orderItems, setOrderItems, readOnly, styleItemList, sizeList, uomList, id, gsmList }) => {
    const EMPTY_ROW = {
        styleItemId: "",
        sizeId: "",
        uomId: "",
        orderQty: "",
    };

    const [contextMenu, setContextMenu] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    const addRow = () => {
        setOrderItems([...orderItems, EMPTY_ROW]);
    };

    const deleteRow = (index) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };
    const handleInputChange = (value, index, field) => {
        const newRows = [...orderItems];
        newRows[index] = {
            ...newRows[index], // ✅ clone object
            [field]: value,
        };
        setOrderItems(newRows);
    };

    const handleRightClick = (event, rowIndex, type) => {
        event.preventDefault();
        setContextMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            rowId: rowIndex,
            type,
        });
    };
    const deleteSelectedRows = () => {
        setOrderItems((rows) => rows.filter((r) => !r.selected));
        setContextMenu(null);
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    useEffect(() => {
        if (id && orderItems?.length > 0) {
            const requiredRows = 4;
            const missingRows = requiredRows - orderItems.length;

            if (missingRows > 0) {
                setOrderItems([
                    ...orderItems,
                    ...Array.from({ length: missingRows }, () => ({ ...EMPTY_ROW })),
                ]);
            }
        }

        if (!id && (!orderItems || orderItems.length === 0)) {
            setOrderItems(Array.from({ length: 4 }, () => ({ ...EMPTY_ROW })));
        }
    }, [id, orderItems]);

    return (
        <>
            <div
                className={`w-full min-h-[200px] max-h-[200px] overflow-y-auto  mb-2`}
            >
                <table className="w-full border-collapse table-fixed">
                    <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
                        <tr>
                            <th className={`w-12 px-4 py-2 text-center font-medium `}>
                                S.No
                            </th>
                            <th className={`w-96 px-2 py-2 text-center font-medium `}>
                                Description of Goods
                            </th>
                            <th className={`w-32 px-4 py-2 text-center font-medium `}>
                                Size
                            </th>
                            <th className={`w-20 px-4 py-2 text-center font-medium `}>
                                UOM
                            </th>
                            <th className={`w-20 px-4 py-2 text-center font-medium `}>
                                GSM
                            </th>
                            <th className={`w-24 px-4 py-2 text-center font-medium  `}>
                                Qty
                            </th>
                            <th className={`w-20 px-1 py-2 text-center font-medium  `}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(orderItems ? orderItems : [])?.map((row, index) => (
                            <tr
                                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"} border border-blue-gray-200 cursor-pointer h-6`}
                                key={index}
                                onContextMenu={(e) => {
                                    if (!readOnly) {
                                        handleRightClick(e, index, "");
                                    }
                                }}
                            >
                                <td className="w-12 border border-gray-300 text-[11px]  text-center ">
                                    {index + 1}
                                </td>
                                <td className=" text-[11px] border border-gray-300 text-left">
                                    <FxSelectWithAdd
                                        inputId={`styleItemId-input-${index}`}
                                        value={row.styleItemId}
                                        onChange={(val) =>
                                            handleInputChange(val, index, "styleItemId")
                                        }
                                        options={(styleItemList?.data || [])
                                            .filter((item) => (id ? true : item.active))
                                            .map((item) => ({
                                                label: item.name,
                                                value: item.id,
                                            }))}
                                        readOnly={readOnly}
                                        placeholder=""
                                        onBlur={() =>
                                            handleInputChange(row.styleItemId, index, "styleItemId")
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Delete") {
                                                handleInputChange("", index, "styleItemId");
                                            }
                                        }}
                                        addNew={true}
                                        childComponent={StyleItemMaster}
                                        addNewModalWidth="w-[50%] h-[57%]"
                                    />
                                </td>
                                <td className=" border border-gray-300 text-[11px] ">
                                    <FxSelectWithAdd
                                        value={row.sizeId}
                                        onChange={(val) =>
                                            handleInputChange(val, index, "sizeId")
                                        }
                                        options={(sizeList?.data || [])
                                            .filter((item) => (id ? true : item.active))
                                            .map((item) => ({
                                                label: item.name,
                                                value: item.id,
                                            }))}
                                        readOnly={readOnly}
                                        placeholder=""
                                        onBlur={() =>
                                            handleInputChange(row.sizeId, index, "sizeId")
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Delete") {
                                                handleInputChange("", index, "sizeId");
                                            }
                                        }}
                                        addNew={true}
                                        childComponent={Size}
                                        addNewModalWidth="w-[30%] h-[45%]"
                                    />
                                </td>
                                <td className=" border border-gray-300 text-[11px] ">
                                    <FxSelectWithAdd
                                        value={row.uomId}
                                        onChange={(val) => handleInputChange(val, index, "uomId")}
                                        options={(uomList?.data || [])
                                            .filter((item) => (id ? true : item.active))
                                            .map((item) => ({
                                                label: item.name,
                                                value: item.id,
                                            }))}
                                        readOnly={readOnly}
                                        placeholder=""
                                        onBlur={() =>
                                            handleInputChange(row.uomId, index, "uomId")
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Delete") {
                                                handleInputChange("", index, "uomId");
                                            }
                                        }}
                                        addNew={true}
                                        childComponent={UomMaster}
                                        addNewModalWidth="w-[30%] h-[45%]"
                                    />
                                </td>
                                <td className=" border border-gray-300 text-[11px] ">
                                    <FxSelectWithAdd
                                        value={row.gsmId}
                                        onChange={(val) => handleInputChange(val, index, "gsmId")}
                                        options={(gsmList?.data || [])
                                            .filter((item) => (id ? true : item.active))
                                            .map((item) => ({
                                                label: item.name,
                                                value: item.id,
                                            }))}
                                        readOnly={readOnly}
                                        placeholder=""
                                        onBlur={() =>
                                            handleInputChange(row.gsmId, index, "gsmId")
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Delete") {
                                                handleInputChange("", index, "gsmId");
                                            }
                                        }}
                                        addNew={true}
                                        childComponent={Gsm}
                                        addNewModalWidth="w-[30%] h-[45%]"
                                    />
                                </td>
                                <td className="border-blue-gray-200 text-[11px] border border-gray-300  text-right">
                                    <input
                                        id={`orderQty-input-${index}`}
                                        onKeyDown={(e) => {
                                            if (e.code === "Minus" || e.code === "NumpadSubtract")
                                                e.preventDefault();
                                            if (e.key === "Delete") {
                                                handleInputChange("", index, "orderQty");
                                            }
                                            // if (e.key === "Enter") {
                                            //     e.preventDefault(); // prevent form submit or line break
                                            //     e.stopPropagation();

                                            //     const nextQtyInput = document.querySelector(
                                            //         `#orderQty-input-${index + 1}`,
                                            //     );
                                            //     if (nextQtyInput) {
                                            //         nextQtyInput.focus();
                                            //     }
                                            // }
                                        }}
                                        min={"0"}
                                        type="number"
                                        className="text-right  px-1 w-full table-data-input"
                                        onFocus={(e) => {
                                            e.target.select();
                                            setFocusedField(`${index}`);
                                        }}
                                        value={
                                            focusedField === `${index}`
                                                ? (row?.orderQty ?? "")
                                                : row?.orderQty
                                                    ? Number(row.orderQty).toFixed(2)
                                                    : ""
                                        }
                                        onChange={(e) =>
                                            handleInputChange(e.target.value, index, "orderQty")
                                        }
                                        onBlur={(e) => {
                                            const val = e.target.value;
                                            handleInputChange(
                                                val ? Number(val).toFixed(2) : "",
                                                index,
                                                "orderQty",
                                            );
                                        }}
                                        disabled={readOnly}
                                    />
                                </td>
                                <td className="w-2 border border-gray-300">
                                    <input
                                        className="w-full table-data-input"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                const next = document.querySelector(
                                                    `#orderQty-input-${index + 1}`,
                                                );
                                                if (index === orderItems.length - 1) {
                                                    addRow();
                                                }
                                                if (next) next.focus();
                                            }
                                            if (e.key === "Tab" && e.target.value === "") {
                                                e.preventDefault();
                                                termsRef?.current?.focus();
                                            }
                                        }}
                                        disabled={readOnly}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 h-6 font-medium text-gray-800 text-[12px]">
                            <td
                                className="text-right px-4 border border-gray-300 font-medium  "
                                colSpan={5}
                            >
                                Total
                            </td>
                            <td className="text-right border border-gray-300 px-1 font-medium  ">
                                {orderItems
                                    ?.reduce(
                                        (sum, row) => sum + (Number(row.orderQty) || 0),
                                        0,
                                    )
                                    .toFixed(2)}
                            </td>
                            <td className="border border-gray-300" colSpan={1}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {
                contextMenu && (
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
                        onMouseLeave={handleCloseContextMenu}
                    >
                        <div className="flex flex-col gap-1">
                            <button
                                className=" text-black text-[12px] text-left rounded px-1"
                                onClick={() => {
                                    deleteRow(contextMenu.rowId);
                                    deleteSelectedRows();
                                    handleCloseContextMenu();
                                }}
                            >
                                Delete
                            </button>
                            <button
                                className=" text-black text-[12px] text-left rounded px-1"
                                onClick={() => {
                                    handleDeleteAllRows();
                                    handleCloseContextMenu();
                                }}
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                )
            }
        </>
    )
}


export default OrderItems
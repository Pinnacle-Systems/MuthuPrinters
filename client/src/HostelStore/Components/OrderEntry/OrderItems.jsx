import React, { useState, useEffect } from 'react'
import FxSelect, { FxSelectWithAdd } from '../../../Inputs';
import { Gsm, Size, StyleItemMaster, UomMaster } from '..';
import { FiEye } from 'react-icons/fi';
import { useLazyGetSizeTemplateByIdQuery } from '../../../redux/services/SizeTemplateMaster';

const OrderItems = ({ orderItems, setOrderItems, readOnly, styleItemList, sizeList, uomList, id, gsmList, itemGroupList }) => {
    const EMPTY_ROW = {
        styleItemId: "",
        sizeId: "",
        uomId: "",
        orderQty: "",
        itemGroupId: "",
        type: "",
        gsm: "",
        sizeBreakup: [],
        trackingType: "None",

    };
    const [triggerGetTemplateById] = useLazyGetSizeTemplateByIdQuery();

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

    const handleOpenSizeModal = async (index) => {
        setActiveRowIndex(index);
        setSizeModalOpen(true);

        const currentRow = orderItems[index];
        const hasEmptyBreakup =
            !currentRow.sizeBreakup || currentRow.sizeBreakup.length === 0;

        let targetTemplateId = currentRow.sizeTemplateId;

        if (!targetTemplateId) {
            const selectedItem = styleItemList?.data?.find(
                (item) => item.id === currentRow.styleItemId,
            );
            targetTemplateId = selectedItem?.sizeTemplateId;
        }

        if (targetTemplateId && hasEmptyBreakup) {
            try {
                const response =
                    await triggerGetTemplateById(targetTemplateId).unwrap();
                const template = response?.data;
                if (template && template.SizeTemplateList) {
                    const initialBreakup = template.SizeTemplateList.map((t) => ({
                        sizeId: t.sizeId,
                        qty: "",
                        barcodeFrom: "",
                        barcodeTo: "",
                    }));

                    setOrderItems((prev) => {
                        const newRows = [...prev];
                        if (newRows[index]) {
                            newRows[index] = {
                                ...newRows[index],
                                sizeTemplateId: targetTemplateId,
                                sizeBreakup: initialBreakup,
                            };
                        }
                        return newRows;
                    });
                }
            } catch (e) {
                console.error("Failed to fetch size template details", e);
            }
        }
    };

    useEffect(() => {
        if (id && orderItems?.length > 0) {
            const requiredRows = 14;
            const missingRows = requiredRows - orderItems.length;

            if (missingRows > 0) {
                setOrderItems([
                    ...orderItems,
                    ...Array.from({ length: missingRows }, () => ({ ...EMPTY_ROW })),
                ]);
            }
        }

        if (!id && (!orderItems || orderItems.length === 0)) {
            setOrderItems(Array.from({ length: 14 }, () => ({ ...EMPTY_ROW })));
        }
    }, [id, orderItems]);

    return (
        <>
            <div className="w-full h-full overflow-y-auto bg-white">
                <table className="table-fixed min-h-full bg-white my-2">
                    <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
                        <tr>
                            <th className={`w-12 px-4 py-2 text-center font-medium `}>
                                S.No
                            </th>
                            <th className={`w-96 px-2 py-2 text-center font-medium `}>
                                Description of Goods
                            </th>
                            <th className={`w-40 px-4 py-2 text-center font-medium `}>
                                Item Group
                            </th>
                            <th className={`w-40 px-4 py-2 text-center font-medium `}>
                                Type
                            </th>
                            <th className="w-16 px-1 py-2 text-center font-medium border border-gray-300">
                                Size
                            </th>
                            <th className={`w-24 px-4 py-2 text-center font-medium `}>
                                GSM
                            </th>
                            <th className={`w-24 px-4 py-2 text-center font-medium `}>
                                UOM
                            </th>
                            <th className={`w-24 px-4 py-2 text-center font-medium  `}>
                                Qty
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
                                <td className="border border-gray-300">
                                    <FxSelectWithAdd
                                        value={row.itemGroupId}
                                        onChange={(val) =>
                                            handleInputChange(val, index, "itemGroupId")
                                        }
                                        options={(itemGroupList?.data || [])
                                            .filter((item) => (id ? true : item.active))
                                            .map((item) => ({ label: item.name, value: item.id }))}
                                        readOnly={readOnly}
                                        placeholder=""
                                    />
                                </td>
                                <td className="border border-gray-300">
                                    <FxSelect
                                        value={row.trackingType || "None"}
                                        onChange={(val) =>
                                            handleInputChange(val, index, "trackingType")
                                        }
                                        options={[
                                            { label: "None", value: "None" },
                                            { label: "Barcode", value: "Barcode" },
                                            { label: "Size Template", value: "Size Template" },
                                            {
                                                label: "Size Template + Barcode",
                                                value: "Size Template + Barcode",
                                            },
                                        ]}
                                        readOnly={readOnly}
                                        placeholder=""
                                    />
                                </td>
                                <td className="border border-gray-300">
                                    <div className="flex items-center justify-center h-full w-full">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenSizeModal(index)}
                                            disabled={
                                                !row.styleItemId ||
                                                readOnly ||
                                                !["Size Template", "Size Template + Barcode"].includes(
                                                    row.trackingType,
                                                )
                                            }
                                            className="p-1 text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors"
                                            title="View Sizes"
                                        >
                                            <FiEye size={18} />
                                        </button>
                                    </div>
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

                                <td className="border-blue-gray-200 text-[11px] border border-gray-300  text-right">
                                    <input
                                        id={`orderQty-input-${index}`}
                                        onKeyDown={(e) => {
                                            if (e.code === "Minus" || e.code === "NumpadSubtract")
                                                e.preventDefault();
                                            if (e.key === "Delete") {
                                                handleInputChange("", index, "orderQty");
                                            }
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
                                {/* <td className="w-2 border border-gray-300">
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
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 h-6 font-medium text-gray-800 text-[12px]">
                            <td
                                className="text-right px-4 border border-gray-300 font-medium  "
                                colSpan={7}
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
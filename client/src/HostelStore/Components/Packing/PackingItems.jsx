import React, { useState, useEffect } from "react";
import { FxSelectWithAdd } from "../../../Inputs";
import { ItemGroup, Size, StyleItemMaster, StyleMaster } from "..";
import { findFromList } from "../../../Utils/helper";
import { Plus } from "lucide-react";
import { ItemSubGroupMaster } from "../../../Basic/components";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import Swal from "sweetalert2";
import { formatCurrencyAmount } from "../../../Utils/helper";
import Modal from "../../../UiComponents/Modal";
import { VIEW } from "../../../icons";
import { FaEye, FaTrash } from "react-icons/fa";

import {
  DEFAULT_ROW_COUNT,
  EMPTY_SIZE_ROW,
  EMPTY_STYLE_ROW,
  makeEmptyRow,
  padRows,
} from "./OrderItemsUtils";
import { useGetPackingControlQuery } from "../../../redux/uniformService/PackingControl";

const PackingItems = ({
  orderItems,
  setOrderItems,
  readOnly,
  styleItemList,
  sizeList,
  styleList,
  uomList,
  id,
  requirementRef,
  itemGroupList,
  hsnList,
  childRecord,
  itemSubGroupList,
  enrichedItems,
  taxTemplateId,
  conversionType,
  isSupplierOutside,
  orderType,
  isCustomerExport,
  currencyCode,
  isCurrencySymbol,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [activeModalRowIndex, setActiveModalRowIndex] = useState(null);
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [activePackingBreakupInfo, setActivePackingBreakupInfo] = useState(null);

  const { data: packingControlData, isLoading, isFetching } = useGetPackingControlQuery({});

  const packingPercentage = packingControlData?.data?.[0]?.packingPercentage;


  useEffect(() => {
    if (!Array.isArray(orderItems)) return;
    if (orderItems.length < DEFAULT_ROW_COUNT) {
      setOrderItems(padRows(orderItems));
    }
  }, [orderItems.length, id]);

  const addMainRow = () => setOrderItems((prev) => [...prev, makeEmptyRow()]);

  const deleteMainRow = (index) => {
    setOrderItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length < DEFAULT_ROW_COUNT ? padRows(next) : next;
    });
  };

  const handleDeleteAllRows = () =>
    setOrderItems(Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow));

  const handleInputChange = (value, index, field) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      let row = { ...rows[index], [field]: value };
      if (field === "styleItemId" && value) {
        const found = styleItemList?.data?.find((i) => i.id === value);
        if (found) {
          const hsnId = found.hsnId || "";
          const hsnObj = hsnList?.data?.find((h) => h.id === hsnId);
          row = {
            ...row,
            uomId: found.uomId || "",
            hsnId: hsnId,
            taxPercent: hsnObj ? hsnObj.tax : "",
            styleBreakup: id ? [...(row.styleBreakup || [])] : [EMPTY_STYLE_ROW()],
            orderQty: row.orderQty,
          };
        }
      }

      if (field === "price" || field === "orderQty" || field === "dozen") {
        const qty = field === "orderQty" ? value : row.orderQty;
        const price = field === "price" ? value : row.price;
        const dozen = field === "dozen" ? value : qty / 12;
        if (field !== "dozen") {
          row.dozen = dozen ? Number(dozen).toFixed(2) : "";
        }
        if (conversionType === "DOZEN") {
          row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
        } else {
          row.amount = qty && price ? (qty * price).toFixed(2) : "";
        }
      }

      rows[index] = row;
      return rows;
    });
  };

  const recalculateOrderQty = (rowBreakup) => {
    let orderQty = 0;
    rowBreakup.forEach(style => {
      style.sizeBreakup.forEach(sz => {
        orderQty += (Number(sz.qty) || 0);
      });
    });
    return orderQty;
  };

  const handleStyleChange = (rowIndex, styleIndex, field, value) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const breakup = [...(row.styleBreakup || [])];

      if (field === "styleId" && value) {
        const isDuplicate = breakup.some(
          (item, idx) => idx !== styleIndex && item.styleId === value,
        );
        if (isDuplicate) {
          Swal.fire({
            icon: "warning",
            title: "Duplicate Style",
            text: "This style is already selected. Please select a different style.",
          });
          return prev;
        }
      }

      breakup[styleIndex] = { ...breakup[styleIndex], [field]: value };
      row.styleBreakup = breakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const addStyleRow = (rowIndex) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      row.styleBreakup = [...(row.styleBreakup || []), EMPTY_STYLE_ROW()];
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deleteStyleRow = (rowIndex, styleIndex) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const breakup = row.styleBreakup.filter((_, i) => i !== styleIndex);
      row.styleBreakup = breakup.length > 0 ? breakup : [EMPTY_STYLE_ROW()];

      if (orderType !== "AGAINSTPI") {
        row.orderQty = recalculateOrderQty(row.styleBreakup);
      }

      rows[rowIndex] = row;
      return rows;
    });
  };

  const handleNestedSizeChange = (rowIndex, styleIndex, sizeIndex, field, value) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };
      const sizeBreakup = [...(styleObj.sizeBreakup || [])];

      if (field === "sizeId" && value) {
        const isDuplicate = sizeBreakup.some(
          (item, idx) => idx !== sizeIndex && item.sizeId === value,
        );
        if (isDuplicate) {
          Swal.fire({
            icon: "warning",
            title: "Duplicate Size",
            text: "This size is already selected for this style. Please select a different size.",
          });
          return prev;
        }
      }

      if (field === "packingQty") {
        const currentSize = sizeBreakup[sizeIndex] || {};
        const currentQty = Number(currentSize.qty) || 0;
        const currentAlreadyPackingQty = Number(currentSize.alreadyPackingQty) || 0;
        const enteredPackingQty = Number(value) || 0;

        const maxAllowed = (currentQty * (Number(packingPercentage) || 0)) / 100 + currentQty - currentAlreadyPackingQty;

        if (enteredPackingQty > maxAllowed) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Packing Quantity",
            text: `Packing quantity cannot exceed ${maxAllowed}`,
          });
          return prev;
        }
      }

      if (field === "qty" || field === "packingQty") {
        const newValue = Number(value) || 0;
        let currentTotal = 0;

        styleBreakup.forEach((st, stIdx) => {
          st.sizeBreakup.forEach((sz, szIdx) => {
            if (stIdx === styleIndex && szIdx === sizeIndex) {
              currentTotal += newValue;
            } else {
              currentTotal += (Number(sz.qty) || 0);
            }
          });
        });


      }

      sizeBreakup[sizeIndex] = { ...sizeBreakup[sizeIndex], [field]: value };
      styleObj.sizeBreakup = sizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;


      rows[rowIndex] = row;
      return rows;
    });
  };

  const addNestedSizeRow = (rowIndex, styleIndex) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };

      styleObj.sizeBreakup = [...(styleObj.sizeBreakup || []), EMPTY_SIZE_ROW()];
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deleteNestedSizeRow = (rowIndex, styleIndex, sizeIndex) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };

      const sizeBreakup = styleObj.sizeBreakup.filter((_, i) => i !== sizeIndex);
      styleObj.sizeBreakup = sizeBreakup.length > 0 ? sizeBreakup : [EMPTY_SIZE_ROW()];
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;

      if (orderType !== "AGAINSTPI") {
        row.orderQty = recalculateOrderQty(styleBreakup);
      }
      rows[rowIndex] = row;
      return rows;
    });
  };

  const handlePackingBreakupChange = (rowIndex, styleIndex, sizeIndex, breakupIndex, field, value) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };
      const sizeBreakup = [...(styleObj.sizeBreakup || [])];
      const sizeObj = { ...sizeBreakup[sizeIndex] };
      const packingBreakup = [...(sizeObj.packingBreakup || [])];

      packingBreakup[breakupIndex] = { ...packingBreakup[breakupIndex], [field]: value };

      let totalPackingQty = 0;
      packingBreakup.forEach(item => {
        const bundle = Number(item.bundle) || 0;
        const qty = Number(item.qty) || 0;
        totalPackingQty += (bundle * qty);
      });

      const currentQty = Number(sizeObj.qty) || 0;
      const currentAlreadyPackingQty = Number(sizeObj.alreadyPackingQty) || 0;
      const maxAllowed = (currentQty * (Number(packingPercentage) || 0)) / 100 + currentQty - currentAlreadyPackingQty;

      if (totalPackingQty > maxAllowed) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Packing Quantity",
          text: `Total packing quantity cannot exceed ${maxAllowed}`,
        });
        return prev;
      }

      sizeObj.packingBreakup = packingBreakup;
      sizeObj.packingQty = totalPackingQty;
      sizeBreakup[sizeIndex] = sizeObj;
      styleObj.sizeBreakup = sizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const addPackingBreakupRow = (rowIndex, styleIndex, sizeIndex) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };
      const sizeBreakup = [...(styleObj.sizeBreakup || [])];
      const sizeObj = { ...sizeBreakup[sizeIndex] };

      sizeObj.packingBreakup = [...(sizeObj.packingBreakup || []), { bundle: "", pcs: "" }];

      sizeBreakup[sizeIndex] = sizeObj;
      styleObj.sizeBreakup = sizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deletePackingBreakupRow = (rowIndex, styleIndex, sizeIndex, breakupIndex) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };
      const sizeBreakup = [...(styleObj.sizeBreakup || [])];
      const sizeObj = { ...sizeBreakup[sizeIndex] };

      const packingBreakup = [...(sizeObj.packingBreakup || [])];
      packingBreakup.splice(breakupIndex, 1);

      let totalPackingQty = 0;
      packingBreakup.forEach(item => {
        const bundle = Number(item.bundle) || 0;
        const pcs = Number(item.pcs) || 0;
        totalPackingQty += (bundle * pcs);
      });

      sizeObj.packingBreakup = packingBreakup;
      sizeObj.packingQty = totalPackingQty;
      sizeBreakup[sizeIndex] = sizeObj;
      styleObj.sizeBreakup = sizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;
      rows[rowIndex] = row;
      return rows;
    });
  };

  const handleRightClick = (e, rowIndex) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, rowId: rowIndex });
  };

  return (
    <>
      <Modal
        isOpen={Number.isInteger(currentSelectedIndex)}
        onClose={() => {
          setCurrentSelectedIndex("");
        }}
      >
        <TaxDetailsFullTemplate
          readOnly={readOnly || orderType === "AGAINSTPI"}
          taxTypeId={taxTemplateId}
          currentIndex={currentSelectedIndex}
          setCurrentSelectedIndex={setCurrentSelectedIndex}
          poItems={enrichedItems?.items || orderItems}
          handleInputChange={handleInputChange}
          id={id}
          isNewVersion={false}
          isSupplierOutside={isSupplierOutside}
          currencyCode={currencyCode || isCurrencySymbol}
        />
      </Modal>

      {/* Style & Size Breakup Modal */}
      <Modal
        isOpen={Number.isInteger(activeModalRowIndex)}
        onClose={() => {
          setActiveModalRowIndex(null);
          setActiveStyleIndex(0);
        }}
        widthClass="w-[85vw]"
      >
        <div className="p-4 bg-white rounded-lg h-[75vh] flex flex-col">
          <h2 className="text-lg font-bold mb-4">Style & Size Breakup</h2>
          {activeModalRowIndex !== null && (
            <div className="flex-1 flex gap-4 overflow-hidden border border-gray-200 rounded">
              {/* LEFT PANE: Styles */}
              <div className="w-1/3 bg-gray-50 flex flex-col border-r border-gray-200">
                <div className="p-3 bg-gray-200 font-semibold text-gray-700 text-sm">
                  Styles
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {(orderItems[activeModalRowIndex]?.styleBreakup || []).map((styleRow, styleIdx) => (
                    <div
                      key={styleRow.rowId || styleIdx}
                      onClick={() => setActiveStyleIndex(styleIdx)}
                      className={`p-3 rounded border cursor-pointer transition-colors flex flex-col gap-2 ${activeStyleIndex === styleIdx
                        ? "bg-indigo-50 border-indigo-300 shadow-sm"
                        : "bg-white border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-600 text-xs">Style {styleIdx + 1}</span>
                        {!readOnly && orderType !== "AGAINSTPI" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStyleRow(activeModalRowIndex, styleIdx);
                              if (activeStyleIndex === styleIdx) {
                                setActiveStyleIndex(Math.max(0, styleIdx - 1));
                              } else if (activeStyleIndex > styleIdx) {
                                setActiveStyleIndex(activeStyleIndex - 1);
                              }
                            }}
                            disabled={true}

                            className="text-red-500 hover:bg-red-100 p-1 rounded"
                          >
                            <FaTrash size={10} />
                          </button>
                        )}
                      </div>
                      <div className="w-full" onClick={(e) => e.stopPropagation()}>
                        <FxSelectWithAdd
                          value={styleRow.styleId}
                          onChange={(val) => handleStyleChange(activeModalRowIndex, styleIdx, "styleId", val)}
                          options={(styleList?.data || [])
                            .filter((i) => (id ? true : i.active))
                            .map((i) => ({ label: i.name, value: i.id }))}
                          readOnly={readOnly || childRecord?.current > 0 || orderType === "AGAINSTPI"}
                          placeholder="Select Style"
                          addNew={true}
                          childComponent={StyleMaster}
                          addNewModalWidth="w-[50%] h-[57%]"
                          disabled={true}

                        />
                      </div>
                    </div>
                  ))}

                  {!readOnly && orderType !== "AGAINSTPI" && (
                    <button
                      onClick={() => {
                        addStyleRow(activeModalRowIndex);
                        const newIndex = (orderItems[activeModalRowIndex]?.styleBreakup || []).length;
                        setActiveStyleIndex(newIndex);
                      }}
                      disabled={true}

                      className="w-full mt-2 bg-indigo-600 text-white px-3 py-1.5 rounded shadow-sm hover:bg-indigo-700 text-sm flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Add Style
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT PANE: Sizes */}
              <div className="w-2/3 bg-white flex flex-col">
                <div className="p-3 bg-gray-200 font-semibold text-gray-700 text-sm">
                  Sizes for Style {activeStyleIndex + 1}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {orderItems[activeModalRowIndex]?.styleBreakup?.[activeStyleIndex] ? (
                    <table className="w-full text-left border-collapse border border-gray-300 bg-white text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-2 py-1.5">Size</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-24">Order Qty</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-24">Already Packing Qty</th>

                          <th className="border border-gray-300 px-2 py-1.5 w-24">Packing Qty</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-24">Gross Weight</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-24">Net Weight</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-24">Dimensions</th>

                          <th className="border border-gray-300 px-2 py-1.5 w-16 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(orderItems[activeModalRowIndex].styleBreakup[activeStyleIndex].sizeBreakup || []).map((sizeRow, sizeIdx) => (
                          <tr key={sizeRow.rowId || sizeIdx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-1">
                              <FxSelectWithAdd
                                value={sizeRow.sizeId}
                                onChange={(val) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "sizeId", val)}
                                options={(sizeList?.data || [])
                                  .filter((i) => (id ? true : i.active))
                                  .map((i) => ({ label: i.name, value: i.id }))}
                                readOnly={readOnly || childRecord?.current > 0 || orderType === "AGAINSTPI"}
                                disabled={true}
                                placeholder="Select Size"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                className="w-full text-right outline-none bg-transparent"
                                value={sizeRow.qty}
                                onChange={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "qty", e.target.value)}
                                disabled={true}

                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                className="w-full text-right outline-none bg-transparent"
                                value={sizeRow.alreadyPackingQty}
                                onChange={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "alreadyPackingQty", e.target.value)}
                                disabled={true}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  className="w-full text-right outline-none bg-transparent cursor-not-allowed"
                                  value={sizeRow.packingQty}
                                  readOnly
                                  disabled={readOnly || childRecord?.current > 0 || orderType === "AGAINSTPI"}
                                />
                                {!readOnly && !childRecord?.current > 0 && orderType !== "AGAINSTPI" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActivePackingBreakupInfo({ rowIndex: activeModalRowIndex, styleIndex: activeStyleIndex, sizeIndex: sizeIdx });
                                      if (!(sizeRow.packingBreakup?.length > 0)) {
                                        addPackingBreakupRow(activeModalRowIndex, activeStyleIndex, sizeIdx);
                                      }
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800"
                                    title="Packing Breakup"
                                  >
                                    <FaEye size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                className="w-full text-right outline-none bg-transparent"
                                value={sizeRow.grossWeight}
                                onChange={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "grossWeight", e.target.value)}
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                className="w-full text-right outline-none bg-transparent"
                                value={sizeRow.netWeight}
                                onChange={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "netWeight", e.target.value)}
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                type="text"
                                className="w-full text-right outline-none bg-transparent"
                                value={sizeRow.dimensions}
                                onChange={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "dimensions", e.target.value)}
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {!readOnly && !childRecord?.current > 0 && orderType !== "AGAINSTPI" && (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => addNestedSizeRow(activeModalRowIndex, activeStyleIndex)} className="p-1 bg-blue-100 rounded text-blue-700 hover:bg-blue-200"
                                    disabled={true}

                                  >
                                    <Plus size={12} />
                                  </button>
                                  <button onClick={() => deleteNestedSizeRow(activeModalRowIndex, activeStyleIndex, sizeIdx)} className="p-1 bg-red-100 rounded text-red-700 hover:bg-red-200" disabled={true}

                                  >
                                    <FaTrash size={10} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      Select or add a style to view sizes
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Packing Breakup Modal */}
      <Modal
        isOpen={activePackingBreakupInfo !== null}
        onClose={() => setActivePackingBreakupInfo(null)}
        widthClass="w-[50vw]"
      >
        <div className="p-4 bg-white rounded-lg max-h-[75vh] flex flex-col">
          <h2 className="text-lg font-bold mb-4">Packing Breakup</h2>
          {activePackingBreakupInfo !== null && (
            <div className="flex-1 overflow-auto border border-gray-200 rounded">
              <table className="w-full text-left border-collapse border border-gray-300 bg-white text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-2 py-1.5 w-16 text-center">S.No</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center">Bundle</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center">Qty</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-center">Total</th>
                    <th className="border border-gray-300 px-2 py-1.5 w-16 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(orderItems[activePackingBreakupInfo.rowIndex]?.styleBreakup?.[activePackingBreakupInfo.styleIndex]?.sizeBreakup?.[activePackingBreakupInfo.sizeIndex]?.packingBreakup || []).map((breakupRow, breakupIdx) => (
                    <tr key={breakupIdx} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1 text-center">{breakupIdx + 1}</td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          className="w-full text-right outline-none bg-transparent"
                          value={breakupRow.bundle}
                          onChange={(e) => handlePackingBreakupChange(activePackingBreakupInfo.rowIndex, activePackingBreakupInfo.styleIndex, activePackingBreakupInfo.sizeIndex, breakupIdx, "bundle", e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          className="w-full text-right outline-none bg-transparent"
                          value={breakupRow.qty}
                          onChange={(e) => handlePackingBreakupChange(activePackingBreakupInfo.rowIndex, activePackingBreakupInfo.styleIndex, activePackingBreakupInfo.sizeIndex, breakupIdx, "qty", e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right bg-gray-50 font-semibold">
                        {(Number(breakupRow.bundle) || 0) * (Number(breakupRow.qty) || 0)}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => addPackingBreakupRow(activePackingBreakupInfo.rowIndex, activePackingBreakupInfo.styleIndex, activePackingBreakupInfo.sizeIndex)}
                            className="p-1 bg-blue-100 rounded text-blue-700 hover:bg-blue-200"
                          >
                            <Plus size={12} />
                          </button>
                          {breakupIdx > 0 && (
                            <button
                              onClick={() => deletePackingBreakupRow(activePackingBreakupInfo.rowIndex, activePackingBreakupInfo.styleIndex, activePackingBreakupInfo.sizeIndex, breakupIdx)}
                              className="p-1 bg-red-100 rounded text-red-700 hover:bg-red-200"
                            >
                              <FaTrash size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <div className="w-full h-full overflow-y-auto bg-white">
        <table className="table-fixed min-h-full bg-white border-collapse">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
            <tr>
              <th className="w-10 px-2 py-2 text-center font-medium border border-gray-300">
                S.No
              </th>
              <th className="w-36 px-2 py-2 text-center font-medium border border-gray-300">
                Item Group
              </th>
              <th className="w-36 px-2 py-2 text-center font-medium border border-gray-300">
                Item Sub Group
              </th>
              <th className="w-72 px-2 py-2 text-center font-medium border border-gray-300">
                Description of Goods<span className="text-red-500">*</span>
              </th>
              <th className="w-20 px-2 py-2 text-center font-medium border border-gray-300">
                HSN
              </th>
              <th className="w-20 px-2 py-2 text-center font-medium border border-gray-300">
                UOM
              </th>
              <th className="w-16 px-2 py-2 text-center font-medium border border-gray-300">
                Qty<span className="text-red-500">*</span>
              </th>
              <th className="w-32 px-2 py-2 text-center font-medium border border-gray-300 ">
                Label Width
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Dozen
              </th>
              <th className="w-16 px-2 py-2 text-center font-medium border border-gray-300">
                Breakup
              </th>
              <th className="w-16 px-2 py-2 text-center font-medium border border-gray-300">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {(orderItems || []).map((row, index) => {
              const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";

              return (
                <tr
                  key={row.rowId || index}
                  className={`${rowBg} border-b border-gray-200 h-7 cursor-pointer`}
                  onContextMenu={(e) => {
                    if (!readOnly && orderType !== "AGAINSTPI") {
                      handleRightClick(e, index);
                    }
                  }}
                >
                  <td className="w-10 border border-gray-300 text-[11px] text-center items-center pt-2">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 text-[11px] items-center pt-2">
                    <FxSelectWithAdd
                      value={row.itemGroupId}
                      onChange={(val) => handleInputChange(val, index, "itemGroupId")}
                      options={(itemGroupList?.data || [])
                        .filter((i) => (id ? true : i.active))
                        .map((i) => ({ label: i.name, value: i.id }))}
                      readOnly={readOnly || childRecord?.current > 0 || orderType === "AGAINSTPI"}
                      placeholder=""
                      addNew={true}
                      childComponent={ItemGroup}
                      disabled={true}

                    />
                  </td>
                  <td className="border border-gray-300 text-[11px] items-center pt-2">
                    <FxSelectWithAdd
                      value={row.itemSubGroupId}
                      onChange={(val) => handleInputChange(val, index, "itemSubGroupId")}
                      options={(itemSubGroupList?.data || [])
                        .filter(
                          (i) => (id ? true : i.active) && i.itemGroupId === row.itemGroupId
                        )
                        .map((i) => ({ label: i.name, value: i.id }))}
                      readOnly={readOnly || childRecord?.current > 0 || orderType === "AGAINSTPI"}
                      placeholder=""
                      addNew={true}
                      childComponent={ItemSubGroupMaster}
                      disabled={true}

                    />
                  </td>
                  <td className="text-[11px] border border-gray-300 text-left items-center pt-2">
                    <FxSelectWithAdd
                      value={row.styleItemId}
                      onChange={(val) => handleInputChange(val, index, "styleItemId")}
                      options={(styleItemList?.data || [])
                        .filter(
                          (i) =>
                            (id ? true : i.active) &&
                            i.itemGroupId === row.itemGroupId &&
                            (row.itemSubGroupId ? i.itemSubGroupId === row.itemSubGroupId : true)
                        )
                        .map((i) => ({ label: i.name, value: i.id }))}
                      readOnly={readOnly || childRecord?.current > 0 || orderType === "AGAINSTPI"}
                      placeholder=""
                      addNew={true}
                      childComponent={StyleItemMaster}
                      disabled={true}

                    />
                  </td>
                  <td className="border border-gray-300 text-[11px] items-center pt-2 text-center">
                    <span className="px-1">
                      {findFromList(row.hsnId, hsnList?.data, "name") || ""}
                    </span>
                  </td>
                  <td className="border border-gray-300 text-[11px] items-center pt-2 text-center">
                    <span className="px-1">
                      {findFromList(row.uomId, uomList?.data, "name") || ""}
                    </span>
                  </td>
                  <td className="border border-gray-300 text-[11px] text-right items-center pt-2 pr-1 font-medium">
                    {row.orderQty ? Number(row.orderQty) : ""}
                  </td>
                  <td className="border border-gray-300 text-[11px] text-left items-center pt-2 pl-1 font-medium">
                    <input
                      type="text"
                      value={row.labelWidth}
                      onChange={(e) => handleInputChange(e.target.value, index, "labelWidth")}
                      className="w-full text-left px-1 bg-transparent text-[11px] outline-none focus:bg-white"
                      readOnly={readOnly || orderType === "AGAINSTPI"}
                      disabled={true}

                    />
                  </td>
                  <td className="text-[11px] border border-gray-300 text-right items-center pt-2 pr-1 font-medium">
                    <input
                      type="number"
                      className="text-right px-1 w-full table-data-input outline-none bg-transparent focus:bg-white"
                      value={focusedField === `dozen-${index}` ? (row?.dozen ?? "") : row?.dozen ? Number(row.dozen).toFixed(2) : ""}
                      onChange={(e) => handleInputChange(e.target.value, index, "dozen")}
                      onFocus={(e) => { e.target.select(); setFocusedField(`dozen-${index}`); }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        handleInputChange(val ? Number(val).toFixed(2) : "", index, "dozen");
                        setFocusedField(null);
                      }}
                      disabled={true}
                    />
                  </td>
                  <td className="border border-gray-300 text-center py-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => setActiveModalRowIndex(index)}
                      title="View Style & Size Breakup"
                    >
                      <FaEye size={16} className="mx-auto" />
                    </button>
                  </td>
                  <td className="w-12 border border-gray-300 align-top pt-1 bg-gray-50 text-center">
                    {!readOnly && orderType !== "AGAINSTPI" && (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={addMainRow}
                          className="flex items-center justify-center p-0.5 bg-blue-50 hover:bg-blue-100 rounded"
                          title="Add row"
                          tabIndex={-1}
                          disabled={true}

                        >
                          <Plus size={13} className="text-blue-700" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot className="sticky bottom-0 z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.1)]">
            <tr className="bg-gray-100 h-7 font-medium text-gray-800 text-[12px]">
              <td className="text-right px-2 border border-gray-300 font-medium" colSpan={6}>
                Total
              </td>
              <td className="text-right border border-gray-300 px-1 font-medium">
                {orderItems?.reduce((s, r) => s + (Number(r.orderQty) || 0), 0)}
              </td>
              <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              <td className="text-right border border-gray-300 px-1 font-medium">
                {orderItems?.reduce((s, r) => s + (Number(r.dozen) || 0), 0).toFixed(2)}
              </td>
              <td colSpan={2} className="border border-gray-300 bg-gray-50" />
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
              onClick={() => {
                deleteMainRow(contextMenu.rowId);
                setContextMenu(null);
              }}
            >
              Delete Row
            </button>
            <button
              className="text-black text-[12px] text-left rounded px-1 hover:bg-gray-200"
              onClick={() => {
                handleDeleteAllRows();
                setContextMenu(null);
              }}
            >
              Delete All
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PackingItems;

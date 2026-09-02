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

import { useGetStyleItemMasterQuery, useLazyGetStyleItemMasterByIdQuery } from "../../../redux/services/StyleItemMasterService";
import { useGetStyleMasterQuery } from "../../../redux/services/StyleMasterService";
import { useGetUomQuery } from "../../../redux/services/UomMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService";
import { useGetItemSubGroupMasterQuery } from "../../../redux/services/ItemSubGroupService";
import { getCommonParams } from "../../../Utils/helper";


import {
  DEFAULT_ROW_COUNT,
  EMPTY_SIZE_ROW,
  EMPTY_STYLE_ROW,
  makeEmptyRow,
  padRows,
} from "../OrderEntry/OrderItemsUtils";
import { useGetPackingControlQuery } from "../../../redux/uniformService/PackingControl";

const SalesDeliveryItems = ({
  items,
  enrichedItems,
  setItems,
  readOnly,
  taxTemplateId,
  id,
  isCumInvoice,
  termsRef,
  isSupplierOutside,
  sizeList,
  conversionType,
  isCustomerExport,
  isCurrencySymbol,
  childRecord
}) => {

  const { companyId } = getCommonParams();
  const { data: styleItemList } = useGetStyleItemMasterQuery({ params: { companyId } });
  const { data: uomList } = useGetUomQuery({ params: { companyId } });
  const { data: hsnList } = useGetHsnMasterQuery({ params: { companyId } });
  const { data: styleList } = useGetStyleMasterQuery({ params: { companyId } });
  const { data: itemGroupList } = useGetItemGroupMasterQuery({ params: { companyId } });
  const { data: itemSubGroupList } = useGetItemSubGroupMasterQuery({ params: { companyId } });
  const [triggerGetStyleItem] = useLazyGetStyleItemMasterByIdQuery();



  const { data: packingControlData, isLoading, isFetching } = useGetPackingControlQuery({});

  const deliveryPercentage = packingControlData?.data?.[0]?.packingPercentage;

  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [activeModalRowIndex, setActiveModalRowIndex] = useState(null);
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (!Array.isArray(items)) return;
    if (items.length < DEFAULT_ROW_COUNT) {
      setItems(padRows(items));
    }
  }, [items.length, id]);

  const addMainRow = () => setItems((prev) => [...prev, makeEmptyRow()]);

  const deleteMainRow = (index) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length < DEFAULT_ROW_COUNT ? padRows(next) : next;
    });
  };

  const handleDeleteAllRows = () =>
    setItems(Array.from({ length: DEFAULT_ROW_COUNT }, makeEmptyRow));

  const handleInputChange = (value, index, field) => {
    setItems((prev) => {
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
            qty: row.qty,
          };
        }
        // Fetch specific if needed, but original salesdelivery did triggerGetStyleItem
        triggerGetStyleItem(value).unwrap().then(res => {
          setItems(prev => prev.map((itm, i) => i === index ? { ...itm, hsnId: res?.data?.hsnId, uomId: res?.data?.uomId } : itm));
        }).catch(e => console.error(e));
      }

      if (field === "price" || field === "deliveryQty" || field === "dozen") {
        const qty = field === "deliveryQty" ? value : row.deliveryQty;
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
    let qty = 0;
    rowBreakup.forEach(style => {
      style.sizeBreakup.forEach(sz => {
        qty += (Number(sz.qty) || 0);
      });
    });
    return qty;
  };

  const recalculateDeliveryQty = (rowBreakup) => {
    let qty = 0;
    rowBreakup.forEach(style => {
      style.sizeBreakup.forEach(sz => {
        qty += (Number(sz.deliveryQty) || 0);
      });
    });
    return qty;
  };

  const handleStyleChange = (rowIndex, styleIndex, field, value) => {
    setItems((prev) => {
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
    setItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      row.styleBreakup = [...(row.styleBreakup || []), EMPTY_STYLE_ROW()];
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deleteStyleRow = (rowIndex, styleIndex) => {
    setItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const breakup = row.styleBreakup.filter((_, i) => i !== styleIndex);
      row.styleBreakup = breakup.length > 0 ? breakup : [EMPTY_STYLE_ROW()];

      if (true) {
        row.orderQty = recalculateOrderQty(row.styleBreakup);
        row.deliveryQty = recalculateDeliveryQty(row.styleBreakup);
        const qty = row.deliveryQty;
        const price = row.price;
        const dozen = qty / 12;
        row.dozen = dozen ? dozen.toFixed(2) : "";
        if (conversionType === "DOZEN") {
          row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
        } else {
          row.amount = qty && price ? (qty * price).toFixed(2) : "";
        }
      }

      rows[rowIndex] = row;
      return rows;
    });
  };

  const handleNestedSizeChange = (rowIndex, styleIndex, sizeIndex, field, value) => {
    setItems((prev) => {
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





      if (field === "returnQty") {
        const orderQty = Number(sizeBreakup[sizeIndex].qty) || 0;
        const newReturnQty = Number(value) || 0;
        const allowedPercentage = Number(deliveryPercentage) || 0;
        const maxAllowed = orderQty
        const overllQty = Number(sizeBreakup[sizeIndex].alreadyReturnQty) + newReturnQty;

        if (overllQty > maxAllowed) {
          Swal.fire({
            icon: "warning",
            title: "Exceeds Limit",
            text: `Return Qty cannot exceed ${maxAllowed.toFixed(2)}.`,
          });
          return prev;
        }
      }

      sizeBreakup[sizeIndex] = { ...sizeBreakup[sizeIndex], [field]: value };
      styleObj.sizeBreakup = sizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;

      if (field === "qty" || field === "deliveryQty") {
        if (true) {
          row.orderQty = recalculateOrderQty(styleBreakup);
          row.deliveryQty = recalculateDeliveryQty(styleBreakup);
          const qty = row.deliveryQty;
          const price = row.price;
          const dozen = qty / 12;
          row.dozen = dozen ? dozen.toFixed(2) : "";
          if (conversionType === "DOZEN") {
            row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
          } else {
            row.amount = qty && price ? (qty * price).toFixed(2) : "";
          }
        }
      }

      rows[rowIndex] = row;
      return rows;
    });
  };

  const addNestedSizeRow = (rowIndex, styleIndex) => {
    setItems((prev) => {
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
    setItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const styleBreakup = [...(row.styleBreakup || [])];
      const styleObj = { ...styleBreakup[styleIndex] };

      const sizeBreakup = styleObj.sizeBreakup.filter((_, i) => i !== sizeIndex);
      styleObj.sizeBreakup = sizeBreakup.length > 0 ? sizeBreakup : [EMPTY_SIZE_ROW()];
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;

      if (true) {
        row.orderQty = recalculateOrderQty(styleBreakup);
        row.deliveryQty = recalculateDeliveryQty(styleBreakup);
        const qty = row.deliveryQty;
        const price = row.price;
        const dozen = qty / 12;
        row.dozen = dozen ? dozen.toFixed(2) : "";
        if (conversionType === "DOZEN") {
          row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
        } else {
          row.amount = qty && price ? (qty * price).toFixed(2) : "";
        }
      }

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
        isOpen={Number.isInteger(activeModalRowIndex)}
        onClose={() => {
          setActiveModalRowIndex(null);
          setActiveStyleIndex(0);
        }}
        widthClass="w-[75vw]"
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
                  {(items[activeModalRowIndex]?.styleBreakup || []).map((styleRow, styleIdx) => (
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
                        {!readOnly && true && (
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
                          readOnly={readOnly || childRecord?.current > 0 || false}
                          placeholder="Select Style"
                          addNew={true}
                          childComponent={StyleMaster}
                          addNewModalWidth="w-[50%] h-[57%]"
                        />
                      </div>
                    </div>
                  ))}

                  {!readOnly && true && (
                    <button
                      onClick={() => {
                        addStyleRow(activeModalRowIndex);
                        const newIndex = (items[activeModalRowIndex]?.styleBreakup || []).length;
                        setActiveStyleIndex(newIndex);
                      }}
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
                  {items[activeModalRowIndex]?.styleBreakup?.[activeStyleIndex] ? (
                    <table className="w-full text-left border-collapse border border-gray-300 bg-white text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-2 py-1.5 w-10 text-center">#</th>
                          <th className="border border-gray-300 px-2 py-1.5">Size</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-32">Sales Delivery Qty</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-32">Already Return Qty</th>

                          <th className="border border-gray-300 px-2 py-1.5 w-32">Return Qty</th>

                          <th className="border border-gray-300 px-2 py-1.5 w-20 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(items[activeModalRowIndex].styleBreakup[activeStyleIndex].sizeBreakup || []).map((sizeRow, sizeIdx) => (
                          <tr key={sizeRow.rowId || sizeIdx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-1 text-center">{sizeIdx + 1}</td>
                            <td className="border border-gray-300 px-2 py-1">
                              <FxSelectWithAdd
                                value={sizeRow.sizeId}
                                onChange={(val) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "sizeId", val)}
                                options={(sizeList?.data || [])
                                  .filter((i) => (id ? true : i.active))
                                  .map((i) => ({ label: i.name, value: i.id }))}
                                readOnly={readOnly || childRecord?.current > 0 || false}
                                placeholder="Select Size"
                                addNew={true}
                                childComponent={Size}
                                addNewModalWidth="w-[38%] h-[50%]"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                id={`size-qty-${activeModalRowIndex}-${activeStyleIndex}-${sizeIdx}`}
                                type="number"
                                min="0"
                                className="w-full text-right outline-none bg-transparent h-7"
                                value={sizeRow.qty}
                                onChange={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "qty", e.target.value)}
                                onBlur={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "qty", parseFloat(e.target.value || 0))}
                                disabled={readOnly || childRecord?.current > 0 || false}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-right">
                              {parseFloat(sizeRow.alreadyReturnQty)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                id={`size-qty-${activeModalRowIndex}-${activeStyleIndex}-${sizeIdx}`}
                                type="number"
                                min="0"
                                className="w-full text-right outline-none bg-transparent h-7"
                                value={sizeRow.returnQty}
                                onChange={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "returnQty", e.target.value)}
                                onBlur={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "deliveryQty", parseFloat(e.target.value || 0))}
                                disabled={readOnly || childRecord?.current > 0 || false}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {!readOnly && !childRecord?.current > 0 && true && (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => addNestedSizeRow(activeModalRowIndex, activeStyleIndex)} className="p-1 bg-blue-100 rounded text-blue-700 hover:bg-blue-200" title="Add size row">
                                    <Plus size={12} />
                                  </button>
                                  <button onClick={() => deleteNestedSizeRow(activeModalRowIndex, activeStyleIndex, sizeIdx)} className="p-1 bg-red-100 rounded text-red-700 hover:bg-red-200" title="Delete size row">
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

      <Modal
        isOpen={Number.isInteger(currentSelectedIndex)}
        onClose={() => {
          setCurrentSelectedIndex("");
        }}
      >
        <TaxDetailsFullTemplate
          readOnly={readOnly || false}
          taxTypeId={taxTemplateId}
          currentIndex={currentSelectedIndex}
          setCurrentSelectedIndex={setCurrentSelectedIndex}
          poItems={enrichedItems?.items || items}
          handleInputChange={handleInputChange}
          id={id}
          isNewVersion={false}
          isSupplierOutside={isSupplierOutside}
        // isCurrencySymbol={isCurrencySymbol}
        />
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
                Delivery Qty<span className="text-red-500">*</span>
              </th>
              <th className="w-16 px-2 py-2 text-center font-medium border border-gray-300">
                Return Qty
              </th>
              <th className="w-32 px-2 py-2 text-center font-medium border border-gray-300 ">
                Label Width
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Dozen
              </th>
              {isCumInvoice && <><th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Price {isCurrencySymbol && `(${isCurrencySymbol})`}
                <span className="text-red-500">*</span>
              </th>
                <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                  Gross
                </th>
                {!isCustomerExport && (
                  <th className="w-12 px-1 py-2 text-center font-medium border border-gray-300">
                    Tax
                  </th>
                )}</>}
              <th className="w-16 px-2 py-2 text-center font-medium border border-gray-300">
                Breakup
              </th>
              <th className="w-16 px-2 py-2 text-center font-medium border border-gray-300">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {(items || []).map((row, index) => {
              const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";

              return (
                <tr
                  key={row.rowId || index}
                  className={`${rowBg} border-b border-gray-200 h-7 cursor-pointer`}
                  onContextMenu={(e) => {
                    if (!readOnly && true) {
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
                      readOnly={readOnly || childRecord?.current > 0 || false}
                      placeholder=""
                      onBlur={() => handleInputChange(row.itemGroupId, index, "itemGroupId")}
                      onKeyDown={(e) => {
                        if (e.key === "Delete") handleInputChange("", index, "itemGroupId");
                      }}
                      addNew={true}
                      childComponent={ItemGroup}
                      addNewModalWidth="w-[38%] h-[50%]"
                      nextRef={termsRef}
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
                      readOnly={readOnly || childRecord?.current > 0 || false}
                      placeholder=""
                      onBlur={() => handleInputChange(row.itemSubGroupId, index, "itemSubGroupId")}
                      onKeyDown={(e) => {
                        if (e.key === "Delete") handleInputChange("", index, "itemSubGroupId");
                      }}
                      addNew={true}
                      childComponent={ItemSubGroupMaster}
                      addNewModalWidth="w-[38%] h-[50%]"
                      nextRef={termsRef}
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
                      readOnly={readOnly || childRecord?.current > 0 || false}
                      placeholder=""
                      onBlur={() => handleInputChange(row.styleItemId, index, "styleItemId")}
                      onKeyDown={(e) => {
                        if (e.key === "Delete") handleInputChange("", index, "styleItemId");
                      }}
                      addNew={true}
                      childComponent={StyleItemMaster}
                      addNewModalWidth="w-[50%] h-[57%]"
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
                    {row.salesDeliveryQty ? Number(row.salesDeliveryQty) : ""}
                  </td>
                  <td className="border border-gray-300 text-[11px] text-right items-center pt-2 pr-1 font-medium">
                    {row.returnQty ? Number(row.returnQty) : ""}
                  </td>
                  <td className="border border-gray-300 text-[11px] text-left items-center pt-2 pl-1 font-medium">
                    <input
                      type="text"
                      value={row.labelWidth}
                      onChange={(e) => handleInputChange(e.target.value, index, "labelWidth")}
                      className="w-full text-left px-1 bg-transparent text-[11px] outline-none focus:bg-white"
                      readOnly={readOnly || false}
                    />
                  </td>
                  <td className="text-[11px] border border-gray-300 text-right items-center pt-2 pr-1 font-medium">
                    <input
                      type="number"
                      className="text-right px-1 w-full table-data-input outline-none bg-transparent focus:bg-white"
                      value={
                        focusedField === `dozen-${index}`
                          ? (row?.dozen ?? "")
                          : row?.dozen
                            ? Number(row.dozen).toFixed(2)
                            : ""
                      }
                      onChange={(e) => handleInputChange(e.target.value, index, "dozen")}
                      onFocus={(e) => {
                        e.target.select();
                        setFocusedField(`dozen-${index}`);
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        handleInputChange(
                          val ? Number(val).toFixed(2) : "",
                          index,
                          "dozen",
                        );
                        setFocusedField(null);
                      }}
                      disabled={true}
                    />
                  </td>
                  {isCumInvoice && <><td className="text-[11px] border border-gray-300 text-right items-center pt-2 pr-1 font-medium">
                    <input
                      type={
                        focusedField === `price-${index}` ? "number" : "text"
                      }
                      step="0.01"
                      className="text-right px-1 w-full table-data-input outline-none bg-transparent focus:bg-white"
                      value={
                        focusedField === `price-${index}`
                          ? (row.price ?? "")
                          : row.price
                            ? formatCurrencyAmount(
                              row.price,
                              isCurrencySymbol,
                            )
                            : ""
                      }
                      onChange={(e) => {
                        handleInputChange(
                          e.target.value === "" ? "" : e.target.value,
                          index,
                          "price",
                        );
                      }}
                      readOnly={readOnly || false}
                      onFocus={(e) => {
                        e.target.select();
                        setFocusedField(`price-${index}`);
                      }}
                      onBlur={(e) => {
                        const num = parseFloat(e.target.value);
                        handleInputChange(
                          num ? Number(num).toFixed(2) : "",
                          index,
                          "price",
                        );
                        setFocusedField(null);
                      }}
                    />
                  </td>
                    <td className="text-[11px] border border-gray-300 text-right items-center pt-2 pr-1 font-medium text-black">
                      <span className="pr-1">
                        {isCurrencySymbol && row.styleItemId
                          ? ` ${isCurrencySymbol}`
                          : ""}
                      </span>
                      {row.styleItemId
                        ? formatCurrencyAmount(
                          row.amount || 0,
                          isCurrencySymbol,
                        )
                        : ""}
                    </td>
                    {!isCustomerExport && (
                      <td className="text-[11px] border border-gray-300 text-center items-center pt-2 font-medium">
                        <button
                          disabled={!row.styleItemId}
                          className="text-indigo-600 w-full hover:text-indigo-800 disabled:text-gray-300 table-data-input"
                          onClick={() => {
                            if (!taxTemplateId) {
                              return Swal.fire({
                                title: "Information",
                                text: "Please select Tax Type",
                                icon: "info",
                                confirmButtonColor: "#3085d6",
                              });
                            }
                            setCurrentSelectedIndex(index);
                          }}
                          type="button"
                        >
                          {VIEW}
                        </button>
                      </td>
                    )}</>}
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
                    {!readOnly && true && (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={addMainRow}
                          className="flex items-center justify-center p-0.5 bg-blue-50 hover:bg-blue-100 rounded"
                          title="Add row"
                          tabIndex={-1}
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
              <td
                className="text-right px-2 border border-gray-300 font-medium"
                colSpan={6}
              >
                Total
              </td>
              <td className="text-right border border-gray-300 px-1 font-medium">
                {items?.reduce((s, r) => s + (Number(r.qty) || 0), 0)}
              </td>
              <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              <td className="text-right border border-gray-300 px-1 font-medium">
                {items
                  ?.reduce((s, r) => s + (Number(r.dozen) || 0), 0)
                  .toFixed(2)}
              </td>
              {isCumInvoice && <>
                <td className="border border-gray-300 bg-gray-50" colSpan={1} />
                <td className="text-right border border-gray-300 px-1 font-medium text-black">
                  {isCurrencySymbol ? `${isCurrencySymbol} ` : ""}
                  {formatCurrencyAmount(
                    items?.reduce((s, r) => s + (Number(r.amount) || 0), 0),
                    isCurrencySymbol,
                  )}
                </td>
                {!isCustomerExport && (
                  <td className="border border-gray-300 bg-gray-50" colSpan={1} />
                )}
              </>}
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

export default SalesDeliveryItems;

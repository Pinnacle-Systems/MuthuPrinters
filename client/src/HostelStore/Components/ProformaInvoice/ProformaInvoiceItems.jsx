import React, { useState, useEffect, useRef } from "react";
import FxSelect, { FxSelectWithAdd } from "../../../Inputs";
import {
  useGetStyleItemMasterQuery,
  useLazyGetStyleItemMasterByIdQuery,
} from "../../../redux/services/StyleItemMasterService";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService";
import { useGetUomQuery } from "../../../redux/services/UomMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import {
  findFromList,
  getCommonParams,
  formatCurrencyAmount,
} from "../../../Utils/helper";
import { VIEW } from "../../../icons";
import Modal from "../../../UiComponents/Modal";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import Swal from "sweetalert2";
import {
  Gsm,
  HsnMaster,
  ItemGroup,
  Size,
  StyleItemMaster,
  UomMaster,
  StyleMaster
} from "..";
import { ItemSubGroupMaster } from "../../../Basic/components";
import { Plus } from "lucide-react";
import { FaEye, FaTrash } from "react-icons/fa";


// EMPTY DEFINITIONS
const EMPTY_SIZE_ROW = () => ({ sizeId: "", qty: "" });
const EMPTY_STYLE_ROW = () => ({
  styleId: "",
  sizeBreakup: [EMPTY_SIZE_ROW()],
});

const ProformaInvoiceItems = ({
  items,
  enrichedItems,
  setItems,
  readOnly,
  taxTemplateId,
  id,
  isCurrencySymbol,
  currencyCode,
  isCustomerExport,
  termsRef,
  conversionType,
  isSupplierOutside,
  itemGroupList,
  itemSubGroupList,
  styleList,
}) => {
  const styleItemRefs = useRef({});
  const { companyId } = getCommonParams();
  const { data: styleItemList } = useGetStyleItemMasterQuery({
    params: { companyId },
  });
  const { data: sizeList } = useGetSizeMasterQuery({ params: { companyId } });
  const { data: gsmList } = useGetGsmMasterQuery({ params: { companyId } });
  const { data: uomList } = useGetUomQuery({ params: { companyId } });
  const { data: hsnList } = useGetHsnMasterQuery({ params: { companyId } });

  const EMPTY_ROW = {
    itemGroupId: "",
    itemSubGroupId: "",
    styleItemId: "",
    uomId: "",
    gsmId: "",
    hsnId: "",
    qty: "",
    labelWidth: "",
    price: "",
    amount: "", // Used for "Gross"
    dozen: "",
    styleBreakup: [EMPTY_STYLE_ROW()],
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [activeModalRowIndex, setActiveModalRowIndex] = useState(null);
  const [activeStyleIndex, setActiveStyleIndex] = useState(0);
  const [focusedField, setFocusedField] = useState(null);

  const [triggerGetStyleItem, { data: styleData }] =
    useLazyGetStyleItemMasterByIdQuery();

  const addRow = () => {
    setItems([
      ...items,
      { ...EMPTY_ROW, rowId: Math.random().toString(36).substring(2, 9) },
    ]);
  };

  const deleteRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const recalculateOrderQty = (rowBreakup) => {
    let orderQty = 0;
    rowBreakup.forEach((style) => {
      style.sizeBreakup.forEach((sz) => {
        orderQty += Number(sz.qty) || 0;
      });
    });
    return orderQty;
  };

  const handleInputChange = async (value, index, field) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Calculate gross (amount)
    const qty = parseFloat(newItems[index].qty) || 0;
    const price = parseFloat(newItems[index].price) || 0;
    const dozen = qty / 12;
    newItems[index].dozen = dozen ? dozen.toFixed(2) : "";
    if (conversionType === "DOZEN") {
      newItems[index].amount = dozen && price ? (dozen * price).toFixed(2) : "";
    } else {
      newItems[index].amount = qty && price ? (qty * price).toFixed(2) : "";
    }

    setItems(newItems);
    if (field === "styleItemId" && value) {
      newItems[index].styleItemId = value;
      setItems([...newItems]);

      try {
        const response = await triggerGetStyleItem(value).unwrap();
        const hsnId = response?.data?.hsnId;
        const hsnObj = hsnList?.data?.find((h) => h.id === hsnId);

        const updatedItems = items.map((item, i) =>
          i === index
            ? {
              ...item,
              styleItemId: value,
              hsnId: hsnId,
              uomId: response?.data?.uomId,
              taxPercent: hsnObj ? hsnObj.tax : "",
              styleBreakup: item.styleBreakup && item.styleBreakup.length > 0 ? item.styleBreakup : [EMPTY_STYLE_ROW()]
            }
            : item,
        );
        setItems(updatedItems);
      } catch (e) {
        console.error("Style fetch failed", e);
      }
    }
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
            text: "This style is already selected.",
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

      row.qty = recalculateOrderQty(row.styleBreakup);
      const price = row.price;
      const dozen = row.qty / 12;
      row.dozen = dozen ? dozen.toFixed(2) : "";
      if (conversionType === "DOZEN") {
        row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
      } else {
        row.amount = row.qty && price ? (row.qty * price).toFixed(2) : "";
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
            text: "This size is already selected.",
          });
          return prev;
        }
      }

      sizeBreakup[sizeIndex] = { ...sizeBreakup[sizeIndex], [field]: value };
      styleObj.sizeBreakup = sizeBreakup;
      styleBreakup[styleIndex] = styleObj;
      row.styleBreakup = styleBreakup;

      if (field === "qty") {
        const orderQty = recalculateOrderQty(styleBreakup);
        row.qty = orderQty;
        const price = row.price;
        const dozen = orderQty / 12;
        row.dozen = dozen ? dozen.toFixed(2) : "";
        if (conversionType === "DOZEN") {
          row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
        } else {
          row.amount = orderQty && price ? (orderQty * price).toFixed(2) : "";
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

      row.qty = recalculateOrderQty(styleBreakup);
      const price = row.price;
      const dozen = row.qty / 12;
      row.dozen = dozen ? dozen.toFixed(2) : "";
      if (conversionType === "DOZEN") {
        row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
      } else {
        row.amount = row.qty && price ? (row.qty * price).toFixed(2) : "";
      }

      rows[rowIndex] = row;
      return rows;
    });
  };

  const handleRightClick = (event, rowIndex) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      rowId: rowIndex,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleFocusNextRow = (index) => {
    const nextIndex = index + 1;
    if (!items[nextIndex]) {
      setItems((prev) => [
        ...prev,
        { ...EMPTY_ROW, rowId: Math.random().toString(36).substring(2, 9) },
      ]);
      setTimeout(() => {
        styleItemRefs.current[nextIndex]?.focus?.();
      }, 300);
    } else {
      setTimeout(() => {
        styleItemRefs.current[nextIndex]?.focus?.();
      }, 50);
    }
  };

  const deleteSelectedRows = () => {
    setItems((rows) => rows.filter((r) => !r.selected));
    setContextMenu(null);
  };

  const handleDeleteAllRows = () => {
    setItems(
      Array.from({ length: 14 }, () => ({
        ...EMPTY_ROW,
        rowId: Math.random().toString(36).substring(2, 9),
      })),
    );
  };

  return (
    <>
      <Modal
        isOpen={Number.isInteger(currentSelectedIndex)}
        onClose={() => {
          setCurrentSelectedIndex("");
          window.setTimeout(() => {
            handleFocusNextRow?.(currentSelectedIndex);
          }, 0);
        }}
      >
        <TaxDetailsFullTemplate
          readOnly={readOnly}
          taxTypeId={taxTemplateId}
          currentIndex={currentSelectedIndex}
          setCurrentSelectedIndex={setCurrentSelectedIndex}
          poItems={enrichedItems?.items || items}
          handleInputChange={handleInputChange}
          id={id}
          isNewVersion={false}
          onCloseFocus={handleFocusNextRow}
          isSupplierOutside={isSupplierOutside}
          currencyCode={currencyCode || isCurrencySymbol}
        />
      </Modal>

      <Modal
        isOpen={Number.isInteger(activeModalRowIndex)}
        onClose={() => {
          setActiveModalRowIndex(null);
          setActiveStyleIndex(0);
        }}
        widthClass="w-[65vw]"
      >
        <div className="p-4 bg-white rounded-lg h-[75vh] flex flex-col">
          <h2 className="text-lg font-bold mb-4">Style & Size Breakup</h2>
          {activeModalRowIndex !== null && (
            <div className="flex-1 flex gap-4 overflow-hidden border border-gray-200 rounded">
              <div className="w-1/3 bg-gray-50 flex flex-col border-r border-gray-200">
                <div className="p-3 bg-gray-200 font-semibold text-gray-700 text-sm">Styles</div>
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
                        {!readOnly && (
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
                          readOnly={readOnly}
                          placeholder="Select Style"
                          addNew={true}
                          childComponent={StyleMaster}
                          addNewModalWidth="w-[50%] h-[57%]"
                        />
                      </div>
                    </div>
                  ))}
                  {!readOnly && (
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

              <div className="w-2/3 bg-white flex flex-col">
                <div className="p-3 bg-gray-200 font-semibold text-gray-700 text-sm">
                  Sizes for Style {activeStyleIndex + 1}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {items[activeModalRowIndex]?.styleBreakup?.[activeStyleIndex] ? (
                    <table className="w-full text-left border-collapse border border-gray-300 bg-white text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-2 py-1.5">Size</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-24">Qty</th>
                          <th className="border border-gray-300 px-2 py-1.5 w-16 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(items[activeModalRowIndex].styleBreakup[activeStyleIndex].sizeBreakup || []).map((sizeRow, sizeIdx) => (
                          <tr key={sizeRow.rowId || sizeIdx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-1">
                              <FxSelectWithAdd
                                value={sizeRow.sizeId}
                                onChange={(val) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "sizeId", val)}
                                options={(sizeList?.data || [])
                                  .filter((i) => (id ? true : i.active))
                                  .map((i) => ({ label: i.name, value: i.id }))}
                                readOnly={readOnly}
                                placeholder="Select Size"
                                addNew={true}
                                childComponent={Size}
                                addNewModalWidth="w-[50%] h-[57%]"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                className="w-full text-right outline-none bg-transparent"
                                value={sizeRow.qty}
                                onChange={(e) => handleNestedSizeChange(activeModalRowIndex, activeStyleIndex, sizeIdx, "qty", e.target.value)}
                                disabled={readOnly}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {!readOnly && (
                                <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => addNestedSizeRow(activeModalRowIndex, activeStyleIndex)} className="p-1 bg-blue-100 rounded text-blue-700 hover:bg-blue-200">
                                    <Plus size={12} />
                                  </button>
                                  <button onClick={() => deleteNestedSizeRow(activeModalRowIndex, activeStyleIndex, sizeIdx)} className="p-1 bg-red-100 rounded text-red-700 hover:bg-red-200">
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

      <div className="w-full h-full overflow-y-auto bg-white">
        <table className=" table-fixed min-h-full bg-white">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
            <tr>
              <th className="w-10 px-1 py-2 text-center font-medium border border-gray-300">
                S.No
              </th>
              <th className="w-36 px-2 py-2 text-center font-medium border border-gray-300">
                Item Group
              </th>
              <th className="w-36 px-2 py-2 text-center font-medium border border-gray-300">
                Item Sub Group
              </th>
              <th className="w-80 px-2 py-2 text-center font-medium border border-gray-300">
                Description of Goods<span className="text-red-500">*</span>
              </th>
              <th className="w-40 px-1 py-2 text-center font-medium border border-gray-300">
                HSN
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                UOM
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Qty<span className="text-red-500">*</span>
              </th>
              <th className="w-32 px-2 py-2 text-center font-medium border border-gray-300 ">
                Label Width
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Dozen
              </th>
              <th className="w-32 px-1 py-2 text-center font-medium border border-gray-300">
                Price {isCurrencySymbol && `(${isCurrencySymbol})`}
                <span className="text-red-500">*</span>
              </th>
              <th className="w-32 px-1 py-2 text-center font-medium border border-gray-300">
                Gross
              </th>
              {!isCustomerExport && (
                <th className="w-12 px-1 py-2 text-center font-medium border border-gray-300">
                  Tax
                </th>
              )}
              <th className="w-20 px-2 py-2 text-center font-medium border border-gray-300">
                Breakup
              </th>
              <th className="w-16 px-2 py-2 text-center font-medium border border-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, index) => {
              return (
                <tr
                  key={item.rowId || index}
                  className={`h-6 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  onContextMenu={(e) => {
                    if (!readOnly) {
                      handleRightClick(e, index);
                    }
                  }}
                >
                  <td className="text-[11px] text-center border border-gray-300">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 text-[11px] items-center">
                    <FxSelectWithAdd
                      value={item.itemGroupId}
                      onChange={(val) => handleInputChange(val, index, "itemGroupId")}
                      options={(itemGroupList?.data || [])
                        .filter((i) => (id ? true : i.active))
                        .map((i) => ({ label: i.name, value: i.id }))}
                      readOnly={readOnly}
                      placeholder=""
                      addNew={true}
                      childComponent={ItemGroup}
                      addNewModalWidth="w-[38%] h-[50%]"
                    />
                  </td>
                  <td className="border border-gray-300 text-[11px] items-center">
                    <FxSelectWithAdd
                      value={item.itemSubGroupId}
                      onChange={(val) => handleInputChange(val, index, "itemSubGroupId")}
                      options={(itemSubGroupList?.data || [])
                        .filter(
                          (i) =>
                            (id ? true : i.active) &&
                            i.itemGroupId === item.itemGroupId,
                        )
                        .map((i) => ({ label: i.name, value: i.id }))}
                      readOnly={readOnly}
                      placeholder=""
                      addNew={true}
                      childComponent={ItemSubGroupMaster}
                      addNewModalWidth="w-[38%] h-[50%]"
                    />
                  </td>
                  <td className="border border-gray-300">
                    <FxSelectWithAdd
                      value={item.styleItemId}
                      onChange={(val) => handleInputChange(val, index, "styleItemId")}
                      options={(styleItemList?.data || [])
                        .filter(
                          (i) =>
                            (id ? true : i.active) &&
                            i.itemGroupId === item.itemGroupId &&
                            (item.itemSubGroupId
                              ? i.itemSubGroupId === item.itemSubGroupId
                              : true),
                        )
                        .map((i) => ({ label: i.name, value: i.id }))}
                      readOnly={readOnly}
                      placeholder=""
                      addNew={true}
                      childComponent={StyleItemMaster}
                      addNewModalWidth="w-[50%] h-[57%]"
                      ref={(el) => (styleItemRefs.current[index] = el)}
                      nextRef={termsRef}
                    />
                  </td>
                  <td className="border border-gray-300 text-[11px] px-2">
                    <span className="">
                      {findFromList(item.hsnId, hsnList?.data, "name") || ""}
                    </span>
                  </td>
                  <td className="border border-gray-300 text-[11px] px-2 text-center">
                    <span>
                      {findFromList(item.uomId, uomList?.data, "name") || ""}
                    </span>
                  </td>
                  <td className="text-[11px] border border-gray-300 text-right pr-2 font-medium">
                    {item.qty ? Number(item.qty) : ""}
                  </td>
                  <td className="text-[11px] border border-gray-300 text-left pl-2">
                    <input
                      type="text"
                      className="text-left w-full table-data-input"
                      value={item?.labelWidth || ""}
                      onChange={(e) => handleInputChange(e.target.value, index, "labelWidth")}
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="text-[11px] border border-gray-300 text-right">
                    <input
                      type="number"
                      className="text-right px-1 w-full table-data-input"
                      value={
                        focusedField === `dozen-${index}`
                          ? (item?.dozen ?? "")
                          : item?.dozen
                            ? Number(item.dozen).toFixed(2)
                            : ""
                      }
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
                  <td className="text-[11px] border border-gray-300 text-right">
                    <div className="relative w-full">
                      <input
                        type={focusedField === `price-${index}` ? "number" : "text"}
                        step="0.01"
                        className="text-right px-3 w-full table-data-input"
                        value={
                          focusedField === `price-${index}`
                            ? (item.price ?? "")
                            : item.price
                              ? formatCurrencyAmount(item.price, currencyCode || isCurrencySymbol)
                              : ""
                        }
                        onChange={(e) => handleInputChange(e.target.value, index, "price")}
                        readOnly={readOnly}
                        onFocus={(e) => { e.target.select(); setFocusedField(`price-${index}`); }}
                        onBlur={(e) => {
                          const num = parseFloat(e.target.value);
                          handleInputChange(num ? Number(num).toFixed(2) : "", index, "price");
                          setFocusedField(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && index === items.length - 1) {
                            addRow();
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td className="text-[11px] text-right px-1 border border-gray-300 bg-gray-50 bg-transparent gap-x-2">
                    <span className="pr-1">
                      {isCurrencySymbol && item.styleItemId ? ` ${isCurrencySymbol}` : ""}
                    </span>
                    {item.styleItemId ? formatCurrencyAmount(item.amount || 0, currencyCode || isCurrencySymbol) : ""}
                  </td>

                  {!isCustomerExport && (
                    <td className="border border-gray-300 text-center text-[11px]">
                      <button
                        disabled={!item.styleItemId}
                        className=" text-indigo-600 w-full hover:text-indigo-800 disabled:text-gray-300 table-data-input"
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
                      >
                        {VIEW}
                      </button>
                    </td>
                  )}

                  <td className="border border-gray-300 text-center py-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => setActiveModalRowIndex(index)}
                      title="View Style & Size Breakup"
                    >
                      <FaEye size={16} className="mx-auto" />
                    </button>
                  </td>

                  <td className="w-12 border border-gray-300 align-top pt-1 bg-gray-50">
                    {!readOnly && (
                      <div className="flex items-center justify-center">
                        <button
                          onClick={addRow}
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
          <tfoot className="sticky bottom-0 z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
            <tr className="bg-gray-200 h-7 font-bold text-gray-800 text-[12px]">
              <td className="text-right px-2 border border-gray-300" colSpan={6}>
                Total
              </td>
              <td className="text-right px-1 border border-gray-300">
                {items?.reduce((sum, i) => sum + (parseFloat(i.qty) || 0), 0).toFixed(3)}
              </td>
              <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              <td className="text-right px-1  border border-gray-300">
                {items?.reduce((sum, i) => sum + (parseFloat(i.dozen) || 0), 0).toFixed(2)}
              </td>
              <td className="text-right px-1  border border-gray-300">
                {isCurrencySymbol ? ` ${isCurrencySymbol}` : ""}
                {items?.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0).toFixed(2)}
              </td>
              <td className="text-right px-1 border border-gray-300 text-black">
                {isCurrencySymbol ? ` ${isCurrencySymbol}` : ""}
                {formatCurrencyAmount(
                  items?.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
                  currencyCode || isCurrencySymbol,
                )}
              </td>
              {!isCustomerExport && (
                <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              )}
              <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              <td className="border border-gray-300 bg-gray-50" colSpan={1} />
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
      )}
    </>
  );
};

export default ProformaInvoiceItems;

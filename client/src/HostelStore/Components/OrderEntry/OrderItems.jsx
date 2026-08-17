import React, { useState, useEffect } from "react";
import { FxSelectWithAdd } from "../../../Inputs";
import { ItemGroup, Size, StyleItemMaster } from "..";
import { findFromList } from "../../../Utils/helper";
import { Plus } from "lucide-react";
import { ItemSubGroupMaster } from "../../../Basic/components";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import Swal from "sweetalert2";
import { formatCurrencyAmount } from "../../../Utils/helper";
import Modal from "../../../UiComponents/Modal";
import { VIEW } from "../../../icons";

import {
  DEFAULT_ROW_COUNT,
  EMPTY_SIZE_ROW,
  makeEmptyRow,
  padRows,
} from "./OrderItemsUtils";

const OrderItems = ({
  orderItems,
  setOrderItems,
  readOnly,
  styleItemList,
  sizeList,
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
  const [focusedField, setFocusedField] = useState(null);

  /* ── Pad rows whenever orderItems arrives with fewer than DEFAULT_ROW_COUNT ── */
  useEffect(() => {
    if (!Array.isArray(orderItems)) return;
    if (orderItems.length < DEFAULT_ROW_COUNT) {
      setOrderItems(padRows(orderItems));
    }
  }, [orderItems.length, id]); // trigger on length change or id switch

  /* ── row helpers ── */
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
            // itemGroupId: found.itemGroupId || "",
            uomId: found.uomId || "",
            hsnId: hsnId,
            taxPercent: hsnObj ? hsnObj.tax : "",
            sizeBreakup: id ? [...(row.sizeBreakup || [])] : [EMPTY_SIZE_ROW()],
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

  /* ── size sub-grid helpers ── */
  const handleSizeBreakupChange = (rowIndex, sizeIndex, field, value) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const breakup = [...(row.sizeBreakup || [])];

      if (field === "sizeId" && value) {
        const isDuplicate = breakup.some(
          (item, idx) => idx !== sizeIndex && item.sizeId === value,
        );
        if (isDuplicate) {
          Swal.fire({
            icon: "warning",
            title: "Duplicate Size",
            text: "This size is already selected for this item. Please select a different size.",
          });
          return prev;
        }
      }

      if (field === "qty") {
        const newValue = Number(value) || 0;
        const currentSum = breakup.reduce(
          (s, i, idx) =>
            s + (idx === sizeIndex ? newValue : Number(i.qty) || 0),
          0,
        );

        if (
          orderType === "AGAINSTPI" &&
          row.piQty !== undefined &&
          currentSum > row.piQty
        ) {
          Swal.fire({
            icon: "warning",
            title: "Quantity Exceeded",
            text: `Sum of size quantities (${currentSum}) cannot exceed PI quantity (${row.piQty}).`,
          });
          return prev;
        }
      }

      breakup[sizeIndex] = { ...breakup[sizeIndex], [field]: value };
      row.sizeBreakup = breakup;
      if (field === "qty") {
        if (orderType !== "AGAINSTPI") {
          const orderQty = breakup.reduce((s, i) => s + (Number(i.qty) || 0), 0);
          row.orderQty = orderQty;
          const price = row.price;
          const dozen = orderQty / 12;
          row.dozen = dozen ? dozen.toFixed(2) : "";
          if (conversionType === "DOZEN") {
            row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
          } else {
            row.amount = orderQty && price ? (orderQty * price).toFixed(2) : "";
          }
        }
      }
      rows[rowIndex] = row;
      return rows;
    });
  };

  const addSizeRow = (rowIndex) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      row.sizeBreakup = [...(row.sizeBreakup || []), EMPTY_SIZE_ROW()];
      rows[rowIndex] = row;
      return rows;
    });
  };

  const deleteSizeRow = (rowIndex, sizeIndex) => {
    setOrderItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const breakup = row.sizeBreakup.filter((_, i) => i !== sizeIndex);
      row.sizeBreakup = breakup.length > 0 ? breakup : [EMPTY_SIZE_ROW()];
      if (orderType !== "AGAINSTPI") {
        row.orderQty = row.sizeBreakup.reduce(
          (s, i) => s + (Number(i.qty) || 0),
          0,
        );
      }
      rows[rowIndex] = row;
      return rows;
    });
  };

  const handleRightClick = (e, rowIndex) => {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, rowId: rowIndex });
  };

  /* ── render ── */
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
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Price {isCurrencySymbol && `(${isCurrencySymbol})`}
                <span className="text-red-500">*</span>
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Gross
              </th>
              {/* <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                  Net Amount
              </th> */}
              {!isCustomerExport && (
                <th className="w-12 px-1 py-2 text-center font-medium border border-gray-300">
                  Tax
                </th>
              )}
              {/* Actions column — header label only, no button */}
              <th className="w-16 px-2 py-2 text-center font-medium border border-gray-300">
                Actions
              </th>
              {/* Size sub-grid */}
              <th className="w-8  px-1 py-2 text-center font-medium border border-gray-300 bg-indigo-50 text-indigo-700">
                #
              </th>
              <th className="w-32 px-2 py-2 text-center font-medium border border-gray-300 bg-indigo-50 text-indigo-700">
                Size
              </th>
              <th className="w-20 px-2 py-2 text-center font-medium border border-gray-300 bg-indigo-50 text-indigo-700">
                Size Qty
              </th>

              <th className="w-16 px-1 py-2 text-center font-medium border border-gray-300 bg-indigo-50 text-indigo-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {(orderItems || []).map((row, index) => {
              const sizeRows =
                Array.isArray(row.sizeBreakup) && row.sizeBreakup.length > 0
                  ? row.sizeBreakup
                  : [EMPTY_SIZE_ROW()];
              const rowSpan = sizeRows.length;
              const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50";

              return sizeRows.map((sizeRow, sizeIndex) => (
                <tr
                  key={`${row.rowId || index}-${sizeRow.rowId || sizeIndex}`}
                  className={`${rowBg} border-b border-gray-200 h-7 cursor-pointer`}
                  onContextMenu={(e) => {
                    if (
                      !readOnly &&
                      orderType !== "AGAINSTPI" &&
                      sizeIndex === 0
                    )
                      handleRightClick(e, index);
                  }}
                >
                  {sizeIndex === 0 && (
                    <>
                      <td
                        className="w-10 border border-gray-300 text-[11px] text-center items-center pt-2"
                        rowSpan={rowSpan}
                      >
                        {index + 1}
                      </td>
                      <td
                        className="border border-gray-300 text-[11px]   items-center pt-2"
                        rowSpan={rowSpan}
                      >
                        {/* <span className="px-1">{findFromList(row.itemGroupId, itemGroupList?.data, "name") || ""}</span> */}
                        <FxSelectWithAdd
                          value={row.itemGroupId}
                          onChange={(val) =>
                            handleInputChange(val, index, "itemGroupId")
                          }
                          options={(itemGroupList?.data || [])
                            .filter((i) => (id ? true : i.active))
                            .map((i) => ({ label: i.name, value: i.id }))}
                          readOnly={
                            readOnly ||
                            childRecord?.current > 0 ||
                            orderType === "AGAINSTPI"
                          }
                          placeholder=""
                          onBlur={() =>
                            handleInputChange(
                              row.itemGroupId,
                              index,
                              "itemGroupId",
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Delete")
                              handleInputChange("", index, "itemGroupId");
                          }}
                          addNew={true}
                          childComponent={ItemGroup}
                          addNewModalWidth="w-[38%] h-[50%]"
                          nextRef={requirementRef}
                        />
                      </td>
                      <td
                        className="border border-gray-300 text-[11px]  items-center pt-2 "
                        rowSpan={rowSpan}
                      >
                        <FxSelectWithAdd
                          value={row.itemSubGroupId}
                          onChange={(val) =>
                            handleInputChange(val, index, "itemSubGroupId")
                          }
                          options={(itemSubGroupList?.data || [])
                            .filter(
                              (i) =>
                                (id ? true : i.active) &&
                                i.itemGroupId === row.itemGroupId,
                            )
                            .map((i) => ({ label: i.name, value: i.id }))}
                          readOnly={
                            readOnly ||
                            childRecord?.current > 0 ||
                            orderType === "AGAINSTPI"
                          }
                          placeholder=""
                          onBlur={() =>
                            handleInputChange(
                              row.itemSubGroupId,
                              index,
                              "itemSubGroupId",
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Delete")
                              handleInputChange("", index, "itemSubGroupId");
                          }}
                          addNew={true}
                          childComponent={ItemSubGroupMaster}
                          addNewModalWidth="w-[38%] h-[50%]"
                          nextRef={requirementRef}
                        />
                      </td>
                      <td
                        className="text-[11px] border border-gray-300 text-left  items-center pt-2 "
                        rowSpan={rowSpan}
                      >
                        <FxSelectWithAdd
                          value={row.styleItemId}
                          onChange={(val) =>
                            handleInputChange(val, index, "styleItemId")
                          }
                          options={(styleItemList?.data || [])
                            .filter(
                              (i) =>
                                (id ? true : i.active) &&
                                i.itemGroupId === row.itemGroupId &&
                                (row.itemSubGroupId
                                  ? i.itemSubGroupId === row.itemSubGroupId
                                  : true),
                            )
                            .map((i) => ({ label: i.name, value: i.id }))}
                          readOnly={
                            readOnly ||
                            childRecord?.current > 0 ||
                            orderType === "AGAINSTPI"
                          }
                          placeholder=""
                          onBlur={() =>
                            handleInputChange(
                              row.styleItemId,
                              index,
                              "styleItemId",
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Delete")
                              handleInputChange("", index, "styleItemId");
                          }}
                          addNew={true}
                          childComponent={StyleItemMaster}
                          addNewModalWidth="w-[50%] h-[57%]"
                        // nextRef={requirementRef}
                        />
                      </td>

                      <td
                        className="border border-gray-300 text-[11px]  items-center pt-2"
                        rowSpan={rowSpan}
                      >
                        <span className="px-1">
                          {findFromList(row.hsnId, hsnList?.data, "name") || ""}
                        </span>
                      </td>
                      <td
                        className="border border-gray-300 text-[11px]  items-center pt-2 "
                        rowSpan={rowSpan}
                      >
                        <span className="px-1">
                          {findFromList(row.uomId, uomList?.data, "name") || ""}
                        </span>
                      </td>
                      <td
                        className="border border-gray-300 text-[11px] text-right  items-center pt-2  pr-1 font-medium"
                        rowSpan={rowSpan}
                      >
                        {row.orderQty ? Number(row.orderQty) : ""}
                      </td>
                      <td
                        className="border border-gray-300 text-[11px] text-left  items-center pt-2  pl-1 font-medium"
                        rowSpan={rowSpan}
                      >
                        <input
                          type="text"
                          value={row.labelWidth}
                          onChange={(e) =>
                            handleInputChange(
                              e.target.value,
                              index,
                              "labelWidth",
                            )
                          }
                          className="w-full text-left px-1 bg-transparent text-[11px] outline-none focus:bg-white"
                          readOnly={readOnly || orderType === "AGAINSTPI"}
                        />
                      </td>
                      <td
                        className="text-[11px] border border-gray-300 text-right items-center pt-2 pr-1 font-medium"
                        rowSpan={rowSpan}
                      >
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
                          onChange={(e) =>
                            handleInputChange(e.target.value, index, "dozen")
                          }
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
                      <td
                        className="text-[11px] border border-gray-300 text-right items-center pt-2 pr-1 font-medium"
                        rowSpan={rowSpan}
                      >
                        <input
                          type={
                            focusedField === `price-${index}`
                              ? "number"
                              : "text"
                          }
                          step="0.01"
                          className="text-right px-1 w-full table-data-input outline-none bg-transparent focus:bg-white"
                          value={
                            focusedField === `price-${index}`
                              ? (row.price ?? "")
                              : row.price
                                ? formatCurrencyAmount(
                                  row.price,
                                  currencyCode || isCurrencySymbol,
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
                          readOnly={readOnly || orderType === "AGAINSTPI"}
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
                      <td
                        className="text-[11px] border border-gray-300 text-right items-center pt-2 pr-1 font-medium text-black"
                        rowSpan={rowSpan}
                      >
                        <span className="pr-1">
                          {isCurrencySymbol && row.styleItemId
                            ? ` ${isCurrencySymbol}`
                            : ""}
                        </span>
                        {row.styleItemId
                          ? formatCurrencyAmount(
                            row.amount || 0,
                            currencyCode || isCurrencySymbol,
                          )
                          : ""}
                      </td>
                      {/* <td
                        className="text-[11px] border border-gray-300 text-right items-center pt-2 pr-1 font-medium text-black"
                        rowSpan={rowSpan}
                      >
                        <span className="pr-1">{isCurrencySymbol && row.styleItemId ? ` ${isCurrencySymbol}` : ""}</span>
                        {row.styleItemId ? formatCurrencyAmount(enrichedItems?.items?.[index]?.totals?.net || 0, currencyCode || isCurrencySymbol) : ""}
                      </td> */}
                      {!isCustomerExport && (
                        <td
                          className="text-[11px] border border-gray-300 text-center items-center pt-2 font-medium"
                          rowSpan={rowSpan}
                        >
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
                      )}
                      {/* Per-row: Add only (no delete in cell) */}
                      <td
                        className="w-12 border border-gray-300 align-top pt-1 bg-gray-50"
                        rowSpan={rowSpan}
                      >
                        {!readOnly && orderType !== "AGAINSTPI" && (
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
                    </>
                  )}

                  {/* Size sub-grid */}
                  <td className="w-8 border border-gray-200 text-[10px] text-center bg-indigo-50/30">
                    {sizeIndex + 1}
                  </td>
                  <td className="border border-gray-200 text-[11px] bg-indigo-50/20">
                    <FxSelectWithAdd
                      value={sizeRow.sizeId}
                      onChange={(val) =>
                        handleSizeBreakupChange(index, sizeIndex, "sizeId", val)
                      }
                      options={(sizeList?.data || [])
                        .filter((i) => (id ? true : i.active))
                        .map((i) => ({ label: i.name, value: i.id }))}
                      readOnly={
                        readOnly ||
                        childRecord?.current > 0 ||
                        orderType === "AGAINSTPI"
                      }
                      placeholder=""
                      addNew={true}
                      childComponent={Size}
                      addNewModalWidth="w-[38%] h-[50%]"
                    />
                  </td>
                  <td className="border border-gray-200 text-[11px] bg-indigo-50/20">
                    <input
                      id={`size-qty-${index}-${sizeIndex}`}
                      type="number"
                      min="0"
                      className="w-full text-right px-1 bg-transparent text-[11px] outline-none focus:bg-white h-7"
                      value={sizeRow.qty}
                      onChange={(e) =>
                        handleSizeBreakupChange(
                          index,
                          sizeIndex,
                          "qty",
                          e.target.value,
                        )
                      }
                      onBlur={(e) =>
                        handleSizeBreakupChange(
                          index,
                          sizeIndex,
                          "qty",
                          parseFloat(e.target.value || 0),
                        )
                      }
                      onFocus={(e) => e.target.select()}
                      disabled={readOnly ||
                        childRecord?.current > 0 ||
                        orderType === "AGAINSTPI"}
                      placeholder="0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (sizeIndex === sizeRows.length - 1) {
                            addSizeRow(index);
                          } else {
                            document
                              .querySelector(
                                `#size-qty-${index}-${sizeIndex + 1}`,
                              )
                              ?.focus();
                          }
                        }
                      }}
                    />
                  </td>
                  <td className="border border-gray-200 text-[11px] bg-indigo-50/20">
                    {!readOnly && !childRecord?.current > 0 &&
                      orderType !== "AGAINSTPI" && (
                        <div className="flex items-center justify-center gap-0.5 px-0.5">
                          <button
                            onClick={() => addSizeRow(index)}
                            className="flex items-center justify-center p-0.5 bg-blue-50 hover:bg-blue-100 rounded"
                            title="Add size row"
                            tabIndex={-1}
                          >
                            <Plus size={13} className="text-blue-700" />
                          </button>
                          <button
                            onClick={() => deleteSizeRow(index, sizeIndex)}
                            className="flex items-center justify-center p-0.5 bg-red-50 hover:bg-red-100 rounded"
                            title="Delete size row"
                            tabIndex={-1}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 text-red-700"
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
                      )}
                  </td>
                </tr>
              ));
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
                {orderItems?.reduce((s, r) => s + (Number(r.orderQty) || 0), 0)}
              </td>
              <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              <td className="text-right border border-gray-300 px-1 font-medium">
                {orderItems
                  ?.reduce((s, r) => s + (Number(r.dozen) || 0), 0)
                  .toFixed(2)}
              </td>
              <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              <td className="text-right border border-gray-300 px-1 font-medium text-black">
                {isCurrencySymbol ? `${isCurrencySymbol} ` : ""}
                {formatCurrencyAmount(
                  orderItems?.reduce((s, r) => s + (Number(r.amount) || 0), 0),
                  currencyCode || isCurrencySymbol,
                )}
              </td>
              {/* <td className="text-right border border-gray-300 px-1 font-medium text-black">
                {isCurrencySymbol ? `${isCurrencySymbol} ` : ""}
                {formatCurrencyAmount(
                  enrichedItems?.items?.reduce(
                    (s, r) => s + (Number(r.totals?.net) || 0),
                    0,
                  ),
                  currencyCode || isCurrencySymbol,
                )}
              </td> */}
              {!isCustomerExport && (
                <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              )}
              <td className="border border-gray-300 bg-gray-50" colSpan={1} />
              <td
                colSpan={2}
                className="border border-gray-300 bg-indigo-50/30 text-right px-2 text-[11px] text-indigo-600"
              >
                Total
              </td>
              <td
                colSpan={1}
                className="border border-gray-300 bg-indigo-50/30 text-right px-2 text-[11px] text-indigo-600"
              >
                {orderItems?.reduce(
                  (s, r) =>
                    s +
                    (r.sizeBreakup || []).reduce(
                      (ss, sz) => ss + (Number(sz.qty) || 0),
                      0,
                    ),
                  0,
                )}
              </td>
              <td
                colSpan={2}
                className="border border-gray-300 bg-indigo-50/30 text-right px-2 text-[11px] text-indigo-600"
              ></td>
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

export default OrderItems;

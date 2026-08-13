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
} from "..";
import { ItemSubGroupMaster } from "../../../Basic/components";
import { Plus } from "lucide-react";

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
    price: "",
    amount: "", // Used for "Gross"
    dozen: "",
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
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
    // ✅ Switch gross calculation based on conversionType
    if (conversionType === "DOZEN") {
      newItems[index].amount = dozen && price ? (dozen * price).toFixed(2) : "";
    } else {
      // PCS: qty * price
      newItems[index].amount = qty && price ? (qty * price).toFixed(2) : "";
    }

    setItems(newItems);
    if (field === "styleItemId") {
      // 1️⃣ update immediately
      newItems[index].styleItemId = value;
      setItems([...newItems]); // 🔥 maintain UI instantly

      try {
        // 2️⃣ fetch style data
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
              }
            : item,
        );

        setItems(updatedItems);
      } catch (e) {
        console.error("Style fetch failed", e);
      }

      return; // stop here
    }
  };
  const handleSizeBreakupChange = (rowIndex, sizeIndex, field, value) => {
    setItems((prev) => {
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
      }

      breakup[sizeIndex] = { ...breakup[sizeIndex], [field]: value };
      row.sizeBreakup = breakup;
      if (field === "qty") {
        const orderQty = breakup.reduce((s, i) => s + (Number(i.qty) || 0), 0);
        row.orderQty = orderQty;
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
  console.log("items", items);
  const addSizeRow = (rowIndex) => {
    setItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      row.sizeBreakup = [...(row.sizeBreakup || []), { sizeId: "", qty: "" }];
      rows[rowIndex] = row;
      return rows;
    });
  };
  const deleteSizeRow = (rowIndex, sizeIndex) => {
    setItems((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      const breakup = row.sizeBreakup.filter((_, i) => i !== sizeIndex);
      row.sizeBreakup =
        breakup.length > 0 ? breakup : [{ sizeId: "", qty: "" }];

      const orderQty = row.sizeBreakup.reduce(
        (s, i) => s + (Number(i.qty) || 0),
        0,
      );
      row.orderQty = orderQty;
      row.qty = orderQty;

      const price = row.price;
      const dozen = orderQty / 12;
      row.dozen = dozen ? dozen.toFixed(2) : "";
      if (conversionType === "DOZEN") {
        row.amount = dozen && price ? (dozen * price).toFixed(2) : "";
      } else {
        row.amount = orderQty && price ? (orderQty * price).toFixed(2) : "";
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
      }, 300); // wait for new row to mount
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

  // The padding to 14 elements is now handled synchronously in the parent (ProformaInvoiceForm)
  // to avoid a layout shift ("shake") when new data is loaded.

  return (
    <>
      <Modal
        isOpen={Number.isInteger(currentSelectedIndex)}
        onClose={() => {
          setCurrentSelectedIndex(""); // closes modal
          window.setTimeout(() => {
            onCloseFocus?.(currentSelectedIndex); // triggers handleFocusNextRow
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
              {/* <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                                Size
                            </th>

                            <th className="w-20 px-1 py-2 text-center font-medium border border-gray-300">
                                GSM
                            </th> */}
              <th className="w-40 px-1 py-2 text-center font-medium border border-gray-300">
                HSN
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                UOM
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Qty<span className="text-red-500">*</span>
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
              {/* <th className="w-32 px-1 py-2 text-center font-medium border border-gray-300">
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
            {items?.map((item, index) => {
              const sizeRows =
                Array.isArray(item.sizeBreakup) && item.sizeBreakup.length > 0
                  ? item.sizeBreakup
                  : [{ sizeId: "", qty: "" }];
              const rowSpan = sizeRows.length;
              return sizeRows.map((sizeRow, sizeIndex) => (
                <tr
                  key={item.rowId || index}
                  className={`h-6 hover:bg-gray-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                  onContextMenu={(e) => {
                    if (!readOnly && sizeIndex === 0) {
                      handleRightClick(e, index, "");
                    }
                  }}
                >
                  {sizeIndex === 0 && (
                    <>
                      <td
                        className="text-[11px] text-center border border-gray-300"
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
                          value={item.itemGroupId}
                          onChange={(val) =>
                            handleInputChange(val, index, "itemGroupId")
                          }
                          options={(itemGroupList?.data || [])
                            .filter((i) => (id ? true : i.active))
                            .map((i) => ({ label: i.name, value: i.id }))}
                          readOnly={readOnly}
                          placeholder=""
                          onBlur={() =>
                            handleInputChange(
                              item.itemGroupId,
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
                          // nextRef={requirementRef}
                        />
                      </td>
                      <td
                        className="border border-gray-300 text-[11px]  items-center pt-2 "
                        rowSpan={rowSpan}
                      >
                        <FxSelectWithAdd
                          value={item.itemSubGroupId}
                          onChange={(val) =>
                            handleInputChange(val, index, "itemSubGroupId")
                          }
                          options={(itemSubGroupList?.data || [])
                            .filter(
                              (i) =>
                                (id ? true : i.active) &&
                                i.itemGroupId === item.itemGroupId,
                            )
                            .map((i) => ({ label: i.name, value: i.id }))}
                          readOnly={readOnly}
                          placeholder=""
                          onBlur={() =>
                            handleInputChange(
                              item.itemSubGroupId,
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
                          // nextRef={requirementRef}
                        />
                      </td>
                      <td className="border border-gray-300" rowSpan={rowSpan}>
                        <FxSelectWithAdd
                          value={item.styleItemId}
                          onChange={(val) =>
                            handleInputChange(val, index, "styleItemId")
                          }
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
                          readOnly={readOnly} // Read-only from Order Entry
                          placeholder=""
                          addNew={true}
                          childComponent={StyleItemMaster}
                          addNewModalWidth="w-[50%] h-[57%]"
                          ref={(el) => (styleItemRefs.current[index] = el)}
                          nextRef={termsRef}
                        />
                      </td>
                      <td
                        className="border border-gray-300 text-[11px] px-2"
                        rowSpan={rowSpan}
                      >
                        <span className="">
                          {findFromList(item.hsnId, hsnList?.data, "name") ||
                            ""}
                        </span>
                      </td>
                      <td
                        className="border border-gray-300 text-[11px] px-2"
                        rowSpan={rowSpan}
                      >
                        <span>
                          {findFromList(item.uomId, uomList?.data, "name") ||
                            ""}
                        </span>
                      </td>

                      <td
                        className="text-[11px] border border-gray-300  text-right"
                        rowSpan={rowSpan}
                      >
                        {" "}
                        {item.qty ? Number(item.qty) : ""}
                      </td>
                      <td
                        className="text-[11px] border border-gray-300  text-right"
                        rowSpan={rowSpan}
                      >
                        <input
                          onKeyDown={(e) => {
                            if (
                              e.code === "Minus" ||
                              e.code === "NumpadSubtract"
                            )
                              e.preventDefault();
                            if (e.key === "Delete") {
                              handleInputChange("", index, "dozen");
                            }
                          }}
                          // min={"0"}
                          type="number"
                          className="text-right  px-1 w-full table-data-input"
                          onFocus={(e) => {
                            e.target.select();
                            setFocusedField(`${index}`);
                          }}
                          value={
                            focusedField === `${index}`
                              ? (item?.dozen ?? "")
                              : item?.dozen
                                ? Number(item.dozen).toFixed(2)
                                : ""
                          }
                          onChange={(e) =>
                            handleInputChange(e.target.value, index, "dozen")
                          }
                          onBlur={(e) => {
                            const val = e.target.value;
                            handleInputChange(
                              val ? Number(val).toFixed(2) : "",
                              index,
                              "dozen",
                            );
                          }}
                          disabled={true}
                        />
                      </td>
                      <td
                        className="text-[11px] border border-gray-300  text-right"
                        rowSpan={rowSpan}
                      >
                        <div className="relative w-full">
                          <input
                            type={
                              focusedField === `${index}` ? "number" : "text"
                            }
                            step="0.01"
                            className="text-right  px-3 w-full table-data-input"
                            value={
                              focusedField === `${index}`
                                ? (item.price ?? "")
                                : item.price
                                  ? formatCurrencyAmount(
                                      item.price,
                                      currencyCode || isCurrencySymbol,
                                    )
                                  : ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;

                              handleInputChange(
                                val === "" ? "" : val, // allow empty while typing
                                index,
                                "price",
                              );
                            }}
                            readOnly={readOnly}
                            onFocus={(e) => {
                              e.target.select();
                              setFocusedField(`${index}`);
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
                            onKeyDown={(e) => {
                              if (
                                e.code === "Minus" ||
                                e.code === "NumpadSubtract"
                              )
                                e.preventDefault();
                              if (e.key === "Delete") {
                                handleInputChange("", index, "price");
                              }
                              if (e.key === "Enter") {
                                if (index === items.length - 1) {
                                  addRow();
                                }
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td
                        className="text-[11px] text-right  px-1 border border-gray-300 bg-gray-50 bg-transparent gap-x-2"
                        rowSpan={rowSpan}
                      >
                        <span className="pr-1">
                          {isCurrencySymbol && item.styleItemId
                            ? ` ${isCurrencySymbol}`
                            : ""}
                        </span>
                        {item.styleItemId
                          ? formatCurrencyAmount(
                              item.amount || 0,
                              currencyCode || isCurrencySymbol,
                            )
                          : ""}
                      </td>

                      {!isCustomerExport && (
                        <td
                          className="border border-gray-300 text-center text-[11px]"
                          rowSpan={rowSpan}
                        >
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
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!taxTemplateId) {
                                  return Swal.fire({
                                    title: "Information",
                                    text: "Please select Tax Type",
                                    icon: "info",
                                    confirmButtonColor: "#3085d6",
                                  });
                                }
                                setCurrentSelectedIndex(index);
                              }
                            }}
                          >
                            {VIEW}
                          </button>
                        </td>
                      )}
                      <td
                        className="w-12 border border-gray-300 align-top pt-1 bg-gray-50"
                        rowSpan={rowSpan}
                      >
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
                      readOnly={readOnly}
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
                      disabled={readOnly}
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
                    {!readOnly && (
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
          <tfoot className="sticky bottom-0 z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
            <tr className="bg-gray-200 h-7 font-bold text-gray-800 text-[12px]">
              <td
                className="text-right px-2 border border-gray-300"
                colSpan={6}
              >
                Total
              </td>
              <td className="text-right px-1 border border-gray-300">
                {items
                  ?.reduce((sum, i) => sum + (parseFloat(i.qty) || 0), 0)
                  .toFixed(3)}
              </td>
              {/* <td className="border border-gray-300 bg-gray-50" colSpan={1} /> */}
              <td className="text-right px-1  border border-gray-300">
                {items
                  ?.reduce((sum, i) => sum + (parseFloat(i.dozen) || 0), 0)
                  .toFixed(2)}
              </td>
              {/* <td className="border border-gray-300 bg-gray-50" colSpan={1} /> */}

              <td className="text-right px-1  border border-gray-300">
                {isCurrencySymbol ? ` ${isCurrencySymbol}` : ""}
                {items
                  ?.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0)
                  .toFixed(2)}
              </td>
              <td className="text-right px-1 border border-gray-300  text-black">
                {isCurrencySymbol ? ` ${isCurrencySymbol}` : ""}
                {formatCurrencyAmount(
                  items?.reduce(
                    (sum, i) => sum + (parseFloat(i.amount) || 0),
                    0,
                  ),
                  currencyCode || isCurrencySymbol,
                )}
              </td>
              {/* <td className="text-right px-1 border border-gray-300  text-black">
                {isCurrencySymbol ? ` ${isCurrencySymbol}` : ""}
                {formatCurrencyAmount(
                  enrichedItems?.items?.reduce(
                    (sum, i) => sum + (parseFloat(i.totals?.net) || 0),
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
                {items?.reduce(
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

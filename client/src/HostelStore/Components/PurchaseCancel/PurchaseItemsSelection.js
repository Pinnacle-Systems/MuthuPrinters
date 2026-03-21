import { useState } from "react";
import { getDateFromDateTimeToDisplay } from "../../../Utils/helper";

const PurchaseItemsSelection = ({
  cancelItems,
  setCancelItems,
  setFillGrid,
  setTempItems,
  tempItems,
  searchDocId,
  setSearchDocId,
  setSearchDocDate,
  searchDocDate,
}) => {

  const EMPTY_ROW = {
    poId: "",
    poDocId: "",
    styleItemId: "",
    hsnId: "",
    uomId: "",
    poQty: "",
    inwardQty: "",
    returnQty: "",
    balQty: "",
    cancelQty: "",
    itemGroupId: "",
    sizeId: "",
    colorId: "",
  };

  const isRowEmpty = (row) =>
    !row.styleItemId && !row.uomId && !row.hsnId && !row.poQty && !row.balQty;

  // ✅ display source is tempItems — from parent API
  const displayItems = tempItems || [];

  // ✅ addItem — fills empty row first, then appends (reference pattern)
  function addItem(item) {
    setCancelItems((prev) => {
      let newItems = structuredClone(prev);
      const newRow = {
        ...item,
        styleItemId: item.styleItemId ?? "",
        uomId: item.uomId ?? "",
        hsnId: item.hsnId ?? "",
        poQty: item.poQty ?? "",
        inwardQty: item.inwardQty ?? "",
        returnQty: item.returnQty ?? "",
        balQty: item.balQty ?? "",
        balQtyCancel: item.balQtyCancel ?? "",
        alreadyInwardQty: item.alreadyInwardQty ?? "",
        alreadyReturnQty: item.alreadyReturnQty ?? "",
        poId: item.poId ?? "",
        poDocId: item?.Po?.docId ?? "",
        sizeId: item.sizeId ?? "",
        colorId: item.colorId ?? "",
      };

      // find first empty row and fill it
      const emptyIndex = newItems.findIndex(
        (v) => !v.styleItemId || v.styleItemId === null
      );

      if (emptyIndex !== -1) {
        newItems[emptyIndex] = newRow;
      } else {
        newItems.push(newRow);
      }

      return newItems;
    });
  }

  // ✅ removeItem — removes from cancelItems, keeps minimum 3 rows
  function removeItem(removeItem) {
    setCancelItems((prev) => {
      let updated = prev.filter(
        (item) =>
          !(
            removeItem.styleItemId === item.styleItemId &&
            removeItem.hsnId === item.hsnId &&
            removeItem.uomId === item.uomId &&
            removeItem.poQty === item.poQty &&
            removeItem.balQty === item.balQty
          ),
      );

      // ensure minimum 3 rows
      while (updated.length < 3) {
        updated.push({ ...EMPTY_ROW });
      }

      return updated;
    });
  }

  // ✅ isItemChecked — checks cancelItems directly (reference pattern)
  function isItemChecked(checkItem) {
    return (cancelItems || []).findIndex(
      (item) =>
        item.styleItemId &&
        String(item.styleItemId) === String(checkItem.styleItemId) &&
        String(item.poId) === String(checkItem.poId) &&
        String(item.sizeId) === String(checkItem.sizeId) &&
        String(item.colorId) === String(checkItem.colorId)
    ) !== -1;
  }

  // ✅ toggle — same as reference handleChangee
  function handleCheckBoxChange(value, item) {
    if (value) addItem(item);
    else removeItem(item);
  }

  // ✅ select all uses displayItems
  function handleSelectAllChange(value) {
    if (value) {
      (displayItems || []).forEach((item) => {
        if (!isItemChecked(item)) addItem(item);
      });
    } else {
      (displayItems || []).forEach((item) => removeItem(item));
    }
  }

  function getSelectAll() {
    return (
      (displayItems || []).length > 0 &&
      (displayItems || []).every((item) => isItemChecked(item))
    );
  }

  // ✅ Done — just close, items already in cancelItems
  function handleDone() {
    setFillGrid(false);
  }

  return (
    <div className="h-full flex flex-col bg-[#f1f1f0]">

      {/* HEADER */}
      <div className="border-b py-2 px-4 mx-3 flex justify-between items-center sticky top-0 z-10 bg-white mt-3">
        <h2 className="text-lg px-2 py-0.5 font-semibold text-gray-800">
          Purchase Order Items
        </h2>
        <button
          type="button"
          onClick={handleDone}
          className="px-3 py-1 hover:bg-green-600 hover:text-white rounded text-green-600 
                     border border-green-600 flex items-center gap-1 text-xs"
        >
          Done
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-3">
        <div className="bg-white p-3 rounded-md border border-gray-200 h-full">
          <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
            <div className="relative w-full max-h-[420px] overflow-y-auto py-1">
              <table className="w-full border-collapse table-fixed">
                <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10">
                  <tr>

                    {/* SELECT ALL */}
                    <th className="px-2 py-1 w-10 border border-gray-300">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-medium mb-[2px]">
                          Select
                        </span>
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          onChange={(e) => handleSelectAllChange(e.target.checked)}
                          checked={getSelectAll()}
                        />
                      </div>
                    </th>

                    <th className="border border-gray-300 px-2 py-1 text-center text-xs w-11">
                      S No
                    </th>

                    {/* PO No with search */}
                    <th className="px-1 py-1.5 border border-gray-300 text-center text-xs w-24">
                      <label>PO No</label>
                      <input
                        type="text"
                        className="text-black h-6 focus:outline-none border border-gray-400 rounded-lg w-full mt-0.5"
                        placeholder="Search"
                        value={searchDocId}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setSearchDocId(e.target.value)}
                      />
                    </th>

                    {/* PO Date with search */}
                    <th className="px-1 py-1.5 border border-gray-300 text-center text-xs w-24">
                      <label>PO Date</label>
                      <input
                        type="text"
                        className="text-black h-6 focus:outline-none border border-gray-400 rounded-lg w-full mt-0.5"
                        placeholder="Search"
                        value={searchDocDate}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setSearchDocDate(e.target.value)}
                      />
                    </th>

                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-56">
                      Description of Goods
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-28">
                      Size
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-28">
                      Color
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-20">
                      UOM
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-20 text-right">
                      PO Qty
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-24 text-right">
                      Already Inward
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-24 text-right">
                      Already Return
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-20 text-right">
                      Bal Qty
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayItems?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-4 py-4 text-center text-gray-500"
                      >
                        No data found
                      </td>
                    </tr>
                  ) : (
                    displayItems.map((item, index) => (
                      <tr
                        key={index}
                        className={`${
                          isItemChecked(item)
                            ? "bg-blue-50"
                            : index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-100"
                        } border-b cursor-pointer hover:bg-gray-50`}
                        onClick={() =>
                          handleCheckBoxChange(!isItemChecked(item), item)
                        }
                      >
                        <td className="text-center py-2 border border-gray-300">
                          <input
                            type="checkbox"
                            className="cursor-pointer"
                            checked={isItemChecked(item)}
                            readOnly
                          />
                        </td>

                        <td className="text-center border border-gray-300 text-[11px]">
                          {index + 1}
                        </td>

                        <td className="border border-gray-300 text-[11px] px-2 py-1.5">
                          {item?.Po?.docId}
                        </td>

                        <td className="border border-gray-300 px-2 py-1 text-left text-[11px]">
                          {getDateFromDateTimeToDisplay(item?.Po?.docDate)}
                        </td>

                        <td className="border border-gray-300 text-[11px] py-1.5 px-2">
                          {item?.StyleItem?.name}
                        </td>

                        <td className="border border-gray-300 text-[11px] py-1.5 px-2">
                          {item?.Size?.name}
                        </td>

                        <td className="border border-gray-300 text-[11px] py-1.5 px-2">
                          {item?.Color?.name}
                        </td>

                        <td className="border border-gray-300 text-[11px] py-1.5 px-2">
                          {item?.Uom?.name}
                        </td>

                        <td className="border border-gray-300 text-[11px] text-right py-1.5 px-2">
                          {item?.poQty}
                        </td>

                        <td className="border border-gray-300 text-[11px] text-right py-1.5 px-2">
                          {item?.alreadyInwardQty}
                        </td>

                        <td className="border border-gray-300 text-[11px] text-right py-1.5 px-2">
                          {item?.alreadyReturnQty}
                        </td>

                        <td className="border border-gray-300 text-[11px] text-right py-1.5 px-2">
                          {item?.balQtyCancel}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseItemsSelection;
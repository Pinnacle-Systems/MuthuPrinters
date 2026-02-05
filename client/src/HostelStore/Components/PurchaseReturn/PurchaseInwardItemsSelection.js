import React, { useEffect, useState } from "react";
import {
  findFromList,
  getDateFromDateTimeToDisplay,
} from "../../../Utils/helper";
import { useGetPurInwardItemsQuery } from "../../../redux/uniformService/PurchaseInwardEntry";

const PurchaseInwardItemsSelection = ({
  returnItems,
  setReturnItems,
  setFillGrid,
  branchId,
  supplierId,
  returnType,
}) => {
  const [localReturnItems, setLocalReturnItems] = useState([]);
  const [searchDocId, setSearchDocId] = useState("");
  const [searchDocDate, setSearchDocDate] = useState("");
  const [searchDcDate, setSearchDcDate] = useState("");
  const [searchInwardType, setSearchInwardType] = useState(returnType);
  const [searchSupplier, setSearchSupplier] = useState("");
  const [dataPerPage, setDataPerPage] = useState("10");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const searchFields = {
    searchDocId,
    searchDocDate,
    searchSupplier,
    searchInwardType,
    searchDcDate,
  };

  useEffect(() => {
    setCurrentPageNumber(1);
  }, [
    searchDocId,
    searchDocDate,
    searchSupplier,
    searchInwardType,
    searchDcDate,
  ]);

  const {
    data: purInwardItemsData,
    isLoading: isPurInwardItemsLoading,
    isFetching: isPurInwardItemsFetching,
  } = useGetPurInwardItemsQuery({
    params: {
      branchId,
      supplierId,
      ...searchFields,
      pagination: true,
      dataPerPage,
      pageNumber: currentPageNumber,
    },
  });
  const isRowEmpty = (row) =>
    !row.styleItemId && !row.uomId && !row.hsnId && !row.poQty && !row.balQty;

  const purInwardItems = purInwardItemsData?.data || [];

  function handleDone() {
    setReturnItems((prev) => {
      let updated = [...prev];

      // 1️⃣ Find ALL empty rows first
      const emptyRowIndices = updated.reduce((indices, row, index) => {
        if (isRowEmpty(row)) {
          indices.push(index);
        }
        return indices;
      }, []);

      // 2️⃣ Fill empty rows with our items
      localReturnItems.forEach((item, i) => {
        const newRow = {
          ...item,
          styleItemId: item.styleItemId ?? "",
          uomId: item.uomId ?? "",
          hsnId: item.hsnId ?? "",
          poQty: item.poQty ?? "",
          balQty: item.balQty ?? "",
          purchaseInwardId: item.purchaseInwardId ?? "",
        };

        // If we have an empty row at this position, use it
        if (i < emptyRowIndices.length) {
          updated[emptyRowIndices[i]] = newRow;
        }
        // Otherwise, append to the end
        else {
          updated.push(newRow);
        }
      });

      return updated;
    });

    setFillGrid(false);
  }

  function handleCancel() {
    setLocalReturnItems([]);
    setFillGrid(false);
  }

  // if (!data?.data || isFetching || isLoading) return <Loader />

  function addItem(item) {
    setLocalReturnItems((localReturnItems) => {
      let newItems = structuredClone(localReturnItems);
      newItems.push(item);
      // newItems = newItems?.map(j => { return { ...j, delQty: j.qty } })
      return newItems;
    });
  }

  function removeItem(removeItem) {
    setLocalReturnItems((localReturnItems) => {
      return localReturnItems.filter(
        (item) =>
          !(
            removeItem.styleItemId === item.styleItemId &&
            removeItem.hsnId === item.hsnId &&
            removeItem.uomId === item.uomId &&
            removeItem.poQty === item.poQty &&
            removeItem.inwardQty === item.inwardQty &&
            removeItem.purchaseInwardId === item.purchaseInwardId
          ),
      );
    });
  }

  function isItemChecked(checkItem) {
    let item = localReturnItems.find(
      (item) =>
        checkItem.styleItemId === item.styleItemId &&
        checkItem.hsnId === item.hsnId &&
        checkItem.uomId === item.uomId &&
        checkItem.poQty === item.poQty &&
        checkItem.inwardQty === item.inwardQty &&
        checkItem.purchaseInwardId === item.purchaseInwardId,
    );
    if (!item) return false;
    return true;
  }

  function handleCheckBoxChange(value, item) {
    if (value) {
      addItem(item);
    } else {
      removeItem(item);
    }
  }

  function handleSelectAllChange(value) {
    if (value) {
      (purInwardItems ? purInwardItems : []).forEach((item) => addItem(item));
    } else {
      (purInwardItems ? purInwardItems : []).forEach((item) =>
        removeItem(item),
      );
    }
  }

  function getSelectAll() {
    return (purInwardItems ? purInwardItems : []).every((item) =>
      isItemChecked(item),
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-sm flex items-center justify-center ">
      <div className="w-full bg-white  shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2 flex justify-between items-center">
          <h2 className="text-sm font-semibold tracking-wide">
            Purchase Inward Items
          </h2>
        </div>

        {/* TABLE CONTENT */}
        <div className="overflow-auto h-[450px]">
          <table className="w-full text-xs border border-gray-200">
            <thead className="bg-gray-200 text-gray-800">
              <tr>
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
                {/* <th className="px-4 py-1.5 border border-gray-300 text-center text-xs w-36">Po Type</th> */}
                <th className="px-1 py-1.5 border border-gray-300 text-center text-xs w-32">
                  <label>Purchase Inward No</label>
                  <input
                    type="text"
                    className="text-black h-6 focus:outline-none border  border-gray-400 rounded-lg w-full"
                    placeholder="Search"
                    onFocus={(e) => e.target.select()}
                    value={searchDocId}
                    onChange={(e) => {
                      setSearchDocId(e.target.value);
                    }}
                  />
                </th>
                <th className="px-1 py-1.5 border border-gray-300 text-center text-xs w-32">
                  <label>Purchase Inward Date</label>
                  <input
                    type="text"
                    className="text-black h-6 focus:outline-none border  border-gray-400 rounded-lg w-full"
                    placeholder="Search"
                    value={searchDocDate}
                    onChange={(e) => {
                      setSearchDocDate(e.target.value);
                    }}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                  />
                </th>
                <th className="px-1 py-1.5 border border-gray-300 text-xs text-gray-800  w-96">
                  <label>Discription of Goods</label>
                </th>
                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-28">
                  <label>HSN</label>
                </th>
                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                  <label>Uom</label>
                </th>
                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                  <label>Po Qty</label>
                </th>
                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                  <label>Inward Qty</label>
                </th>
                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                  <label>Already Return Qty</label>
                </th>
                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                  <label>Balance Qty</label>
                </th>
                {/* <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                  <label>Bal Qty</label>
                </th> */}
              </tr>
            </thead>

            <tbody>
              {purInwardItems?.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                (purInwardItems || []).map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      isItemChecked(item) ? "bg-gray-50" : ""
                    }`}
                    onClick={() =>
                      handleCheckBoxChange(!isItemChecked(item), item)
                    }
                  >
                    <td className="text-center py-2 border border-gray-300">
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={isItemChecked(item)}
                      />
                    </td>

                    <td className="text-center border border-gray-300">
                      {index + 1}
                    </td>
                    <td className=" border border-gray-300 text-[11px] py-1.5 px-2">
                      {item?.PurchaseInward?.docId}
                    </td>
                    <td className=" border border-gray-300 px-2 py-1 text-left text-xs">
                      {getDateFromDateTimeToDisplay(
                        item?.PurchaseInward?.docDate,
                      )}
                    </td>
                    {/* <td className=" border border-gray-300 px-2 py-1 text-left text-xs">
                      {getDateFromDateTimeToDisplay(
                        item?.PurchaseInward?.dcDate,
                      )}
                    </td> */}
                    <td className=" border border-gray-300 text-[11px]  py-1.5 px-2">
                      {item?.StyleItem?.name}
                    </td>
                    <td className=" border border-gray-300 text-[11px]  py-1.5 px-2">
                      {item?.Hsn?.name}
                    </td>
                    <td className=" border border-gray-300 text-[11px]  py-1.5 px-2">
                      {item?.Uom?.name}
                    </td>
                    <td className=" border border-gray-300 text-[11px] text-right  py-1.5 px-2">
                      {item?.poQty}
                    </td>
                    <td className=" border border-gray-300 text-[11px] text-right  py-1.5 px-2">
                      {item?.inwardQty}
                    </td>
                    <td className=" border border-gray-300 text-[11px] text-right  py-1.5 px-2">
                      {item?.alreadyReturnQty}
                    </td>
                    <td className=" border border-gray-300 text-[11px] text-right  py-1.5 px-2">
                      {item?.balQty}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end p-3 bg-gray-50">
          <button
            className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            onClick={handleDone}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseInwardItemsSelection;

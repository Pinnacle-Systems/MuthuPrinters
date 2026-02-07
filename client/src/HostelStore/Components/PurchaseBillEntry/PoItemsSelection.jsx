import React, { useEffect, useState } from 'react'
import { findFromList, getDateFromDateTimeToDisplay } from '../../../Utils/helper';
import { useGetPoItemsQuery } from '../../../redux/uniformService/PoServices';
import {

    useGetPurchaseInwardEntryForBillByIdQuery,
    useGetPurInwardItemsQuery,

} from "../../../redux/uniformService/PurchaseInwardEntry";
import { useCallback } from 'react';

const PoItemsSelection = ({ inwardItems, setInwardItems, setFillGrid, branchId, supplierId, inwardType, dcNo, invNo }) => {
    const [localinwardItems, setLocalinwardItems] = useState([]);
    const [searchDocId, setSearchDocId] = useState("");
    const [searchPoDate, setPoDate] = useState("");
    const [searchDueDate, setDueDate] = useState("");
    const [searchPoType, setSearchPoType] = useState("");
    const [searchSupplier, setSearchSupplier] = useState("");
    const [dataPerPage, setDataPerPage] = useState("10");
    const [totalCount, setTotalCount] = useState(0);
    const [searchInwardType, setsearchInwardType] = useState(inwardType)
    const [currentPageNumber, setCurrentPageNumber] = useState(1);
    const searchFields = { searchDocId, searchPoDate }
    const [purchaseInwardItems, setPurchaseInwardItems] = useState([])

    useEffect(() => {
        setCurrentPageNumber(1);
    }, [
        searchDocId, searchPoDate, searchSupplier, searchPoType, searchDueDate
    ]);



    const { data: purchaseInwarddata } = useGetPurchaseInwardEntryForBillByIdQuery({
        params: {
            dcNo,
            invNo,
            branchId,
            supplierId,
            ...searchFields, pagination: true
        }
    })
    console.log(purchaseInwarddata?.data, "purchaseInwarddata");

    console.log(purchaseInwardItems, "purchaseInwardItems");

    const isRowEmpty = (row) =>
        !row.styleItemId &&
        !row.uomId &&
        !row.hsnId &&
        !row.inwardQty

    const data = purchaseInwarddata?.data
    const list = Object.values(purchaseInwarddata?.data || {});
    console.log(data, "datalist");

    const datadoc = data?.data?.map((val) => val?.docId)
    console.log(datadoc, "datadoc");

    const rawPoItems = purchaseInwarddata || [];



    function handleDone() {
        setInwardItems((prev) => {
            let updated = [...prev];

            // 1️⃣ Find ALL empty rows first
            const emptyRowIndices = updated.reduce((indices, row, index) => {
                if (isRowEmpty(row)) {
                    indices.push(index);
                }
                return indices;
            }, []);


            // 2️⃣ Fill empty rows with our items
            localinwardItems.forEach((item, i) => {
                const newRow = {
                    ...item,
                    styleItemId: item.styleItemId ?? "",
                    uomId: item.uomId ?? "",
                    hsnId: item.hsnId ?? "",
                    inwardQty: item.qty ?? "",
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
        setLocalinwardItems([]);
        setFillGrid(false);
    }

    // if (!data?.data || isFetching || isLoading) return <Loader />

    function addItem(item) {
        setLocalinwardItems(localInwardItems => {
            let newItems = structuredClone(localInwardItems);
            newItems.push(item);
            // newItems = newItems?.map(j => { return { ...j, delQty: j.qty } })
            return newItems
        });
    }


    function removeItem(removeItem) {
        setLocalinwardItems(localInwardItems => {
            return localInwardItems.filter(item =>
                !(removeItem.styleItemId === item.styleItemId
                    &&
                    removeItem.hsnId === item.hsnId
                    &&
                    removeItem.uomId === item.uomId
                    &&
                    removeItem.inwardQty === item.inwardQty
                )
            )
        });
    }

    function isItemChecked(checkItem) {
        let item = localinwardItems.find(item =>
            checkItem.styleItemId === item.styleItemId
            &&
            checkItem.hsnId === item.hsnId
            &&
            checkItem.uomId === item.uomId
            &&
            checkItem.inwardQty === item.inwardQty
        )
        if (!item) return false
        return true
    }


    function handleCheckBoxChange(value, item) {
        if (value) {
            addItem(item)
        } else {
            removeItem(item)
        }
    }

    function handleSelectAllChange(value) {
        if (value) {
            (rawPoItems ? rawPoItems : []).forEach(item => addItem(item))
        } else {
            (rawPoItems ? rawPoItems : []).forEach(item => removeItem(item))
        }
    }

    function getSelectAll() {
        return (rawPoItems ? rawPoItems : []).every(item => isItemChecked(item))
    }
    const inwardArray = Array.isArray(purchaseInwarddata?.data)
        ? purchaseInwarddata.data
        : Object.values(purchaseInwarddata?.data || {});


    const rows = Array.isArray(purchaseInwarddata?.data)
        ? purchaseInwarddata.data
        : [];

    console.log(inwardArray, "jsdhfksd");


    return (
        <div
            className="bg-black/30 backdrop-blur-sm flex items-center justify-center "
        >
            <div className="w-full bg-white  shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2 flex justify-between items-center">
                    <h2 className="text-sm font-semibold tracking-wide">Purchase Inward Items</h2>
                    {/* <button
                        className="px-3 py-1 bg-white/20 border border-white/30 text-white rounded-md hover:bg-white/30 transition"
                        onClick={handleDone}
                    >
                        Done
                    </button> */}
                </div>

                {/* TABLE CONTENT */}
                <div className="overflow-auto h-[450px] ">
                    <table className="w-full text-xs border border-gray-200">
                        <thead className="bg-gray-200 text-gray-800">
                            <tr>
                                <th className="px-2 py-1 w-10 border border-gray-300">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-medium mb-[2px]">Select</span>
                                        <input
                                            type="checkbox"
                                            className="cursor-pointer"
                                            onChange={(e) => handleSelectAllChange(e.target.checked)}
                                        // checked={getSelectAll()}
                                        />
                                    </div>
                                </th>
                                <th className="border border-gray-300 px-2 py-1 text-center text-xs w-11">S No</th>
                                <th className="px-1 py-1.5 border border-gray-300 text-center text-xs w-32">
                                    <label>PI No</label>
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
                                    <label>PI Date</label>
                                    <input
                                        type="text"
                                        className="text-black h-6 focus:outline-none border  border-gray-400 rounded-lg w-full"
                                        placeholder="Search"
                                        value={searchPoDate}
                                        onChange={(e) => {
                                            setPoDate(e.target.value);
                                        }}
                                        onFocus={(e) => { e.target.select() }}

                                    />
                                </th>

                                <th className="px-1 py-1.5 border border-gray-300 text-xs text-gray-800  w-80">
                                    <label>Description of Goods</label>

                                </th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs text-gray-800  w-32">
                                    <label>HSN/SAC</label>

                                </th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs text-gray-800  w-28">
                                    <label>UOM</label>

                                </th>



                                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                                    <label>Inward Qty</label></th>




                            </tr>
                        </thead>

                        <tbody>
                            {rows?.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                                        No data found
                                    </td>
                                </tr>
                            ) : rows?.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`border-b hover:bg-gray-50 cursor-pointer ${isItemChecked(item) ? "bg-gray-50" : ""
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

                                    <td className="text-center border border-gray-300">{index + 1}</td>
                                    <td className=" border border-gray-300 text-[11px] py-1.5 px-2">
                                        {item?.PurchaseInward?.docId}

                                    </td>

                                    <td className=" border border-gray-300 text-[11px] py-1.5 px-2">
                                        {item?.PurchaseInward?.docDate ? getDateFromDateTimeToDisplay(item?.PurchaseInward?.docDate) : ""}

                                    </td>
                                    <td className=" border border-gray-300 text-[11px] py-1.5 px-2">
                                        {item?.StyleItem?.name}
                                    </td>
                                    <td className=" border text-right border-gray-300 text-[11px] py-1.5 px-2">
                                        {item.Hsn?.name}
                                    </td>
                                    <td className=" border border-gray-300 text-[11px] py-1.5 px-2">
                                        {item.Uom?.name}
                                    </td>
                                    <td className=" border text-right border-gray-300 text-[11px] py-1.5 px-2">
                                        {item.inwardQty}
                                    </td>




                                </tr>
                            ))}
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

}

export default PoItemsSelection;
import React, { useEffect, useState } from 'react'
import { findFromList, getDateFromDateTimeToDisplay } from '../../../Utils/helper';
import { useGetPoItemsQuery } from '../../../redux/uniformService/PoServices';

const PoItemsSelection = ({ inwardItems, setInwardItems, setFillGrid, branchId, supplierId, inwardType }) => {
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
    const searchFields = { searchDocId, searchPoDate, searchSupplier, searchPoType, searchInwardType }

    useEffect(() => {
        setCurrentPageNumber(1);
    }, [
        searchDocId, searchPoDate, searchSupplier, searchPoType, searchDueDate
    ]);

    const { data: poItemsData, isLoading: isPoItemsLoading, isFetching: isPoItemsFetching } = useGetPoItemsQuery({
        params: {
            branchId, supplierId, ...searchFields, pagination: true, dataPerPage, pageNumber: currentPageNumber,
        }
    })
    const isRowEmpty = (row) =>
        !row.styleItemId &&
        !row.uomId &&
        !row.hsnId &&
        !row.poQty

    function filterMaxVersionByPoId(items = []) {
        const maxVersionMap = new Map();

        // 1️⃣ Find max version per poId
        items.forEach(item => {
            const currentMax = maxVersionMap.get(item.poId) ?? 0;
            if ((item.quoteVersion ?? 0) > currentMax) {
                maxVersionMap.set(item.poId, item.quoteVersion);
            }
        });

        // 2️⃣ Keep only items matching max version of their poId
        return items.filter(
            item => item.quoteVersion === maxVersionMap.get(item.poId)
        );
    }

    const rawPoItems = poItemsData?.data || [];
    const poItems = filterMaxVersionByPoId(rawPoItems);

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
                    poQty: item.qty ?? "",
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
                    removeItem.poQty === item.poQty
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
            checkItem.poQty === item.poQty
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
            (poItems ? poItems : []).forEach(item => addItem(item))
        } else {
            (poItems ? poItems : []).forEach(item => removeItem(item))
        }
    }

    function getSelectAll() {
        return (poItems ? poItems : []).every(item => isItemChecked(item))
    }


    return (
        <div
            className="bg-black/30 backdrop-blur-sm flex items-center justify-center "
        >
            <div className="w-full bg-white  shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2 flex justify-between items-center">
                    <h2 className="text-sm font-semibold tracking-wide">Purchase Order Items</h2>
                    {/* <button
                        className="px-3 py-1 bg-white/20 border border-white/30 text-white rounded-md hover:bg-white/30 transition"
                        onClick={handleDone}
                    >
                        Done
                    </button> */}
                </div>

                {/* TABLE CONTENT */}
                <div className="overflow-auto h-[450px]">
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
                                            checked={getSelectAll()}
                                        />
                                    </div>
                                </th>
                                <th className="border border-gray-300 px-2 py-1 text-center text-xs w-11">S No</th>
                                {/* <th className="px-4 py-1.5 border border-gray-300 text-center text-xs w-36">Po Type</th> */}
                                <th className="px-1 py-1.5 border border-gray-300 text-center text-xs w-32">
                                    <label>Po No</label>
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
                                    <label>Po Date</label>
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
                                    <label>Discription of Goods</label>
                                    {/* <input
                                        type="text"
                                        className="text-black h-6 focus:outline-none border w-full border-gray-400 rounded-lg"
                                        placeholder="Search"
                                        value={searchDueDate}
                                        // onChange={(e) => {
                                        //     setDueDate(e.target.value);
                                        // }}
                                        onFocus={(e) => { e.target.select() }}

                                    /> */}
                                </th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                                    <label>PO Qty</label>
                                    {/* <input
                                                        type="text"
                                                        className="text-black h-6 focus:outline-none border w-full border-gray-400 rounded-lg"
                                                        placeholder="Search"
                                                        value={searchDueDate}
                                                    // onChange={(e) => {
                                                    //     setDueDate(e.target.value);
                                                    // }}
                                                    /> */}

                                </th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                                    <label>Cancel Qty</label>
                                    {/* <input
                                        type="text"
                                        className="text-black h-6 focus:outline-none border w-full border-gray-400 rounded-lg"
                                        placeholder="Search"
                                    
                                    /> */}
                                </th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                                    <label>Already Inward Qty</label>
                                    {/* <input
                                                        type="text"
                                                        className="text-black h-6 focus:outline-none border w-full border-gray-400 rounded-lg"
                                                        placeholder="Search"
                                                        value={searchDueDate}
                                                    // onChange={(e) => {
                                                    //     setDueDate(e.target.value);
                                                    // }}
                                                    /> */}

                                </th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                                    <label>Already Return Qty</label></th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                                    <label>Balance Qty</label></th>

                                <th className="px-4 py-1.5 border border-gray-300 text-xs  w-20">Price </th>



                            </tr>
                        </thead>

                        <tbody>
                            {poItems?.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                                        No data found
                                    </td>
                                </tr>
                            ) : (poItems || []).map((item, index) => (
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
                                        {item?.Po?.docId}
                                    </td>
                                    <td className=" border border-gray-300 px-2 py-1 text-left text-xs">
                                        {getDateFromDateTimeToDisplay(item?.Po?.docDate)}
                                    </td>

                                    <td className=" border border-gray-300 text-[11px]  py-1.5 px-2">
                                        {item?.StyleItem?.name}
                                    </td>
                                    <td className=" border border-gray-300 text-[11px] text-right  py-1.5 px-2">
                                        {parseFloat(item?.qty || 0).toFixed(2)}
                                    </td>
                                    <td className=" border border-gray-300 text-[11px]  py-1.5 px-2">
                                        {parseFloat(item?.cancelQty || 0).toFixed(2)}
                                    </td>
                                    <td className=" border border-gray-300 text-[11px]  py-1.5 px-2">
                                        {parseFloat(item?.alreadyInwardQty || 0).toFixed(2)}
                                    </td>
                                    <td className=" border border-gray-300 text-[11px]  py-1.5 px-2">
                                        {parseFloat(item?.alreadyReturnQty || 0).toFixed(2)}
                                    </td>
                                    <td className=" border border-gray-300 text-[11px]  py-1.5 px-2">
                                        {parseFloat(item?.balQty || 0).toFixed(2)}
                                    </td>

                                    <td className=" border border-gray-300 text-[11px] text-right  py-1.5 px-2">
                                        {parseFloat(item?.price || 0).toFixed(2)}
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
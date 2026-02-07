import React, { useCallback, useEffect, useState } from 'react'
import { getDateFromDateTimeToDisplay } from '../../../Utils/helper';
import {

    useGetPurchaseInwardEntryForBillByIdQuery,

} from "../../../redux/uniformService/PurchaseInwardEntry";

const PoItemsSelection = ({ inwardItems=[], setInwardItems, setFillGrid, branchId, supplierId, tempItems, setTempItems, onClose }) => {
    const [localinwardItems, setLocalinwardItems] = useState([]);
    const [searchDocId, setSearchDocId] = useState("");
    const [searchPIDate, setPIDate] = useState("");
    const [searchInvNo, setSearchInvNo] = useState("");
    const [searchDcNo, setSearchDcNo] = useState("");
    const [dataPerPage, setDataPerPage] = useState("10");
    const [totalCount, setTotalCount] = useState(0);
    const [currentPageNumber, setCurrentPageNumber] = useState(1);
    const searchFields = { searchDocId, searchPIDate, searchInvNo, searchDcNo }

    useEffect(() => {
        setCurrentPageNumber(1);
    }, [
        searchDocId, searchPIDate, searchDcNo, searchInvNo
    ]);



    const { data: purchaseInwarddata, isFetching: isSingleFetching,
        isLoading: isSingleLoading, } = useGetPurchaseInwardEntryForBillByIdQuery({
            params: {

                branchId,
                supplierId,
                ...searchFields, pagination: true, dataPerPage, pageNumber: currentPageNumber,
            }
        })
    const syncFormWithDb = useCallback((data) => {

        setTempItems(data)

    }, [supplierId]);

    console.log(tempItems, "tempItemscheck");

    useEffect(() => {
        if (purchaseInwarddata?.data) {
            syncFormWithDb(purchaseInwarddata?.data);
        }

    }, [isSingleFetching, isSingleLoading, syncFormWithDb, purchaseInwarddata]);

    function handleDonee() {
        onClose()

    }
    function addItemm(id, obj) {
        setInwardItems(prevItems => {
            let newItems = structuredClone(prevItems);

            const index = newItems?.findIndex(v => v?.styleItemId === "");


            if (index !== -1) {
                newItems[index] = obj;
            } else {
                newItems.push(obj);
            }

            return newItems;
        });
    }
    function removeItemm(id) {
        setInwardItems(localInwardItems => {
            let newItems = structuredClone(localInwardItems);
            newItems = newItems?.filter(item => parseInt(item.id) !== parseInt(id))
            return newItems
        });
    }
    function handleChangee(id, obj) {
        console.log(id, "iddddd")

        if (isItemAddedd(id)) {
            removeItemm(id)
        } else {
            addItemm(id, obj)
        }
    }
    function isItemAddedd(id) {
        console.log(id, "id")

        return (inwardItems || [])?.findIndex(item => parseInt(item?.id) === parseInt(id)) !== -1
    }
    function handleSelectAllChangee(value, inwardItems) {
        if (value) {
            inwardItems?.forEach(item => addItemm(item.id, item))
        } else {
            inwardItems?.forEach(item => removeItemm(item.id))
        }
    }

    function getSelectAlll(inwardItems) {
        return inwardItems?.every(item => isItemAddedd(item.id))
    }
    const isRowEmpty = (row) =>
        !row.styleItemId &&
        !row.uomId &&
        !row.hsnId &&
        !row.inwardQty






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
                    checkId: item?.id,
                    docId: item?.PurchaseInward?.docId ?? "",
                    docdate: item?.PurchaseInward?.docDate ? getDateFromDateTimeToDisplay(item?.PurchaseInward?.docDate) : "",
                    invNo: item?.PurchaseInward?.invNo ?? "",
                    dcNo: item?.PurchaseInward?.dcNo ?? "",
                    styleItemId: item.styleItemId ?? "",
                    uomId: item.uomId ?? "",
                    hsnId: item.hsnId ?? "",
                    inwardQty: item.inwardQty ?? "",
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


    function addItem(item) {
        setLocalinwardItems(localInwardItems => {
            let newItems = structuredClone(localInwardItems);
            newItems.push(item);
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
                    &&
                    getDateFromDateTimeToDisplay(removeItem?.PurchaseInward?.docDate) === getDateFromDateTimeToDisplay(item?.PurchaseInward?.docDate)
                    &&
                    removeItem?.PurchaseInward?.docId === item?.PurchaseInward?.docId
                    &&
                    removeItem?.PurchaseInward?.invNo === item?.PurchaseInward?.invNo
                    &&
                    removeItem?.PurchaseInward?.dcNo === item?.PurchaseInward?.dcNo
                )
            )
        });
    }

    function isItemChecked(checkItem) {
        console.log(checkItem, "checkItem")

        let item = localinwardItems.find(item =>
            // checkItem.styleItemId === item.styleItemId
            // &&
            // checkItem.hsnId === item.hsnId
            // &&
            // checkItem.uomId === item.uomId
            // &&
            // checkItem.inwardQty === item.inwardQty
            // &&
            // getDateFromDateTimeToDisplay(checkItem?.PurchaseInward?.docDate) === getDateFromDateTimeToDisplay(item?.PurchaseInward?.docDate)
            // &&
            // checkItem?.PurchaseInward?.docId === item?.PurchaseInward?.docId
            // &&
            // checkItem?.PurchaseInward?.invNo === item?.PurchaseInward?.invNo
            // &&
            // checkItem?.PurchaseInward?.dcNo === item?.PurchaseInward?.dcNo
            checkItem?.checkId === item?.checkId


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
    const rows = Array.isArray(purchaseInwarddata?.data)
        ? purchaseInwarddata.data
        : [];

    function getSelectAll() {
        if (rows.length === 0) return false;

        return rows.every(row => isItemChecked(row));
    }
    function handleSelectAllChange(value) {
        if (value) {
            (rows ? rows : []).forEach(item => addItem(item))
        } else {
            (rows ? rows : []).forEach(item => removeItem(item))
        }
    }
    console.log(inwardItems, "inwardItemsinpoItemselection");

    return (
        <div
            className="bg-black/30 backdrop-blur-sm flex items-center justify-center "
        >
            <div className="w-full bg-white  shadow-2xl overflow-hidden">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2 flex justify-between items-center">
                    <h2 className="text-sm font-semibold tracking-wide">Purchase Inward Items</h2>

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
                                            onChange={(e) => handleSelectAllChangee(e.target.checked,tempItems ? tempItems : [])}
                                            checked={getSelectAlll(tempItems ? tempItems : [])}
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
                                        value={searchPIDate}
                                        onChange={(e) => {
                                            setPIDate(e.target.value);
                                        }}
                                        onFocus={(e) => { e.target.select() }}

                                    />
                                </th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs text-gray-800  w-28">
                                    <label>Inv No</label>
                                    <input
                                        type="text"
                                        className="text-black h-6 focus:outline-none border  border-gray-400 rounded-lg w-full"
                                        placeholder="Search"
                                        value={searchInvNo}
                                        onChange={(e) => {
                                            setSearchInvNo(e.target.value);
                                        }}
                                        onFocus={(e) => { e.target.select() }}

                                    />

                                </th>
                                <th className="px-1 py-1.5 border border-gray-300 text-xs text-gray-800  w-28">
                                    <label>Dc No</label>
                                    <input
                                        type="text"
                                        className="text-black h-6 focus:outline-none border  border-gray-400 rounded-lg w-full"
                                        placeholder="Search"
                                        value={searchDcNo}
                                        onChange={(e) => {
                                            setSearchDcNo(e.target.value);
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
                            {tempItems?.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
                                        No data found
                                    </td>
                                </tr>
                            ) : tempItems?.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`border-b hover:bg-gray-50 cursor-pointer ${isItemChecked(item) ? "bg-gray-50" : ""
                                        }`}
                                    onClick={() =>
                                        handleChangee(item?.id, item)
                                    }
                                >
                                    <td className="text-center py-2 border border-gray-300">
                                        <input
                                            type="checkbox"
                                            className="cursor-pointer"
                                            checked={isItemAddedd(item.id,item)}
                                        />
                                    </td>

                                    <td className="text-center border border-gray-300">{index + 1}</td>
                                    <td className=" border border-gray-300 text-[11px] py-1.5 px-2">
                                        {item?.PurchaseInward?.docId}

                                    </td>

                                    <td className=" border border-gray-300 text-[11px] py-1.5 px-2">
                                        {item?.PurchaseInward?.docDate ? getDateFromDateTimeToDisplay(item?.PurchaseInward?.docDate) : ""}

                                    </td>
                                    <td className=" border border-gray-300 text-right text-[11px] py-1.5 px-2">
                                        {item?.PurchaseInward?.invNo}
                                    </td>
                                    <td className=" border border-gray-300 text-right text-[11px] py-1.5 px-2">
                                        {item?.PurchaseInward?.dcNo}
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
                                        {item?.inwardQty}
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
                        onClick={handleDonee}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );

}

export default PoItemsSelection;
import React, { useCallback, useEffect, useState } from 'react'
import { getDateFromDateTimeToDisplay } from '../../../Utils/helper';
import {

    useGetPurchaseInwardEntryForBillByIdQuery,

} from "../../../redux/uniformService/PurchaseInwardEntry";

const PoItemsSelection = ({ inwardItems = [], setInwardItems, setFillGrid, branchId, supplierId, tempItems, setTempItems, onClose }) => {
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
    const tempItemsaaa = Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,

        inwardQty: (Math.random() * 100 + 1).toFixed(2),
        price: (Math.random() * 500 + 50).toFixed(2),

        PurchaseInward: {
            docId: `PI/26/${index + 1}`,
            docDate: `2026-02-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
            invNo: `INV-${1000 + index}`,
            dcNo: `DC-${2000 + index}`,
        },

        StyleItem: {
            name: `Style-${index + 1}`,
        },

        Hsn: {
            name: `HSN-${321590 + index}`,
        },

        Uom: {
            name: "PCS",
        },
    }));



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

    function handleDone() {
        onClose()

    }
    function addItem(id, obj) {
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
    function removeItem(id) {
        setInwardItems(localInwardItems => {
            let newItems = structuredClone(localInwardItems);
            newItems = newItems?.filter(item => parseInt(item.id) !== parseInt(id))
            return newItems
        });
    }
    function handleChangee(id, obj) {
        console.log(id, "iddddd")

        if (isItemAddedd(id)) {
            removeItem(id)
        } else {
            addItem(id, obj)
        }
    }
    function isItemAddedd(id) {
        console.log(id, "id")

        return (inwardItems || [])?.findIndex(item => parseInt(item?.id) === parseInt(id)) !== -1
    }
    function handleSelectAllChange(value, inwardItems) {
        if (value) {
            inwardItems?.forEach(item => addItem(item.id, item))
        } else {
            inwardItems?.forEach(item => removeItem(item.id))
        }
    }

    function getSelectAll(inwardItems) {
        return inwardItems?.every(item => isItemAddedd(item.id))
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




    console.log(inwardItems, "inwardItemsinpoItemselection");

    return (
        <>
            <div
                className="h-full flex flex-col bg-[#f1f1f0] "
            >
                <div className="border-b py-2 px-4 mx-3 flex justify-between items-center sticky top-0 z-10 bg-white mt-3">

                    {/* HEADER */}
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg px-2 py-0.5 font-semibold text-gray-800">Purchase Inward Items</h2>

                    </div>
                    <div className="flex gap-2">

                        <div className="flex gap-2">

                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1 hover:bg-green-600 hover:text-white rounded text-green-600 
                                        border border-green-600 flex items-center gap-1 text-xs"
                            >
                                {/* <Check size={14} /> */}
                                Done
                            </button>

                        </div>
                    </div>
                </div>
                {/* TABLE CONTENT */}
                <div className="flex-1  p-3">
                    <div className="grid grid-cols-1  gap-3  h-full">
                        <div className="lg:col-span- space-y-3">
                            <div className="bg-white p-3 rounded-md border border-gray-200 h-full">

                                <div className="border border-slate-200 p-2 bg-white rounded-md shadow-sm">
                                    {/* <div className="flex justify-between items-center mb-2">
                                        <h2 className="font-medium text-slate-700">List Of Items</h2>

                                    </div> */}

                                    <div className={` relative w-full max-h-[420px] overflow-y-auto  py-1`}>
                                        <table className="w-full border-collapse table-fixed">
                                            <thead className="bg-gray-200 text-gray-800">
                                                <tr>
                                                    <th className="px-2 py-1 w-10 border border-gray-300">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-medium mb-[2px]">Select</span>
                                                            <input
                                                                type="checkbox"
                                                                className="cursor-pointer"
                                                                onChange={(e) => handleSelectAllChange(e.target.checked, tempItems ? tempItems : [])}
                                                                checked={getSelectAll(tempItems ? tempItems : [])}
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
                                                    <th className="px-1 py-1.5 border border-gray-300 text-xs  w-20">
                                                        <label>price</label></th>




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
                                                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"} border-b cursor-pointer`}

                                                        onClick={() =>
                                                            handleChangee(item?.id, item)
                                                        }
                                                    >
                                                        <td className="text-center py-2 border border-gray-300">
                                                            <input
                                                                type="checkbox"
                                                                className="cursor-pointer"
                                                                checked={isItemAddedd(item.id, item)}
                                                            />
                                                        </td>

                                                        <td className="text-center border border-gray-300 text-[11px]">{index + 1}</td>
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
                                                            {/* {Number(item?.inwardQty || 0).toFixed(2)} */}
                                                            {item?.inwardQty}
                                                        </td>
                                                        <td className=" border text-right border-gray-300 text-[11px] py-1.5 px-2">
                                                            {/* {Number(item?.inwardQty || 0).toFixed(2)} */}
                                                            {parseFloat(item?.price).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* FOOTER */}
                                    {/* <div className="flex justify-end p-3 bg-gray-50">
                    <button
                        className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                        onClick={handleDone}
                    >
                        Done
                    </button>
                </div> */}
                                </div>
                            </div >
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

}

export default PoItemsSelection;
import { getDateFromDateTimeToDisplay } from "../../../Utils/helper";

const PurchaseInwardItemsSelection = ({
  returnItems = [],
  setReturnItems,
  onClose,
  tempItems = [],
  searchDocId,
  setSearchDocId,
  searchDocDate,
  setSearchDocDate,
}) => {

  const EMPTY_ROW = {
    styleItemId: "", uomId: "", hsnId: "",
    poQty: "", balQty: "", purchaseInwardId: "",
  };

  // ─── Selection Logic ──────────────────────────────────────────────────────

  function isItemAdded(id) {
    return (returnItems || []).findIndex(
      (r) => parseInt(r?.id) === parseInt(id)
    ) !== -1;
  }

  function addItem(item) {
    setReturnItems((prev) => {
      let newItems = structuredClone(prev);
      const newRow = {
        ...item,
        styleItemId:      item.styleItemId      ?? "",
        uomId:            item.uomId            ?? "",
        hsnId:            item.hsnId            ?? "",
        poQty:            item.poQty            ?? "",
        balQty:           item.balQty           ?? "",
        inwardQty:        item.inwardQty        ?? "",
        alreadyReturnQty: item.alreadyReturnQty ?? "",
        purchaseInwardId: item.purchaseInwardId ?? "",
      };

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

  function removeItem(id) {
    setReturnItems((prev) => {
      let updated = prev.filter(
        (r) => String(r.id) !== String(id)
      );
      while (updated.length < 3) updated.push({ ...EMPTY_ROW });
      return updated;
    });
  }

  function handleChange(id, obj) {
    if (isItemAdded(id)) {
      removeItem(id);
    } else {
      addItem(obj);
    }
  }

  function handleSelectAllChange(value) {
    if (value) {
      (tempItems || []).forEach((item) => {
        if (!isItemAdded(item.id)) addItem(item);
      });
    } else {
      (tempItems || []).forEach((item) => removeItem(item.id));
    }
  }

  function getSelectAll() {
    return (tempItems || []).length > 0 &&
      (tempItems || []).every((item) => isItemAdded(item.id));
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-[#f1f1f0]">

      {/* HEADER */}
      <div className="border-b py-2 px-4 mx-3 flex justify-between items-center sticky top-0 z-10 bg-white mt-3">
        <h2 className="text-lg px-2 py-0.5 font-semibold text-gray-800">
          Purchase Inward Items
        </h2>
        <button
          type="button"
          onClick={onClose}
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
                    <th className="border border-gray-300 px-2 py-1 text-center text-xs w-10">S No</th>
                    <th className="px-1 py-1.5 border border-gray-300 text-center text-xs w-24">
                      <label>Inward No</label>
                      <input
                        type="text"
                        className="text-black h-6 focus:outline-none border border-gray-400 rounded-lg w-full mt-0.5"
                        placeholder="Search"
                        onFocus={(e) => e.target.select()}
                        value={searchDocId}
                        onChange={(e) => setSearchDocId(e.target.value)}
                      />
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-center text-xs w-24">
                      <label>Inward Date</label>
                      <input
                        type="text"
                        className="text-black h-6 focus:outline-none border border-gray-400 rounded-lg w-full mt-0.5"
                        placeholder="Search"
                        value={searchDocDate}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setSearchDocDate(e.target.value)}
                      />
                    </th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-56">Description of Goods</th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-28">HSN</th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-16">UOM</th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-20 text-right">PO Qty</th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-20 text-right">Inward Qty</th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-24 text-right">Already Return Qty</th>
                    <th className="px-1 py-1.5 border border-gray-300 text-xs w-20 text-right">Balance Qty</th>
                  </tr>
                </thead>

                <tbody>
                  {(tempItems || []).length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-4 text-center text-gray-500">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    (tempItems || []).map((item, index) => (
                      <tr
                        key={item.id ?? index}
                        className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"} border-b cursor-pointer hover:bg-gray-50`}
                        onClick={() => handleChange(item?.id, item)}
                      >
                        <td className="text-center py-2 border border-gray-300">
                          <input
                            type="checkbox"
                            className="cursor-pointer"
                            checked={isItemAdded(item.id)}
                            readOnly
                          />
                        </td>
                        <td className="text-center border border-gray-300 text-[11px]">{index + 1}</td>
                        <td className="border border-gray-300 text-[11px] px-2 py-1.5">{item?.PurchaseInward?.docId}</td>
                        <td className="border border-gray-300 px-2 py-1 text-left text-[11px]">
                          {getDateFromDateTimeToDisplay(item?.PurchaseInward?.docDate)}
                        </td>
                        <td className="border border-gray-300 text-[11px] py-1.5 px-2">{item?.StyleItem?.name}</td>
                        <td className="border border-gray-300 text-[11px] py-1.5 px-2">{item?.Hsn?.name}</td>
                        <td className="border border-gray-300 text-[11px] py-1.5 px-2">{item?.Uom?.name}</td>
                        <td className="border border-gray-300 text-[11px] text-right py-1.5 px-2">{parseFloat(item?.poQty || 0).toFixed(2)}</td>
                        <td className="border border-gray-300 text-[11px] text-right py-1.5 px-2">{parseFloat(item?.inwardQty || 0).toFixed(2)}</td>
                        <td className="border border-gray-300 text-[11px] text-right py-1.5 px-2">{parseFloat(item?.alreadyReturnQty || 0).toFixed(2)}</td>
                        <td className="border border-gray-300 text-[11px] text-right py-1.5 px-2">{parseFloat(item?.balQty || 0).toFixed(2)}</td>
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

export default PurchaseInwardItemsSelection;
import { useEffect, useState } from "react";

import FxSelect from "../../../Inputs";
import customInput from "../../../Inputs";
import Swal from "sweetalert2";
import Modal from "../../../UiComponents/Modal";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import PoItemsSelection from "./PoItemsSelection";
import { useLazyGetStyleItemMasterByIdQuery } from "../../../redux/services/StyleItemMasterService";
import { getDateFromDateTimeToDisplay } from "../../../Utils/helper";

const InwardItems = ({
  id,
  inwardItems, tempItems, setTempItems,
  setInwardItems,
  readOnly,
  params,
  styleItemList,
  uomList,
  hsnList,
  taxTemplateId,
  inwardType,
  supplierId,
  branchId, dcNo, invNo
}) => {
  const EMPTY_ROW = {
    purchaseBillEntryId: "",
    docId: "",
    docdate: "",
    invNo: "",
    dcNo: "", styleItemId: "",
    hsnId: "",
    uomId: "",
    inwardQty: "",
    poQty: "",
    poId: "",
    checkId: ""
  };
  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [fillGrid, setFillGrid] = useState(false);
  const addRow = () => {
    const newRow = {
      purchaseBillEntryId: "",
      docId: "",
      docdate: "",
      invNo: "",
      dcNo: "",
      styleItemId: "",
      hsnId: "",
      uomId: "",
      inwardQty: "",
      poQty: "",
      poId: "", checkId: ""

    };
    setInwardItems([...inwardItems, newRow]);
  };
  const [triggerGetStyleItem, { data: styleData }] =
    useLazyGetStyleItemMasterByIdQuery();
  const handleInputChange = async (value, index, field) => {
    // clone first
    const newRows = structuredClone(inwardItems);
    if (field === "styleItemId") {
      // 1️⃣ update immediately
      newRows[index].styleItemId = value;
      setInwardItems([...newRows]); // 🔥 maintain UI instantly

      try {
        // 2️⃣ fetch style data
        const response = await triggerGetStyleItem(value).unwrap();

        // 3️⃣ update fabricId
        newRows[index].hsnId = response?.data?.hsnId;
        // 4️⃣ update again after API fetch
        setInwardItems([...newRows]);
      } catch (e) {
        console.error("Style fetch failed", e);
      }

      return; // stop here
    }
    // normal fields
    newRows[index][field] = value;
    setInwardItems([...newRows]);
  };
  const deleteRow = (id) => {
    setInwardItems((currentRows) => {
      if (currentRows.length > 1) {
        return currentRows.filter((row, index) => index !== parseInt(id));
      }
      return currentRows;
    });
  };

  const handleDeleteAllRows = () => {
    setInwardItems(Array.from({ length: 4 }, () => ({ ...EMPTY_ROW })));
  };

  const handleRightClick = (event, rowIndex, type) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      rowId: rowIndex,
      type,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const deleteSelectedRows = () => {
    setInwardItems((rows) =>
      rows.filter((r) => !(r.selected && (r.stockQty ?? 0) === 0)),
    );
    setContextMenu(null);
  };

  useEffect(() => {
    // If edit mode (id exists)
    if (id && inwardItems?.length > 0) {
      const requiredRows = 4;
      const missingRows = requiredRows - inwardItems.length;

      if (missingRows > 0) {
        setInwardItems([
          ...inwardItems,
          ...Array.from({ length: missingRows }, () => ({ ...EMPTY_ROW })),
        ]);
      }
    }

    // If create mode (no id)
    if (!id && (!inwardItems || inwardItems.length === 0)) {
      setInwardItems(Array.from({ length: 4 }, () => ({ ...EMPTY_ROW })));
    }
  }, [id, inwardItems]);
  console.log(inwardItems, "inwrdsinparent");

  return (
    <>
      <Modal
        isOpen={Number.isInteger(currentSelectedIndex)}
        onClose={() => setCurrentSelectedIndex("")}
      >
        <TaxDetailsFullTemplate
          readOnly={readOnly}
          taxTypeId={taxTemplateId}
          currentIndex={currentSelectedIndex}
          setCurrentSelectedIndex={setCurrentSelectedIndex}
          inwardItems={inwardItems}
          handleInputChange={handleInputChange}
        />
      </Modal>
      <Modal
        isOpen={fillGrid}
        onClose={() => setFillGrid(false)}
        widthClass={"w-[85%]"}
      >
        <PoItemsSelection
          setFillGrid={setFillGrid}
          supplierId={supplierId}
          inwardItems={inwardItems}
          setInwardItems={setInwardItems}
          branchId={branchId}
          inwardType={inwardType}
          dcNo={dcNo} tempItems={tempItems} setTempItems={setTempItems}
          invNo={invNo}
          onClose={() => setFillGrid(false)}

        />
      </Modal>
      <div className="border border-slate-200 px-2 bg-white rounded-md shadow-sm max-h-[230px] overflow-auto  w-full">
        <div className="flex items-center my-2">
          <h2 className="font-medium text-slate-700">List Of Items</h2>

          <button
            className={`font-bold text-slate-700 bord ml-[1200px] text-sm bg-blue-500 rounded rounded-md text-white px-2
              `}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setFillGrid(true);
              }
            }}
            onClick={() => {
              if (!supplierId) {
                Swal.fire({
                  icon: "success",
                  title: ` Choose Supplier`,
                  showConfirmButton: false,
                  timer: 2000,
                });
              } else {
                setFillGrid(true);
              }
            }}
            disabled={id}
          >
            Fill Purchase Inward Items
          </button>

        </div>
        <div
          className={`w-full min-h-[180px] max-h-[180px] overflow-y-auto  my-2`}
        >
          <table className=" border-collapse table-fixed">
            <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10">
              <tr>
                <th
                  className={`w-12 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  S.No
                </th>
                <th
                  className={`w-28 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  PI No
                </th>
                <th
                  className={`w-28 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  PI Date
                </th>
                <th
                  className={`w-28 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  Inv No
                </th>
                <th
                  className={`w-28 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  Dc No
                </th>
                <th
                  className={`w-96 px-2 py-2 text-center font-medium text-[13px]`}
                >
                  Description of Goods
                </th>
                <th
                  className={`w-28 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  HSN/SAC
                </th>
                <th
                  className={`w-20 px-4 py-2 text-center font-medium text-[13px] `}
                >
                  UOM
                </th>

                <th
                  className={`w-24 px-4 py-2 text-center font-medium text-[13px] `}
                >
                  Inward Qty
                </th>
                <th
                  className={`w-20 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(inwardItems ? inwardItems : [])?.map((row, index) => (
                <tr
                  className="border border-blue-gray-200 cursor-pointer "
                  key={index}
                >
                  <td className="w-12 border border-gray-300 text-[11px]  text-center p-0.5">
                    {index + 1}
                  </td>
                  <td className="w-12 border border-gray-300 text-[11px]  text-left p-0.5">
                    {row?.PurchaseInward?.docId}
                  </td>
                  <td className="w-12 border border-gray-300 text-[11px]  text-center p-0.5">
                    {row?.PurchaseInward?.docDate ? getDateFromDateTimeToDisplay(row?.PurchaseInward?.docDate) : ""}
                  </td>
                  <td className="w-12 border border-gray-300 text-[11px]  text-right pr-1 p-0.5">
                    {row?.PurchaseInward?.invNo}
                  </td>
                  <td className="w-12 border border-gray-300 text-[11px]  text-right  pr-1 p-0.5">
                    {row?.PurchaseInward?.dcNo}
                  </td>
                  <td className=" text-[11px] border border-gray-300 text-left">
                    <FxSelect
                      inputId={`styleItemId-input-${index}`}
                      value={row.styleItemId}
                      // onChange={(val) =>
                      //   handleInputChange(val, index, "styleItemId")
                      // }
                      options={(styleItemList?.data || [])
                        .filter((item) => item.active)
                        .map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                      readOnly={readOnly || inwardType !== "Direct Inward"}
                      placeholder=""
                    // onBlur={() =>
                    //   handleInputChange(row.styleItemId, index, "styleItemId")
                    // }
                    // onKeyDown={(e) => {
                    //   if (e.key === "Delete") {
                    //     handleInputChange("", index, "styleItemId");
                    //   }
                    // }}
                    />

                  </td>
                  <td className="py-0.5 border text-right border-gray-300 text-[11px] ">
                    <FxSelect
                      value={row.hsnId}
                      // onChange={(val) => handleInputChange(val, index, "hsnId")}
                      options={(hsnList?.data || [])
                        .filter((item) => item.active)
                        .map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                      readOnly={readOnly || inwardType !== "Direct Inward"}
                      placeholder=""
                    // onBlur={() =>
                    //   handleInputChange(row.hsnId, index, "hsnId")
                    // }
                    // onKeyDown={(e) => {
                    //   if (e.key === "Delete") {
                    //     handleInputChange("", index, "hsnId");
                    //   }
                    // }}
                    />
                  </td>
                  <td className="py-0.5 border border-gray-300 text-[11px] ">
                    <FxSelect
                      value={row.uomId}
                      // onChange={(val) => handleInputChange(val, index, "uomId")}
                      options={(uomList?.data || [])
                        .filter((item) => item.active)
                        .map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                      readOnly={readOnly || inwardType !== "Direct Inward"}
                      placeholder=""
                    // onBlur={() =>
                    //   handleInputChange(row.uomId, index, "uomId")
                    // }
                    // onKeyDown={(e) => {
                    //   if (e.key === "Delete") {
                    //     handleInputChange("", index, "uomId");
                    //   }
                    // }}
                    />
                  </td>

                  <td className="border-blue-gray-200 text-[11px] border border-gray-300 py-0.5 text-right pr-1">
                    {row?.inwardQty}

                  </td>

                  <td className="w-2 border border-gray-300">
                    <input
                      onContextMenu={(e) => {
                        if (!readOnly) {
                          handleRightClick(e, index, "");
                        }
                      }}
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRow();
                        }
                      }}
                      disabled={readOnly}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 h-7 font-medium text-gray-800">
                <td
                  className="text-right px-4 border border-gray-300 font-medium text-[13px] py-0.5"
                  colSpan={8}
                >
                  Total
                </td>


                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {inwardItems
                    ?.reduce(
                      (sum, row) => sum + (Number(row.inwardQty) || 0),
                      0,
                    )
                    .toFixed(2)}
                </td>
                <td className="text-right border border-gray-300"></td>
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
      </div>
    </>
  );
};

export default InwardItems;

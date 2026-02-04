import { useEffect, useState } from "react";
import secureLocalStorage from "react-secure-storage";
import { CLOSE_ICON, VIEW } from "../../../icons";
import FxSelect from "../../../Inputs";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import Modal from "../../../UiComponents/Modal";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import { useMemo } from "react";
import { useLazyGetStyleItemMasterByIdQuery } from "../../../redux/services/StyleItemMasterService";

const PoItems = ({
  id,
  poItems,
  setPoItems,
  readOnly,
  params,
  styleItemList,
  uomList,
  hsnList,
  taxTemplateId,
  isNewVersion,
  quoteVersion,
}) => {
  const EMPTY_ROW = {
    styleItemId: "",
    hsnId: "",
    uomId: "",
    price: "",
    qty: "",
    quoteVersion: "New",
  };
  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState(null);
  const addRow = () => {
    const newRow = {
      styleItemId: "",
      hsnId: "",
      uomId: "",
      price: "",
      qty: "",
      quoteVersion: id
      ? isNewVersion
        ? "New"
        : quoteVersion
      : 1,
    };
    setPoItems([...poItems, newRow]);
  };
 const [triggerGetStyleItem, { data: styleData }] =
    useLazyGetStyleItemMasterByIdQuery();
  const handleInputChange = async (value, index, field) => {
    // clone first
    const newRows = structuredClone(poItems);
    if (field === "styleItemId") {
      // 1️⃣ update immediately
      newRows[index].styleItemId = value;
      setPoItems([...newRows]); // 🔥 maintain UI instantly

      try {
        // 2️⃣ fetch style data
        const response = await triggerGetStyleItem(value).unwrap();

        // 3️⃣ update fabricId
        newRows[index].hsnId = response?.data?.hsnId;
        newRows[index].taxPercent = response?.data?.Hsn?.tax
        // 4️⃣ update again after API fetch
        setPoItems([...newRows]);
      } catch (e) {
        console.error("Style fetch failed", e);
      }

      return; // stop here
    }
    // normal fields
    newRows[index][field] = value;
    setPoItems([...newRows]);
  };
  const deleteRow = (id) => {
    setPoItems((currentRows) => {
      if (currentRows.length > 1) {
        return currentRows.filter((row, index) => index !== parseInt(id));
      }
      return currentRows;
    });
  };

  const handleDeleteAllRows = () => {
    setPoItems(Array.from({ length: 4 }, () => ({ ...EMPTY_ROW })));
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
    setPoItems((rows) =>
      rows.filter((r) => !(r.selected && (r.stockQty ?? 0) === 0)),
    );
    setContextMenu(null);
  };

  const getVisibleRows = (rows) => {
    if (!id) return rows;

    return rows.filter((row) =>
      isNewVersion
        ? row.quoteVersion === "New"
        : parseInt(row.quoteVersion) === parseInt(quoteVersion),
    );
  };

  useEffect(() => {
    setPoItems((prev) => {
      const requiredRows = 4;

      // CREATE MODE
      if (!id) {
        if (prev.length >= requiredRows) return prev;

        const missing = requiredRows - prev.length;

        const emptyRows = Array.from({ length: missing }, () => ({
          ...EMPTY_ROW,
          quoteVersion: 1,
        }));

        return [...prev, ...emptyRows];
      }

      // 👇 EDIT MODE (only if id exists)
      if (id) {
        const visibleRows = prev.filter((row) =>
          isNewVersion
            ? row.quoteVersion === "New"
            : parseInt(row.quoteVersion) === parseInt(quoteVersion),
        );

        const missing = requiredRows - visibleRows.length;
        if (missing <= 0) return prev;

        const emptyRows = Array.from({ length: missing }, () => ({
          ...EMPTY_ROW,
          quoteVersion: isNewVersion ? "New" : quoteVersion,
        }));

        return [...prev, ...emptyRows];
      }

      return prev;
    });
  }, [id, isNewVersion, quoteVersion]);

  useEffect(() => {
    if (!isNewVersion) return;
    setPoItems((prev) => {
      let newPrev = structuredClone(prev);
      return [
        ...newPrev.filter((i) => i.quoteVersion !== "New"),
        ...newPrev
          .filter((i) => parseInt(i.quoteVersion) === parseInt(quoteVersion))
          .map((i) => ({ ...i, quoteVersion: "New" })),
      ];
    });
  }, [isNewVersion, quoteVersion]);
  let count = 1;

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
          poItems={poItems}
          handleInputChange={handleInputChange}
          id={id}
          isNewVersion={isNewVersion}
        />
      </Modal>
      <div className="border border-slate-200 px-2 bg-white rounded-md shadow-sm max-h-[230px] overflow-auto  w-full">
        <div className="flex justify-between items-center my-2">
          <h2 className="font-medium text-slate-700">List Of Items</h2>
        </div>
        <div
          className={`w-full min-h-[180px] max-h-[180px] overflow-y-auto  my-1`}
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
                  className={`w-96 px-2 py-2 text-center font-medium text-[13px]`}
                >
                  Description of Goods
                </th>
                <th
                  className={`w-32 px-4 py-2 text-center font-medium text-[13px]`}
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
                  Quantity
                </th>

                <th
                  className={`w-24 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Price
                </th>
                <th
                  className={`w-28 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Gross
                </th>
                <th
                  className={`w-24 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Tax Details
                </th>
                <th
                  className={`w-20 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(poItems ? poItems : [])?.map((row, index) =>
                (
                  id
                    ? isNewVersion
                      ? row.quoteVersion === "New"
                      : parseInt(row.quoteVersion) === parseInt(quoteVersion)
                    : true
                ) ? (
                  <tr
                    className="border border-blue-gray-200 cursor-pointer "
                    key={index}
                  >
                    <td className="w-12 border border-gray-300 text-[11px]  text-center p-0.5">
                      {count++}
                    </td>
                    <td className=" text-[11px] border border-gray-300 text-left">
                      <FxSelect
                        inputId={`styleItemId-input-${index}`}
                        value={row.styleItemId}
                        onChange={(val) =>
                          handleInputChange(val, index, "styleItemId")
                        }
                        options={(styleItemList?.data || [])
                          .filter((item) => item.active)
                          .map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                        readOnly={id ? !isNewVersion : readOnly}
                        placeholder=""
                        onBlur={() =>
                          handleInputChange(
                            row.styleItemId,
                            index,
                            "styleItemId",
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Delete") {
                            handleInputChange("", index, "styleItemId");
                          }
                        }}
                      />
                    </td>
                    <td className="py-0.5 border border-gray-300 text-[11px] ">
                      <FxSelect
                        value={row.hsnId}
                        onChange={(val) =>
                          handleInputChange(val, index, "hsnId")
                        }
                        options={(hsnList?.data || [])
                          .filter((item) => item.active)
                          .map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                        readOnly={id ? !isNewVersion : readOnly}
                        placeholder=""
                        onBlur={() =>
                          handleInputChange(row.hsnId, index, "hsnId")
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Delete") {
                            handleInputChange("", index, "hsnId");
                          }
                        }}
                      />
                    </td>
                    <td className="py-0.5 border border-gray-300 text-[11px] ">
                      <FxSelect
                        value={row.uomId}
                        onChange={(val) =>
                          handleInputChange(val, index, "uomId")
                        }
                        options={(uomList?.data || [])
                          .filter((item) => item.active)
                          .map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                        readOnly={id ? !isNewVersion : readOnly}
                        placeholder=""
                        onBlur={() =>
                          handleInputChange(row.uomId, index, "uomId")
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Delete") {
                            handleInputChange("", index, "uomId");
                          }
                        }}
                      />
                    </td>
                    <td className="border-blue-gray-200 text-[11px] border border-gray-300 py-0.5 text-right">
                      <input
                        onKeyDown={(e) => {
                          if (e.code === "Minus" || e.code === "NumpadSubtract")
                            e.preventDefault();
                          if (e.key === "Delete") {
                            handleInputChange("", index, "qty");
                          }
                        }}
                        min={"0"}
                        type="number"
                        className="text-right rounded py-1 px-1 w-full table-data-input"
                        onFocus={(e) => e.target.select()}
                        value={row?.qty}
                        onChange={(e) =>
                          handleInputChange(e.target.value, index, "qty")
                        }
                        onBlur={(e) => {
                          handleInputChange(e.target.value, index, "qty");
                        }}
                        disabled={
                          id
                            ? !isNewVersion
                            : readOnly || (row.stockQty ?? 0) > 0
                        }
                      />
                    </td>
                    <td className="border-blue-gray-200 text-[11px] border border-gray-300 py-0.5 text-right">
                      <input
                        onKeyDown={(e) => {
                          if (e.code === "Minus" || e.code === "NumpadSubtract")
                            e.preventDefault();
                          if (e.key === "Delete") {
                            handleInputChange("", index, "price");
                          }
                        }}
                        min={"0"}
                        type="number"
                        className="text-right rounded py-1 px-1 w-full table-data-input"
                        onFocus={(e) => {
                          setFocusedRowIndex(index);
                          e.target.select();
                        }}
                        value={
                          focusedRowIndex === index
                            ? (row?.price ?? "") // show raw value while editing
                            : row?.price
                              ? Number(row.price).toFixed(2) // format nicely otherwise
                              : ""
                        }
                        onChange={(e) =>
                          handleInputChange(e.target.value, index, "price")
                        }
                        onBlur={(e) => {
                          handleInputChange(e.target.value, index, "price");
                          setFocusedRowIndex(null);
                        }}
                        disabled={id ? !isNewVersion : readOnly}
                      />
                    </td>
                    <td className="py-0.5 border border-gray-300 text-[11px]">
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        className="text-right rounded py-1 px-1 w-full"
                        value={
                          !row.qty || !row.price
                            ? 0.0
                            : (
                                parseFloat(row.qty) * parseFloat(row.price)
                              ).toFixed(2)
                        }
                        disabled={true}
                      />
                    </td>

                    <td className=" py-0.5 border border-gray-300 text-[11px] text-right">
                      <button
                        disabled={!row?.styleItemId}
                        className="text-center rounded py-1 w-20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setCurrentSelectedIndex(index);
                          }
                        }}
                        onClick={() => {
                          if (!taxTemplateId)
                            return toast.info("Please select Tax Type", {
                              position: "top-center",
                            });
                          setCurrentSelectedIndex(index);
                        }}
                      >
                        {VIEW}
                      </button>
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
                        disabled={id ? !isNewVersion : readOnly}
                      />
                    </td>
                  </tr>
                ) : null,
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 h-7 font-medium text-gray-800">
                <td
                  className="text-right px-4 border border-gray-300 font-medium text-[13px] py-0.5"
                  colSpan={4}
                >
                  Total
                </td>
                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems
                    ?.filter(
                      (item) =>
                        Number(item.quoteVersion) === Number(quoteVersion),
                    )
                    ?.reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
                    .toFixed(2)}
                </td>
                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems
                    ?.filter(
                      (item) =>
                        Number(item.quoteVersion) === Number(quoteVersion),
                    )
                    ?.reduce((sum, row) => sum + (Number(row.price) || 0), 0)
                    .toFixed(2)}
                </td>
                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems
                    ?.filter(
                      (item) =>
                        Number(item.quoteVersion) === Number(quoteVersion),
                    )
                    ?.reduce((sum, row) => {
                      const qty = parseFloat(row.qty) || 0;
                      const price = parseFloat(row.price) || 0;
                      return sum + qty * price;
                    }, 0)
                    .toFixed(2)}
                </td>
                <td className="border border-gray-300" colSpan={2}></td>
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

export default PoItems;

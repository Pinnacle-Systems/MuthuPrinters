import { useEffect, useRef, useState } from "react";
import secureLocalStorage from "react-secure-storage";
import { CLOSE_ICON, VIEW } from "../../../icons";
import FxSelect from "../../../Inputs";
import { FxSelectWithAdd } from "../../../Inputs";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import Modal from "../../../UiComponents/Modal";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import { useMemo } from "react";
import { useLazyGetStyleItemMasterByIdQuery } from "../../../redux/services/StyleItemMasterService";
import { getUniqueArrayBySize } from "../../../Utils/helper";
import { ColorMaster, Size, StyleItemMaster } from "..";

const PoItems = ({
  id,
  poItems,
  enrichedPoItems,
  setPoItems,
  readOnly,
  params,
  styleItemList,
  uomList,
  hsnList,
  taxTemplateId,
  isNewVersion,
  quoteVersion,
  itemGroupList,
  sizeList,
  colorList,
  termsRef,
}) => {
  const EMPTY_ROW = {
    styleItemId: "",
    hsnId: "",
    uomId: "",
    price: "",
    qty: "",
    quoteVersion: "New",
    netAmount: 0,
    itemGroupId: "",
    sizeId: "",
    colorId: "",
  };
  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const actionRefs = useRef([]);
  const addRow = () => {
    const newRow = {
      styleItemId: "",
      hsnId: "",
      uomId: "",
      price: "",
      qty: "",
      quoteVersion: id ? (isNewVersion ? "New" : quoteVersion) : quoteVersion,
      netAmount: 0,
      itemGroupId: "",
      sizeId: "",
      colorId: "",
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
        newRows[index].taxPercent = response?.data?.Hsn?.tax;
        newRows[index].itemGroupId = response?.data?.itemGroupId;
        newRows[index].sizeId = response?.data?.sizeId;
        newRows[index].colorId = response?.data?.colorId;
        newRows[index].uomId = response?.data?.uomId;
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

  useEffect(() => {
    setPoItems((prev) => {
      const requiredRows = 4;

      // CREATE MODE
      if (!id) {
        if (prev.length >= requiredRows) return prev;

        const missing = requiredRows - prev.length;

        const emptyRows = Array.from({ length: missing }, () => ({
          ...EMPTY_ROW,
          quoteVersion: quoteVersion,
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

  // useEffect(() => {
  //   // Recalculate net amount for all rows whenever dependent fields change
  //   const updatedRows = poItems.map((row) => {
  //     const price = parseFloat(row.price) || 0;
  //     const qty = parseFloat(row.qty) || 0;
  //     const taxPercent = parseFloat(row.taxPercent) || 0;
  //     const discountValue = parseFloat(row.discountValue) || 0;
  //     const discountType = row.discountType;

  //     const gross = price * qty;

  //     let discountAmount = 0;
  //     if (discountType) {
  //       if (discountType === "Flat") {
  //         discountAmount = discountValue;
  //       } else {
  //         discountAmount = (gross * discountValue) / 100;
  //       }
  //     }

  //     const taxable = gross - discountAmount;
  //     const sgst = (taxable * (taxPercent / 2)) / 100;
  //     const cgst = (taxable * (taxPercent / 2)) / 100;

  //     const net = taxable + sgst + cgst;

  //     return {
  //       ...row,
  //       netAmount: Math.round(net),
  //       taxable: taxable,
  //     };
  //   });

  //   // Only update if net amounts actually changed
  //   const needsUpdate = updatedRows.some(
  //     (row, index) => row.netAmount !== (poItems[index]?.netAmount || 0),
  //   );

  //   if (needsUpdate) {
  //     setPoItems(updatedRows);
  //   }
  // }, [poItems]); // This will run whenever poItems change

  const focusActionCell = (index) => {
    setTimeout(() => {
      actionRefs.current[index]?.focus();
    }, 200); // wait for modal close render
  };

  return (
    <>
      <Modal
        isOpen={Number.isInteger(currentSelectedIndex)}
        onClose={() => {
          const index = currentSelectedIndex;
          setCurrentSelectedIndex("");
          focusActionCell(index); // 🔥 restore focus
        }}
      >
        <TaxDetailsFullTemplate
          readOnly={readOnly}
          taxTypeId={taxTemplateId}
          currentIndex={currentSelectedIndex}
          setCurrentSelectedIndex={setCurrentSelectedIndex}
          poItems={enrichedPoItems || poItems}
          handleInputChange={handleInputChange}
          id={id}
          isNewVersion={isNewVersion}
          onCloseFocus={focusActionCell}
        />
      </Modal>
      <div className="border border-slate-200 px-2 bg-white rounded-md shadow-sm max-h-[250px] overflow-auto  w-full">
        <div className="flex justify-between items-center my-2">
          <h2 className="font-medium text-slate-700">List Of Items</h2>
        </div>
        <div
          className={`w-full min-h-[200px] max-h-[200px] overflow-y-auto  my-1`}
        >
          <table className="w-full border-collapse table-fixed">
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
                  Description of Goods<span className="text-red-500">*</span>
                </th>
                <th
                  className={`w-36 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  Item Group
                </th>
                <th
                  className={`w-20 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  Size
                </th>
                <th
                  className={`w-32 px-4 py-2 text-center font-medium text-[13px]`}
                >
                  Color
                </th>
                <th
                  className={`w-20 px-4 py-2 text-center font-medium text-[13px] `}
                >
                  UOM<span className="text-red-500">*</span>
                </th>
                <th
                  className={`w-24 px-4 py-2 text-center font-medium text-[13px] `}
                >
                  Quantity<span className="text-red-500">*</span>
                </th>

                <th
                  className={`w-24 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Price<span className="text-red-500">*</span>
                </th>
                <th
                  className={`w-28 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Gross Amount
                </th>
                {/* <th
                  className={`w-28 px-1 py-2 text-center font-medium text-[13px] `}
                >
                  Net Amount
                </th> */}
                <th
                  className={`w-20 px-1 py-2 text-center font-medium text-[13px] `}
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
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-100"} border border-blue-gray-200 cursor-pointer`}
                    key={index}
                    onContextMenu={(e) => {
                      if (!readOnly) {
                        handleRightClick(e, index, "");
                      }
                    }}
                  >
                    <td className="w-12 border border-gray-300 text-[11px]  text-center p-0.5">
                      {count++}
                    </td>
                    <td className=" text-[11px] border border-gray-300 text-left">
                      <FxSelectWithAdd
                        inputId={`styleItemId-input-${index}`}
                        value={row.styleItemId}
                        onChange={(val) =>
                          handleInputChange(val, index, "styleItemId")
                        }
                        options={(styleItemList?.data || [])
                          .filter((item) => (id ? true : item.active))
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
                        addNew={true}
                        childComponent={StyleItemMaster}
                        addNewModalWidth="w-[50%] h-[57%]"
                        nextRef={termsRef}
                      />
                    </td>
                    <td className=" border border-gray-300 text-[11px] ">
                      <FxSelect
                        value={row.itemGroupId}
                        onChange={(val) =>
                          handleInputChange(val, index, "itemGroupId")
                        }
                        options={(itemGroupList?.data || [])
                          .filter((item) => (id ? true : item.active))
                          .map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                        readOnly={true}
                        placeholder=""
                        onBlur={() =>
                          handleInputChange(
                            row.itemGroupId,
                            index,
                            "itemGroupId",
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Delete") {
                            handleInputChange("", index, "itemGroupId");
                          }
                        }}
                      />
                      {/* {row.itemGroupId} */}
                    </td>
                    <td className="py-0.5 border border-gray-300 text-[11px] ">
                      <FxSelectWithAdd
                        value={row.sizeId}
                        onChange={(val) =>
                          handleInputChange(val, index, "sizeId")
                        }
                        options={getUniqueArrayBySize(
                          styleItemList?.data,
                          sizeList?.data,
                          "sizeId",
                          row.styleItemId,
                        )
                          .filter((item) => (id ? true : item.active))
                          .map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                        readOnly={id ? !isNewVersion : readOnly}
                        placeholder=""
                        onBlur={() =>
                          handleInputChange(row.sizeId, index, "sizeId")
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Delete") {
                            handleInputChange("", index, "sizeId");
                          }
                        }}
                        addNew={true}
                        childComponent={Size}
                        addNewModalWidth="w-[30%] h-[45%]"
                      />
                    </td>
                    <td className="py-0.5 border border-gray-300 text-[11px] ">
                      <FxSelectWithAdd
                        value={row.colorId}
                        onChange={(val) =>
                          handleInputChange(val, index, "colorId")
                        }
                        options={(colorList?.data || [])
                          .filter((item) => (id ? true : item.active))
                          .map((item) => ({
                            label: item.name,
                            value: item.id,
                          }))}
                        readOnly={id ? !isNewVersion : readOnly}
                        placeholder=""
                        onBlur={() =>
                          handleInputChange(row.colorId, index, "colorId")
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Delete") {
                            handleInputChange("", index, "colorId");
                          }
                        }}
                        addNew={true}
                        childComponent={ColorMaster}
                        addNewModalWidth="w-[30%] h-[45%]"
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
                        readOnly={true}
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
                    <td className="border-blue-gray-200 text-[11px] border border-gray-300 text-right">
                      <input
                        type="number"
                        min="0"
                        className="text-right py-1 px-1 w-full table-data-input"
                        onFocus={(e) => {
                          e.target.select();
                          setFocusedField(`${index}-qty`);
                        }}
                        value={
                          focusedField === `${index}-qty`
                            ? (row?.qty ?? "")
                            : row?.qty
                              ? Number(row.qty).toFixed(2)
                              : ""
                        }
                        onChange={(e) =>
                          handleInputChange(e.target.value, index, "qty")
                        }
                        onBlur={(e) => {
                          const val = e.target.value;
                          handleInputChange(
                            val ? Number(val).toFixed(2) : "",
                            index,
                            "qty",
                          );
                          setFocusedField(null);
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
                        type="number"
                        min="0"
                        className="text-right py-1 px-1 w-full table-data-input"
                        onFocus={(e) => {
                          e.target.select();
                          setFocusedField(`${index}-price`);
                        }}
                        value={
                          focusedField === `${index}-price`
                            ? (row?.price ?? "")
                            : row?.price
                              ? Number(row.price).toFixed(2)
                              : ""
                        }
                        onChange={(e) =>
                          handleInputChange(e.target.value, index, "price")
                        }
                        onBlur={(e) => {
                          const val = e.target.value;
                          handleInputChange(
                            val ? Number(val).toFixed(2) : "",
                            index,
                            "price",
                          );
                          setFocusedField(null);
                        }}
                        disabled={id ? !isNewVersion : readOnly}
                      />
                    </td>
                    <td className="py-0.5 border border-gray-300 text-[11px]">
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        className="text-right rounded py-1 px-1 w-full "
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
                    {/* <td className="py-0.5 border border-gray-300 text-[11px]">
                      <input
                        type="number"
                        className="text-right rounded py-1 px-1 w-full"
                        value={
                          row?.netAmount !== undefined &&
                          row?.netAmount !== null
                            ? Number(row.netAmount).toFixed(2)
                            : "0"
                        }
                        disabled
                      />
                    </td> */}

                    <td className=" py-0.5 border border-gray-300 text-[11px] text-right w-20">
                      <button
                        disabled={!row?.styleItemId}
                        className="text-center rounded py-1 w-20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
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
                        ref={(el) => (actionRefs.current[index] = el)}
                        className="w-full table-data-input"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (index === poItems.length - 1) {
                              addRow();
                            }
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
                  colSpan={6}
                >
                  Total
                </td>
                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems
                    ?.filter((item) =>
                      id
                        ? isNewVersion
                          ? item.quoteVersion === "New"
                          : parseInt(item.quoteVersion) ===
                            parseInt(quoteVersion)
                        : true,
                    )
                    ?.reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
                    .toFixed(2)}
                </td>
                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems
                    ?.filter((item) =>
                      id
                        ? isNewVersion
                          ? item.quoteVersion === "New"
                          : parseInt(item.quoteVersion) ===
                            parseInt(quoteVersion)
                        : true,
                    )
                    ?.reduce((sum, row) => sum + (Number(row.price) || 0), 0)
                    .toFixed(2)}
                </td>
                <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems
                    ?.filter((item) =>
                      id
                        ? isNewVersion
                          ? item.quoteVersion === "New"
                          : parseInt(item.quoteVersion) ===
                            parseInt(quoteVersion)
                        : true,
                    )
                    ?.reduce((sum, row) => {
                      const qty = parseFloat(row.qty) || 0;
                      const price = parseFloat(row.price) || 0;
                      return sum + qty * price;
                    }, 0)
                    .toFixed(2)}
                </td>
                {/* <td className="text-right border border-gray-300 px-1 font-medium text-[13px] py-0.5">
                  {poItems
                    ?.filter((item) =>
                      id
                        ? isNewVersion
                          ? item.quoteVersion === "New"
                          : parseInt(item.quoteVersion) ===
                            parseInt(quoteVersion)
                        : true,
                    )
                    ?.reduce(
                      (sum, row) => sum + (Number(row.netAmount) || 0),
                      0,
                    )
                    .toFixed(2)}
                </td> */}
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

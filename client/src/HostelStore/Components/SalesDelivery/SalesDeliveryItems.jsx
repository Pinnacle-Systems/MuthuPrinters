import React, { useState, useRef } from "react";
import FxSelect, { FxSelectWithAdd } from "../../../Inputs";
import {
  useGetStyleItemMasterQuery,
  useLazyGetStyleItemMasterByIdQuery,
} from "../../../redux/services/StyleItemMasterService";
import { useGetUomQuery } from "../../../redux/services/UomMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { findFromList, getCommonParams } from "../../../Utils/helper";
import { VIEW } from "../../../icons";
import Modal from "../../../UiComponents/Modal";
import TaxDetailsFullTemplate from "../TaxDetailsCompleteTemplate";
import Swal from "sweetalert2";
import { StyleItemMaster } from "..";

const SalesDeliveryItems = ({
  items,
  enrichedItems,
  setItems,
  readOnly,
  taxTemplateId,
  id,
  isCumInvoice,
  termsRef,
  isSupplierOutside,
}) => {
  const styleItemRefs = useRef({});
  const { companyId } = getCommonParams();
  const { data: styleItemList } = useGetStyleItemMasterQuery({
    params: { companyId },
  });
  const { data: uomList } = useGetUomQuery({ params: { companyId } });
  const { data: hsnList } = useGetHsnMasterQuery({ params: { companyId } });

  const EMPTY_ROW = {
    styleItemId: "",
    uomId: "",
    hsnId: "",
    qty: "",
    price: "",
    amount: "",
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [triggerGetStyleItem] = useLazyGetStyleItemMasterByIdQuery();

  const addRow = () => setItems([...items, EMPTY_ROW]);

  const deleteRow = (index) => setItems(items.filter((_, i) => i !== index));

  const handleInputChange = async (value, index, field) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    const qty = parseFloat(newItems[index].qty) || 0;
    const price = parseFloat(newItems[index].price) || 0;

    if (isCumInvoice) {
      newItems[index].amount = qty && price ? (qty * price).toFixed(2) : "";
    } else {
      // For delivery only, no price calculation — clear amount
      newItems[index].amount = "";
      newItems[index].price = "";
    }

    setItems(newItems);

    if (field === "styleItemId") {
      newItems[index].styleItemId = value;
      setItems([...newItems]);
      try {
        const response = await triggerGetStyleItem(value).unwrap();
        const updatedItems = items.map((item, i) =>
          i === index
            ? {
                ...item,
                styleItemId: value,
                hsnId: response?.data?.hsnId,
                uomId: response?.data?.uomId,
              }
            : item,
        );
        setItems(updatedItems);
      } catch (e) {
        console.error("Style fetch failed", e);
      }
    }
  };

  const handleRightClick = (event, rowIndex) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      rowId: rowIndex,
    });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleFocusNextRow = (index) => {
    const nextIndex = index + 1;
    if (!items[nextIndex]) {
      setItems((prev) => [...prev, EMPTY_ROW]);
      setTimeout(() => {
        styleItemRefs.current[nextIndex]?.focus?.();
      }, 300);
    } else {
      setTimeout(() => {
        styleItemRefs.current[nextIndex]?.focus?.();
      }, 50);
    }
  };

  const deleteSelectedRows = () => {
    setItems((rows) => rows.filter((r) => !r.selected));
    setContextMenu(null);
  };

  const handleDeleteAllRows = () =>
    setItems(Array.from({ length: 10 }, () => ({ ...EMPTY_ROW })));

  return (
    <>
      {isCumInvoice && (
        <Modal
          isOpen={Number.isInteger(currentSelectedIndex)}
          onClose={() => {
            setCurrentSelectedIndex("");
            window.setTimeout(() => {
              handleFocusNextRow(currentSelectedIndex);
            }, 0);
          }}
        >
          <TaxDetailsFullTemplate
            readOnly={readOnly}
            taxTypeId={taxTemplateId}
            currentIndex={currentSelectedIndex}
            setCurrentSelectedIndex={setCurrentSelectedIndex}
            poItems={enrichedItems?.items || items}
            handleInputChange={handleInputChange}
            id={id}
            isNewVersion={false}
            onCloseFocus={handleFocusNextRow}
            isSupplierOutside={isSupplierOutside}
          />
        </Modal>
      )}

      <div className="w-full h-full overflow-y-auto bg-white">
        <table className="table-fixed min-h-full bg-white">
          <thead className="bg-gray-200 text-gray-800 sticky top-0 z-10 text-[12px]">
            <tr>
              <th className="w-10 px-1 py-2 text-center font-medium border border-gray-300">
                S.No
              </th>
              <th className="w-80 px-2 py-2 text-center font-medium border border-gray-300">
                Description of Goods<span className="text-red-500">*</span>
              </th>
              <th className="w-40 px-1 py-2 text-center font-medium border border-gray-300">
                HSN
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                UOM
              </th>
              <th className="w-24 px-1 py-2 text-center font-medium border border-gray-300">
                Qty<span className="text-red-500">*</span>
              </th>
              {isCumInvoice && (
                <>
                  <th className="w-32 px-1 py-2 text-center font-medium border border-gray-300">
                    Price<span className="text-red-500">*</span>
                  </th>
                  <th className="w-32 px-1 py-2 text-center font-medium border border-gray-300">
                    Amount
                  </th>
                  <th className="w-12 px-1 py-2 text-center font-medium border border-gray-300">
                    Tax
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items?.map((item, index) => (
              <tr
                key={index}
                className={`h-6 hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                onContextMenu={(e) => {
                  if (!readOnly) handleRightClick(e, index);
                }}
              >
                <td className="text-[11px] text-center border border-gray-300">
                  {index + 1}
                </td>
                <td className="border border-gray-300">
                  <FxSelectWithAdd
                    value={item.styleItemId}
                    onChange={(val) =>
                      handleInputChange(val, index, "styleItemId")
                    }
                    options={
                      styleItemList?.data
                        ?.filter((p) => p.active)
                        .map((p) => ({ label: p.name, value: p.id })) || []
                    }
                    readOnly={readOnly}
                    placeholder=""
                    addNew={true}
                    childComponent={StyleItemMaster}
                    addNewModalWidth="w-[50%] h-[57%]"
                    ref={(el) => (styleItemRefs.current[index] = el)}
                    nextRef={termsRef}
                  />
                </td>
                <td className="border border-gray-300 text-[11px] px-2">
                  <span>
                    {findFromList(item.hsnId, hsnList?.data, "name") || ""}
                  </span>
                </td>
                <td className="border border-gray-300 text-[11px] px-2">
                  <span>
                    {findFromList(item.uomId, uomList?.data, "name") || ""}
                  </span>
                </td>
                <td className="text-[11px] border border-gray-300 text-right">
                  <input
                    type="number"
                    className="text-right px-1 w-full table-data-input"
                    onFocus={(e) => {
                      e.target.select();
                      setFocusedField(`qty_${index}`);
                    }}
                    value={
                      focusedField === `qty_${index}`
                        ? (item?.qty ?? "")
                        : item?.qty
                          ? Number(item.qty).toFixed(3)
                          : ""
                    }
                    onChange={(e) =>
                      handleInputChange(e.target.value, index, "qty")
                    }
                    onBlur={(e) => {
                      const val = e.target.value;
                      handleInputChange(
                        val ? Number(val).toFixed(3) : "",
                        index,
                        "qty",
                      );
                      setFocusedField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.code === "Minus" || e.code === "NumpadSubtract")
                        e.preventDefault();
                      if (e.key === "Delete")
                        handleInputChange("", index, "qty");
                    }}
                    disabled={readOnly}
                  />
                </td>
                {isCumInvoice && (
                  <>
                    <td className="text-[11px] border border-gray-300 text-right">
                      <input
                        type="number"
                        step="0.01"
                        className="text-right px-3 w-full table-data-input"
                        value={
                          focusedField === `price_${index}`
                            ? (item.price ?? "")
                            : item.price
                              ? Number(item.price).toFixed(2)
                              : ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            e.target.value === "" ? "" : e.target.value,
                            index,
                            "price",
                          )
                        }
                        readOnly={readOnly}
                        onFocus={(e) => {
                          e.target.select();
                          setFocusedField(`price_${index}`);
                        }}
                        onBlur={(e) => {
                          const num = parseFloat(e.target.value);
                          handleInputChange(
                            num ? Number(num).toFixed(2) : "",
                            index,
                            "price",
                          );
                          setFocusedField(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.code === "Minus" || e.code === "NumpadSubtract")
                            e.preventDefault();
                          if (e.key === "Delete")
                            handleInputChange("", index, "price");
                          if (e.key === "Enter" && index === items.length - 1)
                            addRow();
                        }}
                      />
                    </td>
                    <td className="text-[11px] text-right px-1 border border-gray-300 bg-gray-50 bg-transparent gap-x-2">
                      {item.styleItemId
                        ? parseFloat(item.amount || 0).toFixed(2)
                        : ""}
                    </td>
                    <td className="border border-gray-300 text-center text-[11px]">
                      <button
                        disabled={!item.styleItemId}
                        className="text-indigo-600 w-full hover:text-indigo-800 disabled:text-gray-300 table-data-input"
                        onClick={() => {
                          if (!taxTemplateId) {
                            return Swal.fire({
                              title: "Information",
                              text: "Please select Tax Type",
                              icon: "info",
                              confirmButtonColor: "#3085d6",
                            });
                          }
                          setCurrentSelectedIndex(index);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!taxTemplateId) {
                              return Swal.fire({
                                title: "Information",
                                text: "Please select Tax Type",
                                icon: "info",
                                confirmButtonColor: "#3085d6",
                              });
                            }
                            setCurrentSelectedIndex(index);
                          }
                        }}
                      >
                        {VIEW}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 h-7 font-bold text-gray-800 text-[12px]">
              <td
                className="text-right px-2 border border-gray-300"
                colSpan={4}
              >
                Total
              </td>
              <td className="text-right px-1 border border-gray-300">
                {items
                  ?.reduce((sum, i) => sum + (parseFloat(i.qty) || 0), 0)
                  .toFixed(3)}
              </td>
              {isCumInvoice && (
                <>
                  <td className="text-right px-1 border border-gray-300"></td>
                  <td className="text-right px-1 border border-gray-300 text-black">
                    {items
                      ?.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
                      .toFixed(2)}
                  </td>
                  <td className="border border-gray-300"></td>
                </>
              )}
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
              className="text-black text-[12px] text-left rounded px-1"
              onClick={() => {
                deleteRow(contextMenu.rowId);
                deleteSelectedRows();
                handleCloseContextMenu();
              }}
            >
              Delete
            </button>
            <button
              className="text-black text-[12px] text-left rounded px-1"
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
    </>
  );
};

export default SalesDeliveryItems;

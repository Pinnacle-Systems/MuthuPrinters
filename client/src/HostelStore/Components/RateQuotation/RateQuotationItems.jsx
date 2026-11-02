import React, { useRef, useState } from "react";
import { FxSelectWithAdd } from "../../../Inputs";
import {
  useGetStyleItemMasterQuery,
  useLazyGetStyleItemMasterByIdQuery,
} from "../../../redux/services/StyleItemMasterService";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices";
import { findFromList, getCommonParams } from "../../../Utils/helper";
import { StyleItemMaster } from "..";
import { TransactionGrid } from "../../../Basic/components/Reuseable";
import { Plus } from "lucide-react";
import Swal from "sweetalert2";

const EMPTY_ROW = {
  itemGroupId: "",
  itemSubGroupId: "",
  styleItemId: "",
  hsnId: "",
  price: "",
  taxPercent: "",
};

const GRID_COLUMNS = [
  {
    key: "serial",
    label: "S.No",
    className: "w-12 px-4 py-1 text-center font-medium text-[11px]",
  },
  {
    key: "styleItemId",
    label: (
      <>
        Description of Goods<span className="text-red-500">*</span>
      </>
    ),
    className: "w-80 px-2 py-1 text-center font-medium text-[11px]",
  },
  {
    key: "itemSubGroupId",
    label: "Item Sub Group",
    className: "w-44 px-2 py-1 text-center font-medium text-[11px]",
  },
  {
    key: "itemGroupId",
    label: "Item Group",
    className: "w-44 px-2 py-1 text-center font-medium text-[11px]",
  },
  {
    key: "hsnId",
    label: "HSN",
    className: "w-20 px-4 py-1 text-center font-medium text-[11px]",
  },
  {
    key: "price",
    label: (
      <>
        Price<span className="text-red-500">*</span>
      </>
    ),
    className: "w-24 px-1 py-1 text-center font-medium text-[11px]",
  },
  {
    key: "taxPercent",
    label: "Tax %",
    className: "w-20 px-1 py-1 text-center font-medium text-[11px]",
  },
  {
    key: "addNew",
    label: "",
    className: "w-10 px-1 py-1 text-center font-medium text-[11px]",
  },
];

const RateQuotationItems = ({
  rateQuotationItems = [],
  setRateQuotationItems,
  readOnly,
  id,
  termsRef,
  itemGroupList,
  itemSubGroupList,
}) => {
  const styleItemRefs = useRef({});
  const gridWrapperRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const { companyId } = getCommonParams();
  const { data: styleItemList } = useGetStyleItemMasterQuery({
    params: { companyId },
  });
  const { data: hsnList } = useGetHsnMasterQuery({ params: { companyId } });
  const [triggerGetStyleItem] = useLazyGetStyleItemMasterByIdQuery();

  const [contextMenu, setContextMenu] = useState(null);

  const addRow = () => {
    setRateQuotationItems([
      ...rateQuotationItems,
      { ...EMPTY_ROW, rowId: Math.random().toString(36).substring(2, 9) },
    ]);
  };

  const deleteRow = (index) => {
    const filtered = rateQuotationItems.filter((_, i) => i !== index);
    if (filtered.length < 4) {
      const padding = Array.from({ length: 4 - filtered.length }, () => ({
        ...EMPTY_ROW,
        rowId: Math.random().toString(36).substring(2, 9),
      }));
      setRateQuotationItems([...filtered, ...padding]);
    } else {
      setRateQuotationItems(filtered);
    }
  };

  const handleDeleteAllRows = () => {
    setRateQuotationItems(
      Array.from({ length: 4 }, () => ({
        ...EMPTY_ROW,
        rowId: Math.random().toString(36).substring(2, 9),
      })),
    );
  };

  const handleInputChange = async (value, index, field) => {
    const newItems = [...rateQuotationItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    if (field === "styleItemId") {
      if (value) {
        // Prevent duplicate selection
        const isDuplicate = rateQuotationItems.some(
          (item, idx) =>
            idx !== index &&
            item.styleItemId &&
            String(item.styleItemId) === String(value),
        );
        if (isDuplicate) {
          Swal.fire({
            icon: "warning",
            title: "Duplicate Item",
            text: "This item is already selected.",
            confirmButtonColor: "#3085d6",
          });
          return;
        }

        // Fast sync pre-fill from cached styleItemList
        const selected = styleItemList?.data?.find(
          (s) => s.id === Number(value) || s.id === value,
        );

        if (selected) {
          newItems[index].itemGroupId = selected.itemGroupId || "";
          newItems[index].itemSubGroupId = selected.itemSubGroupId || "";
          newItems[index].hsnId = selected.hsnId || "";
          const hsnObj = hsnList?.data?.find((h) => h.id === selected.hsnId);
          if (hsnObj?.tax !== undefined && hsnObj?.tax !== null) {
            newItems[index].taxPercent = hsnObj.tax;
          }
        }

        // Fetch full styleItem details
        try {
          const response = await triggerGetStyleItem(value).unwrap();
          const styleItemData = response?.data;
          if (styleItemData) {
            newItems[index].itemGroupId =
              styleItemData.itemGroupId || newItems[index].itemGroupId || "";
            newItems[index].itemSubGroupId =
              styleItemData.itemSubGroupId ||
              newItems[index].itemSubGroupId ||
              "";
            newItems[index].hsnId =
              styleItemData.hsnId || newItems[index].hsnId || "";
            const hsnObj = hsnList?.data?.find(
              (h) => h.id === styleItemData.hsnId,
            );
            if (hsnObj?.tax !== undefined && hsnObj?.tax !== null) {
              newItems[index].taxPercent = hsnObj.tax;
            }
          }
        } catch (e) {
          console.error("StyleItem fetch failed", e);
        }
      } else {
        newItems[index].itemGroupId = "";
        newItems[index].itemSubGroupId = "";
        newItems[index].hsnId = "";
        newItems[index].taxPercent = "";
      }
    } else if (field === "itemGroupId") {
      if (
        newItems[index].itemSubGroupId &&
        !itemSubGroupList?.data?.some(
          (sub) =>
            sub.id === newItems[index].itemSubGroupId &&
            sub.itemGroupId === value,
        )
      ) {
        newItems[index].itemSubGroupId = "";
      }
    }

    setRateQuotationItems(newItems);
  };

  const handleRightClick = (event, rowIndex) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      rowId: rowIndex,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const footer = (
    <tr className="bg-gray-50 h-6 font-medium text-gray-800 text-[12px]">
      <td
        className="text-right px-4 border border-gray-300 font-medium"
        colSpan={5}
      >
        Total Items: {rateQuotationItems.filter((i) => i.styleItemId).length}
      </td>
      <td className="text-right border border-gray-300 px-1 font-medium">
        {rateQuotationItems
          .reduce((sum, item) => sum + (Number(item.price) || 0), 0)
          .toFixed(2)}
      </td>
      <td className="border border-gray-300" colSpan={2} />
    </tr>
  );

  return (
    <>
      <div ref={gridWrapperRef} className="h-full">
        <TransactionGrid
          title=""
          columns={GRID_COLUMNS}
          rows={rateQuotationItems.map((row, index) => ({
            row,
            originalIndex: index,
          }))}
          footer={footer}
          getRowKey={(item) => item.row.rowId || item.originalIndex}
          getRowClassName={(_, index) =>
            `${
              index % 2 === 0 ? "bg-white" : "bg-gray-100"
            } border border-blue-gray-200 cursor-pointer h-6`
          }
          onRowContextMenu={(item, index, event) => {
            if (!readOnly) {
              handleRightClick(event, item.originalIndex);
            }
          }}
          renderRow={(item, index) => {
            const row = item.row;
            const rowIndex = item.originalIndex;

            return (
              <>
                <td
                  data-grid-row={index}
                  data-grid-col={0}
                  className="w-12 border border-gray-300 text-[11px] text-center h-6 py-0"
                  onContextMenu={(event) => {
                    if (!readOnly) {
                      handleRightClick(event, rowIndex);
                    }
                  }}
                >
                  {index + 1}
                </td>
                <td
                  data-grid-row={index}
                  data-grid-col={1}
                  data-grid-editable="true"
                  className="grid-editable-cell border border-gray-300 text-[11px] text-left h-6 py-0"
                >
                  <FxSelectWithAdd
                    value={row.styleItemId}
                    onChange={(val) =>
                      handleInputChange(val, rowIndex, "styleItemId")
                    }
                    options={(styleItemList?.data || [])
                      .filter((i) => (id ? true : i.active))
                      .map((i) => ({
                        label: i.name,
                        value: i.id,
                        isDisabled: rateQuotationItems.some(
                          (it, idx) =>
                            idx !== rowIndex &&
                            it.styleItemId &&
                            String(it.styleItemId) === String(i.id),
                        ),
                      }))}
                    readOnly={readOnly}
                    placeholder=""
                    addNew={true}
                    childComponent={StyleItemMaster}
                    addNewModalWidth="w-[50%] h-[57%]"
                    ref={(el) => (styleItemRefs.current[rowIndex] = el)}
                    nextRef={termsRef}
                  />
                </td>
                <td
                  data-grid-row={index}
                  data-grid-col={2}
                  className="border border-gray-300 px-2 text-[11px] text-black h-6 py-0 leading-tight"
                >
                  <span className="block truncate">
                    {findFromList(
                      row.itemSubGroupId,
                      itemSubGroupList?.data,
                      "name",
                    ) || ""}
                  </span>
                </td>
                <td
                  data-grid-row={index}
                  data-grid-col={3}
                  className="border border-gray-300 px-2 text-[11px] text-black h-6 py-0 leading-tight"
                >
                  <span className="block truncate">
                    {findFromList(
                      row.itemGroupId,
                      itemGroupList?.data,
                      "name",
                    ) || ""}
                  </span>
                </td>
                <td
                  data-grid-row={index}
                  data-grid-col={4}
                  className="border border-gray-300 px-2 text-[11px] text-black h-6 py-0 leading-tight"
                >
                  <span className="block truncate">
                    {findFromList(row.hsnId, hsnList?.data, "name") || ""}
                  </span>
                </td>
                <td
                  data-grid-row={index}
                  data-grid-col={5}
                  data-grid-editable="true"
                  className="grid-editable-cell border-blue-gray-200 text-[11px] border border-gray-300 text-right h-6 py-0"
                >
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="w-full h-full bg-transparent px-1 text-right border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 !border-0 !outline-none !shadow-none disabled:bg-transparent text-[11px] leading-tight"
                    style={{ border: "none", outline: "none", boxShadow: "none" }}
                    onFocus={(event) => {
                      event.target.select();
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
                      handleInputChange(e.target.value, rowIndex, "price")
                    }
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputChange(
                        value ? Number(value).toFixed(2) : "",
                        rowIndex,
                        "price",
                      );
                      setFocusedField(null);
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        rowIndex === rateQuotationItems.length - 1
                      ) {
                        addRow();
                      }
                    }}
                    disabled={readOnly}
                  />
                </td>
                <td
                  data-grid-row={index}
                  data-grid-col={6}
                  className="border border-gray-300 px-2 text-[11px] text-right text-black h-6 py-0 leading-tight"
                >
                  <span className="block truncate">
                    {row.taxPercent !== "" &&
                    row.taxPercent !== undefined &&
                    row.taxPercent !== null
                      ? `${row.taxPercent}%`
                      : ""}
                  </span>
                </td>
                <td
                  data-grid-row={index}
                  data-grid-col={7}
                  className="w-10 border border-gray-300 text-center bg-gray-50 h-6 py-0"
                >
                  {!readOnly && (
                    <div className="flex items-center justify-center h-full">
                      <button
                        type="button"
                        onClick={addRow}
                        className="p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded inline-flex items-center justify-center transition-colors"
                        title="Add row"
                        tabIndex={-1}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </>
            );
          }}
        />
      </div>

      {contextMenu ? (
        <>
          <div
            className="fixed inset-0 z-[999]"
            onClick={handleCloseContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCloseContextMenu();
            }}
          />
          <div
            style={{
              position: "fixed",
              top: `${Math.min(contextMenu.mouseY, window.innerHeight - 100)}px`,
              left: `${Math.min(contextMenu.mouseX, window.innerWidth - 120)}px`,
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)",
              padding: "4px",
              borderRadius: "4px",
              zIndex: 1000,
            }}
            className="bg-white border border-gray-300 min-w-[100px]"
          >
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="text-black hover:bg-gray-100 text-[12px] text-left rounded px-2 py-1 transition-colors"
                onClick={() => {
                  addRow();
                  handleCloseContextMenu();
                }}
              >
                Add Row
              </button>
              <button
                type="button"
                className="text-black hover:bg-gray-100 text-[12px] text-left rounded px-2 py-1 transition-colors"
                onClick={() => {
                  deleteRow(contextMenu.rowId);
                  handleCloseContextMenu();
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className="text-black hover:bg-gray-100 text-[12px] text-left rounded px-2 py-1 transition-colors"
                onClick={() => {
                  handleDeleteAllRows();
                  handleCloseContextMenu();
                }}
              >
                Delete All
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default RateQuotationItems;

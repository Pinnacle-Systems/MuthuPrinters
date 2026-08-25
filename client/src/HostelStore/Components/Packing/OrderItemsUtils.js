export const DEFAULT_ROW_COUNT = 10;

export const EMPTY_SIZE_ROW = () => ({ sizeId: null, qty: "", rowId: Math.random().toString(36).substring(2, 9) });

export const EMPTY_STYLE_ROW = () => ({ styleId: null, sizeBreakup: [EMPTY_SIZE_ROW()], rowId: Math.random().toString(36).substring(2, 9) });

export const makeEmptyRow = () => ({
  styleItemId: "",
  uomId: "",
  hsnId: "",
  orderQty: "",
  itemGroupId: "",
  type: "",
  styleBreakup: [EMPTY_STYLE_ROW()], // 1 style row by default
  trackingType: "None",
  price: "",
  amount: "",
  dozen: "",
  rowId: Math.random().toString(36).substring(2, 9),
});

// Call this in parent wherever you build orderItems before setOrderItems
export const padRows = (items = [], total = DEFAULT_ROW_COUNT) => {
  const result = items.map((row) => ({
    ...row,
    rowId: row.rowId || Math.random().toString(36).substring(2, 9),
    styleBreakup:
      Array.isArray(row.styleBreakup) && row.styleBreakup.length > 0
        ? row.styleBreakup.map(style => ({
            ...style, 
            rowId: style.rowId || Math.random().toString(36).substring(2, 9),
            sizeBreakup: Array.isArray(style.sizeBreakup) && style.sizeBreakup.length > 0 
              ? style.sizeBreakup.map(size => ({...size, rowId: size.rowId || Math.random().toString(36).substring(2, 9)}))
              : [EMPTY_SIZE_ROW()]
          }))
        : [EMPTY_STYLE_ROW()],
  }));
  while (result.length < total) result.push(makeEmptyRow());
  return result;
};

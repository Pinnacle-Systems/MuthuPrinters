// components/Reuseable/TransactionLayout.jsx
import { useRef, useState, useEffect, useCallback } from "react";

// ── Hook: exported so forms can use it standalone if needed ──────────────
export function useAdaptiveLayout(headerRef, footerRef, containerRef, gap = 8) {
    const [itemsHeight, setItemsHeight] = useState(200);

    const recalculate = useCallback(() => {
        const headerH = headerRef.current?.offsetHeight ?? 0;
        const footerH = footerRef.current?.offsetHeight ?? 0;
        const containerH = containerRef.current?.offsetHeight ?? window.innerHeight;
        const remaining = containerH - headerH - footerH - gap;
        setItemsHeight(Math.max(remaining, 200));
    }, [headerRef, footerRef, containerRef, gap]);

    useEffect(() => {
        const t = setTimeout(recalculate, 200);
        window.addEventListener("resize", recalculate);
        const ro = new ResizeObserver(recalculate);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => {
            clearTimeout(t);
            window.removeEventListener("resize", recalculate);
            ro.disconnect();
        };
    }, [recalculate]);

    return itemsHeight;
}

// ── Component ────────────────────────────────────────────────────────────
// Props:
//   title       string          — e.g. "Purchase Order"
//   badge       JSX             — e.g. <ModeChip id={id} readOnly={readOnly} />
//   closeIcon   JSX             — e.g. <IoArrowBackCircleSharp className="w-7 h-7" />
//   onClose     function
//   onKeyDown   function        — for Ctrl+S etc.
//   header      JSX             — the 4-col (or N-col) cards grid
//   gridItems   JSX             — the items table / PoItems / InwardItems
//   footer      JSX             — terms + remarks + totals + buttons
// ────────────────────────────────────────────────────────────────────────
const TransactionLayout = ({
    title,
    badge,
    closeIcon,
    onClose,
    onKeyDown,
    header,
    gridItems,
    footer,
}) => {
    const containerRef = useRef(null);
    const headerRef = useRef(null);
    const footerRef = useRef(null);
    const itemsHeight = useAdaptiveLayout(headerRef, footerRef, containerRef);

    return (
        <div
            ref={containerRef}
            className="flex flex-col w-full overflow-hidden"
            style={{ height: "100%" }}
            onKeyDown={onKeyDown}
        >

            {/* ── HEADER: title bar + cards grid ─────────────────────── */}
            <div ref={headerRef} className="flex-none">

                {/* Title bar — identical to old UI */}
                <div className="w-full mx-auto rounded-md shadow-lg px-2 py-1">
                    <div className="flex justify-between items-center">
                        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            {title}
                            {badge}
                        </h1>
                        <button
                            onClick={onClose}
                            className="text-indigo-600 hover:text-indigo-700"
                            title="Back to Report"
                        >
                            {closeIcon}
                        </button>
                    </div>
                </div>

                {/* Cards grid — caller passes their own grid JSX */}
                <div className="pt-2">
                    {header}
                </div>

            </div>

            {/* ── ITEMS: adaptive height, scrolls internally ──────────── */}
            <div
                className="flex-none py-2"
                style={{ height: itemsHeight, minHeight: 200 }}
            >
                <fieldset className="h-full overflow-y-auto">
                    {gridItems}
                </fieldset>
            </div>

            {/* ── FOOTER: terms + totals + buttons ────────────────────── */}
            <div ref={footerRef} className="flex-none">
                {footer}
            </div>

        </div>
    );
};

export default TransactionLayout;
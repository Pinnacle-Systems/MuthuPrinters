// components/Reuseable/TransactionLayout.jsx
import { useRef, useState, useEffect, useCallback } from "react";

// ── Hook: exported so forms can use it standalone if needed ──────────────
export function useAdaptiveLayout(headerRef, footerRef, containerRef, gap = 8) {
    const [itemsHeight, setItemsHeight] = useState(200);
    const [containerHeight, setContainerHeight] = useState(null);

    const recalculateContainerHeight = useCallback(() => {
        const top = containerRef.current?.getBoundingClientRect?.().top ?? 0;
        const viewportHeight = window.innerHeight;
        const availableHeight = Math.max(viewportHeight - top - gap, 320);
        setContainerHeight(availableHeight);
    }, [containerRef, gap]);

    const recalculate = useCallback(() => {
        const headerH = headerRef.current?.offsetHeight ?? 0;
        const footerH = footerRef.current?.offsetHeight ?? 0;
        const containerH =
            containerRef.current?.offsetHeight ?? containerHeight ?? window.innerHeight;
        const remaining = containerH - headerH - footerH - gap;
        setItemsHeight(Math.max(remaining, 200));
    }, [headerRef, footerRef, containerRef, gap, containerHeight]);

    useEffect(() => {
        const t = setTimeout(() => {
            recalculateContainerHeight();
            recalculate();
        }, 200);
        const handleResize = () => {
            recalculateContainerHeight();
            recalculate();
        };
        window.addEventListener("resize", handleResize);
        const ro = new ResizeObserver(() => {
            recalculateContainerHeight();
            recalculate();
        });
        if (containerRef.current) ro.observe(containerRef.current);
        return () => {
            clearTimeout(t);
            window.removeEventListener("resize", handleResize);
            ro.disconnect();
        };
    }, [recalculate, recalculateContainerHeight]);

    return { itemsHeight, containerHeight };
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
export const TransactionScreen = ({
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
    const { itemsHeight, containerHeight } = useAdaptiveLayout(
        headerRef,
        footerRef,
        containerRef,
    );

    return (
        <div
            ref={containerRef}
            className="flex flex-col w-full overflow-hidden min-h-0"
            style={{ height: containerHeight ? `${containerHeight}px` : "100%" }}
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
                className="flex-none py-2 min-h-0 overflow-hidden"
                style={{ height: itemsHeight, minHeight: 200 }}
            >
                <fieldset className="h-full min-h-0 overflow-hidden">
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

const TransactionLayout = TransactionScreen;

export default TransactionLayout;

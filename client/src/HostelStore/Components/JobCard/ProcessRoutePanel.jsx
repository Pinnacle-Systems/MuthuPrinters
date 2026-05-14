import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────
// Key helpers
// ─────────────────────────────────────────────────────────────
const makeKey = (type, id, sub = "") => `${type}:${id}${sub ? `:${sub}` : ""}`;

const parseKey = (key) => {
    const [type, id, sub] = key.split(":");
    return { type, id: Number(id), sub: sub || "" };
};

// ─────────────────────────────────────────────────────────────
// Build desired keys from current form selections
// ─────────────────────────────────────────────────────────────
const buildDesiredKeys = (
    boardItems = [],
    boardList,
    boardId = "",
    selectedPrinting,
    printingList,
    selectedProcesses,
    defaultList,
    laminations,
    laminationList,
    varnishes,
    varnishList,
    selectedFinishing,
    finishingList
) => {
    const keys = [];

    // ── Board qualities (multi-select) ──
    boardList.forEach((p) => {
        if (boardItems.includes(p.id)) {
            keys.push(makeKey("boardQuality", p.id));
        }
    });

    if (boardId) {
        keys.push(makeKey("board", boardId));
    }

    printingList.forEach((p) => {
        if (selectedPrinting.includes(p.id))
            keys.push(makeKey("printing", p.id));
    });

    defaultList.forEach((p) => {
        if (selectedProcesses.includes(p.id))
            keys.push(makeKey("process", p.id));
    });


    laminationList.forEach((p) => {
        const e = laminations.find((l) => l.processId === p.id);
        if (!e) return;
        const sub = e.isFrontAndBack ? "frontback" : e.isFront ? "front" : "";
        keys.push(makeKey("lamination", p.id, sub));
    });

    varnishList.forEach((p) => {
        const e = varnishes.find((v) => v.processId === p.id);
        if (!e) return;
        const sub = e.isFrontAndBack ? "frontback" : e.isFront ? "front" : "";
        keys.push(makeKey("varnish", p.id, sub));
    });

    finishingList.forEach((p) => {
        if (selectedFinishing.includes(p.id))
            keys.push(makeKey("finishing", p.id));
    });


    return keys;
};

// ─────────────────────────────────────────────────────────────
// Resolve display label
// ─────────────────────────────────────────────────────────────
const resolveLabel = (key, defaultList, laminationList, varnishList, boardList = [], printingList = [], finishingList = []) => {
    const { type, id, sub } = parseKey(key);
    const find = (list) => list.find((p) => p.id === id)?.name || `#${id}`;

    let name = "";
    if (type === "boardQuality") name = find(boardList);
    else if (type === "board") name = find(boardList);
    else if (type === "printing") name = find(printingList);
    else if (type === "process") name = find(defaultList);
    else if (type === "lamination") name = find(laminationList);
    else if (type === "varnish") name = find(varnishList);
    else if (type === "finishing") name = find(finishingList);
    if (sub === "front") return `${name} (Front)`;
    if (sub === "frontback") return `${name} (F & B)`;
    return name;
};

// ─────────────────────────────────────────────────────────────
// Type badge
// ─────────────────────────────────────────────────────────────
const typeTag = (key) => {
    const { type } = parseKey(key);
    if (type === "boardQuality") return { label: "BRD", cls: "text-rose-600   bg-rose-50   border-rose-200" };
    if (type === "board") return { label: "BRD", cls: "text-rose-600   bg-rose-50   border-rose-200" };
    if (type === "printing") return { label: "PRN", cls: "text-indigo-600 bg-indigo-50 border-indigo-200" };
    if (type === "lamination") return { label: "LAM", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (type === "varnish") return { label: "VAR", cls: "text-amber-600  bg-amber-50  border-amber-200" };
    if (type === "finishing") return { label: "FIN", cls: "text-indigo-600 bg-indigo-50 border-indigo-200" };
    return { label: "PRC", cls: "text-indigo-600 bg-indigo-50 border-indigo-200" };
};

// ─────────────────────────────────────────────────────────────
// ProcessRoutePanel
// ─────────────────────────────────────────────────────────────
export const ProcessRoutePanel = ({
    boardItems = [],
    boardList = [],
    boardId = "",
    selectedPrinting = [],
    printingList = [],
    selectedProcesses = [],
    defaultList = [],
    laminations = [],
    laminationList = [],
    varnishes = [],
    varnishList = [],
    processRoute = [],
    selectedFinishing = [],
    finishingList = [],
    setProcessRoute,
    readOnly = false,
}) => {

    // ── Auto-sync: mirror form state into route ──────────────────
    useEffect(() => {
        const desired = buildDesiredKeys(
            boardItems, boardList, boardId,
            selectedPrinting, printingList,
            selectedProcesses, defaultList,
            laminations, laminationList,
            varnishes, varnishList,
            selectedFinishing, finishingList
        );
        setProcessRoute((prev) => {
            const kept = prev.filter((k) => desired.includes(k));
            const added = desired.filter((k) => !prev.includes(k));
            return [...kept, ...added];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProcesses, laminations, varnishes, boardId, boardItems, selectedPrinting, selectedFinishing]);

    const removeFromRoute = (idx) => {
        if (readOnly) return;
        setProcessRoute((prev) => prev.filter((_, i) => i !== idx));
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">

            {/* ── Header ──────────────────────────────────────────── */}
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                    Process Route
                </h3>
                <span className="text-[9px] text-slate-400">
                    {processRoute.length > 0
                        ? `${processRoute.length} step${processRoute.length > 1 ? "s" : ""}`
                        : "No steps"}
                </span>
            </div>

            {/* ── Body ────────────────────────────────────────────── */}
            <div className="p-2 h-12">
                {processRoute.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-0.5">
                        Select printing, processes, laminations or varnishes to build the route.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="flex items-center min-w-max py-0.5 gap-0">
                            {processRoute.map((key, idx) => {
                                const tag = typeTag(key);
                                const label = resolveLabel(key, defaultList, laminationList, varnishList, boardList, printingList, finishingList);
                                const isLast = idx === processRoute.length - 1;

                                return (
                                    <div key={key} className="flex items-center">

                                        {/* ── Node ───────────────────────────────── */}
                                        <div className="relative group flex items-center gap-1.5 h-6 pl-2 pr-6 rounded border border-slate-400 bg-white hover:border-slate-500 transition-colors">

                                            {/* Seq number */}
                                            <span className="text-[10px] font-semibold text-slate-700 leading-none w-3 text-center shrink-0">
                                                {idx + 1}
                                            </span>

                                            {/* Divider */}
                                            <span className="w-px h-3 bg-slate-200 shrink-0" />

                                            {/* Type badge */}
                                            {/* <span className={`text-[8px] font-bold px-1 py-0.5 rounded border leading-none shrink-0 ${tag.cls}`}>
                                                {tag.label}
                                            </span> */}

                                            {/* Process name */}
                                            <span className="text-[10px] font-medium text-slate-700 whitespace-nowrap leading-none">
                                                {label}
                                            </span>

                                            {/* Remove ✕ */}
                                            {/* {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromRoute(idx)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                                                    title="Remove from route"
                                                >
                                                    ✕
                                                </button>
                                            )} */}
                                        </div>

                                        {/* Connector */}
                                        {!isLast && (
                                            <span className="mx-1 text-slate-700 text-[12px] shrink-0 select-none leading-none font-medium">
                                                +
                                            </span>
                                        )}

                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// DB serializer
// Converts route key array → shape ready for Prisma createMany
// Includes isFront + isFrontAndBack derived from the key sub
// ─────────────────────────────────────────────────────────────
export const routeKeysToDb = (processRoute) =>
    processRoute
        .map((key, idx) => {
            const { type, id, sub } = parseKey(key);
            return {
                type,
                processId: id,
                sequence: idx + 1,
                isFront: sub === "front",
                isFrontAndBack: sub === "frontback",
            };
        });
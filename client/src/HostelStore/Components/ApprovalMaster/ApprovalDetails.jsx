import { Plus, Trash2 } from "lucide-react";
import { MultiSelectDropdown } from "../../../Inputs";
import { useEffect } from "react";

const PLUS = <Plus size={14} />;
const DELETE = <Trash2 size={14} />;

export default function ApprovalDetails({
    approvalLevelItems,
    setApprovalLevelItems,
    userList,
    readOnly,
}) {
    // ── Handlers ──────────────────────────────────────────
    const addRow = () => {
        setApprovalLevelItems((prev) => [
            ...prev,
            {
                levelNo: prev.length + 1,
                approveType: "OR",
                users: [],   // [{ label: "ADMIN", value: 10 }, ...]
            },
        ]);
    };

    const removeRow = (index) => {
        setApprovalLevelItems((prev) =>
            prev
                .filter((_, i) => i !== index)
                .map((row, i) => ({ ...row, levelNo: i + 1 }))
        );
    };


    const updateRow = (index, field, value) => {
        setApprovalLevelItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const userOptions = userList?.map((u) => ({
        label: u.username,
        value: u.id,
    })) || [];


    const handleInputChange = (event, index, field) => {
        const value = event.target.value;
        const newBlend = structuredClone(approvalLevelItems);
        newBlend[index][field] = value;
        setApprovalLevelItems(newBlend);
    };

    useEffect(() => {
        if (!approvalLevelItems || approvalLevelItems.length === 0) {
            const defaultRows = Array.from({ length: 4 }, (_, i) => ({
                levelNo: i + 1,
                approveType: "OR",
                users: [],
                conditionField: "",
                conditionOperator: ">",
                conditionValue: "",
            }));

            setApprovalLevelItems(defaultRows);
        }
    }, []);

    return (
        <>
            <div className="w-full overflow-y-auto">
                <table className="border-collapse border border-slate-300 text-xs table-auto w-full rounded-sm shadow-sm bg-white">

                    {/* ── HEAD ─────────────────────────────── */}
                    <thead className="bg-slate-100 text-slate-700 top-0">
                        <tr>
                            <th className="border border-slate-300 w-10 py-1.5 font-semibold text-center">
                                Level
                            </th>
                            <th className="border border-slate-300 w-28 py-1.5 font-semibold text-center">
                                Approve Type
                                <div className="text-[9px] font-normal text-slate-400">AND / OR</div>
                            </th>
                            <th className="border border-slate-300 font-semibold text-center">
                                Users
                                <div className="text-[9px] font-normal text-slate-400">
                                    Multi Select
                                </div>
                            </th>
                            <th className="border border-slate-300 py-1.5 font-semibold text-center">
                                Rules
                            </th>
                            <th
                                className={`border border-slate-300 ${readOnly ? "hidden" : "w-10"}`}
                            >
                                {!readOnly && (
                                    <div
                                        onClick={addRow}
                                        className="hover:cursor-pointer mx-auto w-6 h-6 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm shadow-sm transition-colors"
                                        title="Add Row"
                                    >
                                        {PLUS}
                                    </div>
                                )}
                            </th>
                        </tr>
                    </thead>

                    {/* ── BODY ─────────────────────────────── */}
                    <tbody>
                        {approvalLevelItems.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`border-t border-slate-200 align-middle ${rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                                    }`}
                            >
                                {/* Level No */}
                                <td className="border border-slate-300 text-center py-2 align-middle">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-indigo-700 font-bold text-xs">
                                        {row.levelNo}
                                    </span>
                                </td>

                                {/* ── Approve Type AND / OR ───────── */}
                                <td className="border border-slate-300 align-middle">
                                    <div className="flex flex-col items-center gap-1">
                                        {/* Toggle */}
                                        <div className="flex rounded overflow-hidden border border-slate-300">
                                            <button
                                                type="button"
                                                disabled={readOnly}
                                                onClick={() => updateRow(rowIndex, "approveType", "OR")}
                                                className={`px-2 py-1 text-[10px] font-medium transition ${row.approveType === "OR"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-white text-slate-500 hover:bg-slate-100"
                                                    }`}
                                            >
                                                OR
                                            </button>
                                            <button
                                                type="button"
                                                disabled={readOnly}
                                                onClick={() => updateRow(rowIndex, "approveType", "AND")}
                                                className={`px-2 py-1 text-[10px] font-medium transition ${row.approveType === "AND"
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-white text-slate-500 hover:bg-slate-100"
                                                    }`}
                                            >
                                                AND
                                            </button>
                                        </div>
                                        {/* Description */}
                                        <span className="text-[9px] text-slate-400 text-center leading-tight">
                                            {row.approveType === "AND"
                                                ? "All users must approve"
                                                : "Any one user enough"}
                                        </span>
                                    </div>
                                </td>

                                {/* ── Users Multi Select ──────────── */}
                                <td className="border border-slate-300 w-60 ">
                                    <MultiSelectDropdown
                                        name=""
                                        selected={row.users}
                                        setSelected={(val) => updateRow(rowIndex, "users", val)}
                                        options={userOptions}
                                        readOnly={readOnly}
                                        disabled={readOnly}
                                    />
                                </td>

                                {/* ── Conditions ──────────────────── */}
                                <td className="border border-slate-300 p-0 px-0.5">
                                    <input
                                        type="text"
                                        className="w-full h-10 border border-slate-300 text-center rounded-sm 
      focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
      disabled:bg-slate-100 transition-all font-medium text-slate-700 bg-white"
                                        value={row.condition}
                                        disabled={readOnly}
                                        onChange={(event) => handleInputChange(event, rowIndex, "condition")}
                                    />
                                </td>

                                {/* ── Delete Row ──────────────────── */}
                                <td className={`border border-slate-300 text-center align-middle ${readOnly ? "hidden" : ""}`}>
                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={() => removeRow(rowIndex)}
                                            className="mx-auto flex items-center justify-center w-6 h-6 bg-red-50 hover:bg-red-100 text-red-600 rounded-sm"
                                            title="Remove Level"
                                        >
                                            {DELETE}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { Bell } from "lucide-react";
import { getCommonParams, params } from "../../../Utils/helper";
import { push } from "../../../redux/features/opentabs";
import useOutsideClick from "../../../CustomHooks/handleOutsideClick";
import { useGetPendingApprovalQuery } from "../../../redux/uniformService/ApprovalMasterServices";
import { VIEW } from "../../../icons";

const PAGE_ROUTE_MAP = {
    "PURCHASE ORDER": "PURCHASE ORDER",
};

const Notification = () => {
    const { userId } = getCommonParams();
    const dispatch = useDispatch();

    const { data, isLoading } = useGetPendingApprovalQuery({
        params: {
            userId
        }
    });
    const pending = data?.data ?? [];

    const [open, setOpen] = useState(false);

    const ref = useRef();
    useOutsideClick(() => setOpen(false), ref);

    function openRecord(log) {
        const tabName =
            PAGE_ROUTE_MAP[log.referencePage] ?? log.referencePage;

        dispatch(push({ name: tabName, previewId: log.referenceId }));
        setOpen(false);
    }

    return (
        <div className="relative" ref={ref}>
            {/* 🔔 Bell Icon */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-1.5 rounded-full hover:bg-gray-100 transition"
            >
                <Bell size={20} />

                {/* 🔴 Badge */}
                {pending.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-2 rounded-full">
                        {pending.length}
                    </span>
                )}
            </button>

            {/* 📦 Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-[420px] bg-white shadow-xl rounded-xl border z-50 overflow-hidden animate-fadeIn">

                    {/* Header */}
                    <div className="px-4 py-3 border-b font-semibold text-gray-700 flex justify-between">
                        <span>Notifications</span>
                        <span className="text-xs text-gray-400">
                            {pending.length} pending
                        </span>
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-auto text-xs">
                        {isLoading ? (
                            <div className="p-4 text-gray-400 text-center">
                                Loading...
                            </div>
                        ) : pending.length === 0 ? (
                            <div className="p-4 text-gray-400 text-center">
                                No pending approvals
                            </div>
                        ) : (
                            <table className="w-full text-left text-gray-600">
                                <thead className="text-gray-500 uppercase text-[11px] bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2">Type</th>
                                        <th className="px-3 py-2">Doc ID</th>
                                        <th className=" py-2">Level</th>
                                        <th className="px-3 py-2">By</th>
                                        <th className=" py-2">View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.map((log) => {
                                        const totalLevels =
                                            log.ApprovalConfig?.approvalLevels?.length ?? "?";
                                        const since = new Date(
                                            log.createdAt
                                        ).toLocaleDateString();

                                        return (
                                            <tr
                                                key={log.id}
                                                className="border-b hover:bg-gray-50 transition"
                                            >
                                                <td className="px-3 py-3 font-medium text-gray-700">
                                                    {log.status === "PENDING" ? "APPROVAL REQUEST" : log.status}
                                                </td>
                                                <td className="px-3 py-3 text-blue-500 hover:underline" onClick={() => openRecord(log)}>
                                                    # {log.referenceDocId}
                                                </td>
                                                <td className="px-2 py-3">
                                                    <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded-full font-medium">
                                                        {log.currentLevel} / {totalLevels}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-blue-600">
                                                    {log.RaisedBy?.username}
                                                </td>
                                                <td className="px-2 py-3 ">
                                                    <button
                                                        onClick={() => openRecord(log)}
                                                        className="text-blue-500 hover:underline font-medium"
                                                    >
                                                        {VIEW}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notification;
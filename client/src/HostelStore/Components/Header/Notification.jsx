import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { Bell } from "lucide-react";
import { getCommonParams } from "../../../Utils/helper";
import { push } from "../../../redux/features/opentabs";
import useOutsideClick from "../../../CustomHooks/handleOutsideClick";
import { useGetPendingApprovalQuery } from "../../../redux/uniformService/ApprovalMasterServices";
import { TICK_ICON, VIEW } from "../../../icons";
import { useGetUserByIdQuery } from "../../../redux/services/UsersMasterService";

// Status display config — add new statuses here if needed
const STATUS_DISPLAY = {
  APPROVED: { label: "✅ Approved", self: true },
  REJECTED: { label: "↩️ Rejected", self: true },
  PENDING: { label: "⏳ Awaiting Approval", self: true },
  _DEFAULT: { label: "🔔 Approval Request", self: false },
};

function getStatusLabel(log, userId) {
  const isSelf = log.raisedById === parseInt(userId);
  if (isSelf) {
    return STATUS_DISPLAY[log.status]?.label ?? STATUS_DISPLAY.PENDING.label;
  }
  return STATUS_DISPLAY._DEFAULT.label;
}

const Notification = () => {
  const { userId } = getCommonParams();
  const dispatch = useDispatch();

  const { data, isLoading } = useGetPendingApprovalQuery({
    params: { userId },
  });
  const pending = data?.data ?? [];

  const [open, setOpen] = useState(false);
  const ref = useRef();
  useOutsideClick(() => setOpen(false), ref);

  function openRecord(log) {
    // referencePage is the module name which matches the tab name directly
    // No hardcoded map needed — works for any module added in ApprovalRuleModule master
    dispatch(push({ name: log.referencePage, previewId: log.referenceId }));
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-full hover:bg-gray-100 transition"
      >
        <Bell size={20} />
        {pending.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-2 rounded-full">
            {pending.length > 99 ? "99+" : pending.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[440px] bg-white shadow-xl rounded-xl border z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b font-semibold text-gray-700 flex justify-between items-center">
            <span>Notifications</span>
            <span className="text-xs text-gray-400">
              {pending.length} pending
            </span>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-auto text-xs">
            {isLoading ? (
              <div className="p-4 text-gray-400 text-center">Loading...</div>
            ) : pending.length === 0 ? (
              <div className="p-4 text-gray-400 text-center">
                No pending approvals
              </div>
            ) : (
              <table className="w-full text-left text-gray-600">
                <thead className="text-gray-500 uppercase text-[10px] bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Module</th>
                    <th className="px-3 py-2">Doc ID</th>
                    <th className="px-2 py-2">Level</th>
                    <th className="px-3 py-2">By</th>
                    <th className="px-2 py-2">View</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((log) => {
                    const totalLevels =
                      log.ApprovalConfig?.approvalLevels?.length ?? "?";

                    return (
                      <tr
                        key={log.id}
                        className="border-b hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => openRecord(log)}
                      >
                        {/* Status */}
                        <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">
                          {getStatusLabel(log, userId)}
                        </td>

                        {/* Module — dynamic, comes from DB */}
                        <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                          {log.referencePage}
                        </td>

                        {/* Doc ID */}
                        <td className="px-3 py-2.5 text-blue-500 font-medium whitespace-nowrap">
                          #{log.referenceDocId ?? log.referenceId}
                        </td>

                        {/* Level */}
                        <td className="px-2 py-2.5 whitespace-nowrap">
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                            {log.currentLevel}/{totalLevels}
                          </span>
                        </td>

                        {/* Raised By */}
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {log.RaisedBy?.username ?? "—"}
                        </td>

                        {/* View */}
                        <td
                          className="px-2 py-2.5"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent double dispatch from tr onClick
                            openRecord(log);
                          }}
                        >
                          <button className="text-blue-500 hover:text-blue-700 transition">
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

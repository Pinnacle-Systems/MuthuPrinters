import { useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { Bell } from "lucide-react";
import { getCommonParams } from "../../../Utils/helper";
import { push } from "../../../redux/features/opentabs";
import useOutsideClick from "../../../CustomHooks/handleOutsideClick";
import {
  useGetPendingApprovallQuery,
  useMarkNotificationAsReadMutation, // ✅ NEW
} from "../../../redux/uniformService/ApprovalMasterServices";
import { TICK_ICON, VIEW } from "../../../icons";

const STATUS_DISPLAY = {
  APPROVED: { label: "✅ Approved", isSelfResult: true },
  REJECTED: { label: "↩️ Sent Back", isSelfResult: true },
  SUPERSEDED: { label: "🔄 Re-approval Needed", isSelfResult: true },
  PENDING: { label: "⏳ Awaiting Approval", isSelfResult: false },
  _DEFAULT: { label: "🔔 Approval Request", isSelfResult: false },
};

function getStatusConfig(log, userId) {
  const isSelf = log.raisedById === parseInt(userId);
  if (isSelf && STATUS_DISPLAY[log.status]?.isSelfResult) {
    return { ...STATUS_DISPLAY[log.status], isResult: true };
  }
  if (!isSelf && log.status === "PENDING") {
    return { ...STATUS_DISPLAY._DEFAULT, isResult: false };
  }
  return { ...STATUS_DISPLAY.PENDING, isResult: false };
}

const Notification = () => {
  const { userId } = getCommonParams();
  const dispatch = useDispatch();

  const { data, isLoading } = useGetPendingApprovallQuery(
    { params: { userId } },
    { pollingInterval: 30000, skip: !userId }, // ✅ Poll every 30s
  );
  const pending = data?.data ?? [];

  // ✅ NEW — split into action-required and result notifications
  const actionRequired = pending.filter((log) => {
    const config = getStatusConfig(log, userId);
    return !config.isResult;
  });
  const resultNotifications = pending.filter((log) => {
    const config = getStatusConfig(log, userId);
    return config.isResult;
  });

  const totalCount = pending.length;

  const [open, setOpen] = useState(false);
  const ref = useRef();
  useOutsideClick(() => setOpen(false), ref);

  // ✅ NEW
  const [markAsRead, { isLoading: isMarkingRead }] =
    useMarkNotificationAsReadMutation();

  function openRecord(log) {
    dispatch(push({ name: log.referencePage, previewId: log.referenceId }));
    setOpen(false);
  }

  // ✅ NEW — mark single notification as read
  async function handleMarkRead(e, logId) {
    e.stopPropagation(); // don't trigger row click
    try {
      await markAsRead({ id: logId, userId }).unwrap();
      // RTK invalidates "ApprovalNotification" tag → list auto-refetches
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  // ✅ NEW — mark all result notifications as read at once
  async function handleMarkAllRead(e) {
    e.stopPropagation();
    try {
      await Promise.all(
        resultNotifications.map((n) =>
          markAsRead({ id: n.id, userId }).unwrap(),
        ),
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* ── Bell Icon ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-full hover:bg-gray-100 transition"
      >
        <Bell size={20} />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-2 rounded-full">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 mt-2 w-[480px] bg-white shadow-xl rounded-xl border z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b font-semibold text-gray-700 flex justify-between items-center">
            <span>Notifications</span>
            <div className="flex items-center gap-3">
              {resultNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                  ✓ Mark all as read
                </button>
              )}
              <span className="text-xs text-gray-400">
                {totalCount} notification{totalCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[460px] overflow-auto text-xs">
            {isLoading ? (
              <div className="p-4 text-gray-400 text-center">Loading...</div>
            ) : pending.length === 0 ? (
              <div className="p-6 text-gray-400 text-center">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                No notifications
              </div>
            ) : (
              <>
                {/* ── Section 1: Action Required ──────────────────── */}
                {actionRequired.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 bg-orange-50 border-b border-orange-100 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                      Action Required — {actionRequired.length}
                    </div>
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
                        {actionRequired.map((log) => {
                          const config = getStatusConfig(log, userId);
                          const totalLevels =
                            log.ApprovalConfig?.approvalLevels?.length ?? "?";
                          return (
                            <tr
                              key={log.id}
                              className="border-b hover:bg-gray-50 transition cursor-pointer"
                              onClick={() => openRecord(log)}
                            >
                              <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">
                                {config.label}
                              </td>
                              <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                                {log.referencePage}
                              </td>
                              <td className="px-3 py-2.5 text-blue-500 font-medium whitespace-nowrap">
                                #{log.referenceDocId ?? log.referenceId}
                              </td>
                              <td className="px-2 py-2.5 whitespace-nowrap">
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                  {log.currentLevel}/{totalLevels}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                                {log.RaisedBy?.username ?? "—"}
                              </td>
                              <td
                                className="px-2 py-2.5"
                                onClick={(e) => {
                                  e.stopPropagation();
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
                  </>
                )}

                {/* ── Section 2: Results (your raised POs) ────────── */}
                {resultNotifications.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 bg-blue-50 border-b border-t border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Your Requests — {resultNotifications.length}
                    </div>
                    <table className="w-full text-left text-gray-600">
                      <thead className="text-gray-500 uppercase text-[10px] bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Module</th>
                          <th className="px-3 py-2">Doc ID</th>
                          <th className="px-2 py-2">Level</th>
                          <th className="px-2 py-2">View</th>
                          {/* ✅ NEW column */}
                          <th className="px-2 py-2">Readed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultNotifications.map((log) => {
                          const config = getStatusConfig(log, userId);
                          const totalLevels =
                            log.ApprovalConfig?.approvalLevels?.length ?? "?";
                          return (
                            <tr
                              key={log.id}
                              className="border-b hover:bg-gray-50 transition cursor-pointer"
                              onClick={() => openRecord(log)}
                            >
                              <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">
                                {config.label}
                              </td>
                              <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                                {log.referencePage}
                              </td>
                              <td className="px-3 py-2.5 text-blue-500 font-medium whitespace-nowrap">
                                #{log.referenceDocId ?? log.referenceId}
                              </td>
                              <td className="px-2 py-2.5 whitespace-nowrap">
                                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                  {log.currentLevel}/{totalLevels}
                                </span>
                              </td>
                              <td
                                className="px-2 py-2.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRecord(log);
                                }}
                              >
                                <button className="text-blue-500 hover:text-blue-700 transition">
                                  {VIEW}
                                </button>
                              </td>

                              {/* ✅ NEW — Tick to mark as read */}
                              <td
                                className="px-2 py-2.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => handleMarkRead(e, log.id)}
                                  disabled={isMarkingRead}
                                  title="Mark as read — removes this notification"
                                  className="p-1 rounded-full hover:bg-green-100 text-gray-400 hover:text-green-600 transition disabled:opacity-40"
                                >
                                  {TICK_ICON}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notification;

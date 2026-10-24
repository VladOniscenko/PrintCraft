import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  X,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import { useI18n } from "../../i18n/I18nContext";
import { useNotify } from "../../context/NotifyContext";
import {
  getAdminSupportTickets,
  updateAdminSupportTicketStatus,
} from "../../services/api";
import type { SupportTicket, SupportTicketStatus, SupportTicketCategory } from "../../types";

export default function AdminSupportTickets() {
  const { t, localizePath } = useI18n();
  const { notifyError, notifySuccess } = useNotify();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "status">("createdAt");
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [search, setSearch] = useState("");

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newStatus, setNewStatus] = useState<SupportTicketStatus>("Open");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await getAdminSupportTickets({
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy,
        sortDesc,
      });
      setTickets(data);
    } catch {
      notifyError(t("admin.supportTickets.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
  }, [statusFilter, sortBy, sortDesc]);

  const handleOpenDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
  };

  const handleCloseDetail = () => {
    setSelectedTicket(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateAdminSupportTicketStatus(selectedTicket.id, newStatus);
      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
      notifySuccess(t("admin.supportTickets.statusUpdated", { status: newStatus }));
    } catch {
      notifyError(t("admin.supportTickets.statusUpdateFailed"));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        t.userEmail.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.orderId && t.orderId.toLowerCase().includes(q)),
    );
  }, [tickets, search]);

  const getStatusBadge = (status: SupportTicketStatus) => {
    switch (status) {
      case "Open":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <AlertCircle size={12} />
            {t("admin.supportTickets.statusOpen")}
          </span>
        );
      case "InProgress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
            <Clock size={12} />
            {t("admin.supportTickets.statusInProgress")}
          </span>
        );
      case "Resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 size={12} />
            {t("admin.supportTickets.statusResolved")}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: SupportTicketCategory) => {
    switch (category) {
      case "OrderIssue":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
            {t("common.support.categoryOrderIssue")}
          </span>
        );
      case "Bug":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40">
            {t("common.support.categoryBug")}
          </span>
        );
      case "Payment":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">
            {t("common.support.categoryPayment")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 border border-gray-200 dark:border-white/10">
            {t("common.support.categoryGeneral")}
          </span>
        );
    }
  };

  return (
    <AdminLayout wide>
      <AdminBreadcrumb
        title={t("admin.supportTickets.title")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("admin.nav.supportTickets") },
        ]}
        rightSlot={
          <p className="text-sm text-[#5f736d] dark:text-gray-400">
            {t("admin.supportTickets.totalTickets")}: {filteredTickets.length}
          </p>
        }
      />

      {/* Filter and Control Bar */}
      <div className="admin-panel p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t("admin.supportTickets.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="admin-field pl-9 w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-select text-xs"
              >
                <option value="all">{t("admin.supportTickets.filterAll")}</option>
                <option value="Open">{t("admin.supportTickets.statusOpen")}</option>
                <option value="InProgress">{t("admin.supportTickets.statusInProgress")}</option>
                <option value="Resolved">{t("admin.supportTickets.statusResolved")}</option>
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "createdAt" | "status")}
                className="admin-select text-xs"
              >
                <option value="createdAt">{t("admin.supportTickets.sortByDate")}</option>
                <option value="status">{t("admin.supportTickets.sortByStatus")}</option>
              </select>

              <button
                type="button"
                onClick={() => setSortDesc((prev) => !prev)}
                className="admin-btn admin-btn-secondary text-xs px-2.5 py-1.5 cursor-pointer"
              >
                {sortDesc
                  ? t("admin.supportTickets.sortDesc")
                  : t("admin.supportTickets.sortAsc")}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void fetchTickets()}
            disabled={loading}
            className="admin-btn admin-btn-secondary inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>{t("admin.supportTickets.refresh")}</span>
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.supportTickets.tableId")}</th>
              <th>{t("admin.supportTickets.tableDate")}</th>
              <th>{t("admin.supportTickets.tableEmail")}</th>
              <th>{t("admin.supportTickets.tableCategory")}</th>
              <th>{t("admin.supportTickets.tableSubject")}</th>
              <th>{t("admin.supportTickets.tableStatus")}</th>
              <th className="text-right">{t("admin.supportTickets.tableActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => handleOpenDetail(ticket)}
                className="hover:bg-teal-50/40 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <td>
                  <span className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-400">
                    #{ticket.id.slice(0, 8).toUpperCase()}
                  </span>
                </td>
                <td className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(ticket.createdAt).toLocaleDateString()}{" "}
                  {new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="text-xs font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                  {ticket.userEmail}
                </td>
                <td>{getCategoryBadge(ticket.category)}</td>
                <td className="text-xs text-gray-700 dark:text-gray-300 max-w-[260px] truncate">
                  {ticket.subject}
                </td>
                <td>{getStatusBadge(ticket.status)}</td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(ticket);
                    }}
                    className="admin-btn admin-btn-secondary text-xs py-1 px-3 cursor-pointer"
                  >
                    {t("admin.supportTickets.viewDetails")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTickets.length === 0 && !loading && (
          <div className="py-12 text-center">
            <p className="admin-empty font-medium">{t("admin.supportTickets.noTickets")}</p>
            <p className="text-xs text-gray-400 mt-1">
              {t("admin.supportTickets.noTicketsDesc")}
            </p>
          </div>
        )}
      </div>

      {/* Ticket Details & Management Modal */}
      {selectedTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isUpdatingStatus) {
              handleCloseDetail();
            }
          }}
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0e1512] rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 my-8 text-gray-900 dark:text-gray-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-800 dark:text-teal-400">
                    #{selectedTicket.id.slice(0, 8).toUpperCase()}
                  </span>
                  {getCategoryBadge(selectedTicket.category)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3
                  id="ticket-detail-title"
                  className="text-lg font-bold text-gray-900 dark:text-white mt-1"
                >
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                disabled={isUpdatingStatus}
                aria-label={t("common.closeDialog")}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Ticket Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs border-b border-gray-100 dark:border-white/10">
              <div>
                <span className="text-gray-400 block mb-0.5">
                  {t("admin.supportTickets.userEmail")}
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200 select-all">
                  {selectedTicket.userEmail}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">
                  {t("admin.supportTickets.submittedDate")}
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">
                  {t("admin.supportTickets.userAccount")}
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {selectedTicket.userId ? (
                    <Link
                      to={localizePath(`/admin/users/${selectedTicket.userId}`)}
                      className="text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{selectedTicket.userId.slice(0, 8)}...</span>
                      <ExternalLink size={11} />
                    </Link>
                  ) : (
                    t("admin.supportTickets.guestUser")
                  )}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-0.5">
                  {t("admin.supportTickets.orderReference")}
                </span>
                {selectedTicket.orderId ? (
                  <Link
                    to={localizePath(`/admin/orders/${selectedTicket.orderId}`)}
                    className="text-teal-700 dark:text-teal-400 hover:underline font-mono inline-flex items-center gap-1"
                  >
                    <span>{selectedTicket.orderId.slice(0, 8).toUpperCase()}...</span>
                    <ExternalLink size={11} />
                  </Link>
                ) : (
                  <span className="text-gray-400">
                    {t("admin.supportTickets.noOrderLinked")}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="py-4 border-b border-gray-100 dark:border-white/10">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                {t("admin.supportTickets.description")}
              </span>
              <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-4 text-xs sm:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed select-text">
                {selectedTicket.description}
              </div>
            </div>

            {/* Attachments */}
            {selectedTicket.attachmentUrls && selectedTicket.attachmentUrls.length > 0 && (
              <div className="py-4 border-b border-gray-100 dark:border-white/10">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                  {t("admin.supportTickets.attachments")} ({selectedTicket.attachmentUrls.length})
                </span>
                <ul className="space-y-2">
                  {selectedTicket.attachmentUrls.map((url, idx) => {
                    const fileName = url.split("/").pop() || `Attachment ${idx + 1}`;
                    return (
                      <li
                        key={`${url}-${idx}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={15} className="text-teal-700 dark:text-teal-400 shrink-0" />
                          <span className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate">
                            {fileName}
                          </span>
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 transition-colors cursor-pointer text-xs font-medium"
                        >
                          <Download size={13} />
                          <span>{t("admin.supportTickets.downloadAttachment")}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Status Update Actions */}
            <div className="pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <label
                  htmlFor="change-ticket-status"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  {t("admin.supportTickets.changeStatus")}:
                </label>
                <select
                  id="change-ticket-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SupportTicketStatus)}
                  className="admin-select text-xs"
                >
                  <option value="Open">{t("admin.supportTickets.statusOpen")}</option>
                  <option value="InProgress">{t("admin.supportTickets.statusInProgress")}</option>
                  <option value="Resolved">{t("admin.supportTickets.statusResolved")}</option>
                </select>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={isUpdatingStatus || newStatus === selectedTicket.status}
                  className="admin-btn admin-btn-primary text-xs py-1.5 px-3.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStatus
                    ? t("admin.supportTickets.updating")
                    : t("admin.supportTickets.saveStatus")}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                disabled={isUpdatingStatus}
                className="admin-btn admin-btn-secondary text-xs cursor-pointer"
              >
                {t("common.closeDialog")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import type { Order } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  formatOrderStatusLabel,
  getOrderStatusPillClass,
  getOrderStatusTranslationKey,
} from "../../utils/orderStatus";

const STATUS_OPTIONS = [
  { value: "All", label: "admin.orders.statusAll" },
  ...ADMIN_ORDER_STATUS_OPTIONS,
];
const SORT_FIELDS = ["createdAt", "status", "quotedPrice"];

export default function AdminOrders() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(16);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          search,
          status: statusFilter,
          sortBy,
          sortDir,
          page: String(page),
          pageSize: String(pageSize),
        });
        const res = await api.get(`/admin/orders?${query.toString()}`);
        setOrders(res.data.results);
        setTotalCount(res.data.totalCount);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [search, statusFilter, sortBy, sortDir, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={t("admin.orders.managementTitle")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("breadcrumb.orders") },
        ]}
      />

      <div className="admin-panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 p-4">
        <input
          className="admin-field"
          placeholder={t("admin.orders.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => {
            const statusKey = getOrderStatusTranslationKey(s.value);
            const label = s.label.startsWith("admin.")
              ? t(s.label)
              : statusKey
                ? t(statusKey)
                : s.label;
            return (
              <option key={s.value} value={s.value}>
                {label}
              </option>
            );
          })}
        </select>
        <select
          className="admin-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_FIELDS.map((field) => (
            <option key={field} value={field}>
              {t(`admin.orders.sort.${field}`)}
            </option>
          ))}
        </select>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="admin-btn admin-btn-secondary"
        >
          {t("admin.orders.sortLabel")}: {sortDir.toUpperCase()}
        </button>
      </div>

      {loading ? (
        <p className="admin-note">{t("admin.orders.loading")}</p>
      ) : orders.length === 0 ? (
        <p className="admin-note">{t("admin.orders.noMatches")}</p>
      ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.orders.columnProject")}</th>
                <th>{t("admin.orders.columnCustomer")}</th>
                <th>{t("admin.orders.columnStatus")}</th>
                <th>{t("admin.orders.columnQuoted")}</th>
                <th>{t("admin.orders.columnCreated")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusKey = getOrderStatusTranslationKey(order.status);
                return (
                  <tr key={order.id}>
                    <td>
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-semibold text-[#0f766e] hover:underline"
                      >
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td>{order.fullName}</td>
                    <td>
                      <span className={getOrderStatusPillClass(order.status)}>
                        {statusKey ? t(statusKey) : formatOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      {order.quotedPrice
                        ? `€${order.quotedPrice.toFixed(2)}`
                        : t("admin.orders.notAvailable")}
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-[#60736d]">
          {t("admin.common.page")} {page} {t("admin.common.of")} {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="admin-btn admin-btn-secondary"
          >
            {t("admin.common.prev")}
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="admin-btn admin-btn-secondary"
          >
            {t("admin.common.next")}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

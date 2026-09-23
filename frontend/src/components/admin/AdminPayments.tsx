import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import { useI18n } from "../../i18n/I18nContext";
import { useNotify } from "../../context/NotifyContext";

type AdminPaymentRecord = {
  id: string;
  orderId: string;
  provider: string;
  reference: string;
  providerPaymentId?: string;
  currency: string;
  amount: number;
  status: string;
  method?: string;
  failureReason?: string;
  paidAt?: string;
  canceledAt?: string;
  expiredAt?: string;
  failedAt?: string;
  lastWebhookAt?: string;
  webhookAttemptCount?: number;
  createdAt: string;
  updatedAt?: string;
  order?: {
    id: string;
    status: string;
    userId?: string;
    fullName?: string;
    orderType?: string;
  } | null;
};

type PaymentsResponse = {
  results: AdminPaymentRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
};

const STATUS_OPTIONS = [
  "all",
  "paid",
  "failed",
  "expired",
  "canceled",
  "pending",
  "open",
];

export default function AdminPayments() {
  const { t } = useI18n();
  const { notifyError, notifySuccess } = useNotify();
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("bank_transfer");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });

        if (provider.trim()) query.set("provider", provider.trim());
        if (status !== "all") query.set("status", status);
        if (search.trim()) {
          query.set("reference", search.trim());
          query.set("providerPaymentId", search.trim());
        }
        if (fromDate) query.set("fromUtc", `${fromDate}T00:00:00.000Z`);
        if (toDate) query.set("toUtc", `${toDate}T23:59:59.999Z`);

        const res = await api.get<PaymentsResponse>(
          `/admin/payments?${query.toString()}`,
        );
        setPayments(res.data.results || []);
        setTotalCount(res.data.totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch admin payments", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [page, pageSize, provider, status, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleReconcilePending = async () => {
    setIsReconciling(true);
    try {
      const res = await api.post<{ started: boolean; message: string }>(
        "/admin/payments/reconcile-pending",
      );

      if (res.data?.started) {
        notifySuccess(
          res.data?.message || t("admin.payments.reconcileSuccess"),
        );
      } else {
        notifyError(
          res.data?.message || t("admin.payments.reconcileAlreadyRunning"),
        );
      }

      setPage(1);
      const query = new URLSearchParams({
        page: String(1),
        pageSize: String(pageSize),
      });

      if (provider.trim()) query.set("provider", provider.trim());
      if (status !== "all") query.set("status", status);
      if (search.trim()) {
        query.set("reference", search.trim());
        query.set("providerPaymentId", search.trim());
      }
      if (fromDate) query.set("fromUtc", `${fromDate}T00:00:00.000Z`);
      if (toDate) query.set("toUtc", `${toDate}T23:59:59.999Z`);

      const refreshed = await api.get<PaymentsResponse>(
        `/admin/payments?${query.toString()}`,
      );
      setPayments(refreshed.data.results || []);
      setTotalCount(refreshed.data.totalCount || 0);
    } catch (err: any) {
      notifyError(
        err?.response?.data?.message || t("admin.payments.reconcileFailed"),
      );
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={t("admin.payments.title")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("admin.nav.payments") },
        ]}
      />

      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={handleReconcilePending}
          disabled={isReconciling}
          className="admin-btn admin-btn-secondary"
        >
          {isReconciling ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              {t("admin.payments.reconciling")}
            </span>
          ) : (
            t("admin.payments.reconcileNow")
          )}
        </button>
      </div>

      <div className="admin-panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 p-4">
        <input
          className="admin-field lg:col-span-2"
          placeholder={t("admin.payments.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <select
          className="admin-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`admin.payments.status.${option}`)}
            </option>
          ))}
        </select>

        <input
          className="admin-field"
          placeholder={t("admin.payments.providerPlaceholder")}
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value);
            setPage(1);
          }}
        />

        <div className="grid grid-cols-2 gap-2 lg:col-span-5">
          <input
            type="date"
            className="admin-field"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="date"
            className="admin-field"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <p className="admin-note">{t("admin.payments.loading")}</p>
      ) : payments.length === 0 ? (
        <p className="admin-note">{t("admin.payments.noMatches")}</p>
      ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.payments.columnCreated")}</th>
                <th>{t("admin.payments.columnOrder")}</th>
                <th>{t("admin.payments.columnReference")}</th>
                <th>{t("admin.payments.columnProviderPaymentId")}</th>
                <th>{t("admin.payments.columnStatus")}</th>
                <th>{t("admin.payments.columnAmount")}</th>
                <th>{t("admin.payments.columnWebhookAttempts")}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{new Date(payment.createdAt).toLocaleString()}</td>
                  <td>
                    <Link
                      to={`/admin/orders/${payment.orderId}`}
                      className="font-semibold text-[#0f766e] hover:underline"
                    >
                      {payment.orderId.slice(0, 8)}
                    </Link>
                    {payment.order?.fullName && (
                      <p className="text-xs text-[#60736d]">
                        {payment.order.fullName}
                      </p>
                    )}
                  </td>
                  <td className="font-mono text-xs">{payment.reference}</td>
                  <td className="font-mono text-xs">
                    {payment.providerPaymentId || "-"}
                  </td>
                  <td>{payment.status}</td>
                  <td>
                    {payment.currency} {Number(payment.amount || 0).toFixed(2)}
                  </td>
                  <td>{payment.webhookAttemptCount || 0}</td>
                </tr>
              ))}
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

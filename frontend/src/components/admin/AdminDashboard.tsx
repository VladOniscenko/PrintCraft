import { useEffect, useState } from "react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import type { Filament, Order } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { formatCurrencyAmount } from "../../utils/currency";

interface Summary {
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
}

interface OrdersResponse {
  results: Order[];
  totalCount: number;
}

interface VisitBucket {
  label: string;
  views: number;
  uniqueVisitors: number;
}

interface CountryStat {
  countryCode: string;
  views: number;
  uniqueVisitors: number;
}

interface CityStat {
  countryCode: string;
  city: string;
  views: number;
  uniqueVisitors: number;
}

interface VisitAnalytics {
  generatedAtUtc: string;
  liveVisitorsNow: number;
  viewsByDay: VisitBucket[];
  viewsByMonth: VisitBucket[];
  viewsByYear: VisitBucket[];
  topCountries: CountryStat[];
  topCities: CityStat[];
}

type DashboardData = {
  summary: Summary;
  orders: Order[];
  usersCount: number;
  filaments: Filament[];
  analytics: VisitAnalytics;
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="admin-kpi-card">
      <h2 className="admin-kpi-label">{label}</h2>
      <p className="admin-kpi-value">{value}</p>
      {hint ? <p className="admin-kpi-hint">{hint}</p> : null}
    </div>
  );
}

function MetricGroup({
  title,
  rows,
  compact,
}: {
  title: string;
  rows: Array<{ label: string; value: string | number; hint?: string }>;
  compact?: boolean;
}) {
  return (
    <div
      className={`admin-metric-group ${compact ? "admin-metric-group-compact" : ""}`}
    >
      <h3 className="admin-metric-group-title">{title}</h3>
      <div className="admin-metric-group-rows">
        {rows.map((row) => (
          <div key={row.label} className="admin-metric-row">
            <div>
              <p className="admin-metric-label">{row.label}</p>
              {!compact && row.hint ? (
                <p className="admin-metric-hint">{row.hint}</p>
              ) : null}
            </div>
            <p className="admin-metric-value">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, ordersRes, usersRes, filamentsRes, analyticsRes] =
          await Promise.all([
            api.get<Summary>("/admin/summary"),
            api.get<OrdersResponse>(
              "/admin/orders?page=1&pageSize=5000&sortBy=createdAt&sortDir=desc",
            ),
            api.get<{ totalCount: number }>("/admin/users?page=1&pageSize=1"),
            api.get<Filament[]>("/filaments"),
            api.get<VisitAnalytics>("/admin/analytics/visits"),
          ]);

        setData({
          summary: summaryRes.data,
          orders: ordersRes.data.results || [],
          usersCount: usersRes.data.totalCount || 0,
          filaments: Array.isArray(filamentsRes.data) ? filamentsRes.data : [],
          analytics: analyticsRes.data,
        });
      } catch (err) {
        console.error(err);
        setError(t("admin.dashboard.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  if (loading) {
    return (
      <div className="admin-shell flex items-center justify-center">
        <div>{t("admin.loadingDashboard")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-shell flex items-center justify-center text-rose-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary, orders, usersCount, filaments, analytics } = data;

  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    const key = order.status || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const paidOrders = orders.filter(
    (order) => order.isPaid || order.status === "paid",
  ).length;
  const cancelledOrders = statusCounts.cancelled || 0;
  const quotedOrders = statusCounts.quoted || 0;
  const printingOrders = statusCounts.printing || 0;
  const sentOrders = statusCounts.sent || 0;
  const deliveredOrders = statusCounts.delivered || 0;
  const completedOrders = statusCounts.completed || 0;

  const getOrderRevenue = (order: Order) => {
    if (order.quotedPrice != null && order.quotedPrice > 0) return order.quotedPrice;
    if (order.finalTotalAmount != null && order.finalTotalAmount > 0) return order.finalTotalAmount;
    if (order.items && order.items.length > 0) {
      const itemsSubtotal = order.items.reduce((sum, item) => {
        const unit =
          item.unitPrice !== undefined && item.unitPrice > 0
            ? item.unitPrice
            : item.price || 0;
        const plate = item.plateCost ?? 2.0;
        return sum + unit * (item.count || 1) + plate;
      }, 0);
      if (itemsSubtotal > 0) {
        return Math.max(
          0,
          itemsSubtotal +
            (order.deliveryPrice || 0) +
            (order.serviceFeePrice || 0) -
            (order.orderDiscountAmount || 0),
        );
      }
    }
    return 0;
  };

  const quotedRevenue = orders.reduce(
    (sum, order) => sum + getOrderRevenue(order),
    0,
  );
  const paidRevenue = orders
    .filter((order) => order.isPaid || order.status === "paid")
    .reduce((sum, order) => sum + getOrderRevenue(order), 0);

  const ordersWithQuote = orders.filter(
    (order) => getOrderRevenue(order) > 0,
  );
  const averageQuotedValue =
    ordersWithQuote.length > 0 ? quotedRevenue / ordersWithQuote.length : 0;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const ordersToday = orders.filter(
    (order) => new Date(order.createdAt) >= dayAgo,
  ).length;
  const ordersThisWeek = orders.filter(
    (order) => new Date(order.createdAt) >= weekAgo,
  ).length;
  const ordersThisMonth = orders.filter(
    (order) => new Date(order.createdAt) >= monthAgo,
  ).length;

  const uniqueCustomers = new Set(orders.map((o) => o.userId).filter(Boolean))
    .size;
  const totalOrderItems = orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((inner, item) => inner + (item.count || 0), 0),
    0,
  );
  const avgItemsPerOrder =
    orders.length > 0 ? totalOrderItems / orders.length : 0;

  const lowStockFilaments = filaments.filter(
    (f) => (f.stockQuantity || 0) > 0 && (f.stockQuantity || 0) <= 100,
  ).length;
  const outOfStockFilaments = filaments.filter(
    (f) => (f.stockQuantity || 0) <= 0,
  ).length;
  const inStockFilaments = filaments.filter(
    (f) => (f.stockQuantity || 0) > 0,
  ).length;
  const uniqueMaterials = new Set(filaments.map((f) => f.material)).size;
  const averageFilamentPrice =
    filaments.length > 0
      ? filaments.reduce((sum, f) => sum + (f.pricePerGram || 0), 0) /
        filaments.length
      : 0;

  const dailyViews = analytics.viewsByDay.reduce(
    (sum, row) => sum + row.views,
    0,
  );
  const monthlyViews = analytics.viewsByMonth.reduce(
    (sum, row) => sum + row.views,
    0,
  );
  const yearlyViews = analytics.viewsByYear.reduce(
    (sum, row) => sum + row.views,
    0,
  );
  const uniqueCountries = analytics.topCountries.length;
  const topCountriesPreview = analytics.topCountries.slice(0, 3);
  const topCitiesPreview = analytics.topCities.slice(0, 3);

  const quickSnapshot = [
    {
      label: t("admin.dashboard.totalOrders"),
      value: summary.totalOrders,
      hint: t("admin.dashboard.hintAllTime"),
    },
    {
      label: t("admin.dashboard.pendingOrders"),
      value: summary.pendingOrders,
      hint: t("admin.dashboard.hintNeedsAction"),
    },
    {
      label: t("admin.dashboard.paidRevenue"),
      value: formatCurrencyAmount(paidRevenue),
      hint: t("admin.dashboard.hintRevenuePaidOrders"),
    },
    {
      label: t("admin.dashboard.liveVisitorsNow"),
      value: analytics.liveVisitorsNow,
      hint: t("admin.dashboard.hintLastFiveMinutes"),
    },
    {
      label: t("admin.dashboard.totalUsers"),
      value: usersCount || summary.totalUsers,
      hint: t("admin.dashboard.hintRegisteredAccounts"),
    },
    {
      label: t("admin.dashboard.uniqueCustomers"),
      value: uniqueCustomers,
      hint: t("admin.dashboard.hintCustomersWithOrders"),
    },
  ];

  const orderFlowRows = [
    {
      label: t("admin.dashboard.quotedOrders"),
      value: quotedOrders,
      hint: t("admin.dashboard.hintQuoteSent"),
    },
    {
      label: t("admin.dashboard.printingOrders"),
      value: printingOrders,
      hint: t("admin.dashboard.hintInProduction"),
    },
    {
      label: t("admin.dashboard.sentOrders"),
      value: sentOrders,
      hint: t("admin.dashboard.hintShipped"),
    },
    {
      label: t("admin.dashboard.deliveredOrders"),
      value: deliveredOrders,
      hint: t("admin.dashboard.hintReachedCustomer"),
    },
    {
      label: t("admin.dashboard.completedOrders"),
      value: completedOrders,
      hint: t("admin.dashboard.hintCompletedLifecycle"),
    },
    {
      label: t("admin.dashboard.cancelledOrders"),
      value: cancelledOrders,
      hint: t("admin.dashboard.hintCancelledByAdminUser"),
    },
  ];

  const salesRows = [
    {
      label: t("admin.dashboard.quotedRevenue"),
      value: formatCurrencyAmount(quotedRevenue),
      hint: t("admin.dashboard.hintSumQuotedPrices"),
    },
    {
      label: t("admin.dashboard.avgQuoteValue"),
      value: formatCurrencyAmount(averageQuotedValue),
      hint: t("admin.dashboard.hintAverageQuotedOrder"),
    },
    {
      label: t("admin.dashboard.totalItemQty"),
      value: totalOrderItems,
      hint: t("admin.dashboard.hintUnitsAcrossOrders"),
    },
    {
      label: t("admin.dashboard.avgItemsPerOrder"),
      value: avgItemsPerOrder.toFixed(2),
      hint: t("admin.dashboard.hintOperationalComplexity"),
    },
  ];

  const velocityRows = [
    {
      label: t("admin.dashboard.orders24h"),
      value: ordersToday,
      hint: t("admin.dashboard.hintLastDay"),
    },
    {
      label: t("admin.dashboard.orders7d"),
      value: ordersThisWeek,
      hint: t("admin.dashboard.hintLastWeek"),
    },
    {
      label: t("admin.dashboard.orders30d"),
      value: ordersThisMonth,
      hint: t("admin.dashboard.hintLastMonth"),
    },
    {
      label: t("admin.dashboard.paidOrders"),
      value: paidOrders,
      hint: t("admin.dashboard.hintConfirmedPayments"),
    },
  ];

  const inventoryRows = [
    {
      label: t("admin.dashboard.filamentSkus"),
      value: filaments.length,
      hint: t("admin.dashboard.hintMaterialColorEntries"),
    },
    {
      label: t("admin.dashboard.inStockFilaments"),
      value: inStockFilaments,
      hint: t("admin.dashboard.hintAvailableNow"),
    },
    {
      label: t("admin.dashboard.lowStockFilaments"),
      value: lowStockFilaments,
      hint: t("admin.dashboard.hintOneToHundred"),
    },
    {
      label: t("admin.dashboard.outOfStockFilaments"),
      value: outOfStockFilaments,
      hint: t("admin.dashboard.hintNeedsRestock"),
    },
    {
      label: t("admin.dashboard.materials"),
      value: uniqueMaterials,
      hint: t("admin.dashboard.hintDistinctFilamentMaterials"),
    },
    {
      label: t("admin.dashboard.avgFilamentPricePerGram"),
      value: formatCurrencyAmount(averageFilamentPrice, 4),
      hint: t("admin.dashboard.hintAcrossFilamentSkus"),
    },
  ];

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={t("admin.dashboard.title")}
        items={[{ label: t("breadcrumb.admin") }]}
      />

      <section className="admin-panel p-6 mb-6">
        <h2 className="text-xl font-semibold mb-1 text-[#16251f]">
          {t("admin.dashboard.title")}
        </h2>
        <p className="text-sm text-[#5f736d] mb-4">
          {t("admin.dashboard.overviewSubtitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickSnapshot.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              hint={card.hint}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <MetricGroup
          title={t("admin.dashboard.groupOrderFlow")}
          rows={orderFlowRows}
          compact
        />
        <MetricGroup
          title={t("admin.dashboard.groupSalesQuality")}
          rows={salesRows}
          compact
        />
        <MetricGroup
          title={t("admin.dashboard.groupOrderVelocity")}
          rows={velocityRows}
          compact
        />
        <MetricGroup
          title={t("admin.dashboard.groupInventorySnapshot")}
          rows={inventoryRows}
          compact
        />
      </section>

      <section className="admin-panel p-5 mb-6">
        <h2 className="text-lg font-semibold mb-1 text-[#16251f]">
          {t("admin.dashboard.trafficTitle")}
        </h2>
        <p className="text-xs text-[#5f736d] mb-3">
          {t("admin.dashboard.trafficSubtitle")}
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <div className="rounded-lg border border-[#dbe7e2] bg-[#f8fcfa] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[#6d837b]">
              {t("admin.dashboard.liveVisitorsNow")}
            </p>
            <p className="text-lg font-bold text-[#16251f]">
              {analytics.liveVisitorsNow}
            </p>
          </div>
          <div className="rounded-lg border border-[#dbe7e2] bg-[#f8fcfa] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[#6d837b]">
              {t("admin.dashboard.viewsLast14Days")}
            </p>
            <p className="text-lg font-bold text-[#16251f]">{dailyViews}</p>
          </div>
          <div className="rounded-lg border border-[#dbe7e2] bg-[#f8fcfa] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[#6d837b]">
              {t("admin.dashboard.viewsLast12Months")}
            </p>
            <p className="text-lg font-bold text-[#16251f]">{monthlyViews}</p>
          </div>
          <div className="rounded-lg border border-[#dbe7e2] bg-[#f8fcfa] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[#6d837b]">
              {t("admin.dashboard.viewsLast5Years")}
            </p>
            <p className="text-lg font-bold text-[#16251f]">{yearlyViews}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
          <div className="rounded-lg border border-[#dbe7e2] bg-[#f8fcfa] p-3">
            <h3 className="text-sm font-semibold text-[#1f312b] mb-1">
              {t("admin.dashboard.topCountries")}
            </h3>
            {topCountriesPreview.length === 0 ? (
              <p className="text-xs text-[#6d837b]">
                {t("admin.dashboard.noLocationData")}
              </p>
            ) : (
              <div className="space-y-1">
                {topCountriesPreview.map((row) => (
                  <div
                    key={row.countryCode}
                    className="flex items-center justify-between text-xs text-[#3b564e]"
                  >
                    <span>{row.countryCode}</span>
                    <span>{row.views}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border border-[#dbe7e2] bg-[#f8fcfa] p-3">
            <h3 className="text-sm font-semibold text-[#1f312b] mb-1">
              {t("admin.dashboard.topCities")}
            </h3>
            {topCitiesPreview.length === 0 ? (
              <p className="text-xs text-[#6d837b]">
                {t("admin.dashboard.noLocationData")}
              </p>
            ) : (
              <div className="space-y-1">
                {topCitiesPreview.map((row) => (
                  <div
                    key={`${row.countryCode}-${row.city}`}
                    className="flex items-center justify-between text-xs text-[#3b564e]"
                  >
                    <span className="truncate pr-2">
                      {row.city}, {row.countryCode}
                    </span>
                    <span>{row.views}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <details className="rounded-lg border border-[#dbe7e2] bg-[#fbfefd] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#1f312b]">
            {t("admin.dashboard.trafficDetailsToggle")}
          </summary>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mt-3">
            <div className="rounded-lg border border-[#dbe7e2] bg-[#f7fcf9] p-3">
              <h3 className="font-semibold text-[#1f312b] mb-2 text-sm">
                {t("admin.dashboard.dailyViews")}
              </h3>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {analytics.viewsByDay.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-xs text-[#395049]"
                  >
                    <span>{row.label}</span>
                    <span>
                      {row.views} / {row.uniqueVisitors}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#dbe7e2] bg-[#f7fcf9] p-3">
              <h3 className="font-semibold text-[#1f312b] mb-2 text-sm">
                {t("admin.dashboard.monthlyViews")}
              </h3>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {analytics.viewsByMonth.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-xs text-[#395049]"
                  >
                    <span>{row.label}</span>
                    <span>
                      {row.views} / {row.uniqueVisitors}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[#dbe7e2] bg-[#f7fcf9] p-3">
              <h3 className="font-semibold text-[#1f312b] mb-2 text-sm">
                {t("admin.dashboard.yearlyViews")}
              </h3>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {analytics.viewsByYear.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-xs text-[#395049]"
                  >
                    <span>{row.label}</span>
                    <span>
                      {row.views} / {row.uniqueVisitors}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>

        <p className="text-xs text-[#6e857d] mt-2">
          {t("admin.dashboard.locationsTracked")}: {uniqueCountries} •{" "}
          {new Date(analytics.generatedAtUtc).toLocaleString()}
        </p>
      </section>
    </AdminLayout>
  );
}

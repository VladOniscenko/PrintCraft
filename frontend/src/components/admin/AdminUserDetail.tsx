import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import { formatCurrencyAmount } from "../../utils/currency";
import { useNotify } from "../../context/NotifyContext";

type UserDetail = {
  user: { id: string; name: string; email: string; role: string };
  orders: Array<{
    id: string;
    status: string;
    orderType: string;
    paymentFlow: string;
    isPaid: boolean;
    quotedPrice?: number;
    finalTotalAmount?: number;
    createdAt: string;
    payments: Array<{
      reference: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
  }>;
  addresses: Array<{
    id: string;
    fullName: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    phoneNumber: string;
    isDefault: boolean;
  }>;
  payments: Array<{
    reference: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
};

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const { notifyError } = useNotify();
  const [data, setData] = useState<UserDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<UserDetail>(`/admin/users/${id}`)
      .then((response) => setData(response.data))
      .catch(() => notifyError("Could not load customer details."));
  }, [id, notifyError]);

  if (!data)
    return (
      <AdminLayout>
        <div className="admin-shell">Loading customer...</div>
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={data.user.name}
        items={[
          { label: "Admin", to: "/admin" },
          { label: "Users", to: "/admin/users" },
          { label: data.user.name },
        ]}
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <section className="admin-panel p-5">
          <p className="text-xs uppercase text-gray-500">Customer</p>
          <h2 className="mt-2 text-xl font-bold">{data.user.name}</h2>
          <p className="text-sm text-gray-600">{data.user.email}</p>
          <p className="mt-2 text-xs uppercase text-emerald-700">
            {data.user.role}
          </p>
        </section>
        <section className="admin-panel p-5">
          <p className="text-xs uppercase text-gray-500">Orders</p>
          <p className="mt-2 text-3xl font-bold">{data.orders.length}</p>
        </section>
        <section className="admin-panel p-5">
          <p className="text-xs uppercase text-gray-500">Payments</p>
          <p className="mt-2 text-3xl font-bold">{data.payments.length}</p>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <section className="admin-panel p-5 xl:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Orders</h2>
          <div className="space-y-3">
            {data.orders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="block rounded-xl border border-gray-200 p-4 hover:border-emerald-400"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>#{order.id.slice(0, 8)}</strong>
                  <span className="text-sm font-semibold text-emerald-700">
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()} ·{" "}
                  {order.isPaid ? "Paid" : "Unpaid"}
                </p>
                <p className="mt-2 font-semibold">
                  {formatCurrencyAmount(
                    order.finalTotalAmount ?? order.quotedPrice ?? 0,
                  )}
                </p>
              </Link>
            ))}
          </div>
        </section>
        <div className="space-y-5">
          <section className="admin-panel p-5">
            <h2 className="mb-4 text-lg font-bold">Addresses</h2>
            <div className="space-y-3">
              {data.addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-xl bg-gray-50 p-3 text-sm"
                >
                  <strong>{address.fullName}</strong>
                  {address.isDefault && (
                    <span className="ml-2 text-xs text-emerald-700">
                      Default
                    </span>
                  )}
                  <p>
                    {address.addressLine1}
                    <br />
                    {address.postalCode} {address.city}
                    <br />
                    {address.phoneNumber}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="admin-panel p-5">
            <h2 className="mb-4 text-lg font-bold">Payment history</h2>
            <div className="space-y-3">
              {data.payments.map((payment) => (
                <div
                  key={payment.reference}
                  className="border-b border-gray-100 pb-3 text-sm"
                >
                  <strong>{payment.reference}</strong>
                  <p>
                    {payment.status} · {payment.amount.toFixed(2)}{" "}
                    {payment.currency}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

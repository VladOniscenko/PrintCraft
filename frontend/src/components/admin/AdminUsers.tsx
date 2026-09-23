import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import type { User } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { useNotify } from "../../context/NotifyContext";

export default function AdminUsers() {
  const { t } = useI18n();
  const { notifyError, notifySuccess } = useNotify();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"customer" | "admin">("customer");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await api.get(`/admin/users?${query.toString()}`);
      setUsers(res.data.results);
      setTotalCount(res.data.totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, page, pageSize]);

  const startEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditRole("customer");
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        name: editName,
        email: editEmail,
        role: editRole,
      });
      fetchUsers();
      cancelEdit();
      notifySuccess(t("admin.users.userUpdated"));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.users.updateFailed"));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={t("admin.users.managementTitle")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("admin.nav.users") },
        ]}
        rightSlot={
          <p className="text-sm text-[#5f736d]">
            {t("admin.users.totalLabel")}: {totalCount}
          </p>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="admin-field w-full sm:w-auto"
          placeholder={t("admin.users.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setPage(1)}
          className="admin-btn admin-btn-primary"
        >
          {t("admin.users.refreshButton")}
        </button>
      </div>

      {editingUser && (
        <div className="admin-panel mb-4 p-4">
          <h3 className="font-bold mb-2 text-[#1d2d27]">
            {t("admin.users.editUserSection")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="admin-label">
              <span className="font-semibold">
                {t("admin.users.nameLabel")}
              </span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t("admin.users.namePlaceholder")}
                className="admin-field"
              />
            </label>
            <label className="admin-label">
              <span className="font-semibold">
                {t("admin.users.emailLabel")}
              </span>
              <input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder={t("admin.users.emailPlaceholder")}
                className="admin-field"
              />
            </label>
            <label className="admin-label">
              <span className="font-semibold">
                {t("admin.users.roleLabel")}
              </span>
              <select
                value={editRole}
                onChange={(e) =>
                  setEditRole(e.target.value as "customer" | "admin")
                }
                className="admin-select"
              >
                <option value="customer">
                  {t("admin.users.roleCustomer")}
                </option>
                <option value="admin">{t("admin.users.roleAdmin")}</option>
              </select>
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={saveEdit} className="admin-btn admin-btn-primary">
              {t("admin.users.saveButton")}
            </button>
            <button
              onClick={cancelEdit}
              className="admin-btn admin-btn-secondary"
            >
              {t("admin.order.cancelButton")}
            </button>
          </div>
        </div>
      )}

      <div className="admin-panel admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.users.columnName")}</th>
              <th>{t("admin.users.columnEmail")}</th>
              <th>{t("admin.users.columnRole")}</th>
              <th>{t("admin.users.columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="admin-btn admin-btn-secondary"
                    >
                      View details
                    </Link>
                    <button
                      onClick={() => startEdit(user)}
                      className="admin-btn admin-btn-secondary"
                    >
                      {t("admin.products.edit")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <p className="admin-empty">{t("admin.users.noUsers")}</p>
        )}
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-[#60736d]">
          {t("admin.common.page")} {page} {t("admin.common.of")} {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            className="admin-btn admin-btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("admin.common.prev")}
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("admin.common.next")}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type AdminBreadcrumbProps = {
  title: string;
  items: BreadcrumbItem[];
  rightSlot?: ReactNode;
};

const adminNavLinks = [
  { labelKey: "admin.nav.dashboard", to: "/admin" },
  { labelKey: "admin.nav.orders", to: "/admin/orders" },
  { labelKey: "admin.nav.payments", to: "/admin/payments" },
  { labelKey: "admin.nav.models", to: "/admin/models" },
  { labelKey: "admin.nav.users", to: "/admin/users" },
  { labelKey: "admin.nav.filaments", to: "/admin/filaments" },
  { labelKey: "admin.nav.heroSlides", to: "/admin/hero-slides" },
];

export default function AdminBreadcrumb({
  title,
  items,
  rightSlot,
}: AdminBreadcrumbProps) {
  const { pathname } = useLocation();
  const { t } = useI18n();

  const isActive = (to: string) => {
    if (to === "/admin") return pathname === "/admin";
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <nav className="text-xs uppercase tracking-[0.12em] text-[#5f736d]">
            <ol className="flex flex-wrap items-center gap-2">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                  <li
                    key={`${item.label}-${index}`}
                    className="flex items-center gap-2"
                  >
                    {item.to && !isLast ? (
                      <Link
                        to={item.to}
                        className="hover:text-teal-800 hover:underline"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={isLast ? "font-semibold text-[#2f423c]" : ""}
                      >
                        {item.label}
                      </span>
                    )}
                    {!isLast && <span className="text-[#95a8a2]">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-[#16251f]">
            {title}
          </h1>
        </div>

        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>

      <nav className="admin-panel p-2">
        <ul className="flex flex-wrap gap-2">
          {adminNavLinks.map((link) => {
            const active = isActive(link.to);

            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-teal-700 text-white shadow"
                      : "text-[#314842] hover:bg-[#eaf4f1] hover:text-[#0f766e]"
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

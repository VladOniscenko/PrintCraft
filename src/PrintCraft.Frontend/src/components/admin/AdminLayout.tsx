import type { ReactNode } from "react";
import Navbar from "../Navbar";

type AdminLayoutProps = {
  children: ReactNode;
  wide?: boolean;
};

export default function AdminLayout({
  children,
  wide = false,
}: AdminLayoutProps) {
  return (
    <div className="admin-shell">
      <Navbar />
      <main className={wide ? "admin-main admin-main-wide" : "admin-main"}>
        {children}
      </main>
    </div>
  );
}

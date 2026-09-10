"use client"

import RequireAdmin from "@/components/control/RequireAdmin"
import AdminNavbar from "@/components/control/AdminNavbar"
import { usePathname } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isAuthPage = pathname === "/control/login" || pathname === "/control/signup"

  if (isAuthPage) {
    return children
  }

  return (
    <RequireAdmin>
      <div className="control-shell">
        <AdminNavbar />
        <main className="control-main">
          <div className="control-content">{children}</div>
        </main>
      </div>
    </RequireAdmin>
  )
}

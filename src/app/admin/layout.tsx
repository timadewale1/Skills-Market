"use client"

import RequireAdmin from "@/components/admin/RequireAdmin"
import AdminNavbar from "@/components/admin/AdminNavbar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <AdminNavbar />
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </RequireAdmin>
  )
}
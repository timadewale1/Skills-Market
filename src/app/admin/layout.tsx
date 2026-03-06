"use client"

import RequireAdmin from "@/components/admin/RequireAdmin"
import AdminNavbar from "@/components/admin/AdminNavbar"
import { usePathname } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't require admin auth for login/signup pages
  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/signup"

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {children}
      </div>
    )
  }

  return (
    <RequireAdmin>
      <AdminNavbar />
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </RequireAdmin>
  )
}
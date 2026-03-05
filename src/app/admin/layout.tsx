"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { requireAdmin } from "@/lib/adminGuard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/admin/login")
      return
    }
    // Note: requireAdmin is server-side, so we can't call it here. Assume client-side check or handle in pages.
  }, [user, router])

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4 space-y-4 bg-gray-50">
        <h1 className="font-bold text-xl">Admin Panel</h1>
        <Link href="/admin/dashboard" className="block hover:bg-gray-200 p-2 rounded">Dashboard</Link>
        <Link href="/admin/users" className="block hover:bg-gray-200 p-2 rounded">Users</Link>
        <Link href="/admin/talents" className="block hover:bg-gray-200 p-2 rounded">Talents</Link>
        <Link href="/admin/clients" className="block hover:bg-gray-200 p-2 rounded">Clients</Link>
        <Link href="/admin/gigs" className="block hover:bg-gray-200 p-2 rounded">Gigs</Link>
        <Link href="/admin/proposals" className="block hover:bg-gray-200 p-2 rounded">Proposals</Link>
        <Link href="/admin/workspaces" className="block hover:bg-gray-200 p-2 rounded">Workspaces</Link>
        <Link href="/admin/disputes" className="block hover:bg-gray-200 p-2 rounded">Disputes</Link>
        <Link href="/admin/reviews" className="block hover:bg-gray-200 p-2 rounded">Reviews</Link>
        <Link href="/admin/messages" className="block hover:bg-gray-200 p-2 rounded">Messages</Link>
        <Link href="/admin/notifications" className="block hover:bg-gray-200 p-2 rounded">Notifications</Link>
        <Link href="/admin/wallets" className="block hover:bg-gray-200 p-2 rounded">Wallets</Link>
        <Link href="/admin/transactions" className="block hover:bg-gray-200 p-2 rounded">Transactions</Link>
        <Link href="/admin/analytics" className="block hover:bg-gray-200 p-2 rounded">Analytics</Link>
        <Link href="/admin/settings" className="block hover:bg-gray-200 p-2 rounded">Settings</Link>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
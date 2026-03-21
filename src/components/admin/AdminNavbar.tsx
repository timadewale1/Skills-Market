"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import toast from "react-hot-toast"
import {
  LayoutGrid,
  Users,
  Briefcase,
  FolderKanban,
  AlertTriangle,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  MessageSquare,
  Star,
  HandCoins,
  FileSearch,
  UserRoundCheck,
  Building2,
} from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AdminNotificationBell from "@/components/admin/AdminNotificationBell"
import { clearAuthSession } from "@/lib/authSession"

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/reports", label: "Reports", icon: FileSearch },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/talents", label: "Talents", icon: UserRoundCheck },
      { href: "/admin/clients", label: "Clients", icon: Building2 },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { href: "/admin/gigs", label: "Gigs", icon: Briefcase },
      { href: "/admin/proposals", label: "Proposals", icon: FileSearch },
      { href: "/admin/workspaces", label: "Workspaces", icon: FolderKanban },
      { href: "/admin/messages", label: "Messages", icon: MessageSquare },
      { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/admin/transactions", label: "Transactions", icon: HandCoins },
      { href: "/admin/wallets", label: "Wallets", icon: Wallet },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")

  useEffect(() => {
    let alive = true

    const loadProfile = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const data = snap.data() as any
        if (!alive) return
        setFullName(String(data?.fullName || data?.name || "Admin"))
        setPhotoUrl(String(data?.photoUrl || ""))
      } catch (error) {
        console.error("Admin profile read failed:", error)
      }
    }

    loadProfile()
    return () => {
      alive = false
    }
  }, [user?.uid])

  const initials = useMemo(() => {
    const parts = fullName.trim().split(" ").filter(Boolean)
    const first = parts[0]?.[0] || user?.email?.[0] || "A"
    const second = parts[1]?.[0] || ""
    return `${first}${second}`.toUpperCase()
  }, [fullName, user?.email])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      clearAuthSession()
      window.localStorage.removeItem("sm_role")
      toast.success("Admin session closed")
      router.push("/admin/login")
    } catch (error) {
      console.error(error)
      toast.error("Logout failed")
    }
  }

  const navLinkClass = (active: boolean) =>
    [
      "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition",
      active
        ? "bg-orange-50 text-[var(--primary)]"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    ].join(" ")

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[var(--primary)]">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold tracking-tight text-gray-900">changeworker admin</div>
              <div className="text-xs font-medium text-gray-500">Platform operations console</div>
            </div>
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-3 xl:flex">
          {navGroups.map((group) => (
            <details key={group.label} className="group relative">
              <summary className="list-none cursor-pointer rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]">
                {group.label}
              </summary>
              <div className="absolute left-1/2 top-[calc(100%+0.75rem)] z-50 w-72 -translate-x-1/2 rounded-3xl border bg-white p-3 shadow-xl">
                <div className="grid gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActivePath(pathname, item.href)
                    return (
                      <Link key={item.href} href={item.href} className={navLinkClass(active)}>
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </details>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <AdminNotificationBell />

          <div className="flex items-center gap-3 rounded-full border bg-[var(--secondary)] px-3 py-2">
            <Avatar className="h-9 w-9">
              {photoUrl ? <AvatarImage src={photoUrl} alt="Admin avatar" /> : <AvatarFallback>{initials}</AvatarFallback>}
            </Avatar>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">{fullName || "Admin"}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border xl:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle admin navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t bg-white px-4 py-4 xl:hidden">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-[var(--secondary)] px-3 py-3">
            <Avatar className="h-10 w-10">
              {photoUrl ? <AvatarImage src={photoUrl} alt="Admin avatar" /> : <AvatarFallback>{initials}</AvatarFallback>}
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900">{fullName || "Admin"}</div>
              <div className="truncate text-xs text-gray-500">{user?.email}</div>
            </div>
          </div>

          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{group.label}</div>
                <div className="grid gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActivePath(pathname, item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={navLinkClass(active)}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      ) : null}
    </header>
  )
}

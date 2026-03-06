"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import toast from "react-hot-toast"
import {
  Menu,
  X,
  ShieldCheck,
  LayoutGrid,
  Users,
  Briefcase,
  MessageSquare,
  AlertTriangle,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react"
import { auth, db } from "@/lib/firebase"
import Button from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { doc, getDoc } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AdminNotificationBell from "@/components/admin/AdminNotificationBell"

export default function AdminNavbar() {
  const { user } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [fullName, setFullName] = useState<string>("")
  const [photoUrl, setPhotoUrl] = useState<string>("")

  useEffect(() => {
    let alive = true

    const run = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const data = snap.data() as any
        if (!alive) return
        setFullName(String(data?.fullName || ""))
        setPhotoUrl(String(data?.photoUrl || ""))
      } catch (e) {
        console.error("AdminNavbar users/{uid} read failed:", e)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [user?.uid])

  const navItem = "text-sm font-semibold text-black hover:text-[var(--primary)] transition"

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.localStorage.removeItem("sm_role")
      toast.success("Logged out")
      router.push("/")
    } catch {
      toast.error("Logout failed")
    }
  }

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/gigs", label: "Gigs", icon: Briefcase },
    { href: "/admin/workspaces", label: "Workspaces", icon: Briefcase },
    { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    { href: "/admin/transactions", label: "Transactions", icon: Wallet },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  const initials = useMemo(() => {
    const name = fullName.trim()
    if (name) {
      const parts = name.split(" ").filter(Boolean)
      const first = parts[0]?.[0] || ""
      const second = parts[1]?.[0] || ""
      return (first + second).toUpperCase() || first.toUpperCase()
    }
    const fallback = user?.email?.[0] || "A"
    return fallback.toUpperCase()
  }, [fullName, user?.email])

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link
            href="/admin/dashboard"
            className="text-xl font-extrabold text-[var(--primary)]"
          >
            SkillsMarket
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={navItem}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT (DESKTOP) */}
        <div className="hidden md:flex items-center gap-4">
          <AdminNotificationBell />
          
          <Link href="/admin/profile" className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt="Profile" />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <span className={navItem}>
              {fullName ? fullName.split(" ")[0] : "Admin"}
            </span>
          </Link>

          <button onClick={handleLogout} className={navItem}>
            Logout
          </button>
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE PANEL */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-6 py-6 space-y-6">
          <Link
            href="/admin/profile"
            className="flex items-center gap-3 rounded-lg px-3 py-2 font-semibold text-black hover:text-[var(--primary)] hover:bg-orange-50 transition"
            onClick={() => setMobileOpen(false)}
          >
            <Avatar className="h-9 w-9">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt="Profile" />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="leading-tight">
              <div className="font-extrabold">
                {fullName ? fullName.split(" ")[0] : "Admin"}
              </div>
              <div className="text-xs text-gray-600">{user?.email}</div>
            </div>
          </Link>

          <div className="space-y-2">
            {links.map((l) => {
              const Icon = l.icon
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 font-semibold text-black hover:text-[var(--primary)] hover:bg-orange-50 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  {l.label}
                </Link>
              )
            })}
            <Link
              href="/admin/notifications"
              className="flex items-center gap-3 rounded-lg px-3 py-2 font-semibold text-black hover:text-[var(--primary)] hover:bg-orange-50 transition"
              onClick={() => setMobileOpen(false)}
            >
              <MessageSquare size={18} />
              Notifications
            </Link>
          </div>

          <div className="pt-2 w-full">
            <Button
              onClick={() => {
                setMobileOpen(false)
                handleLogout()
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

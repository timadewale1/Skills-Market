"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import toast from "react-hot-toast"
import {
  Menu,
  X,
  Search,
  Briefcase,
  Users,
  MessageSquare,
  LayoutGrid,
  PlusCircle,
  Wallet,
} from "lucide-react"
import { auth, db } from "@/lib/firebase"
import Button from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AvatarUploader from "@/components/profile/parts/AvatarUploader"
import NotificationBell from "@/components/NotificationBell"
import { clearAuthSession } from "@/lib/authSession"


type Role = "talent" | "client" | null

export default function AuthNavbar() {
  const { user } = useAuth()
  const { role, loadingRole } = useUserRole()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const [fullName, setFullName] = useState<string>("")
  const [photoUrl, setPhotoUrl] = useState<string>("")
   const savePartial = async (patch: any) => {
      if (!user?.uid) return
      await setDoc(
        doc(db, "users", user.uid),
        { ...patch, updatedAt: serverTimestamp() },
        { merge: true }
      )
    }

  useEffect(() => {
    let alive = true

    const run = async () => {
      if (!user?.uid) return
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const data = snap.data() as any
        if (!alive) return
        setFullName(String(data?.fullName || ""))
        setPhotoUrl(String(data?.photoUrl || "")) // we’ll set later on profile page
      }  catch (e) {
  console.error("AuthNavbar users/{uid} read failed:", e)
}

    }

    run()
    return () => {
      alive = false
    }
  }, [user?.uid])

  const navItem =
    "text-sm font-semibold text-black hover:text-[var(--primary)] transition"

  const handleLogout = async () => {
    try {
      await signOut(auth)
      clearAuthSession()
      window.localStorage.removeItem("sm_role")
      toast.success("Logged out")
      router.push("/")
    } catch {
      toast.error("Logout failed")
    }
  }

  const links = useMemo(() => {
    if (loadingRole || !role) {
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
        { href: "/dashboard/workspaces", label: "Workspaces", icon: Briefcase },
      ]
    }

    if (role === "talent") {
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
        { href: "/dashboard/find-work", label: "Find Work", icon: Briefcase },
        { href: "/dashboard/proposals", label: "Proposals", icon: PlusCircle },
        { href: "/dashboard/workspaces", label: "Workspaces", icon: Briefcase },
      ]
    }

    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
      { href: "/dashboard/find-talent", label: "Hire Talent", icon: Users },
      { href: "/dashboard/post-gig", label: "Post a Gig", icon: PlusCircle },
      { href: "/dashboard/gigs", label: "Gigs", icon: Briefcase },
      { href: "/dashboard/workspaces", label: "Workspaces", icon: Briefcase },
    ]
  }, [role, loadingRole])

  const utilityLinks = [
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  ]

  const searchType = role === "client" ? "talent" : "job"
  const searchPlaceholder =
    role === "client"
      ? "Search talent (skills, SDGs...)"
      : "Search gigs (role, SDGs...)"

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
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-extrabold text-[var(--primary)]"
          >
            <img src="/logo.png" alt="Changeworker" className="h-13 w-13" />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden xl:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={navItem}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT (DESKTOP) */}
        <div className="ml-auto hidden min-w-0 items-center gap-3 md:flex">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const q = String(fd.get("q") || "").trim()
              if (!q) return
              router.push(`/search?type=${searchType}&q=${encodeURIComponent(q)}`)
            }}
            className="hidden items-center overflow-hidden rounded-xl border bg-white lg:flex"
          >
            <div className="px-3 text-gray-500">
              <Search size={16} />
            </div>
            <input
              name="q"
              placeholder={searchPlaceholder}
              className="w-72 bg-transparent px-2 py-2 text-sm outline-none xl:w-80"
            />
          </form>

          <div className="flex items-center gap-1">
            {utilityLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon size={18} />
                </Link>
              )
            })}
          </div>

          <NotificationBell />

          <Link href="/dashboard/profile" className="flex items-center gap-2">
            {/* <Avatar className="h-9 w-9">
              {photoUrl ? (
                <AvatarImage src={photoUrl} alt="Profile" />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar> */}
            <AvatarUploader
                          uid={user!.uid}
                          currentUrl={photoUrl}
                          displayName={fullName}
                          onUploaded={async (url) => {
                            setPhotoUrl(url)
                            await savePartial({ photoUrl: url })
                          }}
                        />
            <span className={navItem}>
              {fullName ? fullName.split(" ")[0] : "Account"}
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
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const q = String(fd.get("q") || "").trim()
              if (!q) return
              router.push(`/search?type=${searchType}&q=${encodeURIComponent(q)}`)
              setMobileOpen(false)
            }}
            className="flex items-center border rounded-md overflow-hidden"
          >
            <div className="px-3 text-gray-500">
              <Search size={16} />
            </div>
            <input
              name="q"
              placeholder={searchPlaceholder}
              className="px-2 py-2 text-sm outline-none w-full"
            />
          </form>

          <div className="flex justify-between items-center">
            <NotificationBell />
          </div>

          <Link
            href="/dashboard/profile"
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
                {fullName ? fullName.split(" ")[0] : "Account"}
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

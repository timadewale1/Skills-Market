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
} from "lucide-react"
import { auth, db } from "@/lib/firebase"
import Button from "@/components/ui/Button"
import { useAuth } from "@/context/AuthContext"
import { useUserRole } from "@/hooks/useUserRole"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AvatarUploader from "@/components/profile/parts/AvatarUploader"


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
        { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
      ]
    }

    if (role === "talent") {
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
        { href: "/dashboard/find-work", label: "Find Work", icon: Briefcase },
        { href: "/dashboard/proposals", label: "Proposals", icon: PlusCircle },
        { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
      ]
    }

    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
      { href: "/dashboard/hire", label: "Hire Talent", icon: Users },
      { href: "/dashboard/post-gig", label: "Post a Gig", icon: PlusCircle },
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    ]
  }, [role, loadingRole])

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
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
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
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const q = String(fd.get("q") || "").trim()
              if (!q) return
              router.push(`/search?type=${searchType}&q=${encodeURIComponent(q)}`)
            }}
            className="flex items-center border rounded-md overflow-hidden"
          >
            <div className="px-3 text-gray-500">
              <Search size={16} />
            </div>
            <input
              name="q"
              placeholder={searchPlaceholder}
              className="px-2 py-2 text-sm outline-none w-72"
            />
          </form>

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

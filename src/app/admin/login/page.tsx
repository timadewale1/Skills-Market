"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import Button from "@/components/ui/Button"
import AdminAuthShell from "@/components/admin/AdminAuthShell"
import {
  ensureBrowserSessionPersistence,
  markAuthSession,
} from "@/lib/authSession"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Enter your admin email and password.")
      return
    }

    try {
      setLoading(true)
      setError("")

      await ensureBrowserSessionPersistence()
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const userDoc = await getDoc(doc(db, "users", cred.user.uid))

      if (!userDoc.exists() || userDoc.data()?.role !== "admin") {
        setError("This account does not have admin access.")
        router.push("/")
        return
      }

      markAuthSession(cred.user.uid)
      router.push("/admin/dashboard")
    } catch (err: any) {
      setError(err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminAuthShell
      title="Sign in to manage the platform."
      subtitle="Access disputes, user verification, gigs, transactions, workspaces, analytics, and the day-to-day operating flow from one admin workspace."
    >
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Admin login</h2>
        <p className="mt-2 text-sm text-gray-600">
          Use an admin-approved account to continue.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@changeworker.ng"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-2xl border px-4 py-3 pr-11 text-sm outline-none transition focus:border-[var(--primary)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign in to admin"}
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <span>Need a new admin account?</span>
        <Link href="/admin/signup" className="font-semibold text-[var(--primary)]">
          Create one
        </Link>
      </div>
    </AdminAuthShell>
  )
}

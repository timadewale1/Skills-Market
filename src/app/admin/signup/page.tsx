"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import Button from "@/components/ui/Button"
import AdminAuthShell from "@/components/admin/AdminAuthShell"

export default function AdminSignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      setError("Enter your name, admin email, and password.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          uid: cred.user.uid,
          fullName,
          email,
          role: "admin",
          onboardingComplete: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      router.push("/admin/dashboard")
    } catch (err: any) {
      setError(err?.message || "Admin signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminAuthShell
      title="Create an admin account for platform operations."
      subtitle="Set up the people who will review verification, oversee disputes, monitor transactions, and keep the marketplace healthy."
      eyebrow="Admin onboarding"
    >
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Admin signup</h2>
        <p className="mt-2 text-sm text-gray-600">
          Register an internal operator account for changeworker administration.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Platform operator name"
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
          />
        </div>

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
              placeholder="Create a strong password"
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

        <Button
          onClick={handleSignup}
          disabled={loading || !fullName || !email || !password}
          className="w-full"
        >
          {loading ? "Creating admin account..." : "Create admin account"}
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <span>Already have access?</span>
        <Link href="/admin/login" className="font-semibold text-[var(--primary)]">
          Sign in
        </Link>
      </div>
    </AdminAuthShell>
  )
}

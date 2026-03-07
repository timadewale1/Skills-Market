"use client"

import { useState } from "react"
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const nextUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null

  const postLoginRedirect = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid))
      const onboardingComplete = snap.exists() && Boolean(snap.data()?.onboardingComplete)

      if (!onboardingComplete) {
        router.push("/onboarding")
        return
      }

      if (nextUrl) {
        router.push(nextUrl)
        return
      }

      router.push("/dashboard")
    } catch {
      // If Firestore fails for any reason, don't block user.
      router.push("/onboarding")
    }
  }

  const handleEmailLogin = async () => {
    if (!email || !password) return toast.error("Enter email and password")

    setLoading(true)
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)

      if (!res.user.emailVerified) {
        toast.error("Please verify your email to continue")
        router.push("/verify-email")
        return
      }

      toast.success("Logged in successfully")
      await postLoginRedirect(res.user.uid)
    } catch (err: any) {
      toast.error("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const res = await signInWithPopup(auth, provider)

      toast.success("Welcome!")
      await postLoginRedirect(res.user.uid)
    } catch {
      toast.error("Google sign-in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--secondary)]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 border">
        <h1 className="text-2xl font-extrabold mb-2">Welcome back</h1>
        <p className="text-sm text-gray-600 mb-6">
          Login to continue to Skills Marketplace
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password + Eye Toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full border rounded-md px-3 py-2 text-sm pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--primary)]"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button onClick={handleEmailLogin}>
            {loading ? "Signing in..." : "Login"}
          </Button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* CENTERED GOOGLE BUTTON */}
          <div className="flex justify-center">
            <div className={loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}>
              <Button variant="outline" onClick={handleGoogleLogin}>
                <div className="flex items-center gap-2">
                  <Image src="/google.svg" alt="Google" width={18} height={18} />
                  Continue with Google
                </div>
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-[var(--primary)] font-semibold">
              Sign Up
            </Link>
          </p>

          <p className="text-sm text-gray-600 text-center">
            Forgot password?{" "}
            <Link href="/forgot-password" className="text-[var(--primary)] font-semibold">
              Reset password
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

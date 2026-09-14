"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import toast from "react-hot-toast"
import Button from "@/components/ui/Button"
import Navbar from "@/components/layout/Navbar"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import {
  ensureBrowserSessionPersistence,
  markAuthSession,
  syncAuthSessionCookies,
} from "@/lib/authSession"
import { makeAttemptGuard } from "@/lib/attemptThrottle"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const signupGuard = makeAttemptGuard("cw_signup_attempt_at", 20_000)

  useEffect(() => {
    let active = true
    if (typeof getRedirectResult !== "function") return
    void getRedirectResult(auth).then(async (result) => {
      if (!active || !result?.user) return
      setLoading(true)
      try {
        markAuthSession(result.user.uid)
        await syncAuthSessionCookies()
        await setDoc(
          doc(db, "users", result.user.uid),
          {
            uid: result.user.uid,
            email: result.user.email,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
        router.push("/onboarding")
      } catch {
        toast.error("Google sign-up could not be completed")
      } finally {
        if (active) setLoading(false)
      }
    }).catch(() => {
      if (active) setLoading(false)
    })

    return () => {
      active = false
    }
  }, [router])

  const handleSignup = async () => {
    if (!email || !password) return toast.error("Enter email and password")
    const attempt = signupGuard.canAttempt()
    if (!attempt.ok) {
      toast.error(`Please wait ${attempt.seconds}s before trying again.`)
      return
    }

    setLoading(true)
    try {
      await ensureBrowserSessionPersistence()
      const res = await createUserWithEmailAndPassword(auth, email, password)
      markAuthSession(res.user.uid)
      await syncAuthSessionCookies()
      const idToken = await res.user.getIdToken()
      const verifyResp = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!verifyResp.ok) {
        const json = await verifyResp.json().catch(() => ({}))
        throw new Error(json?.error || "Could not send verification email")
      }

      // ✅ Create stub profile doc
      await setDoc(
        doc(db, "users", res.user.uid),
        {
          uid: res.user.uid,
          email: res.user.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      // notify admins about the new signup
      try {
        const token = await auth.currentUser?.getIdToken()
        if (token) {
          await fetch("/api/admin/new-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ fullName: "", role: "unknown" }),
          })
        }
      } catch (err) {
        console.error("admin notification failed", err)
      }

      toast.success("Signup complete! Please verify your email to continue.")
      router.push("/verify-email")
    } catch (err: any) {
      toast.error(err?.message || "Signup failed")
      signupGuard.markAttempt()
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    const attempt = signupGuard.canAttempt()
    if (!attempt.ok) {
      toast.error(`Please wait ${attempt.seconds}s before trying again.`)
      return
    }
    setLoading(true)
    try {
      await ensureBrowserSessionPersistence()
      const provider = new GoogleAuthProvider()
      const res = await signInWithPopup(auth, provider)
      markAuthSession(res.user.uid)
      await syncAuthSessionCookies()

      // ✅ Create stub profile doc
      await setDoc(
        doc(db, "users", res.user.uid),
        {
          uid: res.user.uid,
          email: res.user.email,
          onboardingComplete: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      // notify admins
      try {
        const token = await auth.currentUser?.getIdToken()
        if (token) {
          await fetch("/api/admin/new-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ fullName: res.user.displayName || "", role: "unknown" }),
          })
        }
      } catch (err) {
        console.error("admin notification failed", err)
      }

      toast.success("Welcome!")
      router.push("/onboarding")
    } catch (err: any) {
      const code = String(err?.code || "")
      if (code.includes("popup") || code.includes("cancelled")) {
        try {
          const provider = new GoogleAuthProvider()
          await signInWithRedirect(auth, provider)
          return
        } catch {
          // fall through to error toast
        }
      }
      console.error("Google signup failed:", err)
      toast.error(err?.message || "Google sign-up failed")
      signupGuard.markAttempt()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 bg-[var(--secondary)]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 border">
          <h1 className="text-2xl font-extrabold mb-2">Create your account</h1>
          <p className="text-sm text-gray-600 mb-6">
            Join the marketplace for impact-driven work.
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

            <div className={`${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Button onClick={handleSignup} className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Sign Up"}
              </Button>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* CENTERED GOOGLE BUTTON */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleGoogleSignup}
              >
                <div className="flex items-center gap-2">
                  <Image src="/google.svg" alt="Google" width={18} height={18} />
                  {loading ? "Signing up..." : "Continue with Google"}
                </div>
              </Button>
            </div>

            <p className="text-sm text-gray-600 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--primary)] font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { sendEmailVerification } from "firebase/auth"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import Button from "@/components/ui/Button"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const user = auth.currentUser

    // If no user (e.g., refreshed), send them to login.
    if (!user) {
      router.push("/login")
      return
    }

    let intervalId: any

    const checkVerified = async () => {
      try {
        await user.reload()
        if (user.emailVerified) {
          toast.success("Email verified! Please log in.")
          router.push("/login")
        }
      } catch {
        // ignore
      } finally {
        setChecking(false)
      }
    }

    // Initial check
    checkVerified()

    // Poll every 2s
    intervalId = setInterval(checkVerified, 2000)

    // Also check when tab regains focus
    const onFocus = () => checkVerified()
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener("focus", onFocus)
    }
  }, [router])

  const resendEmail = async () => {
    const user = auth.currentUser
    if (!user) return toast.error("Please log in again.")
    try {
      await sendEmailVerification(user)
      toast.success("Verification email resent")
    } catch {
      toast.error("Could not resend verification email")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--secondary)]">
      <div className="max-w-md w-full bg-white border rounded-2xl p-6 text-center">
        <h1 className="text-2xl font-extrabold mb-2">Verify your email</h1>
        <p className="text-sm text-gray-600 mb-6">
          We sent a verification link to your email. Once verified, you’ll be redirected to login.
        </p>

        <Button onClick={resendEmail}>
          Resend verification email
        </Button>

        <p className="text-xs text-gray-500">
          {checking ? "Checking verification status..." : "Still waiting for verification..."}
        </p>

        <button
          onClick={() => router.push("/login")}
          className="mt-4 text-sm font-semibold text-[var(--primary)] hover:underline"
        >
          Back to login
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Navbar from "@/components/layout/Navbar"
import Button from "@/components/ui/Button"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import toast from "react-hot-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!email) return toast.error("Enter your email")
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success("Password reset email sent!")
    } catch (err: any) {
      toast.error("Could not send reset email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6 border">
          <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
          <p className="text-sm text-gray-600 mb-6">
            Enter your email and we’ll send you a reset link.
          </p>

          <input
            type="email"
            placeholder="Email address"
            className="w-full border rounded-md px-3 py-2 text-sm mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button onClick={handleReset}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </div>
      </div>
    </>
  )
}

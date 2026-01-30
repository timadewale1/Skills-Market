"use client"

import { useState } from "react"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"
import Button from "@/components/ui/Button"
import toast from "react-hot-toast"
import Image from "next/image"


export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async () => {
    setError("")
    setLoading(true)
    try {
  await signInWithEmailAndPassword(auth, email, password)
  toast.success("Logged in successfully")
} catch (err: any) {
  toast.error("Invalid email or password")
} finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    try {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(auth, provider)
  toast.success("Welcome!")
} catch {
  toast.error("Google sign-in failed")
}
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6 border">
        <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
        <p className="text-sm text-gray-600 mb-6">
          Login to continue to Skills Marketplace
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleEmailLogin}>
            {loading ? "Signing in..." : "Login"}
          </Button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Button variant="outline" onClick={handleGoogleLogin}>
  <div className="flex items-center gap-2 justify-center">
    <Image src="/google.svg" alt="Google" width={18} height={18} />
    Continue with Google
  </div>
</Button>

        </div>
      </div>
    </div>
  )
}

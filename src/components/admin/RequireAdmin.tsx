"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (!user) {
          setChecking(false)
          return
        }

        const snap = await getDoc(doc(db, "users", user.uid))
        const data = snap.data()

        if (data?.role !== "admin") {
          setAuthorized(false)
          setChecking(false)
          return
        }

        setAuthorized(true)
        setChecking(false)
      } catch (error) {
        console.error("Error checking admin status:", error)
        setAuthorized(false)
        setChecking(false)
      }
    }

    if (!loading) {
      checkAdmin()
    }
  }, [user, loading])

  // Handle redirects after state is set
  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      router.push("/admin/login")
      return
    }

    // Redirect if checked and not authorized
    if (!loading && !checking && !authorized) {
      router.push("/")
      return
    }
  }, [user, loading, checking, authorized, router])

  // Show loading while checking auth state or admin status
  if (loading || checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border bg-white px-5 py-3 shadow-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--primary)]" />
          <span className="text-sm font-semibold text-gray-600">
            Checking admin access...
          </span>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || !authorized) {
    return null
  }

  return <>{children}</>
}

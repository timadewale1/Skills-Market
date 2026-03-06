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

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setChecking(false)
        return
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const data = snap.data()

        if (data?.role !== "admin") {
          router.push("/")
          return
        }

        setAuthorized(true)
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/")
        return
      } finally {
        setChecking(false)
      }
    }

    checkAdmin()
  }, [user, router])

  // Show loading while checking auth state or admin status
  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not authenticated, redirect to admin login
  if (!user) {
    router.push("/admin/login")
    return null
  }

  // If not authorized, redirect to home
  if (!authorized) {
    router.push("/")
    return null
  }

  return <>{children}</>
}

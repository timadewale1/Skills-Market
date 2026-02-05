"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import FancyLoader from "@/components/ui/FancyLoader"

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // ✅ THIS is the key fix
  if (loading) {
    return <FancyLoader label="Preparing your workspace..." />
  }

  if (!user) return null

  return <>{children}</>
}

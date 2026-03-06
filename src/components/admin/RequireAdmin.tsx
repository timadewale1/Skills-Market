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

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return

      const snap = await getDoc(doc(db, "users", user.uid))
      const data = snap.data()

      if (data?.role !== "admin") {
        router.push("/")
        return
      }

      setAuthorized(true)
    }

    checkAdmin()
  }, [user])

  if (loading || !authorized) return null

  return <>{children}</>
}

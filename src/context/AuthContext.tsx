"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  clearAuthSession,
  ensureBrowserSessionPersistence,
  getAuthSessionStartedAt,
  isAuthSessionExpired,
  logoutExpiredSession,
  markAuthSession,
} from "@/lib/authSession"

type AuthContextType = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void ensureBrowserSessionPersistence().catch((error) => {
      console.error("Failed to configure session persistence:", error)
    })

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        clearAuthSession()
        setUser(null)
        setLoading(false)
        return
      }

      if (isAuthSessionExpired()) {
        void logoutExpiredSession()
        setUser(null)
        setLoading(false)
        return
      }

      if (!getAuthSessionStartedAt()) {
        markAuthSession(user.uid)
      }

      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    const timer = window.setInterval(() => {
      if (!isAuthSessionExpired()) return
      void logoutExpiredSession().finally(() => {
        const nextPath = window.location.pathname.startsWith("/admin")
          ? "/admin/login"
          : "/login"
        window.location.href = nextPath
      })
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

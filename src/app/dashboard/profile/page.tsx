"use client"

export const dynamic = "force-dynamic"

import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useUserRole } from "@/hooks/useUserRole"
import TalentProfilePage from "@/components/profile/TalentProfilePage"
import ClientProfilePage from "@/components/profile/ClientProfilePage"

export default function ProfilePage() {
  const { role, loadingRole } = useUserRole()

  return (
    <RequireAuth>
      <AuthNavbar />
      {loadingRole ? (
        <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-sm text-gray-600">Loading profile…</div>
        </div>
      ) : role === "client" ? (
        <ClientProfilePage />
      ) : (
        <TalentProfilePage />
      )}
    </RequireAuth>
  )
}

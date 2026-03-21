"use client"

import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import NotificationsFeed from "@/components/notifications/NotificationsFeed"

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-[var(--secondary)]">
        <AuthNavbar />
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6 rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
              Notification center
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Your activity feed</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Follow proposal updates, workspace events, messages, reviews, payments, and verification progress in one place.
            </p>
          </div>

          <NotificationsFeed scope="user" itemsPerPage={8} />
        </div>
      </div>
    </RequireAuth>
  )
}

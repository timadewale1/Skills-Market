"use client"

import AdminPageHeader from "@/components/admin/AdminPageHeader"
import NotificationsFeed from "@/components/notifications/NotificationsFeed"

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Admin inbox"
        title="Notifications"
        description="See platform alerts, review queues, and admin-facing activity triggered by client and talent actions across the marketplace."
        stats={[
          { label: "Scope", value: "Admin only" },
          { label: "Mode", value: "Realtime" },
          { label: "Actions", value: "Filter + bulk read" },
          { label: "View", value: "Operational feed" },
        ]}
      />

      <NotificationsFeed scope="admin" itemsPerPage={10} />
    </div>
  )
}

import { auth } from "@/lib/firebase"

async function authHeaders() {
  const token = await auth.currentUser?.getIdToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function markNotificationRead(notificationId: string) {
  return fetch("/api/notifications/mark-read", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ notificationId }),
  })
}

export async function markAllNotificationsRead() {
  return fetch("/api/notifications/mark-all-read", {
    method: "POST",
    headers: await authHeaders(),
  })
}

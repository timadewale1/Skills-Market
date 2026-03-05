import { getAdminDb } from "@/lib/firebaseAdmin"

export async function requireAdmin(uid: string) {
  const db = getAdminDb()
  const userDoc = await db.collection("users").doc(uid).get()

  if (!userDoc.exists) {
    throw new Error("User not found")
  }

  const user = userDoc.data()

  if (user?.role !== "admin") {
    throw new Error("Unauthorized")
  }

  return user
}
import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decoded = await auth.verifyIdToken(token)
    const userId = decoded.uid

    const { fullName, role } = await request.json()
    if (!userId || !fullName || !role) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    await notifyAdmins({
      type: "admin:user",
      title: "New user signed up",
      message: `${fullName} joined as a ${role}`,
      link: `/admin/users`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("new-user notify error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
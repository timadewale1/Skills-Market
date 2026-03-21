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
    await auth.verifyIdToken(token)

    const { workspaceId, gigTitle, talentName, amount } = await request.json()
    if (!workspaceId || !gigTitle || !talentName) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    await notifyAdmins({
      type: "admin:payout",
      title: "Payout Request",
      message: `${talentName} requested a payout for ${gigTitle}${amount ? ` (N${Number(amount).toLocaleString()})` : ""}.`,
      link: `/admin/workspaces/${workspaceId}`,
      emailSubject: `Payout Request for ${gigTitle}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("payout-request notify error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

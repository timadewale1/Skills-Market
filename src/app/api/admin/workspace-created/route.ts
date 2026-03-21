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

    const { workspaceId, gigTitle, clientUid, talentUid } = await request.json()
    if (!workspaceId || !gigTitle || !clientUid || !talentUid) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    await notifyAdmins({
      type: "admin:workspace",
      title: "Workspace Created",
      message: `A workspace was created for ${gigTitle} between client ${clientUid} and talent ${talentUid}.`,
      link: `/admin/workspaces/${workspaceId}`,
      emailSubject: `New Workspace: ${gigTitle}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("workspace-created notify error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

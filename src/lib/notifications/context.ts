import { getAdminDb } from "@/lib/firebaseAdmin"
import { getDisplayNameFromRecord, resolvePublicProfileByUidOrSlug } from "@/lib/adminData"

export async function getWorkspaceNotificationContext(workspaceId: string) {
  const db = getAdminDb()
  const workspaceSnap = await db.collection("workspaces").doc(workspaceId).get()
  if (!workspaceSnap.exists) return null

  const workspace = { id: workspaceSnap.id, ...(workspaceSnap.data() as any) }
  let clientProfile = null
  let talentProfile = null
  try {
    ;[clientProfile, talentProfile] = await Promise.all([
      workspace.clientUid ? resolvePublicProfileByUidOrSlug(String(workspace.clientUid)) : null,
      workspace.talentUid ? resolvePublicProfileByUidOrSlug(String(workspace.talentUid)) : null,
    ])
  } catch {
    clientProfile = null
    talentProfile = null
  }

  return {
    workspace,
    gigTitle: workspace.gigTitle || workspace.title || "Untitled gig",
    clientName: workspace.clientName || getDisplayNameFromRecord(clientProfile, workspace.clientUid || "Client"),
    talentName: workspace.talentName || getDisplayNameFromRecord(talentProfile, workspace.talentUid || "Talent"),
  }
}

export async function getThreadNotificationContext(threadId: string) {
  const db = getAdminDb()
  const threadSnap = await db.collection("threads").doc(threadId).get()
  if (!threadSnap.exists) return null
  const thread = { id: threadSnap.id, ...(threadSnap.data() as any) }

  let clientProfile = null
  let talentProfile = null
  try {
    ;[clientProfile, talentProfile] = await Promise.all([
      thread.clientUid ? resolvePublicProfileByUidOrSlug(String(thread.clientUid)) : null,
      thread.talentUid ? resolvePublicProfileByUidOrSlug(String(thread.talentUid)) : null,
    ])
  } catch {
    clientProfile = null
    talentProfile = null
  }

  return {
    thread,
    gigTitle: thread.gigTitle || "Untitled gig",
    clientName: thread.clientName || getDisplayNameFromRecord(clientProfile, thread.clientUid || "Client"),
    talentName: thread.talentName || getDisplayNameFromRecord(talentProfile, thread.talentUid || "Talent"),
  }
}

export async function getGigNotificationContext(gigId: string) {
  const db = getAdminDb()
  const gigSnap = await db.collection("gigs").doc(gigId).get()
  if (!gigSnap.exists) return null

  const gig = { id: gigSnap.id, ...(gigSnap.data() as any) }
  let clientProfile = null
  try {
    clientProfile = gig.clientUid
      ? await resolvePublicProfileByUidOrSlug(String(gig.clientUid))
      : null
  } catch {
    clientProfile = null
  }

  return {
    gig,
    gigTitle: gig.title || "Untitled gig",
    clientName: getDisplayNameFromRecord(clientProfile, gig.clientUid || "Client"),
  }
}

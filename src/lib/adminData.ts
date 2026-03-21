import { getAdminDb } from "@/lib/firebaseAdmin"

type DocData = Record<string, any>

export function formatAdminMoney(value?: number | null) {
  return `N${Number(value || 0).toLocaleString()}`
}

export function formatAdminDate(value: any, withTime = false) {
  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : null

  if (!date) return "N/A"
  return withTime ? date.toLocaleString("en-NG") : date.toLocaleDateString("en-NG")
}

export function initials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean)
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "")
}

export function buildWorkspaceDisplayTitle(workspace: DocData) {
  const gigTitle = workspace.gigTitle || workspace.title || "Workspace"
  const pair = [workspace.clientName, workspace.talentName].filter(Boolean).join(" - ")
  return pair ? `${gigTitle} - ${pair}` : gigTitle
}

export async function getAdminIndexes() {
  const db = getAdminDb()
  const [usersSnap, publicProfilesSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("publicProfiles").get(),
  ])

  const users = new Map<string, DocData>()
  const publicProfiles = new Map<string, DocData>()

  usersSnap.docs.forEach((doc: any) => users.set(doc.id, { id: doc.id, ...doc.data() }))
  publicProfilesSnap.docs.forEach((doc: any) =>
    publicProfiles.set(doc.id, { id: doc.id, ...doc.data() })
  )

  return { db, users, publicProfiles }
}

export function getDisplayNameFromRecord(record?: DocData | null, fallback = "N/A") {
  if (!record) return fallback
  return (
    record.fullName ||
    record.client?.orgName ||
    record.clientOrgName ||
    record.businessName ||
    record.name ||
    record.email ||
    fallback
  )
}

export function getUserSummary(
  uid: string | undefined,
  indexes: { users: Map<string, DocData>; publicProfiles: Map<string, DocData> }
) {
  if (!uid) {
    return {
      uid: "",
      role: "",
      name: "N/A",
      email: "",
      slug: "",
      photoURL: "",
      adminHref: "",
    }
  }

  const user = indexes.users.get(uid) || {}
  const publicProfile = indexes.publicProfiles.get(uid) || {}
  const role = String(user.role || publicProfile.role || "")

  const name = getDisplayNameFromRecord(
    {
      ...user,
      ...publicProfile,
    },
    uid
  )

  const photoURL =
    publicProfile.publicProfile?.photoURL ||
    publicProfile.photoURL ||
    publicProfile.client?.photoURL ||
    user.photoUrl ||
    ""

  const slug = String(publicProfile.slug || "")

  const adminHref =
    role === "talent"
      ? `/admin/talents/${uid}`
      : role === "client"
        ? `/admin/clients/${uid}`
        : `/admin/users`

  return {
    uid,
    role,
    name,
    email: String(publicProfile.email || user.email || ""),
    slug,
    photoURL,
    adminHref,
  }
}

export async function resolvePublicProfileByUidOrSlug(uidOrSlug: string) {
  const db = getAdminDb()
  if (!uidOrSlug) return null

  const directSnap = await db.collection("publicProfiles").doc(uidOrSlug).get()
  if (directSnap.exists) {
    return { id: directSnap.id, ...(directSnap.data() as DocData) }
  }

  const slugSnap = await db
    .collection("publicProfiles")
    .where("slug", "==", uidOrSlug)
    .limit(1)
    .get()

  if (!slugSnap.empty) {
    const doc = slugSnap.docs[0]
    return { id: doc.id, ...(doc.data() as DocData) }
  }

  const uidSnap = await db
    .collection("publicProfiles")
    .where("uid", "==", uidOrSlug)
    .limit(1)
    .get()

  if (!uidSnap.empty) {
    const doc = uidSnap.docs[0]
    return { id: doc.id, ...(doc.data() as DocData) }
  }

  return null
}

export async function getWorkspaceEscrowByClient() {
  const db = getAdminDb()
  const workspacesSnap = await db.collection("workspaces").get()
  const escrowByClient = new Map<string, number>()

  workspacesSnap.docs.forEach((doc: any) => {
    const workspace = doc.data() as DocData
    const clientUid = String(workspace.clientUid || "")
    if (!clientUid) return

    const isHeld = workspace.payment?.status === "funded" && workspace.payment?.escrow !== false
    if (!isHeld) return

    const amount = Number(workspace.payment?.amount || 0)
    escrowByClient.set(clientUid, Number((escrowByClient.get(clientUid) || 0) + amount))
  })

  return escrowByClient
}

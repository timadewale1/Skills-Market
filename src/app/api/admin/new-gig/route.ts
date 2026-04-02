import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { matchTalentsToGig, type Gig, type TalentProfile } from "@/lib/matching"
import { buildNotificationEmail } from "@/lib/notifications/template"

function overlap(a?: string[], b?: string[]) {
  if (!a?.length || !b?.length) return []
  const right = new Set(b.map((item) => String(item).toLowerCase()))
  return a.filter((item) => right.has(String(item).toLowerCase()))
}

function buildGigMatchReasons(gig: Gig, talent: TalentProfile) {
  const reasons: string[] = []

  const skillMatches = overlap(gig.requiredSkills, talent.skills)
  if (skillMatches.length) {
    reasons.push(`shared skills like ${skillMatches.slice(0, 3).join(", ")}`)
  }

  const sdgMatches = overlap(gig.sdgTags, talent.sdgTags)
  if (sdgMatches.length) {
    reasons.push(`your SDG focus in ${sdgMatches.slice(0, 2).join(" and ")}`)
  }

  if (gig.category?.item && talent.categories?.some((item) => String(item).toLowerCase() === String(gig.category?.item).toLowerCase())) {
    reasons.push(`${gig.category.item} category alignment`)
  }

  if (gig.workMode && talent.workMode && String(gig.workMode).toLowerCase() === String(talent.workMode).toLowerCase()) {
    reasons.push(`${gig.workMode.toLowerCase()} work mode fit`)
  }

  if (
    gig.location &&
    talent.location &&
    String(talent.location).toLowerCase().includes(String(gig.location).toLowerCase())
  ) {
    reasons.push(`location fit in ${gig.location}`)
  }

  return reasons
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth()
    const db = getAdminDb()
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split("Bearer ")[1]
    const decoded = await auth.verifyIdToken(token)
    const userId = decoded.uid

    const { gigId, gigTitle, clientUid } = await request.json()
    if (!gigId || !gigTitle || !clientUid) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }
    if (userId !== clientUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const gigRef = db.collection("gigs").doc(gigId)
    const gigSnap = await gigRef.get()
    if (!gigSnap.exists) {
      return NextResponse.json({ error: "Gig not found" }, { status: 404 })
    }

    const gig = { id: gigSnap.id, ...(gigSnap.data() as any) } as Gig & {
      clientUid: string
      status?: string
      matchedTalentNotifiedAt?: any
    }

    if (gig.clientUid !== clientUid) {
      return NextResponse.json({ error: "Gig owner mismatch" }, { status: 403 })
    }

    await notifyAdmins({
      type: "admin:gig",
      title: "New gig posted",
      message: `${gigTitle} was posted by client ${clientUid}`,
      link: `/admin/gigs/${gigId}`,
    })

    let matchedTalentCount = 0
    if (gig.status === "open" && !gig.matchedTalentNotifiedAt) {
      const publicTalentSnap = await db.collection("publicProfiles").where("role", "==", "talent").get()
      const talents: TalentProfile[] = publicTalentSnap.docs.map((talentDoc: any) => {
        const data = talentDoc.data() || {}
        const publicProfile = data.publicProfile || {}
        const talent = data.talent || {}

        return {
          uid: talentDoc.id,
          fullName: data.fullName || "Talent",
          skills: talent.skills || [],
          categories: publicProfile.categories || talent.skills || [],
          sdgTags: data.sdgTags || [],
          location: data.location || "",
          workMode: talent.workMode || data.workMode || "",
          hourlyRate: publicProfile.hourlyRate ?? null,
          rating: data.rating || { avg: 0, count: 0 },
          verification: data.verification || { status: "not_submitted" },
          slug: data.slug,
          roleTitle: talent.roleTitle || "",
          photoURL: publicProfile.photoURL || "",
        }
      })

      const matchedTalents = matchTalentsToGig(talents, gig)
      matchedTalentCount = matchedTalents.length

      for (const talent of matchedTalents) {
        const reasons = buildGigMatchReasons(gig, talent)
        const reasonLine = reasons.length
          ? `We picked this because it matches ${reasons.join(", ")}.`
          : "We picked this because it aligns with your profile and current gig preferences."
        const inAppMessage = reasons.length
          ? `${gig.title} matches ${reasons.slice(0, 2).join(" and ")}. Open it and apply if it fits your availability.`
          : `${gig.title} matches your skills and SDG focus. Open the gig and apply if it fits your availability.`

        await notifyUser({
          userId: talent.uid,
          type: "gig_match",
          title: "A new gig matches your profile",
          message: inAppMessage,
          link: `/dashboard/find-work/${gigId}`,
          emailSubject: `New matching gig: ${gig.title}`,
          emailHtml: buildNotificationEmail({
            title: "A new gig matches your profile",
            message: `${gig.title} just went live on changeworker.<br/><br/>${reasonLine}<br/><br/>Open the gig to review the brief, budget, and timeline, then apply if it is a strong fit for you.`,
            link: `/dashboard/find-work/${gigId}`,
            linkText: "Open matching gig",
          }),
        })
      }

      await gigRef.set(
        {
          matchedTalentNotifiedAt: new Date(),
          matchedTalentNotificationCount: matchedTalentCount,
        },
        { merge: true }
      )
    }

    return NextResponse.json({ success: true, matchedTalentCount })
  } catch (error: any) {
    console.error("new-gig notify error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

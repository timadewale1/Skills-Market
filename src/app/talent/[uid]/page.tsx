"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, getDocs, getDoc, limit, query, where, addDoc, setDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ensureThread } from "@/lib/chat"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { MapPin, Star, ExternalLink } from "lucide-react"
import ReviewsList from "@/components/reviews/ReviewsList"

type PublicProfileBlock = {
  photoURL?: string
  hourlyRate?: number | null
  bio?: string
  portfolio?: Array<{
    id: string
    title: string
    description?: string
    coverUrl?: string
    fileUrl?: string | null
    linkUrl?: string | null
  }>
  socials?: {
    website?: string
    linkedin?: string
    instagram?: string
    twitter?: string
  }
  education?: Array<{
    id: string
    type?: string
    institution?: string
    qualification?: string
    startYear?: string
    endYear?: string
  }>
  certifications?: Array<{
    id: string
    name?: string
    issuer?: string
    year?: string
    linkUrl?: string
    fileUrl?: string
  }>
  employment?: Array<{
    id: string
    jobTitle?: string
    company?: string
    startYear?: string
    endYear?: string
    responsibilities?: string
  }>
}

type PublicTalentDoc = {
  uid: string
  slug?: string
  role?: "talent" | "client"
  fullName: string
  location?: string
  sdgTags?: string[]
  rating?: { avg?: number; count?: number }
  verification?: { status?: string }
  talent?: {
    roleTitle?: string
    skills?: string[]
  }
  publicProfile?: PublicProfileBlock
}

export default function PublicTalentProfilePage() {
  const params = useParams<{ uid: string }>()
  const slug = params?.uid
  const { user } = useAuth()

  const [data, setData] = useState<PublicTalentDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      if (!slug) return
      setLoading(true)

      try {
        // ✅ Fetch directly from publicProfiles by slug
        const qy = query(
          collection(db, "publicProfiles"),
          where("slug", "==", slug),
          where("role", "==", "talent"),
          limit(1)
        )
        const snap = await getDocs(qy)

        if (snap.empty) {
          setData(null)
          setLoading(false)
          return
        }

        const d = snap.docs[0].data() as any

        const mapped: PublicTalentDoc = {
          uid: d.uid,
          slug: d.slug,
          role: d.role,
          fullName: d.fullName || "Unnamed Talent",
          location: d.location || "",
          sdgTags: d.sdgTags || [],
          rating: d.rating || { avg: 0, count: 0 },
          verification: d.verification || { status: "not_submitted" },
          talent: {
            roleTitle: d?.talent?.roleTitle || "",
            skills: d?.talent?.skills || [],
          },
          publicProfile: {
            photoURL: d?.publicProfile?.photoURL || "",
            hourlyRate:
              d?.publicProfile?.hourlyRate === 0
                ? 0
                : d?.publicProfile?.hourlyRate ?? null,
            bio: d?.publicProfile?.bio || "",
            portfolio: Array.isArray(d?.publicProfile?.portfolio)
              ? d.publicProfile.portfolio
              : [],
            socials: d?.publicProfile?.socials || {},
            education: Array.isArray(d?.publicProfile?.education)
              ? d.publicProfile.education
              : [],
            certifications: Array.isArray(d?.publicProfile?.certifications)
              ? d.publicProfile.certifications
              : [],
            employment: Array.isArray(d?.publicProfile?.employment)
              ? d.publicProfile.employment
              : [],
          },
        }

        setData(mapped)
      } catch (e) {
        console.error("Failed to fetch public talent by slug:", e)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [slug])

  const TopNav = user ? <AuthNavbar /> : <Navbar />

  const verified = data?.verification?.status === "verified"
  const ratingAvg = Number(data?.rating?.avg || 0)
  const ratingCount = Number(data?.rating?.count || 0)

  const skills = useMemo(() => data?.talent?.skills || [], [data])
  const portfolio = useMemo(() => data?.publicProfile?.portfolio || [], [data])
  const education = useMemo(() => data?.publicProfile?.education || [], [data])
  const certifications = useMemo(
    () => data?.publicProfile?.certifications || [],
    [data]
  )
  const employment = useMemo(() => data?.publicProfile?.employment || [], [data])

  const socials = data?.publicProfile?.socials || {}

  // load current user's doc for role check
  const [myUserDoc, setMyUserDoc] = useState<any>(null)
  useEffect(() => {
    if (!user?.uid) return
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) setMyUserDoc(snap.data())
      })
      .catch(() => {})
  }, [user?.uid])

  const userRole = myUserDoc?.role

  // Invite & Save functionality (clients only)
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [clientGigs, setClientGigs] = useState<any[]>([])
  const [loadingGigs, setLoadingGigs] = useState(false)
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null)
  const [sendingInvite, setSendingInvite] = useState(false)

  // track whether current client has saved this talent
  const [saved, setSaved] = useState(false)
  const [unsaveOpen, setUnsaveOpen] = useState(false)

  useEffect(() => {
    if (!user?.uid || userRole !== "client" || !data?.uid) return
    getDoc(doc(db, `users/${user.uid}/savedTalents/${data.uid}`))
      .then((snap) => setSaved(snap.exists()))
      .catch(() => {})
  }, [user?.uid, userRole, data?.uid])

  const openInviteModal = async () => {
    if (!user?.uid || userRole !== "client")
      return toast.error("Login as a client to continue")

    // load client's gigs
    setLoadingGigs(true)
    try {
      const q = query(collection(db, "gigs"), where("clientUid", "==", user.uid))
      const snap = await getDocs(q)
      const gigs: any[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      setClientGigs(gigs)
      setInviteOpen(true)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load your gigs")
    } finally {
      setLoadingGigs(false)
    }
  }

  const sendInvite = async () => {
    if (!user?.uid || !selectedGigId || !data) return
    setSendingInvite(true)
    try {
      // fetch gig
      const gigSnap = await getDocs(query(collection(db, "gigs"), where("id", "==", selectedGigId), limit(1)))
      // fallback: read by id
      // ensure thread exists and add initial message
      const clientPP = await getDocs(query(collection(db, "publicProfiles"), where("uid", "==", user.uid), limit(1)))
      const talentPP = await getDocs(query(collection(db, "publicProfiles"), where("uid", "==", data.uid), limit(1)))

      const clientName = clientPP && !clientPP.empty ? (clientPP.docs[0].data() as any).fullName : "Client"
      const gigTitle = (clientGigs.find((g) => g.id === selectedGigId)?.title) || "Gig"

      const threadId = await ensureThread({
        gigId: selectedGigId,
        gigTitle,
        clientUid: user.uid,
        clientName,
        talentUid: data.uid,
        talentName: data.fullName,
      })

      // add initial message
      const initialText = `Hello ${data.fullName}, you have been invited to apply for ${gigTitle} by ${clientName}. Please indicate your interest in this chat.`
      const token = await user.getIdToken()
      await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId,
          text: initialText,
          meta: { type: "gig", gigId: selectedGigId },
        }),
      })

      setInviteOpen(false)
      router.push(`/dashboard/messages/${threadId}`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invite")
    } finally {
      setSendingInvite(false)
    }
  }

  const unsaveTalent = async () => {
    if (!user?.uid || userRole !== "client" || !data) return
    try {
      await deleteDoc(doc(db, `users/${user.uid}/savedTalents/${data.uid}`))
      setSaved(false)
      toast.success("Talent removed from saved")
      setUnsaveOpen(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to unsave talent")
    }
  }

  const saveTalent = async () => {
    if (!user?.uid || userRole !== "client")
      return toast.error("Login as a client to continue")

    try {
      await setDoc(doc(db, `users/${user.uid}/savedTalents/${data!.uid}`), {
        talentUid: data!.uid,
        fullName: data!.fullName,
        photoURL: data!.publicProfile?.photoURL || null,
        createdAt: serverTimestamp(),
      })
      setSaved(true)
      toast.success("Talent saved")
    } catch (err: any) {
      toast.error(err?.message || "Failed to save talent")
    }
  }
  return (
    <div className="min-h-screen bg-[var(--secondary)]">
      {TopNav}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-sm text-gray-600">
              Loading profile...
            </CardContent>
          </Card>
        ) : !data ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-sm text-gray-600">
              Talent not found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT SIDEBAR */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-2xl sticky top-20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-[var(--primary)] overflow-hidden">
                      {data?.publicProfile?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={data.publicProfile.photoURL}
                          alt={data.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (data.fullName || "T").slice(0, 1).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-lg font-extrabold">
                          {data.fullName}
                        </div>
                        <Badge
                          className={`rounded-full ${
                            verified
                              ? "bg-[var(--primary)] text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {verified ? "Verified" : "Not verified"}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-700 font-semibold mt-1">
                        {data?.talent?.roleTitle || "Role title not set"}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <MapPin size={14} />
                        <span>{data.location || "Location not set"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <Star size={14} className="text-[var(--primary)]" />
                        <span className="font-semibold">
                          {ratingAvg ? ratingAvg.toFixed(1) : "-"}
                        </span>
                        <span>({ratingCount || 0})</span>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-gray-500 font-semibold">
                          Hourly rate
                        </div>
                        <div className="text-2xl font-extrabold">
                          {data?.publicProfile?.hourlyRate != null
                            ? `₦${Number(
                                data.publicProfile.hourlyRate
                              ).toLocaleString()}/hr`
                            : "-"}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2">
                        <button
                          onClick={openInviteModal}
                          className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 hover:opacity-90 transition"
                        >
                          Invite to apply
                        </button>
                        {saved ? (
                          <button
                            onClick={() => setUnsaveOpen(true)}
                            className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition text-red-600"
                          >
                            Unsave talent
                          </button>
                        ) : (
                          <button
                            onClick={saveTalent}
                            className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition"
                          >
                            Save talent
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Socials */}
                  <div className="mt-6 space-y-2 text-sm">
                    {socials.website && (
                      <a
                        href={socials.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 font-semibold hover:text-[var(--primary)]"
                      >
                        <ExternalLink size={14} />
                        Website
                      </a>
                    )}
                    {socials.linkedin && (
                      <a
                        href={socials.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 font-semibold hover:text-[var(--primary)]"
                      >
                        <ExternalLink size={14} />
                        LinkedIn
                      </a>
                    )}
                    {socials.instagram && (
                      <a
                        href={socials.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 font-semibold hover:text-[var(--primary)]"
                      >
                        <ExternalLink size={14} />
                        Instagram
                      </a>
                    )}
                    {socials.twitter && (
                      <a
                        href={socials.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 font-semibold hover:text-[var(--primary)]"
                      >
                        <ExternalLink size={14} />
                        Twitter
                      </a>
                    )}
                  </div>

                  {/* SDGs */}
                  <div className="mt-6">
                    <div className="text-sm font-extrabold">SDG focus</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(data.sdgTags || []).slice(0, 10).map((t) => (
                        <span
                          key={t}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                        >
                          {t}
                        </span>
                      ))}
                      {!data.sdgTags?.length && (
                        <div className="text-sm text-gray-600">-</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Invite modal */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogContent className="sm:max-w-2xl rounded-2xl p-6">
                <DialogTitle className="text-xl font-extrabold">Invite talent to apply</DialogTitle>

                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-3">Select one of your open gigs to invite this talent to apply for.</div>

                  {loadingGigs ? (
                    <div className="text-sm text-gray-600">Loading your gigs…</div>
                  ) : clientGigs.length === 0 ? (
                    <div className="text-sm text-gray-600">No gigs found. Create a gig first on your dashboard.</div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-auto">
                      {clientGigs.map((g) => (
                        <label key={g.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                          <input type="radio" name="selectedGig" value={g.id} checked={selectedGigId === g.id} onChange={() => setSelectedGigId(g.id)} />
                          <div>
                            <div className="font-semibold">{g.title}</div>
                            <div className="text-xs text-gray-500">{g.location || "-"}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setInviteOpen(false)} className="rounded-md px-4 py-2 border">Cancel</button>
                    <button onClick={sendInvite} disabled={!selectedGigId || sendingInvite} className="rounded-md px-4 py-2 bg-[var(--primary)] text-white font-semibold">
                      {sendingInvite ? "Sending…" : "Send invitation"}
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Unsave confirmation modal */}
            <Dialog open={unsaveOpen} onOpenChange={setUnsaveOpen}>
              <DialogContent className="sm:max-w-md rounded-2xl p-6">
                <DialogTitle className="text-xl font-extrabold">Remove from saved talents?</DialogTitle>
                <div className="mt-4 text-sm text-gray-600">
                  Are you sure you want to remove this talent from your saved list?
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setUnsaveOpen(false)} className="rounded-md px-4 py-2 border">Cancel</button>
                  <button onClick={unsaveTalent} className="rounded-md px-4 py-2 bg-red-600 text-white font-semibold">
                    Unsave
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            {/* MAIN */}
            <div className="lg:col-span-2 space-y-4">
              {/* Bio */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.03 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 leading-relaxed">
                    {data?.publicProfile?.bio || "No bio yet."}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Skills */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.06 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {skills.length ? (
                      skills.map((s) => (
                        <span
                          key={s}
                          className="text-xs font-semibold px-3 py-2 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">
                        No skills listed yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Portfolio */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.09 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">
                      Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portfolio.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {portfolio.map((w) => (
                          <Card
                            key={w.id}
                            className="rounded-2xl overflow-hidden hover:shadow-md transition"
                          >
                            <CardContent className="p-0">
                              <div className="h-36 bg-orange-50 overflow-hidden">
                                {w.coverUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={w.coverUrl}
                                    alt={w.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-gray-600">
                                    No cover image
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <div className="font-extrabold">{w.title}</div>
                                <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {w.description || "No description."}
                                </div>

                                <div className="mt-3 flex gap-3 text-sm">
                                  {w.linkUrl && (
                                    <a
                                      href={w.linkUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-extrabold text-[var(--primary)] hover:underline"
                                    >
                                      View link
                                    </a>
                                  )}
                                  {w.fileUrl && (
                                    <a
                                      href={w.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-extrabold text-[var(--primary)] hover:underline"
                                    >
                                      View file
                                    </a>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        No portfolio items yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Education */}
              {education.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.12 }}
                >
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base font-extrabold">
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {education.map((e: any) => (
                        <div
                          key={e.id}
                          className="rounded-2xl border bg-white p-4"
                        >
                          <div className="font-extrabold text-gray-900">
                            {e.institution || "Institution"}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {e.qualification || "Qualification"}
                            {e.type ? ` • ${e.type}` : ""}{" "}
                            {e.startYear || e.endYear
                              ? ` • ${e.startYear || "-"} – ${e.endYear || "-"}`
                              : ""}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.15 }}
                >
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base font-extrabold">
                        Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {certifications.map((c: any) => (
                        <div
                          key={c.id}
                          className="rounded-2xl border bg-white p-4 flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="font-extrabold text-gray-900">
                              {c.name || "Certification"}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {[c.issuer, c.year].filter(Boolean).join(" • ")}
                            </div>
                          </div>

                          {(c.fileUrl || c.linkUrl) && (
                            <div className="flex gap-3 text-sm">
                              {c.linkUrl && (
                                <a
                                  href={c.linkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-extrabold text-[var(--primary)] hover:underline"
                                >
                                  Link
                                </a>
                              )}
                              {c.fileUrl && (
                                <a
                                  href={c.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-extrabold text-[var(--primary)] hover:underline"
                                >
                                  File
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Employment */}
              {employment.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.18 }}
                >
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base font-extrabold">
                        Employment history
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {employment.map((j: any) => (
                        <div
                          key={j.id}
                          className="rounded-2xl border bg-white p-4"
                        >
                          <div className="font-extrabold text-gray-900">
                            {j.jobTitle || "Role"}
                            {j.company ? ` • ${j.company}` : ""}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {j.startYear || "-"} – {j.endYear || "-"}
                          </div>
                          {!!j.responsibilities && (
                            <div className="text-sm text-gray-700 mt-2">
                              {j.responsibilities}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* ✅ Reviews */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.21 }}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">
                      Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.uid && <ReviewsList userId={data.uid} />}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


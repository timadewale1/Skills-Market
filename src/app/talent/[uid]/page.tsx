"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, getDocs, limit, query, where } from "firebase/firestore"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { MapPin, Star, ExternalLink } from "lucide-react"

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
                          {ratingAvg ? ratingAvg.toFixed(1) : "—"}
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
                            : "—"}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2">
                        <button className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 hover:opacity-90 transition">
                          Invite to apply (coming soon)
                        </button>
                        <button className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition">
                          Save talent (coming soon)
                        </button>
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
                        <div className="text-sm text-gray-600">—</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

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
                              ? ` • ${e.startYear || "—"} – ${e.endYear || "—"}`
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
                            {j.startYear || "—"} – {j.endYear || "—"}
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

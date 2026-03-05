"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query, where } from "firebase/firestore"

import {
  fetchPublicClientBySlug,
  pickClientAbout,
  pickClientCategories,
  pickClientPhoto,
  pickClientPortfolio,
  pickClientSocials,
  PublicClientProfile,
} from "@/lib/publicClients"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import Link from "next/link"
import { MapPin, ExternalLink, Star, Briefcase } from "lucide-react"

type GigRow = {
  id: string
  title: string
  status: "open" | "closed"
  budgetType?: "hourly" | "fixed"
  hourlyRate?: number | null
  fixedBudget?: number | null
  duration?: string
  workMode?: "Remote" | "Hybrid" | "On-site"
  location?: string
  category?: { group?: string; item?: string }
  createdAt?: any
}

function money(n?: number | null) {
  if (!n) return "—"
  return `₦${Number(n).toLocaleString()}`
}

export default function PublicClientProfilePage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const { user } = useAuth()

  const TopNav = user ? <AuthNavbar /> : <Navbar />

  const [data, setData] = useState<PublicClientProfile | null>(null)
  const [gigs, setGigs] = useState<GigRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      if (!slug) return
      setLoading(true)

      const client = await fetchPublicClientBySlug(slug)
      setData(client)

      if (client?.uid) {
        const qy = query(
          collection(db, "gigs"),
          where("clientUid", "==", client.uid),
          where("status", "==", "open"),
          orderBy("createdAt", "desc")
        )
        const snap = await getDocs(qy)
        setGigs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      }

      setLoading(false)
    }

    run()
  }, [slug])

  const verified = data?.verification?.status === "verified"
  const name = useMemo(() => data?.fullName || "Organization", [data])

  const photoURL = useMemo(() => pickClientPhoto(data), [data])
  const about = useMemo(() => pickClientAbout(data), [data])
  const categories = useMemo(() => pickClientCategories(data), [data])
  const socials = useMemo(() => pickClientSocials(data), [data])
  const portfolio = useMemo(() => pickClientPortfolio(data), [data])

  const ratingAvg = Number(data?.rating?.avg || 0)
  const ratingCount = Number(data?.rating?.count || 0)

  return (
    <div className="min-h-screen bg-[var(--secondary)]">
      {TopNav}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-sm text-gray-600">Loading client...</CardContent>
          </Card>
        ) : !data ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-sm text-gray-600">Client not found.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <Card className="rounded-2xl sticky top-20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-[var(--primary)] overflow-hidden">
                      {photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoURL} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        name.slice(0, 1).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-lg font-extrabold truncate">{name}</div>
                        <Badge className={`rounded-full ${verified ? "bg-[var(--primary)] text-white" : "bg-gray-200 text-gray-700"}`}>
                          {verified ? "Verified" : "Not verified"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <MapPin size={14} />
                        <span>{data.location || "Location not set"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                        <Star size={14} className="text-[var(--primary)]" />
                        <span className="font-semibold">{ratingAvg ? ratingAvg.toFixed(1) : "—"}</span>
                        <span>({ratingCount || 0})</span>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-gray-500 font-semibold">Open gigs</div>
                        <div className="text-2xl font-extrabold">{gigs.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Socials */}
                  <div className="mt-6 space-y-2 text-sm">
                    {socials.website && (
                      <a href={socials.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold hover:text-[var(--primary)]">
                        <ExternalLink size={14} /> Website
                      </a>
                    )}
                    {socials.linkedin && (
                      <a href={socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold hover:text-[var(--primary)]">
                        <ExternalLink size={14} /> LinkedIn
                      </a>
                    )}
                    {socials.instagram && (
                      <a href={socials.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold hover:text-[var(--primary)]">
                        <ExternalLink size={14} /> Instagram
                      </a>
                    )}
                    {socials.twitter && (
                      <a href={socials.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold hover:text-[var(--primary)]">
                        <ExternalLink size={14} /> Twitter/X
                      </a>
                    )}
                  </div>

                  {/* SDGs */}
                  <div className="mt-6">
                    <div className="text-sm font-extrabold">SDG focus</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(data.sdgTags || []).length ? (
                        (data.sdgTags || []).slice(0, 10).map((t) => (
                          <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition">
                            {t}
                          </span>
                        ))
                      ) : (
                        <div className="text-sm text-gray-600">—</div>
                      )}
                    </div>
                  </div>

                  {/* Hire for */}
                  <div className="mt-6">
                    <div className="text-sm font-extrabold">What they hire for</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categories.length ? (
                        categories.slice(0, 12).map((t) => (
                          <span key={t} className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition">
                            {t}
                          </span>
                        ))
                      ) : (
                        <div className="text-sm text-gray-600">—</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* MAIN */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">About</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 whitespace-pre-wrap">
                    {about || "No about yet."}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Portfolio / Past works */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.03 }}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">Past works</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {portfolio.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {portfolio.map((w: any) => (
                          <Card key={w.id} className="rounded-2xl overflow-hidden hover:shadow-md transition">
                            <CardContent className="p-0">
                              <div className="h-36 bg-orange-50 overflow-hidden">
                                {w.coverUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={w.coverUrl} alt={w.title} className="h-full w-full object-cover" />
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
                                    <a href={w.linkUrl} target="_blank" rel="noreferrer" className="font-extrabold text-[var(--primary)] hover:underline">
                                      View link
                                    </a>
                                  )}
                                  {w.fileUrl && (
                                    <a href={w.fileUrl} target="_blank" rel="noreferrer" className="font-extrabold text-[var(--primary)] hover:underline">
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
                      <div className="text-sm text-gray-600">No past works added yet.</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Open gigs */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.06 }}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold flex items-center gap-2">
                      <Briefcase size={16} className="text-[var(--primary)]" />
                      Open gigs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {gigs.length ? (
                      gigs.map((g) => (
                        <Link key={g.id} href={`/dashboard/find-work/${g.id}`} className="block">
                          <div className="rounded-2xl border bg-white p-4 hover:shadow-sm transition">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-extrabold text-gray-900 truncate">{g.title}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {g.category?.group} → {g.category?.item}
                                </div>
                              </div>
                              <span className="text-sm font-extrabold text-[var(--primary)]">View →</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">No open gigs from this client right now.</div>
                    )}
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

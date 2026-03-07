"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { motion } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

import TalentCard, { TalentRow } from "@/components/talent/TalentCard"
import { fetchPublicTalents } from "@/lib/publicProfile"
import { matchTalentsToGig } from "@/lib/matching"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Button from "@/components/ui/Button"

import {
  Briefcase,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Download,
  Sparkles,
  Tag,
  Wallet,
  Pencil,
  Lock,
  Unlock,
  Users,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

type Gig = {
  id: string
  title: string
  status: "open" | "closed"
  category?: { group?: string; item?: string }
  sdgTags?: string[]
  requiredSkills?: string[]
  workMode?: "Remote" | "Hybrid" | "On-site"
  location?: string
  budgetType?: "hourly" | "fixed"
  hourlyRate?: number | null
  fixedBudget?: number | null
  duration?: string
  experienceLevel?: string
  description?: string
  attachments?: { name: string; url: string; size?: number; contentType?: string }[]
  clientName?: string
  clientOrgName?: string
  clientUid?: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.32 },
  }),
}

function money(n?: number | null) {
  if (n === null || n === undefined) return "—"
  return `₦${Number(n).toLocaleString()}`
}

export default function GigDetailsPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { user } = useAuth()

  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)

  const [proposalCount, setProposalCount] = useState<number>(0)
  const [countLoading, setCountLoading] = useState(false)

  const [suggestedTalents, setSuggestedTalents] = useState<TalentRow[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (!id) return
      setLoading(true)
      const snap = await getDoc(doc(db, "gigs", id))
      const gigData = snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Gig) : null
      setGig(gigData)
      setLoading(false)

      // when gig loaded and client, compute suggested talents
      if (gigData && user?.uid) {
        // do not require ownership; suggestions useful to all clients
        setSuggestedLoading(true)
        try {
          const allTalents = await fetchPublicTalents(20)
          const criteria = {
            skills: gigData.requiredSkills,
            categories: gigData.category?.item ? [gigData.category.item] : [],
            sdgTags: gigData.sdgTags,
            workMode: gigData.workMode,
            location: gigData.location,
          }
          const matched = matchTalentsToGig(allTalents, gigData as any)
          const rows: TalentRow[] = matched.slice(0, 8).map((t) => ({
            uid: t.uid,
            slug: t.slug,
            fullName: t.fullName,
            location: t.location,
            roleTitle: t.roleTitle,
            photoURL: t.photoURL,
            hourlyRate: t.hourlyRate,
            skills: t.skills,
            rating: t.rating,
            verification: t.verification,
            workMode: t.workMode,
          }))
          setSuggestedTalents(rows)
        } catch (e) {
          console.error("failed loading talent suggestions", e)
        } finally {
          setSuggestedLoading(false)
        }
      }
    }
    run()
  }, [id])

  // proposal count (simple + reliable)
  useEffect(() => {
    const run = async () => {
      if (!id) return
      setCountLoading(true)
      try {
        const snap = await getDocs(collection(db, "gigs", id, "proposals"))
        setProposalCount(snap.size)
      } catch (e) {
        // ignore; permissions/index etc
      } finally {
        setCountLoading(false)
      }
    }
    run()
  }, [id])

  const budgetLabel = useMemo(() => {
    if (!gig) return "—"
    if (gig.budgetType === "hourly") return `${money(gig.hourlyRate)}/hr`
    if (gig.budgetType === "fixed") return `${money(gig.fixedBudget)} fixed`
    return "—"
  }, [gig])

  const isOwner = useMemo(() => {
    if (!user?.uid || !gig?.clientUid) return false
    return user.uid === gig.clientUid
  }, [user?.uid, gig?.clientUid])

  const handleToggleStatus = async () => {
    if (!gig?.id) return
    if (!isOwner) return toast.error("You don’t have permission to do that.")
    setMutating(true)

    const nextStatus: "open" | "closed" = gig.status === "open" ? "closed" : "open"
    const prev = gig.status
    setGig((g) => (g ? { ...g, status: nextStatus } : g))

    try {
      await updateDoc(doc(db, "gigs", gig.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      })
      toast.success(nextStatus === "closed" ? "Gig closed" : "Gig reopened")
    } catch (e: any) {
      console.error(e)
      setGig((g) => (g ? { ...g, status: prev } : g))
      toast.error(e?.message || "Failed to update gig status")
    } finally {
      setMutating(false)
    }
  }

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">Loading gig...</CardContent>
            </Card>
          ) : !gig ? (
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">Gig not found.</CardContent>
            </Card>
          ) : (
            <>
              <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm font-extrabold text-gray-700 hover:text-[var(--primary)] transition"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                  <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border bg-white">
                    <Sparkles size={16} className="text-[var(--primary)]" />
                    <span className="text-gray-700">Gig details</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate">{gig.title}</h1>
                      <Badge
                        className={`rounded-full ${
                          gig.status === "open" ? "bg-[var(--primary)] text-white" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {gig.status === "open" ? "Open" : "Closed"}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Briefcase size={16} className="text-[var(--primary)]" />
                        {gig.category?.group} → {gig.category?.item}
                      </span>

                      <span className="text-gray-400">•</span>

                      <span className="inline-flex items-center gap-2 font-semibold">
                        <MapPin size={16} className="text-[var(--primary)]" />
                        {gig.workMode === "Remote" ? "Remote" : gig.location || "—"}
                      </span>

                      <span className="text-gray-400">•</span>

                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Wallet size={16} className="text-[var(--primary)]" />
                        {budgetLabel}
                      </span>
                    </div>
                  </div>

                  <div className="md:w-[280px]">
                    <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-gray-700 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center">
                        <ShieldCheck className="text-[var(--primary)]" size={18} />
                      </div>
                      <div>
                        <div className="font-extrabold">Impact-first</div>
                        <div className="text-xs text-gray-500 font-semibold">SDG-aligned matching</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <motion.div initial="hidden" animate="show" variants={fadeUp} custom={1}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-extrabold">Gig description</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {gig.description || "—"}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-extrabold">Required skills</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {(gig.requiredSkills || []).length ? (
                          gig.requiredSkills!.map((s) => (
                            <span
                              key={s}
                              className="text-xs font-semibold px-3 py-2 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <div className="text-sm text-gray-600">—</div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Suggested talents for this gig */}
                  {suggestedTalents.length > 0 && (
                    <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3}>
                      <Card className="rounded-2xl">
                        <CardHeader>
                          <CardTitle className="text-base font-extrabold flex items-center gap-2">
                            <Sparkles size={18} className="text-[var(--primary)]" />
                            Suggested talent
                          </CardTitle>
                          <div className="text-xs text-gray-500 font-semibold">
                            Matches based on gig requirements
                          </div>
                        </CardHeader>
                        <CardContent>
                          {suggestedLoading ? (
                            <div className="text-sm text-gray-600">Loading suggestions...</div>
                          ) : (
                            <div className="overflow-x-auto pb-4">
                              <div className="flex gap-4 min-w-max">
                                {suggestedTalents.map((t, idx) => (
                                  <div key={t.uid} className="w-full sm:w-80 flex-shrink-0">
                                    <Card className="rounded-2xl hover:shadow-md transition bg-white">
                                      <CardContent className="p-5">
                                        <TalentCard t={t} idx={idx} />
                                      </CardContent>
                                    </Card>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {!!gig.attachments?.length && (
                    <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3}>
                      <Card className="rounded-2xl">
                        <CardHeader>
                          <CardTitle className="text-base font-extrabold">Reference materials</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {gig.attachments.map((a, idx) => (
                            <a
                              key={`${a.url}-${idx}`}
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 hover:shadow-sm transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                  <Download size={18} className="text-[var(--primary)]" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-sm text-gray-900 truncate">{a.name}</div>
                                  <div className="text-xs text-gray-500 font-semibold">{a.contentType || "file"}</div>
                                </div>
                              </div>
                              <span className="text-sm font-extrabold text-[var(--primary)] group-hover:underline">Open</span>
                            </a>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-extrabold">Gig summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-semibold">Budget</span>
                          <span className="font-extrabold">{budgetLabel}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-semibold">Work mode</span>
                          <span className="font-extrabold">{gig.workMode || "—"}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-semibold">Duration</span>
                          <span className="font-extrabold inline-flex items-center gap-2">
                            <Clock size={14} className="text-[var(--primary)]" />
                            {gig.duration || "—"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-semibold">Experience</span>
                          <span className="font-extrabold">{gig.experienceLevel || "—"}</span>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-semibold">Proposals</span>
                          <span className="font-extrabold inline-flex items-center gap-2">
                            <Users size={14} className="text-[var(--primary)]" />
                            {countLoading ? "…" : proposalCount}
                          </span>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="text-gray-500 font-semibold">Client</div>
                          <div className="font-extrabold">{gig.clientOrgName || gig.clientName || "—"}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-extrabold flex items-center gap-2">
                          <Tag size={16} className="text-[var(--primary)]" />
                          SDG focus
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {(gig.sdgTags || []).length ? (
                          gig.sdgTags!.map((t) => (
                            <span
                              key={t}
                              className="text-xs font-semibold px-3 py-2 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <div className="text-sm text-gray-600">—</div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial="hidden" animate="show" variants={fadeUp} custom={4}>
                    <Card className="rounded-2xl">
                      <CardContent className="p-6 space-y-3">
                        {isOwner ? (
                          <Link href={`/dashboard/gigs/${gig.id}/proposals`} className="w-full block">
                            <button className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 hover:opacity-90 transition inline-flex items-center justify-center gap-2">
                              <Users size={16} />
                              View proposals
                            </button>
                          </Link>
                        ) : (
                          <div className="text-xs text-gray-500 font-semibold">
                            Proposals are visible only to the gig owner.
                          </div>
                        )}

                        {isOwner && (
                          <>
                            <Link href={`/dashboard/post-gig?edit=${gig.id}`} className="w-full block">
                              <Button variant="outline" className="w-full">
                                <span className="inline-flex items-center gap-2 font-extrabold">
                                  <Pencil size={16} />
                                  Edit gig
                                </span>
                              </Button>
                            </Link>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  disabled={mutating}
                                  className={`w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${
                                    gig.status === "open" ? "text-gray-900" : "text-[var(--primary)]"
                                  }`}
                                >
                                  {gig.status === "open" ? (
                                    <>
                                      <Lock size={16} />
                                      Close gig
                                    </>
                                  ) : (
                                    <>
                                      <Unlock size={16} />
                                      Reopen gig
                                    </>
                                  )}
                                </button>
                              </AlertDialogTrigger>

                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-extrabold">
                                    {gig.status === "open" ? "Close this gig?" : "Reopen this gig?"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {gig.status === "open"
                                      ? "Closing a gig stops new proposals from coming in. You can reopen it later."
                                      : "Reopening a gig allows new proposals again."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl" variant="outline">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="rounded-xl bg-[var(--primary)] text-white"
                                    onClick={handleToggleStatus}
                                  >
                                    {gig.status === "open" ? "Close gig" : "Reopen gig"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}

                        <Link
                          href="/dashboard/gigs"
                          className="block text-center text-sm font-extrabold text-gray-700 hover:text-[var(--primary)] transition"
                        >
                          Back to gigs
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}

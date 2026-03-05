"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db, storage } from "@/lib/firebase"
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { motion } from "framer-motion"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

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
  Bookmark,
  Send,
  X,
  Paperclip,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"

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
  createdAt?: any
}

type Proposal = {
  gigId: string
  talentUid: string
  talentName?: string
  talentEmail?: string
  status: "submitted" | "withdrawn" | "accepted" | "rejected" | "shortlisted"
  coverLetter: string
  proposedRate?: number | null
  duration?: string
  attachments?: { name: string; url: string; size?: number; contentType?: string }[]
  viewedAt?: any | null
  createdAt?: any
  updatedAt?: any
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

function budgetLabel(gig: Gig) {
  if (gig.budgetType === "hourly") return `${money(gig.hourlyRate)}/hr`
  if (gig.budgetType === "fixed") return `${money(gig.fixedBudget)} fixed`
  return "—"
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_")
}

export default function TalentGigDetailsPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { user } = useAuth()

  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)

  // Save gig
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Proposal state
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [proposalLoading, setProposalLoading] = useState(true)

  // Apply modal
  const [applyOpen, setApplyOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [proposedRate, setProposedRate] = useState<string>("")
  const [proposalDuration, setProposalDuration] = useState<string>("")

  const [clientProfile, setClientProfile] = useState<any | null>(null)

  const fileRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploaded, setUploaded] = useState<Proposal["attachments"]>([])

  const budget = useMemo(() => (gig ? budgetLabel(gig) : "—"), [gig])

  useEffect(() => {
    const run = async () => {
      if (!id || !user?.uid) return
      setLoading(true)
      setProposalLoading(true)

      // gig
      const snap = await getDoc(doc(db, "gigs", id))
      if (!snap.exists()) {
        setGig(null)
        setLoading(false)
        setProposalLoading(false)
        return
      }

      const g = { id: snap.id, ...(snap.data() as any) } as Gig
      setGig(g)

      // client public profile for link
      if (g.clientUid) {
        const cps = await getDoc(doc(db, "publicProfiles", g.clientUid))
        setClientProfile(cps.exists() ? cps.data() : null)
      }

      // saved?
      const savedSnap = await getDoc(doc(db, "users", user.uid, "savedGigs", id))
      setSaved(savedSnap.exists())

      // proposal?
      const propSnap = await getDoc(doc(db, "gigs", id, "proposals", user.uid))
      setProposal(propSnap.exists() ? ((propSnap.data() as any) as Proposal) : null)

      setLoading(false)
      setProposalLoading(false)
    }

    run()
  }, [id, user?.uid])

  const canApply = !!gig && gig.status === "open" && !!user?.uid

  const canEditProposal = useMemo(() => {
    if (!proposal) return false
    return proposal.status === "submitted" && !proposal.viewedAt
  }, [proposal])

  const handleToggleSave = async () => {
    if (!user?.uid || !id) return
    setSaving(true)
    try {
      if (saved) {
        await deleteDoc(doc(db, "users", user.uid, "savedGigs", id))
        setSaved(false)
      } else {
        await setDoc(doc(db, "users", user.uid, "savedGigs", id), {
          gigId: id,
          createdAt: serverTimestamp(),
        })
        setSaved(true)
      }
    } finally {
      setSaving(false)
    }
  }

  const resetApplyForm = () => {
    setCoverLetter("")
    setProposedRate("")
    setProposalDuration("")
    setFiles([])
    setUploaded([])
    if (fileRef.current) fileRef.current.value = ""
  }

  const openProposalModal = (mode: "create" | "view" | "edit") => {
    if (mode === "create") {
      resetApplyForm()
    } else {
      setCoverLetter(proposal?.coverLetter || "")
      setProposedRate(proposal?.proposedRate ? String(proposal.proposedRate) : "")
      setProposalDuration(proposal?.duration || "")
      setUploaded(proposal?.attachments || [])
      setFiles([])
      if (fileRef.current) fileRef.current.value = ""
    }
    setApplyOpen(true)
  }

  const handlePickFiles = (list: FileList | null) => {
    if (!list) return
    const next = Array.from(list).slice(0, 6)
    setFiles(next)
  }

  const uploadSelectedFiles = async (): Promise<Proposal["attachments"]> => {
    if (!user?.uid || !id) return []
    if (!files.length) return []

    const out: Proposal["attachments"] = []
    for (const f of files) {
      const path = `users/${user.uid}/proposals/${id}/${Date.now()}_${safeFileName(f.name)}`
      const storageRef = ref(storage, path)
      const res = await uploadBytes(storageRef, f, { contentType: f.type || "application/octet-stream" })
      const url = await getDownloadURL(res.ref)
      out.push({ name: f.name, url, size: f.size, contentType: f.type })
    }
    return out
  }

  const handleSubmitProposal = async () => {
    if (!user?.uid || !id || !gig) return
    if (!coverLetter.trim()) return alert("Please add a cover letter.")

    setSubmitting(true)
    try {
      const newlyUploaded = await uploadSelectedFiles()
      const allAttachments = [...(uploaded || []), ...(newlyUploaded || [])]

      const rateNum =
        proposedRate.trim() === "" ? null : Number(proposedRate.trim().replace(/[^\d]/g, ""))

      const payload: Proposal = {
        gigId: id,
        talentUid: user.uid,
        talentEmail: user.email || "",
        status: "submitted",
        coverLetter: coverLetter.trim(),
        proposedRate: Number.isFinite(rateNum as any) ? rateNum : null,
        duration: proposalDuration.trim(),
        attachments: allAttachments,
        updatedAt: serverTimestamp(),
        viewedAt: proposal?.viewedAt || null,
      }

      // createAt only on first submit
      if (!proposal?.createdAt) (payload as any).createdAt = serverTimestamp()

      await setDoc(doc(db, "gigs", id, "proposals", user.uid), payload, { merge: true })

      await setDoc(
        doc(db, "users", user.uid, "proposals", id),
        {
          gigId: id,
          status: "submitted",
          updatedAt: serverTimestamp(),
          createdAt: proposal?.createdAt || serverTimestamp(),
          title: gig.title,
          clientUid: gig.clientUid || null,
        },
        { merge: true }
      )

      setProposal({
        ...(proposal || {}),
        ...payload,
        attachments: allAttachments,
      })
      setApplyOpen(false)
      resetApplyForm()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Failed to submit proposal.")
    } finally {
      setSubmitting(false)
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
              {/* Header */}
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

                      <Badge className={`rounded-full ${gig.status === "open" ? "bg-[var(--primary)] text-white" : "bg-gray-200 text-gray-700"}`}>
                        {gig.status === "open" ? "Open" : "Closed"}
                      </Badge>

                      {proposal?.status === "submitted" && (
                        <Badge className="rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                          Applied
                        </Badge>
                      )}
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
                        {budget}
                      </span>
                    </div>
                  </div>

                  <div className="md:w-[320px]">
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

              {/* Body */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* MAIN */}
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
                            <span key={s} className="text-xs font-semibold px-3 py-2 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition">
                              {s}
                            </span>
                          ))
                        ) : (
                          <div className="text-sm text-gray-600">—</div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

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
                              <span className="text-sm font-extrabold text-[var(--primary)] group-hover:underline">
                                Open
                              </span>
                            </a>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {proposal?.status === "submitted" && (
                    <motion.div initial="hidden" animate="show" variants={fadeUp} custom={4}>
                      <Card className="rounded-2xl border-orange-200">
                        <CardHeader>
                          <CardTitle className="text-base font-extrabold flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-[var(--primary)]" />
                            Your proposal
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-700">
                          <div className="rounded-2xl border bg-white p-4 whitespace-pre-wrap">
                            {proposal.coverLetter}
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-xs font-semibold text-gray-500">Rate</div>
                            <div className="font-extrabold">
                              {proposal.proposedRate ? `₦${proposal.proposedRate.toLocaleString()}/hr` : "—"}
                            </div>

                            <div className="text-xs font-semibold text-gray-500 ml-4">Duration</div>
                            <div className="font-extrabold">{proposal.duration || "—"}</div>

                            <Badge className="rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                              Submitted
                            </Badge>

                            {!!proposal.viewedAt && (
                              <Badge className="rounded-full bg-gray-100 text-gray-800 border">
                                Viewed by client
                              </Badge>
                            )}
                          </div>

                          {!!proposal.attachments?.length && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-gray-500">Attachments</div>
                              <div className="space-y-2">
                                {proposal.attachments.map((a, i) => (
                                  <a
                                    key={a.url + i}
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 hover:shadow-sm transition"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Paperclip size={16} className="text-[var(--primary)]" />
                                      <div className="truncate font-semibold">{a.name}</div>
                                    </div>
                                    <span className="text-sm font-extrabold text-[var(--primary)]">Open</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>

                {/* SIDEBAR */}
                <div className="space-y-4">
                  <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2}>
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-extrabold">Gig summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-semibold">Budget</span>
                          <span className="font-extrabold">{budget}</span>
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

                        <div className="space-y-2">
                          <div className="text-gray-500 font-semibold">Client</div>
                          <div className="font-extrabold">
                            {clientProfile?.slug ? (
                              <Link
                                href={`/clients/${clientProfile.slug}`}
                                className="inline-flex items-center gap-2 hover:text-[var(--primary)] transition underline-offset-4 hover:underline"
                              >
                                {gig.clientOrgName || gig.clientName || "Client"}
                                <ExternalLink size={14} />
                              </Link>
                            ) : (
                              <span>{gig.clientOrgName || gig.clientName || "—"}</span>
                            )}
                          </div>
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
                            <span key={t} className="text-xs font-semibold px-3 py-2 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition">
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
                        <button
                          disabled={!canApply}
                          onClick={() => openProposalModal(proposal ? "view" : "create")}
                          className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          <Send size={16} />
                          {proposal ? "View proposal" : "Apply now"}
                        </button>

                        <button
                          disabled={!canEditProposal}
                          onClick={() => openProposalModal("edit")}
                          className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                          title={!canEditProposal ? "Edit disabled after client views your proposal." : ""}
                        >
                          Edit proposal
                        </button>

                        <button
                          onClick={handleToggleSave}
                          disabled={saving}
                          className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                        >
                          <Bookmark size={16} className={saved ? "text-[var(--primary)]" : "text-gray-700"} />
                          {saved ? "Saved" : "Save gig"}
                        </button>

                        <Link
                          href="/dashboard/find-work"
                          className="block text-center text-sm font-extrabold text-gray-700 hover:text-[var(--primary)] transition"
                        >
                          Back to gigs
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>

              {/* APPLY MODAL */}
              {applyOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl overflow-hidden"
                  >
                    <div className="p-5 border-b flex items-center justify-between">
                      <div>
                        <div className="text-lg font-extrabold">
                          {proposal ? "Your proposal" : "Apply to gig"}
                        </div>
                        <div className="text-xs text-gray-500 font-semibold mt-1">
                          {proposal
                            ? (proposal.viewedAt ? "Client has viewed your proposal (editing locked)." : "You can edit until the client views it.")
                            : "Your proposal will be sent to the client."}
                        </div>
                      </div>

                      <button
                        onClick={() => setApplyOpen(false)}
                        className="h-10 w-10 rounded-xl border bg-white flex items-center justify-center hover:shadow-sm transition"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                      <div className="rounded-2xl border bg-[var(--secondary)] p-4">
                        <div className="text-sm font-extrabold">{gig.title}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Budget: <span className="font-semibold">{budget}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-extrabold">Cover letter</div>
                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          disabled={proposal ? !canEditProposal : false}
                          placeholder="Introduce yourself, highlight relevant work, and explain how you’ll deliver this gig."
                          className="mt-2 w-full min-h-[140px] rounded-2xl border bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-sm font-extrabold">Proposed hourly rate (optional)</div>
                          <Input
                            value={proposedRate}
                            onChange={(e) => setProposedRate(e.target.value)}
                            disabled={proposal ? !canEditProposal : false}
                            placeholder="e.g. 25000"
                            className="rounded-2xl mt-2 disabled:opacity-60"
                          />
                        </div>

                        <div>
                          <div className="text-sm font-extrabold">Your duration</div>
                          <Input
                            value={proposalDuration}
                            onChange={(e) => setProposalDuration(e.target.value)}
                            disabled={proposal ? !canEditProposal : false}
                            placeholder="e.g. 2 weeks"
                            className="rounded-2xl mt-2 disabled:opacity-60"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-extrabold">Attachments (optional)</div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            ref={fileRef}
                            type="file"
                            multiple
                            onChange={(e) => handlePickFiles(e.target.files)}
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                            disabled={proposal ? !canEditProposal : false}
                          />
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={proposal ? !canEditProposal : false}
                            className="rounded-2xl border bg-white px-4 py-2 text-sm font-extrabold hover:shadow-sm transition inline-flex items-center gap-2 disabled:opacity-60"
                          >
                            <Paperclip size={16} />
                            Add files
                          </button>
                          <div className="text-xs text-gray-500 font-semibold">up to 6 files</div>
                        </div>

                        {!!files.length && (
                          <div className="mt-3 space-y-2">
                            {files.map((f, idx) => (
                              <div key={f.name + idx} className="flex items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-extrabold truncate">{f.name}</div>
                                  <div className="text-xs text-gray-500 font-semibold">{Math.round(f.size / 1024)} KB</div>
                                </div>
                                <button
                                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-sm font-extrabold text-gray-600 hover:text-[var(--primary)] transition"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {!!uploaded?.length && (
                          <div className="mt-3 space-y-2">
                            <div className="text-xs text-gray-500 font-semibold">Uploaded</div>
                            {uploaded.map((a, i) => (
                              <a
                                key={a.url + i}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 hover:shadow-sm transition"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Paperclip size={16} className="text-[var(--primary)]" />
                                  <div className="truncate font-semibold">{a.name}</div>
                                </div>
                                <span className="text-sm font-extrabold text-[var(--primary)]">Open</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 border-t flex flex-col md:flex-row md:items-center gap-3">
                      <button
                        onClick={() => setApplyOpen(false)}
                        className="w-full md:w-auto rounded-2xl border bg-white px-5 py-2 text-sm font-extrabold hover:shadow-sm transition"
                      >
                        Close
                      </button>

                      <button
                        disabled={submitting || (proposal ? !canEditProposal : false)}
                        onClick={handleSubmitProposal}
                        className="w-full md:flex-1 rounded-2xl bg-[var(--primary)] text-white px-5 py-2 text-sm font-extrabold hover:opacity-90 transition disabled:opacity-60"
                      >
                        {proposal ? "Save changes" : (submitting ? "Submitting..." : "Submit proposal")}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}

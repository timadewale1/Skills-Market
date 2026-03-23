"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db, storage } from "@/lib/firebase"
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { ensureThread } from "@/lib/chat"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import toast from "react-hot-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Button from "@/components/ui/Button"

import {
  ArrowLeft,
  Lock,
  Unlock,
  Paperclip,
  Save,
  Send,
  ExternalLink,
} from "lucide-react"

type Gig = {
  id: string
  title: string
  status: "open" | "closed"
  budgetType?: "hourly" | "fixed"
  hourlyRate?: number | null
  fixedBudget?: number | null
  duration?: string
  clientUid?: string
  clientName?: string
  clientOrgName?: string
}

type Proposal = {
  gigId: string
  talentUid: string
  talentName?: string
  talentEmail?: string
  status: "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn"
  coverLetter: string
  proposedRate?: number | null
  proposedDuration?: string | null
  attachments?: { name: string; url: string; size?: number; contentType?: string }[]
  createdAt?: any
  updatedAt?: any
  viewedAt?: any | null
  threadId?: string | null
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_")
}

function money(n?: number | null) {
  if (n === null || n === undefined) return "-"
  return `₦${Number(n).toLocaleString()}`
}

function gigBudgetLabel(g: Gig) {
  if (g.budgetType === "hourly") return `${money(g.hourlyRate)}/hr`
  if (g.budgetType === "fixed") return `${money(g.fixedBudget)} fixed`
  return "-"
}

export default function ProposalDetailPage() {
  const { user } = useAuth()
  const params = useParams<{ gigId: string }>()
  const gigId = params?.gigId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [gig, setGig] = useState<Gig | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)

  // editable fields
  const [coverLetter, setCoverLetter] = useState("")
  const [proposedRate, setProposedRate] = useState<string>("")
  const [proposedDuration, setProposedDuration] = useState<string>("")

  // uploads
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploaded, setUploaded] = useState<Proposal["attachments"]>([])

  useEffect(() => {
    const run = async () => {
      if (!user?.uid || !gigId) return
      setLoading(true)

      const gSnap = await getDoc(doc(db, "gigs", gigId))
      const g = gSnap.exists() ? ({ id: gSnap.id, ...(gSnap.data() as any) } as Gig) : null
      setGig(g)

      const pSnap = await getDoc(doc(db, "gigs", gigId, "proposals", user.uid))
      const p = pSnap.exists() ? (pSnap.data() as any as Proposal) : null
      setProposal(p)

      // hydrate form
      setCoverLetter(p?.coverLetter || "")
      setProposedRate(p?.proposedRate ? String(p.proposedRate) : "")
      setProposedDuration(p?.proposedDuration ? String(p.proposedDuration) : "")
      setUploaded(p?.attachments || [])

      setLoading(false)
    }

    run()
  }, [user?.uid, gigId])

  const locked = useMemo(() => {
    // edits lock once client views it (viewedAt exists)
    return !!proposal?.viewedAt
  }, [proposal?.viewedAt])

  const effectiveRateLabel = useMemo(() => {
    if (!gig) return "-"
    const pRate =
      proposedRate.trim() === ""
        ? null
        : Number(proposedRate.trim().replace(/[^\d]/g, ""))
    if (pRate && Number.isFinite(pRate)) {
      return gig.budgetType === "fixed" ? `${money(pRate)} fixed` : `${money(pRate)}/hr`
    }
    // fallback to client gig budget
    return gigBudgetLabel(gig)
  }, [gig, proposedRate])

  const effectiveDurationLabel = useMemo(() => {
    if (proposedDuration.trim()) return proposedDuration.trim()
    return gig?.duration || "-"
  }, [proposedDuration, gig?.duration])

  const handlePickFiles = (list: FileList | null) => {
    if (!list) return
    const next = Array.from(list).slice(0, 6)
    setFiles(next)
  }

  const uploadSelectedFiles = async (): Promise<Proposal["attachments"]> => {
    if (!user?.uid || !gigId) return []
    if (!files.length) return []

    const out: Proposal["attachments"] = []
    for (const f of files) {
      const path = `users/${user.uid}/proposals/${gigId}/${Date.now()}_${safeFileName(f.name)}`
      const storageRef = ref(storage, path)
      const res = await uploadBytes(storageRef, f, {
        contentType: f.type || "application/octet-stream",
      })
      const url = await getDownloadURL(res.ref)
      out.push({ name: f.name, url, size: f.size, contentType: f.type })
    }
    return out
  }

  const saveEdits = async () => {
    if (!user?.uid || !gigId || !proposal) return
    if (locked) return toast.error("This proposal has been viewed by the client. Editing is locked.")

    if (!coverLetter.trim()) return toast.error("Cover letter cannot be empty.")

    setSaving(true)
    try {
      const uploadedFiles = await uploadSelectedFiles()
      const nextAttachments = [...(uploaded ?? []), ...(uploadedFiles ?? [])]

      const rateNum =
        proposedRate.trim() === "" ? null : Number(proposedRate.trim().replace(/[^\d]/g, ""))

      const payload: Partial<Proposal> = {
        coverLetter: coverLetter.trim(),
        proposedRate: Number.isFinite(rateNum as any) ? rateNum : null,
        proposedDuration: proposedDuration.trim() ? proposedDuration.trim() : null,
        attachments: nextAttachments,
        updatedAt: serverTimestamp(),
      }

      // Update main proposal doc (rules enforce viewedAt == null for talent updates)
      await updateDoc(doc(db, "gigs", gigId, "proposals", user.uid), payload as any)

      // Keep user index fresh
      await setDoc(
        doc(db, "users", user.uid, "proposals", gigId),
        { updatedAt: serverTimestamp() },
        { merge: true }
      )

      setFiles([])
      if (fileRef.current) fileRef.current.value = ""
      setUploaded(nextAttachments)

      // refresh local proposal
      setProposal((p) => (p ? ({ ...p, ...(payload as any) } as Proposal) : p))

      toast.success("Proposal updated")
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to update proposal")
    } finally {
      setSaving(false)
    }
  }

  const withdrawProposal = async () => {
  if (!user?.uid || !gigId || !proposal) return

  // Under your current rules, talent can only update if viewedAt == null.
  // If you WANT to allow withdraw even after viewed, we’ll tweak rules later.
  if (proposal.viewedAt) {
    toast.error("You can’t withdraw after the client has viewed it.")
    return
  }

  setSaving(true)
  try {
    await updateDoc(doc(db, "gigs", gigId, "proposals", user.uid), {
      status: "withdrawn",
      updatedAt: serverTimestamp(),
    })

    await setDoc(
      doc(db, "users", user.uid, "proposals", gigId),
      { status: "withdrawn", updatedAt: serverTimestamp() },
      { merge: true }
    )

    setProposal((p) => (p ? ({ ...p, status: "withdrawn" } as any) : p))
    toast.success("Proposal withdrawn")
  } catch (e: any) {
    console.error(e)
    toast.error(e?.message || "Failed to withdraw")
  } finally {
    setSaving(false)
  }
}


  const accepted = (proposal?.status || "submitted") === "accepted"
  const hasThread = !!proposal?.threadId

  const canStartChat = accepted && !hasThread
  const canGoChat = hasThread

  const startChat = async () => {
    if (!user?.uid || !gigId || !proposal) return
    try {
      // need gig + client info to create thread
      const gigSnap = await getDoc(doc(db, "gigs", gigId))
      if (!gigSnap.exists()) return toast.error("Gig not found")

      const gig = gigSnap.data() as any
      if (!gig?.clientUid) return toast.error("Missing client info")

      const threadId = await ensureThread({
        gigId,
        gigTitle: gig.title || "Gig",
        clientUid: gig.clientUid,
        clientName: gig.clientName || gig.clientOrgName || "Client",
        clientSlug: gig.clientSlug || null,

        talentUid: user.uid,
        talentName: user.displayName || "Talent",
        talentSlug: null,

        initialProposalStatus: "accepted",
      })

      // store threadId on proposal so UI can show "Go to chat" forever
      await updateDoc(doc(db, "gigs", gigId, "proposals", user.uid), {
        threadId,
        updatedAt: serverTimestamp(),
      })

      await setDoc(
        doc(db, "users", user.uid, "proposals", gigId),
        { threadId, updatedAt: serverTimestamp() },
        { merge: true }
      )

      router.push(`/dashboard/messages/${threadId}`)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to start chat")
    }
  }

  const goToChat = () => {
    if (!proposal?.threadId) return
    router.push(`/dashboard/messages/${proposal.threadId}`)
  }


  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm font-extrabold text-gray-700 hover:text-[var(--primary)] transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <div className="text-xl md:text-2xl font-extrabold truncate">
                  {gig?.title || "Proposal"}
                </div>
                {proposal?.status && (
                  <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    {proposal.status}
                  </Badge>
                )}

                {locked ? (
                  <Badge className="rounded-full bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
                    <Lock size={14} /> Editing locked
                  </Badge>
                ) : (
                  <Badge className="rounded-full bg-green-100 text-green-800 border border-green-200 inline-flex items-center gap-1">
                    <Unlock size={14} /> Editable
                  </Badge>
                )}
              </div>

              <div className="mt-2 text-sm text-gray-600 font-semibold">
                Rate: <span className="text-gray-900">{effectiveRateLabel}</span> • Duration:{" "}
                <span className="text-gray-900">{effectiveDurationLabel}</span>
              </div>
            </div>

            <div className="hidden md:flex md:flex-wrap md:justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => router.push(`/dashboard/find-work/${gigId}`)}
              >
                <span className="inline-flex items-center gap-2 font-extrabold">
                  <ExternalLink size={16} />
                  View gig
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main */}
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">Loading…</CardContent>
                </Card>
              ) : !proposal ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">
                    Proposal not found.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base font-extrabold">Cover letter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        disabled={locked}
                        className="w-full min-h-[220px] rounded-2xl border bg-white p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-70"
                        placeholder="Your cover letter…"
                      />
                      <div className="mt-2 text-xs text-gray-500 font-semibold">
                        Editing locks after the client views your proposal.
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base font-extrabold">Proposed terms</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-sm font-extrabold">
                          Proposed rate (optional)
                          <span className="ml-2 text-xs text-gray-500 font-semibold">
                            (fallback to gig budget)
                          </span>
                        </div>
                        <Input
                          value={proposedRate}
                          onChange={(e) => setProposedRate(e.target.value)}
                          disabled={locked}
                          placeholder={gig ? gigBudgetLabel(gig) : "e.g. 25000"}
                          className="rounded-2xl mt-2"
                        />
                      </div>

                      <div>
                        <div className="text-sm font-extrabold">
                          Proposed duration (optional)
                          <span className="ml-2 text-xs text-gray-500 font-semibold">
                            (fallback to gig duration)
                          </span>
                        </div>
                        <Input
                          value={proposedDuration}
                          onChange={(e) => setProposedDuration(e.target.value)}
                          disabled={locked}
                          placeholder={gig?.duration || "e.g. 1–3 months"}
                          className="rounded-2xl mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base font-extrabold">Attachments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileRef}
                          type="file"
                          multiple
                          onChange={(e) => handlePickFiles(e.target.files)}
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                          disabled={locked}
                        />
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={locked}
                          className="rounded-2xl border bg-white px-4 py-2 text-sm font-extrabold hover:shadow-sm transition inline-flex items-center gap-2 disabled:opacity-60"
                        >
                          <Paperclip size={16} />
                          Add files
                        </button>
                        <div className="text-xs text-gray-500 font-semibold">
                          up to 6 files
                        </div>
                      </div>

                      {!!files.length && (
                        <div className="space-y-2">
                          {files.map((f, idx) => (
                            <div
                              key={f.name + idx}
                              className="flex items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold truncate">{f.name}</div>
                                <div className="text-xs text-gray-500 font-semibold">
                                  {Math.round(f.size / 1024)} KB
                                </div>
                              </div>
                              {!locked && (
                                <button
                                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-sm font-extrabold text-gray-600 hover:text-[var(--primary)] transition"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <Separator />

                      {!!uploaded?.length ? (
                        <div className="space-y-2">
                          {uploaded.map((a, i) => (
                            <a
                              key={a.url + i}
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3 hover:shadow-sm transition"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold truncate">{a.name}</div>
                                <div className="text-xs text-gray-500 font-semibold">
                                  {a.contentType || "file"}
                                </div>
                              </div>
                              <span className="text-sm font-extrabold text-[var(--primary)]">Open</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">No attachments.</div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={saveEdits}
                    disabled={loading || saving || locked || !proposal}
                    className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 hover:opacity-90 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save edits"}
                  </button>

                  <button
                    onClick={withdrawProposal}
                    disabled={loading || saving || !proposal || !!proposal?.viewedAt || proposal?.status === "withdrawn"}
                    className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition disabled:opacity-60"
                  >
                    Withdraw proposal
                  </button>

                  {accepted && (
                    <div className="rounded-2xl border bg-[var(--secondary)] p-4 text-sm text-gray-700">
                      <div className="font-extrabold">✅ Proposal accepted</div>
                      <div className="text-xs text-gray-600 font-semibold mt-1">
                        Client has accepted your proposal - you can start a conversation.
                      </div>

                      <div className="mt-3">
                        {canStartChat ? (
                          <button
                            onClick={startChat}
                            className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 inline-flex items-center justify-center gap-2"
                          >
                            Message client
                          </button>
                        ) : canGoChat ? (
                          <button
                            onClick={goToChat}
                            className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition"
                          >
                            Go to chat
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 font-semibold">
                    If the client has viewed your proposal, edits are locked automatically.
                  </div>
                </CardContent>
              </Card>

              {gig && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">Gig snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-semibold">Status</span>
                      <span className="font-extrabold">{gig.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-semibold">Budget</span>
                      <span className="font-extrabold">{gigBudgetLabel(gig)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-semibold">Duration</span>
                      <span className="font-extrabold">{gig.duration || "-"}</span>
                    </div>
                    <Separator />
                    <div>
                      <div className="text-gray-500 font-semibold">Client</div>
                      <div className="font-extrabold">
                        {gig.clientOrgName || gig.clientName || "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}

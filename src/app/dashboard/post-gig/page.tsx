"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import toast from "react-hot-toast"

import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { nanoid } from "nanoid"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

import { hireCategories } from "@/data/navCategories"
import { SDGS } from "@/data/sdgs"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import Button from "@/components/ui/Button"
import { Briefcase, MapPin, Sparkles, ArrowRight, X, Paperclip, FileText, Image as ImageIcon, Trash2 } from "lucide-react"

type Role = "talent" | "client"

type UserDoc = {
  role?: Role
  fullName?: string
  client?: { orgName?: string }
}

const WORK_MODE = ["Remote", "Hybrid", "On-site"] as const
const BUDGET_TYPE = ["hourly", "fixed"] as const
const DURATION = ["Less than 1 month", "1–3 months", "3–6 months", "6+ months"] as const
const EXP_LEVEL = ["Entry", "Intermediate", "Expert"] as const

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.35 },
  }),
}

function cleanCsv(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function PostGigPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useAuth()

  const editId = params.get("edit") // gigId when editing

  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // editing
  const [editing, setEditing] = useState(false)
  const [loadingGig, setLoadingGig] = useState(false)
  const [existingAttachments, setExistingAttachments] = useState<
    { name: string; url: string; size?: number; contentType?: string }[]
  >([])
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([])

  // form
  const [title, setTitle] = useState("")
  const [categoryGroup, setCategoryGroup] = useState(hireCategories[0]?.title || "")
  const [categoryItem, setCategoryItem] = useState(hireCategories[0]?.items?.[0] || "")
  const [location, setLocation] = useState("")
  const [workMode, setWorkMode] = useState<(typeof WORK_MODE)[number]>("Remote")

  const [budgetType, setBudgetType] = useState<(typeof BUDGET_TYPE)[number]>("hourly")
  const [hourlyRate, setHourlyRate] = useState<string>("")
  const [fixedBudget, setFixedBudget] = useState<string>("")

  const [duration, setDuration] = useState<(typeof DURATION)[number]>("1–3 months")
  const [experienceLevel, setExperienceLevel] = useState<(typeof EXP_LEVEL)[number]>("Intermediate")

  const [requiredSkillsInput, setRequiredSkillsInput] = useState("")
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])

  const [sdgTags, setSdgTags] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<"open" | "closed" | "draft">("open")

  const [submitting, setSubmitting] = useState(false)
  
  type GigAttachment = {
    name: string
    url: string
    path: string
    size: number
    contentType: string
  }

  const [attachments, setAttachments] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  // load user role
  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoadingProfile(true)
      const snap = await getDoc(doc(db, "users", user.uid))
      const d = (snap.data() as UserDoc) || null
      setProfile(d)
      setLoadingProfile(false)

      // client-only
      if (d?.role && d.role !== "client") {
        toast.error("Only clients/organizations can post gigs.")
        router.push("/dashboard")
      }
    }
    run()
  }, [user?.uid, router])

  // load gig for editing
  useEffect(() => {
    const run = async () => {
      if (!editId) return
      setEditing(true)
      setLoadingGig(true)

      const snap = await getDoc(doc(db, "gigs", editId))
      if (!snap.exists()) {
        setLoadingGig(false)
        toast.error("Gig not found")
        router.push("/dashboard/gigs")
        return
      }

      const d: any = snap.data()

      // ✅ Owner guard
      if (d?.clientUid !== user?.uid) {
        setLoadingGig(false)
        toast.error("You don't have permission to edit this gig")
        router.push("/dashboard/gigs")
        return
      }

      // ✅ Prefill form state
      setTitle(d.title || "")
      setDescription(d.description || "")
      setWorkMode(d.workMode || "Remote")
      setLocation(d.location || "")
      setDuration(d.duration || "1–3 months")
      setExperienceLevel(d.experienceLevel || "Intermediate")
      setBudgetType(d.budgetType || "hourly")
      setHourlyRate(d.hourlyRate ? String(d.hourlyRate) : "")
      setFixedBudget(d.fixedBudget ? String(d.fixedBudget) : "")
      setRequiredSkills(d.requiredSkills || [])
      setSdgTags(d.sdgTags || [])
      setCategoryGroup(d?.category?.group || "")
      setCategoryItem(d?.category?.item || "")
      setStatus(d.status || "open")

      setExistingAttachments(d.attachments || [])
      setAttachmentsToRemove([])

      setLoadingGig(false)
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, user?.uid])

  // keep item list in sync with group
  const groupItems = useMemo(() => {
    const g = hireCategories.find((x) => x.title === categoryGroup)
    return g?.items || []
  }, [categoryGroup])

  useEffect(() => {
    // when group changes, default to first item
    if (!groupItems.includes(categoryItem)) {
      setCategoryItem(groupItems[0] || "")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryGroup])

  const addSkillsFromInput = () => {
    const next = cleanCsv(requiredSkillsInput)
    if (!next.length) return
    setRequiredSkills((prev) => {
      const merged = Array.from(new Set([...prev, ...next]))
      return merged.slice(0, 30)
    })
    setRequiredSkillsInput("")
  }

  const toggleSDG = (tag: string) => {
    setSdgTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function isImage(type: string) {
    return type.startsWith("image/")
  }

  function prettyBytes(n: number) {
    if (!n) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(n) / Math.log(k))
    return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const incoming = Array.from(files)

    // basic constraints (tweak as you like)
    const MAX_FILES = 8
    const MAX_SIZE_MB = 15

    const next = [...attachments, ...incoming]
      .slice(0, MAX_FILES)
      .filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024)

    if (incoming.some((f) => f.size > MAX_SIZE_MB * 1024 * 1024)) {
      toast.error(`Some files were too large (max ${MAX_SIZE_MB}MB).`)
    }

    setAttachments(next)
  }

  function removeFile(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  async function uploadAttachments(gigId: string, uid: string): Promise<GigAttachment[]> {
    if (!attachments.length) return []

    setUploading(true)
    try {
      const uploaded: GigAttachment[] = []

      for (const f of attachments) {
        const safeName = f.name.replace(/[^\w.\-]+/g, "_")
        const path = `gigs/${gigId}/attachments/${Date.now()}_${safeName}`
        const r = ref(storage, path)
        await uploadBytes(r, f)
        const url = await getDownloadURL(r)

        uploaded.push({
          name: f.name,
          url,
          path,
          size: f.size,
          contentType: f.type || "application/octet-stream",
        })
      }

      return uploaded
    } finally {
      setUploading(false)
    }
  }

  const validate = () => {
    if (!title.trim()) return "Please add a gig title"
    if (!categoryGroup || !categoryItem) return "Please select a category"
    if (!location.trim() && workMode !== "Remote") return "Please add a location for Hybrid/On-site"
    if (!sdgTags.length) return "Pick at least one SDG focus"
    if (!requiredSkills.length) return "Add at least one required skill"
    if (!description.trim() || description.trim().length < 40) return "Add a clearer description (min 40 characters)"

    if (budgetType === "hourly") {
      const n = Number(hourlyRate)
      if (!n || n <= 0) return "Enter a valid hourly rate"
    } else {
      const n = Number(fixedBudget)
      if (!n || n <= 0) return "Enter a valid fixed budget"
    }

    return null
  }

  const handleSubmit = async () => {
    if (!user?.uid) return toast.error("You must be logged in")
    if (loadingProfile) return

    const err = validate()
    if (err) return toast.error(err)

    setSubmitting(true)
    try {
      // upload new attachments (if any)
      const gigId = editing && editId ? editId : nanoid(14)
      const newAttachments = await uploadAttachments(gigId, user.uid)

      // build final attachments array
      const keptExisting = existingAttachments.filter((a) => !attachmentsToRemove.includes(a.url))
      const finalAttachments = [...keptExisting, ...newAttachments]

      const payload: any = {
        title: title.trim(),
        category: { group: categoryGroup, item: categoryItem },
        sdgTags,
        requiredSkills,
        workMode,
        location: workMode === "Remote" ? (location.trim() || "Remote") : location.trim(),
        budgetType,
        hourlyRate: budgetType === "hourly" ? Number(hourlyRate) : null,
        fixedBudget: budgetType === "fixed" ? Number(fixedBudget) : null,
        duration,
        experienceLevel,
        description: description.trim(),
        attachments: finalAttachments,
        status,
        updatedAt: serverTimestamp(),
      }

      // UPDATE MODE
      if (editing && editId) {
        await updateDoc(doc(db, "gigs", editId), payload)
        toast.success("Gig updated")
        router.push(`/dashboard/gigs/${editId}`)
        return
      }

      // CREATE MODE
      const createPayload = {
        id: gigId,
        clientUid: user.uid,
        clientName: profile?.fullName || "",
        clientOrgName: profile?.client?.orgName || "",
        ...payload,
        createdAt: serverTimestamp(),
      }

      // main gig
      await setDoc(doc(db, "gigs", gigId), createPayload, { merge: true })

      // index under user
      await setDoc(
        doc(db, "users", user.uid, "gigs", gigId),
        {
          gigId,
          title: createPayload.title,
          status: createPayload.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      toast.success("Gig posted successfully!")
      router.push(`/dashboard/gigs/${gigId}`)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to save gig")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
            {loadingGig ? (
              <Card className="rounded-2xl">
                <CardContent className="p-6 text-sm text-gray-600">Loading gig for editing...</CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    {editing ? "Edit gig" : "Post a gig"}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {editing ? "Update details and manage attachments." : "Create an SDG-aligned gig and start receiving proposals."}
                  </p>
                </div>

                {editing && (
                  <Link
                    href={`/dashboard/gigs/${editId}`}
                    className="text-sm font-extrabold text-gray-700 hover:text-[var(--primary)] transition"
                  >
                    Back to gig →
                  </Link>
                )}

                {!editing && (
                  <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border bg-white">
                    <Sparkles size={16} className="text-[var(--primary)]" />
                    <span className="text-gray-700">Upwork-style • SDG-first</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* FORM */}
            <motion.div initial="hidden" animate="show" variants={fadeUp} custom={1} className="lg:col-span-2">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <Briefcase size={18} className="text-[var(--primary)]" />
                    Gig details
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Title */}
                  <div>
                    <Label>Gig title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Grant writer needed for clean energy program"
                      className="mt-2 rounded-2xl"
                    />
                  </div>

                  {/* Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Category group</Label>
                      <div className="mt-2">
                        <Select value={categoryGroup} onValueChange={setCategoryGroup}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select a category group" />
                          </SelectTrigger>
                          <SelectContent>
                            {hireCategories.map((c) => (
                              <SelectItem key={c.title} value={c.title}>
                                {c.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Category</Label>
                      <div className="mt-2">
                        <Select value={categoryItem} onValueChange={setCategoryItem}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {groupItems.map((it) => (
                              <SelectItem key={it} value={it}>
                                {it}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Work mode + Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Work mode</Label>
                      <div className="mt-2">
                        <Select value={workMode} onValueChange={(v) => setWorkMode(v as any)}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select work mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {WORK_MODE.map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Location</Label>
                      <div className="mt-2">
                        <Input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={workMode === "Remote" ? "Optional (Remote)" : "e.g. Abuja, Lagos"}
                          className="rounded-2xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Budget type</Label>
                      <div className="mt-2">
                        <Select value={budgetType} onValueChange={(v) => setBudgetType(v as any)}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select budget type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {budgetType === "hourly" ? (
                      <div className="md:col-span-2">
                        <Label>Hourly rate (₦)</Label>
                        <Input
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          placeholder="e.g. 15000"
                          inputMode="numeric"
                          className="mt-2 rounded-2xl"
                        />
                      </div>
                    ) : (
                      <div className="md:col-span-2">
                        <Label>Fixed budget (₦)</Label>
                        <Input
                          value={fixedBudget}
                          onChange={(e) => setFixedBudget(e.target.value)}
                          placeholder="e.g. 250000"
                          inputMode="numeric"
                          className="mt-2 rounded-2xl"
                        />
                      </div>
                    )}
                  </div>

                  {/* Duration + Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Estimated duration</Label>
                      <div className="mt-2">
                        <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Experience level</Label>
                      <div className="mt-2">
                        <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as any)}>
                          <SelectTrigger className="rounded-2xl">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXP_LEVEL.map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Required skills */}
                  <div>
                    <Label>Required skills (comma-separated)</Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={requiredSkillsInput}
                        onChange={(e) => setRequiredSkillsInput(e.target.value)}
                        placeholder="e.g. Grant writing, Monitoring & Evaluation, Reporting"
                        className="rounded-2xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addSkillsFromInput()
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={addSkillsFromInput}
                      >
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {requiredSkills.map((s) => (
                        <Badge
                          key={s}
                          className="rounded-full bg-white text-gray-800 border hover:border-[var(--primary)]"
                        >
                          {s}
                          <button
                            type="button"
                            className="ml-2 text-gray-500 hover:text-[var(--primary)]"
                            onClick={() => setRequiredSkills((prev) => prev.filter((x) => x !== s))}
                            aria-label={`Remove ${s}`}
                          >
                            <X size={14} />
                          </button>
                        </Badge>
                      ))}
                      {!requiredSkills.length && (
                        <div className="text-sm text-gray-500 mt-2">Add at least one skill.</div>
                      )}
                    </div>
                  </div>

                  {/* SDG tags */}
                  <div>
                    <Label>Impact focus (SDGs)</Label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {SDGS.map((tag) => {
                        const active = sdgTags.includes(tag)
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleSDG(tag)}
                            className={`text-xs font-semibold px-3 py-2 rounded-full border transition ${
                              active
                                ? "border-[var(--primary)] text-[var(--primary)] bg-orange-50"
                                : "border-gray-200 text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                            }`}
                            aria-pressed={active}
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label>Gig description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the role, outcomes, timeline, and what success looks like..."
                      className="mt-2 rounded-2xl min-h-[140px]"
                    />
                    <div className="text-xs text-gray-500 mt-2">
                      Tip: Include deliverables, SDG outcomes, and required experience.
                    </div>
                  </div>

                  {/* Reference materials */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Label>Reference materials (optional)</Label>
                      <span className="text-xs text-gray-500 font-semibold">Up to 8 files • 15MB each</span>
                    </div>

                    {editing && existingAttachments.length > 0 && (
                      <div className="mt-3 space-y-2 mb-4">
                        <div className="text-sm font-extrabold text-gray-900">Existing attachments</div>

                        <div className="space-y-2">
                          {existingAttachments.map((a) => {
                            const removing = attachmentsToRemove.includes(a.url)
                            return (
                              <div
                                key={a.url}
                                className={`rounded-2xl border bg-white p-4 flex items-center justify-between gap-3 ${
                                  removing ? "opacity-60" : ""
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="font-extrabold text-sm truncate">{a.name}</div>
                                  <div className="text-xs text-gray-500 font-semibold">{a.contentType || "file"}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm font-extrabold text-[var(--primary)] hover:underline"
                                  >
                                    Open
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAttachmentsToRemove((prev) =>
                                        prev.includes(a.url) ? prev.filter((u) => u !== a.url) : [...prev, a.url]
                                      )
                                    }}
                                    className={`text-sm font-extrabold ${
                                      removing ? "text-gray-700" : "text-red-600"
                                    }`}
                                  >
                                    {removing ? "Undo" : "Remove"}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {attachmentsToRemove.length > 0 && (
                          <div className="text-xs font-semibold text-gray-600">
                            {attachmentsToRemove.length} attachment(s) will be removed when you save.
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 rounded-2xl border bg-white p-4">
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-600">
                          Upload briefs, standards, brand guides, sample outputs, etc.
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--primary)] cursor-pointer hover:underline">
                          <Paperclip size={16} />
                          Add files
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*"
                            onChange={(e) => addFiles(e.target.files)}
                          />
                        </label>
                      </div>

                      {!!attachments.length && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {attachments.map((f, idx) => (
                            <motion.div
                              key={`${f.name}-${idx}`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18 }}
                              className="rounded-2xl border bg-white p-3 flex items-start gap-3"
                            >
                              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                {isImage(f.type) ? (
                                  <ImageIcon className="text-[var(--primary)]" size={18} />
                                ) : (
                                  <FileText className="text-[var(--primary)]" size={18} />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-extrabold text-sm text-gray-900 truncate">{f.name}</div>
                                <div className="text-xs text-gray-500 font-semibold mt-0.5">{prettyBytes(f.size)}</div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="text-gray-500 hover:text-red-600 transition"
                                aria-label="Remove file"
                              >
                                <Trash2 size={18} />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <Button onClick={handleSubmit} disabled={submitting || loadingProfile || uploading}>
                      {submitting || uploading ? "Posting..." : "Post gig"}
                    </Button>

                    <Link
                      href="/dashboard"
                      className="text-sm font-extrabold text-gray-700 hover:text-[var(--primary)] transition inline-flex items-center gap-2"
                    >
                      Back to dashboard <ArrowRight size={16} />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* SIDEBAR */}
            <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2}>
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">Posting tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 text-[var(--primary)]" />
                    <div>
                      If it’s Remote, location can be optional — but adding a region helps matching.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sparkles size={16} className="mt-0.5 text-[var(--primary)]" />
                    <div>
                      Strong SDG tags + clear deliverables get better proposals.
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    MVP: proposals + messaging come next.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}

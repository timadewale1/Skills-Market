"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db, storage } from "@/lib/firebase"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import jsPDF from "jspdf"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import {
  ArrowLeft,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileSignature,
  Briefcase,
  Download,
  Paperclip,
  FileText,
  ImageIcon,
  X,
} from "lucide-react"

type Thread = {
  threadId: string
  gigId: string
  gigTitle: string
  clientUid: string
  clientName: string
  clientSlug?: string | null
  talentUid: string
  talentName: string
  talentSlug?: string | null
  participants: string[]
  proposalStatus?: "submitted" | "shortlisted" | "accepted" | "rejected"
}

type Msg = {
  id: string
  fromUid: string
  text: string
  createdAt?: any
  attachments?: MessageAttachment[]
}
type MsgMeta = {
  type?: string
  gigId?: string
}

type MessageAttachment = {
  name: string
  url: string
  storagePath: string
  contentType?: string
  size?: number
}

// allow optional meta payload on messages (e.g. { type: 'gig', gigId })
type MsgWithMeta = Msg & { meta?: MsgMeta }

const MAX_MESSAGE_ATTACHMENTS = 5
const MAX_MESSAGE_ATTACHMENT_SIZE_MB = 15

function formatAttachmentSize(size?: number) {
  if (!size || size <= 0) return ""
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function attachmentLooksLikeImage(contentType?: string, name?: string) {
  if (contentType?.startsWith("image/")) return true
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || "")
}

async function uploadThreadAttachments(threadId: string, files: File[]) {
  const uploaded: MessageAttachment[] = []

  for (const file of files.slice(0, MAX_MESSAGE_ATTACHMENTS)) {
    if (file.size > MAX_MESSAGE_ATTACHMENT_SIZE_MB * 1024 * 1024) {
      throw new Error(`"${file.name}" is too large. Max ${MAX_MESSAGE_ATTACHMENT_SIZE_MB}MB per file.`)
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "_")
    const path = `threads/${threadId}/attachments/${Date.now()}_${safeName}`
    const result = await uploadBytes(storageRef(storage, path), file, {
      contentType: file.type || "application/octet-stream",
    })
    const url = await getDownloadURL(result.ref)

    uploaded.push({
      name: file.name,
      url,
      storagePath: path,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    })
  }

  return uploaded
}

type Agreement = {
  status: "draft" | "sent_to_talent" | "talent_declined" | "fully_signed" | "cancelled"
  terms: {
    payType: "hourly" | "fixed"
    amountAgreed: number
    currency: "NGN"
    proposedHoursPerWeek?: number | null
    durationText?: string
    hoursDuration?: number | null
    startDateText?: string
    scopeOfWork?: string
    deliverables?: string
    milestones?: string
    communication?: string
    revisionPolicy?: string
    confidentiality?: string
    ipOwnership?: string
    termination?: string
    disputeResolution?: string
    notes?: string
    disclaimerAccepted?: boolean
  }
  clientSignature: { signedAt: any; signatureText: string } | null
  talentSignature: { signedAt: any; signatureText: string } | null
  talentDeclineReason?: string
  updatedAt?: any

  // NEW: persisted PDF metadata (optional but supported)
  pdfUrl?: string | null
  pdfPath?: string | null
  pdfGeneratedAt?: any
}

function makeWorkspaceId(threadId: string) {
  return `ws_${threadId}`
}

function downloadAgreementPdf(thread: Thread, agreement: Agreement) {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  const primaryRGB = [249, 115, 22] as [number, number, number]

  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    color: [number, number, number] = [0, 0, 0]
  ) => {
    pdf.setFontSize(fontSize)
    pdf.setFont("helvetica", isBold ? "bold" : "normal")
    pdf.setTextColor(...color)
    const lines = pdf.splitTextToSize(text, contentWidth)
    pdf.text(lines, margin, yPos)
    yPos += lines.length * fontSize * 0.5 + 3
  }

  const addSeparator = () => {
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6
  }

  // Header
  pdf.setFillColor(...primaryRGB)
  pdf.rect(0, 0, pageWidth, 35, "F")
  pdf.setFontSize(22)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(255, 255, 255)
  pdf.text("changeworker", margin, 20)
  pdf.setFontSize(10)
  pdf.text("Hiring Agreement", margin, 28)
  yPos = 42

  addText("HIRING AGREEMENT", 16, true, primaryRGB)
  yPos += 5

  pdf.setFillColor(245, 245, 245)
  pdf.rect(margin - 2, yPos - 4, contentWidth + 4, 28, "F")
  addText(`Gig: ${thread.gigTitle}`, 11, true)
  addText(`Client: ${thread.clientName}`, 10, false)
  addText(`Talent: ${thread.talentName}`, 10, false)
  yPos += 4

  // Status strip
  pdf.setFillColor(34, 197, 94)
  pdf.rect(margin - 2, yPos - 4, contentWidth + 4, 8, "F")
  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(255, 255, 255)
  pdf.text("STATUS: FULLY SIGNED", margin + 2, yPos + 2)
  pdf.setTextColor(0, 0, 0)
  yPos += 12

  addSeparator()

  addText("Payment Terms", 13, true, primaryRGB)
  addText(`Payment Type: ${agreement.terms.payType.toUpperCase()}`, 10)
  addText(
    `Amount: ₦${Number(agreement.terms.amountAgreed || 0).toLocaleString()} ${
      agreement.terms.payType === "hourly" ? "/hour" : ""
    }`,
    10
  )
  if (agreement.terms.proposedHoursPerWeek) addText(`Hours per Week: ${agreement.terms.proposedHoursPerWeek}`, 10)
  addText(
    `Duration: ${agreement.terms.hoursDuration ? agreement.terms.hoursDuration + " hours" : agreement.terms.durationText || "-"}`,
    10
  )
  if (agreement.terms.startDateText) addText(`Start Date: ${agreement.terms.startDateText}`, 10)

  yPos += 5
  if (yPos > pageHeight - 60) {
    pdf.addPage()
    yPos = margin
  }

  addSeparator()

  if (agreement.terms.scopeOfWork) {
    addText("Scope of Work", 13, true, primaryRGB)
    addText(agreement.terms.scopeOfWork, 9)
    yPos += 3
  }

  if (agreement.terms.deliverables) {
    addSeparator()
    addText("Deliverables", 13, true, primaryRGB)
    addText(agreement.terms.deliverables, 9)
    yPos += 3
  }

  if (agreement.terms.milestones) {
    addSeparator()
    addText("Milestones & Timeline", 13, true, primaryRGB)
    addText(agreement.terms.milestones, 9)
    yPos += 3
  }

  if (agreement.terms.notes) {
    addSeparator()
    addText("Additional Notes", 13, true, primaryRGB)
    addText(agreement.terms.notes, 9)
    yPos += 3
  }

  if (yPos > pageHeight - 80) {
    pdf.addPage()
    yPos = margin
  }

  addSeparator()

  addText("Binding Agreement Disclaimer", 13, true, [220, 38, 38])
  addText(
    "By signing below, both parties agree that this contract is binding and enforceable. Any changes, modifications, or cancellations can only occur if either party materially breaches the agreed terms, or both parties mutually consent in writing through this platform.",
    8
  )
  yPos += 8

  addSeparator()

  // Signatures
  pdf.setFillColor(245, 245, 245)
  const sigBoxHeight = 35
  pdf.rect(margin - 2, yPos - 4, contentWidth + 4, sigBoxHeight * 2 + 8, "F")

  addText("CLIENT SIGNATURE", 11, true)
  yPos += 1
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(...primaryRGB)
  pdf.text(agreement.clientSignature?.signatureText || "--------------", margin + 2, yPos)
  pdf.setTextColor(0, 0, 0)
  yPos += 12
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(thread.clientName, margin + 2, yPos)
  yPos += 6

  addText("TALENT SIGNATURE", 11, true)
  yPos += 1
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(...primaryRGB)
  pdf.text(agreement.talentSignature?.signatureText || "--------------", margin + 2, yPos)
  pdf.setTextColor(0, 0, 0)
  yPos += 12
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(thread.talentName, margin + 2, yPos)

  // Footer
  pdf.setFontSize(8)
  pdf.setTextColor(150, 150, 150)
  pdf.text(`Generated on ${new Date().toLocaleDateString()} • changeworker Platform`, margin, pageHeight - 8)

  pdf.save(`agreement_${thread.gigId}_${thread.talentSlug || thread.talentUid}.pdf`)
}

async function generateAgreementPdfBlob(thread: Thread, agreement: Agreement) {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  const primaryRGB = [249, 115, 22] as [number, number, number]

  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    color: [number, number, number] = [0, 0, 0]
  ) => {
    pdf.setFontSize(fontSize)
    pdf.setFont("helvetica", isBold ? "bold" : "normal")
    pdf.setTextColor(...color)
    const lines = pdf.splitTextToSize(text, contentWidth)
    pdf.text(lines, margin, yPos)
    yPos += lines.length * fontSize * 0.5 + 3
  }

  const addSeparator = () => {
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6
  }

  // Header
  pdf.setFillColor(...primaryRGB)
  pdf.rect(0, 0, pageWidth, 35, "F")
  pdf.setFontSize(22)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(255, 255, 255)
  pdf.text("changeworker", margin, 20)
  pdf.setFontSize(10)
  pdf.text("Hiring Agreement", margin, 28)
  yPos = 42

  addText("HIRING AGREEMENT", 16, true, primaryRGB)
  yPos += 5

  pdf.setFillColor(245, 245, 245)
  pdf.rect(margin - 2, yPos - 4, contentWidth + 4, 28, "F")
  addText(`Gig: ${thread.gigTitle}`, 11, true)
  addText(`Client: ${thread.clientName}`, 10, false)
  addText(`Talent: ${thread.talentName}`, 10, false)
  yPos += 4

  addSeparator()

  addText("Payment Terms", 13, true, primaryRGB)
  addText(`Payment Type: ${agreement.terms.payType.toUpperCase()}`, 10)
  addText(
    `Amount: ₦${Number(agreement.terms.amountAgreed || 0).toLocaleString()} ${
      agreement.terms.payType === "hourly" ? "/hour" : ""
    }`,
    10
  )
  if (agreement.terms.proposedHoursPerWeek) addText(`Hours per Week: ${agreement.terms.proposedHoursPerWeek}`, 10)
  addText(
    `Duration: ${agreement.terms.hoursDuration ? agreement.terms.hoursDuration + " hours" : agreement.terms.durationText || "-"}`,
    10
  )

  if (yPos > pageHeight - 80) {
    pdf.addPage()
    yPos = margin
  }

  addSeparator()
  addText("Binding Agreement Disclaimer", 13, true, [220, 38, 38])
  addText(
    "By signing below, both parties agree that this contract is binding and enforceable. Any changes or cancellation can only occur on breach or mutual written consent within the platform.",
    8
  )

  yPos += 8
  addSeparator()

  // signatures
  pdf.setFillColor(245, 245, 245)
  const sigBoxHeight = 35
  pdf.rect(margin - 2, yPos - 4, contentWidth + 4, sigBoxHeight * 2 + 8, "F")

  addText("CLIENT SIGNATURE", 11, true)
  yPos += 1
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(...primaryRGB)
  pdf.text(agreement.clientSignature?.signatureText || "--------------", margin + 2, yPos)
  pdf.setTextColor(0, 0, 0)
  yPos += 12
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(thread.clientName, margin + 2, yPos)
  yPos += 6

  addText("TALENT SIGNATURE", 11, true)
  yPos += 1
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(...primaryRGB)
  pdf.text(agreement.talentSignature?.signatureText || "--------------", margin + 2, yPos)
  pdf.setTextColor(0, 0, 0)
  yPos += 12
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "normal")
  pdf.text(thread.talentName, margin + 2, yPos)

  return pdf.output("blob")
}

export default function ThreadPage() {
  const { user } = useAuth()
  const params = useParams<{ threadId: string }>()
  const threadId = params?.threadId
  const router = useRouter()

  const [thread, setThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState("")
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)

  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [agreementOpen, setAgreementOpen] = useState(false)
  const [talentAgreementViewOpen, setTalentAgreementViewOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState("")

  // agreement draft inputs (client)
  const [payType, setPayType] = useState<"hourly" | "fixed">("fixed")
  const [amountAgreed, setAmountAgreed] = useState<string>("")
  const [hoursPerWeek, setHoursPerWeek] = useState<string>("")
  const [durationText, setDurationText] = useState<string>("")
  const [hoursDuration, setHoursDuration] = useState<string>("")
  const [scopeOfWork, setScopeOfWork] = useState<string>("")
  const [milestones, setMilestones] = useState<string>("")
  const [deliverables, setDeliverables] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [disclaimerOk, setDisclaimerOk] = useState(false)

  // allow optional meta payload on messages (e.g. { type: 'gig', gigId })
  const [metaPayload, setMetaPayload] = useState<MsgMeta | undefined>(undefined)

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)

  // Inline doodle SVG background (no external file needed)
  const doodleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
    <g fill="none" stroke="#d1d5db" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 40 q20 -20 40 0" />
      <path d="M60 20 c10 10 20 10 30 0" />
      <circle cx="180" cy="40" r="6" />
      <path d="M30 160 q20 20 40 0" />
      <path d="M120 80 l10 10 l-10 10 l10 10" />
      <path d="M160 140 q12 -12 24 0" />
      <circle cx="40" cy="100" r="3" />
    </g>
  </svg>`
  const doodleDataUrl =
    typeof window === "undefined"
      ? ""
      : `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(doodleSvg)))}`

  const isClient = useMemo(() => !!user?.uid && user.uid === thread?.clientUid, [user?.uid, thread?.clientUid])
  const isTalent = useMemo(() => !!user?.uid && user.uid === thread?.talentUid, [user?.uid, thread?.talentUid])
  const fullySigned = agreement?.status === "fully_signed"

  useEffect(() => {
    if (!threadId || !user?.uid) return

    const unsubThread = onSnapshot(doc(db, "threads", threadId), (snap) => {
      setThread(snap.exists() ? (snap.data() as Thread) : null)
    })

    const qy = query(collection(db, "threads", threadId, "messages"), orderBy("createdAt", "asc"))
    const unsubMsg = onSnapshot(qy, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Msg[]
      setMessages(rows)
      setTimeout(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" })
      }, 60)
    })

    const unsubAgreement = onSnapshot(doc(db, "threads", threadId, "agreement", "current"), (snap) => {
      setAgreement(snap.exists() ? (snap.data() as any as Agreement) : null)
    })

    return () => {
      unsubThread()
      unsubMsg()
      unsubAgreement()
    }
  }, [threadId, user?.uid])

  const pickAttachments = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    if (!selected.length) return

    const availableSlots = MAX_MESSAGE_ATTACHMENTS - pendingAttachments.length
    if (availableSlots <= 0) {
      toast.error(`You can only send up to ${MAX_MESSAGE_ATTACHMENTS} attachments at once.`)
      event.target.value = ""
      return
    }

    const nextFiles = selected.slice(0, availableSlots)
    if (selected.length > availableSlots) {
      toast.error(`Only ${MAX_MESSAGE_ATTACHMENTS} attachments can be sent at once.`)
    }

    const oversize = nextFiles.find((file) => file.size > MAX_MESSAGE_ATTACHMENT_SIZE_MB * 1024 * 1024)
    if (oversize) {
      toast.error(`"${oversize.name}" is larger than ${MAX_MESSAGE_ATTACHMENT_SIZE_MB}MB.`)
      event.target.value = ""
      return
    }

    setPendingAttachments((current) => [...current, ...nextFiles].slice(0, MAX_MESSAGE_ATTACHMENTS))
    event.target.value = ""
  }

  const removePendingAttachment = (name: string, lastModified: number) => {
    setPendingAttachments((current) =>
      current.filter((file) => !(file.name === name && file.lastModified === lastModified))
    )
  }

  const sendMessage = async () => {
    if (!user?.uid || !threadId) return
    const t = text.trim()
    if (!t && pendingAttachments.length === 0) return

    setSending(true)
    try {
      const uploadedAttachments =
        pendingAttachments.length > 0 ? await uploadThreadAttachments(threadId, pendingAttachments) : []
      const token = await user.getIdToken()
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId,
          text: t,
          meta: metaPayload,
          attachments: uploadedAttachments,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }

      setText("")
      setPendingAttachments([])
      setMetaPayload(undefined)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const rejectTalentInChat = async () => {
    if (!thread || !threadId || !isClient || !user) return
    try {
      await updateDoc(doc(db, "threads", threadId), {
        proposalStatus: "rejected",
        updatedAt: serverTimestamp(),
      })

      await updateDoc(doc(db, "gigs", thread.gigId, "proposals", thread.talentUid), {
        status: "rejected",
        updatedAt: serverTimestamp(),
      })

      const token = await user.getIdToken()
      await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId,
          text: "Client rejected the talent from chat (revoked shortlist/accept).",
        }),
      })

      // notify via proposals/rejected endpoint as well
      try {
        await fetch("/api/proposals/rejected", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            gigId: thread.gigId,
            gigTitle: thread.gigTitle,
            talentUid: thread.talentUid,
          }),
        })
      } catch (notifErr) {
        console.error("Failed to send rejection notification from chat:", notifErr)
      }

      toast.success("Talent rejected (chat)")
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to reject")
    }
  }

  const openHireAgreement = async () => {
    if (!thread || !threadId || !isClient) return

    try {
      const ref = doc(db, "threads", threadId, "agreement", "current")
      const snap = await getDoc(ref)

      if (!snap.exists()) {
        await setDoc(ref, {
          status: "draft",
          terms: {
            payType: "fixed",
            amountAgreed: 0,
            currency: "NGN",
            durationText: "",
            hoursDuration: null,
            deliverables: "",
            notes: "",
            disclaimerAccepted: false,
          },
          clientSignature: null,
          talentSignature: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      setAgreementOpen(true)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to open agreement")
    }
  }

  const clientSignAndSend = async () => {
    if (!thread || !threadId || !isClient) return
    const amt = Number(amountAgreed.replace(/[^\d]/g, ""))
    if (!amt || amt <= 0) return toast.error("Enter amount agreed.")
    if (!disclaimerOk) return toast.error("Please accept the disclaimer to continue.")
    if (payType === "hourly") {
      if (!hoursDuration.trim()) return toast.error("Enter total hours.")
      const hd = Number(hoursDuration.trim())
      if (isNaN(hd) || hd <= 0) return toast.error("Enter a valid number of hours.")
    } else {
      if (!durationText.trim()) return toast.error("Enter duration.")
    }

    try {
      const signatureText = thread.clientName || "Organization"

      const termsPayload: any = {
        payType,
        amountAgreed: amt,
        currency: "NGN",
        disclaimerAccepted: disclaimerOk,
      }

      if (payType === "hourly") {
        const hd = Number(hoursDuration.trim())
        termsPayload.hoursDuration = hd
        if (hoursPerWeek.trim()) termsPayload.proposedHoursPerWeek = Number(hoursPerWeek)
        termsPayload.billingType = "hourly"
      } else {
        termsPayload.durationText = durationText.trim()
        termsPayload.billingType = "fixed"
      }
      if (scopeOfWork.trim()) termsPayload.scopeOfWork = scopeOfWork.trim()
      if (milestones.trim()) termsPayload.milestones = milestones.trim()
      if (deliverables.trim()) termsPayload.deliverables = deliverables.trim()
      if (notes.trim()) termsPayload.notes = notes.trim()

      await updateDoc(doc(db, "threads", threadId, "agreement", "current"), {
        status: "sent_to_talent",
        terms: termsPayload,
        clientSignature: {
          signatureText,
          signedAt: serverTimestamp(),
        },
        talentSignature: null,
        talentDeclineReason: "",
        updatedAt: serverTimestamp(),
      })

      await updateDoc(doc(db, "threads", threadId), {
        proposalStatus: "accepted",
        updatedAt: serverTimestamp(),
      })
      await updateDoc(doc(db, "gigs", thread.gigId, "proposals", thread.talentUid), {
        status: "accepted",
        updatedAt: serverTimestamp(),
      })

      if (!user) return
      const token = await user.getIdToken()
      await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId,
          text: "Client sent a hiring agreement. Please review and sign.",
        }),
      })

      // notify talent via agreements/client-signed
      try {
        await fetch("/api/agreements/client-signed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            threadId,
            gigTitle: thread.gigTitle,
            talentUid: thread.talentUid,
          }),
        })
      } catch (notifErr) {
        console.error("Failed to send client signed notification:", notifErr)
      }

      toast.success("Agreement sent to talent")
      setAgreementOpen(false)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to send agreement")
    }
  }

  const talentSign = async () => {
    if (!thread || !threadId || !isTalent) return
    if (!agreement || agreement.status !== "sent_to_talent") return
    if (!user) return

    try {
      const signatureText = thread.talentName || "Talent"

      // 1) Update agreement doc to fully signed
      await updateDoc(doc(db, "threads", threadId, "agreement", "current"), {
        status: "fully_signed",
        talentSignature: {
          signatureText,
          signedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      })

      const token = await (user as any).getIdToken()
      await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId,
          text: "Talent signed the agreement.",
        }),
      })

      // 2) Create workspace with denormalized fields + timeline + milestones placeholder
      const wsId = makeWorkspaceId(threadId)
      await setDoc(
        doc(db, "workspaces", wsId),
        {
          type: "workspace",
          schemaVersion: 1,

          workspaceId: wsId,
          threadId,
          gigId: thread.gigId,
          gigTitle: thread.gigTitle,

          clientUid: thread.clientUid,
          clientName: thread.clientName,
          clientSlug: thread.clientSlug || null,

          talentUid: thread.talentUid,
          talentName: thread.talentName,
          talentSlug: thread.talentSlug || null,

          status: "waiting_payment",
          statusTimeline: {
            created: { at: serverTimestamp(), byUid: thread.talentUid },
            waiting_payment: { at: serverTimestamp(), byUid: thread.talentUid },
          },

          milestones: { enabled: false, items: [] },

          agreementPdfUrl: null,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      // 3) Generate PDF blob including BOTH signatures (client + talent)
      const agreementForPdf: Agreement = {
        ...agreement,
        status: "fully_signed",
        talentSignature: { signatureText, signedAt: new Date() as any },
      }

      // Upload PDF -> update workspace + agreement docs
      try {
  const pdfBlob = await generateAgreementPdfBlob(thread, agreementForPdf)
  const storagePath = `agreements/${threadId}/agreement.pdf`

  console.log("[agreement-pdf] uploading ->", storagePath)

  const uploaded = await uploadBytes(storageRef(storage, storagePath), pdfBlob, {
    contentType: "application/pdf",
  })

  console.log("[agreement-pdf] uploaded OK, getting download URL...")

  const url = await getDownloadURL(uploaded.ref)

  console.log("[agreement-pdf] download URL OK:", url)

  await updateDoc(doc(db, "workspaces", wsId), {
    agreementPdfUrl: url,
    updatedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, "threads", threadId, "agreement", "current"), {
    pdfUrl: url,
    pdfPath: storagePath,
    pdfGeneratedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // notify client via agreements/talent-signed with PDF
  try {
    await fetch("/api/agreements/talent-signed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        threadId,
        gigTitle: thread.gigTitle,
        clientUid: thread.clientUid,
        pdfUrl: url,
      }),
    })
  } catch (notifErr) {
    console.error("Failed to send talent signed notification:", notifErr)
  }
} catch (e: any) {
  console.error("[agreement-pdf] FAILED:", e)
  toast.error(e?.message || "Failed to generate/upload agreement PDF")
}


      toast.success("Agreement signed - opening workspace")
      router.push(`/dashboard/workspaces/${wsId}`)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to sign")
    }
  }

  const talentDecline = async () => {
    if (!thread || !threadId || !isTalent) return
    if (!agreement || agreement.status !== "sent_to_talent") return
    if (!declineReason.trim()) return toast.error("Add a reason for declining.")

    try {
      await updateDoc(doc(db, "threads", threadId, "agreement", "current"), {
        status: "talent_declined",
        talentDeclineReason: declineReason.trim(),
        updatedAt: serverTimestamp(),
      })

      if (!user) return
      const token = await user.getIdToken()
      await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId,
          text: `Talent declined the agreement: ${declineReason.trim()}`,
        }),
      })

      toast.success("Decline sent to client")
      setDeclineReason("")
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Failed to decline")
    }
  }

  if (!thread) {
    return (
      <RequireAuth>
        <AuthNavbar />
        <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-600">Thread not found.</CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    )
  }

  const canView = user?.uid && thread.participants.includes(user.uid)
  if (!canView) {
    return (
      <RequireAuth>
        <AuthNavbar />
        <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-700">You don’t have access to this chat.</CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    )
  }

  const wsId = makeWorkspaceId(threadId)

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
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
                <div className="text-xl md:text-2xl font-extrabold truncate">{thread.gigTitle}</div>
                <Badge className="rounded-full bg-white border text-gray-700">
                  {thread.proposalStatus || "submitted"}
                </Badge>
              </div>

              <div className="mt-1 text-sm text-gray-600 font-semibold inline-flex items-center gap-2">
                <Briefcase size={16} className="text-[var(--primary)]" />
                <span className="truncate">
                  {thread.clientName} ↔ {thread.talentName}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border bg-white">
              <Sparkles size={16} className="text-[var(--primary)]" />
              <span className="text-gray-700">In-app messaging</span>
            </div>
          </div>

          {/* Layout */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chat */}
            <div className="lg:col-span-2">
              <Card className="rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div
                    ref={scrollerRef}
                    className="h-[55vh] overflow-y-auto p-5 space-y-3 relative"
                    style={{
  backgroundImage: `
    linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)),
    url("/chat-doodles.png")
  `,
  backgroundRepeat: "repeat, repeat",
  backgroundSize: "auto, 260px 260px",
  backgroundPosition: "0 0, 0 0",
  backdropFilter: "blur(0px)", // keep 0 or remove; blur only works with semi-transparent overlays
}}
                  >
                    {messages.length === 0 ? (
                      <div className="text-sm text-gray-600">No messages yet. Say hello 👋</div>
                    ) : (
                      messages.map((m0) => {
                        const m = m0 as MsgWithMeta
                        const mine = m.fromUid === user?.uid
                        return (
                          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[85%]">
                              <div
                                className={`rounded-2xl px-4 py-3 text-sm ${
                                  mine ? "bg-[var(--primary)] text-white" : "bg-white/90 text-gray-800 border"
                                }`}
                              >
                                {m.text ? <div className="whitespace-pre-wrap break-words">{m.text}</div> : null}
                                {m.attachments?.length ? (
                                  <div className={`grid gap-2 ${m.text ? "mt-3" : ""}`}>
                                    {m.attachments.map((attachment, index) => {
                                      const imageLike = attachmentLooksLikeImage(attachment.contentType, attachment.name)
                                      return (
                                        <a
                                          key={`${attachment.storagePath}-${index}`}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                                            mine
                                              ? "border-white/20 bg-white/10 hover:bg-white/15"
                                              : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50"
                                          }`}
                                        >
                                          <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                              mine ? "bg-white/15 text-white" : "bg-orange-100 text-[var(--primary)]"
                                            }`}
                                          >
                                            {imageLike ? <ImageIcon size={16} /> : <FileText size={16} />}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className={`truncate text-sm font-bold ${mine ? "text-white" : "text-gray-900"}`}>
                                              {attachment.name}
                                            </div>
                                            <div className={`text-xs ${mine ? "text-white/80" : "text-gray-500"}`}>
                                              {formatAttachmentSize(attachment.size) || "Attachment"}
                                            </div>
                                          </div>
                                        </a>
                                      )
                                    })}
                                  </div>
                                ) : null}
                              </div>

                              {/* Render a separate "View gig" button when message includes gig meta */}
                              {m.meta?.type === "gig" && m.meta?.gigId && (
                                <div className={`mt-2 ${mine ? "text-right" : "text-left"}`}>
                                  <button
                                    onClick={() => router.push(`/dashboard/gigs/${m.meta!.gigId}`)}
                                    className="rounded-2xl bg-white border px-3 py-1 text-sm font-extrabold hover:shadow-sm transition"
                                  >
                                    View gig
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <Separator />

                  <div className="p-4 bg-white">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={pickAttachments}
                    />

                    {pendingAttachments.length ? (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {pendingAttachments.map((file) => (
                          <div
                            key={`${file.name}-${file.lastModified}`}
                            className="inline-flex max-w-full items-center gap-2 rounded-full border bg-[var(--secondary)] px-3 py-2 text-xs font-semibold text-gray-700"
                          >
                            <Paperclip size={14} className="shrink-0 text-[var(--primary)]" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-gray-500">{formatAttachmentSize(file.size)}</span>
                            <button
                              type="button"
                              onClick={() => removePendingAttachment(file.name, file.lastModified)}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
                              aria-label={`Remove ${file.name}`}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message…"
                        className="min-w-0 flex-1 rounded-2xl"
                      />
                      <button
                        type="button"
                        disabled={sending || pendingAttachments.length >= MAX_MESSAGE_ATTACHMENTS}
                        onClick={() => attachmentInputRef.current?.click()}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Attach files"
                        title="Attach up to 5 files"
                      >
                        <Paperclip size={18} />
                      </button>
                      <button
                        disabled={sending || (!text.trim() && pendingAttachments.length === 0)}
                        onClick={sendMessage}
                        className="rounded-2xl bg-[var(--primary)] text-white px-4 font-extrabold inline-flex items-center gap-2 disabled:opacity-60"
                      >
                        <Send size={16} />
                        Send
                      </button>
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-500">
                      Attach up to {MAX_MESSAGE_ATTACHMENTS} files per message.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hiring actions rail */}
            <div className="space-y-4">
              <Card className="rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <div className="font-extrabold">Hiring actions</div>

                  {isClient ? (
                    <>
                      <button
                        disabled={fullySigned}
                        onClick={openHireAgreement}
                        className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        <FileSignature size={16} />
                        Hire talent (Agreement)
                      </button>

                      <button
                        disabled={fullySigned}
                        onClick={rejectTalentInChat}
                        className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} className="text-[var(--primary)]" />
                        Reject talent (Revoke)
                      </button>

                      {fullySigned ? (
                        <div className="text-xs text-gray-500 font-semibold">
                          Agreement is fully signed - hiring actions are locked.
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 font-semibold">
                          Final hiring happens via agreement signing. Rejection revokes shortlist/accept.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      If client sends an agreement, you’ll review and sign here.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agreement panel */}
              {agreement && (
                <Card className="rounded-2xl">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold">Agreement</div>
                      <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        {agreement.status}
                      </Badge>
                    </div>

                    {agreement.status === "sent_to_talent" && isTalent && (
                      <>
                        <button
                          onClick={() => setTalentAgreementViewOpen(true)}
                          className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-3 hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                        >
                          <FileSignature size={16} />
                          View and Sign Agreement
                        </button>
                      </>
                    )}

                    {agreement.status === "talent_declined" && isClient && (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        <span className="font-extrabold">Talent declined:</span>{" "}
                        {agreement.talentDeclineReason || "-"}
                      </div>
                    )}

                    {agreement.status === "fully_signed" && (
                      <div className="space-y-3">
                        <div className="text-sm text-gray-700">✅ Fully signed - workspace ready.</div>

                        <button
                          onClick={() => router.push(`/dashboard/workspaces/${wsId}`)}
                          className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 hover:opacity-90 transition inline-flex items-center justify-center gap-2"
                        >
                          <Briefcase size={16} />
                          Go to workspace
                        </button>

                        {/* If pdfUrl exists, open it. Otherwise fallback to local jsPDF download */}
                        <button
                          onClick={() => {
                            if (agreement.pdfUrl) window.open(agreement.pdfUrl, "_blank")
                            else downloadAgreementPdf(thread, agreement)
                          }}
                          className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:shadow-sm transition inline-flex items-center justify-center gap-2"
                        >
                          <Download size={16} />
                          Download agreement (PDF)
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Agreement modal (client creates + signs) */}
          {agreementOpen && isClient && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl overflow-hidden"
              >
                <div className="p-5 border-b">
                  <div className="text-lg font-extrabold">Hiring agreement</div>
                  <div className="text-xs text-gray-500 font-semibold mt-1">
                    Fill terms, then sign (signature = org name).
                  </div>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm font-extrabold">Payment type</div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPayType("fixed")}
                          className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-extrabold transition ${
                            payType === "fixed"
                              ? "border-[var(--primary)] text-[var(--primary)] bg-blue-50"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Fixed
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayType("hourly")}
                          className={`flex-1 rounded-2xl border px-4 py-2 text-sm font-extrabold transition ${
                            payType === "hourly"
                              ? "border-[var(--primary)] text-[var(--primary)] bg-blue-50"
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          Hourly
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-extrabold">
                        Amount agreed {payType === "hourly" ? "(₦/hr)" : "(₦ total)"}
                      </div>
                      <Input
                        value={amountAgreed}
                        onChange={(e) => setAmountAgreed(e.target.value)}
                        placeholder={payType === "hourly" ? "e.g. 5000 per hour" : "e.g. 200000"}
                        className="rounded-2xl mt-2"
                      />
                    </div>

                    {payType === "hourly" && (
                      <div className="md:col-span-2">
                        <div className="text-sm font-extrabold">Hours per week (optional)</div>
                        <Input
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(e.target.value)}
                          placeholder="e.g. 20"
                          className="rounded-2xl mt-2"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    {payType === "hourly" ? (
                      <>
                        <div className="text-sm font-extrabold">Total hours</div>
                        <Input
                          value={hoursDuration}
                          onChange={(e) => setHoursDuration(e.target.value)}
                          placeholder="e.g. 160"
                          className="rounded-2xl mt-2"
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-extrabold">Duration</div>
                        <Input
                          value={durationText}
                          onChange={(e) => setDurationText(e.target.value)}
                          placeholder="e.g. 1–3 months"
                          className="rounded-2xl mt-2"
                        />
                      </>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-extrabold">Scope of work</div>
                    <textarea
                      value={scopeOfWork}
                      onChange={(e) => setScopeOfWork(e.target.value)}
                      placeholder="Describe the scope and key responsibilities…"
                      className="mt-2 w-full min-h-[90px] rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-extrabold">Milestones / Timeline</div>
                    <textarea
                      value={milestones}
                      onChange={(e) => setMilestones(e.target.value)}
                      placeholder="List milestones, deliverable dates, and timeline…"
                      className="mt-2 w-full min-h-[90px] rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-extrabold">Deliverables</div>
                    <textarea
                      value={deliverables}
                      onChange={(e) => setDeliverables(e.target.value)}
                      placeholder="What will be delivered?…"
                      className="mt-2 w-full min-h-[90px] rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-extrabold">Notes (optional)</div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special terms, expectations, etc."
                      className="mt-2 w-full min-h-[90px] rounded-2xl border p-4 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="rounded-2xl border bg-[var(--secondary)] p-4">
                    <div className="text-sm font-extrabold">Disclaimer</div>
                    <div className="text-xs text-gray-600 font-semibold mt-2 leading-relaxed">
                      By signing, both parties agree this contract is binding. Changes/cancellation can only happen if
                      either party breaches the terms or both parties mutually agree in writing inside this chat.
                    </div>

                    <label className="mt-3 flex items-start gap-2 text-sm font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={disclaimerOk}
                        onChange={(e) => setDisclaimerOk(e.target.checked)}
                        className="mt-1"
                      />
                      <span>I understand and agree to the disclaimer.</span>
                    </label>
                  </div>

                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-extrabold">Digital signature preview</div>
                    <div className="mt-2 text-3xl font-extrabold italic" style={{ fontFamily: "cursive" }}>
                      {thread.clientName}
                    </div>
                    <div className="text-xs text-gray-600 font-semibold mt-1">
                      Signature is the organization name in cursive (button-triggered).
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t flex gap-2">
                  <button
                    onClick={() => setAgreementOpen(false)}
                    className="flex-1 rounded-2xl border bg-white font-extrabold py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={clientSignAndSend}
                    className="flex-1 rounded-2xl bg-[var(--primary)] text-white font-extrabold py-2 inline-flex items-center justify-center gap-2"
                  >
                    <FileSignature size={16} />
                    Sign & send
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Talent agreement review modal */}
          {talentAgreementViewOpen && isTalent && agreement?.status === "sent_to_talent" && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full md:max-w-2xl bg-white rounded-t-2xl md:rounded-2xl overflow-hidden"
              >
                <div className="p-5 border-b">
                  <div className="text-lg font-extrabold">Review Agreement</div>
                  <div className="text-xs text-gray-500 font-semibold mt-1">
                    Read the terms carefully before signing.
                  </div>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Payment section */}
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="font-extrabold text-sm mb-3">Payment Terms</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Payment type</span>
                        <span className="font-extrabold">{agreement.terms.payType.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          {agreement.terms.payType === "hourly" ? "Amount per hour" : "Agreed amount"}
                        </span>
                        <span className="font-extrabold">
                          ₦{agreement.terms.amountAgreed.toLocaleString()}
                        </span>
                      </div>
                      {agreement.terms.payType === "hourly" && agreement.terms.hoursDuration && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total hours</span>
                          <span className="font-extrabold">{agreement.terms.hoursDuration} hours</span>
                        </div>
                      )}
                      <div className="pt-2 border-t flex items-center justify-between">
                        <span className="text-gray-600 font-semibold">
                          Total amount
                        </span>
                        <span className="font-extrabold">
                          ₦{(
                            agreement.terms.payType === "hourly" && agreement.terms.hoursDuration
                              ? agreement.terms.amountAgreed * agreement.terms.hoursDuration
                              : agreement.terms.amountAgreed
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Duration section */}
                  {!agreement.terms.hoursDuration && agreement.terms.durationText && (
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-extrabold text-sm mb-2">Duration</div>
                      <div className="text-sm text-gray-700">{agreement.terms.durationText}</div>
                    </div>
                  )}

                  {/* Scope section */}
                  {agreement.terms.scopeOfWork && (
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-extrabold text-sm mb-2">Scope of Work</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{agreement.terms.scopeOfWork}</div>
                    </div>
                  )}

                  {/* Deliverables section */}
                  {agreement.terms.deliverables && (
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-extrabold text-sm mb-2">Deliverables</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{agreement.terms.deliverables}</div>
                    </div>
                  )}

                  {/* Milestones section */}
                  {agreement.terms.milestones && (
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-extrabold text-sm mb-2">Milestones & Timeline</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{agreement.terms.milestones}</div>
                    </div>
                  )}

                  {/* Notes section */}
                  {agreement.terms.notes && (
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="font-extrabold text-sm mb-2">Additional Notes</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">{agreement.terms.notes}</div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="rounded-2xl border bg-red-50 p-4">
                    <div className="font-extrabold text-sm text-red-900 mb-2">Binding Agreement Disclaimer</div>
                    <div className="text-xs text-red-800 leading-relaxed">
                      By signing below, you agree that this contract is binding and enforceable. Any changes, modifications, or
                      cancellations can only occur if either party materially breaches the agreed terms, or both parties mutually
                      consent in writing through this platform.
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t flex flex-col gap-2">
                  <button
                    onClick={talentSign}
                    className="w-full rounded-2xl bg-[var(--primary)] text-white font-extrabold py-3 inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
                  >
                    <CheckCircle2 size={16} />
                    Sign Agreement
                  </button>

                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-sm font-extrabold mb-2">Decline (optional)</div>
                    <textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Why are you declining?"
                      className="w-full min-h-[80px] rounded-2xl border p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <button
                      onClick={talentDecline}
                      className="mt-2 w-full rounded-2xl border bg-white font-extrabold py-2 hover:bg-gray-50 transition"
                    >
                      Decline with reason
                    </button>
                  </div>

                  <button
                    onClick={() => setTalentAgreementViewOpen(false)}
                    className="w-full rounded-2xl border bg-white font-extrabold py-2 hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}

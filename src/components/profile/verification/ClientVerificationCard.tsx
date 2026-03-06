"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Button from "@/components/ui/Button"
import { BadgeCheck, ShieldAlert } from "lucide-react"
import { uploadFileWithProgress, makeUserPath } from "@/lib/upload"

type KycStatus = "not_submitted" | "pending" | "verified" | "rejected"

export default function ClientVerificationCard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [status, setStatus] = useState<KycStatus>("not_submitted")
  const [mode, setMode] = useState<"org"|"contact">("org")
  // org fields
  const [cacNumber, setCacNumber] = useState("")
  const [cacDocUrl, setCacDocUrl] = useState("")
  const [repName, setRepName] = useState("")
  const [repRole, setRepRole] = useState("")
  // contact person fields
  const [contactName, setContactName] = useState("")
  const [contactNin, setContactNin] = useState("")
  const [contactIdUrl, setContactIdUrl] = useState("")
  // admin note (visible when rejected)
  const [adminNotes, setAdminNotes] = useState("")

  const locked = useMemo(() => status === "pending" || status === "verified", [status])

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)
      const snap = await getDoc(doc(db, "users", user.uid))
      const data = (snap.data() || {}) as any
      const kyc = data?.orgKyc || {}

      setStatus((kyc?.status || "not_submitted") as KycStatus)
      setMode(kyc?.mode === "contact" ? "contact" : "org")
      // org data
      setCacNumber(kyc?.cacNumber || "")
      setCacDocUrl(kyc?.cacDocUrl || "")
      setRepName(kyc?.repName || "")
      setRepRole(kyc?.repRole || "")
      // contact data
      setContactName(kyc?.contactName || "")
      setContactNin(kyc?.contactNin || "")
      setContactIdUrl(kyc?.contactIdUrl || "")
      setAdminNotes(kyc?.adminNotes || "")
      setLoading(false)
    }
    run()
  }, [user?.uid])

  const uploadCacDoc = async (file: File) => {
    if (!user?.uid) return
    try {
      const path = makeUserPath(user.uid, "org-kyc/cac", file.name)
      const url = await uploadFileWithProgress({ path, file })
      setCacDocUrl(url)
      toast.success("CAC document uploaded")
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
    }
  }

  const submit = async () => {
    if (!user?.uid) return
    // validate based on mode
    if (mode === "org") {
      if (!cacNumber.trim()) return toast.error("CAC number is required")
      if (!cacDocUrl) return toast.error("Upload CAC proof document")
    } else {
      if (!contactName.trim()) return toast.error("Contact name is required")
      if (!contactNin.trim()) return toast.error("Contact person NIN is required")
      if (!contactIdUrl) return toast.error("Upload ID document for contact")
    }

    setSaving(true)
    try {
      const payload: any = { mode, status: "pending", updatedAt: serverTimestamp() }
      if (mode === "org") {
        payload.cacNumber = cacNumber.trim()
        payload.cacDocUrl = cacDocUrl
        payload.repName = repName.trim()
        payload.repRole = repRole.trim()
      } else {
        payload.contactName = contactName.trim()
        payload.contactNin = contactNin.trim()
        payload.contactIdUrl = contactIdUrl
      }

      await setDoc(
        doc(db, "users", user.uid),
        { orgKyc: payload, updatedAt: serverTimestamp() },
        { merge: true }
      )
      setStatus("pending")
      toast.success("Verification submitted. Awaiting review.")
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit verification")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-sm text-gray-600">Loading verification…</CardContent>
      </Card>
    )
  }

  const label =
    status === "verified"
      ? "Verified"
      : status === "pending"
      ? "Awaiting review"
      : status === "rejected"
      ? "Rejected (see note, edit allowed)"
      : "Not submitted"

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-[var(--primary)]" />
              <div className="font-extrabold">Organization verification</div>
            </div>

            <div className="mt-2 rounded-2xl border bg-orange-50 px-4 py-3 text-sm text-gray-700 flex items-start gap-3">
              <ShieldAlert className="text-[var(--primary)] mt-0.5" size={18} />
              <div>
                <div className="font-extrabold text-gray-900">Submit either organization CAC or contact person NIN</div>
                <div className="mt-1">
                  After submission, verification is locked until reviewed by admin.
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm font-extrabold text-gray-900">{label}</div>
        </div>

        {status === "rejected" && adminNotes && (
          <div className="text-sm text-red-700">
            <strong>Reason:</strong> {adminNotes}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>CAC Registration Number *</Label>
            <Input className="mt-2" value={cacNumber} onChange={(e) => setCacNumber(e.target.value)} disabled={locked} />
          </div>

          <div>
            <Label>Upload CAC proof (PDF/image) *</Label>
            <Input
              className="mt-2"
              type="file"
              accept=".pdf,image/*"
              disabled={locked}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadCacDoc(f)
                e.currentTarget.value = ""
              }}
            />
            {cacDocUrl && <div className="mt-2 text-xs text-gray-600">✅ Uploaded</div>}
          </div>

          <div>
            <Label>Authorized rep name</Label>
            <Input className="mt-2" value={repName} onChange={(e) => setRepName(e.target.value)} disabled={locked} />
          </div>

          <div>
            <Label>Authorized rep role</Label>
            <Input className="mt-2" value={repRole} onChange={(e) => setRepRole(e.target.value)} disabled={locked} />
          </div>
        </div>

        <Button onClick={submit} disabled={saving || locked}>
          {locked ? "Submitted" : saving ? "Submitting..." : "Submit verification"}
        </Button>
      </CardContent>
    </Card>
  )
}

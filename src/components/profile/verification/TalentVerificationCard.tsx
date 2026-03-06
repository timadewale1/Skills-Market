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
import { BadgeCheck, ShieldAlert, Upload } from "lucide-react"
import { uploadFileWithProgress, makeUserPath } from "@/lib/upload"

type KycStatus = "not_submitted" | "pending" | "verified" | "rejected"

export default function TalentVerificationCard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [status, setStatus] = useState<KycStatus>("not_submitted")
  const [nin, setNin] = useState("")
  const [idType, setIdType] = useState("NIN Slip")
  const [idUrl, setIdUrl] = useState("")
  const [proofUrl, setProofUrl] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

  const [uploadingId, setUploadingId] = useState(false)
  const [uploadingProof, setUploadingProof] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)
      const snap = await getDoc(doc(db, "users", user.uid))
      const data = (snap.data() || {}) as any
      const kyc = data?.kyc || {}

      setStatus((kyc?.status || "not_submitted") as KycStatus)
      setNin(kyc?.nin || "")
      setIdType(kyc?.idType || "NIN Slip")
      setIdUrl(kyc?.idUrl || "")
      setProofUrl(kyc?.proofOfAddressUrl || "")
      setAdminNotes(kyc?.adminNotes || "")
      setLoading(false)
    }
    run()
  }, [user?.uid])

  const locked = useMemo(() => status === "pending" || status === "verified", [status])

  const statusLabel =
    status === "verified"
      ? "Verified"
      : status === "pending"
      ? "Awaiting review"
      : status === "rejected"
      ? "Rejected (see note, edit allowed)"
      : "Not submitted"

  const submit = async () => {
    if (!user?.uid) return
    if (!nin.trim()) return toast.error("NIN is required")
    if (!idUrl) return toast.error("Upload a valid ID document")
    if (!proofUrl) return toast.error("Upload proof of address")

    setSaving(true)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          kyc: {
            nin: nin.trim(),
            idType,
            idUrl,
            proofOfAddressUrl: proofUrl,
            status: "pending",
            updatedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      setStatus("pending")
      toast.success("Verification submitted. Awaiting review.")

      // notify admins
      try {
        const token = await user.getIdToken()
        if (token) {
          await fetch("/api/admin/kyc-submitted", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fullName: user.displayName || "", role: "talent" }),
          })
        }
      } catch (err) {
        console.error("admin kyc notify failed", err)
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit verification")
    } finally {
      setSaving(false)
    }
  }

  const uploadId = async (file: File) => {
    if (!user?.uid) return
    setUploadingId(true)
    try {
      const path = makeUserPath(user.uid, "kyc/id", file.name)
      const url = await uploadFileWithProgress({ path, file })
      setIdUrl(url)
      toast.success("ID uploaded")
    } catch (e: any) {
      toast.error(e?.message || "ID upload failed")
    } finally {
      setUploadingId(false)
    }
  }

  const uploadProof = async (file: File) => {
    if (!user?.uid) return
    setUploadingProof(true)
    try {
      const path = makeUserPath(user.uid, "kyc/proof-address", file.name)
      const url = await uploadFileWithProgress({ path, file })
      setProofUrl(url)
      toast.success("Proof of address uploaded")
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
    } finally {
      setUploadingProof(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-sm text-gray-600">Loading verification…</CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-[var(--primary)]" />
              <div className="font-extrabold">Verification (KYC)</div>
            </div>

            <div className="mt-2 rounded-2xl border bg-orange-50 px-4 py-3 text-sm text-gray-700 flex items-start gap-3">
              <ShieldAlert className="text-[var(--primary)] mt-0.5" size={18} />
              <div>
                <div className="font-extrabold text-gray-900">Required before getting gigs</div>
                <div className="mt-1">
                  Submit your ID and proof of address. Once submitted, you can’t edit until reviewed.
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm font-extrabold text-gray-900">{statusLabel}</div>
        </div>

        {status === "rejected" && adminNotes && (
          <div className="text-sm text-red-700">
            <strong>Reason:</strong> {adminNotes}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>
              NIN <span className="text-red-600">*</span>
            </Label>
            <Input className="mt-2" value={nin} onChange={(e) => setNin(e.target.value)} disabled={locked} />
          </div>

          <div>
            <Label>ID Type</Label>
            <select
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
              value={idType}
              onChange={(e) => setIdType(e.target.value)}
              disabled={locked}
            >
              {["NIN Slip", "National ID", "Voter’s Card", "International Passport", "Driver’s License"].map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>
              Upload ID Document <span className="text-red-600">*</span>
            </Label>
            <Input
              className="mt-2"
              type="file"
              accept=".pdf,image/*"
              disabled={locked || uploadingId}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadId(f)
                e.currentTarget.value = ""
              }}
            />
            {idUrl && <div className="mt-2 text-xs text-gray-600">✅ Uploaded</div>}
          </div>

          <div>
            <Label>
              Proof of Address (utility bill etc.) <span className="text-red-600">*</span>
            </Label>
            <Input
              className="mt-2"
              type="file"
              accept=".pdf,image/*"
              disabled={locked || uploadingProof}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadProof(f)
                e.currentTarget.value = ""
              }}
            />
            {proofUrl && <div className="mt-2 text-xs text-gray-600">✅ Uploaded</div>}
          </div>
        </div>

        <Button onClick={submit} disabled={saving || locked}>
          {locked ? "Submitted" : saving ? "Submitting..." : "Submit verification"}
        </Button>

        <div className="text-xs text-gray-600 flex items-center gap-2">
          <Upload size={14} />
          Verification is locked after submission until reviewed by admin.
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Button from "@/components/ui/Button"

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i } }),
}

export default function ClientProfileForm() {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [orgName, setOrgName] = useState("")
  const [orgBio, setOrgBio] = useState("")
  const [website, setWebsite] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactRole, setContactRole] = useState("")

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)
      const snap = await getDoc(doc(db, "users", user.uid))
      const data = snap.data() as any
      const p = data?.orgProfile || {}

      setOrgName(p?.orgName || "")
      setOrgBio(p?.orgBio || "")
      setWebsite(p?.website || "")
      setContactName(p?.contactName || "")
      setContactRole(p?.contactRole || "")
      setLoading(false)
    }
    run()
  }, [user?.uid])

  const save = async () => {
    if (!user?.uid) return
    if (!orgName.trim()) return toast.error("Organization name is required")

    setSaving(true)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          orgProfile: {
            orgName: orgName.trim(),
            orgBio: orgBio.trim(),
            website: website.trim(),
            contactName: contactName.trim(),
            contactRole: contactRole.trim(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success("Organization profile updated")
    } catch (e: any) {
      toast.error(e?.message || "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-sm text-gray-600">
          Loading organization profile…
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial="hidden" animate="show">
      <motion.div variants={fadeUp} custom={0}>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">
              Organization profile (what talent will see)
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Organization name</Label>
                <Input className="mt-2" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div>
                <Label>Website (optional)</Label>
                <Input className="mt-2" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>About your organization</Label>
              <textarea
                value={orgBio}
                onChange={(e) => setOrgBio(e.target.value)}
                placeholder="What do you do? What SDGs are you focused on? What kind of talent do you hire?"
                className="mt-2 w-full min-h-[120px] rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Primary contact name</Label>
                <Input className="mt-2" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div>
                <Label>Primary contact role</Label>
                <Input className="mt-2" placeholder="e.g. Program Lead" value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
              </div>
            </div>

            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

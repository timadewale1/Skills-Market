"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Button from "@/components/ui/Button"
import { UploadCloud, Link as LinkIcon } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i } }),
}

export default function TalentProfileForm() {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [skills, setSkills] = useState("")
  const [portfolioLinks, setPortfolioLinks] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [twitter, setTwitter] = useState("")
  const [website, setWebsite] = useState("")

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)
      const snap = await getDoc(doc(db, "users", user.uid))
      const data = snap.data() as any
      const p = data?.publicProfile || {}

      setHeadline(p?.headline || "")
      setBio(p?.bio || "")
      setSkills((p?.skills || []).join(", "))
      setPortfolioLinks((p?.portfolioLinks || []).join(", "))
      setLinkedin(p?.linkedin || "")
      setTwitter(p?.twitter || "")
      setWebsite(p?.website || "")
      setLoading(false)
    }
    run()
  }, [user?.uid])

  const cleanCsv = (v: string) =>
    v.split(",").map((s) => s.trim()).filter(Boolean)

  const previewSkills = useMemo(() => cleanCsv(skills).slice(0, 10), [skills])

  const save = async () => {
    if (!user?.uid) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          publicProfile: {
            headline: headline.trim(),
            bio: bio.trim(),
            skills: cleanCsv(skills),
            portfolioLinks: cleanCsv(portfolioLinks),
            linkedin: linkedin.trim(),
            twitter: twitter.trim(),
            website: website.trim(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success("Profile updated")
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-sm text-gray-600">Loading profile…</CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial="hidden" animate="show">
      <motion.div variants={fadeUp} custom={0}>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">
              Public profile (what hirers see)
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Headline</Label>
                <Input
                  className="mt-2"
                  placeholder="e.g. Field Researcher helping NGOs deliver SDG outcomes"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              <div>
                <Label>Website (optional)</Label>
                <Input
                  className="mt-2"
                  placeholder="https://..."
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Bio</Label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short, clear bio (impact + results + what you do best)."
                className="mt-2 w-full min-h-[120px] rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <Label>Skills (comma separated)</Label>
              <Input
                className="mt-2"
                placeholder="e.g. Data collection, Research, Monitoring & Evaluation"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
              {!!previewSkills.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {previewSkills.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-semibold px-3 py-2 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <LinkIcon size={16} /> Portfolio links (comma separated)
                </Label>
                <Input
                  className="mt-2"
                  placeholder="https://..., https://..."
                  value={portfolioLinks}
                  onChange={(e) => setPortfolioLinks(e.target.value)}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <UploadCloud size={16} /> Resume upload (next)
                </Label>
                <Input className="mt-2" disabled placeholder="We’ll add resume upload in Wallet step" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>LinkedIn</Label>
                <Input
                  className="mt-2"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </div>
              <div>
                <Label>Twitter/X</Label>
                <Input
                  className="mt-2"
                  placeholder="https://x.com/..."
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>

              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="text-sm text-gray-600"
              >
                Tip: keep it short, clear, and results-focused.
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

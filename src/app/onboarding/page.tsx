"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { SDGS } from "@/data/sdgs"

// shadcn ui
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

// your button
import Button from "@/components/ui/Button"

type Role = "talent" | "client"

const AVAILABILITY = ["Full-time", "Part-time", "Contract"] as const
const WORK_MODE = ["Remote", "Hybrid", "On-site"] as const
const ORG_TYPE = [
  "NGO",
  "Social Enterprise",
  "Green Startup",
  "Government",
  "Other",
] as const
const ORG_SIZE = ["1–5", "6–20", "21–50", "50+"] as const

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [role, setRole] = useState<Role>("talent")
  const [saving, setSaving] = useState(false)

  // shared
  const [fullName, setFullName] = useState("")
  const [location, setLocation] = useState("")
  const [sdgTags, setSdgTags] = useState<string[]>([])

  // talent fields
  const [talentRoleTitle, setTalentRoleTitle] = useState("")
  const [yearsExperience, setYearsExperience] = useState("")
  const [availability, setAvailability] =
    useState<(typeof AVAILABILITY)[number]>("Contract")
  const [workMode, setWorkMode] =
    useState<(typeof WORK_MODE)[number]>("Remote")
  const [skills, setSkills] = useState("")
  const [portfolioUrl, setPortfolioUrl] = useState("")

  // client/org fields
  const [orgName, setOrgName] = useState("")
  const [orgType, setOrgType] =
    useState<(typeof ORG_TYPE)[number]>("NGO")
  const [orgSize, setOrgSize] =
    useState<(typeof ORG_SIZE)[number]>("1–5")
  const [orgWebsite, setOrgWebsite] = useState("") // optional
  const [focusAreas, setFocusAreas] = useState("")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  const cleanCsv = (value: string) =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

  const toggleSDG = (sdg: string) => {
    setSdgTags((prev) =>
      prev.includes(sdg) ? prev.filter((x) => x !== sdg) : [...prev, sdg]
    )
  }

  const subTitle = useMemo(() => {
    return role === "talent"
      ? "Set up your talent profile for impact-driven gigs."
      : "Set up your organization profile to hire purpose-driven talent."
  }, [role])

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to continue")
      return
    }

    // validation
    if (!fullName.trim()) return toast.error("Please enter your full name")
    if (!location.trim()) return toast.error("Please enter your location")
    if (sdgTags.length === 0) return toast.error("Pick at least one SDG focus")

    if (role === "talent") {
      if (!talentRoleTitle.trim())
        return toast.error("Please enter your role title")
      if (!skills.trim()) return toast.error("Please add at least one skill")
    }

    if (role === "client") {
      if (!orgName.trim()) return toast.error("Please enter organization name")
      // website optional ✅
    }

    setSaving(true)

    const payload: any = {
      uid: user.uid,
      email: user.email,
      role,
      fullName,
      location,
      sdgTags,
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
      // Only set createdAt if not already present (merge-safe)
      createdAt: serverTimestamp(),
    }

    if (role === "talent") {
      payload.talent = {
        roleTitle: talentRoleTitle,
        yearsExperience: yearsExperience ? Number(yearsExperience) : null,
        availability,
        workMode,
        skills: cleanCsv(skills),
        portfolioUrl: portfolioUrl.trim() || "",
      }
      payload.client = null
    } else {
      payload.client = {
        orgName,
        orgType,
        orgSize,
        website: orgWebsite.trim() || "",
        focusAreas: cleanCsv(focusAreas),
      }
      payload.talent = null
    }

    try {
      // ✅ Hard timeout so it never “hangs” forever
      const write = setDoc(doc(db, "users", user.uid), payload, { merge: true })
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("FIRESTORE_TIMEOUT")), 12000)
      )

      await Promise.race([write, timeout])

      // Write to publicProfiles
      await setDoc(
        doc(db, "publicProfiles", user.uid),
        {
          uid: user.uid,
          role,
          fullName,
          location,
          sdgTags, // ✅ from onboarding
          rating: { avg: 0, count: 0 },
          verification: { status: "not_submitted" },

          // ✅ searchable categories (empty for now; will be filled on profile)
          categories: [],

          // ✅ role-specific public fields
          talent:
            role === "talent"
              ? {
                  roleTitle: talentRoleTitle,
                  skills: cleanCsv(skills), // ✅ from onboarding
                }
              : null,

          client:
            role === "client"
              ? {
                  orgName,
                  orgType,
                  orgSize,
                  website: orgWebsite?.trim() || "",
                  focusAreas: cleanCsv(focusAreas),
                }
              : null,

          publicProfile: {
            photoURL: "",
            hourlyRate: null,
            bio: "",
            portfolio: [],
            socials: {},
            languages: [],
            education: [],
            certifications: [],
            employment: [],
          },

          profileComplete: false,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )

      // notify admins about onboarding completion
      try {
        const token = await auth.currentUser?.getIdToken()
        if (token) {
          await fetch("/api/admin/new-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ fullName, role }),
          })
        }
      } catch (err) {
        console.error("admin notify onboarding failed", err)
      }

      toast.success("Onboarding complete!")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Onboarding save failed:", err)

      if (err?.message === "FIRESTORE_TIMEOUT") {
        toast.error(
          "Saving is taking too long. Check Firestore Rules / internet connection."
        )
      } else if (err?.code === "permission-denied") {
        toast.error("Permission denied. Update Firestore rules for /users/{uid}.")
      } else {
        toast.error(err?.message || "Failed to save your profile")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--secondary)] px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Set up your profile
          </h1>
          <p className="text-gray-600 mt-2">{subTitle}</p>
        </div>

        {/* Role Selector */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Choose your account type</CardTitle>
            <CardDescription>
              This helps us personalize your experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("talent")}
                className={`rounded-xl border p-4 text-left transition ${
                  role === "talent"
                    ? "border-[var(--primary)] bg-white ring-2 ring-orange-100"
                    : "border-gray-200 bg-white hover:border-[var(--primary)]"
                }`}
              >
                <div className="font-bold">Talent</div>
                <div className="text-sm text-gray-600 mt-1">
                  Find gigs, earn income, and contribute to SDGs.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("client")}
                className={`rounded-xl border p-4 text-left transition ${
                  role === "client"
                    ? "border-[var(--primary)] bg-white ring-2 ring-orange-100"
                    : "border-gray-200 bg-white hover:border-[var(--primary)]"
                }`}
              >
                <div className="font-bold">Client / Organization</div>
                <div className="text-sm text-gray-600 mt-1">
                  Post gigs and hire purpose-driven talent.
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="h-5" />

        {/* Basic Info */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Basic information</CardTitle>
            <CardDescription>Help people recognize you quickly.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Lagos, Abuja, Remote"
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="h-5" />

        {/* Role-specific */}
        {role === "talent" ? (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Talent details</CardTitle>
              <CardDescription>Show what you do and how you work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roleTitle">Role title</Label>
                  <Input
                    id="roleTitle"
                    value={talentRoleTitle}
                    onChange={(e) => setTalentRoleTitle(e.target.value)}
                    placeholder="e.g. Field Researcher, UX Designer"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="years">Years of experience</Label>
                  <Input
                    id="years"
                    type="number"
                    min={0}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g. 2"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Availability</Label>
                  <div className="mt-2">
                    <Select
                      value={availability}
                      onValueChange={(v) => setAvailability(v as any)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABILITY.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Preferred work mode</Label>
                  <div className="mt-2">
                    <Select value={workMode} onValueChange={(v) => setWorkMode(v as any)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select work mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORK_MODE.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Research, Data collection, Reporting"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="portfolio">Portfolio link (optional)</Label>
                <Input
                  id="portfolio"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Organization details</CardTitle>
              <CardDescription>Tell talent who you are and what you do.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. CleanTech Hub"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Organization type</Label>
                  <div className="mt-2">
                    <Select value={orgType} onValueChange={(v) => setOrgType(v as any)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select org type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_TYPE.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Organization size</Label>
                  <div className="mt-2">
                    <Select value={orgSize} onValueChange={(v) => setOrgSize(v as any)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select org size" />
                      </SelectTrigger>
                      <SelectContent>
                        {ORG_SIZE.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://..."
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="focus">Focus areas (comma separated)</Label>
                <Input
                  id="focus"
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  placeholder="e.g. Climate action, Clean energy, Education"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="h-5" />

        {/* SDG Focus */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">SDG focus</CardTitle>
            <CardDescription>Select the SDGs you want to work on.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SDGS.map((sdg) => {
                const active = sdgTags.includes(sdg)
                return (
                  <button
                    key={sdg}
                    type="button"
                    onClick={() => toggleSDG(sdg)}
                    className={`text-xs font-semibold px-3 py-2 rounded-full border transition ${
                      active
                        ? "border-[var(--primary)] text-[var(--primary)] bg-orange-50"
                        : "border-gray-200 text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    }`}
                    aria-pressed={active}
                  >
                    {sdg}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <Button onClick={() => { if (saving) return; void handleSave(); }}>
            {saving ? "Saving..." : "Finish Setup"}
          </Button>

          <p className="text-sm text-gray-600">
            You can edit this later in your profile.
          </p>
        </div>
      </div>
    </div>
  )
}

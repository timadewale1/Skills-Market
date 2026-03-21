"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Button from "@/components/ui/Button"
import { BadgeCheck, MapPin, Pencil, Plus, Star } from "lucide-react"
import ReviewsList from "../reviews/ReviewsList"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

import AvatarUploader from "@/components/profile/parts/AvatarUploader"
import RateModal from "@/components/profile/modals/RateModal"
import EditTextModal from "@/components/profile/modals/EditTextModal"
import ListEditorModal from "@/components/profile/modals/ListEditorModal"

import PortfolioAddModal, { PortfolioItem } from "@/components/profile/portfolio/PortfolioAddModal"
import PortfolioDetailsModal from "@/components/profile/portfolio/PortfolioDetailsModal"
import TalentVerificationCard from "@/components/profile/verification/TalentVerificationCard"
import EditMultiSelectModal from "@/components/profile/modals/EditMultiSelectModal"
import { uploadFileWithProgress, makeUserPath } from "@/lib/upload"
import { hireCategories } from "@/data/navCategories"
import { SDGS } from "@/data/sdgs"
import { syncPublicProfile, slugifyName } from "@/lib/profileSync"

const ALL_CATEGORY_ITEMS = hireCategories.flatMap((c) => c.items)


function computeTalentProfileComplete(d: any) {
  const p = d?.publicProfile || {}
  const basics =
    !!p?.hourlyRate &&
    !!p?.bio &&
    Array.isArray(d?.talent?.skills) &&
    d.talent.skills.length > 0 &&
    Array.isArray(d?.sdgTags) &&
    d.sdgTags.length > 0

  const portfolioOk = Array.isArray(p?.portfolio) && p.portfolio.length > 0
  // you can relax/tighten this later
  return basics && portfolioOk
}

type EducationItem = {
  id: string
  type: "Primary" | "Secondary" | "Tertiary" | "Other"
  institution?: string
  qualification: string
  startYear: string
  endYear: string
}

type CertificationItem = {
  id: string
  name: string
  issuer: string
  year: string
  fileUrl?: string
  linkUrl?: string
}

type EmploymentItem = {
  id: string
  jobTitle: string
  company?: string
  startYear: string
  endYear: string
  responsibilities: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i } }),
}

export default function TalentProfilePage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [showCompletionTabs, setShowCompletionTabs] = useState(false)
  const [userDoc, setUserDoc] = useState<any>(null)

  const [fullName, setFullName] = useState("")
  const [location, setLocation] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")
  const [verified, setVerified] = useState(false)

  // ratings for talent profile
  const ratingAvg = useMemo(() => Number(userDoc?.rating?.avg || 0), [userDoc])
  const ratingCount = useMemo(() => Number(userDoc?.rating?.count || 0), [userDoc])

  // from onboarding
  const [roleTitle, setRoleTitle] = useState("-")
  const [hourlyRate, setHourlyRate] = useState<number | null>(null)
  const [skills, setSkills] = useState<string[]>([]) // must fetch from onboarding

  // profile sections
  const [bio, setBio] = useState("")
  const [languages, setLanguages] = useState<string[]>([])
  const [education, setEducation] = useState<EducationItem[]>([])
  const [certifications, setCertifications] = useState<CertificationItem[]>([])
  const [employment, setEmployment] = useState<EmploymentItem[]>([])

  const [resumeUrl, setResumeUrl] = useState<string>("") // upload later: we provide upload now

  // socials (separate fields)
  const [linkedin, setLinkedin] = useState("")
  const [twitter, setTwitter] = useState("")
  const [instagram, setInstagram] = useState("")
  const [website, setWebsite] = useState("")

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])

  // modals
  const [rateOpen, setRateOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [editBioOpen, setEditBioOpen] = useState(false)
  const [editLangOpen, setEditLangOpen] = useState(false)
  const [editSocialOpen, setEditSocialOpen] = useState(false)
  const [editSkillsOpen, setEditSkillsOpen] = useState(false)

const [portfolioMode, setPortfolioMode] = useState<"add" | "edit">("add")
const [portfolioEditing, setPortfolioEditing] = useState<PortfolioItem | null>(null)

  const [categories, setCategories] = useState<string[]>([])
  const [selectedSdgs, setSelectedSdgs] = useState<string[]>([])
  const [editSdgsOpen, setEditSdgsOpen] = useState(false)
  const [editCategoriesOpen, setEditCategoriesOpen] = useState(false)
  const [eduOpen, setEduOpen] = useState(false)
  const [certOpen, setCertOpen] = useState(false)
  const [empOpen, setEmpOpen] = useState(false)

  const [addPortfolioOpen, setAddPortfolioOpen] = useState(false)
  const [viewPortfolioOpen, setViewPortfolioOpen] = useState(false)
  const [activePortfolio, setActivePortfolio] = useState<PortfolioItem | null>(null)

  // resume upload state
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumePct, setResumePct] = useState(0)

  const savePartial = async (patch: any) => {
    if (!user?.uid) return
    const patchWithComplete = {
      ...patch,
      publicProfile: {
        ...patch.publicProfile,
        categories,
      },
      sdgTags: selectedSdgs,
      profileComplete: computeTalentProfileComplete({
        talent: { skills },
        sdgTags: selectedSdgs,
        publicProfile: { hourlyRate, bio, portfolio },
      }),
    }
    await setDoc(
      doc(db, "users", user.uid),
      { ...patchWithComplete, updatedAt: serverTimestamp() },
      { merge: true }
    )

    // Normalize socials, photo and hourly before syncing public profile
    const socialsFromUser =
      userDoc?.publicProfile?.socials ?? {
        website: userDoc?.publicProfile?.website || "",
        linkedin: userDoc?.publicProfile?.linkedin || "",
        instagram: userDoc?.publicProfile?.instagram || "",
        twitter: userDoc?.publicProfile?.twitter || "",
      }

    // photo: prefer userDoc.photoUrl (existing field), then publicProfile.photoURL
    const photo = userDoc?.photoUrl ?? userDoc?.publicProfile?.photoURL ?? ""

    // hourly: prefer talent.hourlyRate then publicProfile.hourlyRate
    const hourly = userDoc?.talent?.hourlyRate ?? userDoc?.publicProfile?.hourlyRate ?? null

    // yearsExperience normalization
    const yearsExperience =
      typeof userDoc?.talent?.yearsExperience === "number"
        ? userDoc.talent.yearsExperience
        : userDoc?.talent?.yearsExperience
        ? Number(userDoc.talent.yearsExperience)
        : null

    // Sync to publicProfiles (normalized payload)
    await syncPublicProfile(user.uid, {
      uid: user.uid,
      role: "talent",
      fullName: userDoc.fullName,
      slug: slugifyName(userDoc.fullName),
      location: userDoc.location || "",
      sdgTags: userDoc.sdgTags || [],
      profileComplete: !!userDoc.profileComplete,

      talent: {
        roleTitle: userDoc?.talent?.roleTitle || "",
        skills: userDoc?.talent?.skills || [],
        availability: userDoc?.talent?.availability || "",
        workMode: userDoc?.talent?.workMode || "",
        yearsExperience: yearsExperience,
      },

      publicProfile: {
        ...userDoc?.publicProfile,
        photoURL: photo,
        hourlyRate: userDoc?.talent?.hourlyRate ?? userDoc?.publicProfile?.hourlyRate ?? null,
        bio: userDoc?.publicProfile?.bio || "",
        portfolio: userDoc?.publicProfile?.portfolio || [],
        socials: socialsFromUser,
        education: userDoc?.publicProfile?.education || [],
        certifications: userDoc?.publicProfile?.certifications || [],
        employment: userDoc?.publicProfile?.employment || [],
        categories: userDoc?.publicProfile?.categories || [],
        languages: userDoc?.publicProfile?.languages || [],
      },

      verification: userDoc?.verification || { status: "not_submitted" },
      rating: userDoc?.rating || { avg: 0, count: 0 },
    })

    // Also save to publicProfiles
    await setDoc(
      doc(db, "publicProfiles", user.uid),
      {
        categories,
        sdgTags: selectedSdgs,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    // Reload user document to update local state
    const updatedSnap = await getDoc(doc(db, "users", user.uid))
    const updatedData = (updatedSnap.data() || {}) as any
    setUserDoc(updatedData)
  }

  const csvToArr = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

const addEmptyEducation = () => ({
  id: crypto.randomUUID(),
  type: "Tertiary" as const,
  institution: "",
  qualification: "",
  startYear: "",
  endYear: "",
})

const addEmptyCert = () => ({
  id: crypto.randomUUID(),
  name: "",
  issuer: "",
  year: "",
  fileUrl: "",
  linkUrl: "",
})

const addEmptyEmployment = () => ({
  id: crypto.randomUUID(),
  jobTitle: "",
  company: "",
  startYear: "",
  endYear: "",
  responsibilities: "",
})


  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const data = (snap.data() || {}) as any
        setUserDoc(data)
        setCategories(data?.publicProfile?.categories || data?.categories || [])
        setSelectedSdgs(data?.sdgTags || [])

        setFullName(data.fullName || "")
        setLocation(data.location || "")
        setPhotoUrl(data.photoUrl || "")
        setVerified(Boolean(data?.kyc?.status === "verified"))

        // onboarding / talent
        setRoleTitle(data?.talent?.roleTitle || "-")
        setHourlyRate(typeof data?.talent?.hourlyRate === "number" ? data.talent.hourlyRate : null)

        // ✅ skills fetched from onboarding
        setSkills(Array.isArray(data?.talent?.skills) ? data.talent.skills : [])

        const p = data?.publicProfile || {}
        setBio(p.bio || "")
        setLanguages(Array.isArray(p.languages) ? p.languages : [])
        setEducation(Array.isArray(p.education) ? p.education : [])
        setCertifications(Array.isArray(p.certifications) ? p.certifications : [])
        setEmployment(Array.isArray(p.employment) ? p.employment : [])
        setResumeUrl(p.resumeUrl || "")

        setLinkedin(p.linkedin || "")
        setTwitter(p.twitter || "")
        setInstagram(p.instagram || "")
        setWebsite(p.website || "")

        setPortfolio(Array.isArray(p.portfolio) ? p.portfolio : [])
      } catch (e: any) {
        toast.error(e?.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [user?.uid])

  const badgeClass = verified
    ? "bg-orange-50 text-[var(--primary)] border-[var(--primary)]"
    : "bg-gray-50 text-gray-600 border-gray-200"

  const publicHint = useMemo(
    () => "Everything you fill here is what hirers will see on your public profile.",
    []
  )

  const isProfileComplete = !!userDoc?.profileComplete
  const showTabs = isProfileComplete || showCompletionTabs

  // Resume upload
  const onResumePick = async (file: File) => {
    if (!user?.uid) return
    setResumeUploading(true)
    setResumePct(0)

    try {
      const { uploadFileWithProgress, makeUserPath } = await import("@/lib/upload")
      const path = makeUserPath(user.uid, "resume", file.name)
      const url = await uploadFileWithProgress({
        path,
        file,
        onProgress: setResumePct,
      })
      setResumeUrl(url)
      await savePartial({ publicProfile: { resumeUrl: url } })
      toast.success("Resume uploaded")
    } catch (e: any) {
      toast.error(e?.message || "Resume upload failed")
    } finally {
      setResumeUploading(false)
      setResumePct(0)
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-sm text-gray-600">Loading profile…</CardContent>
          </Card>
        </div>
      </div>
    )
  }


  return (
    <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <AvatarUploader
              uid={user!.uid}
              currentUrl={photoUrl}
              displayName={fullName}
              onUploaded={async (url) => {
                setPhotoUrl(url)
                await savePartial({ photoUrl: url })
              }}
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {fullName || "Your Profile"}
                </h1>

                <span className={`inline-flex items-center gap-2 text-xs font-extrabold px-3 py-1 rounded-full border ${badgeClass}`}>
                  <BadgeCheck size={14} />
                  {verified ? "Verified" : "Not verified"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <MapPin size={14} />
                {location || "-"}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <Star size={14} className="text-[var(--primary)]" />
                <span className="font-semibold">
                  {ratingAvg ? ratingAvg.toFixed(1) : "-"}
                </span>
                <span>({ratingCount || 0})</span>
              </div>

              <div className="text-sm text-gray-600 mt-2">{publicHint}</div>
            </div>
          </div>

          <div className="shrink-0">
            {!isProfileComplete && (
              <div>
                <Button onClick={() => setShowCompletionTabs(true)} className="w-full sm:w-auto font-extrabold">
                  Complete profile & verification
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Complete your profile before you can apply for gigs.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* review card for this talent profile */}
        {user?.uid && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="mt-6"
          >
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewsList
                  userId={user.uid}
                  emptyMessage="No review available for this talent yet."
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* COLLAPSED */}
        {!showTabs && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="mt-6"
          >
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm text-gray-700">
                  Click <span className="font-semibold">“Complete profile & verification”</span> to edit your public profile and submit verification.
                </div>

                <div className="mt-5 grid md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-xs font-semibold text-gray-500">Role title</div>
                    <div className="font-extrabold mt-1">{roleTitle}</div>
                  </div>
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-xs font-semibold text-gray-500">Hourly rate</div>
                    <div className="font-extrabold mt-1">
                      {hourlyRate === null ? "-" : `₦${hourlyRate.toLocaleString()}/hr`}
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-xs font-semibold text-gray-500">Verification</div>
                    <div className="font-extrabold mt-1">{verified ? "Verified" : "Not verified"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* EXPANDED */}
        <AnimatePresence>
          {showTabs && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35 }}
              className="mt-6 space-y-6"
            >
              {/* Role title */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500">Role title</div>
                        <div className="text-xl font-extrabold mt-1">{roleTitle}</div>
                      </div>
                      <button
                        onClick={() => setEditRoleOpen(true)}
                        className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Hourly rate */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500">Hourly rate</div>
                        <div className="text-xl font-extrabold mt-1">
                          {hourlyRate === null ? "-" : `₦${hourlyRate.toLocaleString()}/hr`}
                        </div>
                      </div>
                      <button
                        onClick={() => setRateOpen(true)}
                        className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Bio */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-500">Bio</div>
                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                          {bio || "-"}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditBioOpen(true)}
                        className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Portfolio */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500">Portfolio</div>
                        <div className="font-extrabold mt-1">Past works</div>
                      </div>
                      <button
  onClick={() => {
    setPortfolioMode("add")
    setPortfolioEditing(null)
    setAddPortfolioOpen(true)
  }}
  className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
>
  <Plus size={16} />
  Add work
</button>

                    </div>

                    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {portfolio.length === 0 ? (
                        <div className="text-sm text-gray-600">No works added yet.</div>
                      ) : (
                        portfolio.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActivePortfolio(item)
                              setViewPortfolioOpen(true)
                            }}
                            className="text-left rounded-2xl border bg-white overflow-hidden hover:border-[var(--primary)] transition"
                          >
                            {/* cover */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.coverUrl} alt="" className="h-[120px] w-full object-cover" />
                            <div className="p-3">
                              <div className="font-extrabold text-sm line-clamp-1">{item.title}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Impact focus */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">Impact focus</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* SDGs */}
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500">SDGs</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedSdgs.length ? (
                              selectedSdgs.map((s) => (
                                <Badge key={s} variant="outline" className="rounded-full">
                                  {s}
                                </Badge>
                              ))
                            ) : (
                              <div className="text-sm text-gray-600">No SDGs selected.</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setEditSdgsOpen(true)}
                          className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-500">Work categories</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {categories.length ? (
                              categories.slice(0, 8).map((c) => (
                                <Badge key={c} className="rounded-full bg-orange-50 text-[var(--primary)] border border-orange-200">
                                  {c}
                                </Badge>
                              ))
                            ) : (
                              <div className="text-sm text-gray-600">No categories selected.</div>
                            )}
                            {categories.length > 8 && (
                              <Badge variant="outline" className="rounded-full">
                                +{categories.length - 8} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setEditCategoriesOpen(true)}
                          className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Skills (from onboarding) */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5}>
               <Card className="rounded-2xl">
  <CardContent className="p-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-xs font-semibold text-gray-500">Skills</div>
        <div className="text-sm text-gray-600 mt-1">
          These started from onboarding - you can add more.
        </div>
      </div>

      <button
        onClick={() => setEditSkillsOpen(true)}
        className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
      >
        <Pencil size={16} />
        Edit
      </button>
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      {skills.length === 0 ? (
        <div className="text-sm text-gray-600">-</div>
      ) : (
        skills.map((s) => (
          <span key={s} className="text-xs font-extrabold px-3 py-2 rounded-full border bg-white">
            {s}
          </span>
        ))
      )}
    </div>
  </CardContent>
</Card>

              </motion.div>

              {/* Languages */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-500">Languages</div>
                        <div className="mt-2 text-sm text-gray-700">
                          {languages.length ? languages.join(", ") : "-"}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditLangOpen(true)}
                        className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Education */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
  <div>
    <div className="text-xs font-semibold text-gray-500">Education</div>
    <div className="font-extrabold mt-1">
      {education.length ? `${education.length} record(s)` : "-"}
    </div>
  </div>

  <button
    onClick={() => setEduOpen(true)}
    className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
  >
    <Pencil size={16} />
    Edit
  </button>
</div>


                    {education.length > 0 && (
                      <div className="mt-4 grid md:grid-cols-2 gap-3">
                        {education.map((e) => (
                          <div key={e.id} className="rounded-2xl border bg-white p-4">
                            <div className="text-xs font-semibold text-gray-500">{e.type}</div>
                            <div className="font-extrabold mt-1">{e.qualification}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {e.institution || "-"} • {e.startYear} - {e.endYear}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Certifications */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={7}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
  <div>
    <div className="text-xs font-semibold text-gray-500">Certifications</div>
    <div className="font-extrabold mt-1">
      {certifications.length ? `${certifications.length} record(s)` : "-"}
    </div>
  </div>

  <button
    onClick={() => setCertOpen(true)}
    className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
  >
    <Pencil size={16} />
    Edit
  </button>
</div>

                  </CardContent>
                </Card>
              </motion.div>

              {/* Employment */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={8}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
  <div>
    <div className="text-xs font-semibold text-gray-500">Employment</div>
    <div className="font-extrabold mt-1">
      {employment.length ? `${employment.length} record(s)` : "-"}
    </div>
  </div>

  <button
    onClick={() => setEmpOpen(true)}
    className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
  >
    <Pencil size={16} />
    Edit
  </button>
</div>

                  </CardContent>
                </Card>
              </motion.div>

              {/* Resume upload */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={9}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-500">Resume</div>
                        <div className="mt-2 text-sm text-gray-700">
                          {resumeUrl ? (
                            <a
                              href={resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--primary)] font-extrabold hover:underline"
                            >
                              View uploaded resume
                            </a>
                          ) : (
                            "No resume uploaded yet."
                          )}
                        </div>

                        <div className="mt-4">
                          <Label>Upload resume (PDF preferred)</Label>
                          <Input
                            className="mt-2"
                            type="file"
                            accept=".pdf,image/*"
                            disabled={resumeUploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) onResumePick(f)
                              e.currentTarget.value = ""
                            }}
                          />
                          {resumeUploading && (
                            <div className="text-xs text-gray-600 mt-2">
                              Uploading... {resumePct}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Socials (separate inputs) */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={10}>
                <Card className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-gray-500">Socials</div>
                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>LinkedIn</Label>
                            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="mt-2" />
                          </div>
                          <div>
                            <Label>Twitter/X</Label>
                            <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." className="mt-2" />
                          </div>
                          <div>
                            <Label>Instagram</Label>
                            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="mt-2" />
                          </div>
                          <div>
                            <Label>Website</Label>
                            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="mt-2" />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          try {
                            await savePartial({ publicProfile: { linkedin, twitter, instagram, website } })
                            toast.success("Socials updated")
                          } catch (e: any) {
                            toast.error(e?.message || "Failed to update socials")
                          }
                        }}
                        className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                      >
                        <Pencil size={16} />
                        Save
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Verification */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={11}>
                <TalentVerificationCard />
              </motion.div>

              {/* Modals */}
              <EditTextModal
  open={editSkillsOpen}
  title="Edit skills"
  description="Comma separated: e.g. Research, Reporting, Data Collection"
  initialValue={skills.join(", ")}
  placeholder="Enter skills separated by commas"
  onClose={() => setEditSkillsOpen(false)}
  onSave={async (val) => {
    const arr = csvToArr(val)
    setSkills(arr)
    await savePartial({ talent: { skills: arr } })
    toast.success("Skills updated")
  }}
/>


              <RateModal
                open={rateOpen}
                initialRate={hourlyRate}
                onClose={() => setRateOpen(false)}
                onSave={async (rate) => {
                  setHourlyRate(rate)
                  await savePartial({ talent: { hourlyRate: rate } })
                  toast.success("Hourly rate updated")
                }}
              />

              <EditTextModal
                open={editBioOpen}
                title="Edit bio"
                description="Keep it impact-focused and results-driven."
                initialValue={bio}
                placeholder="Write your bio..."
                multiline
                onClose={() => setEditBioOpen(false)}
                onSave={async (val) => {
                  setBio(val)
                  await savePartial({ publicProfile: { bio: val } })
                  toast.success("Bio updated")
                }}
              />

              <EditTextModal
                open={editLangOpen}
                title="Edit languages"
                description="Comma separated: e.g. English, Yoruba"
                initialValue={languages.join(", ")}
                placeholder="Enter languages separated by commas"
                onClose={() => setEditLangOpen(false)}
                onSave={async (val) => {
                  const arr = val.split(",").map((s) => s.trim()).filter(Boolean)
                  setLanguages(arr)
                  await savePartial({ publicProfile: { languages: arr } })
                  toast.success("Languages updated")
                }}
              />

             <PortfolioAddModal
  open={addPortfolioOpen}
  onClose={() => setAddPortfolioOpen(false)}
  uid={user!.uid}
  mode={portfolioMode}
  initialItem={portfolioEditing}
  onSave={async (item) => {
    const next =
      portfolioMode === "edit"
        ? portfolio.map((x) => (x.id === item.id ? item : x))
        : [item, ...portfolio]

    setPortfolio(next)
    await savePartial({ publicProfile: { portfolio: next } })
  }}
/>


              <PortfolioDetailsModal
  open={viewPortfolioOpen}
  onClose={() => {
    setViewPortfolioOpen(false)
    setActivePortfolio(null)
  }}
  item={activePortfolio}
  onEdit={(item) => {
    setViewPortfolioOpen(false)
    setActivePortfolio(null)
    setPortfolioMode("edit")
    setPortfolioEditing(item)
    setAddPortfolioOpen(true)
  }}
  onRemove={async (id) => {
    const next = portfolio.filter((x) => x.id !== id)
    setPortfolio(next)
    await savePartial({ publicProfile: { portfolio: next } })
    toast.success("Portfolio removed")
    setViewPortfolioOpen(false)
    setActivePortfolio(null)
  }}
/>


              {/* Education editor */}
             <ListEditorModal<EducationItem>
  open={eduOpen}
  title="Edit education"
  description="Add as many education records as you want."
  initialItems={education}
  onClose={() => setEduOpen(false)}
  onSave={async (items) => {
    setEducation(items)
    await savePartial({ publicProfile: { education: items } })
    toast.success("Education updated")
  }}
  onAdd={() => addEmptyEducation()}
  addLabel="Add education"
  renderRow={({ item, update, remove }) => (
    <div className="rounded-2xl border bg-white p-4 space-y-3" key={item.id}>
      <div className="flex justify-between gap-2">
        <div className="font-extrabold text-sm">Education record</div>
        <Button variant="outline" onClick={remove}>Remove</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <select
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            value={item.type}
            onChange={(e) => update({ ...item, type: e.target.value as any })}
          >
            {["Primary", "Secondary", "Tertiary", "Other"].map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Institution (optional)</Label>
          <Input className="mt-2" value={item.institution || ""} onChange={(e) => update({ ...item, institution: e.target.value })} />
        </div>

        <div>
          <Label>Start year</Label>
          <Input className="mt-2" value={item.startYear} onChange={(e) => update({ ...item, startYear: e.target.value })} placeholder="e.g. 2018" />
        </div>

        <div>
          <Label>End year</Label>
          <Input className="mt-2" value={item.endYear} onChange={(e) => update({ ...item, endYear: e.target.value })} placeholder="e.g. 2022" />
        </div>

        <div className="md:col-span-2">
          <Label>Qualification acquired</Label>
          <Input className="mt-2" value={item.qualification} onChange={(e) => update({ ...item, qualification: e.target.value })} placeholder="e.g. B.Sc, SSCE, Diploma" />
        </div>
      </div>
    </div>
  )}
/>
<Button
  variant="outline"
  onClick={() => setEducation((prev) => [...prev, addEmptyEducation()])}
  className="hidden"
/>


              {/* Certifications editor */}
              <ListEditorModal<CertificationItem>
  open={certOpen}
  title="Edit certifications"
  description="Add professional certifications. Upload certificate file or link."
  initialItems={certifications}
  onClose={() => setCertOpen(false)}
  onAdd={() => addEmptyCert()}
  addLabel="Add certification"
  onSave={async (items) => {
    setCertifications(items)
    await savePartial({ publicProfile: { certifications: items } })
    toast.success("Certifications updated")
  }}
  renderRow={({ item, update, remove }) => (
    <div key={item.id} className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="font-extrabold text-sm">Certification</div>
        <Button variant="outline" onClick={remove}>
          Remove
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Certification name</Label>
          <Input
            className="mt-2"
            value={item.name}
            onChange={(e) => update({ ...item, name: e.target.value })}
            placeholder="e.g. Project Management Professional (PMP)"
          />
        </div>

        <div>
          <Label>Issuing organization</Label>
          <Input
            className="mt-2"
            value={item.issuer || ""}
            onChange={(e) => update({ ...item, issuer: e.target.value })}
            placeholder="e.g. PMI, Coursera"
          />
        </div>

        <div>
          <Label>Year obtained</Label>
          <Input
            className="mt-2"
            value={item.year || ""}
            onChange={(e) => update({ ...item, year: e.target.value })}
            placeholder="e.g. 2023"
          />
        </div>

        <div>
          <Label>Certificate link (optional)</Label>
          <Input
            className="mt-2"
            value={item.linkUrl || ""}
            onChange={(e) => update({ ...item, linkUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* FILE UPLOAD */}
      <div>
        <Label>Upload certificate (PDF or image)</Label>
        <Input
          type="file"
          className="mt-2"
          accept="application/pdf,image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return

            try {
              const path = makeUserPath(
                user!.uid,
                "certifications",
                `${item.id}-${file.name}`
              )

              toast.loading("Uploading certificate...", { id: "cert-upload" })

              const url = await uploadFileWithProgress({
                path,
                file,
              })

              update({ ...item, fileUrl: url })

              toast.success("Certificate uploaded", { id: "cert-upload" })
            } catch {
              toast.error("Upload failed", { id: "cert-upload" })
            }
          }}
        />

        {item.fileUrl && (
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 text-sm font-extrabold text-[var(--primary)] hover:underline"
          >
            View uploaded certificate
          </a>
        )}
      </div>
    </div>
  )}
/>


              {/* Employment editor */}
              <ListEditorModal<EmploymentItem>
  open={empOpen}
  title="Edit employment history"
  description="Add job title, years, and responsibilities."
  initialItems={employment}
  onClose={() => setEmpOpen(false)}
  onSave={async (items) => {
    setEmployment(items)
    await savePartial({ publicProfile: { employment: items } })
    toast.success("Employment updated")
  }}
  onAdd={() => addEmptyEmployment()}
  addLabel="Add job"
                renderRow={({ item, update, remove }) => (
                  <div className="rounded-2xl border bg-white p-4 space-y-3" key={item.id}>
                    <div className="flex justify-between gap-2">
                      <div className="font-extrabold text-sm">Employment</div>
                      <Button variant="outline" onClick={remove}>Remove</Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Job title</Label>
                        <Input className="mt-2" value={item.jobTitle} onChange={(e) => update({ ...item, jobTitle: e.target.value })} />
                      </div>
                      <div>
                        <Label>Company (optional)</Label>
                        <Input className="mt-2" value={item.company || ""} onChange={(e) => update({ ...item, company: e.target.value })} />
                      </div>
                      <div>
                        <Label>Start year</Label>
                        <Input className="mt-2" value={item.startYear} onChange={(e) => update({ ...item, startYear: e.target.value })} />
                      </div>
                      <div>
                        <Label>End year</Label>
                        <Input className="mt-2" value={item.endYear} onChange={(e) => update({ ...item, endYear: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Responsibilities</Label>
                        <textarea
                          className="mt-2 w-full rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-100 min-h-[120px]"
                          value={item.responsibilities}
                          onChange={(e) => update({ ...item, responsibilities: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              />

              <EditMultiSelectModal
                open={editSdgsOpen}
                title="Edit SDGs"
                description="Select the Sustainable Development Goals that align with your impact focus areas."
                items={SDGS}
                initialSelected={selectedSdgs}
                onClose={() => setEditSdgsOpen(false)}
                onSave={async (selected) => {
                  setSelectedSdgs(selected)
                  await savePartial({ sdgTags: selected })
                  toast.success("SDGs updated")
                }}
              />

              <EditMultiSelectModal
                open={editCategoriesOpen}
                title="Edit work categories"
                description="Select categories that describe the type of work you do. These help with search and filtering."
                items={ALL_CATEGORY_ITEMS}
                initialSelected={categories}
                onClose={() => setEditCategoriesOpen(false)}
                onSave={async (selected) => {
                  setCategories(selected)
                  await savePartial({ publicProfile: { categories: selected } })
                  toast.success("Categories updated")
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

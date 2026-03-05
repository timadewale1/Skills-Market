"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Button from "@/components/ui/Button"
import { BadgeCheck, MapPin, Pencil, Plus, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

import AvatarUploader from "@/components/profile/parts/AvatarUploader"
import PortfolioAddModal, { PortfolioItem } from "@/components/profile/portfolio/PortfolioAddModal"
import PortfolioDetailsModal from "@/components/profile/portfolio/PortfolioDetailsModal"
import ClientVerificationCard from "@/components/profile/verification/ClientVerificationCard"
import EditMultiSelectModal from "@/components/profile/modals/EditMultiSelectModal"
import EditTextModal from "@/components/profile/modals/EditTextModal"
import { hireCategories } from "@/data/navCategories"
import { SDGS } from "@/data/sdgs"
import { syncPublicProfile, slugifyName } from "@/lib/profileSync"
import ReviewsList from "../reviews/ReviewsList"

const ALL_CATEGORY_ITEMS = hireCategories.flatMap((c) => c.items)

function computeClientProfileComplete(d: any) {
  const p = d?.orgProfile || {}
  const basics =
    !!p?.about &&
    !!p?.website &&
    !!p?.contactEmail &&
    Array.isArray(d?.sdgTags) &&
    d.sdgTags.length > 0

  const portfolioOk = Array.isArray(p?.portfolio) && p.portfolio.length > 0
  // you can relax/tighten this later
  return basics && portfolioOk
}

export default function ClientProfilePage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [showCompletionTabs, setShowCompletionTabs] = useState(false)
  const [userDoc, setUserDoc] = useState<any>(null)

  const [orgName, setOrgName] = useState("Organization")
  const [location, setLocation] = useState("—")
  const [photoUrl, setPhotoUrl] = useState("")
  const [verified, setVerified] = useState(false)

  const [about, setAbout] = useState("")
  const [website, setWebsite] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [portfolioMode, setPortfolioMode] = useState<"add" | "edit">("add")
  const [portfolioEditing, setPortfolioEditing] = useState<PortfolioItem | null>(null)

  // ratings for client profile
  const ratingAvg = useMemo(() => Number(userDoc?.rating?.avg || 0), [userDoc])
  const ratingCount = useMemo(() => Number(userDoc?.rating?.count || 0), [userDoc])
  const [addPortfolioOpen, setAddPortfolioOpen] = useState(false)
  const [viewPortfolioOpen, setViewPortfolioOpen] = useState(false)
  const [activePortfolio, setActivePortfolio] = useState<PortfolioItem | null>(null)

  const [editAboutOpen, setEditAboutOpen] = useState(false)

  const [categories, setCategories] = useState<string[]>([])
  const [selectedSdgs, setSelectedSdgs] = useState<string[]>([])
  const [editSdgsOpen, setEditSdgsOpen] = useState(false)
  const [editCategoriesOpen, setEditCategoriesOpen] = useState(false)

  const savePartial = async (patch: any) => {
    if (!user?.uid) return
    const patchWithComplete = {
      ...patch,
      orgProfile: {
        ...patch.orgProfile,
        categories,
      },
      sdgTags: selectedSdgs,
      profileComplete: computeClientProfileComplete({
        sdgTags: selectedSdgs,
        orgProfile: { about, website, contactEmail, contactPhone, portfolio },
      }),
    }
    await setDoc(doc(db, "users", user.uid), { ...patchWithComplete, updatedAt: serverTimestamp() }, { merge: true })

    // Normalize socials and photo for client public profile
    const socialsFromUser =
      userDoc?.orgProfile?.socials ?? {
        website: userDoc?.orgProfile?.website || "",
        linkedin: userDoc?.orgProfile?.linkedin || "",
        instagram: userDoc?.orgProfile?.instagram || "",
        twitter: userDoc?.orgProfile?.twitter || "",
      }

    const photo = userDoc?.photoUrl ?? userDoc?.publicProfile?.photoURL ?? ""

    // Sync to publicProfiles (normalized payload)
    await syncPublicProfile(user.uid, {
      uid: user.uid,
      role: "client",
      fullName: userDoc.fullName,
      slug: slugifyName(userDoc.fullName),
      location: userDoc.location || "",
      sdgTags: selectedSdgs,
      profileComplete: !!userDoc.profileComplete,

      orgProfile: {
        about: userDoc?.orgProfile?.about || "",
        website: userDoc?.orgProfile?.website || "",
        contactEmail: userDoc?.orgProfile?.contactEmail || "",
        contactPhone: userDoc?.orgProfile?.contactPhone || "",
        portfolio: userDoc?.orgProfile?.portfolio || [],
        socials: socialsFromUser,
        categories: categories,
        industries: userDoc?.orgProfile?.industries || [],
      },

      publicProfile: {
        photoURL: photo,
        portfolio: userDoc?.orgProfile?.portfolio || [],
        socials: socialsFromUser,
        categories: categories,
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

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        const data = (snap.data() || {}) as any
        setUserDoc(data)
        setCategories(data?.orgProfile?.categories || data?.categories || [])
        setSelectedSdgs(data?.sdgTags || [])

        setOrgName(data?.client?.orgName || "Organization")
        setLocation(data.location || "—")
        setPhotoUrl(data.photoUrl || "")
        setVerified(Boolean(data?.orgKyc?.status === "verified"))

        const p = data?.orgProfile || {}
        setAbout(p.about || "")
        setWebsite(p.website || data?.client?.website || "")
        setContactEmail(p.contactEmail || data?.email || "")
        setContactPhone(p.contactPhone || "")

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

  const isProfileComplete = !!userDoc?.profileComplete
  const showTabs = isProfileComplete || showCompletionTabs

  if (loading) {
    return (
      <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-sm text-gray-600">Loading…</CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
              displayName={orgName}
              onUploaded={async (url) => {
                setPhotoUrl(url)
                await savePartial({ photoUrl: url })
              }}
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{orgName}</h1>
                <span className={`inline-flex items-center gap-2 text-xs font-extrabold px-3 py-1 rounded-full border ${badgeClass}`}>
                  <BadgeCheck size={14} />
                  {verified ? "Verified" : "Not verified"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <MapPin size={14} /> {location}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <Star size={14} className="text-[var(--primary)]" />
                <span className="font-semibold">
                  {ratingAvg ? ratingAvg.toFixed(1) : "—"}
                </span>
                <span>({ratingCount || 0})</span>
              </div>

              <div className="text-sm text-gray-600 mt-2">
                Your organization profile is what talent will see when applying to your gigs.
              </div>
            </div>
          </div>

          {!isProfileComplete && (
            <div>
              <Button onClick={() => setShowCompletionTabs(true)} className="font-extrabold">
                Complete profile & verification
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Complete your profile before you can post gigs.
              </p>
            </div>
          )}
        </motion.div>

        {/* reviews card for this client profile */}
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
                  emptyMessage="No review available for this client yet."
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!showTabs && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="mt-6">
            <Card className="rounded-2xl">
              <CardContent className="p-6 text-sm text-gray-700">
                Click <span className="font-semibold">“Complete profile & verification”</span> to update organization details and submit verification.
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AnimatePresence>
          {showTabs && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35 }}
              className="mt-6 space-y-6"
            >
              {/* About */}
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-500">About</div>
                      <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{about || "—"}</div>
                    </div>
                    <button
                      onClick={() => setEditAboutOpen(true)}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="text-xs font-semibold text-gray-500">Contacts</div>

                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Website</Label>
                      <Input className="mt-2" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <Label>Contact email</Label>
                      <Input className="mt-2" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="example@org.com" />
                    </div>
                    <div>
                      <Label>Contact phone</Label>
                      <Input className="mt-2" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+234..." />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      onClick={async () => {
                        try {
                          await savePartial({ orgProfile: { about, website, contactEmail, contactPhone, portfolio } })
                          toast.success("Organization profile updated")
                        } catch (e: any) {
                          toast.error(e?.message || "Failed to save")
                        }
                      }}
                    >
                      Save changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Org portfolio/projects */}
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500">Projects / Portfolio</div>
                      <div className="font-extrabold mt-1">Past impact projects</div>
                    </div>
                    <button
                      onClick={() => setAddPortfolioOpen(true)}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-black hover:text-[var(--primary)]"
                    >
                      <Plus size={16} />
                      Add project
                    </button>
                  </div>

                  <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {portfolio.length === 0 ? (
                      <div className="text-sm text-gray-600">No projects added yet.</div>
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

              {/* Impact focus */}
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

              {/* Verification */}
              <ClientVerificationCard />

              {/* Modals */}
              <EditTextModal
                open={editAboutOpen}
                title="Edit about"
                initialValue={about}
                multiline
                placeholder="Tell talent about your organization..."
                onClose={() => setEditAboutOpen(false)}
                onSave={async (val) => {
                  setAbout(val)
                  await savePartial({ orgProfile: { about: val } })
                  toast.success("About updated")
                }}
              />

              <PortfolioAddModal
                open={addPortfolioOpen}
                onClose={() => {
                  setAddPortfolioOpen(false)
                  setPortfolioEditing(null)
                }}
                uid={user!.uid}
                mode={portfolioMode}
                initialItem={portfolioEditing}
                onSave={async (item: PortfolioItem) => {
                  const next = portfolioMode === "edit" ? portfolio.map((x) => (x.id === item.id ? item : x)) : [item, ...portfolio]
                  setPortfolio(next)
                  await savePartial({ orgProfile: { portfolio: next } })
                }}
              />

              <PortfolioDetailsModal
                open={viewPortfolioOpen}
                onClose={() => {
                  setViewPortfolioOpen(false)
                  setActivePortfolio(null)
                }}
                item={activePortfolio}
                onEdit={(item: PortfolioItem) => {
                  setPortfolioMode("edit")
                  setPortfolioEditing(item)
                  setAddPortfolioOpen(true)
                  setViewPortfolioOpen(false)
                }}
                onRemove={async (id: string) => {
                  const next = portfolio.filter((p) => p.id !== id)
                  setPortfolio(next)
                  await savePartial({ orgProfile: { portfolio: next } })
                  setViewPortfolioOpen(false)
                  setActivePortfolio(null)
                }}
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
                description="Select categories that describe the type of work you seek. These help with search and filtering."
                items={ALL_CATEGORY_ITEMS}
                initialSelected={categories}
                onClose={() => setEditCategoriesOpen(false)}
                onSave={async (selected) => {
                  setCategories(selected)
                  await savePartial({ orgProfile: { categories: selected } })
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

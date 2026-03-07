"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Briefcase,
  Users,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Search,
  ShieldCheck,
  Star,
  MapPin,
  FolderOpen,
} from "lucide-react"
import Link from "next/link"
import { motion, animate } from "framer-motion"
import { Wallet } from "lucide-react"
import TalentCard, { TalentRow } from "@/components/talent/TalentCard"
import { matchTalentsToClient } from "@/lib/matching"
import { fetchPublicTalents } from "@/lib/publicProfile"
import { matchGigsToTalent, Gig } from "@/lib/matching"
import { fetchPublicGigs } from "@/lib/publicGigs"

type Role = "talent" | "client"
type UserDoc = {
  role: Role
  profileComplete?: boolean
  fullName?: string
  location?: string
  sdgTags?: string[]
  rating?: {
    avg?: number // e.g 4.7
    count?: number // e.g 12
  }
  talent?: { roleTitle?: string }
  client?: { orgName?: string }
  wallet?: {
    totalEarned?: number
    totalDeposited?: number
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.35 },
  }),
}

// gentle floating animation (subtle "alive" movement)
const floaty = {
  animate: {
    y: [0, -4, 0],
  },
  transition: {
    duration: 3.2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [walletTotal, setWalletTotal] = useState(0)


  // Animated stats (count-up)
  const [statA, setStatA] = useState(0)
  const [statB, setStatB] = useState(0)
  const [statC, setStatC] = useState(0)

  // Rating count-up
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)

  // Suggested talents for clients
  const [suggestedTalents, setSuggestedTalents] = useState<TalentRow[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(false)

  // Suggested gigs for talents
  const [suggestedGigs, setSuggestedGigs] = useState<Gig[]>([])
  const [suggestedGigsLoading, setSuggestedGigsLoading] = useState(false)

  // Workspaces count
  const [workspacesCount, setWorkspacesCount] = useState(0)

  // Recent activities
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)

      const snap = await getDoc(doc(db, "users", user.uid))
      const data = (snap.data() as any) || null

      setProfile(data)
      setLoading(false)

      const role: Role = data?.role

      const rAvg = Number(data?.rating?.avg || 0)
      const rCount = Number(data?.rating?.count || 0)

      // Fetch counts for stats
      let activeProposals = 0
      let openGigs = 0
      let messages = 0
      let workspaces = 0

      if (role === "talent") {
        // For talent, active proposals count - since proposals are subcollections, set to 0 for now
        activeProposals = 0
      } else {
        try {
          const gigsQuery = query(collection(db, "gigs"), where("clientUid", "==", user.uid))
          const gigsSnap = await getDocs(gigsQuery)
          openGigs = gigsSnap.docs.filter((doc) => doc.data().status === "open").length
        } catch (error) {
          console.error('Error fetching gigs:', error)
          openGigs = 0
        }
      }

      // Fetch messages count - count threads where user is participant
      try {
        const threadsQuery = query(collection(db, "threads"), where("participants", "array-contains", user.uid))
        const threadsSnap = await getDocs(threadsQuery)
        messages = threadsSnap.size
      } catch (error) {
        console.error('Error fetching threads:', error)
        messages = 0
      }

      // Fetch workspaces count
      try {
        let workspacesQuery
        if (role === "talent") {
          workspacesQuery = query(collection(db, "workspaces"), where("talentUid", "==", user.uid))
        } else {
          workspacesQuery = query(collection(db, "workspaces"), where("clientUid", "==", user.uid))
        }
        const workspacesSnap = await getDocs(workspacesQuery)
        workspaces = workspacesSnap.size
      } catch (error) {
        console.error('Error fetching workspaces:', error)
        workspaces = 0
      }

      // Fetch wallet total from wallets collection
      let earned = 0
      let deposited = 0
      try {
        const walletDoc = await getDoc(doc(db, "wallets", user.uid))
        if (walletDoc.exists()) {
          earned = Number(walletDoc.data()?.totalEarned || 0)
          deposited = Number(walletDoc.data()?.totalDeposited || 0)
          console.log('Wallet data fetched:', { earned, deposited })
        }
      } catch (error) {
        console.error('Error fetching wallet:', error)
        earned = Number(data?.wallet?.totalEarned || 0)
        deposited = Number(data?.wallet?.totalDeposited || 0)
      }
      const total = role === "client" ? deposited : earned
      animate(0, total, {
        duration: 0.9,
        onUpdate: (v) => setWalletTotal(Math.round(v)),
      })

      animate(0, rAvg, {
        duration: 0.9,
        onUpdate: (v) => setAvgRating(Number(v.toFixed(1))),
      })

      // Fetch suggested talents for clients
      if (role === "client") {
        setSuggestedLoading(true)
        try {
          const allTalents = await fetchPublicTalents(20)
          const clientCriteria = {
            uid: user?.uid || "",
            fullName: data?.client?.orgName || data?.fullName || "",
            skills: data?.orgProfile?.categories || data?.categories || [],
            categories: data?.orgProfile?.categories || data?.categories || [],
            sdgTags: data?.sdgTags || [],
            workMode: data?.workMode || "",
            location: data?.location || "",
          }
          const matched = matchTalentsToClient(allTalents, clientCriteria)
          const talentRows: TalentRow[] = matched.slice(0, 8).map((t) => ({
            uid: t.uid,
            slug: t.slug,
            fullName: t.fullName,
            location: t.location,
            roleTitle: t.roleTitle,
            photoURL: t.photoURL,
            hourlyRate: t.hourlyRate,
            skills: t.skills,
            rating: t.rating,
            verification: t.verification,
            workMode: t.workMode,
          }))
          setSuggestedTalents(talentRows)
        } catch (error) {
          console.error("Failed to fetch suggested talents:", error)
        } finally {
          setSuggestedLoading(false)
        }
      }

      // Fetch suggested gigs for talents
      if (role === "talent") {
        setSuggestedGigsLoading(true)
        try {
          const allGigs = await fetchPublicGigs(20)
          const talentCriteria = {
            uid: user?.uid || "",
            fullName: data?.fullName || "",
            skills: data?.talent?.skills || [],
            categories: data?.talent?.skills || [], // Use skills as categories fallback
            sdgTags: data?.sdgTags || [],
            workMode: data?.talent?.workMode || "",
            location: data?.location || "",
          }
          const matched = matchGigsToTalent(allGigs, talentCriteria)
          setSuggestedGigs(matched.slice(0, 8))
        } catch (error) {
          console.error("Failed to fetch suggested gigs:", error)
        } finally {
          setSuggestedGigsLoading(false)
        }
      }

      // Set stat targets and animate - using setTimeout to ensure promised values are ready
      setTimeout(() => {
        let aTarget = 0
        let bTarget = 0
        let cTarget = 0

        if (role === "talent") {
          aTarget = suggestedGigs.length
          bTarget = activeProposals
          cTarget = messages
          console.log('Talent stats:', { suggested: aTarget, proposals: bTarget, messages: cTarget })
        } else {
          aTarget = suggestedTalents.length
          bTarget = openGigs
          cTarget = messages
          console.log('Client stats:', { suggested: aTarget, gigs: bTarget, messages: cTarget })
        }

        animate(0, aTarget, { duration: 0.8, onUpdate: (v) => setStatA(Math.round(v)) })
        animate(0, bTarget, { duration: 0.9, onUpdate: (v) => setStatB(Math.round(v)) })
        animate(0, cTarget, { duration: 1.0, onUpdate: (v) => setStatC(Math.round(v)) })
      }, 500)

      // Workspaces count
      animate(0, workspaces, { duration: 0.8, onUpdate: (v) => setWorkspacesCount(Math.round(v)) })

      // Fetch recent activities
      try {
        if (role === "talent") {
          try {
            const workspacesQuery = query(collection(db, "workspaces"), where("talentUid", "==", user.uid), orderBy("createdAt", "desc"), limit(5))
            const snap = await getDocs(workspacesQuery)
            const activities = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "workspace" }))
            console.log('Talent activities:', activities)
            setRecentActivities(activities)
          } catch (error) {
            console.error('Error fetching workspaces for activities:', error)
            setRecentActivities([])
          }
        } else {
          try {
            const gigsQuery = query(collection(db, "gigs"), where("clientUid", "==", user.uid), orderBy("createdAt", "desc"), limit(5))
            const snap = await getDocs(gigsQuery)
            const activities = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: "gig" }))
            console.log('Client activities:', activities)
            setRecentActivities(activities)
          } catch (error) {
            console.error('Error fetching gigs for activities:', error)
            setRecentActivities([])
          }
        }
      } catch (error) {
        console.error('Error in recent activities:', error)
        setRecentActivities([])
      }

      animate(0, rCount, {
        duration: 0.9,
        onUpdate: (v) => setRatingCount(Math.round(v)),
      })
    }

    run()
  }, [user?.uid])

  const headline = useMemo(() => {
    if (!profile) return "Dashboard"
    if (profile.role === "talent") {
      return `Welcome, ${profile.fullName?.split(" ")[0] || "Talent"}`
    }
    return `Welcome, ${profile.client?.orgName || profile.fullName || "Organization"}`
  }, [profile])

  const sub = useMemo(() => {
    if (!profile) return "Your impact workspace"
    if (profile.role === "talent") {
      return "Find impact gigs, send proposals, and grow your profile."
    }
    return "Post gigs, shortlist talent, and manage your hiring pipeline."
  }, [profile])

  const primaryActions = useMemo(() => {
    if (profile?.role === "client") {
      return [
        {
          title: "Post a gig",
          desc: "Create a new SDG-aligned role and start receiving proposals.",
          href: "/dashboard/post-gig",
          icon: PlusCircle,
        },
        {
          title: "Search talent",
          desc: "Find talent by SDGs, skills, and location.",
          href: "/search?type=talent",
          icon: Search,
        },
        {
          title: "Saved talent",
          desc: "View the talent you've bookmarked.",
          href: "/dashboard/saved-talents",
          icon: Users,
        },
        {
          title: "Workspaces",
          desc: "Manage your active projects and collaborations.",
          href: "/dashboard/workspaces",
          icon: FolderOpen,
        },
        {
          title: "Messages",
          desc: "Communicate with talent and teams.",
          href: "/dashboard/messages",
          icon: MessageSquare,
        },
        {
          title: "Gigs",
          desc: "View and manage your posted gigs.",
          href: "/dashboard/gigs",
          icon: Briefcase,
        },
      ]
    }
    return [
      {
        title: "Find work",
        desc: "Browse gigs aligned with your SDG focus.",
        href: "/dashboard/find-work",
        icon: Search,
      },
      {
        title: "Workspaces",
        desc: "Access your active project workspaces.",
        href: "/dashboard/workspaces",
        icon: FolderOpen,
      },
      {
        title: "Messages",
        desc: "Check communications from clients.",
        href: "/dashboard/messages",
        icon: MessageSquare,
      },
      {
        title: "Proposals",
        desc: "Track your submitted proposals.",
        href: "/dashboard/proposals",
        icon: TrendingUp,
      },
    ]
  }, [profile?.role])

  const role = profile?.role || "talent"

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={0}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {headline}
              </h1>
              <p className="text-gray-600 mt-2">{sub}</p>
            </div>

            {/* Alive badge (pulse ring) */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border bg-white relative">
              <motion.span
                aria-hidden
                className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-[var(--primary)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <Sparkles size={16} className="text-[var(--primary)]" />
              <span className="text-gray-700">SDG-first marketplace • Nigeria</span>
            </div>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={1}
            className="mt-4"
          >
            <div className="bg-white border rounded-2xl px-4 py-3 flex items-center gap-3 text-sm text-gray-700">
              <motion.div
                className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center"
                {...floaty}
              >
                <ShieldCheck className="text-[var(--primary)]" size={18} />
              </motion.div>

              <div className="flex-1">
                <span className="font-extrabold text-gray-900">Impact-first matching</span>{" "}
                — gigs and talent are organized by SDGs, location, and budget.
              </div>

              <div className="hidden md:block text-xs font-semibold text-gray-600">
                MVP mode
              </div>
            </div>
          </motion.div>

          

          {/* Stat cards + Ratings card + Workspaces */}
          <motion.div
            initial="hidden"
            animate="show"
            className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            {role === "talent" ? (
              <>
                <StatCard
                  i={0}
                  icon={<Briefcase className="text-[var(--primary)]" size={18} />}
                  title="Recommended gigs"
                  value={statA}
                  hint="Based on your SDG focus"
                />
                <StatCard
                  i={1}
                  icon={<TrendingUp className="text-[var(--primary)]" size={18} />}
                  title="Active proposals"
                  value={statB}
                  hint="Track your applications"
                />
                <StatCard
                  i={2}
                  icon={<MessageSquare className="text-[var(--primary)]" size={18} />}
                  title="Messages"
                  value={statC}
                  hint="Client conversations"
                />
              </>
            ) : (
              <>
                <StatCard
                  i={0}
                  icon={<Users className="text-[var(--primary)]" size={18} />}
                  title="Suggested talent"
                  value={statA}
                  hint="Matches your SDG needs"
                />
                <StatCard
                  i={1}
                  icon={<Briefcase className="text-[var(--primary)]" size={18} />}
                  title="Open gigs"
                  value={statB}
                  hint="Roles you’re hiring for"
                />
                <StatCard
                  i={2}
                  icon={<MessageSquare className="text-[var(--primary)]" size={18} />}
                  title="Messages"
                  value={statC}
                  hint="Talent conversations"
                />
              </>
            )}

            {/* Ratings card */}
            <RatingsCard
              i={3}
              role={role}
              avg={avgRating}
              count={ratingCount}
            />

            {/* Workspaces card */}
            <StatCard
              i={4}
              icon={<FolderOpen className="text-[var(--primary)]" size={18} />}
              title="Workspaces"
              value={workspacesCount}
              hint="Active projects"
            />
          </motion.div>

          {/* Quick actions + SDGs */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Quick actions */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={2}
              className="lg:col-span-2"
            >
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">
                    Quick actions
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {profile?.role === "talent" && !profile?.profileComplete && (
                    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 240, damping: 18 }}>
                      <Link
                        href="/dashboard/profile"
                        className="group block rounded-2xl border bg-white p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <TrendingUp className="text-[var(--primary)]" size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="font-extrabold text-gray-900 group-hover:text-[var(--primary)] transition">
                              Complete your profile
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Complete your profile before you can apply for gigs.
                            </div>
                          </div>
                          <ArrowRight className="text-gray-400 group-hover:text-[var(--primary)] transition" size={18} />
                        </div>
                      </Link>
                    </motion.div>
                  )}
                  {primaryActions.map((a) => {
                    const Icon = a.icon
                    return (
                      <motion.div
                        key={a.title}
                        whileHover={{ y: -4 }}
                        transition={{ type: "spring", stiffness: 240, damping: 18 }}
                      >
                        <Link
                          href={a.href}
                          className="group block rounded-2xl border bg-white p-4 hover:shadow-md transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                              <Icon className="text-[var(--primary)]" size={18} />
                            </div>
                            <div className="flex-1">
                              <div className="font-extrabold text-gray-900 group-hover:text-[var(--primary)] transition">
                                {a.title}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {a.desc}
                              </div>
                            </div>
                            <ArrowRight
                              className="text-gray-400 group-hover:text-[var(--primary)] transition"
                              size={18}
                            />
                          </div>
                        </Link>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
  variants={fadeUp}
  custom={5}
  whileHover={{ y: -4 }}
  transition={{ type: "spring", stiffness: 240, damping: 18 }}
>
  <Card className="rounded-2xl hover:shadow-md transition">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <motion.div
          className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Wallet className="text-[var(--primary)]" size={18} />
        </motion.div>

        <div className="text-right">
          <div className="text-2xl font-extrabold">
            ₦{walletTotal.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-gray-500">
            {role === "client" ? "Total deposited" : "Total earned"}
          </div>
        </div>
      </div>

      <div className="mt-3 font-extrabold">Wallet</div>
      <div className="text-sm text-gray-600 mt-1">
        {role === "client"
          ? "Your deposits will show here for escrow and payouts."
          : "Your earnings will show here after completed gigs."}
      </div>

      <div className="mt-4">
        <Link
          href="/dashboard/wallet"
          className="text-sm font-extrabold text-[var(--primary)] hover:underline"
        >
          View wallet →
        </Link>
      </div>
    </CardContent>
  </Card>
</motion.div>



          </div> {/* end quick actions + wallet grid */}

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SDG Focus (alive movement) */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={3}
            >
              <motion.div {...floaty}>
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold">
                      SDG focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {(profile?.sdgTags || []).slice(0, 10).map((t) => (
                      <motion.span
                        key={t}
                        whileHover={{ scale: 1.03 }}
                        className="text-xs font-semibold px-3 py-2 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition cursor-default"
                      >
                        {t}
                      </motion.span>
                    ))}
                    {!profile?.sdgTags?.length && (
                      <div className="text-sm text-gray-600">
                        No SDGs selected yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Suggested talents for clients */}
            {profile?.role === "client" && suggestedTalents.length > 0 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={4}
              >
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold flex items-center gap-2">
                      <Sparkles size={18} className="text-[var(--primary)]" />
                      Suggested talent
                    </CardTitle>
                    <div className="text-xs text-gray-500 font-semibold">
                      Matches based on gig needs
                    </div>
                  </CardHeader>
                  <CardContent>
                    {suggestedLoading ? (
                      <div className="text-sm text-gray-600">Loading suggestions...</div>
                    ) : (
                      <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                          {suggestedTalents.map((t, idx) => (
                            <div key={t.uid} className="w-80 flex-shrink-0">
                            <Card className="rounded-2xl hover:shadow-md transition bg-white">
                              <CardContent className="p-5">
                                <TalentCard t={t} idx={idx} />
                              </CardContent>
                            </Card>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 text-center">
                      <Link
                        href="/dashboard/find-talent"
                        className="text-sm font-extrabold text-[var(--primary)] hover:underline"
                      >
                        Browse all categories →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          {/* Suggested gigs carousel for talents */}
          {profile?.role === "talent" && suggestedGigs.length > 0 && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={4}
              className="mt-6"
            >
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold flex items-center gap-2">
                    <Sparkles size={18} className="text-[var(--primary)]" />
                    Suggested gigs
                  </CardTitle>
                  <div className="text-xs text-gray-500 font-semibold">
                    Matches based on your skills and SDG focus
                  </div>
                </CardHeader>
                <CardContent>
                  {suggestedGigsLoading ? (
                    <div className="text-sm text-gray-600">Loading suggestions...</div>
                  ) : (
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-4 min-w-max">
                        {suggestedGigs.map((gig, idx) => (
                          <div key={gig.id} className="w-80 flex-shrink-0">
                            <Link href={`/dashboard/find-work/${gig.id}`} className="block">
                              <Card className="rounded-2xl hover:shadow-md transition bg-white">
                                <CardContent className="p-5">
                                  <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-[var(--primary)]">
                                      <Briefcase size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-extrabold text-gray-900 truncate">{gig.title}</div>
                                      <div className="text-sm text-gray-700 mt-1">
                                        {gig.category?.group} → {gig.category?.item}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                                        <span className="inline-flex items-center gap-1">
                                          <MapPin size={14} />
                                          {gig.workMode === "Remote" ? "Remote" : gig.location || "—"}
                                        </span>
                                        <span className="mx-1">•</span>
                                        <span>
                                          {gig.budgetType === "hourly" 
                                            ? `₦${gig.hourlyRate?.toLocaleString()}/hr` 
                                            : `₦${gig.fixedBudget?.toLocaleString()} fixed`}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-3">
                                        {(gig.requiredSkills || []).slice(0, 3).map((skill) => (
                                          <span
                                            key={skill}
                                            className="text-xs font-semibold px-2 py-1 rounded-full border bg-gray-50"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <Link
                      href="/dashboard/find-work"
                      className="text-sm font-extrabold text-[var(--primary)] hover:underline"
                    >
                      View all gigs →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          </div>

          {/* Recent activity placeholder */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={4}
            className="mt-6"
          >
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base font-extrabold">
                  Recent activity
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                {recentActivities.length === 0 ? (
                  <div className="flex items-center justify-between">
                    <div>
                      No activity yet — once you apply to gigs / post gigs, you’ll see them here.
                    </div>
                    <span className="hidden md:inline text-xs font-semibold text-gray-500">
                      Coming soon
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <Link
                        key={activity.id}
                        href={
                          activity.type === "workspace"
                            ? `/dashboard/workspaces/${activity.id}`
                            : `/dashboard/gigs/${activity.id}`
                        }
                        className="block"
                      >
                        <Card className="p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            {activity.type === "workspace" ? (
                              <FolderOpen size={20} className="text-[var(--primary)]" />
                            ) : (
                              <Briefcase size={20} className="text-[var(--primary)]" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {activity.type === "workspace"
                                  ? `Joined workspace: ${activity.gigTitle || "Unknown"}`
                                  : `Posted gig: ${activity.title || "Unknown"}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {activity.createdAt?.toDate?.()?.toLocaleDateString() || "Recent"}
                              </p>
                            </div>
                            <ArrowRight size={16} className="text-gray-400" />
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </RequireAuth>
  )
}

function StatCard({
  i,
  icon,
  title,
  value,
  hint,
}: {
  i: number
  icon: React.ReactNode
  title: string
  value: number
  hint: string
}) {
  return (
    <motion.div variants={fadeUp} custom={i + 1} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 240, damping: 18 }}>
      <Card className="rounded-2xl hover:shadow-md transition">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <motion.div
              className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center"
              animate={{ rotate: [0, 2, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              {icon}
            </motion.div>
            <div className="text-2xl font-extrabold">{value}</div>
          </div>
          <div className="mt-3 font-extrabold">{title}</div>
          <div className="text-sm text-gray-600 mt-1">{hint}</div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RatingsCard({
  i,
  role,
  avg,
  count,
}: {
  i: number
  role: "talent" | "client"
  avg: number
  count: number
}) {
  const title = role === "talent" ? "My rating" : "Client rating"

  const fullStars = Math.floor(avg)
  const hasHalf = avg - fullStars >= 0.5

  return (
    <motion.div variants={fadeUp} custom={i + 1} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 240, damping: 18 }}>
      <Card className="rounded-2xl hover:shadow-md transition">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <motion.div
              className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Star className="text-[var(--primary)]" size={18} />
            </motion.div>

            <div className="text-right">
              <div className="text-2xl font-extrabold">
                {avg ? avg.toFixed(1) : "—"}
              </div>
              <div className="text-xs font-semibold text-gray-500">
                {count ? `${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}
              </div>
            </div>
          </div>

          <div className="mt-3 font-extrabold">{title}</div>

          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= fullStars || (n === fullStars + 1 && hasHalf)
              return (
                <motion.span
                  key={n}
                  animate={active ? { y: [0, -1.5, 0] } : undefined}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: n * 0.05 }}
                  className="inline-flex"
                >
                  <Star
                    size={16}
                    className={active ? "text-[var(--primary)]" : "text-gray-300"}
                    fill={active ? "currentColor" : "none"}
                  />
                </motion.span>
              )
            })}
          </div>

          <div className="text-sm text-gray-600 mt-2">
            Ratings will update after completed gigs.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

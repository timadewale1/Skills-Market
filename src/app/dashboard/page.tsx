"use client"

import { useEffect, useMemo, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
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
} from "lucide-react"
import Link from "next/link"
import { motion, animate } from "framer-motion"
import { Wallet } from "lucide-react"

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

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)

      const snap = await getDoc(doc(db, "users", user.uid))
      const data = (snap.data() as any) || null

      setProfile(data)
      setLoading(false)

      // set placeholders for MVP: later we’ll compute from reviews collection
      const role: Role = data?.role
      const aTarget = 0
      const bTarget = 0
      const cTarget = 0

      const earned = Number(data?.wallet?.totalEarned || 0)
      const deposited = Number(data?.wallet?.totalDeposited || 0)
      const total = role === "client" ? deposited : earned
      animate(0, total, {
        duration: 0.9,
        onUpdate: (v) => setWalletTotal(Math.round(v)),
      })


      // count-up animations
      animate(0, aTarget, { duration: 0.8, onUpdate: (v) => setStatA(Math.round(v)) })
      animate(0, bTarget, { duration: 0.9, onUpdate: (v) => setStatB(Math.round(v)) })
      animate(0, cTarget, { duration: 1.0, onUpdate: (v) => setStatC(Math.round(v)) })

      const rAvg = Number(data?.rating?.avg || 0)
      const rCount = Number(data?.rating?.count || 0)

      animate(0, rAvg, {
        duration: 0.9,
        onUpdate: (v) => setAvgRating(Number(v.toFixed(1))),
      })
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
      ]
    }
    return [
      {
        title: "Find work",
        desc: "Browse gigs aligned with your SDG focus.",
        href: "/dashboard/find-work",
        icon: Search,
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

          

          {/* Stat cards + Ratings card */}
          <motion.div
            initial="hidden"
            animate="show"
            className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
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
                <div className="flex items-center justify-between">
                  <div>
                    No activity yet — once you apply to gigs / post gigs, you’ll see them here.
                  </div>
                  <span className="hidden md:inline text-xs font-semibold text-gray-500">
                    Coming soon
                  </span>
                </div>
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

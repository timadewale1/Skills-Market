"use client"

import { useEffect, useMemo, useState } from "react"
import RequireAdmin from "@/components/admin/RequireAdmin"
import AdminNavbar from "@/components/admin/AdminNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Briefcase,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { motion, animate } from "framer-motion"

type AdminDoc = {
  fullName?: string
  email?: string
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

export default function AdminDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<AdminDoc | null>(null)
  const [loading, setLoading] = useState(true)

  // Animated stats (count-up)
  const [statA, setStatA] = useState(0)
  const [statB, setStatB] = useState(0)
  const [statC, setStatC] = useState(0)
  const [statD, setStatD] = useState(0)

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)

      const snap = await getDoc(doc(db, "users", user.uid))
      const data = (snap.data() as any) || null

      setProfile(data)
      setLoading(false)

      // Load admin stats
      const usersSnap = await getDoc(doc(db, "stats", "users"))
      const gigsSnap = await getDoc(doc(db, "stats", "gigs"))
      const workspacesSnap = await getDoc(doc(db, "stats", "workspaces"))
      const disputesSnap = await getDoc(doc(db, "stats", "disputes"))

      const usersCount = usersSnap.exists() ? usersSnap.data()?.count || 0 : 0
      const gigsCount = gigsSnap.exists() ? gigsSnap.data()?.count || 0 : 0
      const workspacesCount = workspacesSnap.exists() ? workspacesSnap.data()?.count || 0 : 0
      const disputesCount = disputesSnap.exists() ? disputesSnap.data()?.count || 0 : 0

      // count-up animations
      animate(0, usersCount, { duration: 0.8, onUpdate: (v) => setStatA(Math.round(v)) })
      animate(0, gigsCount, { duration: 0.9, onUpdate: (v) => setStatB(Math.round(v)) })
      animate(0, workspacesCount, { duration: 1.0, onUpdate: (v) => setStatC(Math.round(v)) })
      animate(0, disputesCount, { duration: 1.1, onUpdate: (v) => setStatD(Math.round(v)) })
    }

    run()
  }, [user?.uid])

  const headline = useMemo(() => {
    if (!profile) return "Admin Dashboard"
    return `Welcome, ${profile.fullName?.split(" ")[0] || "Admin"}`
  }, [profile])

  const sub = useMemo(() => {
    return "Monitor platform activity, manage users, and oversee operations."
  }, [])

  const primaryActions = [
    {
      title: "Manage Users",
      desc: "View, ban, verify, and change user roles.",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Review Disputes",
      desc: "Resolve payment disputes and conflicts.",
      href: "/admin/disputes",
      icon: AlertTriangle,
    },
    {
      title: "Platform Analytics",
      desc: "View revenue, user growth, and metrics.",
      href: "/admin/analytics",
      icon: BarChart3,
    },
  ]

  return (
    <RequireAdmin>
      <AdminNavbar />

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

            {/* Admin badge (pulse ring) */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border bg-white relative">
              <motion.span
                aria-hidden
                className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-[var(--primary)]"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <ShieldCheck size={16} className="text-[var(--primary)]" />
              <span className="text-gray-700">Admin Console • SkillsMarket</span>
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
                <span className="font-extrabold text-gray-900">Platform Administration</span>{" "}
                — Monitor user activity, resolve disputes, and maintain platform integrity.
              </div>

              <div className="hidden md:block text-xs font-semibold text-gray-600">
                Admin Mode
              </div>
            </div>
          </motion.div>

          {/* Stat cards */}
          <motion.div
            initial="hidden"
            animate="show"
            className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <StatCard
              i={0}
              icon={<Users className="text-[var(--primary)]" size={18} />}
              title="Total Users"
              value={statA}
              hint="Registered users"
            />
            <StatCard
              i={1}
              icon={<Briefcase className="text-[var(--primary)]" size={18} />}
              title="Active Gigs"
              value={statB}
              hint="Posted opportunities"
            />
            <StatCard
              i={2}
              icon={<Wallet className="text-[var(--primary)]" size={18} />}
              title="Workspaces"
              value={statC}
              hint="Active projects"
            />
            <StatCard
              i={3}
              icon={<AlertTriangle className="text-[var(--primary)]" size={18} />}
              title="Open Disputes"
              value={statD}
              hint="Require resolution"
            />
          </motion.div>

          {/* Quick actions */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                      <TrendingUp className="text-[var(--primary)]" size={18} />
                    </motion.div>
                    <div className="text-2xl font-extrabold">Platform</div>
                  </div>
                  <div className="mt-3 font-extrabold">Health Status</div>
                  <div className="text-sm text-gray-600 mt-1">All systems operational</div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-600 font-semibold">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Online
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </RequireAdmin>
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
"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { getAuth } from "firebase/auth"
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, Briefcase } from "lucide-react"
import { motion } from "framer-motion"

type Thread = {
  threadId: string
  gigId: string
  gigTitle: string
  clientUid: string
  clientName: string
  clientSlug?: string | null
  talentUid: string
  talentName: string
  talentSlug?: string | null
  participants: string[]
  lastMessageText?: string
  lastMessageAt?: any
  proposalStatus?: string
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Thread[]>([])
  const [q, setQ] = useState("")

  useEffect(() => {
    if (!user?.uid) return

    

    const qy = query(
  collection(db, "threads"),
  where("type", "==", "thread"),
  where("participants", "array-contains", user.uid),
  orderBy("updatedAt", "desc")
)



    const unsub = onSnapshot(
  qy,
  (snap) => {
    const rows = snap.docs.map((d) => d.data() as Thread)
    setItems(rows)
  },
  (err) => {
    console.error(err)
    // optional toast
    // toast.error("Failed to load messages. Check permissions.")
    setItems([])
  }
)


    return () => unsub()
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return

    ;(async () => {
      const auth = getAuth()
      console.log("CTX user uid:", user.uid)
      console.log("AUTH currentUser uid:", auth.currentUser?.uid)

      const token = await auth.currentUser?.getIdTokenResult()
      console.log("TOKEN uid:", token?.claims?.user_id)

      const ref = doc(db, "threads", "gig_F3FQn0JJmsLXkT__c_jK41GAnyB8Xau72BjdGfXGmor9D3__t_UfIy6Ws7v2YuhZbFlYmIOSE98pw1")
      const snap = await getDoc(ref)
      console.log("canReadThread:", snap.exists())
    })()
  }, [user?.uid])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((t) => {
      const blob = `${t.gigTitle} ${t.clientName} ${t.talentName} ${t.lastMessageText || ""}`.toLowerCase()
      return blob.includes(s)
    })
  }, [items, q])

  return (
    <RequireAuth>
      <AuthNavbar />

      <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">Messages</h1>
              <p className="text-sm text-gray-600 mt-1">
                Keep all hiring communication inside the platform.
              </p>
            </div>

            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search messages…"
                className="rounded-2xl pl-9"
              />
            </div>
          </div>

          <div className="mt-4 md:hidden">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search messages…"
              className="rounded-2xl"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {filtered.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="p-6 text-sm text-gray-600">
                    No messages yet.
                  </CardContent>
                </Card>
              ) : (
                filtered.map((t, idx) => (
                  <motion.div
                    key={t.threadId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.22 }}
                  >
                    <Link href={`/dashboard/messages/${t.threadId}`} className="block">
                      <Card className="rounded-2xl hover:shadow-md transition bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-extrabold truncate">{t.gigTitle}</div>
                                {t.proposalStatus && (
                                  <Badge className="rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                    {t.proposalStatus}
                                  </Badge>
                                )}
                              </div>

                              <div className="mt-2 text-sm text-gray-700 inline-flex items-center gap-2">
                                <Briefcase size={16} className="text-[var(--primary)]" />
                                <span className="font-semibold">
                                  {t.clientName} ↔ {t.talentName}
                                </span>
                              </div>

                              <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                                {t.lastMessageText || "No messages yet…"}
                              </div>
                            </div>

                            <div className="shrink-0 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--primary)]">
                              <MessageSquare size={16} />
                              Open
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>

            <div className="hidden lg:block space-y-4">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-extrabold">Hiring flow</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Shortlist/Accept starts screening - final hiring happens inside chat via agreement signing.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}

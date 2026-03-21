"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star } from "lucide-react"
import { motion } from "framer-motion"

export type TalentRow = {
  uid: string
  slug?: string
  fullName: string
  location?: string
  roleTitle?: string
  photoURL?: string
  hourlyRate?: number | null
  skills?: string[]
  rating?: { avg?: number; count?: number }
  verification?: { status?: string }
  availability?: string
  workMode?: string
  yearsExperience?: number | null
}

export default function TalentCard({
  t,
  idx,
}: {
  t: TalentRow
  idx: number
}) {
  const verified = t.verification?.status === "verified"
  const avg = Number(t.rating?.avg || 0)
  const count = Number(t.rating?.count || 0)
  const href = t.slug ? `/talent/${t.slug}` : `/talent/${t.uid}`

  return (
    <motion.div
      key={t.uid}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03, duration: 0.25 }}
    >
      <Link href={href} className="block">
        <Card className="rounded-2xl hover:shadow-md transition bg-white">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-[var(--primary)] overflow-hidden">
                {t.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.photoURL} alt={t.fullName} className="h-full w-full object-cover" />
                ) : (
                  (t.fullName || "T").slice(0, 1).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-extrabold text-gray-900">{t.fullName}</div>
                  <Badge
                    className={`rounded-full ${
                      verified ? "bg-[var(--primary)] text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {verified ? "Verified" : "Not verified"}
                  </Badge>
                </div>

                <div className="text-sm text-gray-700 font-semibold mt-1">
                  {t.roleTitle || "Role title not set"}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {t.location || "Location not set"}
                  </span>

                  <span className="mx-1">•</span>

                  <span className="inline-flex items-center gap-1">
                    <Star size={14} className="text-[var(--primary)]" />
                    <span className="font-semibold">{avg ? avg.toFixed(1) : "-"}</span>
                    <span>({count || 0})</span>
                  </span>

                  {!!t.availability && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-xs font-semibold">{t.availability}</span>
                    </>
                  )}
                  {!!t.workMode && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-xs font-semibold">{t.workMode}</span>
                    </>
                  )}
                  {typeof t.yearsExperience === "number" && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-xs font-semibold">
                        {t.yearsExperience} yr{t.yearsExperience === 1 ? "" : "s"}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {(t.skills || []).slice(0, 6).map((s) => (
                    <span
                      key={s}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-500 font-semibold">Rate</div>
                <div className="text-xl font-extrabold">
                  {t.hourlyRate != null ? `₦${Number(t.hourlyRate).toLocaleString()}/hr` : "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

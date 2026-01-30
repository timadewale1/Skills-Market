"use client"

import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "@/components/layout/Navbar"
import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function SearchPage() {
  const params = useSearchParams()
  const router = useRouter()

  const q = params.get("q") || ""
  const type = params.get("type") || "talent"

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchResults() {
      setLoading(true)
      const col = collection(db, type === "talent" ? "talents" : "jobs")
      const snap = await getDocs(col)
      setResults(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }

    fetchResults()
  }, [q, type])

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-6 border-b mb-6">
          {["talent", "job"].map((t) => (
            <button
              key={t}
              onClick={() =>
                router.push(`/search?type=${t}&q=${q}`)
              }
              className={`pb-3 font-semibold ${
                type === t
                  ? "border-b-2 border-[var(--primary)] text-black"
                  : "text-gray-500"
              }`}
            >
              {t === "talent" ? "Talent" : "Jobs"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* FILTER SIDEBAR */}
          <aside className="hidden md:block space-y-6">
            <FilterBlock title="Category" />
            <FilterBlock title="Location" />
            <FilterBlock title="Impact Focus (SDGs)" />
            <FilterBlock title="Budget / Rate" />
          </aside>

          {/* RESULTS */}
          <section className="md:col-span-3 space-y-4">
            {loading && <p>Loading results...</p>}

            {!loading && results.length === 0 && (
              <p className="text-gray-500">
                No results found.
              </p>
            )}

            {results.map((item) => (
              <ResultCard
                key={item.id}
                type={type}
                data={item}
              />
            ))}
          </section>
        </div>
      </div>
    </>
  )
}

function FilterBlock({ title }: { title: string }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="text-sm text-gray-500">
        (Filters coming soon)
      </div>
    </div>
  )
}

function ResultCard({
  type,
  data,
}: {
  type: string
  data: any
}) {
  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-sm transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">
            {data.name || data.title}
          </h3>
          <p className="text-sm text-gray-600">
            {data.role || data.category}
          </p>

          <div className="flex gap-2 mt-2 flex-wrap">
            {(data.skills || []).slice(0, 4).map((skill: string) => (
              <span
                key={skill}
                className="text-xs bg-gray-100 px-2 py-1 rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <button className="border border-[var(--primary)] text-[var(--primary)] px-4 py-2 rounded-md text-sm hover:bg-[var(--primary)] hover:text-white transition">
          View Profile
        </button>
      </div>
    </div>
  )
}


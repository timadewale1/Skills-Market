"use client"

import Link from "next/link"
import PageShell from "@/components/marketing/PageShell"
import { findWorkCategories } from "@/data/navCategories"
import { slugify } from "@/lib/navSlug"

export default function JobsLandingPage() {
  return (
    <PageShell
      title="Find Work"
      subtitle="Browse gigs and opportunities by category and find projects that match your impact."
    >
      <div className="space-y-6">
        {/* Categories Grid */}
        <div className="space-y-4">
          <div className="text-sm font-extrabold text-gray-600">Browse by category</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {findWorkCategories.map((cat) => (
              <div
                key={cat.title}
                className="rounded-2xl border bg-white p-6 hover:shadow-lg transition"
              >
                <h2 className="font-extrabold text-lg text-gray-900 mb-2">{cat.title}</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {cat.items.length} specialist opportunities
                </p>
                <div className="flex flex-col gap-2">
                  {cat.items.map((item) => (
                    <Link
                      key={item}
                      href={`/jobs/${slugify(item)}`}
                      className="text-sm font-bold text-gray-800 hover:text-[var(--primary)] transition"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

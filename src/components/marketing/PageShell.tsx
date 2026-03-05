"use client"

import React from "react"
import { useRouter } from "next/navigation"

export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <main className="bg-[var(--secondary)] min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm font-bold text-gray-600 hover:text-[var(--primary)]"
          >
            ← Back
          </button>

          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-gray-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-gray-700 max-w-3xl">{subtitle}</p> : null}
        </div>

        {children}
      </div>
    </main>
  )
}

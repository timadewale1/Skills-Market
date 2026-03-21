"use client"

import type { ReactNode } from "react"

type HeaderStat = {
  label: string
  value: string | number
}

type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  stats?: HeaderStat[]
}

export default function AdminPageHeader({
  eyebrow = "Admin operations",
  title,
  description,
  actions,
  stats = [],
}: AdminPageHeaderProps) {
  return (
    <div className="rounded-[1.75rem] border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {stats.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border bg-[var(--secondary)] px-4 py-4"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                {stat.label}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-gray-900">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

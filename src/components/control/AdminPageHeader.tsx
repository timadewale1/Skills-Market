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
    <div className="control-page-header">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="control-page-eyebrow">
            {eyebrow}
          </p>
          <h1 className="control-page-title">
            {title}
          </h1>
          {description ? (
            <p className="control-page-description">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex max-w-full flex-wrap items-center gap-3 lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>

      {stats.length ? (
        <div className="control-header-stats">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="control-header-stat"
            >
              <div className="control-header-stat-label">
                {stat.label}
              </div>
              <div className="control-header-stat-value">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

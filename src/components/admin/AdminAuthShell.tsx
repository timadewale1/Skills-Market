"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ShieldCheck, ArrowLeft } from "lucide-react"

type AdminAuthShellProps = {
  title: string
  subtitle: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
}

export default function AdminAuthShell({
  title,
  subtitle,
  eyebrow = "Admin access",
  children,
  footer,
}: AdminAuthShellProps) {
  return (
    <div className="min-h-screen bg-[var(--secondary)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[var(--primary)]"
          >
            <ArrowLeft size={16} />
            Back to main site
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border bg-[#060912] px-6 py-8 text-white shadow-sm lg:px-10 lg:py-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <ShieldCheck size={14} className="text-orange-400" />
              {eyebrow}
            </div>

            <h1 className="max-w-xl text-4xl font-extrabold leading-tight lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 lg:text-base">
              {subtitle}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Users", value: "KYC, roles, access" },
                { label: "Operations", value: "Gigs, workspaces, payouts" },
                { label: "Trust", value: "Disputes, reviews, oversight" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-300">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white/85">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border bg-white p-6 shadow-sm lg:p-8">
            {children}
            {footer ? <div className="mt-6">{footer}</div> : null}
          </section>
        </div>
      </div>
    </div>
  )
}

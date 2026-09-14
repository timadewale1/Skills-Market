"use client"

import Link from "next/link"
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6"

const columns = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "How it works", href: "/how" },
      { label: "FAQ", href: "/faq" },
      { label: "Hire talent", href: "/hire" },
      { label: "Find work", href: "/jobs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      // { label: "Why us", href: "/why-us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0A0A0A] pt-16 pb-10">
      <div className="public-container">
        <div className="mb-14 grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 max-w-md">
            <div className="mb-4 flex items-center gap-2.5">
              <img src="/logo.png" alt="changeworker" className="h-8 w-8 object-contain" />
              <span className="font-body text-xl font-black text-white">changeworker</span>
            </div>

            <p className="mb-4 max-w-xs text-sm leading-relaxed text-white/30">
              Flexible talents. Meaningful work.
              <br />
              The talent marketplace for social impact in Nigeria.
            </p>
            <p className="mb-5 text-xs text-white/15">A product of Impactpal Africa</p>

            <div className="flex gap-2">
              {[
                { icon: FaXTwitter, label: "X", href: "https://x.com/changeworkerng" },
                { icon: FaLinkedinIn, label: "LinkedIn", href: "https://www.linkedin.com/company/changeworker" },
                { icon: FaInstagram, label: "Instagram", href: "https://www.instagram.com/changeworker.ng?igsh=dGFsdXkwMTkydHps&utm_source=qr&wa_status_inline=true" },
                { icon: FaFacebookF, label: "Facebook", href: "https://www.facebook.com/changeworkerng" },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/35 transition-all hover:bg-white/12 hover:text-white"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="mb-5 font-body text-[10px] uppercase tracking-[0.2em] text-white/20">
                {column.title}
              </p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/35 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-white/15">© {new Date().getFullYear()} changeworker · Impactpal Africa</p>
          <p className="text-xs text-white/10">Building Africa&apos;s workforce for social impact</p>
        </div>
      </div>
    </footer>
  )
}

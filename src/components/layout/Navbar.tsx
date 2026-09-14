"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  hireCategories,
  findWorkCategories,
  getCategoryDisplayTitle,
  whyUsLinks,
} from "@/data/navCategories"
import { useSearch } from "@/context/SearchContext"
import { useRouter } from "next/navigation"



export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopMenu, setDesktopMenu] = useState<string | null>(null)
  const [mobileMenu, setMobileMenu] = useState<string | null>(null)
  const [mobileSub, setMobileSub] = useState<string | null>(null)
  const { query, setQuery, type, setType } = useSearch()
  const router = useRouter()



  const navItem =
    "flex items-center gap-1 font-semibold text-black hover:text-[var(--primary)] cursor-pointer"

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 overflow-x-clip">
      {/* TOP BAR */}
      <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-3 px-4 py-3">
        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-extrabold text-[var(--primary)]"
          >
            <img src="/logo.png" alt="Changeworker" className="h-15 w-15" />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 min-w-0">
            <Link href="/" className={navItem}>
              Home
            </Link>
            {/* Hire */}
            <div className="relative">
              <button
                onClick={() =>
                  setDesktopMenu(
                    desktopMenu === "hire" ? null : "hire"
                  )
                }
                className={navItem}
              >
                Hire Talent
                <ChevronDown size={16} />
              </button>

              {desktopMenu === "hire" && (
                <div className="absolute left-0 top-full mt-2 z-50 w-[min(900px,calc(100vw-1rem))] max-h-[calc(100vh-110px)] overflow-y-auto rounded-[1.1rem] border bg-white p-4 shadow-xl">
                  <div className="grid grid-cols-4 gap-x-4 gap-y-5">
                    {hireCategories.map((cat) => (
                      <div key={cat.title}>
                        <h4 className="mb-2.5 text-[13px] font-bold leading-snug">
                          {getCategoryDisplayTitle(cat, "nav")}
                        </h4>
                        <ul className="space-y-1">
                          {cat.items.map((item) => (
                            <li key={item}>
                              <Link
                                href={`/hire/${item
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                                className="text-[11.5px] leading-5 text-gray-600 hover:text-[var(--primary)]"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Find */}
            <div className="relative">
              <button
                onClick={() =>
                  setDesktopMenu(
                    desktopMenu === "find" ? null : "find"
                  )
                }
                className={navItem}
              >
                Find Work
                <ChevronDown size={16} />
              </button>

              {desktopMenu === "find" && (
                <div className="absolute left-0 top-full mt-2 z-50 w-[min(900px,calc(100vw-1rem))] max-h-[calc(100vh-110px)] overflow-y-auto rounded-[1.1rem] border bg-white p-4 shadow-xl">
                  <div className="grid grid-cols-4 gap-x-4 gap-y-5">
                    {findWorkCategories.map((cat) => (
                      <div key={cat.title}>
                        <h4 className="mb-2.5 text-[13px] font-bold leading-snug">
                          {getCategoryDisplayTitle(cat, "nav")}
                        </h4>
                        <ul className="space-y-1">
                          {cat.items.map((item) => (
                            <li key={item}>
                              <Link
                                href={`/jobs/${item
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                                className="text-[11.5px] leading-5 text-gray-600 hover:text-[var(--primary)]"
                              >
                                {item}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Why Us */}
            {/* <div className="relative">
              <button
                onClick={() =>
                  setDesktopMenu(
                    desktopMenu === "why" ? null : "why"
                  )
                }
                className={navItem}
              >
                Why Us
                <ChevronDown size={16} />
              </button>

              {desktopMenu === "why" && (
                <div className="absolute left-0 top-full mt-2 z-50 w-[min(520px,calc(100vw-1rem))] rounded-[1.1rem] border bg-white p-4 shadow-xl">
                  <div className="grid grid-cols-2 gap-4">
                    {whyUsLinks.map((item) => (
                      <Link
                        key={item.title}
                        href={`/why-us/${item.title
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="rounded-lg border p-3 hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition"
                      >
                        <h4 className="text-[13px] font-bold">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-[11.5px] text-gray-600">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div> */}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex items-center gap-3">
          <form
  onSubmit={(e) => {
    e.preventDefault()
    if (!query) return
    router.push(`/search?type=${type}&q=${query}`)
    setMobileOpen(false)
  }}
  className="flex h-12 w-[clamp(240px,30vw,560px)] min-w-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white"
>
  <select
    value={type}
    onChange={(e) => setType(e.target.value as any)}
    className="w-28 shrink-0 border-r border-gray-200 bg-gray-100 px-4 text-sm font-semibold text-gray-900 outline-none"
  >
    <option value="talent">Talent</option>
    <option value="job">Jobs</option>
  </select>

  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search impact talents or jobs"
    className="w-full min-w-0 bg-transparent px-4 py-2 text-sm outline-none"
  />
</form>


          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-12 min-w-[132px] items-center justify-center rounded-2xl bg-[var(--primary)] px-6 text-sm font-extrabold whitespace-nowrap text-white shadow-[0_12px_28px_rgba(249,115,22,.28)] transition hover:opacity-95"
          >
            Sign Up
          </Link>
        </div>

        {/* MOBILE TOGGLE */}
          <button
            className="md:hidden shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE PANEL (UNDER NAVBAR) */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-6 py-6 space-y-6 max-h-[calc(100vh-73px)] overflow-y-auto overflow-x-hidden overscroll-contain">
         <form
  onSubmit={(e) => {
    e.preventDefault()
    if (!query) return
    router.push(`/search?type=${type}&q=${query}`)
    setMobileOpen(false)
  }}
  className="flex h-12 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white"
>
  <select
    value={type}
    onChange={(e) => setType(e.target.value as any)}
    className="w-28 shrink-0 border-r border-gray-200 bg-gray-100 px-4 text-sm font-semibold text-gray-900 outline-none"
  >
    <option value="talent">Talent</option>
    <option value="job">Jobs</option>
  </select>

  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search impact talents or jobs"
    className="w-full bg-transparent px-4 py-2 text-sm outline-none"
  />
</form>



          <Link
            href="/"
            className="font-bold hover:text-[var(--primary)]"
            onClick={() => setMobileOpen(false)}
          >
            Home
          </Link>

          {/* Hire */}
          <div>
            <button
              onClick={() => {
  setMobileMenu(mobileMenu === "hire" ? null : "hire")
  setMobileSub(null)
}}

              className="flex justify-between w-full font-bold"
            >
              Hire Talent
              {mobileMenu === "hire" ? (
                <ChevronUp />
              ) : (
                <ChevronDown />
              )}
            </button>

            {mobileMenu === "hire" &&
              hireCategories.map((cat) => (
                <div key={cat.title} className="mt-4">
                  <button
                    onClick={() =>
                      setMobileSub(
                        mobileSub === cat.title
                          ? null
                          : cat.title
                      )
                    }
                    className="flex justify-between w-full text-sm font-semibold hover:text-[var(--primary)]"
                  >
                    {getCategoryDisplayTitle(cat, "nav")}
                    {mobileSub === cat.title ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    )}
                  </button>

                  {mobileSub === cat.title && (
                    <ul className="ml-4 mt-2 space-y-2">
                      {cat.items.map((item) => (
                        <li key={item}>
                          <Link
                            href={`/hire/${item
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                            className="text-sm text-gray-600 hover:text-[var(--primary)]"
                          >
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>

          {/* Find Work */}
<div>
  <button
    onClick={() => {
  setMobileMenu(mobileMenu === "find" ? null : "find")
  setMobileSub(null)
}}

    className="flex justify-between w-full font-bold hover:text-[var(--primary)]"
  >
    Find Work
    {mobileMenu === "find" ? <ChevronUp /> : <ChevronDown />}
  </button>

  {mobileMenu === "find" &&
    findWorkCategories.map((cat) => (
      <div key={cat.title} className="mt-4">
        <button
          onClick={() =>
            setMobileSub(
              mobileSub === cat.title ? null : cat.title
            )
          }
          className="flex justify-between w-full text-sm font-semibold hover:text-[var(--primary)]"
        >
          {getCategoryDisplayTitle(cat, "nav")}
          {mobileSub === cat.title ? (
            <ChevronUp />
          ) : (
            <ChevronDown />
          )}
        </button>

        {mobileSub === cat.title && (
          <ul className="ml-4 mt-2 space-y-2">
            {cat.items.map((item) => (
              <li key={item}>
                <Link
                  href={`/jobs/${item
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  className="text-sm text-gray-600 hover:text-[var(--primary)]"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    ))}
</div>


          {/* Why Us */}
{/* <div>
  <button
    onClick={() => {
  setMobileMenu(mobileMenu === "why" ? null : "why")
  setMobileSub(null)
}}

    className="flex justify-between w-full font-bold hover:text-[var(--primary)]"
  >
    Why Us
    {mobileMenu === "why" ? <ChevronUp /> : <ChevronDown />}
  </button>

  {mobileMenu === "why" && (
    <div className="mt-4 space-y-3">
      {whyUsLinks.map((item) => (
        <Link
          key={item.title}
          href={`/why-us/${item.title
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
          className="block p-3 border rounded-lg hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition"
        >
          <p className="font-semibold text-sm">
            {item.title}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {item.description}
          </p>
        </Link>
      ))}
    </div>
  )}
</div> */}


          {/* AUTH */}
          <div className="pt-4 flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(249,115,22,.28)] transition hover:opacity-95"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
    <div aria-hidden className="h-[73px]" />
    </>
  )
}

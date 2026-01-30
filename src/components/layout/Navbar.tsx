"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Button from "@/components/ui/Button"
import {
  hireCategories,
  findWorkCategories,
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
    <header className="bg-white border-b relative">
      {/* TOP BAR */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-extrabold text-[var(--primary)]"
          >
            SkillsMarket
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8">
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
                <div className="absolute left-0 top-full mt-3 bg-white border shadow-xl w-[820px] p-8 z-50">
                  <div className="grid grid-cols-3 gap-8">
                    {hireCategories.map((cat) => (
                      <div key={cat.title}>
                        <h4 className="font-bold mb-4">
                          {cat.title}
                        </h4>
                        <ul className="space-y-2">
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
                <div className="absolute left-0 top-full mt-3 bg-white border shadow-xl w-[820px] p-8 z-50">
                  <div className="grid grid-cols-3 gap-8">
                    {findWorkCategories.map((cat) => (
                      <div key={cat.title}>
                        <h4 className="font-bold mb-4">
                          {cat.title}
                        </h4>
                        <ul className="space-y-2">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Why Us */}
            <div className="relative">
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
                <div className="absolute left-0 top-full mt-3 bg-white border shadow-xl w-[520px] p-6 z-50">
                  <div className="grid grid-cols-2 gap-4">
                    {whyUsLinks.map((item) => (
                      <Link
                        key={item.title}
                        href={`/why-us/${item.title
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="p-4 border rounded-lg hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition"
                      >
                        <h4 className="font-bold text-sm">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {item.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex items-center gap-4">
          <form
  onSubmit={(e) => {
    e.preventDefault()
    if (!query) return
    router.push(`/search?type=${type}&q=${query}`)
    setMobileOpen(false)
  }}
  className="flex border rounded-md overflow-hidden w-full"
>
  <select
    value={type}
    onChange={(e) => setType(e.target.value as any)}
    className="bg-gray-100 px-2 text-sm outline-none"
  >
    <option value="talent">Talent</option>
    <option value="job">Jobs</option>
  </select>

  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search impact talents or jobs"
    className="px-3 py-2 text-sm outline-none w-full"
  />
</form>


          <Link href="/login">Login</Link>
          <Button>Sign Up</Button>
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE PANEL (UNDER NAVBAR) */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-6 py-6 space-y-6">
         <form
  onSubmit={(e) => {
    e.preventDefault()
    if (!query) return
    router.push(`/search?type=${type}&q=${query}`)
    setMobileOpen(false)
  }}
  className="flex border rounded-md overflow-hidden w-full"
>
  <select
    value={type}
    onChange={(e) => setType(e.target.value as any)}
    className="bg-gray-100 px-2 text-sm outline-none"
  >
    <option value="talent">Talent</option>
    <option value="job">Jobs</option>
  </select>

  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search impact talents or jobs"
    className="px-3 py-2 text-sm outline-none w-full"
  />
</form>



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
                    {cat.title}
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
          {cat.title}
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
<div>
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
</div>


          {/* AUTH */}
          <div className="pt-4 flex flex-col gap-3">
            <Button><Link href="/login">Login</Link></Button>
            <Button>Sign Up</Button>
          </div>
        </div>
      )}
    </header>
  )
}

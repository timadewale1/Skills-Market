"use client"

import Navbar from "@/components/layout/Navbar"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  FiArrowUp, FiShield, FiUsers, FiDatabase, FiLock,
  FiGlobe, FiRefreshCw, FiMail, FiFileText, FiEye,
  FiChevronRight, FiCheckCircle, FiCopy, FiExternalLink,
  FiAlertTriangle, FiTrash2, FiEdit3, FiDownload,
  FiToggleRight, FiServer, FiWifi, FiSmartphone, FiKey
} from "react-icons/fi"
import { HiSparkles, HiShieldCheck } from "react-icons/hi"
import { MdFingerprint, MdPrivacyTip, MdOutlinePolicy } from "react-icons/md"
import { TbCookie, TbUserShield, TbWorldWww } from "react-icons/tb"
import { RiShieldCheckLine, RiUserHeartLine } from "react-icons/ri"

/* ═══ HOOKS ═══════════════════════════════════════════════════ */
function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const h = () => setY(window.scrollY)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return y
}

function useReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const h = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop || document.body.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? Math.min((scrolled / total) * 100, 100) : 0)
    }
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return pct
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }) },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [ids])
  return active
}

/* ═══ DATA ════════════════════════════════════════════════════ */
const SECTIONS = [
  { id: "overview",     label: "Overview",              icon: MdOutlinePolicy    },
  { id: "collect",      label: "Data We Collect",       icon: FiDatabase         },
  { id: "how-collect",  label: "How We Collect",        icon: FiWifi             },
  { id: "use",          label: "How We Use Data",       icon: FiToggleRight      },
  { id: "sharing",      label: "Sharing & Disclosure",  icon: FiUsers            },
  { id: "cookies",      label: "Cookies",               icon: TbCookie           },
  { id: "retention",    label: "Data Retention",        icon: FiServer           },
  { id: "security",     label: "Security",              icon: FiLock             },
  { id: "rights",       label: "Your Rights",           icon: TbUserShield       },
  { id: "children",     label: "Children's Privacy",    icon: RiUserHeartLine    },
  { id: "transfers",    label: "International Transfers",icon: FiGlobe           },
  { id: "third-party",  label: "Third-Party Links",     icon: TbWorldWww         },
  { id: "changes",      label: "Policy Changes",        icon: FiRefreshCw        },
  { id: "contact",      label: "Contact & DPO",         icon: FiMail             },
]

const SECTION_IDS = SECTIONS.map(s => s.id)

const DATA_TYPES = [
  {
    category: "Identity Data",
    color: "#F97316",
    icon: MdFingerprint,
    items: ["Full legal name", "Government-issued ID (NIN, Passport, Driver's Licence)", "Profile photograph", "Date of birth", "Gender (optional)"],
  },
  {
    category: "Contact Data",
    color: "#6366F1",
    icon: FiMail,
    items: ["Email address", "Phone number", "Physical address", "State/city of residence"],
  },
  {
    category: "Professional Data",
    color: "#10B981",
    icon: FiFileText,
    items: ["Work experience and employment history", "Educational qualifications", "Skills and certifications", "Portfolio samples and work references", "Freelancer rates and availability"],
  },
  {
    category: "Organisational Data",
    color: "#EC4899",
    icon: FiUsers,
    items: ["Organisation name and type", "CAC registration number", "Website and social profiles", "Mission statement and sector focus", "Organisation size and annual budget range"],
  },
  {
    category: "Transaction Data",
    color: "#F59E0B",
    icon: FiDatabase,
    items: ["Project postings and briefs", "Hire decisions and match history", "Payment amounts and timing", "Escrow records", "Commission invoices and receipts"],
  },
  {
    category: "Technical Data",
    color: "#3B82F6",
    icon: FiServer,
    items: ["IP address and device fingerprint", "Browser type and version", "Operating system", "Cookie identifiers", "Session duration and page views"],
  },
  {
    category: "Communications Data",
    color: "#8B5CF6",
    icon: FiSmartphone,
    items: ["In-platform messages between users", "Support ticket content", "Email correspondence with changeworker", "Feedback and review text"],
  },
  {
    category: "Usage Data",
    color: "#14B8A6",
    icon: FiEye,
    items: ["Search queries", "Pages viewed and time spent", "Feature interactions", "Error logs", "A/B test group assignments"],
  },
]

const USER_RIGHTS = [
  { icon: FiEye,      title: "Right to Access",      desc: "Request a copy of all personal data we hold about you in a portable, machine-readable format.",                                     color: "#F97316" },
  { icon: FiEdit3,    title: "Right to Rectification",desc: "Correct inaccurate or incomplete personal data. Most data can be edited directly in your account settings.",                       color: "#6366F1" },
  { icon: FiTrash2,   title: "Right to Erasure",      desc: "Request deletion of your personal data where we have no legal basis for continued processing ('right to be forgotten').",          color: "#EC4899" },
  { icon: FiLock,     title: "Right to Restriction",  desc: "Ask us to restrict processing of your data while you contest its accuracy or while a dispute is pending.",                         color: "#10B981" },
  { icon: FiDownload, title: "Right to Portability",  desc: "Receive your personal data in a structured, commonly used, machine-readable format and transfer it to another controller.",         color: "#F59E0B" },
  { icon: FiToggleRight,title:"Right to Object",      desc: "Object to processing based on legitimate interests, including profiling. We will cease processing unless compelling grounds exist.", color: "#3B82F6" },
  { icon: FiKey,      title: "Right to Withdraw",     desc: "Withdraw consent at any time where processing is consent-based. Withdrawal does not affect prior lawful processing.",                color: "#8B5CF6" },
  { icon: FiAlertTriangle,title:"Right to Complain",  desc: "Lodge a complaint with the Nigeria Data Protection Commission (NDPC) if you believe your rights have been violated.",               color: "#EF4444" },
]

const COOKIES_TABLE = [
  { name: "cw_session",       type: "Essential",    duration: "Session",  purpose: "Maintains your logged-in state across pages" },
  { name: "cw_csrf",          type: "Essential",    duration: "Session",  purpose: "Prevents cross-site request forgery attacks" },
  { name: "cw_prefs",         type: "Functional",   duration: "1 year",   purpose: "Stores your display preferences (language, theme)" },
  { name: "cw_onboarding",    type: "Functional",   duration: "30 days",  purpose: "Tracks which onboarding steps you've completed" },
  { name: "_ga",              type: "Analytics",    duration: "2 years",  purpose: "Google Analytics — distinguishes unique users" },
  { name: "_gid",             type: "Analytics",    duration: "24 hours", purpose: "Google Analytics — stores page view information" },
  { name: "pstk_*",           type: "Payment",      duration: "Session",  purpose: "Paystack secure payment processing tokens" },
  { name: "cw_ab",            type: "Performance",  duration: "90 days",  purpose: "A/B test group assignment for feature testing" },
]

const COOKIE_COLORS: Record<string, string> = {
  Essential:   "#10B981",
  Functional:  "#6366F1",
  Analytics:   "#F59E0B",
  Payment:     "#EC4899",
  Performance: "#3B82F6",
}

/* ═══ REUSABLE COMPONENTS ════════════════════════════════════ */
function SHead({ id, number, icon: Icon, title }: { id: string; number: string; icon: React.ElementType; title: string }) {
  return (
    <div id={id} className="flex items-start gap-4 mb-6 pt-2 scroll-mt-28">
      <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
          <Icon size={18} className="text-violet-500" />
        </div>
        <span className="font-mono text-[10px] text-violet-300 font-bold">{number}</span>
      </div>
      <h2 className="font-display font-black text-2xl text-gray-900 leading-tight pt-1.5">{title}</h2>
    </div>
  )
}

function Highlight({ color = "violet", children }: { color?: "violet"|"orange"|"emerald"|"amber"|"red"|"indigo"; children: React.ReactNode }) {
  const map = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-800",  dot: "bg-violet-400"  },
    orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800",  dot: "bg-orange-400"  },
    indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-800",  dot: "bg-indigo-400"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-400" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   dot: "bg-amber-400"   },
    red:     { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     dot: "bg-red-400"     },
  }
  const c = map[color]
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5 my-5 flex gap-3`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 shrink-0`} />
      <p className={`${c.text} text-sm leading-relaxed font-display font-normal`}>{children}</p>
    </div>
  )
}

function ClauseList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 my-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed font-display font-normal">
          <span className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
            <FiChevronRight size={10} className="text-violet-500" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Divider() {
  return <div className="my-10 h-px bg-gradient-to-r from-transparent via-violet-100 to-transparent" />
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-gray-600 text-sm leading-[1.85] font-display font-normal mb-4 ${className}`}>{children}</p>
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display font-bold text-gray-900 text-base mt-7 mb-3">{children}</h3>
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-500 transition-colors font-mono">
      {copied ? <FiCheckCircle size={11} className="text-emerald-500" /> : <FiCopy size={11} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  )
}

function BackToTop({ visible }: { visible: boolean }) {
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center shadow-lg shadow-violet-200 transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(.8)", pointerEvents: visible ? "auto" : "none" }}>
      <FiArrowUp size={16} />
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function PrivacyPage() {
  const scrollY  = useScrollY()
  const progress = useReadingProgress()
  const active   = useActiveSection(SECTION_IDS)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .font-display { font-family: 'Sora', sans-serif; }
        .font-serif   { font-family: 'Instrument Serif', serif; }
        .font-mono    { font-family: 'JetBrains Mono', monospace; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f9fafb; }
        ::-webkit-scrollbar-thumb { background: #7C3AED; border-radius: 3px; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimViolet{ 0%{background-position:-700px 0} 100%{background-position:700px 0} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes dotDrift  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes orbDrift1 { 0%,100%{transform:translate(0,0)scale(1)} 40%{transform:translate(40px,-50px)scale(1.08)} 80%{transform:translate(-25px,25px)scale(.94)} }
        @keyframes orbDrift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-35px,40px)scale(.92)} }
        @keyframes pulse     { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes scanLine  { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
        @keyframes dataFlow  { 0%{opacity:0;transform:translateY(-8px)} 50%{opacity:1} 100%{opacity:0;transform:translateY(8px)} }

        .entry { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
        .shimmer-violet {
          background: linear-gradient(90deg,#7C3AED 0%,#6D28D9 15%,#8B5CF6 35%,#A78BFA 50%,#8B5CF6 65%,#6D28D9 85%,#7C3AED 100%);
          background-size: 700px 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimViolet 3.5s linear infinite;
        }
        .shimmer-orange {
          background: linear-gradient(90deg,#F97316,#EA580C,#FB923C,#FCD34D,#FB923C,#EA580C,#F97316);
          background-size: 600px 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimViolet 3s linear infinite;
        }
        .grid-violet { background-image: linear-gradient(rgba(124,58,237,.05) 1px,transparent 1px), linear-gradient(90deg,rgba(124,58,237,.05) 1px,transparent 1px); background-size: 56px 56px; }
        .dot-bg-v    { background-image: radial-gradient(rgba(124,58,237,.12) 1.5px, transparent 1.5px); background-size: 26px 26px; }
        .anim-o1     { animation: orbDrift1 14s ease-in-out infinite; }
        .anim-o2     { animation: orbDrift2 18s ease-in-out infinite; }
        strong { font-weight: 700; color: #111827; }

        .nav-active { background: rgba(124,58,237,.08); border-color: rgba(124,58,237,.25); }
        .nav-active .ndot { background: #7C3AED; box-shadow: 0 0 8px rgba(124,58,237,.6); }
        .nav-active span  { color: #5B21B6; }

        .data-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.08), 0 4px 12px rgba(124,58,237,.06); }
        .data-card { transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease; }

        .right-card:hover { border-color: rgba(124,58,237,.3); background: rgba(124,58,237,.03); }
        .right-card { transition: border-color .2s ease, background .2s ease; }

        .cookie-row:hover { background: rgba(124,58,237,.03); }
        .cookie-row { transition: background .15s ease; }

        .scan-line { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(124,58,237,.04) 50%, transparent 60%); animation: scanLine 4s ease-in-out infinite; pointer-events: none; }
      `}</style>

      {/* ── READING PROGRESS BAR ── */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-100">
        <div className="h-full bg-gradient-to-r from-violet-600 via-purple-400 to-violet-600 transition-all duration-150"
          style={{ width: `${progress}%`, backgroundSize: "200%", animation: "gradShift 4s ease infinite" }} />
      </div>

      <div className="font-display bg-white text-gray-900 overflow-x-hidden selection:bg-violet-100 selection:text-violet-900 min-h-screen">
        <Navbar />

        {/* ── HERO ── */}
        <div className="relative overflow-hidden bg-[#0A0614] pt-28 pb-20">
          <div className="absolute inset-0 grid-violet opacity-70" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(124,58,237,.14) 0%, transparent 70%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 40% at 15% 80%, rgba(249,115,22,.07) 0%, transparent 55%)" }} />

          {/* orbs */}
          <div className="absolute anim-o1 w-[600px] h-[600px] rounded-full bg-violet-500/8 blur-3xl -top-40 right-0 pointer-events-none" />
          <div className="absolute anim-o2 w-[400px] h-[400px] rounded-full bg-orange-500/6 blur-3xl bottom-0 -left-20 pointer-events-none" />

          {/* floating data nodes */}
          {[[8,18],[90,12],[94,65],[4,72],[52,88],[28,42],[80,48],[65,22],[18,60]].map(([x,y],i)=>(
            <div key={i} className="absolute rounded-full bg-violet-400 opacity-20"
              style={{left:`${x}%`,top:`${y}%`,width:`${3+i%3*3}px`,height:`${3+i%3*3}px`,animation:`dotDrift ${5+i}s ease-in-out ${i*.4}s infinite`}} />
          ))}

          {/* scan line effect */}
          <div className="scan-line" />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            {/* shield icon */}
            <div className="entry inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 mb-8" style={{animationDelay:".05s"}}>
              <HiShieldCheck size={30} className="text-violet-400" />
            </div>

            <h1 className="entry font-display font-black text-5xl lg:text-6xl text-white leading-[.95] tracking-tight mb-4" style={{animationDelay:".15s"}}>
              Privacy<br /><span className="shimmer-violet">Policy</span>
            </h1>
            <p className="entry font-serif italic text-2xl text-white/38 mb-10" style={{animationDelay:".28s"}}>
              how changeworker handles your data
            </p>

            {/* meta chips */}
            <div className="entry flex flex-wrap justify-center gap-3" style={{animationDelay:".4s"}}>
              {[
                { label: "Effective",    value: "January 1, 2025",       icon: FiCheckCircle },
                { label: "Last updated", value: "March 2025",             icon: FiRefreshCw   },
                { label: "Framework",    value: "NDPA 2023 Compliant",    icon: RiShieldCheckLine },
                { label: "Version",      value: "1.1",                    icon: FiFileText    },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                  <Icon size={12} className="text-violet-400" />
                  <span className="text-white/30 text-xs font-mono">{label}:</span>
                  <span className="text-white/65 text-xs font-semibold font-display">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* ── SUMMARY BANNER ── */}
        <div className="bg-violet-50 border-b border-violet-100">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                <HiSparkles size={16} className="text-violet-500" />
              </div>
              <div>
                <p className="font-display font-bold text-gray-900 text-sm mb-1">The short version</p>
                <p className="text-gray-600 text-sm leading-relaxed font-display font-normal">
                  We collect only the data we need to run changeworker. We <strong>never sell your data</strong>. We use it to match talent with organizations, process payments, and improve the platform. You have full rights to access, correct, or delete your data. We comply with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>. Questions? Contact our DPO at <strong>privacy@changeworker.ng</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          <div className="grid lg:grid-cols-[260px_1fr] gap-12">

            {/* ── STICKY SIDEBAR ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="font-mono text-[10px] uppercase tracking-[.22em] text-gray-400 mb-4 px-2">Table of contents</p>
                <nav className="flex flex-col gap-1">
                  {SECTIONS.map(({ id, label, icon: Icon }) => {
                    const isActive = active === id
                    return (
                      <button key={id} onClick={() => scrollTo(id)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                          isActive ? "nav-active border-violet-200 bg-violet-50" : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}>
                        <span className={`ndot w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ${isActive ? "bg-violet-500" : "bg-gray-300 group-hover:bg-violet-300"}`} />
                        <Icon size={13} className={`shrink-0 transition-colors ${isActive ? "text-violet-500" : "text-gray-400 group-hover:text-gray-600"}`} />
                        <span className={`text-xs font-display font-medium transition-colors ${isActive ? "text-violet-700" : ""}`}>{label}</span>
                      </button>
                    )
                  })}
                </nav>

                {/* progress */}
                <div className="mt-8 px-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Reading progress</span>
                    <span className="font-mono text-[10px] text-violet-500 font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-purple-400 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-8 px-2 space-y-2.5">
                  <a href="mailto:privacy@changeworker.ng" className="flex items-center gap-2 text-xs text-gray-500 hover:text-violet-600 transition-colors font-display group">
                    <FiMail size={12} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
                    privacy@changeworker.ng
                  </a>
                  <CopyBtn text={typeof window !== "undefined" ? window.location.href : "https://changeworker.ng/privacy"} />
                </div>
              </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="min-w-0">

              {/* ─── 1. OVERVIEW ─── */}
              <section className="mb-0">
                <SHead id="overview" number="01" icon={MdOutlinePolicy} title="Overview & Commitment" />
                <P>This Privacy Policy explains how <strong>Impactpal Africa</strong> ("we", "us", "our"), operator of the changeworker platform, collects, uses, stores, shares, and protects your personal data when you use our services at changeworker.ng.</P>
                <P>We are committed to your privacy and to responsible data stewardship. This Policy is written in plain language wherever possible, and we encourage you to read it in full. It applies to all users of the platform — organizations, freelancers, and visitors.</P>
                <Highlight color="violet">
                  changeworker is compliant with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> and the regulations issued by the Nigeria Data Protection Commission (NDPC). Where you are located in another jurisdiction, we apply equivalent or higher standards.
                </Highlight>
                <P>By using changeworker, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our practices, please discontinue use of the platform and contact us to request data deletion.</P>

                <SubHead>Who is the Data Controller?</SubHead>
                <P>Impactpal Africa is the <strong>data controller</strong> for personal data collected through changeworker. Our designated Data Protection Officer (DPO) can be reached at <strong>privacy@changeworker.ng</strong>.</P>
              </section>

              <Divider />

              {/* ─── 2. DATA WE COLLECT ─── */}
              <section>
                <SHead id="collect" number="02" icon={FiDatabase} title="Data We Collect" />
                <P>We collect different categories of data depending on how you use changeworker. Below is a comprehensive breakdown of every data type we may collect:</P>

                <div className="grid sm:grid-cols-2 gap-4 my-6">
                  {DATA_TYPES.map((d, i) => {
                    const Icon = d.icon
                    return (
                      <div key={i} className="data-card rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${d.color}12` }}>
                            <Icon size={17} style={{ color: d.color }} />
                          </div>
                          <h3 className="font-display font-bold text-gray-900 text-sm">{d.category}</h3>
                        </div>
                        <ul className="space-y-1.5">
                          {d.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-gray-500 font-display leading-relaxed">
                              <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: d.color }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                <Highlight color="emerald">
                  We apply the principle of <strong>data minimisation</strong> — we only collect what is strictly necessary for the purposes described in this Policy. We do not collect sensitive personal data such as biometric data, health information, or political opinions.
                </Highlight>
              </section>

              <Divider />

              {/* ─── 3. HOW WE COLLECT ─── */}
              <section>
                <SHead id="how-collect" number="03" icon={FiWifi} title="How We Collect Your Data" />
                <P>We collect data through the following means:</P>

                <SubHead>Direct Collection</SubHead>
                <P>Data you actively provide to us when you:</P>
                <ClauseList items={[
                  "Create and complete your account profile (name, email, skills, credentials).",
                  "Post a project brief or submit a freelancer application.",
                  "Make or receive payments through the platform.",
                  "Send messages to other users or to our support team.",
                  "Submit verification documents (government ID, CAC certificate).",
                  "Complete feedback forms, surveys, or leave reviews.",
                ]} />

                <SubHead>Automated Collection</SubHead>
                <P>Data we collect automatically when you use the platform:</P>
                <ClauseList items={[
                  "Log data: IP address, browser type, pages visited, time and date of access, referring URLs.",
                  "Device data: device type, operating system, screen resolution, and unique device identifiers.",
                  "Cookie data: session tokens, preference storage, and analytics identifiers (see Section 6 for details).",
                  "Usage patterns: feature interactions, search queries, and error logs collected for performance improvement.",
                ]} />

                <SubHead>Third-Party Sources</SubHead>
                <P>We may receive data about you from:</P>
                <ClauseList items={[
                  "Paystack: transaction confirmation, payment status, and fraud signals.",
                  "Google Analytics: aggregated behaviour and traffic data.",
                  "Identity verification services: document verification outcomes (pass/fail — not raw document copies).",
                  "Other users: reviews, ratings, and project feedback submitted about your account.",
                ]} />
              </section>

              <Divider />

              {/* ─── 4. HOW WE USE DATA ─── */}
              <section>
                <SHead id="use" number="04" icon={FiToggleRight} title="How We Use Your Data" />
                <P>We process your personal data for the following purposes, each grounded in a clear legal basis:</P>

                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm my-6">
                  <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100 px-5 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">Purpose</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">Data Used</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">Legal Basis</span>
                  </div>
                  {[
                    ["Account creation & authentication",       "Identity, Contact",              "Contract"],
                    ["Talent matching & curation",             "Professional, Usage",            "Contract"],
                    ["Payment processing & escrow",            "Transaction, Identity",          "Contract"],
                    ["Identity & document verification",       "Identity, Organisational",       "Legal obligation"],
                    ["Platform security & fraud prevention",   "Technical, Usage",               "Legitimate interest"],
                    ["Customer support & dispute resolution",  "Communications, Transaction",    "Contract"],
                    ["Platform analytics & improvement",       "Usage, Technical",               "Legitimate interest"],
                    ["Marketing communications (opt-in)",      "Contact, Usage",                 "Consent"],
                    ["Legal compliance & record-keeping",      "All categories",                 "Legal obligation"],
                    ["Personalised recommendations",           "Professional, Usage",            "Legitimate interest"],
                  ].map(([purpose, data, basis], i) => (
                    <div key={i} className={`grid grid-cols-3 border-b border-gray-50 px-5 py-3.5 cookie-row ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                      <span className="text-xs text-gray-700 font-display pr-4">{purpose}</span>
                      <span className="text-xs text-gray-500 font-mono pr-4">{data}</span>
                      <span className="text-xs font-semibold font-display" style={{ color: basis === "Contract" ? "#6366F1" : basis === "Consent" ? "#10B981" : "#F59E0B" }}>{basis}</span>
                    </div>
                  ))}
                </div>

                <Highlight color="orange">
                  We will never use your data for purposes incompatible with those listed above without first obtaining your explicit consent or establishing a new lawful basis.
                </Highlight>

                <SubHead>Marketing Communications</SubHead>
                <P>We send marketing emails only to users who have opted in. Every marketing email includes a clear unsubscribe link. You can manage your notification preferences at any time in your account settings under <strong>Settings → Notifications</strong>.</P>
              </section>

              <Divider />

              {/* ─── 5. SHARING ─── */}
              <section>
                <SHead id="sharing" number="05" icon={FiUsers} title="Sharing & Disclosure" />
                <P><strong>We do not sell, rent, or trade your personal data.</strong> We share data only in the following limited circumstances:</P>

                <SubHead>With Other Platform Users</SubHead>
                <P>Certain profile information is visible to other users as part of the marketplace function:</P>
                <ClauseList items={[
                  "Freelancer profiles (name, photo, bio, skills, rate, reviews) are visible to Organizations during the matching process.",
                  "Organization names and mission descriptions are visible to matched Freelancers.",
                  "Reviews and ratings are visible to all platform users once published.",
                  "Private messages are visible only to the parties involved in that conversation.",
                ]} />

                <SubHead>With Service Providers</SubHead>
                <P>We share data with trusted third-party processors who help us operate the platform, each bound by strict data processing agreements:</P>
                <div className="overflow-hidden rounded-2xl border border-gray-100 my-4 shadow-sm">
                  {[
                    { provider: "Paystack",          purpose: "Payment processing & escrow",          data: "Identity, payment",         location: "Nigeria" },
                    { provider: "Google Analytics",  purpose: "Platform analytics",                   data: "Usage (anonymised)",       location: "USA (SCCs)" },
                    { provider: "Amazon Web Services",purpose: "Cloud hosting & storage",             data: "All platform data",        location: "Nigeria/EU" },
                    { provider: "Mailchimp",         purpose: "Transactional & marketing email",      data: "Name, email",              location: "USA (SCCs)" },
                    { provider: "Sentry",            purpose: "Error monitoring",                     data: "Technical, partial usage", location: "USA (SCCs)" },
                  ].map(({ provider, purpose, data, location }, i) => (
                    <div key={i} className={`grid grid-cols-4 px-5 py-3.5 border-b border-gray-50 text-xs cookie-row ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                      <span className="font-display font-semibold text-gray-800">{provider}</span>
                      <span className="text-gray-500 font-display">{purpose}</span>
                      <span className="text-gray-400 font-mono">{data}</span>
                      <span className="text-gray-400 font-mono">{location}</span>
                    </div>
                  ))}
                </div>

                <SubHead>For Legal Reasons</SubHead>
                <P>We may disclose your data to law enforcement or regulatory bodies where required by law, court order, or where we believe in good faith that disclosure is necessary to protect the rights, property, or safety of changeworker, our users, or the public.</P>

                <SubHead>Business Transfers</SubHead>
                <P>In the event of a merger, acquisition, or sale of substantially all assets, your data may be transferred to the successor entity. We will notify you via email and provide an opportunity to delete your account before any such transfer.</P>
              </section>

              <Divider />

              {/* ─── 6. COOKIES ─── */}
              <section>
                <SHead id="cookies" number="06" icon={TbCookie} title="Cookies & Tracking Technologies" />
                <P>changeworker uses cookies and similar tracking technologies to operate the platform, remember your preferences, and understand how users interact with our service.</P>

                <SubHead>What are cookies?</SubHead>
                <P>Cookies are small text files stored on your device by your browser when you visit a website. They allow the site to recognise your device on subsequent visits and store information about your session.</P>

                <div className="overflow-x-auto my-6">
                  <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm min-w-[580px]">
                    <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-100 px-5 py-3">
                      {["Cookie Name","Type","Duration","Purpose"].map(h => (
                        <span key={h} className="font-mono text-[10px] uppercase tracking-wider text-gray-400">{h}</span>
                      ))}
                    </div>
                    {COOKIES_TABLE.map((row, i) => (
                      <div key={i} className={`grid grid-cols-4 px-5 py-3.5 border-b border-gray-50 cookie-row ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                        <span className="font-mono text-xs text-gray-700">{row.name}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full self-start font-display" style={{ background: `${COOKIE_COLORS[row.type]}15`, color: COOKIE_COLORS[row.type] }}>{row.type}</span>
                        <span className="font-mono text-xs text-gray-400">{row.duration}</span>
                        <span className="text-xs text-gray-500 font-display">{row.purpose}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <SubHead>Managing Cookies</SubHead>
                <P>You can control cookies through your browser settings. Note that disabling <strong>Essential</strong> cookies will prevent the platform from functioning correctly. You may opt out of Analytics cookies at any time via the cookie preference centre in your account settings.</P>
                <P>For Google Analytics opt-out, you may also use the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-violet-600 hover:text-violet-700 underline underline-offset-2">Google Analytics opt-out browser add-on</a>.</P>
              </section>

              <Divider />

              {/* ─── 7. RETENTION ─── */}
              <section>
                <SHead id="retention" number="07" icon={FiServer} title="Data Retention" />
                <P>We retain personal data only for as long as necessary to fulfil the purposes described in this Policy, comply with legal obligations, and resolve disputes.</P>

                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm my-6">
                  <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100 px-5 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">Data Category</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">Retention Period</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400">Basis</span>
                  </div>
                  {[
                    ["Account data",         "Duration of account + 2 years",    "Contract / Legal"],
                    ["Transaction records",  "7 years after transaction",         "Legal obligation (FIRS)"],
                    ["Identity documents",   "Duration of account + 1 year",     "Legal obligation"],
                    ["Project communications","Duration of account + 6 months",  "Legitimate interest"],
                    ["Support tickets",      "3 years after resolution",         "Legitimate interest"],
                    ["Analytics data",       "26 months (anonymised thereafter)","Legitimate interest"],
                    ["Marketing consent",    "Until withdrawn",                  "Consent"],
                    ["Legal hold data",      "Duration of proceeding + 3 years", "Legal obligation"],
                  ].map(([category, period, basis], i) => (
                    <div key={i} className={`grid grid-cols-3 border-b border-gray-50 px-5 py-3.5 cookie-row text-xs ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                      <span className="font-display font-medium text-gray-800">{category}</span>
                      <span className="font-mono text-gray-500">{period}</span>
                      <span className="text-gray-400 font-display">{basis}</span>
                    </div>
                  ))}
                </div>

                <P>When data is no longer needed, we securely delete or anonymise it in accordance with industry best practices. Anonymised data (which cannot identify you) may be retained indefinitely for statistical and research purposes.</P>
              </section>

              <Divider />

              {/* ─── 8. SECURITY ─── */}
              <section>
                <SHead id="security" number="08" icon={FiLock} title="Security Measures" />
                <P>We take the security of your data seriously and implement appropriate technical and organisational measures to protect it against unauthorised access, loss, destruction, or alteration.</P>

                <div className="grid sm:grid-cols-2 gap-4 my-6">
                  {[
                    { icon: FiLock,    color: "#7C3AED", title: "Encryption at rest & in transit",   desc: "All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Payment data is additionally tokenised by Paystack." },
                    { icon: FiKey,     color: "#F97316", title: "Access control",                     desc: "Role-based access controls ensure staff can only access data necessary for their job function. All access is logged and audited." },
                    { icon: FiShield,  color: "#10B981", title: "Penetration testing",                desc: "We conduct periodic third-party security audits and penetration tests to identify and remediate vulnerabilities." },
                    { icon: FiServer,  color: "#6366F1", title: "Secure infrastructure",              desc: "Platform hosted on AWS with SOC 2 Type II certified data centres. Automated backups run every 6 hours with 30-day retention." },
                    { icon: FiEye,     color: "#EC4899", title: "Monitoring & alerts",                desc: "24/7 automated threat monitoring with immediate alerts for anomalous activity. Incident response plan tested annually." },
                    { icon: MdFingerprint, color: "#F59E0B", title: "Multi-factor authentication",   desc: "MFA is available and strongly recommended for all accounts. Admin accounts require MFA by policy." },
                  ].map(({ icon: Icon, color, title, desc }, i) => (
                    <div key={i} className="right-card rounded-xl border border-gray-100 p-5 flex gap-3.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div>
                        <p className="font-display font-bold text-gray-900 text-sm mb-1">{title}</p>
                        <p className="text-gray-500 text-xs leading-relaxed font-display font-normal">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Highlight color="amber">
                  While we implement robust security measures, no system is entirely secure. If you suspect your account has been compromised, contact us immediately at <strong>security@changeworker.ng</strong>. In the event of a data breach affecting your rights and freedoms, we will notify you and the NDPC within 72 hours of becoming aware.
                </Highlight>
              </section>

              <Divider />

              {/* ─── 9. YOUR RIGHTS ─── */}
              <section>
                <SHead id="rights" number="09" icon={TbUserShield} title="Your Rights Under NDPA 2023" />
                <P>The Nigeria Data Protection Act 2023 grants you significant rights over your personal data. We honour all of these rights. Here is what you can ask us to do:</P>

                <div className="grid sm:grid-cols-2 gap-4 my-6">
                  {USER_RIGHTS.map(({ icon: Icon, title, desc, color }, i) => (
                    <div key={i} className="right-card rounded-xl border border-gray-100 p-5 flex gap-3.5 cursor-default">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}12` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div>
                        <p className="font-display font-bold text-gray-900 text-sm mb-1">{title}</p>
                        <p className="text-gray-500 text-xs leading-relaxed font-display font-normal">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <SubHead>How to Exercise Your Rights</SubHead>
                <P>To exercise any of the above rights, submit a written request to <strong>privacy@changeworker.ng</strong> with the subject line "Data Rights Request" and include:</P>
                <ClauseList items={[
                  "Your full name and registered email address.",
                  "The specific right(s) you wish to exercise.",
                  "Any relevant context or details about the data concerned.",
                  "A copy of your government-issued ID for identity verification purposes.",
                ]} />
                <P>We will acknowledge your request within <strong>2 business days</strong> and respond fully within <strong>30 days</strong> (extendable to 90 days for complex requests with notice). We will not charge a fee for reasonable requests.</P>

                <Highlight color="violet">
                  If you believe we have failed to address your rights request adequately, you may lodge a complaint with the <strong>Nigeria Data Protection Commission (NDPC)</strong> at ndpb.gov.ng or by email at info@ndpb.gov.ng.
                </Highlight>
              </section>

              <Divider />

              {/* ─── 10. CHILDREN ─── */}
              <section>
                <SHead id="children" number="10" icon={RiUserHeartLine} title="Children's Privacy" />
                <P>changeworker is not intended for use by persons under the age of <strong>18 years</strong>. We do not knowingly collect personal data from minors.</P>
                <P>If you are a parent or guardian and believe your child has provided personal data to changeworker, please contact us immediately at <strong>privacy@changeworker.ng</strong>. We will take prompt steps to delete any such data from our systems.</P>
                <Highlight color="red">
                  If we discover that we have inadvertently collected personal data from a person under 18, we will delete it from our systems within 48 hours of becoming aware, without requiring any action from the minor or their guardian.
                </Highlight>
              </section>

              <Divider />

              {/* ─── 11. INTERNATIONAL TRANSFERS ─── */}
              <section>
                <SHead id="transfers" number="11" icon={FiGlobe} title="International Data Transfers" />
                <P>changeworker primarily processes data within <strong>Nigeria</strong>. However, some of our third-party service providers (such as Google Analytics and Mailchimp) may process data in other countries, including the United States.</P>
                <P>Where data is transferred outside Nigeria, we ensure adequate safeguards are in place, including:</P>
                <ClauseList items={[
                  "Standard Contractual Clauses (SCCs) approved by the relevant supervisory authority.",
                  "Transfers only to countries with adequate data protection laws as recognised by the NDPC.",
                  "Binding corporate rules where the recipient is part of the same corporate group.",
                  "Explicit consent, where none of the above mechanisms apply and the transfer is necessary.",
                ]} />
                <P>You may request information about the safeguards governing any specific international transfer by contacting our DPO.</P>
              </section>

              <Divider />

              {/* ─── 12. THIRD-PARTY LINKS ─── */}
              <section>
                <SHead id="third-party" number="12" icon={TbWorldWww} title="Third-Party Links & Services" />
                <P>The changeworker platform may contain links to external websites, social media profiles, and third-party services that are not operated by us. We have no control over, and accept no responsibility for, the privacy practices or content of such external sites.</P>
                <P>We encourage you to review the privacy policies of any third-party sites you visit. This Privacy Policy applies exclusively to data processed by changeworker and Impactpal Africa.</P>
                <Highlight color="indigo">
                  The inclusion of a link to a third-party site does not constitute endorsement by changeworker. Exercise your own judgment when sharing personal data on any external platform.
                </Highlight>
              </section>

              <Divider />

              {/* ─── 13. CHANGES ─── */}
              <section>
                <SHead id="changes" number="13" icon={FiRefreshCw} title="Changes to This Policy" />
                <P>We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or platform features. When we do, we will:</P>
                <ClauseList items={[
                  "Update the 'Last updated' date at the top of this Policy.",
                  "Notify registered users by email for material changes.",
                  "Display a prominent banner on the platform for at least 14 days following significant updates.",
                  "Maintain an archive of previous versions, available on request.",
                ]} />
                <P>Where a change requires your consent (e.g., a new processing purpose), we will seek it explicitly before the change takes effect. Your continued use of changeworker after the effective date of an update constitutes acceptance of the revised Policy.</P>
                <P>For minor updates (correcting typos, clarifying existing practices, updating contact details), we may not provide advance notice but will always update the version number and date.</P>
              </section>

              <Divider />

              {/* ─── 14. CONTACT ─── */}
              <section>
                <SHead id="contact" number="14" icon={FiMail} title="Contact Us & DPO" />
                <P>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please reach out through the appropriate channel:</P>

                <div className="grid sm:grid-cols-2 gap-4 my-6">
                  {[
                    { label: "Data Protection Officer", value: "privacy@changeworker.ng",  icon: RiShieldCheckLine, color: "#7C3AED", desc: "Rights requests, data concerns" },
                    { label: "General enquiries",       value: "hello@changeworker.ng",    icon: FiMail,           color: "#F97316", desc: "General questions about the platform" },
                    { label: "Security incidents",      value: "security@changeworker.ng", icon: FiLock,           color: "#EC4899", desc: "Report suspected breaches" },
                    { label: "Legal & compliance",      value: "legal@changeworker.ng",    icon: FiShield,         color: "#10B981", desc: "Regulatory enquiries" },
                  ].map(({ label, value, icon: Icon, color, desc }) => (
                    <div key={label} className="right-card flex items-start gap-3.5 p-4.5 rounded-xl border border-gray-100 bg-gray-50 p-5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                        <a href={`mailto:${value}`} className="font-display font-semibold text-sm text-gray-800 hover:text-violet-600 transition-colors block">{value}</a>
                        <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <P>We aim to respond to all privacy-related correspondence within <strong>2 business days</strong> and to fulfil data rights requests within <strong>30 days</strong>.</P>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 my-4">
                  <p className="font-display font-semibold text-gray-800 text-sm mb-1.5">Postal Address</p>
                  <p className="text-gray-500 text-sm font-display font-normal leading-relaxed">
                    Data Protection Officer<br />
                    Impactpal Africa — changeworker<br />
                    Lagos, Federal Republic of Nigeria
                  </p>
                </div>

                <P>If you are not satisfied with our response, you have the right to complain to the <strong>Nigeria Data Protection Commission (NDPC)</strong>:</P>
                <div className="flex items-center gap-3 mt-3">
                  <a href="https://ndpb.gov.ng" target="_blank" rel="noopener"
                    className="inline-flex items-center gap-2 text-xs font-display font-semibold text-violet-600 hover:text-violet-700 transition-colors">
                    <FiExternalLink size={12} /> ndpb.gov.ng
                  </a>
                  <span className="text-gray-200">·</span>
                  <a href="mailto:info@ndpb.gov.ng" className="text-xs font-mono text-gray-400 hover:text-violet-600 transition-colors">
                    info@ndpb.gov.ng
                  </a>
                </div>
              </section>

              <Divider />

              {/* ── ACCEPTANCE FOOTER ── */}
              <div className="rounded-2xl bg-[#0A0614] p-8 relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(124,58,237,.12) 0%, transparent 70%)" }} />
                <div className="scan-line" />
                <div className="relative z-10">
                  <p className="font-mono text-xs text-violet-400 uppercase tracking-[.2em] mb-3">Your agreement</p>
                  <p className="font-display font-bold text-white text-lg mb-2">By using changeworker, you accept this Privacy Policy.</p>
                  <p className="text-white/38 text-sm font-display font-normal leading-relaxed mb-6 max-w-xl">
                    This Policy, together with our Terms & Conditions, constitutes the complete agreement regarding how we handle your personal data.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a href="/terms" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-display font-bold text-sm px-6 py-3 rounded-xl transition-colors duration-200">
                      Terms & Conditions <FiExternalLink size={13} />
                    </a>
                    <a href="mailto:privacy@changeworker.ng" className="inline-flex items-center gap-2 border border-white/12 hover:border-white/25 text-white/55 hover:text-white font-display font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200">
                      Contact DPO <FiMail size={13} />
                    </a>
                  </div>
                </div>
              </div>

            </main>
          </div>
        </div>

        <BackToTop visible={scrollY > 400} />

        {/* ── FOOTER STRIP ── */}
        <div className="border-t border-gray-100 bg-gray-50 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-mono text-xs text-gray-400">© {new Date().getFullYear()} changeworker · Impactpal Africa · Privacy Policy v1.1</p>
            <div className="flex items-center gap-4">
              <a href="/terms"   className="font-mono text-xs text-gray-400 hover:text-violet-500 transition-colors">Terms & Conditions</a>
              <a href="/cookies" className="font-mono text-xs text-gray-400 hover:text-violet-500 transition-colors">Cookie Policy</a>
              <a href="/contact" className="font-mono text-xs text-gray-400 hover:text-violet-500 transition-colors">Contact</a>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
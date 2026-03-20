"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  FiArrowUp, FiShield, FiUsers, FiDollarSign, FiAlertTriangle,
  FiLock, FiGlobe, FiRefreshCw, FiMail, FiFileText,
  FiChevronRight, FiCheckCircle, FiCopy, FiArrowLeft, FiExternalLink
} from "react-icons/fi"
import { HiSparkles } from "react-icons/hi"
import { MdGavel } from "react-icons/md"
import { TbScale } from "react-icons/tb"
import { RiShieldCheckLine } from "react-icons/ri"

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
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])
  return active
}

/* ═══ DATA ════════════════════════════════════════════════════ */
const SECTIONS = [
  { id: "acceptance",    label: "Acceptance",        icon: FiCheckCircle  },
  { id: "platform",      label: "Platform Overview", icon: FiGlobe        },
  { id: "accounts",      label: "Accounts",          icon: FiUsers        },
  { id: "organizations", label: "Organizations",     icon: FiFileText     },
  { id: "freelancers",   label: "Freelancers",       icon: FiUsers        },
  { id: "payments",      label: "Payments & Fees",   icon: FiDollarSign   },
  { id: "conduct",       label: "Code of Conduct",   icon: TbScale        },
  { id: "intellectual",  label: "Intellectual Prop.", icon: FiLock         },
  { id: "disputes",      label: "Disputes",          icon: MdGavel        },
  { id: "liability",     label: "Liability",         icon: FiShield       },
  { id: "privacy",       label: "Privacy",           icon: RiShieldCheckLine },
  { id: "termination",   label: "Termination",       icon: FiAlertTriangle },
  { id: "changes",       label: "Changes",           icon: FiRefreshCw    },
  { id: "contact",       label: "Contact",           icon: FiMail         },
]

const SECTION_IDS = SECTIONS.map(s => s.id)

/* ═══ COPY BUTTON ════════════════════════════════════════════ */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors font-mono"
    >
      {copied ? <FiCheckCircle size={11} className="text-emerald-500" /> : <FiCopy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

/* ═══ SECTION HEADING ════════════════════════════════════════ */
function SHead({ id, number, icon: Icon, title }: { id: string; number: string; icon: React.ElementType; title: string }) {
  return (
    <div id={id} className="flex items-start gap-4 mb-6 pt-2 scroll-mt-28">
      <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
          <Icon size={18} className="text-orange-500" />
        </div>
        <span className="font-mono text-[10px] text-orange-300 font-bold">{number}</span>
      </div>
      <h2 className="font-display font-black text-2xl text-gray-900 leading-tight pt-1.5">{title}</h2>
    </div>
  )
}

/* ═══ HIGHLIGHT BOX ══════════════════════════════════════════ */
function Highlight({ color = "orange", children }: { color?: "orange"|"indigo"|"emerald"|"amber"|"red"; children: React.ReactNode }) {
  const map = {
    orange: { bg: "bg-orange-50",  border: "border-orange-200", text: "text-orange-800",  dot: "bg-orange-400"  },
    indigo: { bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-800",  dot: "bg-indigo-400"  },
    emerald:{ bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-800", dot: "bg-emerald-400" },
    amber:  { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-800",   dot: "bg-amber-400"   },
    red:    { bg: "bg-red-50",     border: "border-red-200",    text: "text-red-800",      dot: "bg-red-400"     },
  }
  const c = map[color]
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5 my-5 flex gap-3`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} mt-1.5 shrink-0`} />
      <p className={`${c.text} text-sm leading-relaxed font-display font-normal`}>{children}</p>
    </div>
  )
}

/* ═══ CLAUSE LIST ════════════════════════════════════════════ */
function ClauseList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 my-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed font-display font-normal">
          <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
            <FiChevronRight size={10} className="text-orange-500" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

/* ═══ DIVIDER ════════════════════════════════════════════════ */
function Divider() {
  return <div className="my-10 h-px bg-gradient-to-r from-transparent via-orange-100 to-transparent" />
}

/* ═══ PARAGRAPH ══════════════════════════════════════════════ */
function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-gray-600 text-sm leading-[1.85] font-display font-normal mb-4 ${className}`}>{children}</p>
}

/* ═══ BACK TO TOP ════════════════════════════════════════════ */
function BackToTop({ visible }: { visible: boolean }) {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-200 transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(.8)", pointerEvents: visible ? "auto" : "none" }}
    >
      <FiArrowUp size={16} />
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function TermsPage() {
  const scrollY   = useScrollY()
  const progress  = useReadingProgress()
  const active    = useActiveSection(SECTION_IDS)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setSidebarOpen(false) }
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
        ::-webkit-scrollbar-thumb { background: #F97316; border-radius: 3px; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimTxt  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes pulse    { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes gradShift{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes dotDrift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

        .entry { animation: fadeUp .6s cubic-bezier(.22,1,.36,1) both; }
        .shimmer {
          background: linear-gradient(90deg,#F97316 0%,#EA580C 20%,#FB923C 45%,#FCD34D 55%,#FB923C 70%,#EA580C 85%,#F97316 100%);
          background-size: 600px 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimTxt 3s linear infinite;
        }
        .dot-bg { background-image: radial-gradient(rgba(249,115,22,.12) 1.5px, transparent 1.5px); background-size: 26px 26px; }
        .grid-light { background-image: linear-gradient(rgba(249,115,22,.05) 1px, transparent 1px), linear-gradient(90deg,rgba(249,115,22,.05) 1px,transparent 1px); background-size: 56px 56px; }
        .nav-item-active { background: rgba(249,115,22,.08); border-color: rgba(249,115,22,.25); color: #EA580C; }
        .nav-item-active .nav-dot { background: #F97316; box-shadow: 0 0 8px rgba(249,115,22,.6); }

        strong { font-weight: 700; color: #111827; }
        .prose-section { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      {/* ── READING PROGRESS BAR ── */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
          style={{ width: `${progress}%`, transition: "width .1s linear", backgroundSize: "200%", animation: "gradShift 3s ease infinite" }}
        />
      </div>

      <div className="font-display bg-white text-gray-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-900 min-h-screen">
        <Navbar />

        {/* ── HERO HEADER ── */}
        <div className="relative overflow-hidden bg-[#060912] pt-28 pb-20">
          <div className="absolute inset-0 grid-light opacity-60" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(249,115,22,.1) 0%, transparent 70%)" }} />
          {/* dots */}
          {[[10,20],[88,15],[92,70],[5,75],[50,85],[30,45],[75,50]].map(([x,y],i)=>(
            <div key={i} className="absolute rounded-full bg-orange-400 opacity-20"
              style={{left:`${x}%`,top:`${y}%`,width:`${4+i%3*4}px`,height:`${4+i%3*4}px`,animation:`dotDrift ${5+i}s ease-in-out ${i*.4}s infinite`}}/>
          ))}

          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <div className="entry inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8" style={{animationDelay:".05s"}}>
              <TbScale size={13} className="text-orange-400" />
              <span className="font-mono text-xs text-white/55 uppercase tracking-[.2em]">Legal Document</span>
            </div>

            <h1 className="entry font-display font-black text-5xl lg:text-6xl text-white leading-[.95] tracking-tight mb-4" style={{animationDelay:".15s"}}>
              Terms &<br /><span className="shimmer">Conditions</span>
            </h1>
            <p className="entry font-serif italic text-2xl text-white/40 mb-10" style={{animationDelay:".28s"}}>
              changeworker platform agreement
            </p>

            {/* meta chips */}
            <div className="entry flex flex-wrap justify-center gap-3" style={{animationDelay:".4s"}}>
              {[
                { label: "Effective", value: "January 1, 2025", icon: FiCheckCircle },
                { label: "Last updated", value: "March 2025", icon: FiRefreshCw },
                { label: "Jurisdiction", value: "Federal Republic of Nigeria", icon: FiGlobe },
                { label: "Version", value: "1.2", icon: FiFileText },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2.5 bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                  <Icon size={12} className="text-orange-400" />
                  <span className="text-white/35 text-xs font-mono">{label}:</span>
                  <span className="text-white/70 text-xs font-semibold font-display">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* ── QUICK SUMMARY BANNER ── */}
        <div className="bg-orange-50 border-b border-orange-100">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                <HiSparkles size={16} className="text-orange-500" />
              </div>
              <div>
                <p className="font-display font-bold text-gray-900 text-sm mb-1">Plain-English Summary</p>
                <p className="text-gray-600 text-sm leading-relaxed font-display font-normal">
                  changeworker connects nonprofits and social enterprises with vetted freelancers. We charge a <strong>10% commission</strong> on completed projects. Both parties must behave professionally. All payments flow through the platform. Nigerian law governs this agreement. If something goes wrong, reach us at <strong>legal@changeworker.ng</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY: sidebar + content ── */}
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
                      <button
                        key={id}
                        onClick={() => scrollTo(id)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                          isActive
                            ? "nav-item-active border-orange-200 bg-orange-50"
                            : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`nav-dot w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ${isActive ? "bg-orange-500" : "bg-gray-300 group-hover:bg-orange-300"}`} />
                        <Icon size={13} className={`shrink-0 transition-colors ${isActive ? "text-orange-500" : "text-gray-400 group-hover:text-gray-600"}`} />
                        <span className={`text-xs font-display font-medium transition-colors ${isActive ? "text-orange-700" : ""}`}>{label}</span>
                      </button>
                    )
                  })}
                </nav>

                {/* reading progress */}
                <div className="mt-8 px-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Reading progress</span>
                    <span className="font-mono text-[10px] text-orange-500 font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* quick actions */}
                <div className="mt-8 px-2 space-y-2">
                  <a href="mailto:legal@changeworker.ng"
                    className="flex items-center gap-2.5 text-xs text-gray-500 hover:text-orange-500 transition-colors font-display group">
                    <FiMail size={12} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                    legal@changeworker.ng
                  </a>
                  <CopyBtn text={typeof window !== "undefined" ? window.location.href : "https://changeworker.ng/terms"} />
                </div>
              </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="min-w-0">

              {/* ─── 1. ACCEPTANCE ─── */}
              <section className="prose-section mb-0">
                <SHead id="acceptance" number="01" icon={FiCheckCircle} title="Acceptance of Terms" />
                <P>Welcome to <strong>changeworker</strong>, a talent marketplace operated by Impactpal Africa ("Company", "we", "us", or "our"). These Terms and Conditions ("Terms") govern your access to and use of the changeworker platform, accessible at changeworker.ng and related applications.</P>
                <P>By creating an account, posting a project, submitting a profile, or otherwise accessing the platform, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must not use changeworker.</P>
                <Highlight color="orange">
                  You must be at least 18 years old to use changeworker. By accepting these Terms, you represent that you meet this requirement and have the legal capacity to enter into a binding agreement.
                </Highlight>
                <P>These Terms constitute a legally binding agreement between you and Impactpal Africa. They apply to all users — organizations, freelancers, and visitors.</P>
              </section>

              <Divider />

              {/* ─── 2. PLATFORM OVERVIEW ─── */}
              <section className="prose-section">
                <SHead id="platform" number="02" icon={FiGlobe} title="Platform Overview" />
                <P>changeworker is a <strong>two-sided talent marketplace</strong> that facilitates connections between:</P>
                <ClauseList items={[
                  "Nonprofit organizations, social enterprises, and impact-driven entities in Nigeria that require project-based professional services (\"Organizations\").",
                  "Skilled independent professionals and freelancers who wish to provide services to impact-sector clients (\"Freelancers\").",
                ]} />
                <P>changeworker does not employ freelancers. We are a technology platform that enables Organizations and Freelancers to discover, engage, and transact with each other. We facilitate the relationship but are not a party to any service contract formed between an Organization and a Freelancer.</P>
                <Highlight color="indigo">
                  changeworker serves as a marketplace intermediary, not an employer or staffing agency. Freelancers on the platform are independent contractors, not employees of changeworker or of the organizations they serve.
                </Highlight>
                <P>We reserve the right to modify, suspend, or discontinue any aspect of the platform at any time with reasonable notice where practicable.</P>
              </section>

              <Divider />

              {/* ─── 3. ACCOUNTS ─── */}
              <section className="prose-section">
                <SHead id="accounts" number="03" icon={FiUsers} title="User Accounts & Registration" />
                <P>To access the full functionality of changeworker, you must register for an account. When registering, you agree to:</P>
                <ClauseList items={[
                  "Provide accurate, current, and complete information during registration and keep it updated.",
                  "Select a strong, unique password and maintain its confidentiality.",
                  "Notify us immediately if you suspect unauthorised access to your account.",
                  "Accept responsibility for all activities that occur under your account.",
                  "Not register more than one account per person or entity without our express written consent.",
                  "Not transfer your account to any other person or entity.",
                ]} />
                <Highlight color="amber">
                  You are solely responsible for all activities conducted through your account. changeworker will not be liable for any loss arising from unauthorised use of your account where you have failed to keep your credentials secure.
                </Highlight>
                <P>We reserve the right to refuse registration, suspend, or permanently delete accounts that violate these Terms, engage in fraudulent activity, or are otherwise deemed harmful to the platform community.</P>

                <h3 className="font-display font-bold text-gray-900 text-base mt-7 mb-3">Account Verification</h3>
                <P>All accounts are subject to identity and legitimacy verification. For <strong>Organizations</strong>, this includes submission of CAC (Corporate Affairs Commission) registration certificates or equivalent documentation. For <strong>Freelancers</strong>, this includes government-issued photo identification and skills assessment.</P>
                <P>Accounts will be marked "Verified" upon successful review. changeworker may request additional documentation at any time. Failure to provide requested documentation may result in account suspension.</P>
              </section>

              <Divider />

              {/* ─── 4. ORGANIZATIONS ─── */}
              <section className="prose-section">
                <SHead id="organizations" number="04" icon={FiFileText} title="Organizations: Rights & Obligations" />
                <P>If you register as an Organization, the following additional terms apply to you:</P>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">4.1 Project Postings</h3>
                <ClauseList items={[
                  "You must describe project requirements accurately, including scope, deliverables, duration, and budget.",
                  "Project listings must be for genuine, legitimate work. You may not post fictitious or exploratory listings.",
                  "You must not discriminate against freelancers on the basis of ethnicity, gender, religion, disability, or any other protected characteristic.",
                  "Project budgets must reflect your genuine intent to pay. Posting projects below minimum wage equivalent rates is prohibited.",
                ]} />

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">4.2 Engaging Freelancers</h3>
                <P>When you select a Freelancer through changeworker, you enter into a direct service agreement with that individual. changeworker facilitates but is not a party to this agreement. You are responsible for:</P>
                <ClauseList items={[
                  "Providing clear and timely briefs, feedback, and approvals.",
                  "Releasing payment promptly upon satisfactory completion of agreed deliverables.",
                  "Treating freelancers with professional respect and dignity.",
                  "Not engaging changeworker-matched freelancers directly outside the platform for a period of 12 months following first engagement.",
                ]} />
                <Highlight color="red">
                  Circumventing the changeworker platform to engage freelancers directly — with the intent to avoid our commission — constitutes a material breach of these Terms and may result in immediate account termination and legal action to recover damages.
                </Highlight>
              </section>

              <Divider />

              {/* ─── 5. FREELANCERS ─── */}
              <section className="prose-section">
                <SHead id="freelancers" number="05" icon={FiUsers} title="Freelancers: Rights & Obligations" />
                <P>If you register as a Freelancer, the following additional terms apply to you:</P>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">5.1 Profile & Credentials</h3>
                <ClauseList items={[
                  "Your profile must accurately represent your skills, experience, qualifications, and identity.",
                  "You must not misrepresent qualifications, certifications, or past work experience.",
                  "Work samples submitted must be your original work or work you are legally entitled to present as representative of your capabilities.",
                  "You agree to submit to periodic re-verification of your credentials as requested by changeworker.",
                ]} />

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">5.2 Service Delivery</h3>
                <ClauseList items={[
                  "You agree to deliver work that meets the agreed scope and quality standards described in the project brief.",
                  "You must communicate proactively with the Organization regarding progress, blockers, and timelines.",
                  "You must not subcontract or delegate work to third parties without the explicit written consent of the Organization.",
                  "Upon project completion, you must not retain, distribute, or use confidential information belonging to the Organization.",
                ]} />

                <Highlight color="emerald">
                  As an independent contractor, you are responsible for your own tax obligations, including any income tax, withholding tax, or VAT applicable under Nigerian law. changeworker does not withhold taxes on your behalf.
                </Highlight>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">5.3 Platform Exclusivity Window</h3>
                <P>For 12 months following your first engagement with any Organization through changeworker, you agree to conduct all further paid work with that Organization through the platform. This protects the integrity of the marketplace and ensures fair compensation for our matching services.</P>
              </section>

              <Divider />

              {/* ─── 6. PAYMENTS & FEES ─── */}
              <section className="prose-section">
                <SHead id="payments" number="06" icon={FiDollarSign} title="Payments, Fees & Escrow" />

                <h3 className="font-display font-bold text-gray-900 text-base mt-2 mb-3">6.1 Platform Commission</h3>
                <P>changeworker charges a <strong>10% commission</strong> on the total agreed project value. This fee is charged to the Organization upon project completion and marked as paid. It covers our matching, vetting, platform maintenance, and support services.</P>
                <Highlight color="orange">
                  Example: An Organization agrees to pay ₦100,000 for a grant writing project. Upon completion, the Organization pays ₦100,000 to the Freelancer, and ₦10,000 (10%) separately to changeworker as a platform fee.
                </Highlight>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">6.2 Payment Processing</h3>
                <P>All payments are processed through <strong>Paystack</strong>, our authorised payment partner. By using the platform, you agree to Paystack's terms of service in addition to these Terms. changeworker does not store full card details on our servers.</P>
                <ClauseList items={[
                  "Organizations must fund escrow before a Freelancer commences work.",
                  "Funds held in escrow are released to the Freelancer upon the Organization marking the project as complete.",
                  "If a project is abandoned without resolution, funds remain in escrow pending dispute resolution.",
                  "changeworker does not pay interest on escrowed funds.",
                ]} />

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">6.3 Refunds & Disputes</h3>
                <P>Refunds are not automatically issued. If an Organization believes work was not delivered to the agreed standard, they must raise a formal dispute within <strong>7 days</strong> of receiving deliverables. Disputes are resolved through our internal mediation process described in Section 9.</P>
                <P>changeworker reserves the right to make final binding decisions on disputes where parties cannot agree, including partial refunds, full refunds, or payment release to the Freelancer.</P>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">6.4 Currency & Taxes</h3>
                <P>All transactions on changeworker are conducted in <strong>Nigerian Naira (₦)</strong>. You are solely responsible for determining and fulfilling any tax obligations arising from your use of the platform, including but not limited to income tax, VAT, and WHT under Nigerian law.</P>
              </section>

              <Divider />

              {/* ─── 7. CONDUCT ─── */}
              <section className="prose-section">
                <SHead id="conduct" number="07" icon={TbScale} title="Code of Conduct" />
                <P>changeworker is a professional community dedicated to impact work. All users must maintain the highest standards of conduct. The following behaviours are strictly prohibited:</P>
                <ClauseList items={[
                  "Harassment, intimidation, discrimination, or threatening behaviour toward any user.",
                  "Submitting false reviews, ratings, or testimonials.",
                  "Attempting to access, interfere with, or disrupt platform systems or other users' accounts.",
                  "Posting spam, unsolicited marketing, or deceptive content.",
                  "Using the platform to facilitate money laundering, fraud, or any illegal activity.",
                  "Impersonating another individual, organisation, or changeworker staff.",
                  "Sharing private contact information with the intent to solicit off-platform transactions during the exclusivity period.",
                  "Posting content that is defamatory, obscene, or violates applicable Nigerian law.",
                ]} />
                <Highlight color="red">
                  Violations of this Code of Conduct may result in immediate account suspension or permanent termination, withholding of funds pending investigation, and/or referral to relevant law enforcement authorities.
                </Highlight>
                <P>changeworker reserves the right to remove any content or suspend any account at its sole discretion if it reasonably believes the Code of Conduct has been violated.</P>
              </section>

              <Divider />

              {/* ─── 8. INTELLECTUAL PROPERTY ─── */}
              <section className="prose-section">
                <SHead id="intellectual" number="08" icon={FiLock} title="Intellectual Property" />

                <h3 className="font-display font-bold text-gray-900 text-base mt-2 mb-3">8.1 Platform IP</h3>
                <P>The changeworker platform, including its design, code, brand, logo, trademarks, and content created by Impactpal Africa, is the exclusive intellectual property of Impactpal Africa. No user obtains any rights to this IP by using the platform.</P>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">8.2 Deliverable Ownership</h3>
                <P>Unless the service agreement between the Organization and Freelancer specifies otherwise, deliverables produced during a project are governed by the following default rule:</P>
                <Highlight color="indigo">
                  Upon full payment, all intellectual property rights in the final deliverables transfer to the Organization. The Freelancer retains the right to reference the project in their portfolio (without disclosing confidential information) unless the Organization explicitly requests confidentiality in writing.
                </Highlight>
                <P>Parties are strongly encouraged to document IP ownership terms explicitly within their project agreements.</P>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">8.3 User Content</h3>
                <P>By submitting content to changeworker — including profile information, work samples, project descriptions, and reviews — you grant changeworker a non-exclusive, royalty-free, worldwide licence to use, display, and distribute such content for the purpose of operating and promoting the platform.</P>
              </section>

              <Divider />

              {/* ─── 9. DISPUTES ─── */}
              <section className="prose-section">
                <SHead id="disputes" number="09" icon={MdGavel} title="Dispute Resolution" />

                <h3 className="font-display font-bold text-gray-900 text-base mt-2 mb-3">9.1 Internal Mediation</h3>
                <P>In the event of a dispute between an Organization and a Freelancer, both parties agree to first attempt resolution through changeworker's internal mediation process:</P>
                <ClauseList items={[
                  "The aggrieved party raises a formal dispute via the platform within 7 days of the triggering event.",
                  "changeworker assigns a resolution officer who reviews all relevant communications, deliverables, and project briefs.",
                  "Both parties are given 5 business days to submit their position in writing.",
                  "The resolution officer issues a binding recommendation within 10 business days.",
                  "Either party may accept or escalate to formal arbitration within 3 days of the recommendation.",
                ]} />

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">9.2 Arbitration</h3>
                <P>If internal mediation fails to resolve the dispute, both parties agree to resolve the matter through <strong>binding arbitration</strong> under the Lagos Court of Arbitration (LCA) Rules. The arbitration shall be conducted in English in Lagos, Nigeria. Each party bears their own legal costs unless the arbitrator orders otherwise.</P>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">9.3 Governing Law</h3>
                <P>These Terms are governed by and construed in accordance with the <strong>laws of the Federal Republic of Nigeria</strong>. To the extent that formal court proceedings are necessary, you consent to the exclusive jurisdiction of the courts of Lagos State, Nigeria.</P>
              </section>

              <Divider />

              {/* ─── 10. LIABILITY ─── */}
              <section className="prose-section">
                <SHead id="liability" number="10" icon={FiShield} title="Limitation of Liability" />
                <P>To the maximum extent permitted by applicable law, changeworker and its officers, employees, agents, and affiliates shall not be liable for:</P>
                <ClauseList items={[
                  "Any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.",
                  "Loss of profits, data, goodwill, or business opportunities.",
                  "The conduct, content, or deliverables of any Organization or Freelancer.",
                  "Platform downtime, technical errors, or interruptions beyond our reasonable control.",
                  "Unauthorised access to your account resulting from your failure to secure your credentials.",
                ]} />
                <Highlight color="amber">
                  changeworker's total aggregate liability to you for any claims arising under these Terms shall not exceed the total fees paid by you to changeworker in the six (6) months immediately preceding the claim.
                </Highlight>
                <P>The platform is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free of harmful components.</P>
                <P>We do not guarantee the quality, suitability, legality, or accuracy of any services offered by Freelancers, nor the legitimacy or financial capacity of Organizations.</P>
              </section>

              <Divider />

              {/* ─── 11. PRIVACY ─── */}
              <section className="prose-section">
                <SHead id="privacy" number="11" icon={RiShieldCheckLine} title="Privacy & Data Protection" />
                <P>Your privacy is important to us. Our collection and use of personal data is governed by our <strong>Privacy Policy</strong>, which is incorporated into these Terms by reference.</P>
                <ClauseList items={[
                  "We collect personal data necessary for platform operation: name, email, payment information, identity documents, and work history.",
                  "We do not sell your personal data to third parties.",
                  "We use industry-standard encryption and security measures to protect your data.",
                  "You have the right to request access to, correction of, or deletion of your personal data.",
                  "We retain data for as long as necessary to fulfil the purposes described in our Privacy Policy or as required by law.",
                ]} />
                <Highlight color="emerald">
                  changeworker complies with the Nigeria Data Protection Act (NDPA) 2023. If you have concerns about how your data is handled, contact our Data Protection Officer at privacy@changeworker.ng.
                </Highlight>
                <P>By using changeworker, you consent to the processing of your personal data as described in our Privacy Policy. You may withdraw consent at any time by closing your account, subject to any legal obligations requiring us to retain certain records.</P>
              </section>

              <Divider />

              {/* ─── 12. TERMINATION ─── */}
              <section className="prose-section">
                <SHead id="termination" number="12" icon={FiAlertTriangle} title="Account Termination & Suspension" />

                <h3 className="font-display font-bold text-gray-900 text-base mt-2 mb-3">12.1 By You</h3>
                <P>You may close your account at any time by contacting us at support@changeworker.ng. Closing your account does not cancel obligations arising from active projects, pending payments, or outstanding disputes. These obligations survive termination.</P>

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">12.2 By changeworker</h3>
                <P>We reserve the right to suspend or permanently terminate your account, with or without notice, if we determine that you have:</P>
                <ClauseList items={[
                  "Violated any provision of these Terms or our Code of Conduct.",
                  "Provided false or misleading information during registration or verification.",
                  "Engaged in fraudulent, deceptive, or illegal activity on the platform.",
                  "Circumvented the platform to avoid commission payments.",
                  "Created a hostile or unsafe environment for other users.",
                  "Been subject to legal process requiring us to restrict your access.",
                ]} />

                <h3 className="font-display font-bold text-gray-900 text-base mt-6 mb-3">12.3 Effect of Termination</h3>
                <P>Upon termination, your right to access the platform immediately ceases. Any funds held in escrow for active projects will be handled according to our dispute resolution process. changeworker reserves the right to retain records of your activity as required by law.</P>
              </section>

              <Divider />

              {/* ─── 13. CHANGES ─── */}
              <section className="prose-section">
                <SHead id="changes" number="13" icon={FiRefreshCw} title="Changes to These Terms" />
                <P>changeworker reserves the right to modify these Terms at any time. We will notify registered users of material changes via:</P>
                <ClauseList items={[
                  "Email notification to the address associated with your account.",
                  "Prominent notice on the platform homepage.",
                  "In-app notification on your next login.",
                ]} />
                <P>Changes will take effect <strong>14 days</strong> after notification unless the change is required by law, in which case it takes effect immediately. Your continued use of the platform after the effective date constitutes acceptance of the revised Terms.</P>
                <Highlight color="indigo">
                  We encourage you to review these Terms periodically. The "Last updated" date at the top of this document will always reflect the most recent revision. You can also check the version number to track changes.
                </Highlight>
                <P>If you do not agree to the revised Terms, you must discontinue using changeworker and may request account closure as described in Section 12.</P>
              </section>

              <Divider />

              {/* ─── 14. CONTACT ─── */}
              <section className="prose-section">
                <SHead id="contact" number="14" icon={FiMail} title="Contact Us" />
                <P>If you have questions, concerns, or feedback about these Terms, please contact us through any of the following channels:</P>

                <div className="grid sm:grid-cols-2 gap-4 my-6">
                  {[
                    { label: "General enquiries",    value: "hello@changeworker.ng",   icon: FiMail,      color: "#F97316" },
                    { label: "Legal & compliance",   value: "legal@changeworker.ng",   icon: TbScale,     color: "#6366F1" },
                    { label: "Data protection",      value: "privacy@changeworker.ng", icon: RiShieldCheckLine, color: "#10B981" },
                    { label: "Dispute resolution",   value: "disputes@changeworker.ng",icon: MdGavel,     color: "#EC4899" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-3.5 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-orange-200 hover:bg-orange-50/40 transition-all duration-200 group">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                        <a href={`mailto:${value}`} className="font-display font-semibold text-sm text-gray-700 group-hover:text-orange-600 transition-colors">{value}</a>
                      </div>
                    </div>
                  ))}
                </div>

                <P>You may also write to us at our registered address:</P>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 my-4">
                  <p className="font-display font-semibold text-gray-800 text-sm mb-1">Impactpal Africa</p>
                  <p className="text-gray-500 text-sm font-display font-normal leading-relaxed">
                    Legal Department<br />
                    changeworker Platform<br />
                    Lagos, Federal Republic of Nigeria
                  </p>
                </div>
                <P>We aim to respond to all legal and compliance enquiries within <strong>5 business days</strong>.</P>
              </section>

              <Divider />

              {/* ── ACCEPTANCE FOOTER ── */}
              <div className="rounded-2xl bg-[#060912] p-8 mt-4 relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(249,115,22,.1) 0%, transparent 70%)" }} />
                <div className="relative">
                  <p className="font-mono text-xs text-orange-400 uppercase tracking-[.2em] mb-3">Your agreement</p>
                  <p className="font-display font-bold text-white text-lg mb-2">By using changeworker, you agree to these Terms.</p>
                  <p className="text-white/40 text-sm font-display font-normal leading-relaxed mb-6 max-w-xl">
                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and Impactpal Africa with respect to your use of the changeworker platform.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a href="/signup" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-display font-bold text-sm px-6 py-3 rounded-xl transition-colors duration-200">
                      Create Account <FiArrowLeft size={13} className="rotate-180" />
                    </a>
                    <a href="/privacy" className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-white/60 hover:text-white font-display font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200">
                      Privacy Policy <FiExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>

            </main>
          </div>
        </div>

        {/* ── BACK TO TOP ── */}
        <BackToTop visible={scrollY > 400} />

        {/* Footer */}
        <Footer />

      </div>
    </>
  )
}
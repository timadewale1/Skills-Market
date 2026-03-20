"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  FiArrowRight, FiCheck, FiCheckCircle, FiUsers, FiBriefcase,
  FiDollarSign, FiShield, FiZap, FiStar, FiLock, FiGlobe,
  FiSearch, FiFileText, FiMessageSquare, FiClock, FiAward,
  FiChevronRight, FiChevronDown, FiTrendingUp, FiToggleRight,
  FiLayers
} from "react-icons/fi"
import { HiSparkles, HiLightningBolt } from "react-icons/hi"
import { TbRocket, TbTargetArrow, TbBuildingCommunity, TbHeartHandshake, TbCurrencyNaira } from "react-icons/tb"
import { RiLeafLine, RiTeamLine, RiShieldCheckLine, RiUserStarLine } from "react-icons/ri"
import { MdOutlineHandshake, MdGavel, MdOutlineVerified } from "react-icons/md"

/* ═══ DATA ═══════════════════════════════════════════════════ */
const SDGS = [
  "No Poverty","Zero Hunger","Good Health","Quality Education",
  "Gender Equality","Clean Water","Affordable & Clean Energy",
  "Decent Work","Industry & Innovation","Reduced Inequalities",
  "Sustainable Cities","Responsible Consumption","Climate Action",
  "Life Below Water","Life on Land","Peace & Justice","Partnerships for the Goals",
]

const SDG_COLORS = [
  "#E5243B","#DDA63A","#4C9F38","#C5192D","#FF3A21",
  "#26BDE2","#FCC30B","#A21942","#FD6925","#DD1367",
  "#FD9D24","#BF8B2E","#3F7E44","#0A97D9","#56C02B",
  "#00689D","#19486A",
]

const HIRE_CATEGORIES = [
  { title: "Climate & Environment", items: ["Climate researchers","Carbon accounting experts","Sustainability consultants","Environmental data analysts","ESG reporting specialists"], color: "#3F7E44" },
  { title: "Energy & Infrastructure", items: ["Renewable energy engineers","Solar system designers","Mini-grid developers","Energy auditors","Power systems analysts"], color: "#FCC30B" },
  { title: "Technology for Good", items: ["AI for social good engineers","Civic tech developers","Data scientists","Automation engineers","Blockchain for impact specialists"], color: "#FD6925" },
  { title: "Design & Communications", items: ["Graphic designers","UX designers","Impact storytellers","Motion designers","Brand strategists"], color: "#E5243B" },
  { title: "Research & Policy", items: ["Policy analysts","Monitoring & evaluation experts","Development researchers","Grant writers","Public sector consultants"], color: "#0A97D9" },
]

const CLIENT_STEPS = [
  {
    number: "01",
    icon: FiBriefcase,
    title: "Post your gig",
    desc: "Describe the work you need done. Set your budget, select the relevant SDGs, and specify the skills required. Takes less than 5 minutes.",
    detail: "Your gig brief includes scope, deliverables, timeline, budget, and which of the 17 UN Sustainable Development Goals your work aligns with. The more specific your brief, the better the talent you attract.",
    color: "#F97316",
  },
  {
    number: "02",
    icon: FiZap,
    title: "Instant matching",
    desc: "The moment your gig goes live, our system instantly surfaces the most relevant vetted talent based on skills, SDG alignment, sector experience, and availability.",
    detail: "No waiting. No manual review delay. As soon as you publish, matching happens automatically. You see a curated shortlist of talent profiles within seconds — not 48 hours.",
    color: "#6366F1",
  },
  {
    number: "03",
    icon: FiUsers,
    title: "Review & select",
    desc: "Browse the matched talent profiles, check their portfolios and past reviews, and select the person you want to work with.",
    detail: "Every profile shows verified credentials, sector experience, SDG alignment, past gig ratings, and a portfolio of past work. You're choosing from a pre-screened shortlist, not scrolling through thousands of unvetted applicants.",
    color: "#10B981",
  },
  {
    number: "04",
    icon: FiLock,
    title: "Fund escrow & begin",
    desc: "Agree on the final scope, fund the escrow, and your talent gets to work. Funds are secured — nobody can touch them until the gig is done right.",
    detail: "Escrow protects both parties. The talent knows funds are committed before they start. You know your money is safe until you're satisfied with the deliverables. Zero payment risk on both sides.",
    color: "#EC4899",
  },
  {
    number: "05",
    icon: FiCheckCircle,
    title: "Review & release",
    desc: "Receive the deliverables, review the work, and release payment. That's it. changeworker handles the rest.",
    detail: "Mark the gig complete when you're happy with the work. Funds release from escrow automatically. Leave a review for the talent to help the community. Our 10% platform fee is deducted from the talent's payout — you pay exactly what was agreed.",
    color: "#F59E0B",
  },
]

const TALENT_STEPS = [
  {
    number: "01",
    icon: RiUserStarLine,
    title: "Build your profile",
    desc: "Create a verified profile that showcases your skills, SDG focus areas, sector experience, and portfolio. This is your impact CV.",
    detail: "Your profile includes your skills and expertise, which of the 17 SDGs you're passionate about and experienced in, your rates, work samples, certifications, and a bio that tells your impact story. Verification unlocks the 'Verified' badge.",
    color: "#F97316",
  },
  {
    number: "02",
    icon: FiZap,
    title: "Get matched instantly",
    desc: "The moment a relevant gig is posted, you're instantly surfaced to the client — no bidding, no proposal wars, no cold pitching.",
    detail: "Our matching engine runs the moment a gig goes live. If your profile aligns with the gig's skills, SDG focus, and sector requirements, you appear in the client's shortlist automatically. You focus on the work, not the hustle of finding it.",
    color: "#6366F1",
  },
  {
    number: "03",
    icon: FiMessageSquare,
    title: "Discuss & agree",
    desc: "The client reviews your profile and reaches out. Discuss the scope, timeline, and any questions. Agree on the final terms.",
    detail: "All communication happens on the platform for transparency. Once you and the client agree on scope and deliverables, the client funds escrow and you can begin. You never start work without payment secured.",
    color: "#10B981",
  },
  {
    number: "04",
    icon: TbTargetArrow,
    title: "Deliver great work",
    desc: "Do what you do best. Communicate updates, meet deadlines, and deliver work that moves the mission forward.",
    detail: "Use the platform's built-in communication tools to keep the client updated. Submit deliverables through the platform for a clean record. Consistent quality builds your rating — which unlocks higher-value gigs over time.",
    color: "#EC4899",
  },
  {
    number: "05",
    icon: TbCurrencyNaira,
    title: "Get paid, grow your reputation",
    desc: "Once the client approves, payment releases from escrow to your wallet. A 10% platform fee is deducted from your payout — what you agreed is what you see.",
    detail: "Payments land in your changeworker wallet within 1–3 business days after release. Withdraw anytime via bank transfer. Every completed gig builds your rating and review history — your most powerful asset for winning future work.",
    color: "#F59E0B",
  },
]

const TRUST_FEATURES = [
  { icon: FiLock, title: "Escrow protection", desc: "Funds are secured before work begins. Nobody gets paid until the gig is done right.", color: "#F97316" },
  { icon: MdOutlineVerified, title: "Verified talent", desc: "Every freelancer is personally vetted — identity, skills, sector experience. No unvetted profiles.", color: "#6366F1" },
  { icon: MdGavel, title: "Dispute resolution", desc: "Fair, binding dispute resolution for any disagreement. Our team mediates, you don't fight alone.", color: "#10B981" },
  { icon: RiShieldCheckLine, title: "NDPA compliant", desc: "Your data is protected under the Nigeria Data Protection Act 2023. We never sell your data.", color: "#EC4899" },
  { icon: FiStar, title: "Transparent ratings", desc: "Every gig leaves a review. Ratings are verified and permanent — they build real community trust.", color: "#F59E0B" },
  { icon: TbHeartHandshake, title: "Fair pay standards", desc: "We enforce minimum rate floors. 'For the mission' is not a substitute for fair compensation.", color: "#3B82F6" },
]

/* ═══ HOOKS ══════════════════════════════════════════════════ */
function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true) }, { threshold })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [threshold])
  return { ref, inView: v }
}

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const h = () => setY(window.scrollY)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return y
}

function useMagnet(strength = 20) {
  const ref = useRef<HTMLAnchorElement>(null)
  const hm = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.transform = `translate(${(e.clientX - r.left - r.width/2)/r.width*strength}px,${(e.clientY - r.top - r.height/2)/r.height*strength}px)`
  }, [strength])
  const hl = useCallback(() => { if (ref.current) ref.current.style.transform = "translate(0,0)" }, [])
  return { ref, hm, hl }
}

/* ═══ STEP CARD ══════════════════════════════════════════════ */
function StepCard({ step, idx, inView, side }: {
  step: typeof CLIENT_STEPS[0]; idx: number; inView: boolean; side: "client" | "talent"
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = step.icon
  const isLast = idx === 4

  return (
    <div
      className={`relative ${inView ? (side === "client" ? "reveal" : "reveal-l") : "opacity-0"}`}
      style={{ "--d": `${.05 + idx * .1}s` } as React.CSSProperties}
    >
      {/* connector line — not on last */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-0.5 z-0"
          style={{ background: `linear-gradient(to bottom, ${step.color}60, ${CLIENT_STEPS[idx+1].color}60)` }} />
      )}

      <div
        className="relative z-10 flex gap-5 group cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* number + icon column */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110"
            style={{
              borderColor: `${step.color}40`,
              background: `${step.color}12`,
              boxShadow: expanded ? `0 0 0 4px ${step.color}18` : "none",
            }}
          >
            <Icon size={20} style={{ color: step.color }} />
          </div>
          <span className="font-mono text-[10px] font-bold" style={{ color: `${step.color}80` }}>{step.number}</span>
        </div>

        {/* content */}
        <div className={`flex-1 pb-10 ${!isLast ? "border-b-0" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-black text-lg text-gray-900 mb-1.5 group-hover:text-gray-700 transition-colors">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-display font-normal">{step.desc}</p>
            </div>
            <span
              className="shrink-0 w-7 h-7 rounded-full border flex items-center justify-center mt-0.5 transition-all duration-300"
              style={{
                borderColor: expanded ? step.color : "#E5E7EB",
                background: expanded ? `${step.color}15` : "transparent",
                transform: expanded ? "rotate(180deg)" : "none",
              }}
            >
              <FiChevronDown size={12} style={{ color: expanded ? step.color : "#9CA3AF" }} />
            </span>
          </div>

          {/* expanded detail */}
          <div style={{ maxHeight: expanded ? "160px" : "0", transition: "max-height .4s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>
            <div className="mt-4 pl-4 border-l-2 rounded-sm" style={{ borderColor: `${step.color}40` }}>
              <p className="text-gray-400 text-xs leading-[1.85] font-display">{step.detail}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ SDG PILL ═══════════════════════════════════════════════ */
function SDGPill({ label, color, idx, inView }: { label: string; color: string; idx: number; inView: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className={`cursor-default select-none rounded-xl px-3.5 py-2 flex items-center gap-2.5 border transition-all duration-250 ${inView ? "reveal-s" : "opacity-0"}`}
      style={{
        "--d": `${.02 + idx * .025}s`,
        borderColor: hovered ? `${color}60` : "#F3F4F6",
        background: hovered ? `${color}10` : "white",
        transform: hovered ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hovered ? `0 6px 20px ${color}20` : "none",
      } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
      <span className="font-display text-xs font-semibold text-gray-700" style={{ color: hovered ? color : undefined }}>{label}</span>
      <span className="font-mono text-[9px] text-gray-300 ml-auto shrink-0">SDG {idx + 1}</span>
    </div>
  )
}

/* ═══ FEE CALCULATOR ════════════════════════════════════════ */
function FeeCalculator() {
  const [gigAmount, setGigAmount] = useState(100000)
  const fee = Math.round(gigAmount * 0.10)
  const talentReceives = gigAmount - fee

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="font-mono text-[10px] text-orange-500 uppercase tracking-[.2em] mb-5">Fee calculator</p>
      <div className="mb-5">
        <label className="font-display text-xs font-semibold text-gray-700 block mb-2">Agreed gig rate (₦)</label>
        <div className="flex gap-2 flex-wrap">
          {[50000,100000,200000,500000].map(v => (
            <button key={v} onClick={() => setGigAmount(v)}
              className="font-mono text-xs px-3 py-1.5 rounded-lg border transition-all duration-150"
              style={{
                borderColor: gigAmount === v ? "#F97316" : "#F3F4F6",
                background: gigAmount === v ? "#FFF7ED" : "transparent",
                color: gigAmount === v ? "#EA580C" : "#6B7280",
              }}>
              ₦{v.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <input
        type="range" min={10000} max={1000000} step={5000}
        value={gigAmount} onChange={e => setGigAmount(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-6"
        style={{ accentColor: "#F97316" }}
      />

      <div className="space-y-3">
        <div className="flex justify-between items-center py-3 border-t border-gray-50">
          <span className="text-gray-500 text-sm font-display">Agreed rate</span>
          <span className="font-mono font-bold text-gray-900">₦{gigAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-t border-gray-50">
          <div>
            <span className="text-gray-500 text-sm font-display">changeworker fee</span>
            <span className="font-mono text-[10px] text-gray-400 ml-2">(10% of gig rate)</span>
          </div>
          <span className="font-mono font-bold text-red-400">− ₦{fee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center py-4 px-4 rounded-xl mt-2" style={{ background: "#F97316", }}>
          <span className="text-white font-display font-bold text-sm">You receive</span>
          <span className="font-mono font-black text-white text-xl">₦{talentReceives.toLocaleString()}</span>
        </div>
        <p className="text-gray-400 text-[11px] font-display text-center">The client pays exactly ₦{gigAmount.toLocaleString()} — no extra fees on their side.</p>
      </div>
    </div>
  )
}

/* ═══ TAB TOGGLE ════════════════════════════════════════════ */
type TabType = "client" | "talent"

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function HowItWorksPage() {
  const scrollY = useScrollY()
  const [activeTab, setActiveTab] = useState<TabType>("client")
  const mag1 = useMagnet(18)
  const mag2 = useMagnet(16)

  const heroRef     = useInView(0.05)
  const stepsRef    = useInView(0.04)
  const sdgRef      = useInView(0.05)
  const catsRef     = useInView(0.05)
  const feesRef     = useInView(0.08)
  const trustRef    = useInView(0.06)
  const ctaRef      = useInView(0.1)

  const steps = activeTab === "client" ? CLIENT_STEPS : TALENT_STEPS

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        .font-display{font-family:'Sora',sans-serif}
        .font-serif{font-family:'Instrument Serif',serif}
        .font-mono{font-family:'JetBrains Mono',monospace}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#F97316;border-radius:3px}

        @keyframes fadeUp   {from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeLeft {from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeScale{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
        @keyframes shimTxt  {0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes orb1     {0%,100%{transform:translate(0,0)scale(1)}35%{transform:translate(55px,-55px)scale(1.1)}70%{transform:translate(-30px,28px)scale(.93)}}
        @keyframes orb2     {0%,100%{transform:translate(0,0)}50%{transform:translate(-45px,40px)scale(.91)}}
        @keyframes orb3     {0%,100%{transform:translate(0,0)}55%{transform:translate(28px,48px)scale(1.07)}}
        @keyframes dotDrift {0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes floatY   {0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes borderRot{to{transform:rotate(360deg)}}
        @keyframes dashDraw {from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
        @keyframes waveBar  {0%,100%{transform:scaleY(.28)}50%{transform:scaleY(1)}}
        @keyframes pulse    {0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
        @keyframes zapFlash {0%{opacity:0;transform:scale(.5) rotate(-20deg)}60%{opacity:1;transform:scale(1.15) rotate(5deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
        @keyframes tabSlide {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes marquee  {from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes ping     {0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}

        .reveal   {opacity:0;animation:fadeUp   .75s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .reveal-l {opacity:0;animation:fadeLeft .75s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .reveal-s {opacity:0;animation:fadeScale .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}

        .shimmer{background:linear-gradient(90deg,#F97316 0%,#EA580C 15%,#FB923C 40%,#FCD34D 55%,#FB923C 70%,#EA580C 85%,#F97316 100%);background-size:600px 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimTxt 3s linear infinite}
        .grid-dark{background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:56px 56px}
        .grid-light{background-image:linear-gradient(rgba(249,115,22,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,.05) 1px,transparent 1px);background-size:56px 56px}
        .dot-bg{background-image:radial-gradient(rgba(249,115,22,.14) 1.5px,transparent 1.5px);background-size:26px 26px}
        .noise::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");pointer-events:none;opacity:.7;z-index:0}

        .anim-o1{animation:orb1 14s ease-in-out infinite}
        .anim-o2{animation:orb2 18s ease-in-out infinite}
        .anim-o3{animation:orb3 11s ease-in-out infinite}
        .draw-line{stroke-dasharray:1000;animation:dashDraw 2.2s ease both}

        .tab-content{animation:tabSlide .35s cubic-bezier(.22,1,.36,1) both}
        .mag-btn{transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease}

        .trust-card{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease,border-color .2s}
        .trust-card:hover{transform:translateY(-5px);box-shadow:0 18px 48px rgba(0,0,0,.08)}

        .cat-card{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s ease,border-color .2s}
        .cat-card:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(0,0,0,.07)}

        .sdg-marquee-track{display:flex;gap:10px;animation:marquee 32s linear infinite}
        .sdg-marquee-track:hover{animation-play-state:paused}

        strong{font-weight:700;color:#111827}
      `}</style>

      <div className="font-display bg-white text-gray-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-900 min-h-screen">
        <Navbar />

        {/* ╔══════════════════════════════════════════════════════╗
            §1  HERO
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="relative overflow-hidden bg-[#060912] pt-28 pb-0">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 38%,rgba(249,115,22,.13) 0%,transparent 68%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 50% at 8% 88%,rgba(99,102,241,.09) 0%,transparent 55%)" }} />
          <div className="anim-o1 absolute w-[700px] h-[700px] rounded-full bg-orange-500/8 blur-3xl -top-60 right-0 pointer-events-none" />
          <div className="anim-o2 absolute w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-3xl -left-20 bottom-0 pointer-events-none" />

          {/* SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[[8,18],[92,12],[95,66],[5,72],[50,86],[28,40],[80,46],[62,22],[18,60],[70,75]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r=".5" fill="#F97316" style={{animation:`dotDrift ${4+i}s ease-in-out ${i*.3}s infinite`}}/>
            ))}
            {([[8,18,28,40],[28,40,62,22],[62,22,92,12],[28,40,50,86],[5,72,50,86],[80,46,92,12]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i>3?"#6366F1":i>1?"#10B981":"#F97316"} strokeWidth=".1" className="draw-line" style={{animationDelay:`${i*.25}s`}}/>
            ))}
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-orange-500/6 pointer-events-none" style={{animation:"borderRot 32s linear infinite"}}/>

          <div className="relative z-10 max-w-5xl mx-auto px-6 pb-0" ref={heroRef.ref}>
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".05s"} as React.CSSProperties}>
              <HiSparkles size={12} className="text-orange-400"/>
              <span className="font-mono text-white/50 text-xs tracking-[.15em] uppercase">Platform guide</span>
            </div>

            <h1 className={`font-black text-6xl lg:text-7xl xl:text-[84px] text-white leading-[.92] tracking-tight mb-5 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".15s"} as React.CSSProperties}>
              How<br /><span className="shimmer">changeworker</span><br />works.
            </h1>
            <p className={`font-serif italic text-2xl lg:text-3xl text-white/38 mb-12 max-w-2xl ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".3s"} as React.CSSProperties}>
              Five steps for organizations. Five steps for talent. One platform connecting both sides of Nigeria's impact economy.
            </p>

            {/* quick chips */}
            <div className={`flex flex-wrap gap-3 pb-20 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".42s"} as React.CSSProperties}>
              {[
                {icon:FiZap,text:"Instant matching",color:"#F97316"},
                {icon:FiLock,text:"Escrow protected",color:"#6366F1"},
                {icon:TbCurrencyNaira,text:"10% talent-side fee",color:"#10B981"},
                {icon:FiGlobe,text:"SDG-aligned",color:"#EC4899"},
              ].map(({icon:Icon,text,color})=>(
                <div key={text} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/6 border border-white/10 backdrop-blur-sm">
                  <Icon size={12} style={{color}}/>
                  <span className="text-white/45 text-xs font-display">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{height:"72px"}} className="pointer-events-none">
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §2  OVERVIEW CARDS (3-up)
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {icon:TbBuildingCommunity,color:"#F97316",title:"For organizations",body:"Post a gig, get instantly matched to vetted talent aligned with your SDG focus, fund escrow, and get it done. No bidding wars, no guesswork.",cta:"See client steps →"},
                {icon:RiTeamLine,color:"#6366F1",title:"For talent",body:"Build your impact profile, get auto-matched to relevant gigs the moment they go live, deliver great work, and grow your reputation in the sector.",cta:"See talent steps →"},
                {icon:FiShield,color:"#10B981",title:"For everyone",body:"Escrow, verified profiles, transparent ratings, fair pay standards, and dispute resolution — structural trust baked into every gig.",cta:"See trust features →"},
              ].map(({icon:Icon,color,title,body,cta},i)=>(
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-7 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:`${color}12`}}>
                    <Icon size={22} style={{color}}/>
                  </div>
                  <div>
                    <h3 className="font-display font-black text-gray-900 text-lg mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-display">{body}</p>
                  </div>
                  <span className="font-mono text-xs mt-auto" style={{color}}>{cta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §3  STEPS — tabbed
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={stepsRef.ref} className="py-24 bg-[#FAFAF9] relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 opacity-20 dot-bg pointer-events-none"/>
          <div className="anim-o3 absolute w-80 h-80 rounded-full bg-orange-50 blur-3xl left-0 bottom-0 pointer-events-none"/>

          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            {/* section header */}
            <div className={`text-center mb-12 ${stepsRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Step by step</span>
              <h2 className="font-display font-black text-4xl lg:text-5xl text-gray-900 leading-tight">
                Five steps from<br /><span className="shimmer">idea to impact.</span>
              </h2>
            </div>

            {/* TAB TOGGLE */}
            <div className={`flex justify-center mb-14 ${stepsRef.inView?"reveal":"opacity-0"}`} style={{"--d":".1s"} as React.CSSProperties}>
              <div className="inline-flex bg-white border border-gray-200 rounded-2xl p-1.5 gap-1.5 shadow-sm">
                {(["client","talent"] as TabType[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-display font-bold text-sm transition-all duration-250"
                    style={{
                      background: activeTab === tab ? (tab === "client" ? "#F97316" : "#6366F1") : "transparent",
                      color: activeTab === tab ? "white" : "#6B7280",
                      boxShadow: activeTab === tab ? `0 4px 16px ${tab === "client" ? "rgba(249,115,22,.35)" : "rgba(99,102,241,.35)"}` : "none",
                    }}
                  >
                    {tab === "client" ? <TbBuildingCommunity size={16}/> : <RiTeamLine size={16}/>}
                    {tab === "client" ? "I'm an organization" : "I'm a freelancer"}
                  </button>
                ))}
              </div>
            </div>

            {/* STEPS LAYOUT */}
            <div key={activeTab} className="tab-content grid lg:grid-cols-[1fr_340px] gap-12 items-start">
              {/* left: step list */}
              <div className="flex flex-col">
                {steps.map((step, i) => (
                  <StepCard key={i} step={step} idx={i} inView={stepsRef.inView} side={activeTab} />
                ))}
              </div>

              {/* right: sticky explainer panel */}
              <div className="lg:sticky lg:top-28 flex flex-col gap-5">
                {/* instant match callout */}
                <div className="rounded-2xl overflow-hidden bg-[#060912] p-6 relative">
                  <div className="absolute inset-0" style={{background:`radial-gradient(ellipse 80% 80% at 50% 50%,rgba(249,115,22,.14) 0%,transparent 70%)`}}/>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
                          <FiZap size={16} className="text-orange-400" style={{animation:"zapFlash .6s ease .5s both"}}/>
                        </div>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500" style={{animation:"ping 1.5s cubic-bezier(0,0,.2,1) infinite"}}/>
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500"/>
                      </div>
                      <p className="font-display font-black text-white text-base">Instant matching</p>
                    </div>
                    <p className="text-white/50 text-xs font-display leading-relaxed">
                      The moment a gig is posted, our matching engine runs. No manual review delay. No 48-hour wait. Talent appear in your shortlist <strong className="text-white/80">within seconds</strong> of posting.
                    </p>
                  </div>
                </div>

                {/* fee preview — only show for talent tab */}
                {activeTab === "talent" && <FeeCalculator />}

                {/* what happens after — both tabs */}
                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                  <p className="font-mono text-[10px] text-orange-500 uppercase tracking-[.2em] mb-5">
                    {activeTab === "client" ? "What you never have to worry about" : "What changeworker handles for you"}
                  </p>
                  <div className="space-y-3">
                    {(activeTab === "client" ? [
                      "Vetting talent credentials",
                      "Chasing unpaid invoices",
                      "Dispute resolution",
                      "Contract management",
                      "Payment processing",
                    ] : [
                      "Finding clients yourself",
                      "Cold pitching and proposals",
                      "Getting paid on time",
                      "Contract enforcement",
                      "Dispute mediation",
                    ]).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <FiCheck size={10} className="text-emerald-600"/>
                        </span>
                        <span className="text-gray-600 text-xs font-display">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §4  SDG SECTION — full-width grid + marquee
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={sdgRef.ref} className="py-24 bg-white relative overflow-hidden">
          <div className="anim-o1 absolute w-[500px] h-[500px] rounded-full bg-orange-50 blur-3xl -right-20 top-0 pointer-events-none"/>
          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            {/* header */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <div className={`${sdgRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
                  <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">SDG alignment</span>
                  <h2 className="font-display font-black text-4xl lg:text-5xl text-gray-900 leading-tight mb-5">
                    Every gig tagged<br />to the{" "}
                    <span className="shimmer">Global Goals.</span>
                  </h2>
                  <p className="text-gray-500 text-base leading-relaxed font-display">
                    changeworker is built around the UN Sustainable Development Goals. Every gig posted is tagged to one or more of the 17 SDGs. Talent profiles show which goals they're most experienced working toward. This shared language connects purpose to practice.
                  </p>
                </div>
              </div>
              <div className={`${sdgRef.inView?"reveal-l":"opacity-0"}`} style={{"--d":".15s"} as React.CSSProperties}>
                <div className="rounded-2xl bg-[#060912] p-6 relative overflow-hidden border border-white/5">
                  <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 70% 70% at 50% 50%,rgba(249,115,22,.08) 0%,transparent 70%)"}}/>
                  <p className="font-mono text-[10px] text-white/35 uppercase tracking-wider mb-4 relative z-10">How it works</p>
                  <div className="space-y-2.5 relative z-10">
                    {[
                      {step:"Organization posts a gig",note:"tags Climate Action + Decent Work",icons:["🌍","💼"]},
                      {step:"System matches talent",note:"who have worked on SDG 13 + 8",icons:["⚡","✓"]},
                      {step:"Gig completed",note:"both parties contribute to global goals",icons:["🎯","🌱"]},
                    ].map(({step,note,icons},i)=>(
                      <div key={i} className="flex items-start gap-3 bg-white/4 rounded-xl px-3.5 py-3">
                        <span className="font-mono text-[10px] text-orange-400 font-bold shrink-0 mt-0.5">0{i+1}</span>
                        <div>
                          <p className="text-white/80 text-xs font-display font-semibold">{step}</p>
                          <p className="text-white/35 text-[10px] font-mono mt-0.5">{note}</p>
                        </div>
                        <div className="ml-auto flex gap-1 shrink-0">{icons.map((ic,j)=><span key={j} className="text-base">{ic}</span>)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SDG GRID */}
            <div className={`${sdgRef.inView?"reveal":"opacity-0"}`} style={{"--d":".2s"} as React.CSSProperties}>
              <p className="font-mono text-[10px] text-gray-400 uppercase tracking-[.22em] mb-5">All 17 SDGs — hover to explore</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {SDGS.map((label, i) => (
                <SDGPill key={i} label={label} color={SDG_COLORS[i]} idx={i} inView={sdgRef.inView} />
              ))}
            </div>

            {/* SDG COLOR STRIP marquee */}
            <div className="mt-10 overflow-hidden rounded-2xl" style={{height:"10px"}}>
              <div className="sdg-marquee-track h-full" style={{width:"200%"}}>
                {[...SDG_COLORS,...SDG_COLORS].map((c,i)=>(
                  <div key={i} className="h-full flex-1 min-w-[40px] rounded-sm" style={{background:c}}/>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §5  CATEGORIES
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={catsRef.ref} className="py-24 bg-[#FAFAF9] relative overflow-hidden">
          <div className="anim-o2 absolute w-72 h-72 rounded-full bg-orange-50 blur-3xl right-0 bottom-0 pointer-events-none"/>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-14 ${catsRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Talent categories</span>
              <h2 className="font-display font-black text-4xl lg:text-5xl text-gray-900 leading-tight">
                Every discipline the<br /><span className="shimmer">sector needs.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {HIRE_CATEGORIES.map((cat, i) => (
                <div
                  key={i}
                  className={`cat-card rounded-2xl border border-gray-100 bg-white overflow-hidden ${catsRef.inView?"reveal":"opacity-0"}`}
                  style={{"--d":`${.06+i*.07}s`} as React.CSSProperties}
                >
                  <div className="h-1" style={{background:`linear-gradient(90deg,${cat.color},${cat.color}00)`}}/>
                  <div className="p-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{background:`${cat.color}15`}}>
                      <FiLayers size={16} style={{color:cat.color}}/>
                    </div>
                    <h3 className="font-display font-black text-gray-900 text-sm mb-3 leading-tight">{cat.title}</h3>
                    <ul className="space-y-1.5">
                      {cat.items.map((item,j)=>(
                        <li key={j} className="flex items-center gap-2 text-gray-500 text-xs font-display">
                          <span className="w-1 h-1 rounded-full shrink-0" style={{background:cat.color}}/>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §6  FEES — transparent breakdown
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={feesRef.ref} className="py-24 bg-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-72 h-72 opacity-20 dot-bg pointer-events-none"/>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <div className={`${feesRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
                  <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Transparent pricing</span>
                  <h2 className="font-display font-black text-4xl lg:text-5xl text-gray-900 leading-tight mb-6">
                    Simple, honest<br /><span className="shimmer">fees.</span>
                  </h2>
                </div>
                <div className={`space-y-6 ${feesRef.inView?"reveal":"opacity-0"}`} style={{"--d":".14s"} as React.CSSProperties}>
                  <div className="flex gap-4 p-5 rounded-2xl bg-orange-50 border border-orange-100">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <TbCurrencyNaira size={20} className="text-orange-600"/>
                    </div>
                    <div>
                      <p className="font-display font-black text-gray-900 text-base mb-1">10% platform fee — from the talent's payout</p>
                      <p className="text-gray-600 text-sm font-display leading-relaxed">Our fee is deducted from the talent's earnings. Organizations pay exactly the agreed gig rate — no markups, no hidden charges, no platform surcharge on your invoice.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <FiCheckCircle size={18} className="text-emerald-600"/>
                    </div>
                    <div>
                      <p className="font-display font-black text-gray-900 text-base mb-1">No subscription. No listing fee.</p>
                      <p className="text-gray-600 text-sm font-display leading-relaxed">Registration is free for everyone. We only earn when a gig is successfully completed. Our incentive is aligned with yours — your success is our success.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <FiShield size={18} className="text-indigo-600"/>
                    </div>
                    <div>
                      <p className="font-display font-black text-gray-900 text-base mb-1">The fee covers escrow, matching & support</p>
                      <p className="text-gray-600 text-sm font-display leading-relaxed">The 10% covers: instant talent matching, identity & skills vetting, payment processing, escrow management, dispute resolution, and platform support for both parties.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${feesRef.inView?"reveal-l":"opacity-0"}`} style={{"--d":".18s"} as React.CSSProperties}>
                <FeeCalculator />
              </div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §7  TRUST FEATURES
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={trustRef.ref} className="py-24 bg-[#060912] relative overflow-hidden noise">
          <div className="absolute inset-0 grid-dark"/>
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(249,115,22,.09) 0%,transparent 68%)"}}/>
          <div className="anim-o1 absolute w-[600px] h-[600px] rounded-full bg-orange-500/7 blur-3xl -top-40 right-0 pointer-events-none"/>

          {/* wave bars */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-end gap-0.5 h-20 opacity-15">
            {[40,65,85,55,90,70,45,80,60,75,50,88].map((h,i)=>(
              <div key={i} className="w-1 rounded-full bg-orange-400" style={{height:`${h}%`,animation:`waveBar ${1.2+i*.15}s ease-in-out ${i*.1}s infinite`}}/>
            ))}
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-14 ${trustRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-400 uppercase tracking-[.25em] mb-4 block">Built-in trust</span>
              <h2 className="font-display font-black text-4xl lg:text-5xl text-white leading-tight">
                Safety isn't a feature.<br /><span className="shimmer">It's the foundation.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TRUST_FEATURES.map((f,i)=>{
                const Icon = f.icon
                return (
                  <div
                    key={i}
                    className={`trust-card rounded-2xl border p-7 flex flex-col gap-4 ${trustRef.inView?"reveal":"opacity-0"}`}
                    style={{
                      "--d":`${.06+i*.07}s`,
                      borderColor:"rgba(255,255,255,.06)",
                      background:"rgba(255,255,255,.03)",
                    } as React.CSSProperties}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:`${f.color}20`}}>
                      <Icon size={22} style={{color:f.color}}/>
                    </div>
                    <div>
                      <h3 className="font-display font-black text-white text-base mb-2">{f.title}</h3>
                      <p className="text-white/45 text-sm font-display leading-relaxed">{f.desc}</p>
                    </div>
                    <div className="mt-auto h-0.5 rounded-full" style={{background:`${f.color}40`}}/>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §8  COMPARISON — changeworker vs generic platforms
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute left-0 bottom-0 w-72 h-72 opacity-15 dot-bg pointer-events-none"/>
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-12">
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Why changeworker</span>
              <h2 className="font-display font-black text-4xl text-gray-900 leading-tight">
                Not just another<br /><span className="shimmer">freelance platform.</span>
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
                <div className="px-5 py-4"/>
                <div className="px-5 py-4 border-x border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
                      <span className="text-white font-black text-xs">c</span>
                    </div>
                    <span className="font-display font-black text-sm text-gray-900">changeworker</span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <span className="font-mono text-xs text-gray-400">Generic platforms</span>
                </div>
              </div>
              {[
                ["Impact sector focus","SDG-aligned, sector-specific","Generic — any industry"],
                ["Talent vetting","Personal vetting + verification","Self-declared, unverified"],
                ["Matching speed","Instant on gig post","Browse & bid (days/weeks)"],
                ["Fee structure","10% from talent payout","5–20% from both sides"],
                ["Payment protection","Escrow on every gig","Optional / inconsistent"],
                ["Dispute resolution","In-house mediation team","Automated, impersonal"],
                ["Nigeria-native","₦ pricing, local context","USD-first, foreign UX"],
              ].map(([feature, ours, theirs], i) => (
                <div key={i} className={`grid grid-cols-3 border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
                  <div className="px-5 py-3.5">
                    <span className="text-gray-700 text-xs font-display font-medium">{feature}</span>
                  </div>
                  <div className="px-5 py-3.5 border-x border-gray-100">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle size={12} className="text-emerald-500 shrink-0"/>
                      <span className="text-gray-800 text-xs font-display font-semibold">{ours}</span>
                    </div>
                  </div>
                  <div className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FiChevronRight size={12} className="text-gray-300 shrink-0"/>
                      <span className="text-gray-400 text-xs font-display">{theirs}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §9  CTA
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={ctaRef.ref} className="relative overflow-hidden bg-[#060912] py-32 noise">
          <div className="absolute inset-0 grid-dark"/>
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 75% 65% at 50% 50%,rgba(249,115,22,.13) 0%,transparent 65%)"}}/>
          <div className="anim-o1 absolute w-[900px] h-[900px] rounded-full bg-orange-500/7 blur-3xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-orange-500/8 pointer-events-none" style={{animation:"borderRot 28s linear infinite"}}/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/3 pointer-events-none" style={{animation:"borderRot 46s linear infinite reverse"}}/>

          {/* floating SDG chips */}
          {[
            {label:"Climate Action",color:"#3F7E44",x:"6%",y:"22%",delay:"0s"},
            {label:"Decent Work",color:"#A21942",x:"87%",y:"18%",delay:"1.2s"},
            {label:"Quality Education",color:"#C5192D",x:"4%",y:"72%",delay:"0.8s"},
            {label:"Gender Equality",color:"#FF3A21",x:"84%",y:"70%",delay:"2s"},
          ].map(({label,color,x,y,delay},i)=>(
            <div key={i} className="absolute hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8"
              style={{left:x,top:y,animation:`floatY ${5+i}s ease-in-out ${delay} infinite`}}>
              <span className="w-2 h-2 rounded-sm" style={{background:color}}/>
              <span className="font-mono text-[10px] text-white/40">{label}</span>
            </div>
          ))}

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <div className={`${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-400 uppercase tracking-[.3em] mb-6 block">Ready?</span>
            </div>
            <h2 className={`font-display font-black text-5xl lg:text-6xl text-white leading-[.93] mb-4 ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".1s"} as React.CSSProperties}>
              Post your first gig.<br /><span className="shimmer">Match in seconds.</span>
            </h2>
            <p className={`font-serif italic text-3xl text-white/35 mb-12 ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".24s"} as React.CSSProperties}>
              Flexible talents. Meaningful work.
            </p>

            <div className={`flex flex-wrap gap-4 justify-center mb-10 ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".36s"} as React.CSSProperties}>
              <a
                ref={mag1.ref}
                onMouseMove={mag1.hm}
                onMouseLeave={mag1.hl}
                href="/signup?type=org"
                className="mag-btn inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-display font-black text-base rounded-2xl group relative overflow-hidden"
                style={{padding:"1.1rem 2.5rem",boxShadow:"0 0 60px rgba(249,115,22,.35)"}}
              >
                <TbBuildingCommunity size={18}/>
                Post a gig
                <FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform"/>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"/>
              </a>
              <a
                ref={mag2.ref}
                onMouseMove={mag2.hm}
                onMouseLeave={mag2.hl}
                href="/signup?type=talent"
                className="mag-btn inline-flex items-center gap-2.5 border border-white/15 hover:border-orange-400/50 text-white/65 hover:text-white font-display font-black text-base rounded-2xl"
                style={{padding:"1.1rem 2.5rem"}}
              >
                <RiTeamLine size={17}/>
                Find work
              </a>
            </div>

            <div className={`flex flex-wrap justify-center gap-3 ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".48s"} as React.CSSProperties}>
              {[
                {icon:FiCheckCircle,text:"Free to register"},
                {icon:FiZap,text:"Matched instantly"},
                {icon:FiLock,text:"Escrow on every gig"},
                {icon:FiGlobe,text:"SDG-aligned"},
              ].map(({icon:Icon,text})=>(
                <div key={text} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/8">
                  <Icon size={11} className="text-orange-400"/>
                  <span className="font-display text-xs text-white/45">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />

      </div>
    </>
  )
}
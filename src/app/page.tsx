"use client"

import { lazy, Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
const TestCarousel = lazy(() => import("@/components/TestCarousel"))
import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { fetchPlatformStats } from "@/lib/platformStats"
import {
  FiBriefcase, FiUsers, FiShield, FiZap, FiRepeat, FiGlobe,
  FiArrowRight, FiCheck, FiStar, FiChevronDown, FiMail,
  FiMapPin, FiClock, FiDollarSign, FiTrendingUp, FiAward,
  FiCheckCircle, FiSearch, FiHeart, FiMessageSquare,
  FiBookmark, FiChevronLeft, FiChevronRight, FiTarget,
  FiActivity, FiBell, FiEye, FiLayers, FiEdit3,
  FiBarChart2, FiFileText, FiSend, FiFilter, FiPercent
} from "react-icons/fi"
import { HiSparkles, HiLightningBolt, HiGlobeAlt, HiCurrencyDollar } from "react-icons/hi"
import { MdOutlineHandshake, MdWorkspacePremium } from "react-icons/md"
import { RiLeafLine, RiTeamLine } from "react-icons/ri"
import { TbRocket, TbTargetArrow, TbBuildingCommunity } from "react-icons/tb"

/* ═══ HOOKS ═══════════════════════════════════════════════════ */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let t0: number | null = null
    const tick = (ts: number) => {
      if (!t0) t0 = ts
      const p = Math.min((ts - t0) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 4)) * target))
      if (p < 1) requestAnimationFrame(tick)
      else setCount(target)
    }
    requestAnimationFrame(tick)
  }, [target, duration, start])
  return count
}

function useMagnet(strength = 28) {
  const ref = useRef<HTMLButtonElement>(null)
  const hm = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) / r.width * strength
    const y = (e.clientY - r.top - r.height / 2) / r.height * strength
    ref.current.style.transform = `translate(${x}px,${y}px)`
  }, [strength])
  const hl = useCallback(() => { if (ref.current) ref.current.style.transform = "translate(0,0)" }, [])
  return { ref, hm, hl }
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

/* ═══ DATA ════════════════════════════════════════════════════ */
const SKILLS_DATA = [
  { label: "Grant Writing",     color: "#F97316", count: 42 },
  { label: "M&E",               color: "#6366F1", count: 38 },
  { label: "Project Management",color: "#10B981", count: 61 },
  { label: "Fundraising",       color: "#EC4899", count: 27 },
  { label: "Communications",    color: "#F59E0B", count: 33 },
  { label: "Research",          color: "#3B82F6", count: 29 },
  { label: "Data Analysis",     color: "#8B5CF6", count: 24 },
  { label: "Capacity Building", color: "#14B8A6", count: 19 },
  { label: "Strategic Planning",color: "#EF4444", count: 16 },
  { label: "Proposal Writing",  color: "#F97316", count: 35 },
  { label: "MEAL",              color: "#6366F1", count: 22 },
  { label: "CRM",               color: "#10B981", count: 18 },
]

const FEATURES = [
  { icon: FiZap,          color: "#F97316", bg: "rgba(249,115,22,.08)",  title: "Smart matching",       body: "Post a gig, browse strong-fit talent, and let the platform surface relevant profiles by skills, SDG alignment, and work preferences." },
  { icon: FiShield,       color: "#6366F1", bg: "rgba(99,102,241,.08)",  title: "Verified identity flow", body: "Talent and clients can complete profile and verification steps inside the platform before moving into deeper work flows." },
  { icon: HiCurrencyDollar,color:"#10B981", bg: "rgba(16,185,129,.08)", title: "Budget-first design",  body: "Projects from N50k to N400k+. Transparent pricing, payment support, and a flat 10% platform fee with no hidden charges." },
  { icon: FiRepeat,       color: "#EC4899", bg: "rgba(236,72,153,.08)",  title: "Save talent for later", body: "Shortlist strong profiles, save talent you want to revisit, and build repeat working relationships without starting from scratch." },
  { icon: TbTargetArrow,  color: "#F59E0B", bg: "rgba(245,158,11,.08)",  title: "Escrow protection",    body: "Funds held until deliverables are approved. Both sides protected, both sides confident - trust built into every transaction." },
  { icon: HiGlobeAlt,     color: "#3B82F6", bg: "rgba(59,130,246,.08)",  title: "Built for Nigeria",    body: "Paystack integration, Naira-native pricing, and a community rooted in local NGO culture. Not a foreign product retrofitted for Africa." },
  { icon: FiFilter,       color: "#8B5CF6", bg: "rgba(139,92,246,.08)",  title: "Curated discovery",   body: "Use filters, public profiles, proposals, and messaging to narrow quickly to the right fit instead of sorting through generic marketplaces." },
  { icon: FiAward,        color: "#14B8A6", bg: "rgba(20,184,166,.08)",  title: "Structured delivery",  body: "Workspaces support milestones, final submissions, reviews, and dispute flows so delivery stays documented from start to finish." },
  { icon: RiTeamLine,     color: "#EF4444", bg: "rgba(239,68,68,.08)",   title: "Impact community",     body: "Access a growing network of professionals who chose purpose-driven careers. Referrals, collaborations, and peer learning built in." },
]

const PROFILES = [
  { name: "Adaeze N.",  title: "Grant Writing Specialist", location: "Lagos",          skills: ["Grant Writing","Proposals","Fundraising"],     rate: "₦80k/project",  rating: 4.9, reviews: 23, color: "#F97316", available: true  },
  { name: "Emeka T.",   title: "M&E Specialist",           location: "Abuja",          skills: ["M&E","MEAL","Data Analysis"],                   rate: "₦120k/project", rating: 5.0, reviews: 18, color: "#6366F1", available: true  },
  { name: "Kemi A.",    title: "Communications Lead",      location: "Port Harcourt",  skills: ["Communications","Content","Strategy"],          rate: "₦70k/project",  rating: 4.8, reviews: 31, color: "#10B981", available: false },
  { name: "Tunde B.",   title: "Project Manager",          location: "Ibadan",         skills: ["Project Mgmt","PMO","Capacity Building"],       rate: "₦150k/project", rating: 4.9, reviews: 15, color: "#EC4899", available: true  },
]

// const ACTIVITY = [
//   { action: "hired",     who: "Chioma O.",          hired: "Adaeze N.",  role: "Grant Writer",     time: "2m ago",  color: "#10B981" },
//   { action: "matched",   who: "GreenAfrica NGO",    hired: "Emeka T.",   role: "M&E Specialist",   time: "8m ago",  color: "#F97316" },
//   { action: "completed", who: "STEM4Girls NG",      hired: "Kemi A.",    role: "Comms Lead",       time: "15m ago", color: "#6366F1" },
//   { action: "hired",     who: "HealthFirst",        hired: "Tunde B.",   role: "Project Manager",  time: "32m ago", color: "#EC4899" },
//   { action: "matched",   who: "LagosArts",          hired: "Seun A.",    role: "Researcher",       time: "1h ago",  color: "#F59E0B" },
//   { action: "completed", who: "EduBridge Org",      hired: "Funmi A.",   role: "Fundraiser",       time: "2h ago",  color: "#14B8A6" },
// ]

const FAQS = [
  { q: "How are freelancers vetted?",           a: "Talent profiles are built inside the platform, matched against gig requirements, and can complete identity verification and public-profile setup before working with clients." },
  { q: "What does the 10% commission cover?",   a: "The fee supports platform operations including matching, payments, workspace delivery flows, reviews, disputes, and ongoing product support." },
  { q: "How quickly will I get matched?",       a: "Matching starts as soon as a gig is posted. Clients can browse surfaced talent, receive proposals, and move into messaging and workspace setup inside the app." },
  { q: "What if I'm not satisfied?",            a: "Workspaces support milestone review, final approval, and dispute creation so both sides have a documented process if work needs clarification or resolution." },
  { q: "Can I hire the same freelancer again?", a: "Yes. You can save talent profiles and return to them later when you want to start a new conversation or project." },
  { q: "What skills are available?",            a: "Currently: Grant Writing, M&E/MEAL, Project Management, Communications, Fundraising, Research, Data Analysis, Capacity Building, Strategic Planning, and Proposal Writing." },
]

const TESTIMONIALS = [
  { q: "I needed a grant writer for 2 months but couldn't afford ₦400k/month. changeworker matched me with someone excellent who understood our constraints perfectly.", name: "Chioma O.",  role: "Executive Director",  org: "Youth NGO, Lagos",              color: "#F97316", stars: 5 },
  { q: "Tired of working for free 'for a good cause.' changeworker pays fairly and the orgs are genuinely mission-driven. Best decision for my freelance career.",         name: "Seun A.",   role: "M&E Specialist",      org: "Ibadan",                         color: "#6366F1", stars: 5 },
  { q: "Used it once, recommended it to three colleagues the next week. The matching is scary accurate - they just understand nonprofit work in a way no other platform does.", name: "Funmi A.",  role: "Program Manager",     org: "Environmental NGO, Abuja",       color: "#10B981", stars: 5 },
  { q: "Our proposal success rate jumped 40% after bringing in a changeworker grant writer. The ROI is undeniable even on a tight nonprofit budget.",                        name: "Kemi B.",   role: "Founder",             org: "HealthFirst Initiative",         color: "#EC4899", stars: 5 },
  { q: "Finally a platform that doesn't make you compete with 200 people. The curated matching is a complete game changer for finding quality impact work.",                 name: "Tunde M.", role: "Project Manager",      org: "Lagos",                          color: "#F59E0B", stars: 5 },
]

const WORDS = ["Flexible","Reliable","Impactful","Affordable","Nigerian"]

/* ═══ PRELOADER ══════════════════════════════════════════════ */
function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState<"counting" | "reveal" | "exit">("counting")

  useEffect(() => {
    let cur = 0
    const speeds = [15, 35, 10, 55]
    const caps = [40, 70, 90, 100]

    const tick = () => {
      cur = Math.min(cur + 1, 100)
      setPct(cur)

      const seg = caps.findIndex((c) => cur <= c)
      if (cur < 100) {
        setTimeout(tick, speeds[seg] || 15)
      } else {
        setPhase("reveal")
        setTimeout(() => {
          setPhase("exit")
          setTimeout(onDone, 750)
        }, 900)
      }
    }

    setTimeout(tick, 300)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#060912] overflow-hidden"
      style={{
        transition:
          phase === "exit"
            ? "opacity .75s ease, transform .75s cubic-bezier(.76,0,.24,1)"
            : "none",
        opacity: phase === "exit" ? 0 : 1,
        transform: phase === "exit" ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <div
        className="absolute w-[700px] h-[700px] rounded-full bg-orange-500/8 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: "pulse 3s ease-in-out infinite" }}
      />

      <div
        className="mb-12 flex flex-col items-center gap-5"
        style={{
          transition:
            phase === "reveal"
              ? "transform .6s cubic-bezier(.34,1.56,.64,1)"
              : "none",
          transform: phase === "reveal" ? "scale(1.08)" : "scale(1)",
        }}
      >
        <div className="relative w-28 h-28 flex items-center justify-center">
  <svg
    viewBox="0 0 178 152"
    className="w-full h-full"
    style={{ filter: "drop-shadow(0 0 20px rgba(249,115,22,.28))" }}
  >
    <defs>
      <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F8DF69" />
        <stop offset="100%" stopColor="#EFD45C" />
      </linearGradient>

      <linearGradient id="dotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F39A42" />
        <stop offset="100%" stopColor="#EC8A2F" />
      </linearGradient>

      <clipPath id="leftReveal">
        <rect x="0" y="0" width={(89 * Math.min(pct, 55)) / 55} height="152" />
      </clipPath>

      <clipPath id="rightReveal">
        <rect
          x={178 - (89 * Math.max(0, Math.min(pct - 18, 55))) / 55}
          y="0"
          width={(89 * Math.max(0, Math.min(pct - 18, 55))) / 55}
          height="152"
        />
      </clipPath>
    </defs>

    <g clipPath="url(#leftReveal)">
      <path
        d="
          M 10 48
          C 22 48, 34 48, 44 53
          C 55 58, 63 69, 72 83
          C 79 95, 84 95, 88 92
          C 90 90, 92 89, 95 92
          L 83 104
          C 77 112, 71 119, 63 121
          C 53 123, 44 118, 36 109
          C 29 100, 24 89, 19 79
          C 14 69, 9 58, 4 51
          Z
        "
        fill="url(#wingGrad)"
      />
    </g>

    <g clipPath="url(#rightReveal)">
      <path
        d="
          M 168 48
          C 156 48, 144 48, 134 53
          C 123 58, 115 69, 106 83
          C 99 95, 94 95, 90 92
          C 88 90, 86 89, 83 92
          L 95 104
          C 101 112, 107 119, 115 121
          C 125 123, 134 118, 142 109
          C 149 100, 154 89, 159 79
          C 164 69, 169 58, 174 51
          Z
        "
        fill="url(#wingGrad)"
      />
    </g>

    {pct > 48 && (
      <circle
        cx="89"
        cy="82"
        r="14"
        fill="url(#dotGrad)"
        style={{
          animation: "fadeInScale .35s cubic-bezier(.34,1.56,.64,1) both",
        }}
      />
    )}
  </svg>
</div>

        <p className="font-display font-black text-4xl text-white tracking-tight">
          changeworker
        </p>
        <p className="font-display font-light text-white/30 text-xs tracking-[.25em] uppercase">
          Flexible talents. Meaningful work.
        </p>
      </div>

      <div className="w-80">
        <div className="h-px bg-white/8 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${pct}%`, boxShadow: "0 0 14px rgba(249,115,22,.9)" }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-mono text-white/20 text-[11px]">Initializing platform</span>
          <span className="font-mono text-orange-400 text-[11px] font-bold">{pct}%</span>
        </div>
      </div>
    </div>
  )
}

/* ═══ CURSOR ══════════════════════════════════════════════════ */
function CursorGlow() {
  const dot = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let tx=0,ty=0,cx=0,cy=0
    const h=(e:MouseEvent)=>{tx=e.clientX;ty=e.clientY}
    window.addEventListener("mousemove",h)
    const a=()=>{
      cx+=(tx-cx)*.09;cy+=(ty-cy)*.09
      if(dot.current){dot.current.style.left=tx+"px";dot.current.style.top=ty+"px"}
      if(glow.current){glow.current.style.left=cx+"px";glow.current.style.top=cy+"px"}
      requestAnimationFrame(a)
    }
    requestAnimationFrame(a)
    return()=>window.removeEventListener("mousemove",h)
  },[])
  return <>
    <div ref={dot}  className="fixed pointer-events-none z-[9998] w-4 h-4 rounded-full bg-orange-400/70 mix-blend-screen" style={{transform:"translate(-50%,-50%)"}}/>
    <div ref={glow} className="fixed pointer-events-none z-[9997] w-56 h-56 rounded-full" style={{transform:"translate(-50%,-50%)",background:"radial-gradient(circle,rgba(249,115,22,.07) 0%,transparent 70%)"}}/>
  </>
}

/* ═══ ACTIVITY FEED ══════════════════════════════════════════ */
// function ActivityFeed() {
//   const [items, setItems] = useState<number[]>([])
//   const [gen, setGen] = useState(0)
//   useEffect(() => {
//     const show = () => { setItems(v=>[...v.slice(-3), gen % ACTIVITY.length]); setGen(g=>g+1) }
//     show()
//     const t = setInterval(show, 3400)
//     return () => clearInterval(t)
//   }, [])
//   return (
//     <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none">
//       {items.map((idx, i) => {
//         const a = ACTIVITY[idx]
//         return (
//           <div key={`${idx}-${i}-${gen}`}
//             className="flex items-center gap-3 bg-[#0A0D14]/95 backdrop-blur-xl border border-white/8 rounded-xl px-4 py-3 max-w-xs"
//             style={{
//               animation:"toastIn .5s cubic-bezier(.34,1.56,.64,1) both",
//               opacity: i===items.length-1?1:i===items.length-2?.65:.35,
//               transform:`scale(${i===items.length-1?1:i===items.length-2?.96:.92})`,
//               transformOrigin:"bottom left",
//               boxShadow:"0 8px 32px rgba(0,0,0,.5)",
//             }}>
//             <span className="w-2 h-2 rounded-full shrink-0 flex-none" style={{background:a.color,boxShadow:`0 0 6px ${a.color}`}}/>
//             <span className="text-white/55 text-xs font-display leading-tight">
//               <span className="text-white font-semibold">{a.who}</span>
//               {a.action==="hired"?" hired ":" matched with "}
//               <span className="font-semibold" style={{color:a.color}}>{a.hired}</span>
//               <span className="text-white/25"> · {a.time}</span>
//             </span>
//           </div>
//         )
//       })}
//     </div>
//   )
// }

/* ═══ FLIP CARD ══════════════════════════════════════════════ */
function FlipCard({ feat, idx, inView }: { feat: typeof FEATURES[0]; idx: number; inView: boolean }) {
  const [flipped, setFlipped] = useState(false)
  const Icon = feat.icon
  return (
    <div
      className={`relative h-56 cursor-pointer ${inView?"reveal":"opacity-0"}`}
      style={{"--d":`${.04+idx*.07}s`,perspective:"1000px"} as React.CSSProperties}
      onMouseEnter={()=>setFlipped(true)} onMouseLeave={()=>setFlipped(false)}>
      <div className="relative w-full h-full"
        style={{transformStyle:"preserve-3d",transition:"transform .65s cubic-bezier(.34,1.56,.64,1)",transform:flipped?"rotateY(180deg)":"rotateY(0deg)"}}>
        {/* FRONT */}
        <div className="absolute inset-0 rounded-2xl border border-gray-100 bg-white flex flex-col items-center justify-center gap-4 shadow-sm"
          style={{backfaceVisibility:"hidden"}}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:feat.bg}}>
            <span style={{color:feat.color}}><Icon size={26}/></span>
          </div>
          <h3 className="font-display font-bold text-gray-900 text-sm text-center px-4 leading-tight">{feat.title}</h3>
          <span className="text-gray-300 text-xs flex items-center gap-1 font-display">hover to reveal <FiArrowRight size={9}/></span>
        </div>
        {/* BACK */}
        <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3 p-7 text-center"
          style={{backfaceVisibility:"hidden",transform:"rotateY(180deg)",background:`linear-gradient(135deg,${feat.color}18,${feat.color}06)`,border:`1.5px solid ${feat.color}35`}}>
          <span style={{color:feat.color}}><Icon size={22}/></span>
          <h3 className="font-display font-bold text-gray-900 text-sm">{feat.title}</h3>
          <p className="text-gray-600 text-xs leading-relaxed font-display font-normal">{feat.body}</p>
        </div>
      </div>
    </div>
  )
}

/* ═══ SPOTLIGHT CARD ═════════════════════════════════════════ */
function SpotCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [s, setS] = useState({x:0,y:0,o:0})
  const h = useCallback((e:React.MouseEvent) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setS({x:e.clientX-r.left,y:e.clientY-r.top,o:1})
  },[])
  return (
    <div ref={ref} onMouseMove={h} onMouseLeave={()=>setS(p=>({...p,o:0}))} className={`relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{opacity:s.o,background:`radial-gradient(260px circle at ${s.x}px ${s.y}px,rgba(249,115,22,.09),transparent 80%)`}}/>
      {children}
    </div>
  )
}

/* ═══ PROFILE CARD ═══════════════════════════════════════════ */
function ProfileCard({ p, idx, inView }: { p: any; idx: number; inView: boolean }) {
  const [saved, setSaved] = useState(false)
  
  // Handle both placeholder and real data
  const isRealData = p.id !== undefined
  const name = isRealData ? (p.fullName || p.displayName || p.name || 'Anonymous') : p.name
  const title = isRealData ? (p.talent?.roleTitle || p.title || p.headline || 'Freelancer') : p.title
  const location = isRealData ? (p.location || 'Nigeria') : p.location
  const skills = isRealData ? (p.talent?.skills || p.skills || []) : p.skills
  const rate = isRealData
    ? (p.publicProfile?.hourlyRate ? `₦${p.publicProfile.hourlyRate.toLocaleString()}/hr` : 'Rate not set')
    : p.rate
  const rating = isRealData ? (p.rating || 0) : p.rating
  const reviews = isRealData ? (p.reviewCount || 0) : p.reviews
  const color = isRealData ? '#F97316' : p.color // Default orange for real profiles
  const available = isRealData ? (p.available !== false) : p.available
  const photoUrl = isRealData ? p.publicProfile?.photoURL : null
  
  return (
    <SpotCard className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-sm card-lift ${inView?"reveal":"opacity-0"}`}>
      <div style={{"--d":`${.08+idx*.1}s`} as React.CSSProperties}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="relative w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg font-display"
                style={{background:`linear-gradient(135deg,${color},${color}88)`}}>
                {name[0]?.toUpperCase() || 'U'}
                {available&&<span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white"/>}
              </div>
            )}
            <div>
              <p className="font-display font-bold text-gray-900 text-sm">{name}</p>
              <p className="text-gray-400 text-xs">{title}</p>
            </div>
          </div>
          <button onClick={()=>setSaved(s=>!s)}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-100 hover:border-orange-300 transition-colors">
            <span style={saved?{color:"#F97316"}:{color:"#D1D5DB"}}><FiBookmark size={13}/></span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <FiMapPin size={10}/><span>{location}</span>
          {rating > 0 && (
            <>
              <span className="mx-1">·</span>
              <span className="text-amber-400"><FiStar size={10}/></span>
              <span className="font-semibold text-gray-700">{rating.toFixed(1)}</span>
              <span>({reviews})</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {skills.slice(0, 3).map((s: string, i: number)=>(
            <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-500">{s}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-sm" style={{color}}>{rate}</span>
          <Link href={`/talent/${p.slug || p.id}`} className="flex items-center gap-1.5 text-xs font-display font-bold text-white px-4 py-2 rounded-lg transition-all duration-200 no-underline"
            style={{background:color,boxShadow:`0 4px 14px ${color}44`}}>
            View Profile <FiArrowRight size={11}/>
          </Link>
        </div>
      </div>
    </SpotCard>
  )
}

/* ═══ FAQ ITEM ════════════════════════════════════════════════ */
function FaqItem({ faq, idx, inView }: { faq: typeof FAQS[0]; idx: number; inView: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border border-gray-100 rounded-2xl overflow-hidden bg-white ${inView?"reveal":"opacity-0"}`}
      style={{"--d":`${.04+idx*.07}s`} as React.CSSProperties}>
      <button className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50/60 transition-colors group"
        onClick={()=>setOpen(o=>!o)}>
        <span className="font-display font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
        <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-400 ${open?"bg-orange-500 border-orange-500":"border-gray-200 group-hover:border-orange-300"}`}
          style={{transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform .35s ease, background .2s, border-color .2s"}}>
          <span style={{color:open?"white":"#9CA3AF"}}><FiChevronDown size={13}/></span>
        </span>
      </button>
      <div style={{maxHeight:open?"200px":"0",transition:"max-height .42s cubic-bezier(.4,0,.2,1)",overflow:"hidden"}}>
        <p className="px-6 pb-5 text-gray-500 text-sm leading-relaxed font-display font-normal">{faq.a}</p>
      </div>
    </div>
  )
}

/* ═══ WORD CYCLE ══════════════════════════════════════════════ */
function WordCycle() {
  const [idx, setIdx] = useState(0)
  const [anim, setAnim] = useState(false)
  useEffect(()=>{
    const t = setInterval(()=>{
      setAnim(true)
      setTimeout(()=>{setIdx(i=>(i+1)%WORDS.length);setAnim(false)},280)
    },2400)
    return ()=>clearInterval(t)
  },[])
  return (
    <span className="shimmer inline-block"
      style={{
        transition:"opacity .28s ease,transform .28s cubic-bezier(.34,1.56,.64,1)",
        opacity:anim?0:1,
        transform:anim?"translateY(-16px) scale(.88)":"translateY(0) scale(1)",
      }}>{WORDS[idx]}</span>
  )
}

/* ═══ STAT BOX ════════════════════════════════════════════════ */
function StatBox({ val, suf, label, icon: Icon, color, delay, start }: {
  val:number; suf:string; label:string; icon:React.ElementType; color:string; delay:string; start:boolean
}) {
  const n = useCounter(val, 2000, start)
  return (
    <div className="reveal flex flex-col items-center gap-3" style={{"--d":delay} as React.CSSProperties}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:`${color}15`}}>
        <Icon size={22} style={{color}}/>
      </div>
      <span className="font-display font-black text-4xl text-gray-900">{n}<span style={{color}}>{suf}</span></span>
      <span className="text-gray-400 text-xs uppercase tracking-widest font-mono text-center">{label}</span>
    </div>
  )
}

/* ═══ MAGNET BUTTON ══════════════════════════════════════════ */
function MagBtn({ children, className, style: s }: { children:React.ReactNode; className?:string; style?:React.CSSProperties }) {
  const { ref, hm, hl } = useMagnet(26)
  return (
    <button ref={ref} onMouseMove={hm} onMouseLeave={hl} className={className}
      style={{transition:"transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease",...s}}>
      {children}
    </button>
  )
}

/* ═══ ORB ═════════════════════════════════════════════════════ */
const Orb = ({ cls }: { cls: string }) =>
  <div className={`absolute rounded-full blur-3xl pointer-events-none select-none ${cls}`}/>

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const [loaded, setLoaded]   = useState(false)
  const [email, setEmail]     = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [tab, setTab]         = useState<"org"|"freelancer">("org")
  const [activeStep, setActiveStep] = useState(0)
  const [hoveredFeat, setHoveredFeat] = useState<number|null>(null)

  // Platform stats
  const [stats, setStats] = useState({
    freelancers: 0,
    clients: 0,
    projects: 0,
    satisfaction: 98
  })

  // Featured profiles
  const [featuredProfiles, setFeaturedProfiles] = useState<any[]>([])

  // SDG data with counts
  const [sdgData, setSdgData] = useState<any[]>([])

  // Real testimonials
  const [testimonials, setTestimonials] = useState<any[]>([])

  const { user } = useAuth()
  const scrollY = useScrollY()

  const heroRef        = useInView(0.05)
  const missionRef     = useInView()
  const statsRef       = useInView()
  const featRef        = useInView()
  const processRef     = useInView()
  const profilesRef    = useInView()
  const skillsRef      = useInView()
  const testiRef       = useInView()
  const faqRef         = useInView()
  const ctaRef         = useInView()

  const fireConfetti = useCallback(async () => {
    try {
      const c = (await import("canvas-confetti")).default
      c({ particleCount: 130, spread: 75, origin: { y: 0.6 }, colors: ["#F97316","#EA580C","#FB923C","#FCD34D","#ffffff"] })
    } catch {}
  }, [])

  const handleEmailSubmit = () => { if (!email) return; setSubmitted(true); fireConfetti() }

  const handlePostProject = () => {
    if (!user) {
      window.location.href = '/login'
    } else {
      window.location.href = '/dashboard/post-gig'
    }
  }

  const handleCreateProfile = () => {
    if (!user) {
      window.location.href = '/signup'
    } else {
      window.location.href = '/dashboard/profile'
    }
  }

  // Fetch platform stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { collection, getDocs, query, where, limit, orderBy } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        const { SDGS } = await import('@/data/sdgs')

        let profiles: any[] = []
        let sdgDataArray: any[] = []
        const platformStats = await fetchPlatformStats()

        try {
          // Get featured profiles from publicProfiles
          const publicProfilesSnap = await getDocs(collection(db, 'publicProfiles'))
          const publicProfiles = publicProfilesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
          profiles = publicProfiles
            .filter((u: any) => u.role === 'talent' && u.profileComplete === true)
            .sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
            .slice(0, 4)

          // prepare talents array for SDG count from public profiles
          const allTalents = publicProfiles.filter((u: any) => u.role === 'talent')
          const sdgCounts: { [key: string]: number } = {}
          SDGS.forEach(sdg => sdgCounts[sdg] = 0)
          allTalents.forEach((talent: any) => {
            if (talent.sdgTags && Array.isArray(talent.sdgTags)) {
              talent.sdgTags.forEach((sdg: string) => {
                if (sdgCounts[sdg] !== undefined) {
                  sdgCounts[sdg]++
                }
              })
            }
          })
          sdgDataArray = SDGS.map((sdg, index) => ({
            label: sdg,
            count: sdgCounts[sdg] || 0,
            color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
          })).filter(sdg => sdg.count > 0).slice(0, 12)
        } catch (e) {
          console.error('publicProfiles query failed', e)
        }

        try {
          const reviewsQuery = query(
            collection(db, 'platform_reviews'),
            where('isPublic', '==', true),
            orderBy('createdAt', 'desc'),
            limit(5)
          )
          const reviewsSnap = await getDocs(reviewsQuery)
          const reviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          setTestimonials(reviews)
        } catch (e) {
          console.error('reviews query failed', e)
        }

        setStats({
          freelancers: platformStats.freelancers,
          clients: platformStats.clients,
          projects: platformStats.projects,
          satisfaction: platformStats.satisfaction
        })
        setSdgData(sdgDataArray)
        setFeaturedProfiles(profiles)
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  const STEPS_ORG = [
    { icon: FiEdit3,       label: "Post Brief",       desc: "Skills, budget & timeline - 5 minutes" },
    { icon: FiSearch,      label: "Discover Talent",  desc: "Browse relevant profiles and proposals" },
    { icon: FiUsers,       label: "Review Profiles",  desc: "Check portfolios, reviews & fit" },
    { icon: FiCheckCircle, label: "Hire & Start",     desc: "Move into chat and workspace setup" },
  ]
  const STEPS_FL = [
    { icon: FiLayers,      label: "Build Profile",    desc: "Bio, skills & work samples" },
    { icon: FiBell,        label: "Find Work",        desc: "Browse gigs and relevant opportunities" },
    { icon: FiHeart,       label: "Send Proposal",    desc: "Apply and start conversations" },
    { icon: FiTrendingUp,  label: "Earn & Grow",      desc: "Deliver, get reviewed, withdraw" },
  ]
  const steps = tab === "org" ? STEPS_ORG : STEPS_FL

  useEffect(() => {
    if (!processRef.inView) return
    const t = setInterval(() => setActiveStep(s => (s + 1) % 4), 1900)
    return () => clearInterval(t)
  }, [processRef.inView])

  return (
    <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
      *,*::before,*::after{box-sizing:border-box}
      .font-display{font-family:'Sora',sans-serif}
      .font-serif{font-family:'Instrument Serif',serif}
      .font-mono{font-family:'JetBrains Mono',monospace}
      ::-webkit-scrollbar{width:5px}
      ::-webkit-scrollbar-track{background:#060912}
      ::-webkit-scrollbar-thumb{background:linear-gradient(#F97316,#EA580C);border-radius:3px}

      @keyframes fadeUp     {from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeLeft   {from{opacity:0;transform:translateX(50px)}to{opacity:1;transform:translateX(0)}}
      @keyframes fadeScale  {from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}
      @keyframes floatY     {0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
      @keyframes floatY2    {0%,100%{transform:translateY(0)rotate(0)}50%{transform:translateY(-14px)rotate(3deg)}}
      @keyframes floatX     {0%,100%{transform:translateX(0)}50%{transform:translateX(14px)}}
      @keyframes orb1       {0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(50px,-60px)scale(1.1)}66%{transform:translate(-30px,30px)scale(.92)}}
      @keyframes orb2       {0%,100%{transform:translate(0,0)}40%{transform:translate(-50px,40px)scale(.9)}80%{transform:translate(30px,-30px)scale(1.1)}}
      @keyframes orb3       {0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(20px,50px)scale(1.06)}}
      @keyframes marquee    {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      @keyframes marqueeRev {0%{transform:translateX(-50%)}100%{transform:translateX(0)}}
      @keyframes shimTxt    {0%{background-position:-700px 0}100%{background-position:700px 0}}
      @keyframes shimIndigo {0%{background-position:-600px 0}100%{background-position:600px 0}}
      @keyframes borderRot  {0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
      @keyframes pulse      {0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
      @keyframes fadeInScale{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
      @keyframes dashDraw   {from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
      @keyframes toastIn    {from{opacity:0;transform:translateX(-30px)scale(.9)}to{opacity:1;transform:translateX(0)scale(1)}}
      @keyframes gradShift  {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      @keyframes waveBar    {0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
      @keyframes stepPulse  {0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.45)}70%{box-shadow:0 0 0 14px rgba(249,115,22,0)}}
      @keyframes borderGlow {0%,100%{border-color:rgba(249,115,22,.15)}50%{border-color:rgba(249,115,22,.65)}}
      @keyframes ping       {0%{transform:scale(1);opacity:.8}100%{transform:scale(2.4);opacity:0}}
      @keyframes slideRight {from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1)}}
      @keyframes neonGlow   {0%,100%{text-shadow:0 0 12px rgba(249,115,22,.5)}50%{text-shadow:0 0 35px rgba(249,115,22,.9),0 0 70px rgba(249,115,22,.3)}}
      @keyframes skillBounce{0%,100%{transform:translateY(0)scale(1)}50%{transform:translateY(-5px)scale(1.06)}}
      @keyframes countUp    {from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      @keyframes heroReveal {from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0% 0 0)}}

      .reveal  {opacity:0;animation:fadeUp .8s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
      .reveal-l{opacity:0;animation:fadeLeft .8s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
      .reveal-s{opacity:0;animation:fadeScale .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}

      .shimmer{background:linear-gradient(90deg,#F97316 0%,#EA580C 15%,#FB923C 35%,#FCD34D 50%,#FB923C 65%,#EA580C 85%,#F97316 100%);background-size:700px 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimTxt 3s linear infinite}
      .shimmer-indigo{background:linear-gradient(90deg,#6366F1,#8B5CF6,#A78BFA,#C4B5FD,#8B5CF6,#6366F1);background-size:500px 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimIndigo 3.5s linear infinite}

      .grid-dark {background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:64px 64px}
      .grid-light{background-image:linear-gradient(rgba(249,115,22,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,.06) 1px,transparent 1px);background-size:64px 64px}
      .dot-bg    {background-image:radial-gradient(rgba(249,115,22,.15) 1.5px,transparent 1.5px);background-size:28px 28px}

      .card-lift{transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s ease}
      .card-lift:hover{transform:translateY(-9px);box-shadow:0 28px 56px rgba(0,0,0,.1),0 4px 14px rgba(249,115,22,.08)}

      .noise::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");pointer-events:none;opacity:.6;z-index:0}

      .anim-fy  {animation:floatY 7s ease-in-out infinite}
      .anim-fy2 {animation:floatY2 5.5s ease-in-out infinite}
      .anim-fx  {animation:floatX 6s ease-in-out infinite}
      .anim-o1  {animation:orb1 14s ease-in-out infinite}
      .anim-o2  {animation:orb2 18s ease-in-out infinite}
      .anim-o3  {animation:orb3 11s ease-in-out infinite}
      .anim-mq  {animation:marquee 28s linear infinite}
      .anim-mqr {animation:marqueeRev 22s linear infinite}
      .anim-gs  {animation:gradShift 6s ease infinite;background-size:200% 200%}

      .draw-line{stroke-dasharray:1000;animation:dashDraw 2s ease both}

      .glow-orange{box-shadow:0 8px 32px rgba(249,115,22,.4)}
      .glow-indigo{box-shadow:0 8px 32px rgba(99,102,241,.35)}

      .clip-d   {clip-path:polygon(0 5%,100% 0,100% 95%,0 100%)}
      .clip-d-r {clip-path:polygon(0 0,100% 5%,100% 100%,0 95%)}
    `}</style>

    {!loaded && <Preloader onDone={()=>setLoaded(true)}/>}
    {loaded  && <CursorGlow/>}
    {/* {loaded  && <ActivityFeed/>} */}

    <div className="font-display bg-white text-gray-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-900"
      style={{opacity:loaded?1:0,transition:"opacity .5s ease .15s"}}>
      <Navbar/>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §1  HERO
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden bg-[#060912]">
        <div className="absolute inset-0 grid-dark"/>
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 90% 70% at 58% 40%,rgba(249,115,22,.14) 0%,transparent 65%)"}}/>
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 50% 55% at 12% 88%,rgba(99,102,241,.12) 0%,transparent 55%)"}}/>
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 40% 40% at 88% 10%,rgba(16,185,129,.08) 0%,transparent 50%)"}}/>

        <Orb cls="anim-o1 w-[900px] h-[900px] bg-orange-500/8 -top-60 right-0"/>
        <Orb cls="anim-o2 w-[550px] h-[550px] bg-indigo-500/8 bottom-0 -left-20"/>
        <Orb cls="anim-o3 w-[350px] h-[350px] bg-emerald-500/7 top-1/2 left-1/3"/>

        {/* SVG network */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity:.14}} viewBox="0 0 100 100" preserveAspectRatio="none">
          {[[14,20],[72,13],[87,58],[9,73],[57,83],[37,36],[92,84],[24,62],[66,43]].map(([x,y],i)=>(
            <circle key={i} cx={x} cy={y} r=".55" fill="#F97316" style={{animation:`floatY ${4+i}s ease-in-out ${i*.3}s infinite`}}/>
          ))}
          {([[14,20,37,36],[37,36,72,13],[37,36,57,83],[72,13,87,58],[9,73,57,83],[87,58,92,84],[24,62,66,43]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i)=>(
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i>4?"#6366F1":i>2?"#10B981":"#F97316"} strokeWidth=".11"
              className="draw-line" style={{animationDelay:`${i*.35}s`}}/>
          ))}
        </svg>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-28 w-full" ref={heroRef.ref}>
          <div className="grid lg:grid-cols-12 gap-10 items-center">

            {/* LEFT */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              <div className={`inline-flex items-center self-start gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".08s"} as React.CSSProperties}>
                <span className="relative flex w-2.5 h-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"/>
                  <span className="relative rounded-full w-2.5 h-2.5 bg-orange-500"/>
                </span>
                <span className="text-white/55 text-xs font-medium">Nigeria's #1 Impact Talent Marketplace</span>
                <span className="text-orange-400 text-xs font-bold flex items-center gap-1"><HiSparkles size={11}/> Now live</span>
              </div>

              <div className="flex flex-col gap-2">
                <h1 className={`font-display text-6xl lg:text-[82px] font-black leading-[.93] tracking-tight text-white ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".2s"} as React.CSSProperties}>
                  <WordCycle/><br/>
                  <span className="font-serif italic font-normal opacity-80">talents.</span>
                </h1>
                <h2 className={`font-serif italic text-4xl lg:text-5xl text-white/50 leading-tight ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".36s"} as React.CSSProperties}>
                  Meaningful work.
                </h2>
              </div>

              <p className={`text-white/40 text-lg leading-relaxed max-w-md font-display font-light ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".5s"} as React.CSSProperties}>
                Connecting skilled Nigerian professionals with nonprofits and social enterprises - at the price that actually works.
              </p>

              <div className={`flex flex-wrap gap-4 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".62s"} as React.CSSProperties}>
                <Link href="/hire">
                  <MagBtn className="relative overflow-hidden font-display font-black text-base bg-orange-500 text-white rounded-xl glow-orange group"
                    style={{padding:"1.1rem 2.4rem"}}>
                    <span className="relative z-10 flex items-center gap-2">Hire Talent <span className="group-hover:translate-x-1 transition-transform"><FiArrowRight size={16}/></span></span>
                    <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                  </MagBtn>
                </Link>
                <Link href="/jobs">
                  <MagBtn className="font-display font-black text-base border border-white/20 hover:border-orange-400 text-white/65 hover:text-white rounded-xl backdrop-blur-sm transition-all duration-300"
                    style={{padding:"1.05rem 2.4rem"}}>
                    Find Work
                  </MagBtn>
                </Link>
              </div>

              <div className={`flex flex-wrap gap-6 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".74s"} as React.CSSProperties}>
                {[{icon:FiShield,t:"Verified profiles"},{icon:FiZap,t:"Smart matching"},{icon:FiGlobe,t:"Naira pricing"},{icon:FiHeart,t:"Impact focused"}].map(({icon:I,t})=>(
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="text-orange-400"><I size={11}/></span><span className="text-white/30 text-xs tracking-wide">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT CARD STACK */}
            <div className="lg:col-span-5 hidden lg:block relative h-[560px]">
              <Orb cls="w-72 h-72 bg-orange-500/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>

              {/* main card */}
              <div className="anim-fy2 absolute top-14 left-6 w-[295px] bg-[#0E1120] rounded-2xl border border-white/8 overflow-hidden"
                style={{animationDelay:"0s",boxShadow:"0 32px 80px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.05)"}}>
                <div className="h-1 anim-gs" style={{background:"linear-gradient(90deg,#F97316,#EA580C,#F59E0B,#F97316)"}}/>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-orange-400 text-[10px] uppercase tracking-widest font-mono mb-1 flex items-center gap-1"><HiLightningBolt size={9}/> Hot Match</p>
                      <h3 className="text-white font-bold text-sm">M&E Specialist Needed</h3>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/28 text-orange-300 text-xs font-bold font-mono">₦150k</span>
                  </div>
                  <p className="text-white/30 text-xs leading-relaxed mb-4">2-month remote project · Environmental NGO, Lagos · Monitoring framework + quarterly impact reports</p>
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {["M&E","MEAL","Data","Reporting"].map(t=>(
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/35 border border-white/8 font-mono">{t}</span>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-white/22 mb-3">
                    <span className="flex items-center gap-1"><FiClock size={9}/> Closes in 18h</span>
                    <span className="flex items-center gap-1"><FiEye size={9}/> 12 views</span>
                  </div>
                  <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-xs py-3 rounded-xl font-display flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-500 transition-all duration-200">
                    Accept Match <FiArrowRight size={12}/>
                  </button>
                </div>
              </div>

              {/* review card */}
              <div className="anim-fy absolute top-2 right-0 w-52 bg-[#0E1120] rounded-xl border border-white/8 p-4 shadow-xl" style={{animationDelay:"1.6s",boxShadow:"0 16px 48px rgba(0,0,0,.55)"}}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-black font-display">
                    C<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0E1120]"/>
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">Chioma O.</p>
                    <p className="text-white/28 text-[9px] font-mono">Exec Dir · NGO</p>
                  </div>
                </div>
                <p className="text-white/38 text-[10px] leading-relaxed italic mb-2.5">"Found a strong grant writer quickly and managed the work smoothly on-platform."</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_,i)=><span key={i} style={{color:"#FBBF24"}}><FiStar size={9}/></span>)}
                </div>
              </div>

              {/* payment card */}
              <div className="anim-fx absolute bottom-6 left-0 w-56 bg-[#0E1120] rounded-xl border border-white/8 p-4 shadow-xl" style={{animationDelay:".9s",boxShadow:"0 16px 48px rgba(0,0,0,.55)"}}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="shrink-0" style={{color:"#10B981"}}><FiCheckCircle size={14}/></span>
                  <span className="text-white/55 text-xs font-semibold">Project Completed</span>
                </div>
                <p className="text-white/22 text-[10px] mb-3 font-mono">Grant Writer · Kano Youth Initiative</p>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-emerald-400 text-xs font-black font-display">₦120,000</span>
                  <span className="text-[9px] text-white/18 font-mono">Paystack ✓</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{width:"100%"}}/>
                </div>
              </div>

              {/* badge */}
              <div className="anim-fy absolute bottom-28 right-0 px-3 py-2 rounded-full bg-indigo-500/15 border border-indigo-500/25 backdrop-blur-sm" style={{animationDelay:"2.3s"}}>
                <span className="text-indigo-300 text-[10px] font-semibold font-display flex items-center gap-1.5">
                  <FiZap size={10}/> smart matching
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25">
          <span className="font-mono text-white text-[10px] tracking-[.25em] uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white to-transparent" style={{animation:"floatY 2s ease-in-out infinite"}}/>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent pointer-events-none"/>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §2  SKILLS MARQUEE
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <div className="relative py-5 overflow-hidden border-y border-gray-100">
        <div className="flex w-max anim-mq gap-4">
          {[...SKILLS_DATA,...SKILLS_DATA,...SKILLS_DATA,...SKILLS_DATA].map((s,i)=>(
            <span key={i} className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-gray-100 text-gray-700 text-sm font-semibold whitespace-nowrap shadow-sm cursor-default hover:shadow-md transition-shadow"
              style={{boxShadow:"0 1px 8px rgba(0,0,0,.04)"}}>
              <span className="w-2 h-2 rounded-full" style={{background:s.color}}/>
              {s.label}
              <span className="font-mono text-gray-300 text-xs">{s.count}</span>
            </span>
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"/>
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"/>
      </div>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §3  MISSION (dark)
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section ref={missionRef.ref} className="relative py-36 overflow-hidden bg-[#060912] noise">
        <div className="absolute inset-0 grid-dark opacity-60"/>
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 65% 60% at 50% 50%,rgba(249,115,22,.08) 0%,transparent 70%)"}}/>
        <Orb cls="anim-o1 w-96 h-96 bg-orange-500/8 -right-20 top-0"/>
        <Orb cls="anim-o2 w-80 h-80 bg-indigo-500/8 -left-20 bottom-0"/>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <p className={`font-mono text-xs text-orange-400 uppercase tracking-[.3em] mb-8 ${missionRef.inView?"reveal":"opacity-0"}`} style={{"--d":".0s"} as React.CSSProperties}>Our Mission</p>
          <div className={`${missionRef.inView?"reveal":"opacity-0"}`} style={{"--d":".12s"} as React.CSSProperties}>
            <p className="font-display font-black text-5xl lg:text-7xl text-white leading-[1.04] tracking-tight">
              We're building <span className="font-serif italic font-normal text-white/45">Africa's</span>
            </p>
            <p className="font-display font-black text-5xl lg:text-7xl text-white leading-[1.04] mt-1">
              workforce for <span className="shimmer">social impact.</span>
            </p>
          </div>
          <p className={`text-white/32 text-xl leading-relaxed max-w-2xl mx-auto mt-10 font-display font-light ${missionRef.inView?"reveal":"opacity-0"}`} style={{"--d":".38s"} as React.CSSProperties}>
            Nonprofits shouldn't choose between mission and capability. Skilled professionals shouldn't choose between purpose and income. We built changeworker so nobody has to choose.
          </p>
          <div className={`grid grid-cols-3 gap-8 mt-16 max-w-xl mx-auto ${missionRef.inView?"reveal":"opacity-0"}`} style={{"--d":".52s"} as React.CSSProperties}>
            {[{I:TbBuildingCommunity,l:"Client Profiles",v:stats.clients,c:"#F97316"},{I:RiTeamLine,l:"Talent Profiles",v:stats.freelancers,c:"#6366F1"},{I:FiTrendingUp,l:"Published Gigs",v:stats.projects,c:"#10B981"}].map(({I,l,v,c})=>(
              <div key={l} className="flex flex-col items-center gap-2">
                <span style={{color:c}}><I size={22}/></span>
                <span className="font-display font-black text-3xl text-white">{v > 0 ? `${v}+` : v}</span>
                <span className="text-white/28 text-xs font-mono uppercase tracking-wider">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §4  STATS
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <div ref={statsRef.ref} className="relative py-20 overflow-hidden bg-white">
        <div className="absolute right-0 top-0 w-80 h-80 opacity-35 dot-bg pointer-events-none"/>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          {statsRef.inView && <>
            <StatBox val={stats.freelancers} suf="+"  label="Talent Profiles" icon={FiUsers}           color="#F97316" delay=".1s" start/>
            <StatBox val={stats.clients}  suf="+"  label="Client Profiles" icon={TbBuildingCommunity}color="#6366F1" delay=".2s" start/>
            <StatBox val={stats.projects} suf="+"  label="Published Gigs" icon={FiCheckCircle}      color="#10B981" delay=".3s" start/>
            <StatBox val={stats.satisfaction}  suf="%"  label="Satisfaction Rate"  icon={FiStar}             color="#EC4899" delay=".4s" start/>
          </>}
        </div>
      </div>

      {/* wave bars */}
      <div className="py-4 bg-white overflow-hidden">
        <div className="flex items-end justify-center gap-1 h-10 opacity-15 max-w-xl mx-auto">
          {[35,55,75,50,65,85,60,70,45,80,55,40,70,80,50,65,90,55,45,72].map((h,i)=>(
            <div key={i} className="bg-orange-400 rounded-full w-2"
              style={{height:`${h}%`,animation:`waveBar 1.3s ease-in-out ${i*.06}s infinite`}}/>
          ))}
        </div>
      </div>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §5  FLIP FEATURES
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section ref={featRef.ref} className="relative py-28 bg-[#FAFAF9] overflow-hidden">
        <div className="absolute left-0 top-0 w-80 h-80 opacity-30 dot-bg pointer-events-none"/>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className={`text-center mb-16 ${featRef.inView?"reveal":"opacity-0"}`} style={{"--d":".0s"} as React.CSSProperties}>
            <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Why changeworker</span>
            <h2 className="font-display text-5xl font-black text-gray-900">Built for impact.<br/><span className="shimmer">Not retrofitted.</span></h2>
            <p className="text-gray-400 mt-3 text-sm font-display font-normal">Hover each card to flip it</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f,i)=><FlipCard key={i} feat={f} idx={i} inView={featRef.inView}/>)}
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §6  HOW IT WORKS
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section ref={processRef.ref} className="relative py-28 bg-white overflow-hidden">
        <div className="absolute right-0 bottom-0 w-96 h-96 opacity-20 dot-bg pointer-events-none"/>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className={`text-center mb-14 ${processRef.inView?"reveal":"opacity-0"}`} style={{"--d":".0s"} as React.CSSProperties}>
            <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">The process</span>
            <h2 className="font-display text-5xl font-black text-gray-900 mb-8">How it works</h2>
            <div className="inline-flex bg-gray-100 rounded-xl p-1.5 gap-1">
              {(["org","freelancer"] as const).map(t=>(
                <button key={t} onClick={()=>setTab(t)}
                  className={`px-7 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 font-display ${tab===t?"bg-white text-gray-900 shadow-md":"text-gray-400 hover:text-gray-700"}`}>
                  {t==="org"?"For Organizations":"For Freelancers"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px hidden md:block overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200"
                style={{animation:processRef.inView?"slideRight 1.6s ease .4s both":"none"}}/>
            </div>
            {steps.map((step,i)=>{
              const I = step.icon
              const active = activeStep===i
              return (
                <div key={`${tab}-${i}`}
                  className={`relative text-center flex flex-col items-center gap-4 cursor-pointer ${processRef.inView?"reveal":"opacity-0"}`}
                  style={{"--d":`${.14+i*.12}s`} as React.CSSProperties}
                  onClick={()=>setActiveStep(i)}>
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-2"
                    style={{
                      background:active?"#F97316":"white",
                      borderColor:active?"#F97316":"#E5E7EB",
                      animation:active?"stepPulse 1.6s ease infinite":"none",
                      transform:active?"scale(1.12)":"scale(1)",
                    }}>
                    <span style={{color:active?"white":"#9CA3AF"}}><I size={22}/></span>
                    <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-white flex items-center justify-center font-mono text-[10px] font-bold border border-gray-200 shadow-sm"
                      style={{color:active?"#F97316":"#9CA3AF"}}>
                      {String(i+1).padStart(2,"0")}
                    </span>
                  </div>
                  <h3 className={`font-display font-bold text-sm transition-colors duration-300 ${active?"text-orange-500":"text-gray-700"}`}>{step.label}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed font-display font-normal">{step.desc}</p>
                  {active&&<div className="absolute -inset-3 rounded-2xl border border-orange-200/50" style={{animation:"borderGlow 2s ease infinite"}}/>}
                </div>
              )
            })}
          </div>

          <div className={`text-center mt-14 ${processRef.inView?"reveal":"opacity-0"}`} style={{"--d":".7s"} as React.CSSProperties}>
            <button onClick={tab === "org" ? handlePostProject : handleCreateProfile} className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-display font-bold px-10 py-4 rounded-xl shadow-lg shadow-orange-100 transition-all duration-200 group">
              {tab==="org"?"Post a Project":"Create Your Profile"}
              <span className="group-hover:translate-x-1 transition-transform"><FiArrowRight size={16}/></span>
            </button>
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §7  FEATURED TALENT
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section ref={profilesRef.ref} className="relative py-28 bg-[#FAFAF9] overflow-hidden">
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 60% 50% at 30% 60%,rgba(99,102,241,.04) 0%,transparent 60%)"}}/>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14 ${profilesRef.inView?"reveal":"opacity-0"}`} style={{"--d":".0s"} as React.CSSProperties}>
            <div>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Featured Talent</span>
              <h2 className="font-display text-4xl font-black text-gray-900">Meet the community</h2>
              <p className="text-gray-400 mt-2 text-sm font-display font-normal max-w-sm">Pre-vetted, sector-smart, and ready for your next project.</p>
            </div>
            <Link href="/hire">
              <button className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-display font-bold text-sm transition-colors group">
                Browse all talent <span className="group-hover:translate-x-1 transition-transform"><FiArrowRight size={14}/></span>
              </button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProfiles.length > 0 ? featuredProfiles.slice(0, 4).map((p,i)=><ProfileCard key={p.id || i} p={p} idx={i} inView={profilesRef.inView}/>) : PROFILES.map((p,i)=><ProfileCard key={i} p={p} idx={i} inView={profilesRef.inView}/>)}
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §8  SKILLS CLOUD (dark)
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section ref={skillsRef.ref} className="relative py-28 bg-[#060912] overflow-hidden noise clip-d">
        <div className="absolute inset-0 grid-dark opacity-55"/>
        <Orb cls="anim-o1 w-96 h-96 bg-orange-500/8 -right-20 top-0"/>
        <Orb cls="anim-o2 w-80 h-80 bg-indigo-500/8 -left-20 bottom-0"/>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center py-8">
          <p className={`font-mono text-xs text-orange-400 uppercase tracking-[.3em] mb-6 ${skillsRef.inView?"reveal":"opacity-0"}`} style={{"--d":".0s"} as React.CSSProperties}>SDGs on the platform</p>
          <h2 className={`font-display text-5xl font-black text-white mb-14 ${skillsRef.inView?"reveal":"opacity-0"}`} style={{"--d":".1s"} as React.CSSProperties}>
            {stats.freelancers > 0 ? `${stats.freelancers}+ talent profiles` : '200+ talent profiles'} across<br/><span className="shimmer">{sdgData.length > 0 ? `${sdgData.length} impact areas` : '12 impact disciplines'}</span>
          </h2>
          <div className={`flex flex-wrap justify-center gap-3 ${skillsRef.inView?"reveal":"opacity-0"}`} style={{"--d":".25s"} as React.CSSProperties}>
            {sdgData.length > 0 ? sdgData.map((s,i)=>(
              <div key={i} className="group inline-flex items-center gap-3 px-5 py-3 rounded-2xl border cursor-default transition-all duration-300 hover:scale-105"
                style={{background:`${s.color}10`,borderColor:`${s.color}22`,animationDelay:`${i*.04}s`}}>
                <span className="w-2 h-2 rounded-full" style={{background:s.color}}/>
                <span className="text-white/65 font-display font-semibold text-sm group-hover:text-white transition-colors">{s.label}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{background:`${s.color}20`,color:s.color}}>{s.count}</span>
              </div>
            )) : SKILLS_DATA.map((s,i)=>(
              <div key={i} className="group inline-flex items-center gap-3 px-5 py-3 rounded-2xl border cursor-default transition-all duration-300 hover:scale-105"
                style={{background:`${s.color}10`,borderColor:`${s.color}22`,animationDelay:`${i*.04}s`}}>
                <span className="w-2 h-2 rounded-full" style={{background:s.color}}/>
                <span className="text-white/65 font-display font-semibold text-sm group-hover:text-white transition-colors">{s.label}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{background:`${s.color}20`,color:s.color}}>{s.count}</span>
              </div>
            ))}
          </div>
          <div className={`mt-14 ${skillsRef.inView?"reveal":"opacity-0"}`} style={{"--d":".55s"} as React.CSSProperties}>
            <Link href="/hire" className="inline-flex items-center gap-2 border border-white/12 hover:border-orange-400 text-white/45 hover:text-white font-display font-bold text-sm px-8 py-3.5 rounded-xl transition-all duration-300 no-underline">
              <FiSearch size={14}/> Browse all categories
            </Link>
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §9  TESTIMONIALS
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section ref={testiRef.ref} className="relative py-28 bg-white overflow-hidden">
        <Orb cls="anim-o3 w-96 h-96 bg-orange-50 right-0 top-0"/>
        <div className="max-w-3xl mx-auto px-6">
          <div className={`text-center mb-14 ${testiRef.inView?"reveal":"opacity-0"}`} style={{"--d":".0s"} as React.CSSProperties}>
            <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">What they say</span>
            <h2 className="font-display text-4xl font-black text-gray-900">People who get it,<br/><span className="shimmer">love it.</span></h2>
          </div>
          <Suspense fallback={<div className="h-80 rounded-3xl bg-gray-100 animate-pulse" />}>
            <TestCarousel inView={testiRef.inView} testimonials={testimonials} />
          </Suspense>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §10  SPLIT VALUE PROPS
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section className="relative overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="relative bg-[#FFF7ED] px-12 lg:px-16 py-24 overflow-hidden flex flex-col gap-6">
            <Orb cls="anim-o3 w-72 h-72 bg-orange-200/50 -right-10 -top-10"/>
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-full mb-6">
                <span className="text-orange-500"><FiBriefcase size={12}/></span>
                <span className="font-mono text-xs text-orange-600 uppercase tracking-[.15em]">For Organizations</span>
              </div>
              <h2 className="font-display text-4xl font-black text-gray-900 leading-tight mb-5">
                The skills your<br/>mission needs.<br/><span className="shimmer">At last.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed max-w-sm font-display font-normal mb-8 text-sm">
                Stop turning down grants because you lack the staff. Access strong-fit specialists for exactly how long you need them.
              </p>
              <ul className="space-y-3 mb-10">
                {[{I:FiDollarSign,t:"Budget N50k-N400k+ per project"},{I:FiZap,t:"Matching, proposals and messaging in-app"},{I:FiShield,t:"Verified profiles and reviews"},{I:FiRepeat,t:"No long-term commitments"}].map(({I,t})=>(
                  <li key={t} className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><span className="text-orange-500"><I size={12}/></span></div>
                    {t}
                  </li>
                ))}
              </ul>
              <button onClick={handlePostProject} className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-display font-bold px-8 py-4 rounded-xl shadow-lg shadow-orange-200 transition-all duration-200 group">
                Post a Project <span className="group-hover:translate-x-1 transition-transform"><FiArrowRight size={14}/></span>
              </button>
            </div>
          </div>
          <div className="relative bg-[#060912] px-12 lg:px-16 py-24 overflow-hidden flex flex-col gap-6">
            <Orb cls="anim-o2 w-72 h-72 bg-indigo-500/15 -left-10 bottom-0"/>
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/6 border border-white/10 px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
                <span className="text-orange-400"><FiUsers size={12}/></span>
                <span className="font-mono text-xs text-orange-400 uppercase tracking-[.15em]">For Freelancers</span>
              </div>
              <h2 className="font-display text-4xl font-black text-white leading-tight mb-5">
                Work that matters.<br/>Pay that doesn't<br/><span className="shimmer-indigo">insult you.</span>
              </h2>
              <p className="text-white/42 leading-relaxed max-w-sm font-display font-normal mb-8 text-sm">
                The impact sector has always needed great talent. Now it can work with it more transparently. Join a growing community building Africa's social infrastructure.
              </p>
              <ul className="space-y-3 mb-10">
                {[{I:FiTrendingUp,t:"Earn ₦50k–₦200k per project",c:"#6366F1"},{I:FiHeart,t:"Work with mission-aligned orgs",c:"#EC4899"},{I:FiFilter,t:"No cold-pitching or bidding wars",c:"#10B981"},{I:FiAward,t:"Build a portfolio that means something",c:"#F59E0B"}].map(({I,t,c})=>(
                  <li key={t} className="flex items-center gap-3 text-sm text-white/65">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{background:`${c}20`}}><span style={{color:c}}><I size={12}/></span></div>
                    {t}
                  </li>
                ))}
              </ul>
              <button onClick={handleCreateProfile} className="inline-flex items-center gap-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-display font-bold px-8 py-4 rounded-xl glow-indigo transition-all duration-200 group">
                Create Profile <span className="group-hover:translate-x-1 transition-transform"><FiArrowRight size={14}/></span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §11  COMPARISON TABLE
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section className="relative py-28 overflow-hidden bg-white">
        <Orb cls="anim-o2 w-72 h-72 bg-indigo-50 right-0 top-0"/>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Why not just use Upwork?</span>
            <h2 className="font-display text-4xl font-black text-gray-900">We're different by design</h2>
          </div>
          <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-xl">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
              <div className="p-5 text-xs uppercase tracking-widest text-gray-400 font-semibold font-mono">Feature</div>
              <div className="p-5 text-center"><span className="inline-block px-4 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold font-display">changeworker</span></div>
              <div className="p-5 text-center"><span className="text-gray-400 text-sm font-semibold">Generic platforms</span></div>
            </div>
            {[
              ["Sector-specific vetting",true,false],
              ["Nonprofit budget-friendly",true,false],
              ["Guided discovery and proposals",true,false],
              ["Nigerian payment integration",true,false],
              ["Impact org expertise",true,false],
              ["No bidding wars",true,false],
              ["10% flat commission",true,"20–30% varies"],
            ].map(([feat,cw,gen],i)=>(
              <div key={i} className={`grid grid-cols-3 border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
                <div className="p-5 text-sm text-gray-700 font-display font-medium">{feat as string}</div>
                <div className="p-5 flex items-center justify-center">
                  {cw===true?<span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-sm"><FiCheck size={14}/></span>:<span className="text-sm text-gray-400">{cw as string}</span>}
                </div>
                <div className="p-5 flex items-center justify-center">
                  {gen===false?<span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-gray-300"><FiChevronDown size={14}/></span></span>:<span className="text-sm text-gray-400">{gen as string}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §12  FAQ
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section ref={faqRef.ref} className="relative py-28 bg-[#FAFAF9] overflow-hidden">
        <Orb cls="anim-o1 w-80 h-80 bg-orange-50 right-0 top-20"/>
        <div className="max-w-3xl mx-auto px-6">
          <div className={`text-center mb-14 ${faqRef.inView?"reveal":"opacity-0"}`} style={{"--d":".0s"} as React.CSSProperties}>
            <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">FAQ</span>
            <h2 className="font-display text-4xl font-black text-gray-900">Questions answered</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((f,i)=><FaqItem key={i} faq={f} idx={i} inView={faqRef.inView}/>)}
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §13  CTA (cinematic)
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <section ref={ctaRef.ref} className="relative py-40 overflow-hidden bg-[#060912] noise clip-d-r">
        <div className="absolute inset-0 grid-dark"/>
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 80% 70% at 50% 50%,rgba(249,115,22,.13) 0%,transparent 65%)"}}/>
        <Orb cls="anim-o1 w-[1000px] h-[1000px] bg-orange-500/6 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"/>
        {/* rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-orange-500/8 pointer-events-none" style={{animation:"borderRot 28s linear infinite"}}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full border border-orange-500/5 pointer-events-none" style={{animation:"borderRot 45s linear infinite reverse"}}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1150px] h-[1150px] rounded-full border border-white/3 pointer-events-none" style={{animation:"borderRot 65s linear infinite"}}/>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className={ctaRef.inView?"reveal":"opacity-0"} style={{"--d":".1s"} as React.CSSProperties}>
            <span className="font-mono text-xs text-orange-400 uppercase tracking-[.3em] mb-6 block">Ready to begin?</span>
            <h2 className="font-display text-6xl lg:text-7xl font-black text-white leading-[.94] mb-3">Building Africa's</h2>
            <h2 className="font-serif italic text-6xl lg:text-7xl text-white/55 mb-4 leading-[.94]">workforce for</h2>
            <h2 className="font-display text-6xl lg:text-7xl font-black leading-[.94] mb-10"><span className="shimmer">social impact.</span></h2>
            <p className="text-white/32 text-lg max-w-md mx-auto mb-12 font-display font-light leading-relaxed">
              Join hundreds of nonprofits and skilled professionals already making it happen through changeworker.
            </p>
          </div>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".3s"} as React.CSSProperties}>
            <Link href="/hire">
              <MagBtn className="font-display font-black text-lg bg-orange-500 hover:bg-orange-600 text-white px-12 py-5 rounded-2xl shadow-[0_0_60px_rgba(249,115,22,.35)] transition-all duration-200 flex items-center gap-2.5 group">
                Hire Talent <span className="group-hover:translate-x-1 transition-transform"><FiArrowRight size={18}/></span>
              </MagBtn>
            </Link>
            <Link href="/jobs">
              <MagBtn className="font-display font-black text-lg border-2 border-white/12 hover:border-orange-400 text-white/60 hover:text-white px-12 py-5 rounded-2xl backdrop-blur-sm transition-all duration-200">
                Find Work
              </MagBtn>
            </Link>
          </div>

          {/* email form */}
          <div className={ctaRef.inView?"reveal":"opacity-0"} style={{"--d":".44s"} as React.CSSProperties}>
            <p className="text-white/22 text-xs font-mono uppercase tracking-wider mb-5">Get notified when new opportunities drop</p>
            {!submitted?(
              <div className="flex gap-2 max-w-sm mx-auto">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/22"><FiMail size={13}/></span>
                  <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&handleEmailSubmit()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-white/22 text-sm font-display focus:outline-none focus:border-orange-400 transition-colors backdrop-blur-sm"/>
                </div>
                <button onClick={handleEmailSubmit}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3.5 rounded-xl font-display font-bold text-sm transition-all duration-200 flex items-center gap-1.5 shrink-0">
                  <FiSend size={13}/> Subscribe
                </button>
              </div>
            ):(
              <div className="flex items-center justify-center gap-3 text-emerald-400">
                <FiCheckCircle size={18}/>
                <span className="font-display font-semibold">You're on the list! 🎉</span>
              </div>
            )}
          </div>

          <div className={`flex flex-wrap justify-center gap-8 mt-14 ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".58s"} as React.CSSProperties}>
            {[{I:FiCheckCircle,t:"Free to sign up"},{I:FiShield,t:"No commitment"},{I:HiCurrencyDollar,t:"Naira payments"},{I:RiLeafLine,t:"Impact focused"}].map(({I,t})=>(
              <div key={t} className="flex items-center gap-2">
                <span className="text-orange-400"><I size={12}/></span>
                <span className="text-white/22 text-xs uppercase tracking-wider font-mono">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
          §14  FOOTER
      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ */}
      <footer className="bg-[#030508] border-t border-white/5 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="Changeworker" className="h-20 w-20" />
                <p className="font-display font-black text-2xl text-white">changeworker</p>
              </div>
              <p className="text-white/22 text-sm font-display font-light leading-relaxed mb-6 max-w-xs">
                Flexible talents. Meaningful work.<br/>The talent marketplace for social impact in Nigeria.
              </p>
              <p className="text-white/14 text-xs font-mono mb-5">A product of Impactpal Africa</p>
              <div className="flex gap-2.5">
                {[{l:"𝕏"},{l:"in"},{l:"ig"}].map(s=>(
                  <a key={s.l} href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-orange-500/20 border border-white/8 hover:border-orange-500/35 flex items-center justify-center text-white/32 hover:text-orange-400 text-xs font-bold transition-all duration-200">
                    {s.l}
                  </a>
                ))}
              </div>
            </div>
            {[
              {title:"Platform",links:["How It Works","FAQ"]},
              {title:"Company", links:["About Us","Blog","Contact"]},
              {title:"Legal",   links:["Terms of Service","Privacy Policy"]},
            ].map(col=>(
              <div key={col.title}>
                <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/22 mb-5">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map(l=>(
                    <li key={l}><Link href={
                      l === "Terms of Service" ? "/terms" :
                      l === "Privacy Policy" ? "/privacy" :
                      l === "Contact" ? "/contact" :
                      l === "FAQ" ? "/faq" :
                      l === "About Us" ? "/about" :
                      l === "How It Works" ? "/how" :
                      l === "Blog" ? "/blog" : "#"
                    } className="text-white/32 hover:text-orange-400 text-sm font-display font-normal transition-colors duration-200 no-underline">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/14 text-xs font-mono">© {new Date().getFullYear()} changeworker · Impactpal Africa · All rights reserved</p>
            <p className="text-white/10 text-xs font-mono">Building Africa's workforce for social impact</p>
          </div>
        </div>
      </footer>

    </div>
    <Toaster position="top-right" />
    </>
  )
}




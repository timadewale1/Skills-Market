"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  FiArrowRight, FiUsers, FiHeart, FiTarget, FiGlobe,
  FiCheckCircle, FiZap, FiStar, FiAward, FiLinkedin,
  FiTwitter, FiMail, FiMapPin, FiTrendingUp, FiLayers
} from "react-icons/fi"
import { HiSparkles, HiLightningBolt } from "react-icons/hi"
import { TbRocket, TbTargetArrow, TbBuildingCommunity, TbHeartHandshake } from "react-icons/tb"
import { RiLeafLine, RiTeamLine, RiShieldCheckLine } from "react-icons/ri"
import { MdOutlineHandshake } from "react-icons/md"
import { fetchPlatformStats } from "@/lib/platformStats"

/* ═══ HOOKS ══════════════════════════════════════════════════ */
function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const h = () => setY(window.scrollY)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return y
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [v, setV] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setV(true) },
      { threshold }
    )
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [threshold])
  return { ref, inView: v }
}

function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let s: number | null = null
    const ease = (t: number) => 1 - Math.pow(1 - t, 4)
    const go = (ts: number) => {
      if (!s) s = ts
      const p = Math.min((ts - s) / duration, 1)
      setCount(Math.floor(ease(p) * target))
      if (p < 1) requestAnimationFrame(go)
      else setCount(target)
    }
    requestAnimationFrame(go)
  }, [start, target, duration])
  return count
}

function useMagnet(strength = 20) {
  const ref = useRef<HTMLAnchorElement>(null)
  const hm = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) / r.width * strength
    const y = (e.clientY - r.top - r.height / 2) / r.height * strength
    ref.current.style.transform = `translate(${x}px,${y}px)`
  }, [strength])
  const hl = useCallback(() => {
    if (ref.current) ref.current.style.transform = "translate(0,0)"
  }, [])
  return { ref, hm, hl }
}

/* ═══ DATA ══════════════════════════════════════════════════ */
const TEAM = [
  {
    name: "Chidinma Okafor",
    role: "Co-founder & CEO",
    bio: "Former Executive Director of a health NGO in Lagos. 12 years building and managing nonprofits. Experienced the talent crisis firsthand and decided to solve it.",
    initials: "CO",
    color: "#F97316",
    location: "Lagos",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Emeka Nwofor",
    role: "Co-founder & CTO",
    bio: "Previously led engineering at Flutterwave. Built payment infrastructure that processed $1B+. Believes technology is only useful when it solves a real human problem.",
    initials: "EN",
    color: "#6366F1",
    location: "Lagos",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Adaeze Nwankwo",
    role: "Head of Talent & Matching",
    bio: "Eight years in executive search for international development organizations. Has personally placed over 300 professionals in mission-driven roles across Africa.",
    initials: "AN",
    color: "#10B981",
    location: "Abuja",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Tunde Adeyemi",
    role: "Head of Partnerships",
    bio: "Built civil society partnerships for a major African foundation before joining changeworker. Speaks at sector conferences across Nigeria, Ghana, and Kenya.",
    initials: "TA",
    color: "#EC4899",
    location: "Lagos",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Fatima Al-Hassan",
    role: "Research & Sector Intelligence",
    bio: "PhD in Development Studies from University of Ibadan. Publishes on nonprofit labour markets and has advised three Nigerian state governments on civil society policy.",
    initials: "FA",
    color: "#F59E0B",
    location: "Abuja",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Segun Fashola",
    role: "Head of Platform & Product",
    bio: "Product lead at two Nigerian fintech startups before finding his way to the impact sector. Believes the best product is invisible - it just works.",
    initials: "SF",
    color: "#3B82F6",
    location: "Lagos",
    linkedin: "#",
    twitter: "#",
  },
]

const VALUES = [
  {
    icon: TbHeartHandshake,
    title: "Dignity before discount",
    desc: "Skilled professionals should be paid what their work is worth. We will never allow the impact sector's resource constraints to become an excuse for exploitation. Fair pay is non-negotiable.",
    color: "#F97316",
    number: "01",
  },
  {
    icon: RiLeafLine,
    title: "Sector fluency",
    desc: "We are not a generic freelance platform that happens to have some NGO clients. We are a product built from inside the social sector, by people who have lived its constraints and possibilities.",
    color: "#10B981",
    number: "02",
  },
  {
    icon: RiShieldCheckLine,
    title: "Trust by design",
    desc: "Every platform decision - verification, workspace records, reviews, and dispute tools - is designed to reduce friction and build trust between parties who may never have worked together before.",
    color: "#6366F1",
    number: "03",
  },
  {
    icon: FiTarget,
    title: "Quality over volume",
    desc: "We care more about fit, clarity, and trust than raw volume. We want the platform to feel focused, useful, and credible for both talent and clients.",
    color: "#EC4899",
    number: "04",
  },
  {
    icon: TbBuildingCommunity,
    title: "Nigeria first",
    desc: "Our pricing is in Naira. Our teams are Nigerian. Our understanding of NGO funding cycles, local government relationships, and community accountability is native, not imported.",
    color: "#F59E0B",
    number: "05",
  },
  {
    icon: FiLayers,
    title: "Learning out loud",
    desc: "We publish our research, share our data, and contribute to the conversation about talent and effectiveness in Nigerian civil society. Our editorial content is free, always.",
    color: "#3B82F6",
    number: "06",
  },
]

const MILESTONES = [
  { year: "2022", title: "The problem becomes undeniable", desc: "After repeated difficulty finding qualified project support, the team begins documenting the structural talent challenge facing impact organizations." },
  { year: "2022", title: "Research phase", desc: "Over six months, she interviews 87 Nigerian nonprofit leaders and 120 freelance development professionals. The pattern is consistent: talent exists; the matching infrastructure doesn't." },
  { year: "2023", title: "Emeka joins. changeworker is founded.", desc: "Impactpal Africa is registered. The founding thesis: a sector-specific marketplace with stronger workflow support can solve what word-of-mouth networks cannot." },
  { year: "2023", title: "First profiles go live", desc: "The team spends months shaping the early product, profile standards, and onboarding experience before the first public profiles go live." },
  { year: "2024", title: "Early organizations join", desc: "Nonprofits, NGOs, and social enterprises begin using changeworker for discovery, conversations, and early project delivery across the platform." },
  { year: "2024", title: "Platform operations expand", desc: "More organizations and talent profiles begin using changeworker for gig discovery, messaging, workspace delivery, and reviews across the platform." },
  { year: "2025", title: "Looking ahead", desc: "The focus turns to improving the product, deepening sector trust, and expanding the ways talent and organizations can work together on the platform." },
]

const BACKERS = [
  { name: "Catapult", type: "Impact Investor", color: "#F97316" },
  { name: "Ventures Platform", type: "VC Fund", color: "#6366F1" },
  { name: "CcHUB Growth Capital", type: "Tech for Impact", color: "#10B981" },
  { name: "Tony Elumelu Foundation", type: "African Philanthropy", color: "#EC4899" },
]

/* ═══ STAT COUNTER ══════════════════════════════════════════ */
function StatCounter({ value, suffix, label, color, start }: {
  value: number; suffix: string; label: string; color: string; start: boolean
}) {
  const count = useCounter(value, 2200, start)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-display font-black text-4xl lg:text-5xl" style={{ color }}>
        {count}{suffix}
      </span>
      <span className="font-mono text-[10px] text-gray-400 uppercase tracking-[.2em] text-center">{label}</span>
    </div>
  )
}

/* ═══ CURSOR ════════════════════════════════════════════════ */
function CursorGlow() {
  const dot = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let tx = 0, ty = 0, cx = 0, cy = 0
    const h = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }
    window.addEventListener("mousemove", h)
    const a = () => {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08
      if (dot.current) { dot.current.style.left = tx + "px"; dot.current.style.top = ty + "px" }
      if (glow.current) { glow.current.style.left = cx + "px"; glow.current.style.top = cy + "px" }
      requestAnimationFrame(a)
    }
    requestAnimationFrame(a)
    return () => window.removeEventListener("mousemove", h)
  }, [])
  return <>
    <div ref={dot} className="fixed pointer-events-none z-[9998] w-3 h-3 rounded-full bg-orange-400/50 mix-blend-screen" style={{ transform: "translate(-50%,-50%)" }} />
    <div ref={glow} className="fixed pointer-events-none z-[9997] w-72 h-72 rounded-full" style={{ transform: "translate(-50%,-50%)", background: "radial-gradient(circle,rgba(249,115,22,.06) 0%,transparent 70%)" }} />
  </>
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function AboutPage() {
  const scrollY = useScrollY()
  const [stats, setStats] = useState({
    freelancers: 0,
    clients: 0,
    projects: 0,
    satisfaction: 98,
  })

  const heroRef    = useInView(0.05)
  const missionRef = useInView(0.08)
  const statsRef   = useInView(0.12)
  const storyRef   = useInView(0.06)
  const valuesRef  = useInView(0.06)
  const timelineRef= useInView(0.05)
  const teamRef    = useInView(0.06)
  const backersRef = useInView(0.08)
  const ctaRef     = useInView(0.1)

  const mag1 = useMagnet(20)
  const mag2 = useMagnet(16)

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchPlatformStats()
      setStats(data)
    }
    loadStats()
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=Instrument+Serif:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        .font-display{font-family:'Sora',sans-serif}
        .font-serif{font-family:'Instrument Serif',serif}
        .font-mono{font-family:'JetBrains Mono',monospace}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#f9fafb}
        ::-webkit-scrollbar-thumb{background:#F97316;border-radius:3px}

        @keyframes fadeUp   {from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeLeft {from{opacity:0;transform:translateX(44px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeScale{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
        @keyframes shimTxt  {0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes orb1     {0%,100%{transform:translate(0,0)scale(1)}35%{transform:translate(55px,-55px)scale(1.1)}70%{transform:translate(-30px,30px)scale(.93)}}
        @keyframes orb2     {0%,100%{transform:translate(0,0)}50%{transform:translate(-45px,40px)scale(.91)}}
        @keyframes orb3     {0%,100%{transform:translate(0,0)scale(1)}55%{transform:translate(28px,48px)scale(1.07)}}
        @keyframes dotDrift {0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes floatY   {0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes floatY2  {0%,100%{transform:translateY(0)rotate(-1deg)}50%{transform:translateY(-12px)rotate(1deg)}}
        @keyframes borderRot{to{transform:rotate(360deg)}}
        @keyframes dashDraw {from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
        @keyframes lineGrow {from{width:0}to{width:100%}}
        @keyframes waveBar  {0%,100%{transform:scaleY(.28)}50%{transform:scaleY(1)}}
        @keyframes spin     {to{transform:rotate(360deg)}}
        @keyframes pulse    {0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes timelineDot{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
        @keyframes countUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes photoHover{from{transform:translateY(0)rotate(0deg)}to{transform:translateY(-6px)rotate(1.5deg)}}

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
        .anim-fy{animation:floatY 7s ease-in-out infinite}
        .anim-fy2{animation:floatY2 5.5s ease-in-out 1s infinite}
        .draw-line{stroke-dasharray:1000;animation:dashDraw 2.2s ease both}

        .value-card{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease,border-color .25s}
        .value-card:hover{transform:translateY(-6px);box-shadow:0 20px 56px rgba(0,0,0,.08)}

        .team-card{transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s ease}
        .team-card:hover{transform:translateY(-8px);box-shadow:0 28px 64px rgba(0,0,0,.12)}
        .team-card:hover .team-avatar{transform:scale(1.06)}
        .team-avatar{transition:transform .4s cubic-bezier(.34,1.56,.64,1)}

        .timeline-line{background:linear-gradient(to bottom,#F97316,#EA580C,#6366F1,#10B981,#EC4899,#F59E0B,#3B82F6)}

        strong{font-weight:700;color:#111827}

        .mag-btn{transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .35s ease}
      `}</style>

      <CursorGlow />

      <div className="font-display bg-white text-gray-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-900 min-h-screen">
        <Navbar />

        {/* ╔══════════════════════════════════════════════════════╗
            §1  HERO
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="relative overflow-hidden bg-[#060912] pt-28 pb-0">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 38%,rgba(249,115,22,.13) 0%,transparent 68%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 45% at 8% 85%,rgba(99,102,241,.1) 0%,transparent 55%)" }} />

          <div className="anim-o1 absolute w-[700px] h-[700px] rounded-full bg-orange-500/8 blur-3xl -top-60 right-0 pointer-events-none" />
          <div className="anim-o2 absolute w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-3xl -left-20 bottom-0 pointer-events-none" />

          {/* SVG network */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[[8,18],[92,12],[95,66],[5,72],[50,86],[28,40],[80,46],[62,22],[18,60],[70,75]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r=".5" fill="#F97316" style={{ animation: `dotDrift ${4+i}s ease-in-out ${i*.3}s infinite` }} />
            ))}
            {([[8,18,28,40],[28,40,62,22],[62,22,92,12],[28,40,50,86],[5,72,50,86],[80,46,92,12],[18,60,50,86],[70,75,80,46]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i>4?"#6366F1":i>2?"#10B981":"#F97316"} strokeWidth=".1" className="draw-line" style={{ animationDelay: `${i*.28}s` }} />
            ))}
          </svg>

          {/* rotating ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-orange-500/6 pointer-events-none" style={{ animation: "borderRot 32s linear infinite" }} />

          <div className="relative z-10 max-w-5xl mx-auto px-6 pb-0" ref={heroRef.ref}>
            {/* badge */}
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".05s" } as React.CSSProperties}>
              <HiSparkles size={12} className="text-orange-400" />
              <span className="font-mono text-white/50 text-xs tracking-[.15em] uppercase">Our Story</span>
            </div>

            {/* headline */}
            <h1 className={`font-black text-6xl lg:text-7xl xl:text-[84px] text-white leading-[.92] tracking-tight mb-6 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".15s" } as React.CSSProperties}>
              Built from<br />
              <span className="shimmer">inside</span> the<br />
              sector.
            </h1>
            <p className={`font-serif italic text-2xl lg:text-3xl text-white/38 leading-snug max-w-2xl mb-12 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".3s" } as React.CSSProperties}>
              changeworker exists because the people doing it couldn't find the help they needed. So they built the infrastructure themselves.
            </p>

            {/* two floating cards */}
            <div className={`flex flex-wrap gap-4 pb-20 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".42s" } as React.CSSProperties}>
              <div className="anim-fy flex items-center gap-3 bg-white/6 border border-white/10 backdrop-blur-sm rounded-2xl px-5 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <TbBuildingCommunity size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-white/75 text-sm font-bold">200+ Organizations</p>
                  <p className="text-white/30 text-xs font-mono">NGOs & social enterprises</p>
                </div>
              </div>
              <div className="anim-fy2 flex items-center gap-3 bg-white/6 border border-white/10 backdrop-blur-sm rounded-2xl px-5 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <RiTeamLine size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white/75 text-sm font-bold">500+ Freelancers</p>
                  <p className="text-white/30 text-xs font-mono">Vetted impact professionals</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/6 border border-white/10 backdrop-blur-sm rounded-2xl px-5 py-3.5" style={{ animation: "floatY 9s ease-in-out 2s infinite" }}>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <FiMapPin size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white/75 text-sm font-bold">Lagos & Abuja</p>
                  <p className="text-white/30 text-xs font-mono">Nigeria-headquartered</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none" style={{ height: "80px" }}>
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §2  MISSION STATEMENT - full-width cinematic
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={missionRef.ref} className="relative py-28 overflow-hidden bg-white">
          <div className="absolute right-0 top-0 w-96 h-96 opacity-20 dot-bg pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-64 h-64 opacity-15 dot-bg pointer-events-none" />
          <div className="anim-o3 absolute w-72 h-72 rounded-full bg-orange-50 blur-3xl right-16 top-16 pointer-events-none" />

          <div className="max-w-5xl mx-auto px-6">
            <div className={`${missionRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".05s" } as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-6 block">Our mission</span>
            </div>

            <div className={`${missionRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".15s" } as React.CSSProperties}>
              <p className="font-display font-black text-4xl lg:text-5xl xl:text-6xl text-gray-900 leading-[1.05] tracking-tight mb-10 max-w-4xl">
                To make it as easy for a{" "}
                <span className="shimmer">Nigerian NGO</span>{" "}
                to find a world-class freelancer as it is to call a cab.
              </p>
            </div>

            <div className={`flex flex-col lg:flex-row gap-10 lg:gap-16 ${missionRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".28s" } as React.CSSProperties}>
              <div className="flex-1">
                <p className="text-gray-600 text-lg leading-[1.85] font-display font-normal">
                  Nigeria's social sector is full of organizations doing critical work on health, education, climate, and economic justice - with fewer resources than they need and under more pressure than any sector should bear.
                </p>
              </div>
              <div className="flex-1">
                <p className="text-gray-600 text-lg leading-[1.85] font-display font-normal">
                  The last thing these organizations should have to fight is the talent infrastructure. changeworker helps reduce that friction with profile discovery, matching, messaging, workspace delivery, and payment support - so organizations can focus on the mission.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §3  STATS - animated counters on scroll
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={statsRef.ref} className="py-20 bg-[#060912] relative overflow-hidden noise">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%,rgba(249,115,22,.1) 0%,transparent 68%)" }} />
          <div className="anim-o1 absolute w-[600px] h-[600px] rounded-full bg-orange-500/7 blur-3xl -top-40 right-0 pointer-events-none" />
          {/* wave bars decoration */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-end gap-0.5 h-20 opacity-20">
            {[40,65,85,55,90,70,45,80,60,75,50,88].map((h, i) => (
              <div key={i} className="w-1 rounded-full bg-orange-400" style={{ height: `${h}%`, animation: `waveBar ${1.2 + i * .15}s ease-in-out ${i * .1}s infinite` }} />
            ))}
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-6">
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-10 ${statsRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".05s" } as React.CSSProperties}>
              <StatCounter value={stats.clients} suffix="+" label="Client profiles" color="#F97316" start={statsRef.inView} />
              <StatCounter value={stats.freelancers} suffix="+" label="Talent profiles" color="#6366F1" start={statsRef.inView} />
              <StatCounter value={stats.projects} suffix="+" label="Published gigs" color="#10B981" start={statsRef.inView} />
              <StatCounter value={stats.satisfaction} suffix="%" label="Satisfaction rate" color="#EC4899" start={statsRef.inView} />
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §4  THE STORY - split with visual timeline sidebar
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={storyRef.ref} className="py-28 bg-[#FAFAF9] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-start">

              {/* left: story text */}
              <div>
                <div className={`${storyRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".05s" } as React.CSSProperties}>
                  <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">The origin</span>
                  <h2 className="font-display font-black text-4xl text-gray-900 mb-8 leading-tight">
                    A problem we lived,<br />
                    <span className="shimmer">then decided to fix.</span>
                  </h2>
                </div>

                <div className={`space-y-6 ${storyRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".18s" } as React.CSSProperties}>
                  <p className="text-gray-600 text-base leading-[1.9] font-display font-normal">
                    In 2022, Chidinma Okafor was deep into leading demanding impact work in Lagos. The program was doing real work, but finding reliable specialist support remained harder than it should have been.
                  </p>
                  <p className="text-gray-600 text-base leading-[1.9] font-display font-normal">
                    Then her M&E lead left to join an international NGO offering three times the salary. The organization spent four months trying to replace him - through WhatsApp groups, NGO job boards, word of mouth. Every promising candidate either wanted a permanent contract the organization couldn't offer, or lacked the sector-specific skills the program required.
                  </p>
                  <p className="text-gray-600 text-base leading-[1.9] font-display font-normal">
                    She talked to 87 other NGO leaders. Every single one had the same story. She talked to 120 freelance development professionals. Every single one had the same experience from the other side: skills, passion, willingness to work - and no structured way to find the organizations that needed them.
                  </p>

                  <div className="bg-orange-50 border-l-4 border-orange-400 rounded-xl p-5 my-6">
                    <p className="font-display font-normal text-orange-800 text-sm leading-relaxed italic">
                      "The talent exists. The need exists. The only thing missing is the infrastructure to connect them reliably, fairly, and fast. That's not a talent shortage - that's a market failure. And market failures can be solved."
                    </p>
                    <p className="font-mono text-xs text-orange-400 mt-2">- Chidinma Okafor, Co-founder & CEO</p>
                  </div>

                  <p className="text-gray-600 text-base leading-[1.9] font-display font-normal">
                    She brought in Emeka Nwofor, who'd spent five years building payment infrastructure at one of Nigeria's leading fintechs. Together, they set out to build the matching and trust layer that Nigerian civil society had always needed.
                  </p>
                  <p className="text-gray-600 text-base leading-[1.9] font-display font-normal">
                    changeworker launched in 2023 under Impactpal Africa. Not as a job board. Not as a generic freelance platform. As a curated marketplace designed specifically, intentionally, and uncompromisingly for the Nigerian social sector.
                  </p>
                </div>
              </div>

              {/* right: visual timeline */}
              <div ref={timelineRef.ref}>
                <div className="relative pl-8">
                  {/* vertical line */}
                  <div className="timeline-line absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ animationDelay: ".1s" }} />

                  <div className="flex flex-col gap-0">
                    {MILESTONES.map((m, i) => (
                      <div
                        key={i}
                        className={`relative pb-10 last:pb-0 ${timelineRef.inView ? "reveal" : "opacity-0"}`}
                        style={{ "--d": `${.05 + i * .1}s` } as React.CSSProperties}
                      >
                        {/* dot */}
                        <div
                          className="absolute -left-[calc(2rem+5px)] w-3 h-3 rounded-full border-2 border-white bg-orange-400 top-1"
                          style={{
                            animation: timelineRef.inView ? `timelineDot .5s cubic-bezier(.34,1.56,.64,1) ${.05 + i * .1}s both` : "none",
                            background: ["#F97316","#F97316","#6366F1","#10B981","#EC4899","#F59E0B","#3B82F6"][i],
                          }}
                        />
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-xs font-bold shrink-0 mt-0.5" style={{ color: ["#F97316","#F97316","#6366F1","#10B981","#EC4899","#F59E0B","#3B82F6"][i] }}>{m.year}</span>
                          <div>
                            <p className="font-display font-bold text-gray-900 text-sm mb-1">{m.title}</p>
                            <p className="text-gray-500 text-xs leading-relaxed font-display font-normal">{m.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §5  VALUES
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={valuesRef.ref} className="py-28 bg-white relative overflow-hidden">
          <div className="absolute left-0 bottom-0 w-72 h-72 opacity-20 dot-bg pointer-events-none" />
          <div className="anim-o2 absolute w-80 h-80 rounded-full bg-orange-50 blur-3xl right-0 top-0 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-16 ${valuesRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".0s" } as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">What we stand for</span>
              <h2 className="font-display font-black text-4xl lg:text-5xl text-gray-900 leading-tight">
                Six values that aren't<br />
                <span className="shimmer">wall decorations.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {VALUES.map((v, i) => {
                const Icon = v.icon
                return (
                  <div
                    key={i}
                    className={`value-card rounded-2xl border border-gray-100 bg-white p-7 flex flex-col gap-5 ${valuesRef.inView ? "reveal" : "opacity-0"}`}
                    style={{ "--d": `${.06 + i * .07}s` } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${v.color}12` }}>
                        <Icon size={22} style={{ color: v.color }} />
                      </div>
                      <span className="font-mono text-[10px] font-bold opacity-20 text-gray-500 mt-1">{v.number}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-black text-gray-900 text-lg mb-2 leading-tight">{v.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed font-display font-normal">{v.desc}</p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-50">
                      <div className="h-0.5 w-12 rounded-full" style={{ background: v.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §6  TEAM
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={teamRef.ref} className="py-28 bg-[#FAFAF9] relative overflow-hidden">
          <div className="anim-o3 absolute w-96 h-96 rounded-full bg-orange-50 blur-3xl left-0 top-0 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-16 ${teamRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".0s" } as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">The people</span>
              <h2 className="font-display font-black text-4xl lg:text-5xl text-gray-900 leading-tight">
                We've all worked in<br />
                <span className="shimmer">this sector.</span>
              </h2>
              <p className="text-gray-400 text-base font-display font-normal mt-4 max-w-xl mx-auto">
                Every member of the changeworker team has direct experience in Nigerian civil society - as program staff, funders, consultants, or researchers. We are not observers of this sector. We are part of it.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEAM.map((member, i) => (
                <div
                  key={i}
                  className={`team-card rounded-2xl bg-white border border-gray-100 overflow-hidden ${teamRef.inView ? "reveal" : "opacity-0"}`}
                  style={{ "--d": `${.06 + i * .07}s` } as React.CSSProperties}
                >
                  {/* color header */}
                  <div className="h-1.5" style={{ background: `linear-gradient(90deg,${member.color},${member.color}00)` }} />

                  <div className="p-7">
                    <div className="flex items-start gap-4 mb-5">
                      {/* avatar */}
                      <div
                        className="team-avatar w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shrink-0 shadow-lg"
                        style={{ background: `linear-gradient(135deg,${member.color},${member.color}cc)`, boxShadow: `0 8px 24px ${member.color}35` }}
                      >
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-gray-900 text-base leading-tight">{member.name}</h3>
                        <p className="font-mono text-xs mt-0.5" style={{ color: member.color }}>{member.role}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <FiMapPin size={9} className="text-gray-400" />
                          <span className="font-mono text-[10px] text-gray-400">{member.location}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed font-display font-normal mb-5">{member.bio}</p>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                      <a href={member.linkedin} className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-orange-50 transition-colors group">
                        <FiLinkedin size={13} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </a>
                      <a href={member.twitter} className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-orange-50 transition-colors group">
                        <FiTwitter size={13} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </a>
                      <a href={`mailto:${member.name.toLowerCase().split(" ")[0]}@changeworker.ng`} className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-orange-50 transition-colors group">
                        <FiMail size={13} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* hiring note */}
            <div className={`mt-10 text-center ${teamRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".55s" } as React.CSSProperties}>
              <div className="inline-flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-6 py-4">
                <div className="w-2 h-2 rounded-full bg-orange-500" style={{ animation: "pulse 2s ease-in-out infinite" }} />
                <span className="text-orange-700 text-sm font-display font-semibold">We're hiring.</span>
                <span className="text-orange-600 text-sm font-display font-normal">Sector fluent? Curious? Builder?</span>
                <a href="mailto:jobs@changeworker.ng" className="font-display font-bold text-orange-500 hover:text-orange-700 text-sm flex items-center gap-1.5 transition-colors">
                  jobs@changeworker.ng <FiArrowRight size={12} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §7  BACKERS / PARTNERS
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={backersRef.ref} className="py-20 bg-white border-t border-gray-50 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className={`${backersRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".0s" } as React.CSSProperties}>
              <span className="font-mono text-xs text-gray-400 uppercase tracking-[.25em] mb-8 block">Backed by</span>
            </div>
            <div className={`flex flex-wrap justify-center gap-4 ${backersRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".1s" } as React.CSSProperties}>
              {BACKERS.map((b, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-2xl border border-gray-100 bg-white hover:border-orange-200 transition-all duration-200 group"
                  style={{ animationDelay: `${i * .08}s` }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${b.color}15` }}>
                    <FiAward size={16} style={{ color: b.color }} />
                  </div>
                  <span className="font-display font-bold text-gray-800 text-sm">{b.name}</span>
                  <span className="font-mono text-[10px] text-gray-400">{b.type}</span>
                </div>
              ))}
            </div>
            <p className={`text-gray-400 text-xs font-mono mt-8 ${backersRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".35s" } as React.CSSProperties}>
              Partners and investors who believe in building dignified infrastructure for Nigeria's social sector.
            </p>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §8  JOIN THE MISSION CTA
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={ctaRef.ref} className="relative overflow-hidden bg-[#060912] py-32 noise">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 75% 65% at 50% 50%,rgba(249,115,22,.13) 0%,transparent 65%)" }} />
          <div className="anim-o1 absolute w-[900px] h-[900px] rounded-full bg-orange-500/7 blur-3xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-orange-500/8 pointer-events-none" style={{ animation: "borderRot 28s linear infinite" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[820px] rounded-full border border-white/3 pointer-events-none" style={{ animation: "borderRot 46s linear infinite reverse" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border border-indigo-500/4 pointer-events-none" style={{ animation: "borderRot 62s linear infinite" }} />

          {/* floating chips */}
          {[
            { text: "Impact sector", color: "#F97316", delay: "0s", x: "8%", y: "20%" },
            { text: "Nigeria-built", color: "#6366F1", delay: "1s", x: "88%", y: "15%" },
            { text: "Fair pay", color: "#10B981", delay: "2s", x: "5%", y: "75%" },
            { text: "Vetted talent", color: "#EC4899", delay: "3s", x: "85%", y: "72%" },
          ].map(({ text, color, delay, x, y }, i) => (
            <div key={i} className="absolute hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/8 backdrop-blur-sm"
              style={{ left: x, top: y, animation: `floatY ${5 + i}s ease-in-out ${delay} infinite` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="font-mono text-[10px] text-white/45">{text}</span>
            </div>
          ))}

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <div className={`${ctaRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".0s" } as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-400 uppercase tracking-[.3em] mb-6 block">Join the mission</span>
            </div>
            <h2 className={`font-display font-black text-5xl lg:text-6xl text-white leading-[.93] mb-5 ${ctaRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".12s" } as React.CSSProperties}>
              Flexible talents.<br />
              <span className="shimmer">Meaningful work.</span>
            </h2>
            <p className={`font-serif italic text-3xl text-white/35 mb-12 ${ctaRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".26s" } as React.CSSProperties}>
              Be part of what we're building.
            </p>

            <div className={`flex flex-wrap gap-4 justify-center ${ctaRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".38s" } as React.CSSProperties}>
              <a
                ref={mag1.ref}
                onMouseMove={mag1.hm}
                onMouseLeave={mag1.hl}
                href="/signup?type=org"
                className="mag-btn inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-display font-black text-base rounded-2xl group relative overflow-hidden"
                style={{ padding: "1.1rem 2.5rem", boxShadow: "0 0 60px rgba(249,115,22,.35)" }}
              >
                <TbBuildingCommunity size={18} />
                Post a project
                <FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </a>
              <a
                ref={mag2.ref}
                onMouseMove={mag2.hm}
                onMouseLeave={mag2.hl}
                href="/signup?type=freelance"
                className="mag-btn inline-flex items-center gap-2.5 border border-white/15 hover:border-orange-400/50 text-white/65 hover:text-white font-display font-black text-base rounded-2xl backdrop-blur-sm group"
                style={{ padding: "1.1rem 2.5rem" }}
              >
                <RiTeamLine size={17} />
                Join as freelancer
              </a>
            </div>

            {/* trust chips */}
            <div className={`flex flex-wrap justify-center gap-3 mt-10 ${ctaRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".5s" } as React.CSSProperties}>
              {[
                { icon: FiCheckCircle, text: "Free to register" },
                { icon: RiShieldCheckLine, text: "Escrow protected" },
                { icon: FiZap, text: "Smart matching" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/8">
                  <Icon size={11} className="text-orange-400" />
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

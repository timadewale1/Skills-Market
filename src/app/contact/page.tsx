"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  FiMail, FiMessageSquare, FiPhone, FiMapPin, FiSend,
  FiCheckCircle, FiArrowRight, FiChevronDown, FiAlertCircle,
  FiClock, FiZap, FiUsers, FiBriefcase, FiHelpCircle,
  FiShield, FiExternalLink, FiCopy, FiTwitter, FiLinkedin,
  FiInstagram, FiArrowUpRight, FiCheck
} from "react-icons/fi"
import { HiSparkles, HiLightningBolt } from "react-icons/hi"
import { TbBrandWhatsapp, TbHeadset, TbRocket, TbTargetArrow } from "react-icons/tb"
import { RiCustomerService2Line } from "react-icons/ri"
import { MdOutlineHandshake } from "react-icons/md"

/* ═══ HOOKS ═══════════════════════════════════════════════════ */
function useMousePos() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", h)
    return () => window.removeEventListener("mousemove", h)
  }, [])
  return pos
}

function useMagnet(strength = 24) {
  const ref = useRef<HTMLButtonElement>(null)
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

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
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

function useTypewriter(texts: string[], speed = 60, pause = 2200) {
  const [display, setDisplay] = useState("")
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[textIdx]
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), speed)
      return () => clearTimeout(t)
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pause)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx(c => c - 1), speed / 2.5)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx === 0) {
      setDeleting(false)
      setTextIdx(i => (i + 1) % texts.length)
    }
  }, [charIdx, deleting, textIdx, texts, speed, pause])

  useEffect(() => {
    setDisplay(texts[textIdx].slice(0, charIdx))
  }, [charIdx, textIdx, texts])

  return display
}

/* ═══ DATA ════════════════════════════════════════════════════ */
const CONTACT_REASONS = [
  { id: "org",      icon: FiBriefcase,            label: "I'm an organization looking to hire",       color: "#F97316", desc: "Post projects, find talent, get matched" },
  { id: "freelance",icon: FiUsers,                label: "I'm a freelancer looking for work",         color: "#6366F1", desc: "Join the community, get vetted, find projects" },
  { id: "support",  icon: TbHeadset,              label: "I need help with my account",               color: "#10B981", desc: "Technical issues, billing, account questions" },
  { id: "partner",  icon: MdOutlineHandshake,     label: "Partnership or collaboration",              color: "#EC4899", desc: "NGO networks, accelerators, institutional partners" },
  { id: "press",    icon: FiExternalLink,         label: "Press or media enquiry",                    color: "#F59E0B", desc: "Journalists, researchers, content creators" },
  { id: "other",    icon: FiHelpCircle,           label: "Something else",                            color: "#8B5CF6", desc: "General feedback, ideas, or just saying hi" },
]

const CHANNELS = [
  {
    icon: FiMail,
    label: "Email us",
    value: "hello@changeworker.ng",
    href: "mailto:hello@changeworker.ng",
    desc: "We respond within 24 hours",
    color: "#F97316",
    badge: "24h response",
  },
  {
    icon: TbBrandWhatsapp,
    label: "WhatsApp",
    value: "+234 800 000 0000",
    href: "https://wa.me/2348000000000",
    desc: "Mon – Fri, 9am – 6pm WAT",
    color: "#10B981",
    badge: "Business hours",
  },
  {
    icon: FiTwitter,
    label: "Twitter / X",
    value: "@changeworker_ng",
    href: "https://twitter.com/changeworker_ng",
    desc: "Quick questions & updates",
    color: "#1D9BF0",
    badge: "Public",
  },
  {
    icon: FiLinkedin,
    label: "LinkedIn",
    value: "changeworker",
    href: "https://linkedin.com/company/changeworker",
    desc: "Professional updates & news",
    color: "#0077B5",
    badge: "Professional",
  },
]

const FAQS = [
  { q: "How quickly will I get a response?",           a: "Email enquiries receive a response within 24 hours on business days. WhatsApp support is available Monday to Friday, 9am–6pm WAT. Urgent platform issues are prioritised." },
  { q: "I'm having trouble with a payment - help?",    a: "Payment issues are our highest-priority support category. Email disputes@changeworker.ng with your transaction reference and we'll investigate within 2 hours." },
  { q: "Can I schedule a demo for my organization?",   a: "Absolutely. Select 'Partnership or collaboration' in the contact form and mention you'd like a demo. We'll set up a 30-minute walk-through with a team member." },
  { q: "I want to be a vetted freelancer - how?",      a: "Click 'Find Work' on the homepage and complete the freelancer application. Our team reviews all applications personally and responds within 3 business days." },
  { q: "Is changeworker available outside Nigeria?",   a: "Currently we serve organizations and freelancers within Nigeria. We're planning expansion to other African markets - use this form to register your interest." },
]

const OFFICES = [
  { city: "Lagos",  address: "Victoria Island, Lagos State",   tag: "HQ",      color: "#F97316" },
  { city: "Abuja",  address: "Maitama, FCT Abuja",            tag: "Satellite",color: "#6366F1" },
]

const TYPEWRITER_TEXTS = [
  "say hello",
  "ask a question",
  "share an idea",
  "request a demo",
  "report an issue",
  "partner with us",
]

/* ═══ CURSOR ══════════════════════════════════════════════════ */
function CursorGlow() {
  const dot = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let tx = 0, ty = 0, cx = 0, cy = 0
    const h = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }
    window.addEventListener("mousemove", h)
    const a = () => {
      cx += (tx - cx) * .09; cy += (ty - cy) * .09
      if (dot.current) { dot.current.style.left = tx + "px"; dot.current.style.top = ty + "px" }
      if (glow.current) { glow.current.style.left = cx + "px"; glow.current.style.top = cy + "px" }
      requestAnimationFrame(a)
    }
    requestAnimationFrame(a)
    return () => window.removeEventListener("mousemove", h)
  }, [])
  return <>
    <div ref={dot}  className="fixed pointer-events-none z-[9998] w-4 h-4 rounded-full bg-orange-400/60 mix-blend-screen" style={{ transform: "translate(-50%,-50%)" }} />
    <div ref={glow} className="fixed pointer-events-none z-[9997] w-64 h-64 rounded-full" style={{ transform: "translate(-50%,-50%)", background: "radial-gradient(circle,rgba(249,115,22,.07) 0%,transparent 70%)" }} />
  </>
}

/* ═══ COPY SNIPPET ═══════════════════════════════════════════ */
function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-orange-500 transition-colors"
    >
      {copied ? <FiCheck size={9} className="text-emerald-500" /> : <FiCopy size={9} />}
      {copied ? "copied" : "copy"}
    </button>
  )
}

/* ═══ FAQ ITEM ════════════════════════════════════════════════ */
function FaqItem({ faq, idx, inView }: { faq: typeof FAQS[0]; idx: number; inView: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`border border-gray-100 rounded-2xl overflow-hidden bg-white ${inView ? "reveal" : "opacity-0"}`}
      style={{ "--d": `${.05 + idx * .08}s` } as React.CSSProperties}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-4.5 text-left hover:bg-gray-50/60 transition-colors group"
        style={{ padding: "1.1rem 1.5rem" }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-display font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
        <span
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${open ? "bg-orange-500 border-orange-500" : "border-gray-200 group-hover:border-orange-300"}`}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .35s ease, background .2s, border-color .2s" }}
        >
          <FiChevronDown size={13} style={{ color: open ? "white" : "#9CA3AF" }} />
        </span>
      </button>
      <div style={{ maxHeight: open ? "160px" : "0", transition: "max-height .42s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>
        <p className="px-6 pb-5 text-gray-500 text-sm leading-relaxed font-display font-normal">{faq.a}</p>
      </div>
    </div>
  )
}

/* ═══ REASON CARD ════════════════════════════════════════════ */
function ReasonCard({ r, selected, onSelect }: { r: typeof CONTACT_REASONS[0]; selected: boolean; onSelect: () => void }) {
  const Icon = r.icon
  return (
    <button
      onClick={onSelect}
      className="w-full text-left flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-250 group"
      style={{
        borderColor: selected ? `${r.color}50` : "#F3F4F6",
        background: selected ? `${r.color}06` : "white",
        transform: selected ? "scale(1.01)" : "scale(1)",
        boxShadow: selected ? `0 4px 20px ${r.color}18` : "none",
        transition: "all .25s cubic-bezier(.22,1,.36,1)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-250"
        style={{ background: selected ? `${r.color}18` : "#F9FAFB" }}
      >
        <Icon size={16} style={{ color: selected ? r.color : "#9CA3AF", transition: "color .2s" }} />
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-gray-900 text-xs leading-tight mb-0.5">{r.label}</p>
        <p className="text-gray-400 text-[10px] font-display">{r.desc}</p>
      </div>
      <div className="ml-auto shrink-0 mt-1">
        <div
          className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200"
          style={{ borderColor: selected ? r.color : "#D1D5DB", background: selected ? r.color : "transparent" }}
        >
          {selected && <FiCheck size={8} className="text-white" />}
        </div>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function ContactPage() {
  const scrollY = useScrollY()
  const mouse   = useMousePos()

  const formRef    = useInView(.05)
  const channelsRef= useInView()
  const faqRef     = useInView()
  const officeRef  = useInView()

  const typewriter = useTypewriter(TYPEWRITER_TEXTS, 65, 2000)

  // Form state
  const [reason, setReason]       = useState("")
  const [name, setName]           = useState("")
  const [email, setEmail]         = useState("")
  const [org, setOrg]             = useState("")
  const [subject, setSubject]     = useState("")
  const [message, setMessage]     = useState("")
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [submitting, setSubmitting]= useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [charCount, setCharCount] = useState(0)

  const mag = useMagnet(22)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!reason)             e.reason  = "Please select a reason for contacting us"
    if (!name.trim())        e.name    = "Your name is required"
    if (!email.trim())       e.email   = "Your email address is required"
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Please enter a valid email address"
    if (!message.trim())     e.message = "Please write your message"
    else if (message.length < 20) e.message = "Message must be at least 20 characters"
    return e
  }

  const handleSubmit = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1800))
    setSubmitting(false)
    setSubmitted(true)
    try {
      const confetti = (await import("canvas-confetti")).default
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.55 }, colors: ["#F97316","#EA580C","#FB923C","#FCD34D","#fff"] })
    } catch {}
  }

  const selectedReason = CONTACT_REASONS.find(r => r.id === reason)

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

        @keyframes fadeUp    { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeLeft  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeScale { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
        @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes floatY2   { 0%,100%{transform:translateY(0)rotate(0)} 50%{transform:translateY(-10px)rotate(2deg)} }
        @keyframes orb1      { 0%,100%{transform:translate(0,0)scale(1)} 35%{transform:translate(50px,-55px)scale(1.1)} 70%{transform:translate(-30px,30px)scale(.92)} }
        @keyframes orb2      { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,40px)scale(.92)} }
        @keyframes orb3      { 0%,100%{transform:translate(0,0)scale(1)} 55%{transform:translate(25px,45px)scale(1.07)} }
        @keyframes shimTxt   { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes borderRot { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes ping      { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dashDraw  { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
        @keyframes dotDrift  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes successPop{ 0%{opacity:0;transform:scale(.7) translateY(20px)} 70%{transform:scale(1.05) translateY(-4px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes lineGrow  { from{width:0} to{width:100%} }
        @keyframes countUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes waveRipple{ 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.5);opacity:0} }
        @keyframes shakeBit  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes inputFocus{ from{transform:scaleX(0)} to{transform:scaleX(1)} }

        .reveal   { opacity:0; animation:fadeUp .75s cubic-bezier(.22,1,.36,1) var(--d,0s) both; }
        .reveal-l { opacity:0; animation:fadeLeft .75s cubic-bezier(.22,1,.36,1) var(--d,0s) both; }
        .reveal-s { opacity:0; animation:fadeScale .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both; }

        .shimmer {
          background: linear-gradient(90deg,#F97316 0%,#EA580C 15%,#FB923C 40%,#FCD34D 55%,#FB923C 70%,#EA580C 85%,#F97316 100%);
          background-size: 600px 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimTxt 3s linear infinite;
        }

        .grid-dark  { background-image: linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px); background-size: 56px 56px; }
        .dot-bg     { background-image: radial-gradient(rgba(249,115,22,.14) 1.5px,transparent 1.5px); background-size: 26px 26px; }

        .anim-o1  { animation: orb1 14s ease-in-out infinite; }
        .anim-o2  { animation: orb2 18s ease-in-out infinite; }
        .anim-o3  { animation: orb3 11s ease-in-out infinite; }
        .anim-fy  { animation: floatY 7s ease-in-out infinite; }
        .anim-fy2 { animation: floatY2 5s ease-in-out infinite; }

        .cursor-blink::after { content:'|'; animation: blink .75s step-end infinite; }

        .input-field {
          width: 100%;
          background: #F9FAFB;
          border: 1.5px solid #F3F4F6;
          border-radius: 12px;
          padding: .85rem 1rem;
          font-family: 'Sora', sans-serif;
          font-size: .875rem;
          color: #111827;
          outline: none;
          transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
        }
        .input-field::placeholder { color: #C4C9D4; }
        .input-field:focus {
          border-color: #F97316;
          background: white;
          box-shadow: 0 0 0 4px rgba(249,115,22,.08);
        }
        .input-field.error {
          border-color: #EF4444;
          background: #FFF5F5;
          animation: shakeBit .4s ease;
        }
        .input-field.error:focus { box-shadow: 0 0 0 4px rgba(239,68,68,.08); }

        textarea.input-field { resize: none; min-height: 120px; line-height: 1.7; }

        .channel-card { transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .2s ease; }
        .channel-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(0,0,0,.09); }

        .success-anim { animation: successPop .6s cubic-bezier(.34,1.56,.64,1) both; }

        .noise::after { content:''; position:absolute; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"); pointer-events:none; opacity:.7; z-index:0; }

        .draw-line { stroke-dasharray:1000; animation:dashDraw 2s ease both; }

        .label-text { font-family:'Sora',sans-serif; font-size:.75rem; font-weight:600; color:#374151; margin-bottom:.45rem; display:block; letter-spacing:.01em; }
        .error-text { font-family:'JetBrains Mono',monospace; font-size:.7rem; color:#EF4444; margin-top:.4rem; display:flex; align-items:center; gap:.35rem; }

        strong { font-weight: 700; color: #111827; }
      `}</style>

      <CursorGlow />

      <div className="font-display bg-white text-gray-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-900 min-h-screen">
        <Navbar />

        {/* ╔══════════════════════════════════════════════════════╗
            §1  HERO
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="relative overflow-hidden bg-[#060912] pt-28 pb-0 min-h-[480px] flex flex-col justify-end">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 65% at 50% 40%,rgba(249,115,22,.12) 0%,transparent 68%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 45% 50% at 10% 90%,rgba(99,102,241,.1) 0%,transparent 55%)" }} />

          {/* orbs */}
          <div className="absolute anim-o1 w-[700px] h-[700px] rounded-full bg-orange-500/8 blur-3xl -top-60 right-0 pointer-events-none" />
          <div className="absolute anim-o2 w-[450px] h-[450px] rounded-full bg-indigo-500/8 blur-3xl bottom-0 -left-20 pointer-events-none" />

          {/* SVG nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: .12 }} viewBox="0 0 100 100" preserveAspectRatio="none">
            {[[8,15],[92,10],[95,65],[5,70],[50,85],[30,40],[78,45],[60,20],[20,58]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r=".5" fill="#F97316"
                style={{ animation: `dotDrift ${4+i}s ease-in-out ${i*.35}s infinite` }} />
            ))}
            {([[8,15,30,40],[30,40,60,20],[30,40,50,85],[60,20,92,10],[5,70,50,85],[92,10,95,65],[20,58,78,45]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={i>4?"#6366F1":i>2?"#10B981":"#F97316"} strokeWidth=".1"
                className="draw-line" style={{ animationDelay: `${i*.3}s` }} />
            ))}
          </svg>

          {/* rotating ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-orange-500/6 pointer-events-none"
            style={{ animation: "borderRot 30s linear infinite" }} />

          <div className="relative z-10 max-w-5xl mx-auto px-6 pb-16 w-full">
            {/* badge */}
            <div className="entry inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8" style={{ animationDelay: ".05s" }}>
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative rounded-full w-2 h-2 bg-orange-500" />
              </span>
              <span className="text-white/50 text-xs font-mono tracking-[.15em] uppercase">We're here to help</span>
            </div>

            {/* headline */}
            <h1 className="entry font-display font-black text-6xl lg:text-7xl xl:text-[84px] text-white leading-[.93] tracking-tight mb-5" style={{ animationDelay: ".15s" }}>
              Let's{" "}
              <span className="shimmer cursor-blink">{typewriter || "\u00A0"}</span>
            </h1>
            <p className="entry font-serif italic text-3xl lg:text-4xl text-white/38 mb-0 leading-tight" style={{ animationDelay: ".3s" }}>
              changeworker is a message away.
            </p>

            {/* response time chips */}
            <div className="entry flex flex-wrap gap-3 mt-10" style={{ animationDelay: ".44s" }}>
              {[
                { icon: FiZap,    text: "Email replies in 24h",     color: "#F97316" },
                { icon: TbBrandWhatsapp, text: "WhatsApp 9am–6pm",  color: "#10B981" },
                { icon: FiShield, text: "Secure & private",         color: "#6366F1" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/8 backdrop-blur-sm">
                  <Icon size={12} style={{ color }} />
                  <span className="text-white/45 text-xs font-display">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* wave cut */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: "80px" }}>
            <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §2  MAIN: FORM + SIDEBAR
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="relative bg-white pt-8 pb-24 overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 opacity-30 dot-bg pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-64 h-64 opacity-20 dot-bg pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-[1fr_380px] gap-12 xl:gap-16 items-start" ref={formRef.ref}>

              {/* ── LEFT: FORM ── */}
              <div>
                {!submitted ? (
                  <div>
                    {/* STEP 1: reason */}
                    <div className={`mb-10 ${formRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".1s" } as React.CSSProperties}>
                      <p className="font-mono text-xs text-orange-500 uppercase tracking-[.22em] mb-2">Step 1 of 3</p>
                      <h2 className="font-display font-black text-2xl text-gray-900 mb-1">What brings you here?</h2>
                      <p className="text-gray-400 text-sm font-display font-normal mb-6">Select the option that best describes your reason for reaching out.</p>

                      {errors.reason && (
                        <p className="error-text mb-4">
                          <FiAlertCircle size={11} />{errors.reason}
                        </p>
                      )}

                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {CONTACT_REASONS.map(r => (
                          <ReasonCard key={r.id} r={r} selected={reason === r.id} onSelect={() => { setReason(r.id); setErrors(e => ({ ...e, reason: "" })) }} />
                        ))}
                      </div>
                    </div>

                    {/* STEP 2: details */}
                    <div className={`mb-10 ${formRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".22s" } as React.CSSProperties}>
                      <p className="font-mono text-xs text-orange-500 uppercase tracking-[.22em] mb-2">Step 2 of 3</p>
                      <h2 className="font-display font-black text-2xl text-gray-900 mb-1">Your details</h2>
                      <p className="text-gray-400 text-sm font-display font-normal mb-6">So we know who we're talking to.</p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* name */}
                        <div>
                          <label className="label-text">Full name *</label>
                          <input
                            type="text"
                            placeholder="Chioma Okafor"
                            value={name}
                            onChange={e => { setName(e.target.value); setErrors(err => ({ ...err, name: "" })) }}
                            className={`input-field ${errors.name ? "error" : ""}`}
                          />
                          {errors.name && <p className="error-text"><FiAlertCircle size={10} />{errors.name}</p>}
                        </div>

                        {/* email */}
                        <div>
                          <label className="label-text">Email address *</label>
                          <input
                            type="email"
                            placeholder="you@organisation.ng"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setErrors(err => ({ ...err, email: "" })) }}
                            className={`input-field ${errors.email ? "error" : ""}`}
                          />
                          {errors.email && <p className="error-text"><FiAlertCircle size={10} />{errors.email}</p>}
                        </div>

                        {/* org (optional) */}
                        <div>
                          <label className="label-text">Organisation <span className="text-gray-300 font-normal">(optional)</span></label>
                          <input
                            type="text"
                            placeholder="GreenAfrica NGO"
                            value={org}
                            onChange={e => setOrg(e.target.value)}
                            className="input-field"
                          />
                        </div>

                        {/* subject */}
                        <div>
                          <label className="label-text">Subject <span className="text-gray-300 font-normal">(optional)</span></label>
                          <input
                            type="text"
                            placeholder="Brief topic summary"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: message */}
                    <div className={`mb-8 ${formRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".34s" } as React.CSSProperties}>
                      <p className="font-mono text-xs text-orange-500 uppercase tracking-[.22em] mb-2">Step 3 of 3</p>
                      <h2 className="font-display font-black text-2xl text-gray-900 mb-1">Your message</h2>
                      <p className="text-gray-400 text-sm font-display font-normal mb-6">Tell us as much or as little as you like. We read every message.</p>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="label-text" style={{ margin: 0 }}>Message *</label>
                          <span className={`font-mono text-[10px] transition-colors ${charCount > 800 ? "text-red-400" : charCount > 500 ? "text-amber-400" : "text-gray-300"}`}>
                            {charCount}/1000
                          </span>
                        </div>
                        <textarea
                          placeholder={
                            reason === "org"       ? "Tell us about your organisation, the type of talent you're looking for, and your typical project size..." :
                            reason === "freelance" ? "Tell us about your background, skills, and the kind of impact work you're passionate about..." :
                            reason === "support"   ? "Describe the issue you're experiencing. Include any error messages, account details, or transaction references..." :
                            reason === "partner"   ? "Tell us about your organisation and what type of partnership you have in mind..." :
                            reason === "press"     ? "Share your publication and the angle or story you're exploring..." :
                            "How can we help you? Don't be shy - we love hearing from our community."
                          }
                          value={message}
                          onChange={e => {
                            const v = e.target.value.slice(0, 1000)
                            setMessage(v)
                            setCharCount(v.length)
                            setErrors(err => ({ ...err, message: "" }))
                          }}
                          className={`input-field ${errors.message ? "error" : ""}`}
                          style={{ minHeight: "148px" }}
                        />
                        {errors.message && <p className="error-text"><FiAlertCircle size={10} />{errors.message}</p>}
                      </div>
                    </div>

                    {/* SUBMIT */}
                    <div className={`flex items-center gap-5 ${formRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".44s" } as React.CSSProperties}>
                      <button
                        ref={mag.ref}
                        onMouseMove={mag.hm}
                        onMouseLeave={mag.hl}
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="relative overflow-hidden inline-flex items-center gap-3 font-display font-black text-base text-white rounded-2xl transition-all duration-200 group disabled:opacity-70"
                        style={{
                          padding: "1.05rem 2.4rem",
                          background: submitting ? "#EA580C" : "linear-gradient(135deg,#F97316,#EA580C)",
                          boxShadow: submitting ? "none" : "0 8px 32px rgba(249,115,22,.38)",
                          transition: "transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease",
                        }}
                      >
                        {submitting ? (
                          <>
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send message
                            <FiSend size={16} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                          </>
                        )}
                        {/* shimmer sweep */}
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      </button>

                      <p className="text-gray-400 text-xs font-display leading-tight">
                        No spam, ever.<br />We reply to every message.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ── SUCCESS STATE ── */
                  <div className="success-anim flex flex-col items-center text-center py-20 px-8">
                    {/* animated check */}
                    <div className="relative mb-8">
                      <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
                        <FiCheckCircle size={44} className="text-emerald-500" />
                      </div>
                      {[0,1,2].map(i => (
                        <div key={i} className="absolute inset-0 rounded-full border-2 border-emerald-400"
                          style={{ animation: `waveRipple 2s ease-out ${i * .5}s infinite` }} />
                      ))}
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 mb-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-mono text-xs text-emerald-700 uppercase tracking-wider">Message received</span>
                    </div>

                    <h2 className="font-display font-black text-4xl text-gray-900 mb-4 leading-tight">
                      We've got your<br /><span className="shimmer">message!</span>
                    </h2>
                    <p className="text-gray-500 text-base leading-relaxed max-w-md font-display font-normal mb-8">
                      Thank you, <strong>{name.split(" ")[0]}</strong>. A member of our team will get back to you at <strong>{email}</strong> within 24 hours on business days.
                    </p>

                    {selectedReason && (
                      <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border mb-10"
                        style={{ background: `${selectedReason.color}08`, borderColor: `${selectedReason.color}25` }}>
                        <selectedReason.icon size={14} style={{ color: selectedReason.color }} />
                        <span className="text-sm font-display font-semibold" style={{ color: selectedReason.color }}>{selectedReason.label}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={() => { setSubmitted(false); setName(""); setEmail(""); setOrg(""); setSubject(""); setMessage(""); setReason(""); setCharCount(0) }}
                        className="inline-flex items-center gap-2 border border-gray-200 hover:border-orange-300 text-gray-600 hover:text-orange-600 font-display font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200"
                      >
                        Send another message
                      </button>
                      <a href="/"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-display font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200">
                        Back to home <FiArrowRight size={13} />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT: SIDEBAR INFO ── */}
              <div className="flex flex-col gap-6 lg:pt-2">

                {/* response times */}
                <div className={`${formRef.inView ? "reveal-l" : "opacity-0"}`} style={{ "--d": ".15s" } as React.CSSProperties}>
                  <div className="rounded-2xl border border-gray-100 bg-[#FAFAF9] p-6 overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" style={{ backgroundSize: "200%", animation: "gradShift 3s ease infinite" }} />
                    <p className="font-mono text-[10px] text-orange-500 uppercase tracking-[.22em] mb-5">Response times</p>
                    <div className="space-y-4">
                      {[
                        { label: "General enquiries", time: "< 24 hours",   bar: 90, color: "#F97316" },
                        { label: "Support tickets",   time: "< 12 hours",   bar: 95, color: "#6366F1" },
                        { label: "Payment disputes",  time: "< 2 hours",    bar: 99, color: "#10B981" },
                        { label: "Press / media",     time: "< 48 hours",   bar: 75, color: "#EC4899" },
                      ].map(({ label, time, bar, color }) => (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-gray-600 text-xs font-display font-medium">{label}</span>
                            <span className="font-mono text-xs font-bold" style={{ color }}>{time}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${bar}%`, background: color, transition: "width 1.5s cubic-bezier(.22,1,.36,1)" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* office hours */}
                <div className={`${formRef.inView ? "reveal-l" : "opacity-0"}`} style={{ "--d": ".25s" } as React.CSSProperties}>
                  <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <FiClock size={14} className="text-orange-400" />
                      <p className="font-mono text-[10px] text-gray-400 uppercase tracking-[.22em]">Office hours</p>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { day: "Monday – Friday",   hours: "9:00 AM – 6:00 PM",   tz: "WAT",  active: true  },
                        { day: "Saturday",          hours: "10:00 AM – 2:00 PM",  tz: "WAT",  active: false },
                        { day: "Sunday & Holidays", hours: "Closed",              tz: "",     active: false },
                      ].map(({ day, hours, tz, active }) => (
                        <div key={day} className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${active ? "bg-orange-50 border border-orange-100" : "bg-gray-50"}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-orange-500" : "bg-gray-300"}`} style={active ? { animation: "ping .75s cubic-bezier(0,0,.2,1) infinite", boxShadow: "0 0 6px rgba(249,115,22,.5)" } : {}} />
                            <span className={`text-xs font-display font-medium ${active ? "text-orange-700" : "text-gray-500"}`}>{day}</span>
                          </div>
                          <span className={`font-mono text-[10px] ${active ? "text-orange-500 font-bold" : "text-gray-400"}`}>{hours}{tz ? ` ${tz}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* quick email */}
                <div className={`${formRef.inView ? "reveal-l" : "opacity-0"}`} style={{ "--d": ".35s" } as React.CSSProperties}>
                  <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <p className="font-mono text-[10px] text-gray-400 uppercase tracking-[.22em] mb-4">Direct email</p>
                    <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                      <FiMail size={14} className="text-orange-400 shrink-0" />
                      <span className="font-mono text-sm text-gray-700 flex-1 truncate">hello@changeworker.ng</span>
                      <CopyChip value="hello@changeworker.ng" />
                    </div>
                    <a href="mailto:hello@changeworker.ng"
                      className="mt-3 flex items-center justify-center gap-2 w-full border border-orange-200 hover:bg-orange-50 text-orange-600 font-display font-bold text-sm py-2.5 rounded-xl transition-all duration-200 group">
                      <FiArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      Open in email client
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §3  CHANNELS
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={channelsRef.ref} className="relative py-24 bg-[#FAFAF9] overflow-hidden">
          <div className="absolute anim-o3 w-80 h-80 rounded-full bg-orange-50 blur-3xl right-0 top-0 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-14 ${channelsRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".0s" } as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Other ways to reach us</span>
              <h2 className="font-display text-4xl font-black text-gray-900">
                Choose your channel
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CHANNELS.map((ch, i) => {
                const Icon = ch.icon
                return (
                  <a
                    key={i}
                    href={ch.href}
                    target={ch.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`channel-card group rounded-2xl border border-gray-100 bg-white p-7 flex flex-col gap-4 cursor-pointer ${channelsRef.inView ? "reveal" : "opacity-0"}`}
                    style={{ "--d": `${.08 + i * .08}s` } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${ch.color}12` }}>
                        <Icon size={22} style={{ color: ch.color }} />
                      </div>
                      <span className="font-mono text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: `${ch.color}10`, color: ch.color }}>
                        {ch.badge}
                      </span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-gray-900 text-base mb-1">{ch.label}</p>
                      <p className="font-mono text-xs text-gray-500 mb-2">{ch.value}</p>
                      <p className="text-gray-400 text-xs font-display">{ch.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-auto text-xs font-display font-bold transition-colors duration-200 group-hover:gap-2.5" style={{ color: ch.color }}>
                      Get in touch <FiArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §4  OFFICES
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={officeRef.ref} className="relative py-24 bg-white overflow-hidden">
          <div className="absolute left-0 bottom-0 w-72 h-72 opacity-25 dot-bg pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-10 items-center">

              {/* left: text */}
              <div>
                <div className={`${officeRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".0s" } as React.CSSProperties}>
                  <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Where we are</span>
                  <h2 className="font-display text-4xl font-black text-gray-900 mb-4">
                    Nigerian-built,<br /><span className="shimmer">Nigeria-first.</span>
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed font-display font-normal max-w-sm mb-8">
                    We're proudly headquartered in Lagos with a growing presence across Nigeria. Every decision we make is rooted in the Nigerian nonprofit and social sector context.
                  </p>
                </div>

                <div className="space-y-4">
                  {OFFICES.map((o, i) => (
                    <div
                      key={o.city}
                      className={`flex items-center gap-4 p-5 rounded-2xl border bg-white card-lift ${officeRef.inView ? "reveal" : "opacity-0"}`}
                      style={{ "--d": `${.15 + i * .1}s`, borderColor: "#F3F4F6" } as React.CSSProperties}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${o.color}12` }}>
                        <FiMapPin size={18} style={{ color: o.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-display font-bold text-gray-900 text-sm">{o.city}</p>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${o.color}12`, color: o.color }}>{o.tag}</span>
                        </div>
                        <p className="text-gray-400 text-xs font-display">{o.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* right: map placeholder / abstract */}
              <div className={`${officeRef.inView ? "reveal-l" : "opacity-0"}`} style={{ "--d": ".2s" } as React.CSSProperties}>
                <div className="relative rounded-3xl overflow-hidden bg-[#060912] h-72 lg:h-80">
                  <div className="absolute inset-0 grid-dark" />
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%,rgba(249,115,22,.1) 0%,transparent 70%)" }} />
                  <div className="absolute anim-o1 w-72 h-72 rounded-full bg-orange-500/8 blur-3xl -top-20 -right-20" />

                  {/* Nigeria outline dots */}
                  <svg viewBox="0 0 300 280" className="absolute inset-0 w-full h-full opacity-30" style={{ padding: "24px" }}>
                    {/* Simplified Nigeria coastline/border dots */}
                    {[
                      [120,40],[145,35],[170,38],[195,45],[215,55],[225,70],[230,90],
                      [228,110],[220,130],[210,148],[200,162],[185,170],[170,178],
                      [155,185],[140,182],[125,180],[108,172],[95,160],[85,148],
                      [78,132],[72,115],[70,98],[75,82],[85,68],[98,55],[110,46],
                    ].map(([x,y],i)=>(
                      <circle key={i} cx={x} cy={y} r="2" fill="#F97316"
                        style={{animation:`dotDrift ${4+i*.4}s ease-in-out ${i*.2}s infinite`,opacity:.6}}/>
                    ))}
                    {/* Lagos marker */}
                    <circle cx="108" cy="165" r="5" fill="#F97316" style={{animation:"ping .75s cubic-bezier(0,0,.2,1) infinite"}} opacity=".4"/>
                    <circle cx="108" cy="165" r="4" fill="#F97316"/>
                    {/* Abuja marker */}
                    <circle cx="150" cy="128" r="4" fill="#6366F1" style={{animation:"ping .75s cubic-bezier(0,0,.2,1) .4s infinite"}} opacity=".4"/>
                    <circle cx="150" cy="128" r="3" fill="#6366F1"/>
                    {/* connecting line */}
                    <line x1="108" y1="165" x2="150" y2="128" stroke="#F97316" strokeWidth=".8" strokeDasharray="4 3" opacity=".4"/>
                  </svg>

                  {/* labels */}
                  <div className="absolute bottom-6 left-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="font-mono text-xs text-white/50">Lagos HQ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-mono text-xs text-white/50">Abuja Office</span>
                    </div>
                  </div>

                  <div className="absolute top-6 right-6">
                    <span className="font-mono text-[10px] text-white/20 uppercase tracking-widest">Nigeria</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §5  FAQ
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={faqRef.ref} className="relative py-24 bg-[#FAFAF9] overflow-hidden">
          <div className="absolute anim-o2 w-80 h-80 rounded-full bg-orange-50 blur-3xl left-0 bottom-0 pointer-events-none" />
          <div className="max-w-3xl mx-auto px-6">
            <div className={`text-center mb-14 ${faqRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".0s" } as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Common questions</span>
              <h2 className="font-display text-4xl font-black text-gray-900">
                Before you write,<br /><span className="shimmer">check these.</span>
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {FAQS.map((f, i) => (
                <FaqItem key={i} faq={f} idx={i} inView={faqRef.inView} />
              ))}
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §6  CTA STRIP
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="relative overflow-hidden bg-[#060912] py-28 noise">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%,rgba(249,115,22,.12) 0%,transparent 65%)" }} />
          <div className="absolute anim-o1 w-[800px] h-[800px] rounded-full bg-orange-500/7 blur-3xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-orange-500/8 pointer-events-none" style={{ animation: "borderRot 28s linear infinite" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/3 pointer-events-none" style={{ animation: "borderRot 45s linear infinite reverse" }} />

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <p className="font-mono text-xs text-orange-400 uppercase tracking-[.3em] mb-6 entry" style={{ animationDelay: ".05s" }}>
              Not sure where to start?
            </p>
            <h2 className="entry font-display font-black text-5xl lg:text-6xl text-white leading-[.95] mb-4" style={{ animationDelay: ".15s" }}>
              Just say hello.
            </h2>
            <p className="entry font-serif italic text-3xl text-white/38 mb-10" style={{ animationDelay: ".28s" }}>
              We'll figure out the rest together.
            </p>
            <div className="entry flex flex-wrap gap-4 justify-center" style={{ animationDelay: ".4s" }}>
              <a href="mailto:hello@changeworker.ng"
                className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-display font-black px-10 py-4.5 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,.35)] transition-all duration-200 group"
                style={{ padding: "1.1rem 2.5rem" }}>
                <FiMail size={17} />
                hello@changeworker.ng
                <FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />

      </div>
    </>
  )
}
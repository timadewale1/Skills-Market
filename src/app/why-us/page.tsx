"use client"

import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { useEffect, useRef, useState } from "react"
import { whyUsLinks } from "@/data/navCategories"
import { slugify } from "@/lib/navSlug"
import {
  FiArrowRight, FiCheckCircle, FiStar, FiZap, FiShield,
  FiUsers, FiTrendingUp, FiBook, FiAward, FiLayers
} from "react-icons/fi"
import { HiSparkles } from "react-icons/hi"
import { TbRocket, TbBuildingCommunity, TbHeartHandshake, TbTargetArrow } from "react-icons/tb"
import { RiTeamLine, RiShieldCheckLine } from "react-icons/ri"

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

// enriched card meta: icons, colors, accent lines per why-us link
const CARD_META = [
  {
    icon: FiStar,
    color: "#F97316",
    tag: "Social proof",
    stat: "200+ orgs",
    statLabel: "served",
    bullet: ["Real project outcomes","Verified client stories","Impact metrics included"],
  },
  {
    icon: TbBuildingCommunity,
    color: "#6366F1",
    tag: "Client guide",
    stat: "4 steps",
    statLabel: "to get started",
    bullet: ["Role selection guide","Scope & agreement tips","Secure funding flow"],
  },
  {
    icon: FiStar,
    color: "#10B981",
    tag: "Community trust",
    stat: "98%",
    statLabel: "satisfaction rate",
    bullet: ["Verified mutual reviews","Outcome-focused feedback","Reputation building"],
  },
  {
    icon: RiTeamLine,
    color: "#EC4899",
    tag: "Talent guide",
    stat: "Instant",
    statLabel: "matching on post",
    bullet: ["Profile optimisation tips","Proposal best practices","Secure payout guide"],
  },
  {
    icon: FiBook,
    color: "#F59E0B",
    tag: "Resources",
    stat: "Free",
    statLabel: "access always",
    bullet: ["Hiring playbooks","Proposal templates","Escrow & fee guides"],
  },
]

const TRUST_PILLARS = [
  { icon: FiShield, color: "#F97316", title: "Escrow on every gig", desc: "Funds are secured before work begins. Payment releases only when deliverables are approved." },
  { icon: RiShieldCheckLine, color: "#6366F1", title: "Verified talent profiles", desc: "Every freelancer is personally vetted — identity, skills, and sector track record confirmed." },
  { icon: FiZap, color: "#10B981", title: "Instant matching", desc: "The moment a gig is posted, our engine surfaces the most relevant talent automatically." },
  { icon: TbHeartHandshake, color: "#EC4899", title: "Fair pay enforced", desc: "We set and enforce minimum rate floors. 'For the mission' is never a substitute for fair pay." },
]

export default function WhyUsLanding() {
  const heroRef   = useInView(0.05)
  const trustRef  = useInView(0.07)
  const cardsRef  = useInView(0.05)
  const ctaRef    = useInView(0.1)
  const scrollY   = useScrollY()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        .fd{font-family:'Sora',sans-serif}
        .fs{font-family:'Instrument Serif',serif}
        .fm{font-family:'JetBrains Mono',monospace}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#F97316;border-radius:3px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeLeft{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimTxt{0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes orb1{0%,100%{transform:translate(0,0)}40%{transform:translate(52px,-52px)scale(1.08)}80%{transform:translate(-28px,28px)scale(.93)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-42px,40px)scale(.91)}}
        @keyframes dotDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes borderRot{to{transform:rotate(360deg)}}
        @keyframes dashDraw{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
        @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
        @keyframes arrowBounce{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}

        .reveal{opacity:0;animation:fadeUp .75s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .reveal-l{opacity:0;animation:fadeLeft .75s cubic-bezier(.22,1,.36,1) var(--d,0s) both}

        .shimmer{background:linear-gradient(90deg,#F97316,#EA580C,#FB923C,#FCD34D,#FB923C,#EA580C,#F97316);background-size:600px 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimTxt 3s linear infinite}
        .grid-dark{background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:56px 56px}
        .dot-bg{background-image:radial-gradient(rgba(249,115,22,.13) 1.5px,transparent 1.5px);background-size:26px 26px}
        .noise::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:0}
        .anim-o1{animation:orb1 14s ease-in-out infinite}
        .anim-o2{animation:orb2 18s ease-in-out infinite}
        .draw-line{stroke-dasharray:1000;animation:dashDraw 2.2s ease both}

        .why-card{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease,border-color .2s}
        .why-card:hover{transform:translateY(-6px);box-shadow:0 20px 56px rgba(0,0,0,.09)}
        .why-card:hover .card-arrow{animation:arrowBounce .5s ease infinite}

        .trust-card{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s ease}
        .trust-card:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(0,0,0,.07)}

        strong{font-weight:700;color:#111827}
      `}</style>

      <div className="fd bg-white text-gray-900 min-h-screen overflow-x-hidden selection:bg-orange-100 selection:text-orange-900">
        <Navbar />

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#060912] pt-28 pb-0">
          <div className="absolute inset-0 grid-dark"/>
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 80% 70% at 50% 38%,rgba(249,115,22,.12) 0%,transparent 68%)"}}/>
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 35% 45% at 90% 80%,rgba(99,102,241,.08) 0%,transparent 55%)"}}/>
          <div className="anim-o1 absolute w-[700px] h-[700px] rounded-full bg-orange-500/8 blur-3xl -top-60 right-0 pointer-events-none"/>
          <div className="anim-o2 absolute w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-3xl -left-20 bottom-0 pointer-events-none"/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full border border-orange-500/6 pointer-events-none" style={{animation:"borderRot 32s linear infinite"}}/>

          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[[8,18],[92,12],[95,66],[5,72],[50,86],[28,40],[80,46],[62,22]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r=".5" fill="#F97316" style={{animation:`dotDrift ${4+i}s ease-in-out ${i*.3}s infinite`}}/>
            ))}
            {([[8,18,28,40],[28,40,62,22],[62,22,92,12],[28,40,50,86],[5,72,50,86]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i>2?"#6366F1":i>1?"#10B981":"#F97316"} strokeWidth=".1" className="draw-line" style={{animationDelay:`${i*.25}s`}}/>
            ))}
          </svg>

          <div className="relative z-10 max-w-5xl mx-auto px-6 pb-0" ref={heroRef.ref}>
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".05s"} as React.CSSProperties}>
              <HiSparkles size={12} className="text-orange-400"/>
              <span className="fm text-white/50 text-xs tracking-[.15em] uppercase">Why changeworker</span>
            </div>

            <h1 className={`font-black text-6xl lg:text-7xl xl:text-[84px] text-white leading-[.92] tracking-tight mb-5 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".15s"} as React.CSSProperties}>
              Everything you need<br />to do<br /><span className="shimmer">impact work right.</span>
            </h1>

            <p className={`fs italic text-2xl lg:text-3xl text-white/38 mb-10 max-w-2xl ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".28s"} as React.CSSProperties}>
              From finding the right talent to securing payment — we've built the infrastructure that Nigeria's social sector was missing.
            </p>

            {/* stat chips */}
            <div className={`flex flex-wrap gap-3 pb-20 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".4s"} as React.CSSProperties}>
              {[
                {v:"200+",l:"Organizations",color:"#F97316"},
                {v:"500+",l:"Vetted talent",color:"#6366F1"},
                {v:"98%",l:"Satisfaction",color:"#10B981"},
                {v:"₦0",l:"Unpaid invoices",color:"#EC4899"},
              ].map(({v,l,color})=>(
                <div key={l} className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="fm font-bold text-sm" style={{color}}>{v}</span>
                  <span className="text-white/40 text-xs">{l}</span>
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

        {/* ── TRUST PILLARS (4-up, light) ── */}
        <section ref={trustRef.ref} className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className={`fm text-xs text-orange-500 uppercase tracking-[.25em] mb-8 ${trustRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
              Our foundation
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TRUST_PILLARS.map(({icon:Icon,color,title,desc},i)=>(
                <div
                  key={i}
                  className={`trust-card rounded-2xl border border-gray-100 bg-white p-6 flex flex-col gap-4 ${trustRef.inView?"reveal":"opacity-0"}`}
                  style={{"--d":`${.05+i*.08}s`} as React.CSSProperties}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${color}12`}}>
                    <Icon size={18} style={{color}}/>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm mb-1.5">{title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                  <div className="mt-auto h-0.5 rounded-full" style={{background:`${color}40`}}/>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MAIN CARDS GRID ── */}
        <section ref={cardsRef.ref} className="py-16 pb-28 bg-[#FAFAF9] relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 opacity-20 dot-bg pointer-events-none"/>
          <div className="anim-o2 absolute w-80 h-80 rounded-full bg-orange-50 blur-3xl -left-20 bottom-0 pointer-events-none"/>

          <div className="max-w-6xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-14 ${cardsRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
              <span className="fm text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Explore further</span>
              <h2 className="font-black text-4xl lg:text-5xl text-gray-900 leading-tight">
                Five reasons to<br /><span className="shimmer">choose us.</span>
              </h2>
            </div>

            {/* FEATURED CARD (success stories) — full width */}
            <div className={`mb-5 ${cardsRef.inView?"reveal":"opacity-0"}`} style={{"--d":".08s"} as React.CSSProperties}>
              <Link
                href={`/why-us/${slugify(whyUsLinks[0].title)}`}
                className="why-card rounded-3xl bg-[#060912] overflow-hidden relative group flex flex-col lg:flex-row block"
              >
                <div className="absolute inset-0 grid-dark opacity-60"/>
                <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 60% 80% at 20% 60%,rgba(249,115,22,.15) 0%,transparent 60%)"}}/>
                <div className="relative z-10 p-8 lg:p-10 flex flex-col lg:w-2/3">
                  <div className="flex items-center gap-3 mb-auto">
                    <span className="fm text-[10px] px-2.5 py-1 rounded-full font-bold bg-orange-500/20 text-orange-400">
                      {CARD_META[0].tag}
                    </span>
                    <span className="fm text-[10px] text-white/30">Featured</span>
                  </div>
                  <div className="mt-12">
                    <p className="fm text-[10px] text-white/30 uppercase tracking-[.18em] mb-2">{CARD_META[0].statLabel}</p>
                    <p className="font-black text-4xl text-orange-400 mb-4">{CARD_META[0].stat}</p>
                    <h3 className="font-black text-2xl lg:text-3xl text-white leading-tight mb-3 group-hover:text-orange-100 transition-colors">{whyUsLinks[0].title}</h3>
                    <p className="text-white/45 text-sm leading-relaxed mb-6 max-w-md">{whyUsLinks[0].description}</p>
                    <div className="flex flex-wrap gap-2">
                      {CARD_META[0].bullet.map(b=>(
                        <span key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 border border-white/8 text-white/50 text-xs">
                          <FiCheckCircle size={9} className="text-orange-400"/>{b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* right accent column */}
                <div className="relative z-10 lg:w-1/3 flex items-end justify-end p-8">
                  <div className="w-full h-full flex flex-col justify-between items-end">
                    <div className="w-20 h-20 rounded-3xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                      <FiStar size={32} className="text-orange-400"/>
                    </div>
                    <span className="flex items-center gap-2 text-white/45 text-sm font-bold card-arrow group-hover:text-orange-300 transition-colors">
                      Read stories <FiArrowRight size={14}/>
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* 2×2 grid for remaining 4 */}
            <div className="grid sm:grid-cols-2 gap-5">
              {whyUsLinks.slice(1).map((link, i) => {
                const meta = CARD_META[i + 1]
                const Icon = meta.icon
                return (
                  <Link
                    key={link.title}
                    href={`/why-us/${slugify(link.title)}`}
                    className={`why-card rounded-2xl border border-gray-100 bg-white overflow-hidden group block ${cardsRef.inView?"reveal":"opacity-0"}`}
                    style={{"--d":`${.16+i*.08}s`} as React.CSSProperties}
                  >
                    <div className="h-1" style={{background:`linear-gradient(90deg,${meta.color},${meta.color}00)`}}/>
                    <div className="p-7 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{background:`${meta.color}12`}}>
                          <Icon size={20} style={{color:meta.color}}/>
                        </div>
                        <span className="fm text-[10px] px-2.5 py-1 rounded-full font-bold" style={{background:`${meta.color}10`,color:meta.color}}>
                          {meta.tag}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="fm text-[10px] text-gray-400 uppercase tracking-wider mb-1">{meta.statLabel}</p>
                        <p className="font-black text-2xl" style={{color:meta.color}}>{meta.stat}</p>
                      </div>

                      <h3 className="font-black text-gray-900 text-xl mb-2 group-hover:text-gray-700 transition-colors leading-tight">{link.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">{link.description}</p>

                      <div className="space-y-1.5 mb-5">
                        {meta.bullet.map(b=>(
                          <div key={b} className="flex items-center gap-2 text-gray-500 text-xs">
                            <FiCheckCircle size={10} style={{color:meta.color, flexShrink:0}}/>{b}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="font-black text-xs" style={{color:meta.color}}>Read more</span>
                        <span className="w-7 h-7 rounded-full border flex items-center justify-center transition-all group-hover:border-current card-arrow" style={{borderColor:`${meta.color}30`}}>
                          <FiArrowRight size={12} style={{color:meta.color}}/>
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF STRIP ── */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                {v:"₦45M+",l:"In gig payments facilitated",sub:"Across 180+ completed engagements",color:"#F97316"},
                {v:"0%",l:"Unpaid invoices on platform",sub:"Escrow protects every single gig",color:"#10B981"},
                {v:"48hr",l:"Faster than word-of-mouth",sub:"Instant matching on every gig post",color:"#6366F1"},
              ].map(({v,l,sub,color})=>(
                <div key={l}>
                  <p className="font-black text-4xl mb-1" style={{color}}>{v}</p>
                  <p className="font-black text-sm text-gray-800 mb-1">{l}</p>
                  <p className="fm text-[11px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DARK CTA ── */}
        <section ref={ctaRef.ref} className="relative overflow-hidden bg-[#060912] py-28 noise">
          <div className="absolute inset-0 grid-dark"/>
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(249,115,22,.12) 0%,transparent 65%)"}}/>
          <div className="anim-o1 absolute w-[700px] h-[700px] rounded-full bg-orange-500/7 blur-3xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full border border-orange-500/8 pointer-events-none" style={{animation:"borderRot 28s linear infinite"}}/>

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <div className={`${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":"0s"} as React.CSSProperties}>
              <p className="fm text-xs text-orange-400 uppercase tracking-[.3em] mb-6">Convinced?</p>
            </div>
            <h2 className={`font-black text-5xl lg:text-6xl text-white leading-[.95] mb-4 ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".1s"} as React.CSSProperties}>
              Ready to work<br /><span className="shimmer">with purpose?</span>
            </h2>
            <p className={`fs italic text-3xl text-white/35 mb-10 ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".22s"} as React.CSSProperties}>
              Flexible talents. Meaningful work.
            </p>
            <div className={`flex flex-wrap gap-4 justify-center ${ctaRef.inView?"reveal":"opacity-0"}`} style={{"--d":".34s"} as React.CSSProperties}>
              <Link href="/hire"
                className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black px-10 py-4 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,.35)] transition-all duration-200 group relative overflow-hidden"
                style={{padding:"1.1rem 2.5rem"}}>
                Hire talent <FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform"/>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"/>
              </Link>
              <Link href="/jobs"
                className="inline-flex items-center gap-2 border border-white/12 hover:border-orange-400 text-white/60 hover:text-white font-black rounded-2xl transition-all duration-200"
                style={{padding:"1.1rem 2rem"}}>
                Find work
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  )
}
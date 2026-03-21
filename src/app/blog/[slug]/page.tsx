"use client"

import Navbar from "@/components/layout/Navbar"
import { useEffect, useRef, useState } from "react"
import { POSTS } from "@/lib/blog-data"
import type { Post, Section } from "@/lib/blog-data"
import {
  FiArrowLeft, FiArrowRight, FiClock, FiShare2, FiCopy,
  FiCheck, FiTwitter, FiLinkedin, FiBookmark, FiChevronUp
} from "react-icons/fi"
import { HiSparkles } from "react-icons/hi"

/* props - in Next.js this would come from params */
interface BlogPostProps { slug?: string }

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
  const [p, setP] = useState(0)
  useEffect(() => {
    const h = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop || document.body.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setP(total > 0 ? Math.min((scrolled / total) * 100, 100) : 0)
    }
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])
  return p
}

function CopyLink() {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="flex items-center gap-1.5 text-xs fm text-gray-400 hover:text-orange-500 transition-colors">
      {copied ? <FiCheck size={11} className="text-emerald-500"/> : <FiCopy size={11}/>}
      {copied ? "Copied" : "Copy link"}
    </button>
  )
}

function StatRow({ stats }: { stats: { value: string; label: string; color: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-4 my-8 p-6 rounded-2xl bg-gray-50 border border-gray-100">
      {stats.map((s, i) => (
        <div key={i} className="text-center">
          <div className="font-black text-2xl lg:text-3xl mb-1" style={{ color: s.color }}>{s.value}</div>
          <div className="fm text-[10px] text-gray-400 uppercase tracking-wider leading-tight">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function renderSection(s: Section, i: number, accentColor: string) {
  switch (s.type) {
    case "h2":
      return (
        <h2 key={i} className="font-black text-2xl text-gray-900 mt-12 mb-4 leading-tight">
          {s.content}
        </h2>
      )
    case "h3":
      return (
        <h3 key={i} className="font-bold text-lg text-gray-900 mt-8 mb-3 leading-snug">
          {s.content}
        </h3>
      )
    case "p":
      return (
        <p key={i} className="text-gray-600 text-base leading-[1.9] mb-5 fs" style={{ fontFamily: "'Sora', sans-serif" }}>
          {s.content}
        </p>
      )
    case "quote":
      return (
        <blockquote key={i} className="relative my-10 pl-6 border-l-4 border-orange-400">
          <p className="text-gray-700 text-lg italic leading-relaxed mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
            "{s.content}"
          </p>
          {s.author && <cite className="fm text-xs text-gray-400 not-italic">- {s.author}</cite>}
        </blockquote>
      )
    case "list":
      return (
        <ul key={i} className="my-6 space-y-3">
          {s.items?.map((item, j) => (
            <li key={j} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Sora', sans-serif" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${accentColor}15` }}>
                <FiArrowRight size={10} style={{ color: accentColor }} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      )
    case "callout":
      return (
        <div key={i} className="my-8 p-6 rounded-2xl border-l-4 relative overflow-hidden"
          style={{ background: `${s.color || accentColor}08`, borderColor: s.color || accentColor }}>
          <div className="absolute top-4 right-4 opacity-10">
            <HiSparkles size={32} style={{ color: s.color || accentColor }} />
          </div>
          <p className="text-sm leading-relaxed relative z-10" style={{ color: s.color || accentColor, fontFamily: "'Sora', sans-serif", fontWeight: 500 }}>
            {s.content}
          </p>
        </div>
      )
    case "stat-row":
      return <StatRow key={i} stats={s.stats || []} />
    case "divider":
      return <div key={i} className="my-12 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    default:
      return null
  }
}

export default function BlogPost({ slug }: BlogPostProps) {
  // In real Next.js, slug comes from useParams(). Default to first post for preview.
  const resolvedSlug = slug || (typeof window !== "undefined" ? window.location.pathname.split("/").pop() : "")
  const post = POSTS.find(p => p.slug === resolvedSlug) || POSTS[0]

  const scrollY = useScrollY()
  const progress = useReadingProgress()
  const [bookmarked, setBookmarked] = useState(false)

  const postIdx = POSTS.findIndex(p => p.slug === post.slug)
  const prev = postIdx > 0 ? POSTS[postIdx - 1] : null
  const next = postIdx < POSTS.length - 1 ? POSTS[postIdx + 1] : null
  const related = POSTS.filter(p => p.slug !== post.slug && (p.category === post.category || p.tags.some(t => post.tags.includes(t)))).slice(0, 3)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=Instrument+Serif:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        body{font-family:'Sora',sans-serif}
        .fd{font-family:'Sora',sans-serif}
        .fs{font-family:'Instrument Serif',serif}
        .fm{font-family:'JetBrains Mono',monospace}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#F97316;border-radius:3px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimTxt{0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes borderRot{to{transform:rotate(360deg)}}
        @keyframes orb1{0%,100%{transform:translate(0,0)}40%{transform:translate(50px,-50px)scale(1.08)}}

        .entry{animation:fadeUp .7s cubic-bezier(.22,1,.36,1) both}
        .shimmer{background:linear-gradient(90deg,#F97316,#EA580C,#FB923C,#FCD34D,#FB923C,#EA580C,#F97316);background-size:600px 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimTxt 3s linear infinite}
        .grid-dark{background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:56px 56px}
        .noise::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:0}
        .anim-o1{animation:orb1 14s ease-in-out infinite}

        .card{transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s ease,border-color .2s}
        .card:hover{transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,.08)}

        strong{font-weight:700;color:#111827}

        /* prose tweaks */
        .prose p{margin-bottom:1.25rem}
        .prose h2{margin-top:3rem;margin-bottom:1rem}
      `}</style>

      {/* reading progress */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-100">
        <div className="h-full transition-all duration-100" style={{ width: `${progress}%`, background: `linear-gradient(90deg,${post.categoryColor},#FCD34D,${post.categoryColor})`, backgroundSize: "200%", animation: "gradShift 3s ease infinite" }} />
      </div>

      <div className="fd bg-white text-gray-900 min-h-screen overflow-x-hidden selection:bg-orange-100 selection:text-orange-900">
        <Navbar />

        {/* ── ARTICLE HERO ── */}
        <section className="relative overflow-hidden bg-[#060912] pt-28 pb-0">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 65% at 50% 40%,${post.categoryColor}18 0%,transparent 68%)` }} />
          <div className="anim-o1 absolute w-[600px] h-[600px] rounded-full blur-3xl -top-40 right-0 pointer-events-none" style={{ background: `${post.categoryColor}09` }} />

          <div className="relative z-10 max-w-4xl mx-auto px-6 pb-0">
            {/* breadcrumb */}
            <div className="entry flex items-center gap-2 mb-8" style={{ animationDelay: ".05s" }}>
              <a href="/blog" className="fm text-white/30 text-xs hover:text-white/60 transition-colors flex items-center gap-1.5">
                <FiArrowLeft size={11} /> Blog
              </a>
              <span className="text-white/20 text-xs">/</span>
              <span className="fm text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${post.categoryColor}25`, color: post.categoryColor }}>{post.category}</span>
            </div>

            {/* title */}
            <h1 className="entry font-black text-4xl lg:text-5xl text-white leading-[1.05] tracking-tight mb-5" style={{ animationDelay: ".15s" }}>
              {post.title}
            </h1>
            <p className="entry fs italic text-2xl text-white/35 mb-10 leading-snug" style={{ animationDelay: ".26s" }}>
              {post.subtitle}
            </p>

            {/* meta row */}
            <div className="entry flex flex-wrap items-center gap-5 pb-12" style={{ animationDelay: ".36s" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white" style={{ background: post.author.color }}>
                  {post.author.initials}
                </div>
                <div>
                  <p className="text-white/75 text-sm font-bold">{post.author.name}</p>
                  <p className="text-white/30 text-xs fm">{post.author.role}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-4">
                <span className="fm text-xs text-white/35 flex items-center gap-1.5"><FiClock size={11} />{post.readTime}</span>
                <span className="fm text-xs text-white/35">{post.date}</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setBookmarked(b => !b)}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors">
                  <FiBookmark size={13} style={{ color: bookmarked ? post.categoryColor : "rgba(255,255,255,.3)", fill: bookmarked ? post.categoryColor : "none" }} />
                </button>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank" rel="noopener"
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors">
                  <FiTwitter size={13} className="text-white/30" />
                </a>
              </div>
            </div>
          </div>

          {/* wave */}
          <div style={{ height: "72px" }} className="pointer-events-none">
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ── ARTICLE BODY ── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-[1fr_280px] gap-16">

              {/* content */}
              <article className="min-w-0 max-w-none">
                {/* accent line */}
                <div className="h-1 w-24 rounded-full mb-10" style={{ background: post.categoryColor }} />

                {/* tags */}
                <div className="flex flex-wrap gap-2 mb-10">
                  {post.tags.map(t => (
                    <span key={t} className="fm text-[10px] px-2.5 py-1 rounded-full" style={{ background: `${post.categoryColor}10`, color: post.categoryColor }}>#{t}</span>
                  ))}
                </div>

                {/* sections */}
                <div>
                  {post.sections.map((s, i) => renderSection(s, i, post.categoryColor))}
                </div>

                {/* share row */}
                <div className="mt-14 pt-8 border-t border-gray-100 flex flex-wrap items-center gap-4">
                  <span className="text-sm font-bold text-gray-700">Share this article</span>
                  <div className="flex gap-2">
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600 hover:border-orange-200 hover:text-orange-600 transition-all">
                      <FiTwitter size={12} /> Twitter
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`} target="_blank" rel="noopener"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-600 hover:border-orange-200 hover:text-orange-600 transition-all">
                      <FiLinkedin size={12} /> LinkedIn
                    </a>
                  </div>
                  <div className="ml-auto">
                    <CopyLink />
                  </div>
                </div>

                {/* prev / next */}
                <div className="mt-14 grid sm:grid-cols-2 gap-4">
                  {prev && (
                    <a href={`/blog/${prev.slug}`} className="card rounded-2xl border border-gray-100 p-5 group block">
                      <p className="fm text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FiArrowLeft size={10}/>Previous</p>
                      <p className="font-bold text-sm text-gray-800 group-hover:text-orange-600 transition-colors leading-snug line-clamp-2">{prev.title}</p>
                    </a>
                  )}
                  {next && (
                    <a href={`/blog/${next.slug}`} className="card rounded-2xl border border-gray-100 p-5 group block sm:text-right">
                      <p className="fm text-[10px] text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 sm:justify-end">Next<FiArrowRight size={10}/></p>
                      <p className="font-bold text-sm text-gray-800 group-hover:text-orange-600 transition-colors leading-snug line-clamp-2">{next.title}</p>
                    </a>
                  )}
                </div>
              </article>

              {/* SIDEBAR */}
              <aside className="hidden lg:block">
                <div className="sticky top-28 flex flex-col gap-6">

                  {/* author card */}
                  <div className="rounded-2xl border border-gray-100 p-5 bg-white">
                    <p className="fm text-[10px] text-gray-400 uppercase tracking-wider mb-4">About the author</p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-white shrink-0" style={{ background: post.author.color }}>
                        {post.author.initials}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{post.author.name}</p>
                        <p className="text-gray-400 text-xs fm">{post.author.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* reading progress */}
                  <div className="rounded-2xl border border-gray-100 p-5 bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <p className="fm text-[10px] text-gray-400 uppercase tracking-wider">Reading progress</p>
                      <span className="fm text-[10px] font-bold" style={{ color: post.categoryColor }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-200" style={{ width: `${progress}%`, background: post.categoryColor }} />
                    </div>
                    <p className="fm text-[10px] text-gray-400 mt-2">{post.readTime}</p>
                  </div>

                  {/* related */}
                  {related.length > 0 && (
                    <div className="rounded-2xl border border-gray-100 p-5 bg-white">
                      <p className="fm text-[10px] text-gray-400 uppercase tracking-wider mb-4">Related articles</p>
                      <div className="space-y-4">
                        {related.map(r => (
                          <a key={r.slug} href={`/blog/${r.slug}`} className="group block">
                            <div className="flex items-start gap-2.5">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: r.categoryColor }} />
                              <p className="text-gray-700 text-xs leading-snug group-hover:text-orange-600 transition-colors font-medium line-clamp-2">{r.title}</p>
                            </div>
                            <p className="fm text-[10px] text-gray-400 mt-1 ml-4">{r.readTime}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="rounded-2xl overflow-hidden bg-[#060912] p-5 relative">
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 80% at 50% 50%,${post.categoryColor}18 0%,transparent 70%)` }} />
                    <div className="relative">
                      <p className="fm text-[10px] text-orange-400 uppercase tracking-wider mb-2">Join changeworker</p>
                      <p className="font-bold text-white text-sm mb-3 leading-snug">Find meaningful projects in Nigeria's impact sector.</p>
                      <a href="/signup" className="block text-center py-2.5 rounded-xl font-bold text-white text-xs transition-all duration-200 hover:opacity-90"
                        style={{ background: post.categoryColor }}>
                        Get started
                      </a>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── RELATED GRID ── */}
        {related.length > 0 && (
          <section className="py-16 bg-[#FAFAFA] border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <h2 className="font-black text-2xl text-gray-900 mb-8">More to read</h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {related.map(r => (
                  <a key={r.slug} href={`/blog/${r.slug}`}
                    className="card rounded-2xl border border-gray-100 bg-white overflow-hidden group block">
                    <div className="h-1" style={{ background: `linear-gradient(90deg,${r.categoryColor},${r.categoryColor}00)` }} />
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="fm text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: `${r.categoryColor}12`, color: r.categoryColor }}>{r.category}</span>
                        <span className="fm text-[10px] text-gray-400 flex items-center gap-1"><FiClock size={9}/>{r.readTime}</span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 leading-snug mb-2 group-hover:text-orange-600 transition-colors line-clamp-3">{r.title}</h3>
                      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-50">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: r.author.color }}>{r.author.initials}</div>
                        <span className="fm text-[10px] text-gray-400">{r.date}</span>
                        <FiArrowRight size={12} className="ml-auto text-gray-300 group-hover:text-orange-400 transition-all"/>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* dark CTA */}
        <section className="relative overflow-hidden bg-[#060912] py-24 noise">
          <div className="absolute inset-0 grid-dark"/>
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(249,115,22,.12) 0%,transparent 65%)"}}/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full border border-orange-500/8 pointer-events-none" style={{animation:"borderRot 28s linear infinite"}}/>
          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <p className="fm text-xs text-orange-400 uppercase tracking-[.3em] mb-5">Put knowledge to work</p>
            <h2 className="font-black text-5xl text-white leading-[.95] mb-4">Flexible talents.<br/><span className="shimmer">Meaningful work.</span></h2>
            <p className="fs italic text-2xl text-white/35 mb-10">changeworker connects Nigeria's impact sector.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/signup" className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black px-10 py-4 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,.35)] transition-all duration-200 group" style={{padding:"1.1rem 2.5rem"}}>
                Get started <FiArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform"/>
              </a>
              <a href="/blog" className="inline-flex items-center gap-2 border border-white/12 hover:border-orange-400 text-white/60 hover:text-white font-black px-8 py-4 rounded-2xl transition-all duration-200">
                <FiArrowLeft size={14}/> All articles
              </a>
            </div>
          </div>
        </section>

        {/* back to top */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg transition-all duration-300"
          style={{ background: post.categoryColor, opacity: scrollY > 400 ? 1 : 0, transform: scrollY > 400 ? "translateY(0) scale(1)" : "translateY(16px) scale(.8)", pointerEvents: scrollY > 400 ? "auto" : "none" }}>
          <FiChevronUp size={16} />
        </button>

        {/* footer strip */}
        <div className="border-t border-gray-100 bg-white py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center"><span className="text-white font-black text-sm">c</span></div>
              <span className="font-bold text-gray-700 text-sm">changeworker</span>
            </div>
            <div className="flex gap-5">
              {[
                ["/terms","Terms"], 
                ["/privacy","Privacy"], 
                ["/contact","Contact"], 
                ["/blog","Blog"], 
                ["/" ,"Home"]
              ].map(([h,l])=>(
                <a key={h} href={h} className="fm text-xs text-gray-400 hover:text-orange-500 transition-colors">{l}</a>
              ))}
            </div>
            <p className="fm text-xs text-gray-400">© {new Date().getFullYear()} Impactpal Africa</p>
          </div>
        </div>
      </div>
    </>
  )
}
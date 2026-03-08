"use client"

import Navbar from "@/components/layout/Navbar"
import { useEffect, useRef, useState } from "react"
import { POSTS, CATEGORIES_META } from "@/lib/blog-data"
import {
  FiArrowRight, FiClock, FiSearch, FiX, FiFilter,
  FiBookmark, FiShare2, FiTrendingUp, FiChevronRight
} from "react-icons/fi"
import { HiSparkles } from "react-icons/hi"

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

export default function BlogIndex() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const scrollY = useScrollY()
  const heroRef = useInView(0.05)
  const gridRef = useInView(0.04)

  const filtered = POSTS.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory
    const q = query.toLowerCase()
    const matchQ = !q || p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    return matchCat && matchQ
  })

  const featured = POSTS.filter(p => p.featured).slice(0, 3)
  const nonFeatured = filtered.filter(p => !p.featured || activeCategory !== "All" || query)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800;900&family=Instrument+Serif:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        .fd{font-family:'Sora',sans-serif}
        .fs{font-family:'Instrument Serif',serif}
        .fm{font-family:'JetBrains Mono',monospace}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#F97316;border-radius:3px}

        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimTxt{0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes orb1{0%,100%{transform:translate(0,0)}40%{transform:translate(50px,-50px)scale(1.08)}80%{transform:translate(-25px,25px)scale(.94)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,40px)scale(.92)}}
        @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes dotDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes borderRot{to{transform:rotate(360deg)}}
        @keyframes dashDraw{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
        @keyframes lineGrow{from{width:0}to{width:100%}}

        .reveal{opacity:0;animation:fadeUp .7s cubic-bezier(.22,1,.36,1) var(--d,0s) both}
        .shimmer{background:linear-gradient(90deg,#F97316,#EA580C,#FB923C,#FCD34D,#FB923C,#EA580C,#F97316);background-size:600px 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimTxt 3s linear infinite}
        .grid-dark{background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:56px 56px}
        .dot-bg{background-image:radial-gradient(rgba(249,115,22,.14) 1.5px,transparent 1.5px);background-size:26px 26px}
        .noise::after{content:'';position:absolute;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:0}
        .anim-o1{animation:orb1 14s ease-in-out infinite}
        .anim-o2{animation:orb2 18s ease-in-out infinite}
        .draw-line{stroke-dasharray:1000;animation:dashDraw 2s ease both}

        .card{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease,border-color .2s}
        .card:hover{transform:translateY(-6px);box-shadow:0 20px 56px rgba(0,0,0,.09)}
        .featured-card{transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s ease}
        .featured-card:hover{transform:translateY(-4px);box-shadow:0 24px 64px rgba(0,0,0,.12)}

        .search-input{width:100%;background:#F9FAFB;border:1.5px solid #F3F4F6;border-radius:12px;padding:.8rem .8rem .8rem 2.8rem;font-family:'Sora',sans-serif;font-size:.875rem;color:#111827;outline:none;transition:border-color .2s,box-shadow .2s}
        .search-input:focus{border-color:#F97316;background:white;box-shadow:0 0 0 4px rgba(249,115,22,.08)}
        .search-input::placeholder{color:#C4C9D4}

        .cat-btn{font-family:'Sora',sans-serif;font-size:.75rem;font-weight:600;padding:.5rem 1.1rem;border-radius:999px;border:1.5px solid;transition:all .2s cubic-bezier(.22,1,.36,1)}
        .cat-btn:hover{transform:translateY(-1px)}

        .tag{font-family:'JetBrains Mono',monospace;font-size:.65rem;padding:.2rem .6rem;border-radius:999px}

        strong{font-weight:700;color:#111827}
      `}</style>

      <div className="fd bg-white text-gray-900 min-h-screen overflow-x-hidden selection:bg-orange-100 selection:text-orange-900">
        <Navbar />

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[#060912] pt-28 pb-0">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 75% 60% at 50% 40%,rgba(249,115,22,.12) 0%,transparent 68%)"}} />
          <div className="anim-o1 absolute w-[700px] h-[700px] rounded-full bg-orange-500/8 blur-3xl -top-60 right-0 pointer-events-none" />
          <div className="anim-o2 absolute w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-3xl -left-20 bottom-0 pointer-events-none" />

          {/* SVG network */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[[8,16],[92,11],[94,64],[5,70],[50,84],[29,40],[78,46],[60,22]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r=".5" fill="#F97316" style={{animation:`dotDrift ${4+i}s ease-in-out ${i*.3}s infinite`}}/>
            ))}
            {([[8,16,29,40],[29,40,60,22],[60,22,92,11],[5,70,50,84],[29,40,50,84]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F97316" strokeWidth=".1" className="draw-line" style={{animationDelay:`${i*.25}s`}}/>
            ))}
          </svg>

          <div className="relative z-10 max-w-5xl mx-auto px-6 pb-0" ref={heroRef.ref}>
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".05s"} as any}>
              <HiSparkles size={12} className="text-orange-400"/>
              <span className="fm text-white/50 text-xs tracking-[.15em] uppercase">changeworker editorial</span>
            </div>

            <h1 className={`font-black text-6xl lg:text-7xl text-white leading-[.93] tracking-tight mb-5 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".15s"} as any}>
              Insights for<br/><span className="shimmer">impact work.</span>
            </h1>
            <p className={`fs italic text-3xl text-white/35 mb-12 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".28s"} as any}>
              Practical knowledge for Nigeria's social sector professionals.
            </p>

            {/* stats */}
            <div className={`flex flex-wrap gap-6 pb-16 ${heroRef.inView?"reveal":"opacity-0"}`} style={{"--d":".38s"} as any}>
              {[["10","Articles"],["4","Categories"],["9 min","Avg read"],["100%","Free"]].map(([v,l])=>(
                <div key={l} className="flex flex-col">
                  <span className="font-black text-2xl text-white">{v}</span>
                  <span className="fm text-[10px] text-white/30 uppercase tracking-wider">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* wave */}
          <div style={{height:"72px"}} className="pointer-events-none">
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* ── FEATURED TRIO ── */}
        {(activeCategory === "All" && !query) && (
          <section className="pt-16 pb-12 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="flex items-center gap-3 mb-8">
                <FiTrendingUp size={16} className="text-orange-500"/>
                <span className="fm text-xs text-orange-500 uppercase tracking-[.22em]">Featured</span>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* big card */}
                <a href={`/blog/${featured[0].slug}`}
                  className="featured-card lg:col-span-2 rounded-3xl overflow-hidden bg-[#060912] relative group cursor-pointer block">
                  <div className="absolute inset-0 grid-dark opacity-60"/>
                  <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 80% 70% at 30% 60%,rgba(249,115,22,.15) 0%,transparent 65%)"}}/>
                  <div className="relative z-10 p-8 flex flex-col h-full min-h-[340px]">
                    <div className="flex items-center gap-2 mb-auto">
                      <span className="fm text-[10px] px-2.5 py-1 rounded-full font-bold" style={{background:`${featured[0].categoryColor}25`,color:featured[0].categoryColor}}>{featured[0].category}</span>
                      <span className="fm text-[10px] text-white/30">{featured[0].readTime}</span>
                    </div>
                    <div className="mt-16">
                      <h2 className="font-black text-2xl lg:text-3xl text-white leading-tight mb-3 group-hover:text-orange-100 transition-colors">{featured[0].title}</h2>
                      <p className="text-white/45 text-sm fm leading-relaxed mb-6 line-clamp-2">{featured[0].excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{background:featured[0].author.color}}>{featured[0].author.initials}</div>
                          <div>
                            <p className="text-white/70 text-xs font-semibold">{featured[0].author.name}</p>
                            <p className="text-white/30 text-[10px] fm">{featured[0].date}</p>
                          </div>
                        </div>
                        <span className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                          <FiArrowRight size={14} className="text-orange-400 group-hover:text-white transition-colors"/>
                        </span>
                      </div>
                    </div>
                  </div>
                </a>

                {/* two small stacked */}
                <div className="flex flex-col gap-6">
                  {featured.slice(1,3).map((p,i)=>(
                    <a key={i} href={`/blog/${p.slug}`}
                      className="featured-card rounded-2xl border border-gray-100 bg-white p-6 flex flex-col group cursor-pointer block flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="fm text-[10px] px-2.5 py-1 rounded-full font-bold" style={{background:`${p.categoryColor}12`,color:p.categoryColor}}>{p.category}</span>
                        <span className="fm text-[10px] text-gray-400">{p.readTime}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-3 group-hover:text-orange-600 transition-colors line-clamp-3">{p.title}</h3>
                      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-50">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{background:p.author.color}}>{p.author.initials}</div>
                        <span className="text-gray-400 text-xs fm">{p.date}</span>
                        <FiArrowRight size={12} className="ml-auto text-gray-300 group-hover:text-orange-400 transition-colors"/>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FILTER BAR ── */}
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* search */}
            <div className="relative shrink-0 w-full sm:w-64">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              <input type="text" placeholder="Search articles..." value={query} onChange={e=>setQuery(e.target.value)} className="search-input"/>
              {query && (
                <button onClick={()=>setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FiX size={12} className="text-gray-400 hover:text-gray-700"/>
                </button>
              )}
            </div>
            {/* categories */}
            <div className="flex gap-2 overflow-x-auto" style={{scrollbarWidth:"none"}}>
              {CATEGORIES_META.map(c=>{
                const active = activeCategory === c.label
                return (
                  <button key={c.label} onClick={()=>setActiveCategory(c.label)} className="cat-btn shrink-0"
                    style={{borderColor:active?c.color:"#E5E7EB",background:active?`${c.color}10`:"transparent",color:active?c.color:"#6B7280"}}>
                    {c.label}
                    <span className="fm text-[10px] ml-1.5 opacity-60">{c.count}</span>
                  </button>
                )
              })}
            </div>
            <span className="ml-auto fm text-xs text-gray-400 shrink-0 hidden sm:block">{filtered.length} article{filtered.length!==1?"s":""}</span>
          </div>
        </div>

        {/* ── GRID ── */}
        <section className="py-16 bg-[#FAFAFA]" ref={gridRef.ref}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <FiSearch size={36} className="text-gray-200 mx-auto mb-4"/>
                <p className="font-bold text-gray-400 text-lg">No articles found</p>
                <button onClick={()=>{setQuery("");setActiveCategory("All")}} className="mt-4 text-sm text-orange-500 hover:text-orange-600 font-semibold fm">Clear filters</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeCategory==="All"&&!query?nonFeatured:filtered).map((p,i)=>(
                  <a key={p.slug} href={`/blog/${p.slug}`}
                    className={`card rounded-2xl border border-gray-100 bg-white overflow-hidden group cursor-pointer block ${gridRef.inView?"reveal":"opacity-0"}`}
                    style={{"--d":`${.04+i*.06}s`} as any}>
                    {/* color accent top bar */}
                    <div className="h-1" style={{background:`linear-gradient(90deg,${p.categoryColor},${p.categoryColor}00)`}}/>
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="fm text-[10px] px-2.5 py-1 rounded-full font-bold" style={{background:`${p.categoryColor}12`,color:p.categoryColor}}>{p.category}</span>
                        <span className="fm text-[10px] text-gray-400 flex items-center gap-1"><FiClock size={9}/>{p.readTime}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base leading-snug mb-2.5 group-hover:text-orange-600 transition-colors line-clamp-3">{p.title}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-5 line-clamp-3 flex-1">{p.excerpt}</p>
                      {/* tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {p.tags.slice(0,3).map(t=>(
                          <span key={t} className="tag" style={{background:"#F3F4F6",color:"#6B7280"}}>#{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2.5 pt-4 border-t border-gray-50">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{background:p.author.color}}>{p.author.initials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 text-xs font-semibold truncate">{p.author.name}</p>
                          <p className="fm text-[10px] text-gray-400">{p.date}</p>
                        </div>
                        <FiArrowRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-all group-hover:translate-x-0.5 shrink-0"/>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── DARK CTA ── */}
        <section className="relative overflow-hidden bg-[#060912] py-28 noise">
          <div className="absolute inset-0 grid-dark"/>
          <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(249,115,22,.12) 0%,transparent 65%)"}}/>
          <div className="anim-o1 absolute w-[700px] h-[700px] rounded-full bg-orange-500/7 blur-3xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full border border-orange-500/8 pointer-events-none" style={{animation:"borderRot 28s linear infinite"}}/>
          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <p className="fm text-xs text-orange-400 uppercase tracking-[.3em] mb-6">Ready to work?</p>
            <h2 className="font-black text-5xl lg:text-6xl text-white leading-[.95] mb-4">Knowledge is<br/><span className="shimmer">step one.</span></h2>
            <p className="fs italic text-3xl text-white/35 mb-10">changeworker connects you with the work.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/signup" className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black px-10 py-4 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,.35)] transition-all duration-200 group" style={{padding:"1.1rem 2.5rem"}}>
                Get started <FiArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
              </a>
              <a href="/contact" className="inline-flex items-center gap-2 border border-white/12 hover:border-orange-400 text-white/60 hover:text-white font-black px-10 py-4 rounded-2xl transition-all duration-200" style={{padding:"1.1rem 2rem"}}>
                Talk to us
              </a>
            </div>
          </div>
        </section>

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
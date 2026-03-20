"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi"

// SpotCard component with mouse tracking effect
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

// Multiple colors for review cards
const REVIEW_COLORS = [
  '#F97316', // orange
  '#3B82F6', // blue
  '#10B981', // green
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#EF4444', // red
]

export default function TestCarousel({ inView, testimonials }: { inView: boolean; testimonials: any[] }) {
  // Only show testimonials if they exist, otherwise show nothing
  if (testimonials.length === 0) return null
  
  const [active, setActive] = useState(0)
  const go = useCallback((d: number) => setActive(a=>(a+d+testimonials.length)%testimonials.length), [testimonials.length])
  useEffect(()=>{ const t=setInterval(()=>go(1),5200); return()=>clearInterval(t) },[go])
  const t = testimonials[active]
  
  // Handle different data structures
  const isRealReview = t.id !== undefined
  const quote = isRealReview ? t.comment : t.q
  const name = isRealReview ? (t.reviewerName || 'User') : t.name
  const role = isRealReview ? (t.reviewerRole === 'client' ? 'Client' : 'Talent') : (t.role || 'User')
  const org = isRealReview ? (t.reviewerOrg || '') : t.org
  const stars = isRealReview ? Math.max(0, Math.min(5, Math.floor((((t.easeOfUse || 0) + (t.support || 0) + (t.value || 0)) / 3) || 5))) : (t.stars || 5)
  
  // Assign color based on index for variety
  const colorIndex = active % REVIEW_COLORS.length
  const color = REVIEW_COLORS[colorIndex]
  
  return (
    <div className={inView?"reveal":"opacity-0"} style={{"--d":".15s"} as React.CSSProperties}>
      <SpotCard className="rounded-3xl bg-white border border-gray-100 shadow-xl p-10 mb-6 relative overflow-hidden">
        <div className="absolute top-6 right-8 text-9xl font-serif text-gray-50 leading-none select-none" style={{fontFamily:"Georgia,serif"}}>"</div>
        <div className="flex gap-0.5 mb-6">
          {[...Array(stars)].map((_,i)=><span key={i} style={{color:"#FBBF24"}}><FiStar size={15}/></span>)}
        </div>
        <p className="font-display font-normal text-gray-700 text-lg leading-relaxed mb-8 max-w-xl">"{quote}"</p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black font-display"
            style={{background:`linear-gradient(135deg,${color},${color}88)`}}>{name[0]?.toUpperCase() || 'U'}</div>
          <div>
            <p className="font-display font-bold text-gray-900">{name}</p>
            <p className="text-gray-400 text-sm">{role}{org ? ` · ${org}` : ''}</p>
          </div>
        </div>
      </SpotCard>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {testimonials.map((_,i)=>(
            <button key={i} onClick={()=>setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{width:i===active?"28px":"8px",height:"8px",background:i===active?color:"#E5E7EB"}}/>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={()=>go(-1)}
            className="w-10 h-10 rounded-full border border-gray-200 hover:border-orange-300 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-all">
            <FiChevronLeft size={16}/>
          </button>
          <button onClick={()=>go(1)}
            className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-all">
            <FiChevronRight size={16}/>
          </button>
        </div>
      </div>
    </div>
  )
}

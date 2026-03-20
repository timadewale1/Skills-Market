"use client"

import Link from "next/link"

export default function Footer() {
  return (
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
  )
}

"use client"

import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { useEffect, useRef, useState, useCallback } from "react"
import {
  FiSearch, FiChevronDown, FiArrowRight, FiMail,
  FiCheckCircle, FiUsers, FiBriefcase, FiDollarSign,
  FiShield, FiHelpCircle, FiZap, FiStar, FiMessageSquare,
  FiClock, FiRefreshCw, FiThumbsUp, FiThumbsDown, FiX
} from "react-icons/fi"
import { HiSparkles } from "react-icons/hi"
import { TbHeadset, TbBuildingCommunity, TbScale, TbRocket } from "react-icons/tb"
import { RiShieldCheckLine, RiTeamLine } from "react-icons/ri"
import { MdOutlinePayment, MdGavel } from "react-icons/md"

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

function useInView(threshold = 0.08) {
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

function useActiveCategory(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [ids])
  return active
}

/* ═══ DATA ═══════════════════════════════════════════════════ */
const CATEGORIES = [
  { id: "general",     label: "General",           icon: FiHelpCircle,       color: "#F97316", count: 6  },
  { id: "orgs",        label: "For Organizations", icon: TbBuildingCommunity,color: "#6366F1", count: 7  },
  { id: "freelancers", label: "For Freelancers",   icon: RiTeamLine,         color: "#10B981", count: 7  },
  { id: "payments",    label: "Payments & Fees",   icon: MdOutlinePayment,   color: "#EC4899", count: 6  },
  { id: "matching",    label: "Matching Process",  icon: FiZap,              color: "#F59E0B", count: 5  },
  { id: "trust",       label: "Trust & Safety",    icon: RiShieldCheckLine,  color: "#3B82F6", count: 5  },
  { id: "account",     label: "Account & Tech",    icon: TbHeadset,          color: "#8B5CF6", count: 5  },
]

const CAT_IDS = CATEGORIES.map(c => c.id)

type FAQ = { q: string; a: string; tags?: string[] }
type CategoryFAQs = { id: string; faqs: FAQ[] }

const ALL_FAQS: CategoryFAQs[] = [
  {
    id: "general",
    faqs: [
      {
        q: "What is changeworker?",
        a: "changeworker is Nigeria's talent marketplace for the social impact sector. We connect nonprofits, NGOs, and social enterprises with freelance professionals - from grant writers and M&E specialists to project managers and communications experts. Unlike general freelance platforms, changeworker is built around sector-specific profiles, matching, proposals, messaging, and workspace delivery.",
        tags: ["platform","overview"],
      },
      {
        q: "Who is changeworker built for?",
        a: "changeworker serves two groups. Organizations: Nigerian nonprofits, NGOs, social enterprises, foundations, and CSR units that need skilled professionals for project-based work without long-term hiring. Freelancers: skilled independent professionals who want to work with mission-driven organizations and be fairly paid for their expertise.",
        tags: ["users","overview"],
      },
      {
        q: "Is changeworker available outside Nigeria?",
        a: "Currently, changeworker operates within Nigeria. We serve both organizations and freelancers based in Nigeria. We are actively planning expansion to Ghana, Kenya, and other African markets. If you're outside Nigeria and interested in early access, send us a note at hello@changeworker.ng - we'd love to hear from you.",
        tags: ["location","availability"],
      },
      {
        q: "Is changeworker free to use?",
        a: "Registration is free for both organizations and freelancers. changeworker uses a flat 10% platform fee on completed projects. There are no subscription fees, no listing fees, and no charge to browse or apply for projects.",
        tags: ["pricing","free"],
      },
      {
        q: "How is changeworker different from Upwork or other platforms?",
        a: "Three key differences: (1) Sector focus - our community understands nonprofit operations, donor reporting, and impact metrics. (2) Structured workflow - organizations can post gigs, review profiles and proposals, message talent, and manage delivery in one place. (3) Nigeria-native - Naira pricing, Paystack payments, and a team rooted in the local NGO ecosystem. We're built for this sector, not retrofitted for it.",
        tags: ["comparison","unique"],
      },
      {
        q: "Who operates changeworker?",
        a: "changeworker is a product of Impactpal Africa, a company building digital infrastructure for the social sector in Nigeria. Our team combines experience in nonprofit management, product development, and talent operations.",
        tags: ["company","team"],
      },
    ],
  },
  {
    id: "orgs",
    faqs: [
      {
        q: "How do I post a project?",
        a: "After creating your organization account, click 'Post a Project' and complete a structured brief. You'll describe the skills needed, your project scope, timeline, budget range, and any specific requirements. The whole process takes about 5 minutes.",
        tags: ["getting started","posting"],
      },
      {
        q: "How quickly will I receive candidate matches?",
        a: "Once your project is posted, changeworker starts surfacing relevant talent based on skills, SDG alignment, sector fit, and profile data. You can browse matching profiles, review proposals, and move into messaging directly in the platform.",
        tags: ["matching","speed"],
      },
      {
        q: "Can I choose my own freelancer, or do you assign one?",
        a: "You always choose. changeworker helps surface relevant profiles and proposals, but the final hiring decision is entirely yours. You can review profiles, ask clarifying questions, and select the person you feel most confident about.",
        tags: ["control","hiring"],
      },
      {
        q: "What if none of the matches are right for me?",
        a: "You can keep browsing, review more proposals, refine your brief, or continue conversations with other talent in the platform until you find the right fit.",
        tags: ["matching","quality"],
      },
      {
        q: "Can I rehire a freelancer I've worked with before?",
        a: "Yes. You can save talent profiles in the platform and return to them later when you want to start a new conversation or project.",
        tags: ["rehire","bench"],
      },
      {
        q: "What types of projects can I post?",
        a: "Any project requiring skilled professional services. Common examples include: grant writing and proposal development, monitoring and evaluation frameworks, communications strategy and content, fundraising campaigns, project management, data collection and analysis, capacity building, strategic planning, and research. If you're unsure whether your need is a fit, email us at hello@changeworker.ng.",
        tags: ["scope","types"],
      },
      {
        q: "Do I need to provide a specific budget?",
        a: "You provide a budget range rather than a fixed number. This helps us match you with freelancers whose rates align with your capacity. Typical project budgets on the platform range from ₦50,000 to ₦400,000+. We'll tell you honestly if your budget is below what's realistic for the scope you've described.",
        tags: ["budget","pricing"],
      },
    ],
  },
  {
    id: "freelancers",
    faqs: [
      {
        q: "How do I join as a freelancer?",
        a: "Click 'Find Work' on the homepage to start building your freelancer profile. You'll complete your bio, skills, work history, rates, and work samples, then use the platform to discover gigs, submit proposals, and manage conversations.",
        tags: ["getting started","application"],
      },
      {
        q: "What does the vetting process involve?",
        a: "The platform supports profile completion and verification steps such as government-issued ID, supporting documents, portfolio links, and public profile information. Clients can also review ratings, reviews, and previous platform activity when deciding who to hire.",
        tags: ["vetting","process"],
      },
      {
        q: "Do I need nonprofit experience to apply?",
        a: "It helps significantly, but isn't always required. We look for candidates who either have direct nonprofit experience or can demonstrate clear relevance of their skills to the sector - for example, a data analyst who has worked with social research data, or a writer with policy or advocacy experience. If you're passionate about impact work and have transferable skills, apply and explain your interest in your bio.",
        tags: ["eligibility","experience"],
      },
      {
        q: "How do I get matched to projects?",
        a: "You can browse gigs in the platform, submit proposals, and use your profile data to improve how relevant opportunities surface to you. Organizations then review proposals, profiles, and messages before making a hiring decision.",
        tags: ["matching","process"],
      },
      {
        q: "Can I set my own rates?",
        a: "Yes. You set your own rates during profile setup, expressed as a project rate or daily rate. Our team may advise you if your rates appear inconsistent with market norms, but the final decision is always yours. We do not cap rates, but we recommend being competitive within the nonprofit sector's budget realities.",
        tags: ["rates","pricing"],
      },
      {
        q: "What happens if an organization doesn't pay?",
        a: "changeworker supports on-platform payment, milestone review, final approval, and dispute flows. If a payment issue happens, the workspace history and dispute tools provide a documented path for resolution.",
        tags: ["payment","protection"],
      },
      {
        q: "Can I work with the same organization off-platform?",
        a: "Not within the first 12 months of a relationship established through changeworker. This exclusivity period protects the platform's integrity and ensures we can continue building the community. After 12 months, you're free to work directly. Circumventing this policy is a breach of our terms and may result in account removal.",
        tags: ["policy","exclusivity"],
      },
    ],
  },
  {
    id: "payments",
    faqs: [
      {
        q: "How does payment work?",
        a: "All payments flow through the changeworker platform using Paystack. The usual flow is: client hires, the workspace is created, work is submitted through milestones or final delivery, the client reviews, and approved funds move through the platform payout flow.",
        tags: ["process","escrow"],
      },
      {
        q: "What is the platform commission?",
        a: "changeworker uses a flat 10% platform fee. The fee supports matching, payments, workspace delivery flows, dispute handling, and ongoing support across the platform.",
        tags: ["fees","commission"],
      },
      {
        q: "What currencies and payment methods are supported?",
        a: "All transactions are in Nigerian Naira (₦). Payments are processed through Paystack, which supports bank transfers, debit cards, USSD, and bank account direct debits. We do not currently support international currencies or cryptocurrency.",
        tags: ["currency","methods"],
      },
      {
        q: "How long does it take to receive payment?",
        a: "Once the organization marks the project complete, funds are typically released to the freelancer within 1–3 business days, depending on your bank's processing time. If a dispute is raised, funds remain in escrow until resolution.",
        tags: ["timing","release"],
      },
      {
        q: "What if I want a refund as an organization?",
        a: "Refunds are not issued automatically. If you believe deliverables do not meet the agreed brief, use the platform's dispute flow so the work history, submissions, and conversations can be reviewed before a resolution is made.",
        tags: ["refund","dispute"],
      },
      {
        q: "Are there taxes I need to be aware of?",
        a: "As a freelancer, you are responsible for your own tax obligations under Nigerian law, including income tax and any applicable withholding tax. changeworker does not withhold taxes on your behalf. We recommend consulting a tax professional if you're unsure of your obligations. As an organization, the platform commission may be a deductible business expense - consult your accountant.",
        tags: ["tax","compliance"],
      },
    ],
  },
  {
    id: "matching",
    faqs: [
      {
        q: "How does the matching algorithm work?",
        a: "Matching uses structured profile and gig data such as skills, sector fit, rates, availability, SDG tags, and public profile information to help surface relevant talent and opportunities in the platform.",
        tags: ["process","algorithm"],
      },
      {
        q: "What factors determine who gets matched?",
        a: "Key factors: skill match (does the freelancer have the stated expertise?), sector experience (have they worked with similar organizations?), rate alignment (does the freelancer's rate fit the budget?), past performance (ratings from previous changeworker projects), and availability (are they currently taking new projects?).",
        tags: ["criteria","factors"],
      },
      {
        q: "How do I improve my chances of being matched?",
        a: "For freelancers: keep your profile complete and current, maintain a high rating, mark yourself as available when you are, and add recent work samples. For organizations: write clear, detailed project briefs with realistic budgets. Vague briefs slow down matching and reduce the quality of candidates we can identify.",
        tags: ["tips","optimization"],
      },
      {
        q: "Can I request a specific freelancer by name?",
        a: "Yes - if you've worked with them before, you can rehire directly from your saved talent. If you've seen their public profile and want to work with them for the first time, mention them in your project brief and we'll check their availability. We don't guarantee availability, but we'll always try.",
        tags: ["request","specific"],
      },
      {
        q: "What happens if a matched freelancer becomes unavailable?",
        a: "We'll source an alternative match promptly. Freelancers are expected to update their availability status, and we follow up before presenting them as matches. In the rare case of a last-minute cancellation, we prioritize finding a replacement quickly and will communicate expected timelines clearly.",
        tags: ["fallback","availability"],
      },
    ],
  },
  {
    id: "trust",
    faqs: [
      {
        q: "How do I know a freelancer is legitimate?",
        a: "Talent profiles can include verification status, portfolio samples, ratings, reviews, and past platform activity. Clients can use that information together with proposals and messaging to decide who to hire.",
        tags: ["vetting","verification"],
      },
      {
        q: "What protections do organizations have?",
        a: "Three layers: (1) Vetting - only quality-checked freelancers appear on the platform. (2) Escrow - you don't release payment until you're satisfied with the work. (3) Dispute resolution - if something goes wrong, our team mediates and can issue partial or full refunds. You're never left without recourse.",
        tags: ["protection","org"],
      },
      {
        q: "What protections do freelancers have?",
        a: "Three layers: (1) Escrow - funds are locked before you start, so you know the money is there. (2) Dispute resolution - we won't allow an organization to refuse payment for completed work without cause. (3) Review system - your reputation is protected; we investigate claims of unfair reviews.",
        tags: ["protection","freelancer"],
      },
      {
        q: "How do you handle disputes?",
        a: "Any participant in a workspace can raise a dispute from the platform. The dispute flow keeps the matter documented in-app so admins can review the workspace context, communication, and submitted evidence before deciding next steps.",
        tags: ["disputes","resolution"],
      },
      {
        q: "Can I report a user for misconduct?",
        a: "Yes. Use the 'Report' button on any profile, project, or message. You can also email trust@changeworker.ng directly. We investigate all reports confidentially and take appropriate action - from warnings to permanent account removal and legal referral for serious offenses.",
        tags: ["reporting","safety"],
      },
    ],
  },
  {
    id: "account",
    faqs: [
      {
        q: "How do I update my profile or account details?",
        a: "Log in and go to your dashboard profile page. You can update your bio, skills, rates, work samples, contact details, and related profile information there.",
        tags: ["settings","profile"],
      },
      {
        q: "I forgot my password - what do I do?",
        a: "Click 'Forgot password' on the login page and enter your registered email address. You'll receive a secure reset link within a few minutes. If you don't see it, check your spam folder. If you still can't access your account, email support@changeworker.ng.",
        tags: ["password","access"],
      },
      {
        q: "Can I have both an organization and a freelancer account?",
        a: "Currently, each email address can be registered to one account type. If you need both (e.g., you run an NGO but also consult independently), contact support@changeworker.ng - we can accommodate dual-role accounts in verified cases.",
        tags: ["account","dual"],
      },
      {
        q: "How do I close my account?",
        a: "Email support@changeworker.ng with your request. We'll confirm your identity and process the closure within 5 business days. Note: you cannot close your account while you have active projects, open disputes, or outstanding escrow funds. These must be resolved first.",
        tags: ["account","closure"],
      },
      {
        q: "Is my data secure on changeworker?",
        a: "We take account and payment security seriously, we rely on trusted infrastructure partners such as Firebase and Paystack, and we do not store full card details ourselves. Full details are in our Privacy Policy.",
        tags: ["security","data"],
      },
    ],
  },
]

/* ═══ SEARCH ══════════════════════════════════════════════════ */
function searchFAQs(query: string): { cat: string; faq: FAQ; catLabel: string; catColor: string }[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: { cat: string; faq: FAQ; catLabel: string; catColor: string }[] = []
  ALL_FAQS.forEach(cat => {
    const category = CATEGORIES.find(c => c.id === cat.id)!
    cat.faqs.forEach(faq => {
      if (
        faq.q.toLowerCase().includes(q) ||
        faq.a.toLowerCase().includes(q) ||
        faq.tags?.some(t => t.includes(q))
      ) {
        results.push({ cat: cat.id, faq, catLabel: category.label, catColor: category.color })
      }
    })
  })
  return results
}

/* ═══ FAQ ITEM ════════════════════════════════════════════════ */
function FaqItem({
  faq, idx, catColor, inView, defaultOpen = false, highlight = ""
}: {
  faq: FAQ; idx: number; catColor: string; inView: boolean; defaultOpen?: boolean; highlight?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [voted, setVoted] = useState<"up" | "down" | null>(null)

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text
    const parts = text.split(new RegExp(`(${term})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase()
        ? <mark key={i} style={{ background: `${catColor}25`, color: catColor, borderRadius: "3px", padding: "0 2px" }}>{part}</mark>
        : part
    )
  }

  return (
    <div
      className={`group border rounded-2xl overflow-hidden bg-white transition-all duration-300 ${inView && !highlight ? "reveal" : ""} ${open ? "" : "hover:border-gray-200"}`}
      style={{
        "--d": `${.04 + idx * .06}s`,
        borderColor: open ? `${catColor}35` : "#F3F4F6",
        boxShadow: open ? `0 8px 32px ${catColor}12` : "none",
      } as React.CSSProperties}
    >
      <button
        className="w-full flex items-start justify-between text-left transition-colors duration-200"
        style={{ padding: "1.25rem 1.5rem" }}
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-display font-semibold text-gray-900 text-sm leading-relaxed pr-6 pt-0.5 flex-1">
          {highlight ? highlightText(faq.q, highlight) : faq.q}
        </span>
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-all duration-350"
          style={{
            borderColor: open ? catColor : "#E5E7EB",
            background: open ? catColor : "transparent",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .35s ease, background .2s, border-color .2s",
          }}
        >
          <FiChevronDown size={13} style={{ color: open ? "white" : "#9CA3AF" }} />
        </span>
      </button>

      <div style={{ maxHeight: open ? "400px" : "0", transition: "max-height .45s cubic-bezier(.4,0,.2,1)", overflow: "hidden" }}>
        <div style={{ padding: "0 1.5rem 1.25rem" }}>
          <p className="text-gray-500 text-sm leading-[1.85] font-display font-normal mb-5">
            {highlight ? highlightText(faq.a, highlight) : faq.a}
          </p>

          {/* tags */}
          {faq.tags && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {faq.tags.map(tag => (
                <span key={tag} className="font-mono text-[10px] px-2.5 py-1 rounded-full"
                  style={{ background: `${catColor}10`, color: catColor }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* helpfulness vote */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
            <span className="text-gray-400 text-xs font-display">Was this helpful?</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setVoted("up")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all duration-200"
                style={{
                  background: voted === "up" ? `${catColor}15` : "#F9FAFB",
                  color: voted === "up" ? catColor : "#9CA3AF",
                  border: `1px solid ${voted === "up" ? `${catColor}30` : "#F3F4F6"}`,
                }}
              >
                <FiThumbsUp size={11} /> Yes
              </button>
              <button
                onClick={() => setVoted("down")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all duration-200"
                style={{
                  background: voted === "down" ? "#FFF5F5" : "#F9FAFB",
                  color: voted === "down" ? "#EF4444" : "#9CA3AF",
                  border: `1px solid ${voted === "down" ? "#FCA5A5" : "#F3F4F6"}`,
                }}
              >
                <FiThumbsDown size={11} /> No
              </button>
            </div>
            {voted && (
              <span className="text-xs font-display" style={{ color: voted === "up" ? catColor : "#6B7280" }}>
                {voted === "up" ? "Thanks! Glad that helped." : "We'll work on improving this."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function FAQPage() {
  const scrollY   = useScrollY()
  const activeCat = useActiveCategory(CAT_IDS)

  const [query, setQuery]           = useState("")
  const [debouncedQuery, setDQ]     = useState("")
  const [searchResults, setResults] = useState<ReturnType<typeof searchFAQs>>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const [expandAll, setExpandAll]   = useState(false)

  const heroRef  = useInView(.05)
  const statsRef = useInView()
  const bodyRef  = useInView(.02)
  const ctaRef   = useInView()

  const searchRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDQ(query), 280)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (debouncedQuery.trim().length > 1) {
      setResults(searchFAQs(debouncedQuery))
    } else {
      setResults([])
    }
  }, [debouncedQuery])

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const totalFAQs = ALL_FAQS.reduce((acc, c) => acc + c.faqs.length, 0)
  const isSearching = debouncedQuery.trim().length > 1

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

        @keyframes fadeUp    { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeLeft  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes orb1      { 0%,100%{transform:translate(0,0)scale(1)} 35%{transform:translate(50px,-55px)scale(1.1)} 70%{transform:translate(-30px,28px)scale(.93)} }
        @keyframes orb2      { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,40px)scale(.92)} }
        @keyframes orb3      { 0%,100%{transform:translate(0,0)} 55%{transform:translate(25px,45px)scale(1.06)} }
        @keyframes shimTxt   { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        @keyframes gradShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes borderRot { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes dotDrift  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse     { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes searchPop { from{opacity:0;transform:translateY(-8px)scale(.97)} to{opacity:1;transform:translateY(0)scale(1)} }
        @keyframes countUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dashDraw  { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
        @keyframes waveBar   { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
        @keyframes tagBounce { 0%,100%{transform:translateY(0)scale(1)} 50%{transform:translateY(-3px)scale(1.04)} }

        .reveal   { opacity:0; animation:fadeUp .75s cubic-bezier(.22,1,.36,1) var(--d,0s) both; }
        .reveal-l { opacity:0; animation:fadeLeft .75s cubic-bezier(.22,1,.36,1) var(--d,0s) both; }

        .shimmer {
          background: linear-gradient(90deg,#F97316 0%,#EA580C 15%,#FB923C 40%,#FCD34D 55%,#FB923C 70%,#EA580C 85%,#F97316 100%);
          background-size: 600px 100%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimTxt 3s linear infinite;
        }

        .grid-dark  { background-image: linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px); background-size: 56px 56px; }
        .dot-bg     { background-image: radial-gradient(rgba(249,115,22,.14) 1.5px,transparent 1.5px); background-size: 26px 26px; }

        .anim-o1 { animation: orb1 14s ease-in-out infinite; }
        .anim-o2 { animation: orb2 18s ease-in-out infinite; }
        .anim-o3 { animation: orb3 11s ease-in-out infinite; }
        .anim-fy { animation: floatY 6s ease-in-out infinite; }

        .noise::after { content:''; position:absolute; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"); pointer-events:none; opacity:.7; z-index:0; }

        .draw-line { stroke-dasharray:1000; animation:dashDraw 2s ease both; }

        .search-box {
          width: 100%;
          background: rgba(255,255,255,.07);
          border: 1.5px solid rgba(255,255,255,.12);
          border-radius: 16px;
          padding: 1rem 1rem 1rem 3.25rem;
          font-family: 'Sora', sans-serif;
          font-size: 1rem;
          color: white;
          outline: none;
          transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
          backdrop-filter: blur(12px);
        }
        .search-box::placeholder { color: rgba(255,255,255,.28); }
        .search-box:focus {
          border-color: rgba(249,115,22,.6);
          background: rgba(255,255,255,.1);
          box-shadow: 0 0 0 4px rgba(249,115,22,.15);
        }

        .cat-pill {
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease, background .15s ease;
        }
        .cat-pill:hover { transform: translateY(-2px); }

        .nav-item-active {
          background: rgba(249,115,22,.08) !important;
          border-color: rgba(249,115,22,.25) !important;
          color: #EA580C !important;
        }

        .search-results-pop { animation: searchPop .3s cubic-bezier(.22,1,.36,1) both; }
        .tag-chip { animation: tagBounce .5s ease infinite; }

        mark { background: transparent; }
      `}</style>

      <div className="font-display bg-white text-gray-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-900 min-h-screen">
        <Navbar />

        {/* ╔══════════════════════════════════════════════════════╗
            §1  HERO + SEARCH
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="relative overflow-hidden bg-[#060912] pt-28 pb-0">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 38%,rgba(249,115,22,.13) 0%,transparent 68%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 45% at 10% 88%,rgba(99,102,241,.1) 0%,transparent 55%)" }} />

          <div className="absolute anim-o1 w-[700px] h-[700px] rounded-full bg-orange-500/8 blur-3xl -top-60 right-0 pointer-events-none" />
          <div className="absolute anim-o2 w-[400px] h-[400px] rounded-full bg-indigo-500/8 blur-3xl -left-20 bottom-0 pointer-events-none" />

          {/* SVG nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-12" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[[8,18],[92,12],[95,66],[5,72],[50,86],[28,40],[80,46],[62,22],[18,60]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r=".5" fill="#F97316"
                style={{ animation: `dotDrift ${4+i}s ease-in-out ${i*.3}s infinite` }} />
            ))}
            {([[8,18,28,40],[28,40,62,22],[28,40,50,86],[62,22,92,12],[5,72,50,86]] as [number,number,number,number][]).map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F97316" strokeWidth=".1"
                className="draw-line" style={{ animationDelay: `${i*.3}s` }} />
            ))}
          </svg>

          <div className="relative z-10 max-w-4xl mx-auto px-6 pb-0 w-full" ref={heroRef.ref}>
            {/* badge */}
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".05s" } as React.CSSProperties}>
              <FiHelpCircle size={12} className="text-orange-400" />
              <span className="text-white/50 text-xs font-mono tracking-[.15em] uppercase">Help Centre</span>
              <span className="font-mono text-xs text-orange-400 font-bold">{totalFAQs} answers</span>
            </div>

            <h1 className={`font-display font-black text-6xl lg:text-7xl text-white leading-[.93] tracking-tight mb-4 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".15s" } as React.CSSProperties}>
              Frequently asked<br />
              <span className="shimmer">questions.</span>
            </h1>
            <p className={`font-serif italic text-2xl text-white/38 mb-12 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".28s" } as React.CSSProperties}>
              Everything you need to know about changeworker.
            </p>

            {/* SEARCH BAR */}
            <div className={`relative mb-6 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".38s" } as React.CSSProperties}>
              <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search questions, topics, or keywords..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="search-box"
              />
              {query && (
                <button onClick={() => { setQuery(""); setDQ(""); searchRef.current?.focus() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FiX size={12} className="text-white/60" />
                </button>
              )}

              {/* Search results dropdown */}
              {isSearching && (searchFocused || query) && (
                <div className="search-results-pop absolute top-full left-0 right-0 mt-2 bg-[#0E1120] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-white/5 flex justify-between items-center">
                        <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider">
                          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{debouncedQuery}"
                        </span>
                      </div>
                      {searchResults.slice(0, 8).map(({ cat, faq, catLabel, catColor }, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery("")
                            setDQ("")
                            setTimeout(() => {
                              document.getElementById(cat)?.scrollIntoView({ behavior: "smooth", block: "start" })
                            }, 100)
                          }}
                          className="w-full text-left px-4 py-3.5 border-b border-white/4 hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono"
                              style={{ background: `${catColor}20`, color: catColor }}>{catLabel}</span>
                            <p className="text-white/70 text-xs font-display leading-relaxed group-hover:text-white transition-colors">{faq.q}</p>
                          </div>
                        </button>
                      ))}
                      {searchResults.length > 8 && (
                        <div className="px-4 py-2.5 text-center">
                          <span className="text-white/30 text-xs font-mono">+{searchResults.length - 8} more results - scroll page to find them</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <FiSearch size={24} className="text-white/15 mx-auto mb-3" />
                      <p className="text-white/40 text-sm font-display">No results for "{debouncedQuery}"</p>
                      <p className="text-white/20 text-xs font-display mt-1">Try different keywords or browse the categories below</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* popular topics */}
            <div className={`flex flex-wrap gap-2 pb-16 ${heroRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".48s" } as React.CSSProperties}>
              <span className="text-white/25 text-xs font-display self-center mr-1">Popular:</span>
              {["commission","escrow","vetting","matching","refund","Nigeria","freelancer","payments"].map((tag, i) => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); searchRef.current?.focus() }}
                  className="cat-pill font-mono text-[11px] px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-white/45 hover:text-orange-300 hover:border-orange-500/30 hover:bg-orange-500/8 transition-all duration-200"
                  style={{ animationDelay: `${i * .05}s` }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* wave */}
          <div className="pointer-events-none" style={{ height: "72px" }}>
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,36 C360,72 1080,0 1440,36 L1440,72 L0,72 Z" fill="#F9FAFB" />
            </svg>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §2  STATS BAR
        ╚══════════════════════════════════════════════════════╝ */}
        <div ref={statsRef.ref} className="bg-[#F9FAFB] border-b border-gray-100 py-8">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { val: totalFAQs, label: "Questions answered", color: "#F97316", icon: FiHelpCircle },
                { val: 7,          label: "Topic categories",  color: "#6366F1", icon: FiMessageSquare },
                { val: 24,         label: "Hour response time",color: "#10B981", icon: FiClock },
                { val: 98,         label: "% satisfaction",    color: "#EC4899", icon: FiStar },
              ].map(({ val, label, color, icon: Icon }, i) => (
                <div key={i} className={`flex flex-col items-center gap-1.5 ${statsRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": `${.05 + i * .07}s` } as React.CSSProperties}>
                  <Icon size={18} style={{ color }} />
                  <span className="font-display font-black text-3xl text-gray-900" style={{ animation: statsRef.inView ? `countUp .6s ease ${.05 + i * .07}s both` : "none" }}>
                    {val}{label.includes("%") ? "%" : "+"}
                  </span>
                  <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider text-center">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════════════╗
            §3  CATEGORY PILLS (sticky on mobile)
        ╚══════════════════════════════════════════════════════╝ */}
        <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-12">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const isActive = activeCat === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`cat-pill shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-display font-semibold transition-all duration-200 ${
                      isActive ? "nav-item-active" : "border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <Icon size={12} style={{ color: isActive ? cat.color : undefined }} />
                    {cat.label}
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: isActive ? `${cat.color}15` : "#F3F4F6", color: isActive ? cat.color : "#9CA3AF" }}>
                      {cat.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════════════╗
            §4  MAIN CONTENT: SIDEBAR + FAQS
        ╚══════════════════════════════════════════════════════╝ */}
        <div className="relative bg-white" ref={bodyRef.ref}>
          <div className="max-w-7xl mx-auto px-4 lg:px-12 py-16">
            <div className="grid lg:grid-cols-[240px_1fr] gap-12">

              {/* STICKY SIDEBAR */}
              <aside className="hidden lg:block">
                <div className="sticky top-36">
                  <p className="font-mono text-[10px] uppercase tracking-[.22em] text-gray-400 mb-4 px-2">Categories</p>
                  <nav className="flex flex-col gap-1 mb-8">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon
                      const isActive = activeCat === cat.id
                      return (
                        <button
                          key={cat.id}
                          onClick={() => scrollToCategory(cat.id)}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
                            isActive
                              ? "nav-item-active border-orange-200/60"
                              : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? "" : "bg-gray-200 group-hover:bg-orange-200"}`}
                            style={{ background: isActive ? cat.color : undefined, boxShadow: isActive ? `0 0 6px ${cat.color}80` : "none" }} />
                          <Icon size={13} className="shrink-0" style={{ color: isActive ? cat.color : undefined }} />
                          <span className={`text-xs font-display font-medium flex-1 ${isActive ? "text-orange-700" : ""}`}>{cat.label}</span>
                          <span className="font-mono text-[10px]" style={{ color: isActive ? cat.color : "#D1D5DB" }}>{cat.count}</span>
                        </button>
                      )
                    })}
                  </nav>

                  {/* expand all toggle */}
                  <div className="px-3">
                    <button
                      onClick={() => setExpandAll(e => !e)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-display font-semibold text-gray-600 hover:border-orange-200 hover:text-orange-600 transition-all duration-200 mb-4"
                    >
                      <span>{expandAll ? "Collapse all" : "Expand all"}</span>
                      <FiChevronDown size={12} style={{ transform: expandAll ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
                    </button>

                    <div className="space-y-2">
                      <a href="/contact" className="flex items-center gap-2 text-xs text-gray-400 hover:text-orange-500 transition-colors font-display group">
                        <FiMessageSquare size={11} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                        Still have questions?
                      </a>
                      <a href="mailto:hello@changeworker.ng" className="flex items-center gap-2 text-xs text-gray-400 hover:text-orange-500 transition-colors font-display group">
                        <FiMail size={11} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
                        hello@changeworker.ng
                      </a>
                    </div>
                  </div>
                </div>
              </aside>

              {/* FAQ CONTENT */}
              <main className="min-w-0">

                {/* SEARCH RESULTS MODE */}
                {isSearching ? (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="font-mono text-xs text-orange-500 uppercase tracking-[.22em] mb-1">Search results</p>
                        <h2 className="font-display font-black text-2xl text-gray-900">
                          {searchResults.length > 0
                            ? <>{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for <span className="shimmer">"{debouncedQuery}"</span></>
                            : <>No results for "{debouncedQuery}"</>
                          }
                        </h2>
                      </div>
                      <button onClick={() => { setQuery(""); setDQ("") }}
                        className="flex items-center gap-1.5 text-xs font-display text-gray-400 hover:text-gray-700 transition-colors">
                        <FiX size={12} /> Clear
                      </button>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {searchResults.map(({ cat, faq, catColor, catLabel }, i) => {
                          const catData = CATEGORIES.find(c => c.id === cat)!
                          return (
                            <div key={i}>
                              {(i === 0 || searchResults[i - 1].cat !== cat) && (
                                <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0">
                                  <catData.icon size={13} style={{ color: catColor }} />
                                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold" style={{ color: catColor }}>{catLabel}</span>
                                </div>
                              )}
                              <FaqItem faq={faq} idx={i} catColor={catColor} inView highlight={debouncedQuery} />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                        <FiSearch size={36} className="text-gray-200 mx-auto mb-4" />
                        <p className="font-display font-bold text-gray-500 text-lg mb-2">Nothing found</p>
                        <p className="text-gray-400 text-sm font-display max-w-xs mx-auto mb-6">
                          Try "commission", "vetting", "payment", or browse the categories below.
                        </p>
                        <button onClick={() => { setQuery(""); setDQ("") }}
                          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-display font-bold text-sm px-6 py-3 rounded-xl transition-colors">
                          Browse all FAQs <FiArrowRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                ) : (
                  /* NORMAL MODE: all categories */
                  <div className="flex flex-col gap-16">
                    {ALL_FAQS.map(({ id, faqs }) => {
                      const cat = CATEGORIES.find(c => c.id === id)!
                      const CatIcon = cat.icon
                      return (
                        <div key={id} id={id} className="scroll-mt-36">
                          {/* category header */}
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${cat.color}12` }}>
                              <CatIcon size={20} style={{ color: cat.color }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-0.5">
                                <h2 className="font-display font-black text-xl text-gray-900">{cat.label}</h2>
                                <span className="font-mono text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: `${cat.color}10`, color: cat.color }}>
                                  {cat.count} questions
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* color accent line */}
                          <div className="h-0.5 mb-8 rounded-full" style={{ background: `linear-gradient(90deg,${cat.color},${cat.color}00)` }} />

                          {/* faqs */}
                          <div className="flex flex-col gap-3">
                            {faqs.map((faq, i) => (
                              <FaqItem
                                key={i}
                                faq={faq}
                                idx={i}
                                catColor={cat.color}
                                inView={bodyRef.inView}
                                defaultOpen={expandAll}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>

        {/* ╔══════════════════════════════════════════════════════╗
            §5  STILL NEED HELP
        ╚══════════════════════════════════════════════════════╝ */}
        <section ref={ctaRef.ref} className="relative py-24 bg-[#FAFAF9] border-t border-gray-100 overflow-hidden">
          <div className="absolute anim-o1 w-80 h-80 rounded-full bg-orange-50 blur-3xl right-0 top-0 pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-64 h-64 opacity-25 dot-bg pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
            <div className={`text-center mb-12 ${ctaRef.inView ? "reveal" : "opacity-0"}`} style={{ "--d": ".0s" } as React.CSSProperties}>
              <span className="font-mono text-xs text-orange-500 uppercase tracking-[.25em] mb-4 block">Still need help?</span>
              <h2 className="font-display text-4xl font-black text-gray-900 mb-3">
                Didn't find your answer?
              </h2>
              <p className="text-gray-400 text-base font-display font-normal max-w-md mx-auto">
                Reach out any time and share what you need help with. We read every message and follow up as quickly as we can.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  icon: FiMail,
                  color: "#F97316",
                  title: "Email us",
                  body: "Write to us any time and share the details of what you need help with.",
                  action: "hello@changeworker.ng",
                  href: "mailto:hello@changeworker.ng",
                  cta: "Send email",
                },
                {
                  icon: FiMessageSquare,
                  color: "#6366F1",
                  title: "Contact page",
                  body: "Use our detailed contact form to tell us exactly what you need - routing to the right team.",
                  action: "Open contact form",
                  href: "/contact",
                  cta: "Go to contact",
                },
                {
                  icon: TbHeadset,
                  color: "#10B981",
                  title: "WhatsApp support",
                  body: "Chat with our support team on WhatsApp. Available Monday to Friday, 9am–6pm WAT.",
                  action: "+234 800 000 0000",
                  href: "https://wa.me/2348000000000",
                  cta: "Open WhatsApp",
                },
              ].map(({ icon: Icon, color, title, body, action, href, cta }, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border border-gray-100 bg-white p-7 flex flex-col gap-5 hover:-translate-y-1.5 transition-transform duration-300 ${ctaRef.inView ? "reveal" : "opacity-0"}`}
                  style={{ "--d": `${.1 + i * .1}s` } as React.CSSProperties}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}12` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-gray-900 text-base mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm font-display font-normal leading-relaxed mb-3">{body}</p>
                    <p className="font-mono text-xs" style={{ color }}>{action}</p>
                  </div>
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener"
                    className="flex items-center gap-2 font-display font-bold text-sm transition-all duration-200 group"
                    style={{ color }}
                  >
                    {cta} <FiArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ╔══════════════════════════════════════════════════════╗
            §6  DARK CTA STRIP
        ╚══════════════════════════════════════════════════════╝ */}
        <section className="relative overflow-hidden bg-[#060912] py-28 noise">
          <div className="absolute inset-0 grid-dark" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%,rgba(249,115,22,.12) 0%,transparent 65%)" }} />
          <div className="absolute anim-o1 w-[800px] h-[800px] rounded-full bg-orange-500/7 blur-3xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-orange-500/8 pointer-events-none" style={{ animation: "borderRot 28s linear infinite" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[780px] rounded-full border border-white/3 pointer-events-none" style={{ animation: "borderRot 48s linear infinite reverse" }} />

          <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
            <p className="font-mono text-xs text-orange-400 uppercase tracking-[.3em] mb-6 entry" style={{ animationDelay: ".05s" }}>
              Ready to get started?
            </p>
            <h2 className="entry font-display font-black text-5xl lg:text-6xl text-white leading-[.95] mb-4" style={{ animationDelay: ".15s" }}>
              Less googling.
            </h2>
            <h2 className="entry font-serif italic text-4xl lg:text-5xl text-white/40 mb-10 leading-tight" style={{ animationDelay: ".25s" }}>
              More meaningful work.
            </h2>
            <div className="entry flex flex-wrap gap-4 justify-center" style={{ animationDelay: ".38s" }}>
              <a href="/signup" className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-display font-black px-10 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,.35)] transition-all duration-200 group"
                style={{ padding: "1.1rem 2.5rem" }}>
                Get started <FiArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="/contact" className="inline-flex items-center gap-2.5 border border-white/12 hover:border-orange-400 text-white/60 hover:text-white font-display font-black px-10 rounded-2xl backdrop-blur-sm transition-all duration-200"
                style={{ padding: "1.1rem 2.5rem" }}>
                Talk to us
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


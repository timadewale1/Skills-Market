import Link from "next/link"
import PageShell from "@/components/marketing/PageShell"
import { allWhyUs, findWhyUsBySlug } from "@/lib/navSlug"

export async function generateStaticParams() {
  return allWhyUs().map((x) => ({ slug: x.slug }))
}

export const dynamicParams = true

function contentFor(slug: string) {
  if (slug === "success-stories") {
    return {
      headline: "Success Stories",
      intro:
        "Impact teams and purpose-driven talent use SkillsMarket to deliver real-world outcomes — from climate research to clean energy deployment.",
      sections: [
        {
          title: "Climate Research Delivered on Time",
          body: "An environmental nonprofit hired a Climate Researcher and ESG Reporting Specialist to prepare a donor-ready sustainability report. Funds were secured in escrow, milestones tracked in the workspace, and final deliverables approved within two weeks.",
        },
        {
          title: "Mini-Grid Deployment Support",
          body: "A renewable energy startup hired a Solar System Designer and Energy Auditor to scope a rural mini-grid project. Clear agreement terms and protected payments reduced risk for both sides.",
        },
        {
          title: "AI for Civic Monitoring",
          body: "A civic tech organization partnered with an AI for Social Good Engineer to automate environmental compliance monitoring. Structured communication and secure funding made long-term collaboration possible.",
        },
      ],
      highlight:
        "Impact work requires trust. Our structured agreements and protected funding system reduce friction so teams can focus on results.",
      cta: { label: "Hire Talent", href: "/hire" },
    }
  }

  if (slug === "how-to-hire") {
    return {
      headline: "How to Hire on SkillsMarket",
      intro:
        "Hiring impact talent should be structured, secure, and outcome-driven. Our process protects both clients and freelancers.",
      sections: [
        {
          title: "1. Choose the Right Role",
          body: "Browse curated categories across Climate, Energy, Technology for Good, Design, and Policy. Each role page routes into live search results.",
        },
        {
          title: "2. Agree Scope & Budget",
          body: "Discuss expectations in chat. Finalize deliverables, timeline, payment type (fixed/hourly), and agreed amount inside the workspace agreement.",
        },
        {
          title: "3. Fund Securely",
          body: "Clients fund the full agreed amount upfront. Funds are held securely until final work is delivered and approved.",
        },
        {
          title: "4. Review & Approve",
          body: "Talent submits final work inside the workspace. Clients review before payout is released.",
        },
      ],
      highlight:
        "No upfront freelancer risk. No client payment risk. Just structured delivery.",
      cta: { label: "Start Hiring", href: "/hire" },
    }
  }

  if (slug === "reviews") {
    return {
      headline: "Reviews & Accountability",
      intro:
        "Trust is built on transparency. Our review system strengthens the entire ecosystem.",
      sections: [
        {
          title: "Mutual Reviews",
          body: "After a workspace is completed, both client and talent can leave structured feedback. This builds reputation and long-term credibility.",
        },
        {
          title: "Outcome-Focused Feedback",
          body: "Reviews are centered around delivery quality, communication, timeliness, and professionalism.",
        },
        {
          title: "Long-Term Reputation",
          body: "High-performing talent build visible track records. Reliable clients attract stronger applicants.",
        },
      ],
      highlight:
        "The best impact work happens when trust compounds over time.",
      cta: { label: "Find Work", href: "/jobs" },
    }
  }

  if (slug === "how-to-find-work") {
    return {
      headline: "How to Find Work",
      intro:
        "SkillsMarket helps purpose-driven professionals build sustainable freelance careers in climate, energy, civic tech, and development.",
      sections: [
        {
          title: "1. Complete Your Profile",
          body: "Highlight your skills, impact experience, and measurable outcomes. Clients look for proof of results.",
        },
        {
          title: "2. Apply Strategically",
          body: "Submit proposals that clearly define deliverables, timelines, and value. Avoid generic pitches.",
        },
        {
          title: "3. Deliver Through the Workspace",
          body: "All communication and file submissions happen inside the workspace. This protects your work history.",
        },
        {
          title: "4. Get Paid Securely",
          body: "Once final work is approved, payout becomes available. Funds can be withdrawn securely to your verified bank account.",
        },
      ],
      highlight:
        "We protect your earnings while helping you build long-term credibility.",
      cta: { label: "Browse Jobs", href: "/jobs" },
    }
  }

  // featured-resources
  return {
    headline: "Featured Resources",
    intro:
      "Access practical guides and insights for building, funding, and delivering impactful work.",
    sections: [
      {
        title: "Hiring Playbooks",
        body: "Templates for defining scope, structuring agreements, and setting realistic timelines.",
      },
      {
        title: "Freelancer Proposal Guides",
        body: "Learn how to write outcome-focused proposals that stand out.",
      },
      {
        title: "Impact Delivery Frameworks",
        body: "Best practices for climate reporting, energy deployment, civic automation, and evaluation projects.",
      },
      {
        title: "Payment & Escrow Transparency",
        body: "Understand how funding, escrow protection, platform fees (10%), and withdrawals work.",
      },
    ],
    highlight:
      "We don’t just connect talent and clients — we provide the structure to succeed.",
    cta: { label: "Explore Hire Categories", href: "/hire" },
  }
}

export default async function WhyUsPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  // params can be a promise in certain edge cases; unwrap it safely
  const { slug } = (await params) as { slug: string }
  const found = findWhyUsBySlug(slug)

  if (!found) {
    return (
      <PageShell title="Page not found" subtitle="This Why Us page doesn't exist (or the link is outdated).">
        <div className="rounded-2xl border bg-white p-6">
          <Link href="/why-us" className="inline-flex rounded-2xl bg-[var(--primary)] text-white px-5 py-3 font-extrabold">
            Back to Why Us
          </Link>
        </div>
      </PageShell>
    )
  }

  const c = contentFor(slug)

  return (
    <PageShell title={c.headline} subtitle={c.intro}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {c.sections.map((section) => (
            <div key={section.title} className="rounded-2xl border bg-white p-6">
              <h3 className="text-lg font-extrabold text-gray-900">
                {section.title}
              </h3>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}

          <div className="rounded-2xl bg-[var(--secondary)] border p-6">
            <div className="font-extrabold text-gray-900">
              Why This Matters
            </div>
            <p className="mt-2 text-sm text-gray-700">
              {c.highlight}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 h-fit">
          <div className="font-extrabold text-gray-900">
            Ready to get started?
          </div>

          <div className="mt-5 space-y-3">
            <Link
              href={c.cta.href}
              className="block rounded-2xl bg-[var(--primary)] text-white px-5 py-3 font-extrabold text-center hover:opacity-90 transition"
            >
              {c.cta.label}
            </Link>

            <Link
              href="/signup"
              className="block rounded-2xl border px-5 py-3 font-extrabold text-center hover:shadow-sm transition"
            >
              Create an Account
            </Link>

            <Link
              href="/why-us"
              className="block rounded-2xl bg-[var(--secondary)] border px-5 py-3 font-extrabold text-center hover:shadow-sm transition"
            >
              Back to Why Us
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

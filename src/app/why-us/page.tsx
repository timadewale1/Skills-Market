import Link from "next/link"
import PageShell from "@/components/marketing/PageShell"
import { whyUsLinks } from "@/data/navCategories"
import { slugify } from "@/lib/navSlug"

export const metadata = {
  title: "Why Us | SkillsMarket",
  description: "Learn why impact teams and purpose-driven freelancers choose SkillsMarket.",
}

export default function WhyUsLanding() {
  return (
    <PageShell
      title="Why SkillsMarket?"
      subtitle="Everything you need to build, fund, and deliver impact work safely."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {whyUsLinks.map((x) => (
          <Link
            key={x.title}
            href={`/why-us/${slugify(x.title)}`}
            className="rounded-2xl border bg-white p-6 hover:border-[var(--primary)] hover:bg-[var(--secondary)] transition"
          >
            <div className="font-extrabold text-gray-900">{x.title}</div>
            <div className="text-sm text-gray-600 mt-1">{x.description}</div>
            <div className="mt-4 text-sm font-extrabold text-[var(--primary)]">Read more →</div>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}

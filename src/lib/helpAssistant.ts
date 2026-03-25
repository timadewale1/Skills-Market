export type HelpRole = "talent" | "client" | "admin"

export type HelpFaq = {
  id: string
  question: string
  answer: string
  href?: string
}

type HelpIntent = {
  id: string
  keywords: string[]
  answer: string
  href?: string
}

const sharedFallbacks = [
  "Try one of the self-help questions below, or send a support message if you need a human to step in.",
  "I can help with dashboard workflow questions like applying for gigs, posting gigs, proposals, messages, workspaces, payouts, and reviews.",
]

const TALENT_INTENTS: HelpIntent[] = [
  {
    id: "apply_gig",
    keywords: ["apply", "gig", "proposal", "find work", "job"],
    answer:
      "To apply for a gig, open Find Work, choose a gig, review the brief, then submit your proposal from the gig detail page. Your proposal will show up in Proposals so you can track whether it is submitted, shortlisted, accepted, or rejected.",
    href: "/dashboard/find-work",
  },
  {
    id: "profile_complete",
    keywords: ["profile", "complete", "kyc", "verification", "verify"],
    answer:
      "Complete your profile from Profile in the dashboard. Add your bio, skills, SDG focus, samples, and verification details. A more complete profile improves matching and helps clients trust your submissions.",
    href: "/dashboard/profile",
  },
  {
    id: "messages",
    keywords: ["message", "chat", "conversation", "client"],
    answer:
      "When a conversation is available, you can open it from Messages. That is where you discuss scope, review the agreement, and continue communication during the workspace.",
    href: "/dashboard/messages",
  },
  {
    id: "workspace_submit",
    keywords: ["milestone", "final work", "workspace", "submit", "delivery"],
    answer:
      "Once a workspace is active, open Workspaces and go into the project. Submit milestone work or final work from there, attach your files, and wait for the client to review and approve.",
    href: "/dashboard/workspaces",
  },
  {
    id: "wallet_withdraw",
    keywords: ["withdraw", "wallet", "earnings", "bank", "payout"],
    answer:
      "Go to Wallet to set up your bank account, verify it, and request a withdrawal once you have available earnings. Completed and approved project payments flow into your wallet history there.",
    href: "/dashboard/wallet",
  },
]

const CLIENT_INTENTS: HelpIntent[] = [
  {
    id: "post_gig",
    keywords: ["post", "gig", "create", "job", "brief"],
    answer:
      "To post a gig, open Post a Gig from your dashboard, fill in the brief, budget, timeline, work mode, and required skills, then publish it. You can manage all posted gigs from the Gigs page.",
    href: "/dashboard/post-gig",
  },
  {
    id: "review_proposals",
    keywords: ["proposal", "review", "shortlist", "hire", "talent"],
    answer:
      "Open Gigs or Messages to review incoming proposals and conversation context. Once you are ready, shortlist or accept a talent and continue the hiring flow into a workspace.",
    href: "/dashboard/gigs",
  },
  {
    id: "find_talent",
    keywords: ["find", "search", "talent", "saved talent"],
    answer:
      "Use Search Talent to browse public profiles, compare skills and SDG fit, then save or message the people you want to work with. Saved Talent keeps your shortlist easy to revisit.",
    href: "/dashboard/find-talent",
  },
  {
    id: "workspace_review",
    keywords: ["workspace", "approve", "milestone", "final work"],
    answer:
      "Open Workspaces to review milestone submissions, approve or request changes, and approve final work when delivery is complete. That same workspace keeps your files, agreement, and payment status together.",
    href: "/dashboard/workspaces",
  },
  {
    id: "fund_wallet",
    keywords: ["wallet", "fund", "payment", "deposit", "escrow"],
    answer:
      "Use Wallet to see funded workspace amounts, transaction history, and payment-related actions. Funding and release events are also reflected inside the relevant workspace.",
    href: "/dashboard/wallet",
  },
]

const ADMIN_INTENTS: HelpIntent[] = [
  {
    id: "verify_users",
    keywords: ["verify", "kyc", "talent", "client", "approve"],
    answer:
      "Use Talents and Clients to review profile and KYC details. Open the relevant user profile to verify, reject, enable, disable, or inspect their linked gigs, proposals, and workspaces.",
    href: "/admin/talents",
  },
  {
    id: "disputes",
    keywords: ["dispute", "resolve", "issue", "refund", "payout"],
    answer:
      "Use Disputes to review workspace-linked escalations, read the case details, and resolve them with the available outcome options. The admin dispute view keeps the conversation, evidence, and workspace context together.",
    href: "/admin/disputes",
  },
  {
    id: "support_inbox",
    keywords: ["support", "ticket", "help", "reply", "inbox"],
    answer:
      "Open the support inbox to read user help requests from the dashboard assistant and reply directly. Support messages are separate from normal client-talent message threads.",
    href: "/admin/support",
  },
  {
    id: "transactions",
    keywords: ["transaction", "wallet", "revenue", "earnings", "payment"],
    answer:
      "Use Transactions and Wallets to review funding, payouts, escrow exposure, and platform earnings. Analytics gives you the broader totals and trend view.",
    href: "/admin/transactions",
  },
  {
    id: "wellness",
    keywords: ["wellness", "health", "system", "check"],
    answer:
      "The system wellness card on the admin dashboard checks core environment and service readiness, including Firebase admin access, Firestore reads, notifications, and payment configuration.",
    href: "/admin/dashboard",
  },
]

export const HELP_FAQS: Record<HelpRole, HelpFaq[]> = {
  talent: [
    {
      id: "talent-apply",
      question: "How do I apply for a gig?",
      answer: TALENT_INTENTS[0].answer,
      href: TALENT_INTENTS[0].href,
    },
    {
      id: "talent-profile",
      question: "How do I complete my profile?",
      answer: TALENT_INTENTS[1].answer,
      href: TALENT_INTENTS[1].href,
    },
    {
      id: "talent-workspace",
      question: "How do I submit milestone or final work?",
      answer: TALENT_INTENTS[3].answer,
      href: TALENT_INTENTS[3].href,
    },
    {
      id: "talent-wallet",
      question: "How do I withdraw my earnings?",
      answer: TALENT_INTENTS[4].answer,
      href: TALENT_INTENTS[4].href,
    },
  ],
  client: [
    {
      id: "client-post",
      question: "How do I post a gig?",
      answer: CLIENT_INTENTS[0].answer,
      href: CLIENT_INTENTS[0].href,
    },
    {
      id: "client-review",
      question: "How do I review proposals and hire?",
      answer: CLIENT_INTENTS[1].answer,
      href: CLIENT_INTENTS[1].href,
    },
    {
      id: "client-workspace",
      question: "How do I approve milestone or final work?",
      answer: CLIENT_INTENTS[3].answer,
      href: CLIENT_INTENTS[3].href,
    },
    {
      id: "client-wallet",
      question: "Where do I see funding and payment activity?",
      answer: CLIENT_INTENTS[4].answer,
      href: CLIENT_INTENTS[4].href,
    },
  ],
  admin: [
    {
      id: "admin-verify",
      question: "How do I verify a talent or client?",
      answer: ADMIN_INTENTS[0].answer,
      href: ADMIN_INTENTS[0].href,
    },
    {
      id: "admin-disputes",
      question: "Where do I resolve disputes?",
      answer: ADMIN_INTENTS[1].answer,
      href: ADMIN_INTENTS[1].href,
    },
    {
      id: "admin-support",
      question: "Where do support chats appear?",
      answer: ADMIN_INTENTS[2].answer,
      href: ADMIN_INTENTS[2].href,
    },
    {
      id: "admin-wallets",
      question: "Where do I review revenue and wallet activity?",
      answer: ADMIN_INTENTS[3].answer,
      href: ADMIN_INTENTS[3].href,
    },
  ],
}

function intentsForRole(role: HelpRole) {
  if (role === "talent") return TALENT_INTENTS
  if (role === "client") return CLIENT_INTENTS
  return ADMIN_INTENTS
}

export function getSuggestedHelpQuestions(role: HelpRole) {
  return HELP_FAQS[role]
}

export function answerHelpQuestion(role: HelpRole, rawQuestion: string) {
  const question = rawQuestion.toLowerCase().trim()
  if (!question) {
    return {
      answer: sharedFallbacks[0],
      suggestions: HELP_FAQS[role].slice(0, 3),
    }
  }

  const scored = intentsForRole(role)
    .map((intent) => ({
      intent,
      score: intent.keywords.reduce((total, keyword) => total + (question.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (best && best.score > 0) {
    return {
      answer: best.intent.answer,
      href: best.intent.href,
      suggestions: HELP_FAQS[role].filter((faq) => faq.href !== best.intent.href).slice(0, 3),
    }
  }

  return {
    answer: sharedFallbacks[1],
    suggestions: HELP_FAQS[role].slice(0, 3),
  }
}

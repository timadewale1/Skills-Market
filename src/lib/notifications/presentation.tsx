import {
  Bell,
  Briefcase,
  FileText,
  Gavel,
  MessageSquare,
  ShieldCheck,
  Star,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type NotificationMeta = {
  key: string
  label: string
  borderClass: string
  accentClass: string
  chipClass: string
  Icon: LucideIcon
}

export function getNotificationMeta(type?: string): NotificationMeta {
  const value = String(type || "").toLowerCase()

  if (value.includes("message")) {
    return {
      key: "message",
      label: "Message",
      borderClass: "border-l-sky-500",
      accentClass: "text-sky-700",
      chipClass: "bg-sky-50 text-sky-700",
      Icon: MessageSquare,
    }
  }

  if (value.includes("proposal")) {
    return {
      key: "proposal",
      label: "Proposal",
      borderClass: "border-l-blue-500",
      accentClass: "text-blue-700",
      chipClass: "bg-blue-50 text-blue-700",
      Icon: FileText,
    }
  }

  if (value.includes("workspace") || value.includes("milestone") || value.includes("final")) {
    return {
      key: "workspace",
      label: "Workspace",
      borderClass: "border-l-emerald-500",
      accentClass: "text-emerald-700",
      chipClass: "bg-emerald-50 text-emerald-700",
      Icon: Briefcase,
    }
  }

  if (value.includes("agreement")) {
    return {
      key: "agreement",
      label: "Agreement",
      borderClass: "border-l-violet-500",
      accentClass: "text-violet-700",
      chipClass: "bg-violet-50 text-violet-700",
      Icon: FileText,
    }
  }

  if (value.includes("kyc") || value.includes("verification")) {
    return {
      key: "verification",
      label: "Verification",
      borderClass: "border-l-amber-500",
      accentClass: "text-amber-700",
      chipClass: "bg-amber-50 text-amber-700",
      Icon: ShieldCheck,
    }
  }

  if (value.includes("review")) {
    return {
      key: "review",
      label: "Review",
      borderClass: "border-l-fuchsia-500",
      accentClass: "text-fuchsia-700",
      chipClass: "bg-fuchsia-50 text-fuchsia-700",
      Icon: Star,
    }
  }

  if (value.includes("payout") || value.includes("withdraw") || value.includes("wallet") || value.includes("payment")) {
    return {
      key: "payment",
      label: "Payments",
      borderClass: "border-l-orange-500",
      accentClass: "text-orange-700",
      chipClass: "bg-orange-50 text-orange-700",
      Icon: Wallet,
    }
  }

  if (value.includes("dispute")) {
    return {
      key: "dispute",
      label: "Dispute",
      borderClass: "border-l-rose-500",
      accentClass: "text-rose-700",
      chipClass: "bg-rose-50 text-rose-700",
      Icon: Gavel,
    }
  }

  return {
    key: "alert",
    label: "Alert",
    borderClass: "border-l-slate-400",
    accentClass: "text-slate-700",
    chipClass: "bg-slate-100 text-slate-700",
    Icon: Bell,
  }
}

export function formatNotificationType(type?: string) {
  const value = String(type || "").replace(/^admin:/, "").replace(/_/g, " ").trim()
  if (!value) return "alert"
  return value
}

export function isAdminNotification(type?: string) {
  return String(type || "").startsWith("admin:")
}

export function getNotificationCategory(type?: string) {
  return getNotificationMeta(type).key
}

export const notificationCategoryTabs = [
  { key: "all", label: "All" },
  { key: "message", label: "Messages" },
  { key: "proposal", label: "Proposals" },
  { key: "workspace", label: "Workspaces" },
  { key: "agreement", label: "Agreements" },
  { key: "payment", label: "Payments" },
  { key: "review", label: "Reviews" },
  { key: "verification", label: "Verification" },
  { key: "dispute", label: "Disputes" },
  { key: "alert", label: "Alerts" },
]

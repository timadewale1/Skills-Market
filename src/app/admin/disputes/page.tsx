"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import Link from "next/link"
import toast from "react-hot-toast"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Button from "@/components/ui/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AdminPageHeader from "@/components/admin/AdminPageHeader"

import { MessageSquare, FileText, DollarSign } from "lucide-react"

type Dispute = {
  id: string
  workspaceId: string
  clientId: string
  talentId: string
  raisedBy: string
  reason: string
  description: string
  status: string
  stage: string
  evidenceCount: number
  createdAt: Timestamp
  resolvedAt?: Timestamp
  resolution?: string
  adminNotes?: string
}

type UserProfile = {
  id: string
  displayName?: string
  fullName?: string
  email?: string
}

type Workspace = {
  id: string
  title?: string
  escrowAmount?: number
}

type DisputeWithDetails = Dispute & {
  client?: UserProfile
  talent?: UserProfile
  workspace?: Workspace
  messagesCount?: number
}

const badgeByStatus = (status: string) => {
  const statusConfig = {
    open: { color: "bg-blue-100 text-blue-800", label: "Open" },
    under_discussion: { color: "bg-yellow-100 text-yellow-800", label: "Under Discussion" },
    under_review: { color: "bg-orange-100 text-orange-800", label: "Under Review" },
    resolved_release_talent: { color: "bg-green-100 text-green-800", label: "Released to Talent" },
    resolved_refund_client: { color: "bg-red-100 text-red-800", label: "Refunded to Client" },
    resolved_partial: { color: "bg-purple-100 text-purple-800", label: "Partial Settlement" },
    closed: { color: "bg-gray-100 text-gray-800", label: "Closed" },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
  return <Badge className={config.color}>{config.label}</Badge>
}

export default function AdminDisputesPage() {
  const { user } = useAuth()
  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (!user) return
    void fetchDisputes()
  }, [user])

  const fetchDisputes = async () => {
    try {
      const disputesQuery = query(collection(db, "disputes"), orderBy("createdAt", "desc"))
      const disputesSnapshot = await getDocs(disputesQuery)
      const disputesData = disputesSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Dispute[]

      const disputesWithDetails = await Promise.all(
        disputesData.map(async (dispute) => {
          const [clientDoc, talentDoc, workspaceDoc, messagesQuery] = await Promise.all([
            getDoc(doc(db, "users", dispute.clientId)),
            getDoc(doc(db, "users", dispute.talentId)),
            getDoc(doc(db, "workspaces", dispute.workspaceId)),
            getDocs(query(collection(db, "disputeMessages"), where("disputeId", "==", dispute.id))),
          ])

          return {
            ...dispute,
            client: clientDoc.exists() ? ({ id: clientDoc.id, ...clientDoc.data() } as UserProfile) : undefined,
            talent: talentDoc.exists() ? ({ id: talentDoc.id, ...talentDoc.data() } as UserProfile) : undefined,
            workspace: workspaceDoc.exists() ? ({ id: workspaceDoc.id, ...workspaceDoc.data() } as Workspace) : undefined,
            messagesCount: messagesQuery.size,
          }
        })
      )

      setDisputes(disputesWithDetails)
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast.error("Failed to load disputes")
    } finally {
      setLoading(false)
    }
  }

  const resolveDispute = async (disputeId: string, action: string, amount?: number, adminNotes?: string) => {
    setResolving(true)
    try {
      const response = await fetch("/api/admin/disputes/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          disputeId,
          action,
          amount,
          adminNotes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to resolve dispute")
        return
      }

      toast.success("Dispute resolved successfully")
      await fetchDisputes()
      setSelectedDispute(null)
    } catch (error) {
      console.error("Error resolving dispute:", error)
      toast.error("Failed to resolve dispute")
    } finally {
      setResolving(false)
    }
  }

  const filterDisputes = (statusFilter: string) => {
    switch (statusFilter) {
      case "open":
        return disputes.filter((item) => !item.status.includes("resolved") && item.status !== "closed")
      case "under_review":
        return disputes.filter((item) => item.stage === "admin_review")
      case "resolved":
        return disputes.filter((item) => item.status.includes("resolved") || item.status === "closed")
      default:
        return disputes
    }
  }

  if (loading) {
    return (
      <div className="rounded-[1.75rem] border bg-white p-10 text-center text-sm font-semibold text-gray-600 shadow-sm">
        Loading disputes...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Trust and safety"
        title="Dispute management"
        description="Review escalations raised from workspaces, compare evidence, and resolve payment or delivery conflicts using the recorded platform history."
        stats={[
          { label: "All disputes", value: disputes.length },
          { label: "Open", value: filterDisputes("open").length },
          { label: "Under review", value: filterDisputes("under_review").length },
          { label: "Resolved", value: filterDisputes("resolved").length },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-gray-900">Active dispute queues</h1>
          </div>

          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open">Open ({filterDisputes("open").length})</TabsTrigger>
              <TabsTrigger value="under_review">Under review ({filterDisputes("under_review").length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({filterDisputes("resolved").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-4">
              {filterDisputes("open").map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} onResolve={setSelectedDispute} />
              ))}
              {filterDisputes("open").length === 0 ? (
                <p className="py-8 text-center text-gray-500">No open disputes</p>
              ) : null}
            </TabsContent>

            <TabsContent value="under_review" className="space-y-4">
              {filterDisputes("under_review").map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} onResolve={setSelectedDispute} />
              ))}
              {filterDisputes("under_review").length === 0 ? (
                <p className="py-8 text-center text-gray-500">No disputes under review</p>
              ) : null}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {filterDisputes("resolved").map((dispute) => (
                <DisputeCard key={dispute.id} dispute={dispute} onResolve={setSelectedDispute} />
              ))}
              {filterDisputes("resolved").length === 0 ? (
                <p className="py-8 text-center text-gray-500">No resolved disputes</p>
              ) : null}
            </TabsContent>
          </Tabs>

          {selectedDispute ? (
            <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
              <DialogContent className="max-w-2xl">
                <DialogTitle>Resolve dispute</DialogTitle>
                <ResolveDisputeForm
                  dispute={selectedDispute}
                  onResolve={resolveDispute}
                  resolving={resolving}
                />
              </DialogContent>
            </Dialog>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function DisputeCard({
  dispute,
  onResolve,
}: {
  dispute: DisputeWithDetails
  onResolve: (dispute: DisputeWithDetails) => void
}) {
  return (
    <Card className="rounded-[1.5rem] border bg-[var(--secondary)] shadow-none">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Dispute #{dispute.id.slice(-8)}</h3>
            <p className="text-sm text-gray-600">{dispute.workspace?.title || "Unknown workspace"}</p>
          </div>
          {badgeByStatus(dispute.status)}
        </div>

        <div className="mb-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-gray-500">Client</p>
            <p className="font-medium text-gray-900">{dispute.client?.displayName || dispute.client?.fullName || "Unknown"}</p>
          </div>
          <div>
            <p className="text-gray-500">Talent</p>
            <p className="font-medium text-gray-900">{dispute.talent?.displayName || dispute.talent?.fullName || "Unknown"}</p>
          </div>
          <div>
            <p className="text-gray-500">Reason</p>
            <p className="font-medium text-gray-900">{dispute.reason || "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium text-gray-900">{dispute.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {dispute.evidenceCount || 0} evidence files
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {dispute.messagesCount || 0} messages
          </div>
          {dispute.workspace?.escrowAmount ? (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              ${dispute.workspace.escrowAmount} escrow
            </div>
          ) : null}
        </div>

        <p className="mb-4 text-sm leading-7 text-gray-700">{dispute.description}</p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Link href={`/admin/disputes/${dispute.id}`}>View details</Link>
          </Button>
          {!dispute.status.includes("resolved") && dispute.status !== "closed" ? (
            <Button onClick={() => onResolve(dispute)}>Resolve dispute</Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function ResolveDisputeForm({
  dispute,
  onResolve,
  resolving,
}: {
  dispute: DisputeWithDetails
  onResolve: (disputeId: string, action: string, amount?: number, adminNotes?: string) => void
  resolving: boolean
}) {
  const [action, setAction] = useState("")
  const [amount, setAmount] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

  const escrowAmount = dispute.workspace?.escrowAmount || 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = amount ? parseFloat(amount) : undefined
    onResolve(dispute.id, action, amountNum, adminNotes)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Resolution action</label>
        <Select value={action} onValueChange={setAction} required>
          <SelectTrigger>
            <SelectValue placeholder="Select resolution action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="release_talent">Release funds to talent</SelectItem>
            <SelectItem value="refund_client">Refund funds to client</SelectItem>
            <SelectItem value="partial_refund">Partial refund</SelectItem>
            <SelectItem value="close_case">Close case (no payment change)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(action === "release_talent" || action === "refund_client") ? (
        <div>
          <label className="mb-2 block text-sm font-medium">Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max: $${escrowAmount}`}
            max={escrowAmount}
            min={0}
            step={0.01}
            required
          />
          <p className="mt-1 text-xs text-gray-500">Escrow amount: ${escrowAmount}</p>
        </div>
      ) : null}

      {action === "partial_refund" ? (
        <div>
          <label className="mb-2 block text-sm font-medium">Client refund amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max: $${escrowAmount}`}
            max={escrowAmount}
            min={0}
            step={0.01}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Escrow: ${escrowAmount} | Talent gets: ${escrowAmount - parseFloat(amount || "0")}
          </p>
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium">Admin notes</label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes about the resolution..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={resolving || !action}>
        {resolving ? "Resolving..." : "Resolve dispute"}
      </Button>
    </form>
  )
}

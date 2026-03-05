"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { motion } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Button from "@/components/ui/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  AlertTriangle,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  User,
  Calendar,
  DollarSign,
} from "lucide-react"

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
  displayName: string
  email: string
}

type Workspace = {
  id: string
  title: string
  escrowAmount?: number
}

type DisputeWithDetails = Dispute & {
  client?: UserProfile
  talent?: UserProfile
  workspace?: Workspace
  messagesCount?: number
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    open: { color: "bg-blue-100 text-blue-800", label: "Open" },
    under_discussion: { color: "bg-yellow-100 text-yellow-800", label: "Under Discussion" },
    under_review: { color: "bg-orange-100 text-orange-800", label: "Under Review" },
    resolved_release_talent: { color: "bg-green-100 text-green-800", label: "Resolved - Released to Talent" },
    resolved_refund_client: { color: "bg-red-100 text-red-800", label: "Resolved - Refunded to Client" },
    resolved_partial: { color: "bg-purple-100 text-purple-800", label: "Resolved - Partial" },
    closed: { color: "bg-gray-100 text-gray-800", label: "Closed" }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
  return <Badge className={config.color}>{config.label}</Badge>
}

export default function AdminDisputesPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    if (!user) return

    // TODO: Add admin role check here
    // For now, assume user is admin

    fetchDisputes()
  }, [user])

  const fetchDisputes = async () => {
    try {
      const disputesQuery = query(
        collection(db, "disputes"),
        orderBy("createdAt", "desc")
      )

      const disputesSnapshot = await getDocs(disputesQuery)
      const disputesData: Dispute[] = disputesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Dispute[]

      // Fetch additional details for each dispute
      const disputesWithDetails = await Promise.all(
        disputesData.map(async (dispute) => {
          const [clientDoc, talentDoc, workspaceDoc, messagesQuery] = await Promise.all([
            getDoc(doc(db, "users", dispute.clientId)),
            getDoc(doc(db, "users", dispute.talentId)),
            getDoc(doc(db, "workspaces", dispute.workspaceId)),
            getDocs(query(collection(db, "disputeMessages"), where("disputeId", "==", dispute.id)))
          ])

          const client = clientDoc.exists() ? { id: clientDoc.id, ...clientDoc.data() } as UserProfile : undefined
          const talent = talentDoc.exists() ? { id: talentDoc.id, ...talentDoc.data() } as UserProfile : undefined
          const workspace = workspaceDoc.exists() ? { id: workspaceDoc.id, ...workspaceDoc.data() } as Workspace : undefined
          const messagesCount = messagesQuery.size

          return {
            ...dispute,
            client,
            talent,
            workspace,
            messagesCount
          }
        })
      )

      setDisputes(disputesWithDetails)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast.error("Failed to load disputes")
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
          "Authorization": `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          disputeId,
          action,
          amount,
          adminNotes
        })
      })

      if (response.ok) {
        toast.success("Dispute resolved successfully")
        fetchDisputes() // Refresh the list
        setSelectedDispute(null)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to resolve dispute")
      }
    } catch (error) {
      console.error("Error resolving dispute:", error)
      toast.error("Failed to resolve dispute")
    } finally {
      setResolving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: "bg-blue-100 text-blue-800", label: "Open" },
      under_discussion: { color: "bg-yellow-100 text-yellow-800", label: "Under Discussion" },
      under_review: { color: "bg-orange-100 text-orange-800", label: "Under Review" },
      resolved_release_talent: { color: "bg-green-100 text-green-800", label: "Resolved - Released to Talent" },
      resolved_refund_client: { color: "bg-red-100 text-red-800", label: "Resolved - Refunded to Client" },
      resolved_partial: { color: "bg-purple-100 text-purple-800", label: "Resolved - Partial" },
      closed: { color: "bg-gray-100 text-gray-800", label: "Closed" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const filterDisputes = (statusFilter: string) => {
    switch (statusFilter) {
      case "open":
        return disputes.filter(d => !d.status.includes("resolved") && d.status !== "closed")
      case "under_review":
        return disputes.filter(d => d.stage === "admin_review")
      case "resolved":
        return disputes.filter(d => d.status.includes("resolved") || d.status === "closed")
      default:
        return disputes
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-gray-50">
          <AuthNavbar />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="animate-pulse">Loading disputes...</div>
          </div>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <AuthNavbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Admin - Dispute Management</h1>
          </div>

          <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="open">Open Disputes ({filterDisputes("open").length})</TabsTrigger>
              <TabsTrigger value="under_review">Under Review ({filterDisputes("under_review").length})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({filterDisputes("resolved").length})</TabsTrigger>
            </TabsList>

            <TabsContent value="open" className="space-y-4">
              {filterDisputes("open").map((dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onResolve={setSelectedDispute}
                />
              ))}
              {filterDisputes("open").length === 0 && (
                <p className="text-center text-gray-500 py-8">No open disputes</p>
              )}
            </TabsContent>

            <TabsContent value="under_review" className="space-y-4">
              {filterDisputes("under_review").map((dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onResolve={setSelectedDispute}
                />
              ))}
              {filterDisputes("under_review").length === 0 && (
                <p className="text-center text-gray-500 py-8">No disputes under review</p>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {filterDisputes("resolved").map((dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onResolve={setSelectedDispute}
                />
              ))}
              {filterDisputes("resolved").length === 0 && (
                <p className="text-center text-gray-500 py-8">No resolved disputes</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Resolution Dialog */}
          {selectedDispute && (
            <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
              <DialogContent className="max-w-2xl">
                <DialogTitle>Resolve Dispute</DialogTitle>
                <ResolveDisputeForm
                  dispute={selectedDispute}
                  onResolve={resolveDispute}
                  resolving={resolving}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </RequireAuth>
  )
}

function DisputeCard({ dispute, onResolve }: { dispute: DisputeWithDetails, onResolve: (dispute: DisputeWithDetails) => void }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Dispute #{dispute.id.slice(-8)}</h3>
            <p className="text-gray-600">{dispute.workspace?.title || "Unknown Workspace"}</p>
          </div>
          {getStatusBadge(dispute.status)}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Client</p>
            <p className="font-medium">{dispute.client?.displayName || "Unknown"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Talent</p>
            <p className="font-medium">{dispute.talent?.displayName || "Unknown"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Reason</p>
            <p className="font-medium">{dispute.reason}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-medium">{dispute.createdAt?.toDate().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {dispute.evidenceCount} evidence files
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {dispute.messagesCount || 0} messages
          </div>
          {dispute.workspace?.escrowAmount && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              ${dispute.workspace.escrowAmount} escrow
            </div>
          )}
        </div>

        <p className="text-gray-700 mb-4">{dispute.description}</p>

        <div className="flex gap-2">
          <Button variant="outline">
            <Link href={`/dashboard/disputes/${dispute.id}`}>
              View Details
            </Link>
          </Button>
          {!dispute.status.includes("resolved") && dispute.status !== "closed" && (
            <Button onClick={() => onResolve(dispute)}>
              Resolve Dispute
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ResolveDisputeForm({
  dispute,
  onResolve,
  resolving
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
        <label className="block text-sm font-medium mb-2">Resolution Action</label>
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

      {(action === "release_talent" || action === "refund_client") && (
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
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
          <p className="text-xs text-gray-500 mt-1">Escrow amount: ${escrowAmount}</p>
        </div>
      )}

      {action === "partial_refund" && (
        <div>
          <label className="block text-sm font-medium mb-2">Client Refund Amount</label>
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
          <p className="text-xs text-gray-500 mt-1">
            Escrow: ${escrowAmount} | Talent gets: ${escrowAmount - parseFloat(amount || "0")}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Admin Notes</label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes about the resolution..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={resolving || !action}>
        {resolving ? "Resolving..." : "Resolve Dispute"}
      </Button>
    </form>
  )
}
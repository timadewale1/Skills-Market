"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { motion } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Button from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import {
  ArrowLeft,
  MessageSquare,
  Upload,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Send,
  Download,
  User,
  Calendar,
} from "lucide-react"

type DisputeMessage = {
  id: string
  disputeId: string
  senderId: string
  message: string
  attachments: string[]
  createdAt: Timestamp
}

type DisputeEvidence = {
  id: string
  disputeId: string
  uploadedBy: string
  fileUrl: string
  fileType: string
  description: string
  createdAt: Timestamp
}

type Dispute = {
  id: string
  workspaceId: string
  clientUid?: string
  talentUid?: string
  clientId?: string
  talentId?: string
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

export default function DisputeDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [messages, setMessages] = useState<DisputeMessage[]>([])
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [talent, setTalent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const unauthorizedHandledRef = useRef(false)

  const resolveClientUid = (record: Dispute | null) => record?.clientUid || record?.clientId || ""
  const resolveTalentUid = (record: Dispute | null) => record?.talentUid || record?.talentId || ""

  useEffect(() => {
    if (!id || !user) return

    const fetchData = async () => {
      try {
        // Fetch dispute
        const disputeDoc = await getDoc(doc(db, "disputes", id as string))
        if (!disputeDoc.exists()) {
          toast.error("Dispute not found")
          router.push("/dashboard")
          return
        }

        const disputeData = { id: disputeDoc.id, ...disputeDoc.data() } as Dispute
        setDispute(disputeData)

        const clientUid = disputeData.clientUid || disputeData.clientId || ""
        const talentUid = disputeData.talentUid || disputeData.talentId || ""

        // Check if user is authorized
        if (clientUid !== user.uid && talentUid !== user.uid) {
          if (!unauthorizedHandledRef.current) {
            unauthorizedHandledRef.current = true
            toast.error("Unauthorized")
          }
          router.push("/dashboard")
          return
        }

        // Fetch workspace
        const workspaceDoc = await getDoc(doc(db, "workspaces", disputeData.workspaceId))
        if (workspaceDoc.exists()) {
          setWorkspace({ id: workspaceDoc.id, ...workspaceDoc.data() })
        }

        // Fetch client and talent profiles
        const [clientDoc, talentDoc] = await Promise.all([
          getDoc(doc(db, "publicProfiles", clientUid)),
          getDoc(doc(db, "publicProfiles", talentUid))
        ])

        if (clientDoc.exists()) setClient({ id: clientDoc.id, ...clientDoc.data() })
        if (talentDoc.exists()) setTalent({ id: talentDoc.id, ...talentDoc.data() })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching dispute:", error)
        toast.error("Failed to load dispute")
      }
    }

    fetchData()

    // Listen for messages
    const messagesQuery = query(
      collection(db, "disputeMessages"),
      where("disputeId", "==", id),
      orderBy("createdAt", "asc")
    )

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DisputeMessage[]
        setMessages(messagesData)
      },
      (error) => {
        console.error("Error listening to dispute messages:", error)
        toast.error("You do not have access to dispute messages.")
      }
    )

    // Listen for evidence
    const evidenceQuery = query(
      collection(db, "disputeEvidence"),
      where("disputeId", "==", id),
      orderBy("createdAt", "asc")
    )

    const unsubscribeEvidence = onSnapshot(
      evidenceQuery,
      (snapshot) => {
        const evidenceData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DisputeEvidence[]
        setEvidence(evidenceData)
      },
      (error) => {
        console.error("Error listening to dispute evidence:", error)
        toast.error("You do not have access to dispute evidence.")
      }
    )

    return () => {
      unsubscribeMessages()
      unsubscribeEvidence()
    }
  }, [id, user, router])

  const sendMessage = async () => {
    if (!newMessage.trim() || !dispute) return

    setSendingMessage(true)
    try {
      const response = await fetch("/api/disputes/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          disputeId: dispute.id,
          senderId: user?.uid,
          message: newMessage.trim()
        })
      })

      if (response.ok) {
        setNewMessage("")
        toast.success("Message sent")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  const uploadEvidence = async (file: File, description: string) => {
    if (!dispute) return

    setUploadingEvidence(true)
    try {
      const formData = new FormData()
      formData.append("disputeId", dispute.id)
      formData.append("file", file)
      formData.append("uploadedBy", user?.uid || "")
      formData.append("description", description)

      const response = await fetch("/api/disputes/upload-evidence", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${await user?.getIdToken()}`
        },
        body: formData
      })

      if (response.ok) {
        toast.success("Evidence uploaded successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to upload evidence")
      }
    } catch (error) {
      console.error("Error uploading evidence:", error)
      toast.error("Failed to upload evidence")
    } finally {
      setUploadingEvidence(false)
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

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "discussion": return <MessageSquare className="w-4 h-4" />
      case "admin_review": return <AlertTriangle className="w-4 h-4" />
      case "resolved": return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-gray-50">
          <AuthNavbar />
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="animate-pulse">Loading dispute...</div>
          </div>
        </div>
      </RequireAuth>
    )
  }

  if (!dispute) return null

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <AuthNavbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Dispute #{dispute.id.slice(-8)}</h1>
              <p className="text-gray-600">Workspace: {workspace?.title || "Unknown"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dispute Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Dispute Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(dispute.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Stage:</span>
                    <div className="flex items-center gap-2">
                      {getStageIcon(dispute.stage)}
                      <span className="capitalize">{dispute.stage.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Reason:</span>
                    <p className="mt-1 text-gray-700">{dispute.reason}</p>
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-gray-700">{dispute.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Created: {dispute.createdAt?.toDate().toLocaleDateString()}
                    </div>
                    {dispute.resolvedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Resolved: {dispute.resolvedAt.toDate().toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Evidence Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Evidence ({evidence.length})
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="px-2 py-1 text-sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Evidence
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Upload Evidence</DialogTitle>
                        <EvidenceUploadForm onUpload={uploadEvidence} uploading={uploadingEvidence} />
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {evidence.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No evidence uploaded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {evidence.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{item.description || "Evidence file"}</p>
                              <p className="text-sm text-gray-600">
                      {item.createdAt?.toDate().toLocaleDateString()} •
                      Uploaded by {item.uploadedBy === user?.uid ? "You" : "Other party"}
                              </p>
                            </div>
                          </div>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-sm rounded-md border hover:bg-gray-50"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation Thread */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Conversation ({messages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No messages yet</p>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {message.senderId === user?.uid ? "You" : "Other party"}
                              </span>
                              <span className="text-sm text-gray-500">
                                {message.createdAt?.toDate().toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{message.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {dispute.stage !== "resolved" && (
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Parties Involved */}
              <Card>
                <CardHeader>
                  <CardTitle>Parties Involved</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-sm text-gray-600">Client</p>
                    <p className="font-medium">{client?.displayName || client?.fullName || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-600">Talent</p>
                    <p className="font-medium">{talent?.displayName || talent?.fullName || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-600">Raised By</p>
                    <p className="font-medium">
                      {dispute.raisedBy === resolveClientUid(dispute) ? "Client" : "Talent"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Resolution Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Dispute Created</p>
                        <p className="text-sm text-gray-600">
                          {dispute.createdAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {evidence.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Evidence Submitted</p>
                          <p className="text-sm text-gray-600">
                            {evidence.length} file{evidence.length !== 1 ? 's' : ''} uploaded
                          </p>
                        </div>
                      </div>
                    )}

                    {dispute.stage === "admin_review" && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Under Admin Review</p>
                          <p className="text-sm text-gray-600">Waiting for admin decision</p>
                        </div>
                      </div>
                    )}

                    {dispute.resolvedAt && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">Resolution Issued</p>
                          <p className="text-sm text-gray-600">
                            {dispute.resolvedAt.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {dispute.adminNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{dispute.adminNotes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}

function EvidenceUploadForm({ onUpload, uploading }: { onUpload: (file: File, description: string) => void, uploading: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onUpload(file, description)
      setFile(null)
      setDescription("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">File</label>
        <Input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.zip,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported: PDF, Images, ZIP, Documents (max 10MB)
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          placeholder="Describe this evidence..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={uploading || !file}>
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </form>
  )
}

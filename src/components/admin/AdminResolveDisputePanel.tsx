"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import toast from "react-hot-toast"
import Button from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  disputeId: string
  escrowAmount: number
  defaultNotes?: string
  onResolved?: () => void | Promise<void>
}

export default function AdminResolveDisputePanel({
  disputeId,
  escrowAmount,
  defaultNotes = "",
  onResolved,
}: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [action, setAction] = useState("")
  const [amount, setAmount] = useState("")
  const [adminNotes, setAdminNotes] = useState(defaultNotes)
  const [resolving, setResolving] = useState(false)

  const parsedAmount = amount ? Number(amount) : 0
  const talentPortion = Math.max(0, escrowAmount - parsedAmount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("Admin session not found")
      return
    }
    if (!action) {
      toast.error("Select a resolution action")
      return
    }

    const needsAmount = ["release_talent", "refund_client", "partial_refund"].includes(action)
    const amountValue = needsAmount ? Number(amount || 0) : undefined

    if (needsAmount && (!amountValue || amountValue <= 0 || amountValue > escrowAmount)) {
      toast.error("Enter a valid amount within the escrow amount")
      return
    }

    setResolving(true)
    try {
      const response = await fetch("/api/admin/disputes/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          disputeId,
          action,
          amount: amountValue,
          adminNotes,
        }),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || "Failed to resolve dispute")

      toast.success("Dispute resolved")
      await onResolved?.()
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Failed to resolve dispute")
    } finally {
      setResolving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Resolution action</label>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger>
            <SelectValue placeholder="Select resolution action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="release_talent">Release funds to talent</SelectItem>
            <SelectItem value="refund_client">Refund funds to client</SelectItem>
            <SelectItem value="partial_refund">Split between client and talent</SelectItem>
            <SelectItem value="close_case">Close case only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(action === "release_talent" || action === "refund_client" || action === "partial_refund") ? (
        <div>
          <label className="mb-2 block text-sm font-medium">
            {action === "partial_refund" ? "Client refund amount" : "Amount"}
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max: ₦${escrowAmount.toLocaleString()}`}
            max={escrowAmount}
            min={0}
            step={1}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Escrow amount: ₦{escrowAmount.toLocaleString()}
            {action === "partial_refund" ? ` | Talent gross: ₦${talentPortion.toLocaleString()}` : ""}
          </p>
        </div>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-medium">Admin notes</label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes about the resolution and why it was chosen..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={resolving || !action}>
        {resolving ? "Resolving..." : "Resolve dispute"}
      </Button>
    </form>
  )
}

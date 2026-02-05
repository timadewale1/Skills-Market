"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button from "@/components/ui/Button"
import { Input } from "@/components/ui/input"

export default function RateModal({
  open,
  initialRate,
  onClose,
  onSave,
}: {
  open: boolean
  initialRate: number | null
  onClose: () => void
  onSave: (rate: number) => Promise<void> | void
}) {
  const [rate, setRate] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setRate(initialRate === null ? "" : String(initialRate))
  }, [initialRate, open])

  const numeric = useMemo(() => {
    const n = Number(rate)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [rate])

  const fee = useMemo(() => Math.round(numeric * 0.1), [numeric])
  const receive = useMemo(() => Math.max(0, numeric - fee), [numeric, fee])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold">Set hourly rate</DialogTitle>
          <DialogDescription>
            This helps hirers understand your pricing. Platform service fee is 10%.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-700">Hourly rate (₦)</div>
            <Input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g. 5000"
              type="number"
              min={0}
              className="mt-2"
            />
          </div>

          <div className="rounded-2xl border bg-orange-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">Platform service fee (10%)</span>
              <span className="font-extrabold text-gray-900">₦{fee.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">You will receive</span>
              <span className="font-extrabold text-[var(--primary)]">₦{receive.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            disabled={saving || numeric <= 0}
            onClick={async () => {
              setSaving(true)
              try {
                await onSave(numeric)
                onClose()
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? "Saving..." : "Save rate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

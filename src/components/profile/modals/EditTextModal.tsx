"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button from "@/components/ui/Button"
import { Input } from "@/components/ui/input"

export default function EditTextModal({
  open,
  title,
  description,
  initialValue,
  placeholder,
  multiline,
  onClose,
  onSave,
}: {
  open: boolean
  title: string
  description?: string
  initialValue: string
  placeholder?: string
  multiline?: boolean
  onClose: () => void
  onSave: (val: string) => Promise<void> | void
}) {
  const [val, setVal] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setVal(initialValue)
  }, [initialValue, open])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="mt-2">
          {multiline ? (
            <textarea
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[140px] rounded-xl border px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-100"
            />
          ) : (
            <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} />
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setSaving(true)
              try {
                await onSave(val)
                onClose()
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

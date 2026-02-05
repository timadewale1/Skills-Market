"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button from "@/components/ui/Button"

export default function ListEditorModal<T>({
  open,
  title,
  description,
  initialItems,
  renderRow,
  onClose,
  onSave,
  onAdd,
  addLabel = "Add record",
}: {
  open: boolean
  title: string
  description?: string
  initialItems: T[]
  renderRow: (opts: {
    item: T
    idx: number
    update: (next: T) => void
    remove: () => void
  }) => React.ReactNode
  onClose: () => void
  onSave: (items: T[]) => Promise<void> | void
  onAdd?: () => T
  addLabel?: string
}) {
  const [items, setItems] = useState<T[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setItems(initialItems || [])
  }, [initialItems, open])

  const updateAt = (idx: number, next: T) => {
    setItems((prev) => prev.map((x, i) => (i === idx ? next : x)))
  }

  const removeAt = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const addOne = () => {
    if (!onAdd) return
    setItems((prev) => [...prev, onAdd()])
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-3">
          {onAdd && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={addOne}>
                {addLabel}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[55vh] overflow-auto pr-1">
          {items.length === 0 ? (
            <div className="text-sm text-gray-600">No entries yet.</div>
          ) : (
            items.map((item, idx) =>
              renderRow({
                item,
                idx,
                update: (n) => updateAt(idx, n),
                remove: () => removeAt(idx),
              })
            )
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              setSaving(true)
              try {
                await onSave(items)
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

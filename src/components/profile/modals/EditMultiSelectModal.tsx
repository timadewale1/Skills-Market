"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Button from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function EditMultiSelectModal({
  open,
  title,
  description,
  items,
  initialSelected,
  onClose,
  onSave,
}: {
  open: boolean
  title: string
  description?: string
  items: string[]
  initialSelected: string[]
  onClose: () => void
  onSave: (selected: string[]) => Promise<void> | void
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSelected(initialSelected)
  }, [initialSelected, open])

  const toggleItem = (item: string) => {
    setSelected((prev) =>
      prev.includes(item)
        ? prev.filter((x) => x !== item)
        : [...prev, item]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(selected)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-extrabold">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-2">Select items</div>
            <ScrollArea className="h-[300px] pr-3">
              <div className="space-y-2">
                {items.map((item) => {
                  const active = selected.includes(item)
                  return (
                    <label
                      key={item}
                      onClick={() => toggleItem(item)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-orange-50 transition cursor-pointer"
                    >
                      <Checkbox checked={active} />
                      <span className={`text-sm font-semibold ${active ? "text-[var(--primary)]" : "text-gray-800"}`}>
                        {item}
                      </span>
                    </label>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {selected.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">Selected ({selected.length})</div>
              <div className="flex flex-wrap gap-2">
                {selected.map((s) => (
                  <Badge key={s} className="rounded-full bg-orange-50 text-[var(--primary)] border border-orange-200">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="font-extrabold">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
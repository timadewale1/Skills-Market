"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Button from "@/components/ui/Button"
import { ExternalLink, Pencil, Trash2 } from "lucide-react"
import type { PortfolioItem } from "./PortfolioAddModal"

export default function PortfolioDetailsModal({
  open,
  onClose,
  item,
  onEdit,
  onRemove,
}: {
  open: boolean
  onClose: () => void
  item: PortfolioItem | null
  onEdit: (item: PortfolioItem) => void
  onRemove: (id: string) => void
}) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-extrabold">{item.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.coverUrl} alt="cover" className="w-full h-[220px] object-cover" />
          </div>

          <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.description}</div>

          <div className="flex flex-wrap gap-3">
            {item.linkUrl && (
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--primary)] hover:underline"
              >
                <ExternalLink size={16} />
                View link
              </a>
            )}

            {item.fileUrl && (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-extrabold text-[var(--primary)] hover:underline"
              >
                <ExternalLink size={16} />
                Download file
              </a>
            )}
          </div>

          <div className="flex justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit(item)}
                className="inline-flex items-center gap-2"
              >
                <Pencil size={16} />
                Edit
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("Remove this portfolio item?")) onRemove(item.id)
                }}
                className="inline-flex items-center gap-2"
              >
                <Trash2 size={16} />
                Remove
              </Button>
            </div>

            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

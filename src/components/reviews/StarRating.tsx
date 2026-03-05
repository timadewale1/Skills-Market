"use client"

import { useState } from "react"
import { Star } from "lucide-react"

export default function StarRating({
  value,
  onChange,
  editable = true,
  size = 24,
}: {
  value: number
  onChange: (rating: number) => void
  editable?: boolean
  size?: number
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!editable}
          onClick={() => editable && onChange(star)}
          onMouseEnter={() => editable && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`transition ${editable ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={size}
            className={`${
              (hover || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } transition`}
          />
        </button>
      ))}
    </div>
  )
}

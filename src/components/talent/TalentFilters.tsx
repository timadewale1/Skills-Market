"use client"

import { Input } from "@/components/ui/input"
import { SDGS } from "@/data/sdgs"
import { hireCategories } from "@/data/navCategories"

export type Availability = "Full-time" | "Part-time" | "Contract"
export type WorkMode = "Remote" | "Hybrid" | "On-site"

export const AVAILABILITY: Availability[] = ["Full-time", "Part-time", "Contract"]
export const WORK_MODE: WorkMode[] = ["Remote", "Hybrid", "On-site"]

export type TalentFilterState = {
  onlyVerified: boolean
  selectedSDGs: string[]
  selectedCategories: string[]
  availability: "all" | Availability
  workMode: "all" | WorkMode
  minExp: string
  maxExp: string
  minRate: string
  maxRate: string
}

const allCategoryItems = hireCategories.flatMap((g) => g.items)

export default function TalentFilters({
  value,
  onChange,
  onClear,
}: {
  value: TalentFilterState
  onChange: (next: TalentFilterState) => void
  onClear: () => void
}) {
  const set = (patch: Partial<TalentFilterState>) => onChange({ ...value, ...patch })

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-gray-900">Filters</div>
        <button
          onClick={onClear}
          className="text-xs font-bold text-[var(--primary)] hover:underline"
          type="button"
        >
          Clear all
        </button>
      </div>

      {/* Verified */}
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <input
          type="checkbox"
          checked={value.onlyVerified}
          onChange={(e) => set({ onlyVerified: e.target.checked })}
        />
        Verified only
      </label>

      {/* Availability */}
      <div>
        <div className="text-sm font-extrabold mb-2">Availability</div>
        <div className="flex flex-wrap gap-2">
          <Chip
            active={value.availability === "all"}
            onClick={() => set({ availability: "all" })}
            label="All"
          />
          {AVAILABILITY.map((v) => (
            <Chip
              key={v}
              active={value.availability === v}
              onClick={() => set({ availability: v })}
              label={v}
            />
          ))}
        </div>
      </div>

      {/* Work mode */}
      <div>
        <div className="text-sm font-extrabold mb-2">Work mode</div>
        <div className="flex flex-wrap gap-2">
          <Chip active={value.workMode === "all"} onClick={() => set({ workMode: "all" })} label="All" />
          {WORK_MODE.map((v) => (
            <Chip key={v} active={value.workMode === v} onClick={() => set({ workMode: v })} label={v} />
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <div className="text-sm font-extrabold mb-2">Years of experience</div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={value.minExp}
            onChange={(e) => set({ minExp: e.target.value })}
            placeholder="Min"
            className="rounded-2xl"
            inputMode="numeric"
          />
          <Input
            value={value.maxExp}
            onChange={(e) => set({ maxExp: e.target.value })}
            placeholder="Max"
            className="rounded-2xl"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Rate */}
      <div>
        <div className="text-sm font-extrabold mb-2">Hourly rate (₦)</div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={value.minRate}
            onChange={(e) => set({ minRate: e.target.value })}
            placeholder="Min"
            className="rounded-2xl"
            inputMode="numeric"
          />
          <Input
            value={value.maxRate}
            onChange={(e) => set({ maxRate: e.target.value })}
            placeholder="Max"
            className="rounded-2xl"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* SDGs */}
      <div>
        <div className="text-sm font-extrabold mb-2">SDG focus</div>
        <div className="flex flex-wrap gap-2">
          {SDGS.slice(0, 14).map((s) => (
            <Chip
              key={s}
              active={value.selectedSDGs.includes(s)}
              onClick={() => set({ selectedSDGs: toggleArray(value.selectedSDGs, s) })}
              label={s}
            />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="text-sm font-extrabold mb-2">Categories</div>
        <div className="flex flex-wrap gap-2 max-h-44 overflow-auto pr-1">
          {allCategoryItems.map((c) => (
            <Chip
              key={c}
              active={value.selectedCategories.includes(c)}
              onClick={() => set({ selectedCategories: toggleArray(value.selectedCategories, c) })}
              label={c}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-2 rounded-full border transition ${
        active
          ? "border-[var(--primary)] text-[var(--primary)] bg-orange-50"
          : "border-gray-200 text-gray-700 hover:border-[var(--primary)] hover:text-[var(--primary)]"
      }`}
    >
      {label}
    </button>
  )
}

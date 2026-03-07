"use client"

import { motion } from "framer-motion"

export default function FancyLoader({ label = "Loading your workspace..." }: { label?: string }) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--secondary)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border bg-white shadow-sm p-6 overflow-hidden relative">
          {/* Animated top glow */}
          <motion.div
            aria-hidden
            className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-orange-200/30 blur-3xl"
            animate={{ y: [0, 10, 0], x: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-orange-300/20 blur-3xl"
            animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Brand */}
          <div className="relative">
            <div className="text-xl font-extrabold text-[var(--primary)]">
              Changeworker
            </div>
            <div className="text-sm text-gray-600 mt-1">{label}</div>

            {/* Animated bar */}
            <div className="mt-5 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--primary)]"
                initial={{ x: "-60%" }}
                animate={{ x: "120%" }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "45%" }}
              />
            </div>

            {/* Fancy dots */}
            <div className="mt-6 flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]"
                  animate={{ opacity: [0.35, 1, 0.35], y: [0, -4, 0] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.12,
                  }}
                />
              ))}
              <span className="text-xs text-gray-500 ml-2">Almost there…</span>
            </div>
          </div>
        </div>

        {/* subtle hint */}
        <div className="text-center text-xs text-gray-500 mt-4">
          Impact-first marketplace • Nigeria
        </div>
      </div>
    </div>
  )
}

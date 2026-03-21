"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Smartphone, X } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { getAuthSessionDismissKey } from "@/lib/authSession"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  )
}

function isIosDevice() {
  if (typeof window === "undefined") return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

let publicDismissedThisPageLoad = false

export default function PWAInstallPrompt() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  const standalone = useMemo(() => isStandaloneMode(), [])
  const isIos = useMemo(() => isIosDevice(), [])
  const isDashboardScope = Boolean(user) && (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin"))
  const dashboardDismissKey = useMemo(
    () => (isDashboardScope ? getAuthSessionDismissKey("cw_pwa_prompt_dismissed") : null),
    [isDashboardScope]
  )

  const isDismissed = () => {
    if (typeof window === "undefined") return false
    if (isDashboardScope) {
      return Boolean(dashboardDismissKey && window.sessionStorage.getItem(dashboardDismissKey) === "1")
    }
    return publicDismissedThisPageLoad
  }

  const dismissPrompt = () => {
    if (typeof window !== "undefined" && isDashboardScope && dashboardDismissKey) {
      window.sessionStorage.setItem(dashboardDismissKey, "1")
    }
    if (!isDashboardScope) {
      publicDismissedThisPageLoad = true
    }
    setVisible(false)
  }

  useEffect(() => {
    if (standalone) return

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      window.setTimeout(() => {
        if (!isDismissed()) setVisible(true)
      }, 1200)
    }

    const onInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
      window.localStorage.setItem("cw-installed", "true")
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)

    if (isIos) {
      const timer = window.setTimeout(() => {
        if (!isDismissed()) setVisible(true)
      }, 1200)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
        window.removeEventListener("appinstalled", onInstalled)
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [dashboardDismissKey, isDashboardScope, isIos, pathname, standalone, user])

  useEffect(() => {
    if (standalone) {
      setVisible(false)
      return
    }

    if (isDismissed()) {
      setVisible(false)
      return
    }

    if ((deferredPrompt || isIos) && !visible) {
      const timer = window.setTimeout(() => {
        if (!isDismissed()) setVisible(true)
      }, 1200)
      return () => window.clearTimeout(timer)
    }
  }, [dashboardDismissKey, deferredPrompt, isDashboardScope, isIos, pathname, standalone, user, visible])

  if (standalone || !visible) return null

  const onInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === "accepted") {
      setVisible(false)
    } else {
      dismissPrompt()
    }
    setInstalling(false)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-orange-200 bg-white shadow-[0_24px_60px_rgba(249,115,22,0.18)]">
        <div className="bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_55%,#ffedd5_100%)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-200">
                <img src="/logo.png" alt="changeworker" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                  Install App
                </div>
                <h2 className="mt-1 text-xl font-extrabold text-gray-900">Keep changeworker on your home screen</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Open faster, feel more native, and get back to gigs, messages, workspaces, and admin tasks in one tap.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissPrompt}
              className="rounded-full p-2 text-gray-400 transition hover:bg-orange-50 hover:text-gray-700"
              aria-label="Dismiss install prompt"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-orange-50/70 p-4 text-sm text-gray-700">
            {deferredPrompt ? (
              <div className="flex items-start gap-3">
                <Download size={18} className="mt-0.5 text-[var(--primary)]" />
                <div>Install the app for a smoother launch experience and quicker access every time you return.</div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Smartphone size={18} className="mt-0.5 text-[var(--primary)]" />
                <div>
                  On iPhone or iPad, tap the browser share button and choose <span className="font-semibold">Add to Home Screen</span>.
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={() => void onInstall()}
                disabled={installing}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                {installing ? "Installing..." : "Install app"}
              </button>
            ) : (
              <button
                type="button"
                onClick={dismissPrompt}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Smartphone size={16} />
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

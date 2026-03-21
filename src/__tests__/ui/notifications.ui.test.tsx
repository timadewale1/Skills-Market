import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import NotificationsFeed from "@/components/notifications/NotificationsFeed"
import NotificationBell from "@/components/NotificationBell"
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt"
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/client"
import { onSnapshot } from "firebase/firestore"

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1" },
  }),
}))

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}))

jest.mock("@/lib/notifications/client", () => ({
  markNotificationRead: jest.fn(() => Promise.resolve()),
  markAllNotificationsRead: jest.fn(() => Promise.resolve()),
}))

jest.mock("framer-motion", () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}))

const mockedOnSnapshot = onSnapshot as jest.Mock

function createDoc(id: string, data: Record<string, any>) {
  return {
    id,
    data: () => data,
  }
}

describe("Notification surfaces", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  it("filters notification feed by category and supports bulk mark-as-read", async () => {
    mockedOnSnapshot.mockImplementation((_query, onNext) => {
      onNext({
        docs: [
          createDoc("n1", {
            type: "message",
            title: "New message",
            message: "A client sent you a message",
            read: false,
            createdAt: { toDate: () => new Date("2026-03-21T10:00:00Z") },
          }),
          createDoc("n2", {
            type: "proposal",
            title: "Proposal update",
            message: "Your proposal was accepted",
            read: false,
            createdAt: { toDate: () => new Date("2026-03-21T11:00:00Z") },
          }),
        ],
      })
      return jest.fn()
    })

    render(<NotificationsFeed scope="user" itemsPerPage={8} />)

    expect(await screen.findByText("New message")).toBeInTheDocument()
    expect(screen.getByText("Proposal update")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Proposals" }))

    await waitFor(() => {
      expect(screen.queryByText("New message")).not.toBeInTheDocument()
    })
    expect(screen.getByText("Proposal update")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /mark all as read/i }))
    await waitFor(() => {
      expect(markAllNotificationsRead).toHaveBeenCalled()
    })
  })

  it("shows notification bell dropdown and bulk read action", async () => {
    mockedOnSnapshot.mockImplementation((_query, onNext) => {
      onNext({
        docs: [
          createDoc("n1", {
            type: "workspace",
            title: "Workspace funded",
            message: "A workspace has been funded",
            read: false,
            createdAt: { toDate: () => new Date("2026-03-21T10:00:00Z") },
          }),
          createDoc("n2", {
            type: "proposal",
            title: "Proposal accepted",
            message: "A proposal moved forward",
            read: false,
            createdAt: { toDate: () => new Date("2026-03-21T10:01:00Z") },
          }),
          createDoc("n3", {
            type: "review",
            title: "New review",
            message: "A review was left",
            read: false,
            createdAt: { toDate: () => new Date("2026-03-21T10:02:00Z") },
          }),
          createDoc("n4", {
            type: "wallet",
            title: "Payout update",
            message: "A payout was processed",
            read: false,
            createdAt: { toDate: () => new Date("2026-03-21T10:03:00Z") },
          }),
        ],
      })
      return jest.fn()
    })

    render(<NotificationBell />)

    fireEvent.click(screen.getByRole("button"))

    expect(await screen.findByText("Workspace funded")).toBeInTheDocument()
    expect(screen.getByText("Proposal accepted")).toBeInTheDocument()
    expect(screen.getByText("New review")).toBeInTheDocument()
    expect(screen.queryByText("Payout update")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /mark all read/i }))

    await waitFor(() => {
      expect(markAllNotificationsRead).toHaveBeenCalled()
    })
  })

  it("shows branded install prompt and uses the deferred install event", async () => {
    jest.useFakeTimers()

    const prompt = jest.fn().mockResolvedValue(undefined)
    const beforeInstallEvent = new Event("beforeinstallprompt") as any
    beforeInstallEvent.prompt = prompt
    beforeInstallEvent.userChoice = Promise.resolve({
      outcome: "accepted",
      platform: "web",
    })

    render(<PWAInstallPrompt />)

    act(() => {
      window.dispatchEvent(beforeInstallEvent)
      jest.advanceTimersByTime(1500)
    })

    expect(await screen.findByText("Keep changeworker on your home screen")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /install app/i }))

    await waitFor(() => {
      expect(prompt).toHaveBeenCalled()
    })

    jest.useRealTimers()
  })

  it("dismisses the install prompt for the current dashboard session", async () => {
    jest.useFakeTimers()

    const beforeInstallEvent = new Event("beforeinstallprompt") as any
    beforeInstallEvent.prompt = jest.fn().mockResolvedValue(undefined)
    beforeInstallEvent.userChoice = Promise.resolve({
      outcome: "dismissed",
      platform: "web",
    })

    window.sessionStorage.setItem("cw_auth_session_started_at", "12345")

    const { rerender } = render(<PWAInstallPrompt />)

    act(() => {
      window.dispatchEvent(beforeInstallEvent)
      jest.advanceTimersByTime(1500)
    })

    expect(await screen.findByText("Keep changeworker on your home screen")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /dismiss install prompt/i }))

    await waitFor(() => {
      expect(screen.queryByText("Keep changeworker on your home screen")).not.toBeInTheDocument()
    })

    rerender(<PWAInstallPrompt />)

    act(() => {
      jest.advanceTimersByTime(1500)
    })

    expect(screen.queryByText("Keep changeworker on your home screen")).not.toBeInTheDocument()

    jest.useRealTimers()
  })
})

import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

function sharedMocks() {
  const g = globalThis as any
  if (!g.__major_ui_mocks) {
    g.__major_ui_mocks = {
      pushMock: jest.fn(),
      replaceMock: jest.fn(),
      toastSuccess: jest.fn(),
      toastError: jest.fn(),
      useAuthMock: jest.fn(),
      useUserRoleMock: jest.fn(),
      createUserWithEmailAndPasswordMock: jest.fn(),
      signInWithEmailAndPasswordMock: jest.fn(),
      signInWithPopupMock: jest.fn(),
      sendEmailVerificationMock: jest.fn(),
      docMock: jest.fn(),
      setDocMock: jest.fn(),
      getDocMock: jest.fn(),
      getDocsMock: jest.fn(),
      updateDocMock: jest.fn(),
      serverTimestampMock: jest.fn(() => "SERVER_TIMESTAMP"),
      collectionMock: jest.fn(),
      queryMock: jest.fn(),
      orderByMock: jest.fn(),
      whereMock: jest.fn(),
      onSnapshotMock: jest.fn(),
      uploadBytesMock: jest.fn(),
      getDownloadURLMock: jest.fn(),
      refMock: jest.fn(),
      ensureThreadMock: jest.fn(),
    }
  }
  return g.__major_ui_mocks
}

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: sharedMocks().pushMock,
    replace: sharedMocks().replaceMock,
    prefetch: jest.fn(),
  }),
}))

jest.mock("next/link", () => {
  return function Link({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

jest.mock("next/image", () => {
  return function Image(props: any) {
    return <img {...props} alt={props.alt || ""} />
  }
})

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: sharedMocks().toastSuccess,
    error: sharedMocks().toastError,
  },
}))

jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) =>
        ({ children, ...props }: any) =>
          React.createElement(tag, props, children),
    }
  ),
}))

jest.mock("nanoid", () => ({
  nanoid: () => "gig-fixed-id",
}))

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => sharedMocks().useAuthMock(),
}))

jest.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => sharedMocks().useUserRoleMock(),
}))

jest.mock("@/lib/firebase", () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(async () => "token-123"),
    },
  },
  db: "db",
  storage: "storage",
}))

jest.mock("@/lib/chat", () => ({
  ensureThread: (...args: any[]) => sharedMocks().ensureThreadMock(...args),
}))

jest.mock("@/lib/authSession", () => ({
  ensureBrowserSessionPersistence: jest.fn(async () => undefined),
  markAuthSession: jest.fn(),
  clearAuthSession: jest.fn(),
}))

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...args: any[]) =>
    sharedMocks().createUserWithEmailAndPasswordMock(...args),
  signInWithEmailAndPassword: (...args: any[]) =>
    sharedMocks().signInWithEmailAndPasswordMock(...args),
  signInWithPopup: (...args: any[]) => sharedMocks().signInWithPopupMock(...args),
  GoogleAuthProvider: function GoogleAuthProvider() {},
  sendEmailVerification: (...args: any[]) => sharedMocks().sendEmailVerificationMock(...args),
}))

jest.mock("firebase/firestore", () => ({
  doc: (...args: any[]) => sharedMocks().docMock(...args),
  setDoc: (...args: any[]) => sharedMocks().setDocMock(...args),
  getDoc: (...args: any[]) => sharedMocks().getDocMock(...args),
  getDocs: (...args: any[]) => sharedMocks().getDocsMock(...args),
  updateDoc: (...args: any[]) => sharedMocks().updateDocMock(...args),
  serverTimestamp: () => sharedMocks().serverTimestampMock(),
  collection: (...args: any[]) => sharedMocks().collectionMock(...args),
  query: (...args: any[]) => sharedMocks().queryMock(...args),
  orderBy: (...args: any[]) => sharedMocks().orderByMock(...args),
  where: (...args: any[]) => sharedMocks().whereMock(...args),
  onSnapshot: (...args: any[]) => sharedMocks().onSnapshotMock(...args),
  Timestamp: class {
    date: Date
    constructor(date: Date) {
      this.date = date
    }
    toDate() {
      return this.date
    }
  },
}))

jest.mock("firebase/storage", () => ({
  ref: (...args: any[]) => sharedMocks().refMock(...args),
  uploadBytes: (...args: any[]) => sharedMocks().uploadBytesMock(...args),
  getDownloadURL: (...args: any[]) => sharedMocks().getDownloadURLMock(...args),
}))

jest.mock("@/components/auth/RequireAuth", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock("@/components/layout/AuthNavbar", () => ({
  __esModule: true,
  default: () => <div>AuthNavbar</div>,
}))

jest.mock("@/components/layout/Navbar", () => ({
  __esModule: true,
  default: () => <div>Navbar</div>,
}))

jest.mock("@/components/profile/ClientProfilePage", () => ({
  __esModule: true,
  default: () => <div>Client Profile Screen</div>,
}))

jest.mock("@/components/profile/TalentProfilePage", () => ({
  __esModule: true,
  default: () => <div>Talent Profile Screen</div>,
}))

jest.mock("@/components/ui/FancyLoader", () => ({
  __esModule: true,
  default: ({ label }: { label?: string }) => <div>{label || "Loading"}</div>,
}))

jest.mock("@/components/ui/Button", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
    type = "button",
    ...props
  }: any) => (
    <button type={type} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}))

jest.mock("@/components/ui/textarea", () => ({
  Textarea: ({ ...props }: any) => <textarea {...props} />,
}))

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

jest.mock("@/components/ui/separator", () => ({
  Separator: (props: any) => <hr {...props} />,
}))

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/ui/command", () => ({
  Command: ({ children }: any) => <div>{children}</div>,
  CommandEmpty: ({ children }: any) => <div>{children}</div>,
  CommandGroup: ({ children }: any) => <div>{children}</div>,
  CommandInput: (props: any) => <input {...props} />,
  CommandItem: ({ children, onSelect }: any) => (
    <button onClick={() => onSelect?.("")}>{children}</button>
  ),
  CommandList: ({ children }: any) => <div>{children}</div>,
}))

jest.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (v: string) => void
    children: React.ReactNode
  }) => (
    <div data-select-value={value}>
      <select
        aria-label="select"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {React.Children.toArray(children)
          .flatMap((child: any) =>
            child?.type?.displayName === "MockSelectContent"
              ? React.Children.toArray(child.props.children)
              : []
          )
          .map((item: any, index: number) => (
            <option key={index} value={item.props.value}>
              {item.props.children}
            </option>
          ))}
      </select>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}))

;(require("@/components/ui/select").SelectContent as any).displayName = "MockSelectContent"

import SignupPage from "@/app/signup/page"
import LoginPage from "@/app/login/page"
import OnboardingPage from "@/app/onboarding/page"
import PostGigPage from "@/app/dashboard/post-gig/page"
import TalentProposalsHubPage from "@/app/dashboard/proposals/page"
import NewThreadPage from "@/app/dashboard/messages/new/page"
import WalletPage from "@/app/dashboard/wallet/page"
import ProfilePage from "@/app/dashboard/profile/page"
import WorkspacesPage from "@/app/dashboard/workspaces/page"

function makeSnap(exists: boolean, data: any = {}) {
  return {
    exists: () => exists,
    data: () => data,
  }
}

describe("Major client and talent UI flows", () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((...args: any[]) => {
      const first = String(args[0] ?? "")
      if (first.includes("not wrapped in act")) return
    })
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  beforeEach(() => {
    const mocks = sharedMocks()
    jest.clearAllMocks()
    const stableUser = {
      uid: "user-1",
      email: "user@test.com",
      getIdToken: jest.fn(async () => "token-123"),
    }
    mocks.useAuthMock.mockReturnValue({
      user: stableUser,
      loading: false,
    })
    mocks.useAuthMock.mockImplementation(() => ({
      user: stableUser,
      loading: false,
    }))
    mocks.useUserRoleMock.mockReturnValue({
      role: "talent",
      loadingRole: false,
    })
    mocks.useUserRoleMock.mockImplementation(() => ({
      role: "talent",
      loadingRole: false,
    }))
    mocks.docMock.mockImplementation((...args: any[]) => ({ path: args.join("/") }))
    mocks.collectionMock.mockImplementation((...args: any[]) => ({ path: args.join("/") }))
    mocks.queryMock.mockImplementation((...args: any[]) => ({ query: args }))
    mocks.orderByMock.mockImplementation((...args: any[]) => ({ orderBy: args }))
    mocks.whereMock.mockImplementation((...args: any[]) => ({ where: args }))
    mocks.setDocMock.mockResolvedValue(undefined)
    mocks.updateDocMock.mockResolvedValue(undefined)
    mocks.uploadBytesMock.mockResolvedValue(undefined)
    mocks.getDownloadURLMock.mockResolvedValue("https://files.test/brief.pdf")
    mocks.refMock.mockImplementation((...args: any[]) => ({ ref: args }))
    mocks.ensureThreadMock.mockResolvedValue("thread-123")
    mocks.getDocMock.mockResolvedValue(makeSnap(true, {}))
    ;(global as any).fetch = jest.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes("/api/paystack/banks")
          ? { banks: [{ name: "Access Bank", code: "044", slug: "access-bank" }] }
          : { accountName: "Timi Test", recipientCode: "RCP_1" },
    }))
    window.history.replaceState({}, "", "http://localhost/")
    window.localStorage.clear()
  })

  it("handles email signup validation and successful signup", async () => {
    const mocks = sharedMocks()
    mocks.createUserWithEmailAndPasswordMock.mockResolvedValue({
      user: { uid: "new-user", email: "new@test.com" },
    })
    mocks.sendEmailVerificationMock.mockResolvedValue(undefined)

    render(<SignupPage />)

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }))
    expect(mocks.toastError).toHaveBeenCalledWith("Enter email and password")

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "new@test.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Secret123!" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }))

    await waitFor(() => {
      expect(mocks.createUserWithEmailAndPasswordMock).toHaveBeenCalled()
    })
    expect(mocks.createUserWithEmailAndPasswordMock).toHaveBeenCalled()
    expect(mocks.sendEmailVerificationMock).toHaveBeenCalled()
    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { path: "db/users/new-user" },
      expect.objectContaining({
        uid: "new-user",
        email: "new@test.com",
        onboardingComplete: false,
      }),
      { merge: true }
    )
    expect(mocks.toastSuccess).toHaveBeenCalled()
    expect(mocks.pushMock).toHaveBeenCalledWith("/verify-email")
  })

  it("logs in verified users and routes incomplete users to onboarding", async () => {
    const mocks = sharedMocks()
    mocks.signInWithEmailAndPasswordMock.mockResolvedValue({
      user: { uid: "user-1", emailVerified: true },
    })
    mocks.getDocMock.mockResolvedValueOnce(makeSnap(true, { onboardingComplete: false }))

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText("Email address"), {
      target: { value: "user@test.com" },
    })
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Secret123!" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Login" }))

    await waitFor(() => {
      expect(mocks.signInWithEmailAndPasswordMock).toHaveBeenCalled()
    })
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Logged in successfully")
    expect(mocks.pushMock).toHaveBeenCalledWith("/onboarding")
  })

  it("saves talent onboarding to both users and publicProfiles", async () => {
    const mocks = sharedMocks()
    render(<OnboardingPage />)

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Timi Talent" },
    })
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Lagos" },
    })
    fireEvent.change(screen.getByLabelText("Role title"), {
      target: { value: "Frontend Developer" },
    })
    fireEvent.change(screen.getByLabelText("Skills (comma separated)"), {
      target: { value: "React, Next.js" },
    })
    fireEvent.click(screen.getByRole("button", { name: "No Poverty" }))
    fireEvent.click(screen.getByRole("button", { name: "Finish Setup" }))

    await waitFor(() => {
      expect(mocks.setDocMock).toHaveBeenCalledTimes(2)
    })
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      1,
      { path: "db/users/user-1" },
      expect.objectContaining({
        role: "talent",
        fullName: "Timi Talent",
        location: "Lagos",
        onboardingComplete: true,
        talent: expect.objectContaining({
          roleTitle: "Frontend Developer",
          skills: ["React", "Next.js"],
        }),
      }),
      { merge: true }
    )
    expect(mocks.setDocMock).toHaveBeenNthCalledWith(
      2,
      { path: "db/publicProfiles/user-1" },
      expect.objectContaining({
        role: "talent",
        fullName: "Timi Talent",
      }),
      { merge: true }
    )
    expect(mocks.pushMock).toHaveBeenCalledWith("/dashboard")
  })

  it("loads an existing gig into the edit form from the real post gig page flow", async () => {
    const mocks = sharedMocks()
    window.history.replaceState({}, "", "http://localhost/dashboard/post-gig?edit=gig-123")
    mocks.getDocMock.mockImplementation(async (ref: any) => {
      if (ref.path === "db/users/user-1") {
        return makeSnap(true, {
          role: "client",
          fullName: "Client User",
          client: { orgName: "Acme Org" },
        })
      }

      if (ref.path === "db/gigs/gig-123") {
        return makeSnap(true, {
          clientUid: "user-1",
          title: "Original gig title",
          description:
            "This original description is long enough to satisfy validation without extra work.",
          workMode: "Remote",
          budgetType: "hourly",
          hourlyRate: 12000,
          requiredSkills: ["React", "TypeScript"],
          sdgTags: ["No Poverty"],
          category: { group: "Climate & Environment", item: "Climate Research" },
          status: "open",
          attachments: [],
        })
      }

      return makeSnap(true, {})
    })

    render(<PostGigPage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue("Original gig title")).toBeInTheDocument()
    })
    expect(screen.getByText("Edit gig")).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(
        "This original description is long enough to satisfy validation without extra work."
      )
    ).toBeInTheDocument()
    expect(screen.getByText("No Poverty")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Grant writer needed/i), {
      target: { value: "Updated climate dashboard" },
    })
    expect(screen.getByDisplayValue("Updated climate dashboard")).toBeInTheDocument()
  }, 20000)

  it("lists and filters proposal rows from live proposal docs", async () => {
    const mocks = sharedMocks()
    mocks.getDocsMock.mockResolvedValue({
      docs: [
        {
          id: "gig-1",
          data: () => ({
            title: "Climate data app",
            updatedAt: new Date("2026-03-19"),
          }),
        },
        {
          id: "gig-2",
          data: () => ({
            title: "Brand redesign",
            updatedAt: new Date("2026-03-18"),
          }),
        },
      ],
    })
    mocks.getDocMock
      .mockResolvedValueOnce(makeSnap(true, { status: "accepted", updatedAt: new Date() }))
      .mockResolvedValueOnce(makeSnap(true, { status: "rejected", updatedAt: new Date() }))

    render(<TalentProposalsHubPage />)

    expect(await screen.findByText("Climate data app")).toBeInTheDocument()
    expect(screen.getByText("Brand redesign")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Search by gig title or status/i), {
      target: { value: "Climate" },
    })

    expect(screen.getByText("Climate data app")).toBeInTheDocument()
    expect(screen.queryByText("Brand redesign")).not.toBeInTheDocument()
  })

  it("creates a new thread and redirects into the conversation", async () => {
    const mocks = sharedMocks()
    window.history.replaceState(
      {},
      "",
      "http://localhost/dashboard/messages/new?gigId=gig-1&clientUid=client-1"
    )

    mocks.getDocMock
      .mockResolvedValueOnce(makeSnap(true, { title: "Climate dashboard" }))
      .mockResolvedValueOnce(makeSnap(true, { role: "talent", fullName: "Talent User" }))
      .mockResolvedValueOnce(makeSnap(true, { fullName: "Client Name", slug: "client-name" }))
      .mockResolvedValueOnce(makeSnap(true, { fullName: "Talent Name", slug: "talent-name" }))

    render(<NewThreadPage />)

    await waitFor(() => {
      expect(mocks.ensureThreadMock).toHaveBeenCalled()
    })
    expect(mocks.ensureThreadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gigId: "gig-1",
        clientUid: "client-1",
        talentUid: "user-1",
      })
    )
    expect(mocks.replaceMock).toHaveBeenCalledWith("/dashboard/messages/thread-123")
  })

  it("verifies bank details and saves bank setup for talent wallet flow", async () => {
    const mocks = sharedMocks()
    mocks.getDocMock
      .mockResolvedValueOnce(makeSnap(true, { role: "talent" }))
      .mockResolvedValueOnce(makeSnap(true, { role: "talent" }))

    mocks.onSnapshotMock
      .mockImplementationOnce((ref: any, cb: any) => {
        cb(
          makeSnap(true, {
            uid: "user-1",
            role: "talent",
            availableBalance: 5000,
            pendingBalance: 0,
            totalEarned: 12000,
          })
        )
        return jest.fn()
      })
      .mockImplementationOnce((ref: any, cb: any) => {
        cb({ docs: [] })
        return jest.fn()
      })

    render(<WalletPage />)

    expect(await screen.findByText(/Available/i)).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText(/Account number/i), {
      target: { value: "0123456789" },
    })

    fireEvent.change(screen.getByRole("combobox", { name: "select" }), {
      target: { value: "044" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Verify account" }))

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith(
        "/api/paystack/resolve-bank",
        expect.any(Object)
      )
    })

    fireEvent.click(
      await screen.findByRole("button", { name: "Save & create transfer recipient" })
    )

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith(
        "/api/paystack/create-recipient",
        expect.any(Object)
      )
    })
  })

  it("starts a withdrawal when the wallet already has a verified bank", async () => {
    const mocks = sharedMocks()
    mocks.getDocMock.mockResolvedValue(makeSnap(true, { role: "talent" }))

    mocks.onSnapshotMock
      .mockImplementationOnce((ref: any, cb: any) => {
        cb(
          makeSnap(true, {
            uid: "user-1",
            role: "talent",
            availableBalance: 5000,
            pendingBalance: 0,
            totalEarned: 12000,
            bank: {
              accountNumber: "0123456789",
              bankCode: "044",
              bankName: "Access Bank",
              accountName: "Timi Test",
              recipientCode: "RCP_1",
            },
          })
        )
        return jest.fn()
      })
      .mockImplementationOnce((ref: any, cb: any) => {
        cb({ docs: [] })
        return jest.fn()
      })

    render(<WalletPage />)

    fireEvent.change(screen.getByPlaceholderText(/Amount/i), {
      target: { value: "2000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Withdraw to bank" }))

    await waitFor(() => {
      expect((global as any).fetch).toHaveBeenCalledWith(
        "/api/paystack/withdraw",
        expect.any(Object)
      )
    })
  })

  it("renders the correct profile page by user role", () => {
    const mocks = sharedMocks()
    mocks.useUserRoleMock.mockReturnValueOnce({ role: "client", loadingRole: false })
    render(<ProfilePage />)
    expect(screen.getByText("Client Profile Screen")).toBeInTheDocument()
  })

  it("lists workspaces, backfills thread metadata, and filters by query", async () => {
    const mocks = sharedMocks()
    mocks.onSnapshotMock
      .mockImplementationOnce((queryArg: any, cb: any) => {
        cb({
          docs: [
            {
              id: "ws-1",
              data: () => ({
                clientUid: "user-1",
                talentUid: "talent-1",
                threadId: "thread-1",
                gigTitle: "Climate dashboard",
                talentName: "Ada Talent",
                updatedAt: { toMillis: () => 2 },
                status: "active",
              }),
            },
          ],
        })
        return jest.fn()
      })
      .mockImplementationOnce((queryArg: any, cb: any) => {
        cb({ docs: [] })
        return jest.fn()
      })

    render(<WorkspacesPage />)

    expect(await screen.findByText("Climate dashboard")).toBeInTheDocument()
    fireEvent.change(screen.getAllByPlaceholderText(/Search workspaces/i)[0], {
      target: { value: "Ada" },
    })
    expect(screen.getByText("Climate dashboard")).toBeInTheDocument()
  })
})

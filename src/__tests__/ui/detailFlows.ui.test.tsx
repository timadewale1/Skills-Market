import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

function detailMocks() {
  const g = globalThis as any
  if (!g.__detail_ui_mocks) {
    g.__detail_ui_mocks = {
      pushMock: jest.fn(),
      replaceMock: jest.fn(),
      backMock: jest.fn(),
      params: { gigId: "gig-1", threadId: "thread-1", id: "ws-1" },
      useAuthMock: jest.fn(),
      getDocMock: jest.fn(),
      setDocMock: jest.fn(),
      updateDocMock: jest.fn(),
      docMock: jest.fn(),
      serverTimestampMock: jest.fn(() => "SERVER_TIMESTAMP"),
      onSnapshotMock: jest.fn(),
      queryMock: jest.fn(),
      collectionMock: jest.fn(),
      orderByMock: jest.fn(),
      uploadFileWithProgressMock: jest.fn(),
      makeUserPathMock: jest.fn((uid: string, bucket: string, name: string) => `${uid}/${bucket}/${name}`),
      toastSuccess: jest.fn(),
      toastError: jest.fn(),
    }
  }
  return g.__detail_ui_mocks
}

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: detailMocks().pushMock,
    replace: detailMocks().replaceMock,
    back: detailMocks().backMock,
    prefetch: jest.fn(),
  }),
  useParams: () => detailMocks().params,
}))

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: (...args: any[]) => detailMocks().toastSuccess(...args),
    error: (...args: any[]) => detailMocks().toastError(...args),
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
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => detailMocks().useAuthMock(),
}))

jest.mock("@/lib/firebase", () => ({
  db: "db",
  storage: "storage",
}))

jest.mock("firebase/firestore", () => ({
  doc: (...args: any[]) => detailMocks().docMock(...args),
  getDoc: (...args: any[]) => detailMocks().getDocMock(...args),
  setDoc: (...args: any[]) => detailMocks().setDocMock(...args),
  updateDoc: (...args: any[]) => detailMocks().updateDocMock(...args),
  serverTimestamp: () => detailMocks().serverTimestampMock(),
  onSnapshot: (...args: any[]) => detailMocks().onSnapshotMock(...args),
  query: (...args: any[]) => detailMocks().queryMock(...args),
  collection: (...args: any[]) => detailMocks().collectionMock(...args),
  orderBy: (...args: any[]) => detailMocks().orderByMock(...args),
}))

jest.mock("@/lib/upload", () => ({
  uploadFileWithProgress: (...args: any[]) => detailMocks().uploadFileWithProgressMock(...args),
  makeUserPath: (...args: any[]) => detailMocks().makeUserPathMock(...args),
}))

jest.mock("@/components/auth/RequireAuth", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock("@/components/layout/AuthNavbar", () => ({
  __esModule: true,
  default: () => <div>AuthNavbar</div>,
}))

jest.mock("@/components/ui/Button", () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = "button", ...props }: any) => (
    <button type={type} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}))

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock("@/components/ui/separator", () => ({
  Separator: (props: any) => <hr {...props} />,
}))

jest.mock("@/components/reviews/ReviewsList", () => ({
  __esModule: true,
  default: () => <div>ReviewsList</div>,
}))

jest.mock("@/components/profile/parts/AvatarUploader", () => ({
  __esModule: true,
  default: () => <div>AvatarUploader</div>,
}))

jest.mock("@/components/profile/modals/RateModal", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/profile/modals/EditTextModal", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/profile/modals/ListEditorModal", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/profile/modals/EditMultiSelectModal", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/profile/portfolio/PortfolioAddModal", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/profile/portfolio/PortfolioDetailsModal", () => ({
  __esModule: true,
  default: () => null,
}))

import ProposalDetailPage from "@/app/dashboard/proposals/[gigId]/page"
import TalentVerificationCard from "@/components/profile/verification/TalentVerificationCard"
import ClientVerificationCard from "@/components/profile/verification/ClientVerificationCard"
import TalentProfilePage from "@/components/profile/TalentProfilePage"
import ClientProfilePage from "@/components/profile/ClientProfilePage"

function makeSnap(exists: boolean, data: any = {}, id = "doc-id") {
  return {
    id,
    exists: () => exists,
    data: () => data,
  }
}

describe("Remaining detail page flows", () => {
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
    const mocks = detailMocks()
    jest.clearAllMocks()
    mocks.params = { gigId: "gig-1", threadId: "thread-1", id: "ws-1" }
    const user = {
      uid: "user-1",
      email: "user@test.com",
      displayName: "Timi User",
      getIdToken: jest.fn(async () => "token-123"),
    }
    mocks.useAuthMock.mockReturnValue({ user, loading: false })
    mocks.docMock.mockImplementation((...args: any[]) => ({ path: args.join("/") }))
    mocks.serverTimestampMock.mockReturnValue("SERVER_TIMESTAMP")
    mocks.setDocMock.mockResolvedValue(undefined)
    mocks.updateDocMock.mockResolvedValue(undefined)
    mocks.queryMock.mockImplementation((...args: any[]) => ({ query: args }))
    mocks.collectionMock.mockImplementation((...args: any[]) => ({ path: args.join("/") }))
    mocks.orderByMock.mockImplementation((...args: any[]) => ({ orderBy: args }))
    mocks.uploadFileWithProgressMock.mockResolvedValue("https://files.test/uploaded.pdf")
  })

  it("withdraws an unviewed proposal from the proposal detail page", async () => {
    const mocks = detailMocks()
    mocks.getDocMock.mockImplementation(async (ref: any) => {
      if (ref.path === "db/gigs/gig-1") {
        return makeSnap(true, {
          title: "Climate Dashboard",
          status: "open",
          budgetType: "fixed",
          fixedBudget: 250000,
          duration: "1-3 months",
          clientUid: "client-1",
        }, "gig-1")
      }

      if (ref.path === "db/gigs/gig-1/proposals/user-1") {
        return makeSnap(true, {
          gigId: "gig-1",
          talentUid: "user-1",
          status: "submitted",
          coverLetter: "I can deliver this project with a clean, production-ready implementation.",
          attachments: [],
          viewedAt: null,
        })
      }

      return makeSnap(true, {})
    })

    render(<ProposalDetailPage />)

    expect(await screen.findByDisplayValue(/I can deliver this project/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Withdraw proposal" }))

    await waitFor(() => {
      expect(mocks.updateDocMock).toHaveBeenCalledWith(
        { path: "db/gigs/gig-1/proposals/user-1" },
        { status: "withdrawn", updatedAt: "SERVER_TIMESTAMP" }
      )
    })
    expect(mocks.setDocMock).toHaveBeenCalledWith(
      { path: "db/users/user-1/proposals/gig-1" },
      { status: "withdrawn", updatedAt: "SERVER_TIMESTAMP" },
      { merge: true }
    )
  })

  it("disables proposal withdrawal after the client has viewed it", async () => {
    const mocks = detailMocks()
    mocks.getDocMock.mockImplementation(async (ref: any) => {
      if (ref.path === "db/gigs/gig-1") {
        return makeSnap(true, { title: "Viewed Proposal Gig", status: "open" }, "gig-1")
      }
      if (ref.path === "db/gigs/gig-1/proposals/user-1") {
        return makeSnap(true, {
          gigId: "gig-1",
          talentUid: "user-1",
          status: "submitted",
          coverLetter: "Already viewed by client.",
          viewedAt: { seconds: 1 },
        })
      }
      return makeSnap(true, {})
    })

    render(<ProposalDetailPage />)

    const withdrawButton = await screen.findByRole("button", { name: "Withdraw proposal" })
    expect(withdrawButton).toBeDisabled()
  })

  it("uploads and submits talent verification", async () => {
    const mocks = detailMocks()
    mocks.getDocMock.mockResolvedValue(makeSnap(true, { kyc: {} }))

    const { container } = render(<TalentVerificationCard />)

    expect(await screen.findByText("Verification (KYC)")).toBeInTheDocument()

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "12345678901" },
    })

    const file = new File(["id"], "id-card.pdf", { type: "application/pdf" })
    const fileInputs = Array.from(
      container.querySelectorAll('input[type="file"]')
    ) as HTMLInputElement[]
    fireEvent.change(fileInputs[0], { target: { files: [file] } })
    fireEvent.change(fileInputs[1], { target: { files: [file] } })

    await waitFor(() => {
      expect(mocks.uploadFileWithProgressMock).toHaveBeenCalledTimes(2)
    })

    fireEvent.click(screen.getByRole("button", { name: "Submit verification" }))

    await waitFor(() => {
      expect(mocks.setDocMock).toHaveBeenCalledWith(
        { path: "db/users/user-1" },
        expect.objectContaining({
          kyc: expect.objectContaining({
            nin: "12345678901",
            status: "pending",
            idUrl: "https://files.test/uploaded.pdf",
            proofOfAddressUrl: "https://files.test/uploaded.pdf",
          }),
        }),
        { merge: true }
      )
    })
  })

  it("uploads and submits client organization verification", async () => {
    const mocks = detailMocks()
    mocks.getDocMock.mockResolvedValue(makeSnap(true, { orgKyc: {} }))

    const { container } = render(<ClientVerificationCard />)

    expect(await screen.findByText("Organization verification")).toBeInTheDocument()

    const textboxes = screen.getAllByRole("textbox")
    fireEvent.change(textboxes[0], {
      target: { value: "RC123456" },
    })
    fireEvent.change(textboxes[1], {
      target: { value: "Timi Admin" },
    })

    const file = new File(["cac"], "cac.pdf", { type: "application/pdf" })
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    })

    await waitFor(() => {
      expect(mocks.uploadFileWithProgressMock).toHaveBeenCalled()
    })
    expect(await screen.findByText(/Uploaded/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Submit verification" }))

    await waitFor(() => {
      expect(mocks.setDocMock).toHaveBeenCalledWith(
        { path: "db/users/user-1" },
        expect.objectContaining({
          orgKyc: expect.objectContaining({
            mode: "org",
            status: "pending",
            cacNumber: "RC123456",
            cacDocUrl: "https://files.test/uploaded.pdf",
            repName: "Timi Admin",
          }),
        }),
        { merge: true }
      )
    })
  })

  it("shows the expandable talent profile completion surface", async () => {
    const mocks = detailMocks()
    mocks.getDocMock.mockResolvedValue(
      makeSnap(true, {
        fullName: "Talent User",
        location: "Lagos",
        talent: { roleTitle: "Frontend Engineer", skills: ["React"] },
        publicProfile: { portfolio: [] },
        sdgTags: [],
        profileComplete: false,
      })
    )

    render(<TalentProfilePage />)

    expect(await screen.findByText("Complete profile & verification")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Complete profile & verification" }))
    expect(await screen.findByText("Verification (KYC)")).toBeInTheDocument()
  })

  it("saves client contact/profile changes from the expanded client profile page", async () => {
    const mocks = detailMocks()
    mocks.getDocMock
      .mockResolvedValueOnce(
        makeSnap(true, {
          client: { orgName: "Acme Org" },
          location: "Abuja",
          email: "contact@acme.test",
          orgProfile: {
            about: "Old about text",
            website: "https://old.test",
            contactEmail: "contact@acme.test",
            contactPhone: "",
            portfolio: [{ id: "p1", title: "Project One", coverUrl: "/x.png" }],
            categories: ["Climate Research"],
          },
          sdgTags: ["No Poverty"],
          profileComplete: false,
        })
      )
      .mockResolvedValueOnce(makeSnap(true, { refreshed: true }))

    const { container } = render(<ClientProfilePage />)

    expect(await screen.findByText("Complete profile & verification")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Complete profile & verification" }))

    const websiteInput = container.querySelector('input[placeholder="https://..."]') as HTMLInputElement

    fireEvent.change(websiteInput, {
      target: { value: "https://new-acme.test" },
    })
    const phoneInput = container.querySelector('input[placeholder="+234..."]') as HTMLInputElement
    fireEvent.change(phoneInput, {
      target: { value: "+2348000000000" },
    })

    await waitFor(() => {
      expect(websiteInput.value).toBe("https://new-acme.test")
      expect(phoneInput.value).toBe("+2348000000000")
    })

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(mocks.setDocMock).toHaveBeenNthCalledWith(
        1,
        { path: "db/users/user-1" },
        expect.objectContaining({
          orgProfile: expect.objectContaining({
            website: "https://new-acme.test",
            contactPhone: "+2348000000000",
          }),
        }),
        { merge: true }
      )
    })
  })
})

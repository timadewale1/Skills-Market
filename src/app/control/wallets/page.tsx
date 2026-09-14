import Link from "next/link"
import AdminPageHeader from "@/components/control/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import {
  formatAdminDate,
  formatAdminMoney,
  getAdminIndexes,
  getUserSummary,
  getWorkspaceEscrowByClient,
} from "@/lib/adminData"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 10

type WalletsPageProps = {
  searchParams?: Promise<{
    q?: string
    role?: string
    page?: string
  }>
}

async function getWallets() {
  const db = getAdminDb()
  const indexes = await getAdminIndexes()
  const escrowByClient = await getWorkspaceEscrowByClient()
  const [snap, withdrawalsSnap] = await Promise.all([
    db.collection("wallets").orderBy("updatedAt", "desc").get(),
    db.collectionGroup("withdrawals").get(),
  ])

  const withdrawalStats = new Map<
    string,
    { total: number; pending: number; processing: number; lastAt: any }
  >()

  withdrawalsSnap.docs.forEach((doc: any) => {
    const walletUid = doc.ref.parent.parent?.id || ""
    if (!walletUid) return
    const data = doc.data() as any
    const current = withdrawalStats.get(walletUid) || {
      total: 0,
      pending: 0,
      processing: 0,
      lastAt: null,
    }
    current.total += Number(data.amount || 0)
    if (String(data.status || "").toLowerCase() === "requested") current.pending += 1
    if (String(data.status || "").toLowerCase() === "processing") current.processing += 1
    const candidate = data.updatedAt || data.createdAt
    if (!current.lastAt || Number((candidate?.toMillis?.() ?? candidate?._seconds ? candidate._seconds * 1000 : 0) || 0) > Number((current.lastAt?.toMillis?.() ?? current.lastAt?._seconds ? current.lastAt._seconds * 1000 : 0) || 0)) {
      current.lastAt = candidate
    }
    withdrawalStats.set(walletUid, current)
  })

  const wallets = snap.docs.map((doc: any) => {
    const wallet = { id: doc.id, ...(doc.data() as any) }
    const owner = getUserSummary(doc.id, indexes)
    const withdrawals = withdrawalStats.get(doc.id) || {
      total: 0,
      pending: 0,
      processing: 0,
      lastAt: null,
    }

    return {
      ...wallet,
      owner,
      activeEscrow: owner.role === "client" ? Number(escrowByClient.get(doc.id) || 0) : 0,
      withdrawals,
    }
  })

  return wallets
}

function walletHref(q: string, role: string, page: number) {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (role && role !== "all") params.set("role", role)
  if (page > 1) params.set("page", String(page))
  const value = params.toString()
  return value ? `/control/wallets?${value}` : "/control/wallets"
}

export default async function WalletsPage({ searchParams }: WalletsPageProps) {
  const resolvedSearchParams = (await searchParams) || {}
  const q = String(resolvedSearchParams.q || "").trim().toLowerCase()
  const role = String(resolvedSearchParams.role || "all")
  const page = Math.max(1, Number(resolvedSearchParams.page || 1))

  const wallets: any[] = await getWallets()
  const filteredWallets = wallets.filter((wallet) => {
    const matchesRole = role === "all" || String(wallet.role || wallet.owner.role || "").toLowerCase() === role
    if (!matchesRole) return false

    if (!q) return true
    const searchText = [
      wallet.owner?.name,
      wallet.owner?.email,
      wallet.id,
      String(wallet.role || wallet.owner?.role || ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return searchText.includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(filteredWallets.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleWallets = filteredWallets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalBalance = filteredWallets.reduce((sum, wallet) => sum + Number(wallet.availableBalance || 0), 0)
  const totalEscrow = filteredWallets.reduce(
    (sum, wallet) => sum + Number(wallet.activeEscrow || wallet.pendingBalance || 0),
    0
  )
  const pendingWithdrawals = filteredWallets.reduce(
    (sum, wallet) => sum + Number(wallet.withdrawals?.pending || 0) + Number(wallet.withdrawals?.processing || 0),
    0
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Wallet operations"
        title="Wallets and balances"
        description="Inspect balances, client escrow exposure, talent withdrawal requests, and each user wallet’s latest settlement context."
        stats={[
          { label: "Wallets", value: filteredWallets.length },
          { label: "Talent balances", value: formatAdminMoney(totalBalance) },
          { label: "Client escrow", value: formatAdminMoney(totalEscrow) },
          { label: "Pending withdrawals", value: pendingWithdrawals },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-6">
          <form action="/control/wallets" className="flex flex-col gap-3 lg:flex-row">
            <input
              name="q"
              defaultValue={resolvedSearchParams.q || ""}
              placeholder="Search by user name or email"
              className="w-full rounded-full border px-4 py-2 text-sm"
            />
            <select name="role" defaultValue={role} className="rounded-full border px-4 py-2 text-sm">
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="talent">Talents</option>
            </select>
            <button className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white">Search</button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {visibleWallets.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No wallets found.</CardContent>
          </Card>
        ) : (
          visibleWallets.map((wallet) => (
            <Card key={wallet.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-extrabold text-gray-900">{wallet.owner.name || wallet.id}</div>
                    <div className="mt-1 text-sm font-semibold capitalize text-gray-500">
                      {wallet.role || wallet.owner.role || "wallet"}
                    </div>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-5">
                      {wallet.role === "client" ? (
                        <>
                          <div>
                            <div className="font-semibold text-gray-500">Active escrow</div>
                            <div className="mt-1 text-gray-900">
                              {formatAdminMoney(wallet.activeEscrow)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-500">Workspace funded</div>
                            <div className="mt-1 text-gray-900">
                              {formatAdminMoney(wallet.totalWorkspaceFunded ?? wallet.totalSpent)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-500">Wallet balance</div>
                            <div className="mt-1 text-gray-900">
                              {formatAdminMoney(wallet.availableBalance)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-500">Total funded</div>
                            <div className="mt-1 text-gray-900">
                              {formatAdminMoney(wallet.totalFundingReceived ?? (Number(wallet.totalLoaded || 0) + Number(wallet.totalSpent || 0)))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="font-semibold text-gray-500">Available balance</div>
                            <div className="mt-1 text-gray-900">
                              {formatAdminMoney(wallet.availableBalance)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-500">Pending balance</div>
                            <div className="mt-1 text-gray-900">
                              {formatAdminMoney(wallet.pendingBalance)}
                            </div>
                          </div>
                        </>
                      )}
                      <div>
                        <div className="font-semibold text-gray-500">Pending withdrawals</div>
                        <div className="mt-1 text-gray-900">
                          {(wallet.withdrawals?.pending || 0) + (wallet.withdrawals?.processing || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Updated</div>
                        <div className="mt-1 text-gray-900">{formatAdminDate(wallet.updatedAt)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Latest withdrawal</div>
                        <div className="mt-1 text-gray-900">
                          {wallet.withdrawals?.lastAt ? formatAdminDate(wallet.withdrawals.lastAt) : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/control/wallets/${wallet.id}`}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    View wallet
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Link href={walletHref(String(resolvedSearchParams.q || ""), role, Math.max(1, safePage - 1))} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700">
            Previous
          </Link>
          <div className="text-sm font-semibold text-gray-600">
            Page {safePage} of {totalPages}
          </div>
          <Link href={walletHref(String(resolvedSearchParams.q || ""), role, Math.min(totalPages, safePage + 1))} className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700">
            Next
          </Link>
        </div>
      ) : null}
    </div>
  )
}

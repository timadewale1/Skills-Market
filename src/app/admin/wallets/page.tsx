import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
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
    current.lastAt = current.lastAt || data.updatedAt || data.createdAt
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

export default async function WalletsPage() {
  const wallets: any[] = await getWallets()
  const totalBalance = wallets.reduce((sum, wallet) => sum + Number(wallet.availableBalance || 0), 0)
  const totalEscrow = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.activeEscrow || wallet.pendingBalance || 0),
    0
  )
  const pendingWithdrawals = wallets.reduce(
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
          { label: "Wallets", value: wallets.length },
          { label: "Talent balances", value: formatAdminMoney(totalBalance) },
          { label: "Client escrow", value: formatAdminMoney(totalEscrow) },
          { label: "Pending withdrawals", value: pendingWithdrawals },
        ]}
      />

      <div className="space-y-4">
        {wallets.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No wallets found.</CardContent>
          </Card>
        ) : (
          wallets.map((wallet) => (
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
                            <div className="font-semibold text-gray-500">Total funded spend</div>
                            <div className="mt-1 text-gray-900">
                              {formatAdminMoney(wallet.totalSpent)}
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
                    href={`/admin/wallets/${wallet.id}`}
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
    </div>
  )
}

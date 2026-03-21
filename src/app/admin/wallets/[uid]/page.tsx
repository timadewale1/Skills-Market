import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import {
  formatAdminDate,
  formatAdminMoney,
  getAdminIndexes,
  getUserSummary,
  getWorkspaceEscrowByClient,
} from "@/lib/adminData"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ uid: string }>
}

async function getWalletDetail(uid: string) {
  const db = getAdminDb()
  const indexes = await getAdminIndexes()
  const escrowByClient = await getWorkspaceEscrowByClient()
  const [walletSnap, txSnap] = await Promise.all([
    db.collection("wallets").doc(uid).get(),
    db.collection("wallets").doc(uid).collection("transactions").orderBy("createdAt", "desc").get(),
  ])

  if (!walletSnap.exists) return null

  return {
    id: walletSnap.id,
    ...(walletSnap.data() as any),
    owner: getUserSummary(uid, indexes),
    activeEscrow: Number(escrowByClient.get(uid) || 0),
    transactions: txSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
  }
}

export default async function AdminWalletDetailPage({ params }: PageProps) {
  const { uid } = await params
  const wallet: any = await getWalletDetail(uid)

  if (!wallet) {
    return (
      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="p-10 text-center text-gray-600">Wallet not found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Wallet detail"
        title={wallet.owner.name}
        description="Review the admin wallet view for this user, including funding, earnings, bank setup, escrow exposure, and transaction history."
        actions={
          <Link
            href="/admin/wallets"
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
          >
            Back to wallets
          </Link>
        }
        stats={[
          { label: "Role", value: wallet.role || wallet.owner.role || "wallet" },
          { label: "Available", value: formatAdminMoney(wallet.availableBalance) },
          { label: "Pending", value: formatAdminMoney(wallet.pendingBalance) },
          { label: "Total spent", value: formatAdminMoney(wallet.totalSpent) },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Wallet summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            {wallet.role === "client" ? (
              <>
                <div>
                  <div className="font-semibold text-gray-500">Active escrow</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.activeEscrow)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Total funded spend</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.totalSpent)}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="font-semibold text-gray-500">Available balance</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.availableBalance)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Pending balance</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.pendingBalance)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Total earned</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.totalEarned)}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Total withdrawn</div>
                  <div className="mt-1 text-gray-900">{formatAdminMoney(wallet.totalWithdrawn)}</div>
                </div>
              </>
            )}
            <div>
              <div className="font-semibold text-gray-500">Updated</div>
              <div className="mt-1 text-gray-900">{formatAdminDate(wallet.updatedAt, true)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-500">Wallet ID</div>
              <div className="mt-1 break-all text-gray-900">{wallet.id}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Bank details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {wallet.bank?.recipientCode ? (
              <>
                <div>
                  <div className="font-semibold text-gray-500">Account name</div>
                  <div className="mt-1 text-gray-900">{wallet.bank.accountName}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Bank</div>
                  <div className="mt-1 text-gray-900">{wallet.bank.bankName}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-500">Account number</div>
                  <div className="mt-1 text-gray-900">{wallet.bank.accountNumber}</div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Verified on Paystack</Badge>
              </>
            ) : (
              <div className="text-gray-600">No verified bank details saved.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-extrabold">Transaction history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {wallet.transactions.length === 0 ? (
            <div className="text-sm text-gray-600">No wallet transactions yet.</div>
          ) : (
            wallet.transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-4">
                <div className="min-w-0">
                  <div className="font-extrabold capitalize text-gray-900">
                    {String(tx.reason || tx.type || "transaction").replace(/_/g, " ")}
                  </div>
                  <div className="text-xs font-semibold text-gray-500">{formatAdminDate(tx.createdAt, true)}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-gray-900">{formatAdminMoney(tx.amount)}</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{tx.status || "recorded"}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

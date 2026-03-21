import Link from "next/link"
import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminDate, formatAdminMoney, getAdminIndexes, getUserSummary } from "@/lib/adminData"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

type TransactionRow = {
  id: string
  kind: "workspace_funding" | "wallet_transaction"
  amount: number
  status: string
  createdAt: any
  title: string
  subtitle: string
  href?: string
}

async function getTransactions() {
  const db = getAdminDb()
  const indexes = await getAdminIndexes()
  const [paymentsSnap, walletTxSnap, payoutRevenueSnap] = await Promise.all([
    db.collectionGroup("payments").get(),
    db.collectionGroup("transactions").get(),
    db.collection("payoutRevenue").get(),
  ])

  const rows: TransactionRow[] = []

  paymentsSnap.docs.forEach((doc: any) => {
    const data = doc.data() as any
    const workspaceRef = doc.ref.parent.parent
    const workspaceId = workspaceRef?.id || ""
    const workspace = workspaceId ? indexes.db.collection("workspaces").doc(workspaceId) : null
    rows.push({
      id: doc.id,
      kind: "workspace_funding",
      amount: Number(data.amount || 0),
      status: String(data.status || "recorded"),
      createdAt: data.paidAt || data.createdAt,
      title: "Workspace funding",
      subtitle: workspaceId ? `Workspace ${workspaceId}` : "Workspace payment",
      href: workspace ? `/admin/workspaces/${workspaceId}` : undefined,
    })
  })

  walletTxSnap.docs.forEach((doc: any) => {
    const data = doc.data() as any
    if (String(data.status || "").toLowerCase() === "initiated") return
    const walletRef = doc.ref.parent.parent
    const walletUid = walletRef?.id || ""
    const owner = getUserSummary(walletUid, indexes)

    rows.push({
      id: doc.id,
      kind: "wallet_transaction",
      amount: Number(data.amount || 0),
      status: String(data.status || "recorded"),
      createdAt: data.createdAt,
      title: String(data.reason || data.type || "wallet transaction").replace(/_/g, " "),
      subtitle: owner.name,
      href: walletUid ? `/admin/wallets/${walletUid}` : undefined,
    })
  })

  const totalVolume = paymentsSnap.docs.reduce((sum: number, doc: any) => {
    return sum + Number(doc.data().amount || 0)
  }, 0)
  const platformEarnings = payoutRevenueSnap.docs.reduce((sum: number, doc: any) => {
    return sum + Number(doc.data().amount || 0)
  }, 0)

  rows.sort((a: TransactionRow, b: TransactionRow) => {
    const aTime = a.createdAt?.toMillis?.() || 0
    const bTime = b.createdAt?.toMillis?.() || 0
    return bTime - aTime
  })

  return { rows, totalVolume, platformEarnings }
}

function statusBadge(status: string) {
  if (status === "funded" || status === "completed") {
    return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{status}</Badge>
  }
  if (status === "pending" || status === "requested") {
    return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">{status}</Badge>
  }
  return <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">{status}</Badge>
}

export default async function TransactionsPage() {
  const { rows, totalVolume, platformEarnings } = await getTransactions()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Payment operations"
        title="Review transactions"
        description="Track funding, wallet movement, payout releases, and the platform’s earned 10% fee from the same admin money flow view."
        stats={[
          { label: "Records", value: rows.length },
          { label: "Transaction volume", value: formatAdminMoney(totalVolume) },
          { label: "Platform earnings", value: formatAdminMoney(platformEarnings) },
          { label: "Provider", value: "Paystack" },
        ]}
      />

      <div className="space-y-4">
        {rows.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No transaction records found yet.</CardContent>
          </Card>
        ) : (
          rows.map((transaction) => (
            <Card key={`${transaction.kind}-${transaction.id}`} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold capitalize text-gray-900">{transaction.title}</h2>
                      {statusBadge(transaction.status)}
                    </div>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Amount</div>
                        <div className="mt-1 text-gray-900">{formatAdminMoney(transaction.amount)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Linked record</div>
                        <div className="mt-1 text-gray-900">{transaction.subtitle}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900">{formatAdminDate(transaction.createdAt, true)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Transaction ID</div>
                        <div className="mt-1 break-all text-gray-900">{transaction.id}</div>
                      </div>
                    </div>
                  </div>

                  {transaction.href ? (
                    <Link
                      href={transaction.href}
                      className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
                    >
                      View record
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

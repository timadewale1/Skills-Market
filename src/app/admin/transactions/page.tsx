import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
export const dynamic = "force-dynamic"

function money(n?: number) {
  return n ? `₦${Number(n).toLocaleString()}` : "₦0"
}

async function getTransactions() {
  const db = getAdminDb()
  const snap = await db.collection("transactions").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function TransactionsPage() {
  const transactions: any = await getTransactions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Transactions</h1>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No transactions
              </CardContent>
            </Card>
          ) : (
            transactions.map((t: any) => (
              <Card key={t.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                      {t.type}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 font-semibold">Amount</span>
                        <p className="text-gray-900">{money(t.amount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">User</span>
                        <p className="text-gray-900">{t.userId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Date</span>
                        <p className="text-gray-900">
                          {t.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">ID</span>
                        <p className="text-gray-900">{t.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">
                      Reverse
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
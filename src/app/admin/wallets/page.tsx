import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
export const dynamic = "force-dynamic"

function money(n?: number) {
  return n ? `₦${Number(n).toLocaleString()}` : "₦0"
}

async function getWallets() {
  const db = getAdminDb()
  const snap = await db.collection("wallets").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function WalletsPage() {
  const wallets: any = await getWallets()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Wallets</h1>
        <div className="space-y-4">
          {wallets.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">
                No wallets found
              </CardContent>
            </Card>
          ) : (
            wallets.map((w: any) => (
              <Card key={w.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">
                      {w.userId}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 font-semibold">Balance</span>
                        <p className="text-gray-900">{money(w.balance)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Escrow</span>
                        <p className="text-gray-900">{money(w.escrow)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">ID</span>
                        <p className="text-gray-900">{w.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Updated</span>
                        <p className="text-gray-900">
                          {w.updatedAt?.toDate?.().toLocaleDateString() || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition text-sm">
                      Freeze
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">
                      Refund
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
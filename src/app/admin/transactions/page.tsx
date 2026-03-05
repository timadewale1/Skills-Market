import { getAdminDb } from "@/lib/firebaseAdmin"
export const dynamic = "force-dynamic"

async function getTransactions() {
  const db = getAdminDb()
  const snap = await db.collection("transactions").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function TransactionsPage() {
  // TODO: Add proper auth middleware for admin routes
  const transactions: any = await getTransactions()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">ID</th>
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">User</th>
            <th className="p-2">Date</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t: any) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">{t.id}</td>
              <td className="p-2">{t.type}</td>
              <td className="p-2">₦{t.amount}</td>
              <td className="p-2">{t.userId}</td>
              <td className="p-2">{t.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</td>
              <td className="p-2">
                <button className="text-red-600 hover:underline">Reverse</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
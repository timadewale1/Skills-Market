import { getAdminDb } from "@/lib/firebaseAdmin"

async function getWallets() {
  const db = getAdminDb()
  const snap = await db.collection("wallets").get()
  return snap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export default async function WalletsPage() {
  // TODO: Add proper auth middleware for admin routes
  const wallets: any = await getWallets()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Wallets</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">User ID</th>
            <th className="p-2">Balance</th>
            <th className="p-2">Escrow</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((w: any) => (
            <tr key={w.id} className="border-t">
              <td className="p-2">{w.userId}</td>
              <td className="p-2">₦{w.balance || 0}</td>
              <td className="p-2">₦{w.escrow || 0}</td>
              <td className="p-2">
                <button className="text-blue-600 hover:underline">Freeze</button>
                <button className="text-red-600 hover:underline ml-2">Refund</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
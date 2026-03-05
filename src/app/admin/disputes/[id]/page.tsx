import { getAdminDb } from "@/lib/firebaseAdmin"

async function getDispute(id: string) {
  const db = getAdminDb()
  const doc = await db.collection("disputes").doc(id).get()
  return doc.exists ? { id: doc.id, ...doc.data() } : null
}

export default async function DisputeResolvePage({ params }: { params: { id: string } }) {
  // TODO: Add proper auth middleware for admin routes

  const dispute: any = await getDispute(params.id)

  if (!dispute) return <div>Dispute not found</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Resolve Dispute {params.id}</h1>
      <div className="space-y-4">
        <p><strong>Reason:</strong> {dispute.reason}</p>
        <p><strong>Status:</strong> {dispute.status}</p>
        <div className="flex gap-4">
          <button className="bg-green-600 text-white px-4 py-2">Approve Payout</button>
          <button className="bg-red-600 text-white px-4 py-2">Refund Client</button>
          <button className="bg-yellow-600 text-white px-4 py-2">Partial Settlement</button>
        </div>
      </div>
    </div>
  )
}
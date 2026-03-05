import { getAdminDb } from "@/lib/firebaseAdmin"

async function getProposals() {
  const db = getAdminDb()
  const gigsSnap = await db.collection("gigs").get()
  const proposals: any[] = []
  for (const gigDoc of gigsSnap.docs) {
    const proposalsSnap = await db.collection("gigs").doc(gigDoc.id).collection("proposals").get()
    proposalsSnap.docs.forEach((doc: any) => {
      proposals.push({
        id: doc.id,
        gigId: gigDoc.id,
        ...doc.data(),
      })
    })
  }
  return proposals
}

export default async function ProposalsPage() {
  // TODO: Add proper auth middleware for admin routes
  const proposals: any = await getProposals()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Proposals</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Gig ID</th>
            <th className="p-2">Talent</th>
            <th className="p-2">Status</th>
            <th className="p-2">Proposed Rate</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((p: any) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.gigId}</td>
              <td className="p-2">{p.talentUid}</td>
              <td className="p-2">{p.status}</td>
              <td className="p-2">{p.proposedRate ? `₦${p.proposedRate}/hr` : "N/A"}</td>
              <td className="p-2">
                <button className="text-blue-600 hover:underline">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
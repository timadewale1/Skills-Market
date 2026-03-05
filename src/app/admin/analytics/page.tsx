import { getAdminDb } from "@/lib/firebaseAdmin"

async function getAnalytics() {
  const db = getAdminDb()
  const usersSnap = await db.collection("users").get()
  const gigsSnap = await db.collection("gigs").get()
  const transactionsSnap = await db.collection("transactions").get()

  const totalRevenue = transactionsSnap.docs.reduce((sum: number, doc: any) => sum + (doc.data().amount || 0), 0)
  const activeGigs = gigsSnap.docs.filter((doc: any) => doc.data().status === "open").length
  const avgGigValue = gigsSnap.docs.reduce((sum: number, doc: any) => {
    const data = doc.data()
    return sum + (data.fixedBudget || data.hourlyRate || 0)
  }, 0) / gigsSnap.size || 0

  return {
    totalUsers: usersSnap.size,
    totalGigs: gigsSnap.size,
    activeGigs,
    totalRevenue,
    avgGigValue,
  }
}

export default async function AnalyticsPage() {
  // TODO: Add proper auth middleware for admin routes
  const analytics = await getAnalytics()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="border p-4">
          <h2 className="font-bold">Total Platform Revenue</h2>
          <p className="text-2xl">₦{analytics.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="border p-4">
          <h2 className="font-bold">Total Payouts</h2>
          <p className="text-2xl">₦{(analytics.totalRevenue * 0.9).toLocaleString()}</p> {/* Assuming 10% fee */}
        </div>
        <div className="border p-4">
          <h2 className="font-bold">Active Gigs</h2>
          <p className="text-2xl">{analytics.activeGigs}</p>
        </div>
        <div className="border p-4">
          <h2 className="font-bold">Average Gig Value</h2>
          <p className="text-2xl">₦{analytics.avgGigValue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
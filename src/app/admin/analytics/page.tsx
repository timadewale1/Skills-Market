import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
export const dynamic = "force-dynamic"

function money(n: number) {
  return `₦${n.toLocaleString()}`
}

async function getAnalytics() {
  try {
    const db = getAdminDb()
    const usersSnap = await db.collection("users").get()
    const gigsSnap = await db.collection("gigs").get()
    const transactionsSnap = await db.collection("transactions").get()

    const totalRevenue = transactionsSnap.docs.reduce(
      (sum: number, doc: any) => sum + (doc.data().amount || 0),
      0
    )
    const activeGigs = gigsSnap.docs.filter(
      (doc: any) => doc.data().status === "open"
    ).length
    const avgGigValue =
      gigsSnap.docs.reduce((sum: number, doc: any) => {
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
  } catch (err) {
    console.warn("Analytics unavailable during prerender", err)
    return {
      totalUsers: 0,
      totalGigs: 0,
      activeGigs: 0,
      totalRevenue: 0,
      avgGigValue: 0,
    }
  }
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Total Platform Revenue</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl">
              {money(analytics.totalRevenue)}
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Total Payouts</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl">
              {money(analytics.totalRevenue * 0.9)}
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Active Gigs</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl">
              {analytics.activeGigs}
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Average Gig Value</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl">
              {money(analytics.avgGigValue)}
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl">{analytics.totalUsers}</CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Total Gigs</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl">{analytics.totalGigs}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
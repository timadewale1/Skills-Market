import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { formatAdminMoney } from "@/lib/adminData"

export const dynamic = "force-dynamic"

async function getAnalytics() {
  const db = getAdminDb()
  const [usersSnap, gigsSnap, workspacesSnap, paymentsSnap, payoutRevenueSnap, walletTxSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("gigs").get(),
    db.collection("workspaces").get(),
    db.collectionGroup("payments").get(),
    db.collection("payoutRevenue").get(),
    db.collectionGroup("transactions").get(),
  ])

  const totalRevenue = payoutRevenueSnap.docs.reduce((sum: number, doc: any) => {
    return sum + Number(doc.data().amount || 0)
  }, 0)
  const transactionVolume = paymentsSnap.docs.reduce((sum: number, doc: any) => {
    return sum + Number(doc.data().amount || 0)
  }, 0)
  const actualPayouts = walletTxSnap.docs.reduce((sum: number, doc: any) => {
    const data = doc.data() as any
    return data.reason === "payout_release" ? sum + Number(data.amount || 0) : sum
  }, 0)
  const activeGigs = gigsSnap.docs.filter((doc: any) => doc.data().status === "open").length
  const avgGigValue =
    gigsSnap.docs.reduce((sum: number, doc: any) => {
      const data = doc.data()
      return sum + Number(data.fixedBudget || data.hourlyRate || 0)
    }, 0) / (gigsSnap.size || 1)

  return {
    totalUsers: usersSnap.size,
    totalGigs: gigsSnap.size,
    activeGigs,
    totalRevenue,
    transactionVolume,
    actualPayouts,
    avgGigValue: Math.round(avgGigValue),
    totalWorkspaces: workspacesSnap.size,
  }
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Platform analytics"
        description="Follow growth, gig flow, workspace activity, funded volume, actual payout releases, and platform earnings from the live marketplace records."
        stats={[
          { label: "Users", value: analytics.totalUsers },
          { label: "Gigs", value: analytics.totalGigs },
          { label: "Workspaces", value: analytics.totalWorkspaces },
          { label: "Revenue", value: formatAdminMoney(analytics.totalRevenue) },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Total platform revenue",
            value: formatAdminMoney(analytics.totalRevenue),
            hint: "Real 10% fees recorded in payout revenue",
          },
          {
            title: "Recorded transaction volume",
            value: formatAdminMoney(analytics.transactionVolume),
            hint: "Funded workspace payment volume",
          },
          {
            title: "Actual payouts",
            value: formatAdminMoney(analytics.actualPayouts),
            hint: "Released to talents after fees",
          },
          { title: "Active gigs", value: analytics.activeGigs, hint: "Currently open opportunities" },
          { title: "Average gig value", value: formatAdminMoney(analytics.avgGigValue), hint: "Based on posted gig budgets" },
          { title: "Total users", value: analytics.totalUsers, hint: "Accounts across the platform" },
        ].map((item) => (
          <Card key={item.title} className="rounded-[1.75rem] border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-extrabold">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-gray-900">{item.value}</div>
              <p className="mt-2 text-sm text-gray-600">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

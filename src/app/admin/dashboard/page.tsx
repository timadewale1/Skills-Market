import { getAdminDb } from "@/lib/firebaseAdmin"
export const dynamic = "force-dynamic"

async function getStats() {
  const db = getAdminDb()
  const usersSnap = await db.collection("users").get()
  const talentsSnap = await db.collection("users").where("role", "==", "talent").get()
  const clientsSnap = await db.collection("users").where("role", "==", "client").get()
  const gigsSnap = await db.collection("gigs").get()
  const proposalsSnap = await db.collection("gigs").select("proposals").get() // Approximate
  const workspacesSnap = await db.collection("workspaces").get()
  const disputesSnap = await db.collection("disputes").get()
  const reviewsSnap = await db.collection("reviews").get()
  const messagesSnap = await db.collection("threads").get()
  const notificationsSnap = await db.collection("notifications").get()
  const walletsSnap = await db.collection("wallets").get()
  const transactionsSnap = await db.collection("transactions").get()

  // Calculate revenue, etc.
  const transactions = transactionsSnap.docs.map((doc: any) => doc.data())
  const totalRevenue = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  const activeGigs = gigsSnap.docs.filter((doc: any) => doc.data().status === "open").length
  const activeWorkspaces = workspacesSnap.docs.filter((doc: any) => doc.data().status === "active").length

  return {
    totalUsers: usersSnap.size,
    totalTalents: talentsSnap.size,
    totalClients: clientsSnap.size,
    totalGigs: gigsSnap.size,
    totalProposals: proposalsSnap.size, // Placeholder
    totalWorkspaces: workspacesSnap.size,
    totalDisputes: disputesSnap.size,
    totalReviews: reviewsSnap.size,
    totalMessages: messagesSnap.size,
    totalNotifications: notificationsSnap.size,
    totalWallets: walletsSnap.size,
    totalTransactions: transactionsSnap.size,
    totalRevenue,
    activeGigs,
    activeWorkspaces,
  }
}

export default async function AdminDashboard() {
  // TODO: Add proper auth middleware for admin routes
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-4 gap-6">
        <Stat title="Total Users" value={stats.totalUsers} />
        <Stat title="Talents" value={stats.totalTalents} />
        <Stat title="Clients" value={stats.totalClients} />
        <Stat title="Gigs" value={stats.totalGigs} />
        <Stat title="Active Gigs" value={stats.activeGigs} />
        <Stat title="Proposals" value={stats.totalProposals} />
        <Stat title="Workspaces" value={stats.totalWorkspaces} />
        <Stat title="Active Workspaces" value={stats.activeWorkspaces} />
        <Stat title="Disputes" value={stats.totalDisputes} />
        <Stat title="Reviews" value={stats.totalReviews} />
        <Stat title="Messages" value={stats.totalMessages} />
        <Stat title="Notifications" value={stats.totalNotifications} />
        <Stat title="Wallets" value={stats.totalWallets} />
        <Stat title="Transactions" value={stats.totalTransactions} />
        <Stat title="Total Revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} />
      </div>
    </div>
  )
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="border rounded p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
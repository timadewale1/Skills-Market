import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
import AdminPageHeader from "@/components/control/AdminPageHeader"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

type UsersPageProps = {
  searchParams?: Promise<{
    role?: string
    onboarding?: string
    state?: string
    q?: string
    page?: string
  }>
}

const PAGE_SIZE = 10

const roleFilters = [
  { key: "all", label: "All roles" },
  { key: "talent", label: "Talents" },
  { key: "client", label: "Clients" },
  { key: "admin", label: "Admins" },
]

const onboardingFilters = [
  { key: "all", label: "All onboarding" },
  { key: "complete", label: "Complete" },
  { key: "pending", label: "Pending" },
]

const stateFilters = [
  { key: "all", label: "All states" },
  { key: "active", label: "Active" },
  { key: "disabled", label: "Disabled" },
]

function formatDate(value: any) {
  return value?.toDate?.().toLocaleDateString("en-NG") || "N/A"
}

function buildHref(nextRole: string, userId: string) {
  if (nextRole === "talent") return `/control/talents/${userId}`
  if (nextRole === "client") return `/control/clients/${userId}`
  return "/control/users"
}

function actionLabel(nextRole: string) {
  if (nextRole === "talent") return "View talent"
  if (nextRole === "client") return "View client"
  return "View admin"
}

function filterHref(
  role: string,
  onboarding: string,
  state: string,
  q: string,
  next: Partial<Record<string, string>>
) {
  const params = new URLSearchParams()
  const finalRole = next.role ?? role
  const finalOnboarding = next.onboarding ?? onboarding
  const finalState = next.state ?? state
  const finalQ = next.q ?? q
  const finalPage = next.page

  if (finalRole && finalRole !== "all") params.set("role", finalRole)
  if (finalOnboarding && finalOnboarding !== "all") params.set("onboarding", finalOnboarding)
  if (finalState && finalState !== "all") params.set("state", finalState)
  if (finalQ) params.set("q", finalQ)
  if (finalPage && finalPage !== "1") params.set("page", finalPage)

  const query = params.toString()
  return query ? `/control/users?${query}` : "/control/users"
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = (await searchParams) || {}
  const role = resolvedSearchParams.role || "all"
  const onboarding = resolvedSearchParams.onboarding || "all"
  const state = resolvedSearchParams.state || "all"
  const q = String(resolvedSearchParams.q || "").trim().toLowerCase()
  const page = Math.max(1, Number(resolvedSearchParams.page || 1))

  const db = getAdminDb()
  let usersQuery: any = db.collection("users").orderBy("createdAt", "desc")

  if (role !== "all") {
    usersQuery = usersQuery.where("role", "==", role)
  }
  if (onboarding === "complete") {
    usersQuery = usersQuery.where("onboardingComplete", "==", true)
  }
  if (onboarding === "pending") {
    usersQuery = usersQuery.where("onboardingComplete", "==", false)
  }
  if (state === "active") {
    usersQuery = usersQuery.where("disabled", "==", false)
  }
  if (state === "disabled") {
    usersQuery = usersQuery.where("disabled", "==", true)
  }

  const allUsersSnap = await usersQuery.get()
  const users: any[] = allUsersSnap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }))

  const filteredUsers = users.filter((user: any) => {
    if (!q) return true
    const searchText = [
      user.fullName,
      user.name,
      user.email,
      user.role,
      String(user.businessName || ""),
      String(user.clientOrgName || ""),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return searchText.includes(q)
  })

  const totalUsers = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const adminCount = Number(
    (await db.collection("users").where("role", "==", "admin").count().get()).data().count || 0
  )
  const talentCount = Number(
    (await db.collection("users").where("role", "==", "talent").count().get()).data().count || 0
  )
  const clientCount = Number(
    (await db.collection("users").where("role", "==", "client").count().get()).data().count || 0
  )

  return (
    <div className="control-records-page space-y-6">
      <AdminPageHeader
        eyebrow="User operations"
        title="Manage users"
        description="Review who is on the platform, filter by state, and jump directly into the relevant admin profile flow for talent and clients."
        stats={[
          { label: "Total users", value: totalUsers },
          { label: "Talent", value: talentCount },
          { label: "Clients", value: clientCount },
          { label: "Admins", value: adminCount },
        ]}
      />

      <Card className="rounded-[1.75rem] border-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6">
          <form action="/control/users" className="flex flex-col gap-3 lg:flex-row">
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="onboarding" value={onboarding} />
            <input type="hidden" name="state" value={state} />
            <input
              name="q"
              defaultValue={resolvedSearchParams.q || ""}
              placeholder="Search by name or email"
              className="w-full rounded-full border px-4 py-2 text-sm"
            />
            <button className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white">Search</button>
          </form>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Role filter</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {roleFilters.map((item) => {
                const active = role === item.key
                return (
                  <Link
                    key={item.key}
                    href={filterHref(role, onboarding, state, q, { role: item.key, page: "1" })}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "border-orange-500 bg-orange-50 text-[var(--primary)]"
                        : "text-gray-700 hover:border-orange-200 hover:bg-orange-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Onboarding filter</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {onboardingFilters.map((item) => {
                const active = onboarding === item.key
                return (
                  <Link
                    key={item.key}
                    href={filterHref(role, onboarding, state, q, { onboarding: item.key, page: "1" })}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "border-orange-500 bg-orange-50 text-[var(--primary)]"
                        : "text-gray-700 hover:border-orange-200 hover:bg-orange-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Account state</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {stateFilters.map((item) => {
                const active = state === item.key
                return (
                  <Link
                    key={item.key}
                    href={filterHref(role, onboarding, state, q, { state: item.key, page: "1" })}
                    className={[
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "border-orange-500 bg-orange-50 text-[var(--primary)]"
                        : "text-gray-700 hover:border-orange-200 hover:bg-orange-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {visibleUsers.length === 0 ? (
          <Card className="rounded-[1.75rem] border-0 shadow-sm">
            <CardContent className="p-10 text-center text-gray-600">No users match the current filters.</CardContent>
          </Card>
        ) : (
          visibleUsers.map((user) => (
            <Card key={user.id} className="rounded-[1.75rem] border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-extrabold text-gray-900">
                        {user.fullName || user.name || user.email}
                      </h2>
                      <Badge className="bg-orange-50 text-[var(--primary)] hover:bg-orange-50">
                        {user.role || "unknown"}
                      </Badge>
                      {user.disabled ? (
                        <Badge className="bg-red-50 text-red-700 hover:bg-red-50">disabled</Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">active</Badge>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <div className="font-semibold text-gray-500">Email</div>
                        <div className="mt-1 text-gray-900">{user.email || "N/A"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900">{formatDate(user.createdAt)}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Onboarding</div>
                        <div className="mt-1 text-gray-900">{user.onboardingComplete ? "Complete" : "Pending"}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-500">Profile destination</div>
                        <div className="mt-1 text-gray-900">{actionLabel(String(user.role || ""))}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={buildHref(String(user.role || ""), user.id)}
                      className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
                    >
                      {actionLabel(String(user.role || ""))}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Link
            href={filterHref(role, onboarding, state, q, { page: String(Math.max(1, safePage - 1)) })}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Previous
          </Link>
          <div className="text-sm font-semibold text-gray-600">
            Page {safePage} of {totalPages}
          </div>
          <Link
            href={filterHref(role, onboarding, state, q, { page: String(Math.min(totalPages, safePage + 1)) })}
            className="rounded-full border px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  )
}

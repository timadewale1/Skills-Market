import Link from "next/link"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { Card, CardContent } from "@/components/ui/card"
export const dynamic = "force-dynamic"

async function getThreads() {
  const db = getAdminDb()
  const snap = await db.collection("threads").get()
  return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
}

export default async function MessagesPage() {
  const threads: any = await getThreads()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Messages / Threads</h1>
        <div className="space-y-4">
          {threads.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-8 text-center text-gray-600">No threads found</CardContent>
            </Card>
          ) : (
            threads.map((t: any) => (
              <Card key={t.id} className="rounded-xl hover:shadow-md transition">
                <CardContent className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">Thread {t.id}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 font-semibold">Client</span>
                        <p className="text-gray-900">{t.clientName || t.clientUid}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Talent</span>
                        <p className="text-gray-900">{t.talentName || t.talentUid}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Gig</span>
                        <p className="text-gray-900">{t.gigTitle || t.gigId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold">Created</span>
                        <p className="text-gray-900">{t.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/messages/${t.id}`} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition">
                      View
                    </Link>
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
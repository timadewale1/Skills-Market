export const dynamic = "force-dynamic"

import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"
import AdminSettingsForm from "@/components/admin/AdminSettingsForm"
import { getAdminDb } from "@/lib/firebaseAdmin"

async function getSettings() {
  const db = getAdminDb()
  const snap = await db.collection("adminSettings").doc("platform").get()
  const data = snap.exists ? (snap.data() as any) : {}
  return {
    platformFeePercent: Number(data.platformFeePercent ?? 10),
    commercialNote: String(
      data.commercialNote || "Default commercial configuration for admin review."
    ),
    templateNotes: String(data.templateNotes || "Default email template..."),
  }
}

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Admin settings"
        title="Platform settings"
        description="Keep the operational defaults visible in one place and persist admin-owned commercial and template settings."
        stats={[
          { label: "Platform fee", value: `${settings.platformFeePercent}%` },
          { label: "Email templates", value: "Default" },
          { label: "Mode", value: "Live" },
          { label: "Scope", value: "Admin only" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-extrabold text-gray-900">Commercial settings</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              These values represent the current operating defaults visible in the product.
            </p>

            <AdminSettingsForm
              initialPlatformFee={settings.platformFeePercent}
              initialCommercialNote={settings.commercialNote}
              initialTemplateNotes={settings.templateNotes}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-extrabold text-gray-900">What this controls</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              This admin settings view now stores platform-level defaults for the operations team. It currently captures the fee percentage, internal commercial notes, and template notes used to guide admin-owned communication.
            </p>

            <div className="mt-6 space-y-4 text-sm leading-7 text-gray-700">
              <div className="rounded-2xl border bg-[var(--secondary)] p-4">
                <div className="font-semibold text-gray-900">Commercial defaults</div>
                <div className="mt-2">
                  Used as the admin-side source of truth for the platform fee and related internal notes.
                </div>
              </div>
              <div className="rounded-2xl border bg-[var(--secondary)] p-4">
                <div className="font-semibold text-gray-900">Template guidance</div>
                <div className="mt-2">
                  Gives the ops team one saved place to keep messaging and communication notes until a larger template-management system is introduced.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

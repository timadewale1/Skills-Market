export const dynamic = "force-dynamic"

import AdminPageHeader from "@/components/admin/AdminPageHeader"
import { Card, CardContent } from "@/components/ui/card"

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Admin settings"
        title="Platform settings"
        description="Keep the operational defaults visible in one place while the deeper admin configuration flows continue to mature."
        stats={[
          { label: "Platform fee", value: "10%" },
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

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Platform fee (%)
                </label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full rounded-2xl border px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Internal note
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm"
                  defaultValue="Default commercial configuration for admin review."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-extrabold text-gray-900">Comms and templates</h2>
            <p className="mt-2 text-sm leading-7 text-gray-600">
              Admin-owned operational messaging can be reviewed here before a deeper template system is introduced.
            </p>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email template notes
              </label>
              <textarea
                className="min-h-[190px] w-full rounded-2xl border px-4 py-3 text-sm"
                defaultValue="Default email template..."
              />
            </div>

            <button className="mt-5 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90">
              Save settings
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

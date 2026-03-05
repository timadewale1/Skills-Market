export default async function SettingsPage() {
  // TODO: Add proper auth middleware for admin routes

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-4">
        <div>
          <label className="block font-bold">Platform Fee (%)</label>
          <input type="number" defaultValue="10" className="border p-2" />
        </div>
        <div>
          <label className="block font-bold">Email Templates</label>
          <textarea className="border p-2 w-full" rows={4} defaultValue="Default email template..." />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2">Save Settings</button>
      </div>
    </div>
  )
}
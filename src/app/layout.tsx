import "./globals.css"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { AuthProvider } from "@/context/AuthContext"
import { SearchProvider } from "@/context/SearchContext"
import { Toaster } from "react-hot-toast"
import PWARegistrar from "@/components/pwa/PWARegistrar"
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "changeworker",
  description: "Upwork for changemakers",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "changeworker",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#f97316",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} min-h-screen bg-white text-gray-900`}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: "14px",
            },
          }}
        />
        <AuthProvider>
          <SearchProvider>
            <PWARegistrar />
            <PWAInstallPrompt />
            <div className="min-h-screen flex flex-col">
              <header className="border-b" style={{ borderColor: "var(--border)" }} />
              <main className="flex-1 overflow-x-hidden bg-[var(--secondary)]">{children}</main>
            </div>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

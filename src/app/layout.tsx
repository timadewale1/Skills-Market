import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { Toaster } from "react-hot-toast"
import NavbarWrapper from "@/components/layout/NavbarWrapper"
import { Plus_Jakarta_Sans } from "next/font/google"
import { SearchProvider } from "@/context/SearchContext"


const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata = {
  title: "Skills Marketplace",
  description: "Upwork for Changemakers",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} bg-white text-gray-900 min-h-screen`}>
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
            <div className="min-h-screen flex flex-col">
              {/* HEADER */}
              <header className="border-b" style={{ borderColor: "var(--border)" }}>
                {/* <NavbarWrapper /> */}
              </header>

              {/* MAIN */}
              <main className="flex-1 bg-[var(--secondary)] overflow-x-hidden">
                {children}
              </main>

              {/* FOOTER */}
              {/* <footer className="border-t" style={{ borderColor: "var(--border)" }}>
                <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-600">
                  © {new Date().getFullYear()} Skills Marketplace
                </div>
              </footer> */}
            </div>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

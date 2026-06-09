import { AuthProvider } from '@/context/Authcontext'
import { Sidebar, Footer } from '@/components/Sidebar'
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a1628] text-white flex flex-col min-h-screen">
        <AuthProvider>
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
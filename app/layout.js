import "./globals.css"
import { Providers } from "./providers"
import { Navbar } from "./components/navbar"

export const metadata = {
  title: "Mentora",
  description: "Mentor-based learning platform",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <Providers>
          {/* Global Navbar */}
          <Navbar />

          {/* Main content with padding top to avoid overlap with fixed navbar */}
          {/* Navbar is 72px main + 12px trending = 84px, using pt-24 (96px) for safe spacing */}
          <main className="pt-24">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

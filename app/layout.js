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
          <main className="pt-20">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

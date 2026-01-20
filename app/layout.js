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
       
          <Navbar />

         
          <main className="pt-24">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

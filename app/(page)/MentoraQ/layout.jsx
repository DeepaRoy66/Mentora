import "../../globals.css"

export const metadata = {
  title: "Q&A Platform",
  description: "A minimal Q&A and discussion platform",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  )
}

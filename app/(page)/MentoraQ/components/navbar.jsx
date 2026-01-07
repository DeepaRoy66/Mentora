import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/MentoraQ">
          <h1 className="text-2xl font-bold text-blue-600">Q&A Platform</h1>
        </Link>
        <div className="flex gap-6">
          <Link href="/MentoraQ" className="text-gray-700 hover:text-blue-600">
            Home
          </Link>
          <Link href="/MentoraQ/ask" className="text-gray-700 hover:text-blue-600">
            Ask Question
          </Link>
        </div>
      </div>
    </nav>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../components/ui/button"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function LandingPage() {
  // Pagination
  const ITEMS_PER_PAGE = 20
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/uploads?category=All")
      .then(res => res.json())
      .then(result => {
        setData(result.uploads || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Fetch Error:", err)
        setLoading(false)
      })
  }, [])

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPDFs = data.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-[#F5F7FA] relative font-sans text-[#002C5F]">

      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-100/60 blur-3xl -z-10" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-yellow-100/40 blur-3xl -z-10" />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-blue-50/50 blur-3xl -z-10" />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 relative z-10">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 text-[#0078B4] font-medium mb-2">
            <Sparkles size={18} />
            Let’s get studying
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight">
            Recent Documents
          </h1>

          <p className="text-lg text-gray-600 mt-3 max-w-xl">
            Explore high-quality study PDFs shared by students and educators.
          </p>
        </div>

        {/* PDF Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl bg-white p-8 border border-gray-200 shadow-sm"
        >
          {loading ? (
            <div className="text-center py-10">Loading community uploads...</div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentPDFs.map(item => (
                  <Link key={item._id} href={`/all-uplod/${item._id}`}>
                    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition flex flex-col h-full">
                      {/* Top */}
                      <div className="flex justify-between items-start mb-2 text-xs text-gray-500">
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                          {item.category}
                        </span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Title & description */}
                      <h3 className="text-base font-semibold text-gray-800 line-clamp-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {item.description || "No description provided."}
                      </p>

                      {/* Uploader Section */}
                      <div className="mt-auto pt-4 flex items-center gap-2 border-t border-gray-100">
                        {/* 1. Check if uploaderImage exists */}
                        {item.uploaderImage ? (
                           <img 
                             src={item.uploaderImage} 
                             alt="Uploader" 
                             className="w-6 h-6 rounded-full object-cover border border-gray-200"
                           />
                        ) : (
                           // 2. Fallback if no image
                           <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                             {item.uploaderEmail ? item.uploaderEmail[0].toUpperCase() : "U"}
                           </div>
                        )}
                        
                        <div className="text-xs text-gray-400">
                           <span className="text-gray-600 font-medium">
                             {item.uploaderEmail ? item.uploaderEmail.split("@")[0] : "Anonymous"}
                           </span>
                        </div>
                      </div>

                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2rem] overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-r from-[#002C5F]/95 to-[#0078B4]/90" />
          </div>

          <div className="relative z-10 px-10 py-24 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Learn <span className="text-yellow-300">smarter</span>, not harder
            </h2>

            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Upload PDFs, generate quizzes, and master topics faster using AI-powered tools.
            </p>

            <Button
              size="lg"
              className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-12 py-7 text-lg rounded-full font-bold shadow-lg"
            >
              Join Now — It’s Free
            </Button>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="bg-white/70 backdrop-blur border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gradient-to-br from-[#0078B4] to-[#002C5F] rounded-xl flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="text-xl font-bold tracking-tight">
              MENTORA
            </span>
          </div>

          <div className="flex gap-8 text-sm font-medium text-[#002C5F]/80">
            <Link href="#">About</Link>
            <Link href="#">Contact</Link>
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
          </div>

          <div className="text-sm text-[#002C5F]/60">
            © 2025 Mentora Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
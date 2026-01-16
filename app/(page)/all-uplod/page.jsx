"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function PublicUploadsList() {
  const ITEMS_PER_PAGE = 20; // 20 PDFs per page
  const [data, setData] = useState([])        // All fetched PDFs
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)        // Current page

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

  if (loading) {
    return <div className="text-center py-10">Loading community uploads...</div>
  }

  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPDFs = data.slice(startIndex, endIndex)

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10">

      <h2 className="text-3xl font-bold mb-8 text-center text-[#002C5F]">
        Explore Community Notes
      </h2>

      {/* PDF Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentPDFs.map(item => (
          <Link key={item._id} href={`/all-uplod/${item._id}`}>
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col h-full">
              
              {/* Top badges */}
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                  {item.category}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Title and description */}
              <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {item.description || "No description provided."}
              </p>

              {/* Uploader */}
              <div className="mt-auto pt-4 text-xs text-gray-400">
                Uploaded by: <span className="text-gray-600">{item.uploaderEmail.split("@")[0]}</span>
              </div>

            </div>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
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
    </div>
  )
}

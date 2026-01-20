"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // To read ?q=...
import Link from "next/link";
import Loading from "@/app/components/loading";
import { FileX, Search } from "lucide-react";

export default function SearchResultsPage() {
  const ITEMS_PER_PAGE = 20;
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // Get the search term from URL

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!query) return;
    
    setLoading(true);
    // Call the search endpoint we created in the backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(result => {
        setData(result.results || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  }, [query]); // Re-fetch whenever the query changes

  if (loading) {
    return <Loading />;
  }

  // Calculate pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPDFs = data.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10 pt-20">
      
      {/* Search Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 text-[#002C5F]">
          Search Results 
        </h1>
        <p className="text-gray-500">
          Found {data.length} {data.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      {/* Empty State */}
      {!loading && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileX className="h-20 w-20 mb-4 opacity-50" />
          <p className="text-lg">No PDFs found matching "{query}"</p>
          <p className="text-sm">Try checking your spelling or using different keywords.</p>
        </div>
      )}

      {/* PDF Grid - Exact same style as PublicUploadsList */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentPDFs.map(item => (
          // Link goes to the detail page with the ID, exactly as you requested
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
  );
}
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Loading from "@/app/components/loading";
import { FileX } from "lucide-react";

export default function SearchResultsClient() {
  const ITEMS_PER_PAGE = 20;
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}`
    )
      .then(res => res.json())
      .then(result => {
        setData(result.results || []);
        setPage(1);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  }, [query]);

  if (loading) return <Loading />;

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentPDFs = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10 pt-20">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[#002C5F]">Search Results</h1>
        <p className="text-gray-500">
          Found {data.length} {data.length === 1 ? "note" : "notes"}
        </p>
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <FileX className="h-20 w-20 mb-4 opacity-50" />
          <p>No PDFs found matching "{query}"</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentPDFs.map(item => (
          <Link key={item._id} href={`/all-uplod/${item._id}`}>
            <div className="bg-white border p-6 rounded-2xl hover:shadow-md transition h-full">
              <div className="flex justify-between mb-2">
                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
                  {item.category}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-bold line-clamp-1">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {item.description || "No description provided."}
              </p>

              <div className="mt-auto pt-4 text-xs text-gray-400">
                Uploaded by{" "}
                <span className="text-gray-600">
                  {item.uploaderEmail.split("@")[0]}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-10">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

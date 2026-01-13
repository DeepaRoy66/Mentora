
"use client";

import { useState } from "react";
import Link from "next/link";

export default function PdfFetch({ uploads: initialUploads, currentPage: initialPage, totalPages: initialTotalPages, categories }) {
  const [uploads, setUploads] = useState(initialUploads);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchUploads = async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        search,
        category,
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads?${query.toString()}`);
      const data = await res.json();

      setUploads(data.uploads || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Uploads</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by title or tags..."
          className="flex-1 p-2 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="p-2 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => fetchUploads(1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Search
        </button>
      </div>

      {/* Upload List */}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {uploads.length === 0 && <div>No uploads found.</div>}
          {uploads.map((upload) => (
            <Link key={upload._id} href={`/pdfetch/detail/${upload._id}`}>
              <a className="block p-4 bg-white shadow rounded hover:bg-indigo-50 transition">
                <h2 className="font-semibold">{upload.title}</h2>
                <p className="text-gray-500 text-sm">
                  {upload.description?.slice(0, 100) || "No description"}
                </p>
              </a>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => fetchUploads(i + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-white"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

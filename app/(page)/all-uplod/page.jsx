"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PublicUploadsList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // PUBLIC FETCH: No Headers sent -> Returns ALL uploads
    fetch("http://127.0.0.1:8000/api/uploads?category=All&page=1")
      .then(res => res.json())
      .then(result => {
        setData(result.uploads || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-10">Loading community uploads...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h2 className="text-3xl font-bold mb-8 text-center text-[#002C5F]">Explore Community Notes</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map(item => (
          <Link key={item._id} href={`/all-uplod/${item._id}`}>
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer h-full flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                   <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">{item.category}</span>
                   <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description || "No description provided."}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
                Uploaded by: <span className="text-gray-600">{item.uploaderEmail.split('@')[0]}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
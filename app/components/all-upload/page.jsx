"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function UploadsPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/fetch")
      .then(res => res.json())
      .then(result => setData(result.data || []));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-5">
      <h1 className="text-2xl font-bold mb-5">Uploaded PDFs</h1>

      {data.map(item => (
        <Link key={item._id} href={`/all-uplod/${item._id}`}>
          <div className="border p-4 rounded mb-4 hover:bg-gray-100 cursor-pointer">
            <h2 className="text-lg font-semibold">
              {item.title}
            </h2>

            <p className="text-sm text-gray-600">
              {item.description || "No description"}
            </p>

            <p className="text-xs mt-2">
              👤 {item.uploaderEmail}
            </p>

            <p className="text-xs">
              📅 {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

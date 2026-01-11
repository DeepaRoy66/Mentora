"use client";

import { useEffect, useState } from "react";

export default function SingleUpload({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/upload/${id}`)
      .then(res => res.json())
      .then(result => setData(result.data));
  }, [id]);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-5">

      <h1 className="text-2xl font-bold">
        {data.title}
      </h1>

      <p className="text-gray-600 mt-2">
        {data.description}
      </p>

      <p className="text-sm mt-3">
        Uploaded by: <b>{data.uploaderEmail}</b>
      </p>

      <p className="text-sm">
        Date: {new Date(data.createdAt).toLocaleString()}
      </p>

      <hr className="my-5" />

      <iframe
        src={data.pdfUrl}
        className="w-full h-[600px] border"
      />
    </div>
  );
}

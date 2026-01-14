import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getUpload(id) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/uploads/${id}`, {
       cache: 'no-store' 
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function SingleUploadPage({ params }) {
  const item = await getUpload(params.id);

  if (!item) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-800">Document not found</h1>
            <Link href="/" className="mt-4 text-blue-600 hover:underline">Go Home</Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/" className="inline-flex items-center text-gray-500 hover:text-black mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h1 className="text-3xl font-black text-gray-900">{item.title}</h1>
          <div className="flex gap-4 text-sm text-gray-500 mt-3 border-t pt-3">
            <span>By: {item.uploaderEmail}</span>
            <span>Category: {item.category}</span>
          </div>
          {item.description && <p className="mt-4 text-gray-700">{item.description}</p>}
        </div>

        <div className="h-[85vh] bg-white rounded-2xl shadow-lg border overflow-hidden">
          <iframe src={item.pdfUrl} className="w-full h-full" title={item.title} />
        </div>
      </div>
    </div>
  );
}
// pages/uploads/[id].js
import { useRouter } from "next/router";

export default function UploadDetail({ upload }) {
  const router = useRouter();

  if (!upload) {
    return <div className="text-center mt-20">Upload not found.</div>;
  }

  return (
    <div className="min-h-screen p-10 bg-gray-100 flex justify-center">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-3">{upload.title}</h1>
        <p className="text-gray-700 mb-3">{upload.description || "No description"}</p>
        <p className="text-gray-500 mb-3">
          <strong>Category:</strong> {upload.category}
        </p>
        <p className="text-gray-500 mb-3">
          <strong>Tags:</strong> {upload.tags?.join(", ") || "None"}
        </p>
        <p className="text-gray-500 mb-5">
          <strong>Uploader:</strong> {upload.uploaderEmail}
        </p>
        <a
          href={upload.pdfUrl}
          target="_blank"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          View PDF
        </a>
      </div>
    </div>
  );
}

// Fetch single upload by id (SSR)
export async function getServerSideProps({ params }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/${params.id}`);
    if (!res.ok) return { props: { upload: null } };
    const upload = await res.json();
    return { props: { upload } };
  } catch (err) {
    return { props: { upload: null } };
  }
}

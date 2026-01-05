import UploadPdfSection from "../components/upload/UploadPdfSection";
import UploadFetchList from "../components/upload/UploadFetchList";

async function getData() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const [upRes, catRes] = await Promise.all([
    fetch(`${baseUrl}/api/uploads`, { cache: 'no-store' }),
    fetch(`${baseUrl}/api/categories`, { cache: 'no-store' })
  ]);
  
  return {
    uploads: await upRes.json(),
    categories: await catRes.json()
  };
}

export default async function UploadPage() {
  const { uploads, categories } = await getData();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12">
      <UploadPdfSection categories={categories} />
      <div className="h-[1px] bg-gray-200 w-full" />
      <UploadFetchList initialUploads={uploads} categories={categories} />
    </div>
  );
}
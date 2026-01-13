import PdfFetch from "../components/pdfetch/pdfFetch";

// Server-side fetch
export default async function PdfFetchPage() {
  try {
    const page = 1;
    const category = "All";
    const search = "";

    // Fetch uploads
    const query = new URLSearchParams({ page, category, search });
    const resUploads = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads?${query.toString()}`, {
      cache: 'no-store',
    });

    const uploadsData = await resUploads.json();

    const uploads = Array.isArray(uploadsData.uploads) ? uploadsData.uploads : [];
    const currentPage = uploadsData.currentPage || 1;
    const totalPages = uploadsData.totalPages || 1;

    // Fetch categories
    const resCat = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { cache: 'no-store' });
    const categoriesData = await resCat.json();

    // Ensure categories is always an array
    const categories = Array.isArray(categoriesData) ? categoriesData : [];

    return (
      <div className="min-h-screen p-10 bg-gray-100">
        <PdfFetch
          uploads={uploads}
          currentPage={currentPage}
          totalPages={totalPages}
          categories={categories}
        />
      </div>
    );
  } catch (err) {
    console.error(err);
    return <div className="text-center text-red-500 mt-20">Failed to load data.</div>;
  }
}

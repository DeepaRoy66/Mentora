import UploadContent from "../components/upload/UploadContent";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/lib/authoptions";

async function getData() {
  const session = await getServerSession(authOptions);
  
  const defaultData = { uploads: [], currentPage: 1, totalPages: 1, categories: [] };

  // If user not logged in, return empty (UI will handle redirect if needed)
  if (!session || !session.user) return defaultData;

  const pythonUrl = "http://127.0.0.1:8000"; 
  const nextUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    const [upRes, catRes] = await Promise.all([
      // ✅ FIX: Using /api/my-uploads to get ONLY this user's files
      fetch(`${pythonUrl}/api/my-uploads?page=1&category=All`, { 
        cache: 'no-store',
        headers: { "x-user-email": session.user.email } 
      }),
      fetch(`${nextUrl}/api/categories`, { cache: 'no-store' }).catch(() => ({ ok: false }))
    ]);
    
    let upData = { uploads: [], currentPage: 1, totalPages: 1 };
    let catData = [];

    if (upRes.ok) upData = await upRes.json();
    if (catRes && catRes.ok) catData = await catRes.json();

    return { 
      uploads: upData.uploads || [],
      currentPage: upData.currentPage || 1,
      totalPages: upData.totalPages || 1,
      categories: catData
    };

  } catch (error) {
    console.error("Fetch Error:", error.message);
    return defaultData;
  }
}

export default async function UploadPage() {
  const data = await getData();
  return (
    <div className="relative top-40 pb-20">
        <UploadContent {...data} />
    </div>
  );
}
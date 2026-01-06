import UploadContent from "../components/upload/UploadContent";
import { cookies } from "next/headers"; // Required for Server Auth

async function getData() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const cookieStore = cookies();
  
  // Fetch BOTH on Server Side passing cookies
  const [upRes, catRes] = await Promise.all([
    fetch(`${baseUrl}/api/uploads?page=1&search=&category=All`, { 
      cache: 'no-store',
      // Pass cookies to authenticate the request (Fixes 401)
      headers: { Cookie: cookieStore.toString() } 
    }),
    fetch(`${baseUrl}/api/categories`, { cache: 'no-store' })
  ]);
  
  const upData = await upRes.json();
  const catData = await catRes.json();

  return { 
    uploads: upData.uploads || [],
    currentPage: upData.currentPage || 1,
    totalPages: upData.totalPages || 1,
    categories: catData
  };
}

export default async function UploadPage() {
  const data = await getData();
  return(<div className="relative top-40">
    <UploadContent {...data} />
    </div>)
}
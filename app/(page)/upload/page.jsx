import UploadContent from "../components/upload/UploadContent";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/lib/authoptions";

// Helper function to fetch data safely
async function getData() {
  const session = await getServerSession(authOptions);
  
  // Default empty state
  const defaultData = { 
    uploads: [], 
    currentPage: 1, 
    totalPages: 1, 
    categories: [] 
  };

  // 1. If user is not logged in, stop here.
  if (!session || !session.user) {
      return defaultData;
  }

  // FIX: Use 127.0.0.1 instead of localhost to prevent Node.js fetch errors
  const pythonUrl = "http://127.0.0.1:8000"; 
  const nextUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    // 2. Fetch Data in Parallel
    const [upRes, catRes] = await Promise.all([
      fetch(`${pythonUrl}/api/uploads?page=1&search=&category=All`, { 
        cache: 'no-store',
        headers: { "x-user-email": session.user.email } 
      }),
      fetch(`${nextUrl}/api/categories`, { cache: 'no-store' })
    ]);
    
    let upData = { uploads: [], currentPage: 1, totalPages: 1 };
    let catData = [];

    // 3. Process Python Response
    if (upRes.ok) {
        upData = await upRes.json();
    } else {
        console.error(`Python Backend Error: ${upRes.status}`);
    }

    // 4. Process Category Response
    if (catRes.ok) {
        catData = await catRes.json();
    }

    return { 
      uploads: upData.uploads || [],
      currentPage: upData.currentPage || 1,
      totalPages: upData.totalPages || 1,
      categories: catData
    };

  } catch (error) {
    console.error("CRITICAL FETCH ERROR:", error.message);
    // Return empty data so the UI still renders instead of crashing
    return defaultData;
  }
}

export default async function UploadPage() {
  const data = await getData();
  
  return(
    <div className="relative top-40">
        <UploadContent {...data} />
    </div>
  )
}
"use client"
import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import StudyAssistant from "../generation";
import { useRef, useEffect, useState } from "react";
export const dynamic = "force-dynamic";

async function getUpload(id) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/uploads/${id}`, {
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
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Document not found</h1>
            <Link href="/all-uplod" className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Back to List</Link>
        </div>
    );
  }

  return <PDFViewerLayout item={item} />;
}

function PDFViewerLayout({ item }) {
  const pdfContainerRef = useRef(null);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);

  const togglePdfFullscreen = () => {
    if (!document.fullscreenElement) {
      pdfContainerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsPdfFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-300">
      
 
      <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 md:py-4 flex items-center gap-4">
          <Link href="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-600 dark:text-gray-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
             <h1 className="text-base md:text-lg font-bold truncate text-gray-900 dark:text-white">{item.title}</h1>
             <div className="flex items-center gap-3 mt-1">
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  {item.category}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  By {item.uploaderEmail.split("@")[0]}
                </span>
             </div>
          </div>
        </div>
      </nav>

    
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-65px)] p-3 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-full">
        
          <div ref={pdfContainerRef} className="relative w-full lg:w-2/3 h-[60vh] lg:h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col group">
            
           
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button 
                onClick={togglePdfFullscreen}
                className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isPdfFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>

            <iframe 
              src={item.pdfUrl} 
              className="w-full h-full border-none" 
              title={item.title}
            />
          </div>

        
          <div className="w-full lg:w-1/3 h-full">
             <StudyAssistant pdfUrl={item.pdfUrl} docTitle={item.title} />
          </div>

        </div>
      </div>
    </div>
  );
}
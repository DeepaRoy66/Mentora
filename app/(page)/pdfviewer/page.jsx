"use client";

import React from 'react';

export default function PDFViewerPage() {
  
  const pdfUrl = "/pdf.pdf"; 

  return (
    <div className="flex h-screen w-full bg-gray-100">
 
      <div className="flex-grow h-full bg-white shadow-inner">
        <iframe
          src={`${pdfUrl}#toolbar=0`}
          className="w-full h-full border-none"
          title="PDF Viewer"
        />
      </div>

     
      <div className="w-64 bg-white border-l border-gray-200 p-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Actions</h3>
       
        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-md transition-colors duration-300 hover:bg-blue-700 active:bg-blue-800 shadow-sm">
          Approve (Hover)
        </button>

        <button className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-md cursor-default">
          Static Status
        </button>

        <div className="mt-auto text-xs text-gray-400">
          PDF Viewer v1.0
        </div>
      </div>
    </div>
  );
}
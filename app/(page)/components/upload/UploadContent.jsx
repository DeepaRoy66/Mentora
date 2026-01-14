"use client";
import { useState, useRef } from "react";
import UploadList from "./UploadFetchList"; // Make sure filename matches your project
import UploadPdfSection from "./UploadPdfSection";

export default function UploadContent({ categories, uploads, currentPage, totalPages }) {
  const [showUpload, setShowUpload] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [preSelectedFile, setPreSelectedFile] = useState(null);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  const showNotification = (msg, type = 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUploadClick = (itemToEdit, e) => {
    e?.stopPropagation(); 
    
    if (itemToEdit && itemToEdit._id) {
      setEditingItem(itemToEdit);
      setShowUpload(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreSelectedFile(file);
      setEditingItem(null);
      setShowUpload(true); 
    }
    e.target.value = null; 
  };

  const closeModal = () => {
    setShowUpload(false);
    setTimeout(() => {
      setEditingItem(null);
      setPreSelectedFile(null);
    }, 200);
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        style={{ display: 'none' }} 
        accept=".pdf"
      />

      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-xl shadow-2xl text-white font-bold text-base z-[200] transition-all duration-300 transform ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {notification.msg}
        </div>
      )}

      <UploadList 
        categories={categories} 
        initialUploads={uploads}
        initialPage={currentPage}
        initialTotalPages={totalPages}
        onUploadClick={handleUploadClick} 
      />
      
      {showUpload && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
             <button 
               onClick={closeModal} 
               className="absolute -top-10 right-0 text-white hover:text-red-400 text-2xl font-bold transition-colors"
             >
               ✕
             </button>
             <UploadPdfSection 
                categories={categories} 
                initialData={editingItem} 
                initialFile={preSelectedFile} 
                close={closeModal} 
                notify={showNotification}
             />
          </div>
        </div>
      )}
    </div>
  );
}
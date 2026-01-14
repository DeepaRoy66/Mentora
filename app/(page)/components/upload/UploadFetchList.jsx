"use client";
import { useState, useEffect, useCallback } from 'react';
import { BiCloudUpload, BiDotsVerticalRounded, BiTrash, BiDownload, BiFileBlank, BiSelectMultiple, BiLeftArrow, BiRightArrow, BiEdit } from 'react-icons/bi';
import { useSession } from "next-auth/react";

export default function UploadFetchList({ categories, initialUploads, initialPage, initialTotalPages, onUploadClick }) {
  const { data: session } = useSession(); // Get User Session
  
  const [list, setList] = useState(initialUploads);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  
  const [notification, setNotification] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const showNotification = (msg, type = 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      // ✅ FIX: Use the Private Route here too
      // If we used /api/uploads, search results would show other people's files
      const res = await fetch(`http://localhost:8000/api/my-uploads?search=${query}&category=${cat}&page=${page}`, {
        headers: { 'x-user-email': session.user.email }
      });

      if (res.ok) {
        const data = await res.json();
        setList(data.uploads || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setList([]);
      }
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [query, cat, page, session]);

  useEffect(() => {
    const handler = setTimeout(() => { setPage(1); fetchData(); }, 500);
    return () => clearTimeout(handler);
  }, [query, cat, fetchData]);

  useEffect(() => {
    if (page !== initialPage) fetchData();
  }, [page, fetchData, initialPage]);

  // Handle Deletions
  const handleDelete = async (id) => {
    if (!confirm("Delete this file?")) return;
    
    // Deletion is always specific ID, but we send email for security
    const res = await fetch(`http://localhost:8000/api/uploads/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': session.user.email }
    });
    
    if (res.ok) { fetchData(); showNotification("Deleted successfully", "success"); }
    else showNotification("Failed to delete", "error");
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} files?`)) return;
    
    await Promise.all(selectedIds.map(id => 
        fetch(`http://localhost:8000/api/uploads/${id}`, { 
            method: 'DELETE',
            headers: { 'x-user-email': session.user.email }
        })
    ));
    
    setSelectedIds([]); 
    setSelectAll(false); 
    fetchData();
    showNotification(`Deleted ${selectedIds.length} files`, 'success');
  };

  // Helper Functions
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) { 
      setSelectedIds(selectedIds.filter(sid => sid !== id)); setSelectAll(false); 
    } else { 
      setSelectedIds([...selectedIds, id]); 
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) { setSelectedIds([]); setSelectAll(false); } 
    else { setSelectedIds(list.map(item => item._id)); setSelectAll(true); }
  };

  const forceDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen w-full font-sans">
      {notification && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl text-white font-bold text-sm z-[100] animate-bounce ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {notification.msg}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="sticky top-0 bg-white z-20 border-b border-gray-200 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-96">
          <input 
            type="text" 
            placeholder="Filter by title, tag..." 
            className="w-full bg-[#F1F1F1] hover:bg-[#E5E5E5] focus:bg-[#FFFFFF] border border-transparent focus:border-gray-300 rounded-md px-4 py-2 outline-none text-sm transition-all text-black"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer mr-2 border border-gray-300 rounded px-2 py-2"
            onChange={(e) => setCat(e.target.value)}
          >
            <option value="All">Filter: All</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          <button 
            onClick={onUploadClick}
            className="flex items-center gap-2 bg-[#065FD4] hover:bg-[#0A4EB9] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors ml-auto shadow-md"
          >
            <BiCloudUpload size={18} /> UPLOAD
          </button>
        </div>
      </div>

      {/* BULK ACTIONS */}
      {selectedIds.length > 0 && (
        <div className="bg-[#F9FAFB] border-b border-gray-300 px-4 py-2 flex items-center justify-between text-sm sticky top-[73px] z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-700">{selectedIds.length} selected</span>
            <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 border border-gray-300 rounded text-gray-700"><BiTrash /> Delete</button>
          </div>
          <button onClick={() => { setSelectedIds([]); setSelectAll(false); }} className="text-gray-500 hover:text-black font-bold">Deselect all</button>
        </div>
      )}

      {/* TABLE HEADER */}
      <div className="grid grid-cols-[40px_1fr_40px] md:grid-cols-[40px_2fr_120px_120px_120px_40px] gap-4 px-4 py-3 border-b border-gray-200 bg-white text-xs font-bold text-gray-500 uppercase tracking-wider">
        <div onClick={toggleSelectAll} className="cursor-pointer flex justify-center">
          {selectAll ? <BiSelectMultiple size={18} className="text-blue-600" /> : <div className="w-[14px] h-[14px] border-2 border-gray-400 rounded-sm" />}
        </div>
        <div>PDF</div>
        <div className="hidden md:block">Category</div>
        <div className="hidden md:block">Visibility</div>
        <div className="hidden md:block">Date</div>
        <div></div>
      </div>

      {/* LIST ITEMS */}
      <div className="flex flex-col pb-20">
        {loading ? (
          <div className="p-10 text-center text-gray-500 text-sm bg-white">Updating...</div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-sm bg-white">No files found.</div>
        ) : (
          list.map((item) => (
            <div key={item._id} className="group grid grid-cols-[40px_1fr_40px] md:grid-cols-[40px_2fr_120px_120px_120px_40px] gap-4 px-4 py-4 border-b border-gray-200 bg-white hover:bg-gray-50 items-center transition-colors">
              <div onClick={() => toggleSelect(item._id)} className="cursor-pointer flex justify-center">
                {selectedIds.includes(item._id) ? <BiSelectMultiple size={18} className="text-blue-600" /> : <div className="w-[14px] h-[14px] border-2 border-gray-400 rounded-sm group-hover:border-gray-600" />}
              </div>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 text-gray-400 hover:text-red-500"><BiFileBlank size={32} /></div>
                <div className="flex flex-col overflow-hidden w-full">
                  <span className="text-sm font-medium text-gray-900 truncate w-full hover:underline cursor-pointer" onClick={() => window.open(item.pdfUrl, '_blank')}>{item.title}</span>
                </div>
              </div>
              <div className="text-sm text-gray-700 font-medium hidden md:block truncate">{item.category}</div>
              <div className="text-sm text-gray-700 font-medium hidden md:block truncate">{item.visibility}</div>
              <div className="text-sm text-gray-500 hidden md:block">{new Date(item.createdAt).toLocaleDateString()}</div>
              
              <div className="relative flex justify-end">
                <button onClick={() => setOpenMenuId(openMenuId === item._id ? null : item._id)} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full"><BiDotsVerticalRounded size={24} /></button>
                {openMenuId === item._id && (
                  <div className="absolute right-0 top-8 bg-white shadow-xl border border-gray-200 rounded-md w-40 z-50 overflow-hidden">
                    <button onClick={() => forceDownload(item.pdfUrl, item.title)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 flex items-center gap-2"><BiDownload /> Download</button>
                    <button onClick={() => onUploadClick(item)} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-700 flex items-center gap-2"><BiEdit /> Edit Details</button>
                    <button onClick={() => handleDelete(item._id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm font-medium text-red-600 flex items-center gap-2"><BiTrash /> Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-3 flex justify-between items-center text-sm font-medium text-gray-600 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div>Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 hover:bg-gray-100 disabled:opacity-50 rounded-full"><BiLeftArrow /></button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 hover:bg-gray-100 disabled:opacity-50 rounded-full"><BiRightArrow /></button>
        </div>
      </div>
    </div>
  );
}
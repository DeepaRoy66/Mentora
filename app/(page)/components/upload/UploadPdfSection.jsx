"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Ensure this path is correct for your project
import { BiX, BiFileBlank, BiErrorAlt } from 'react-icons/bi';
import { useSession } from "next-auth/react";

export default function UploadPdfSection({ categories, initialData, initialFile, close, notify }) {
    const { data: session } = useSession(); // Get Session to send email

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    
    const TAG_LIMIT = 500;
    
    const [form, setForm] = useState({
        title: '',
        desc: '',
        category: 'Others',
        comments: true,
        visibility: 'Public'
    });

    const currentTagLength = tags.join('').length;
    const isTagLimitReached = currentTagLength > TAG_LIMIT;

    useEffect(() => {
        if (initialData && initialData._id) {
            setForm({ 
                title: initialData.title, 
                desc: initialData.description, 
                category: initialData.category, 
                comments: initialData.commentsEnabled, 
                visibility: initialData.visibility || 'Public' 
            });
            setTags(initialData.tags || []);
            setFile(null);
        } else if (initialFile) {
            setForm({ ...form, title: initialFile.name.replace('.pdf', '') }); // Auto-fill title
            setTags([]);
            setFile(initialFile);
        }
    }, [initialData, initialFile]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected?.type !== 'application/pdf') {
            notify("Only PDF files are allowed", "error");
            return;
        }
        setFile(selected);
        setForm({ ...form, title: selected.name.replace('.pdf', '') });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim().replace(',', '');
            if (currentTagLength + val.length > TAG_LIMIT) return notify("Tag limit reached", "error");
            if (val && !tags.includes(val)) { 
                setTags([...tags, val]); 
                setTagInput(''); 
            }
        }
    };

    const removeTag = (idx) => setTags(tags.filter((_, i) => i !== idx));

    const handleUpload = async () => {
        if (!form.title) return notify("Document Title is required", "error");
        if (isTagLimitReached) return notify(`Tags exceed limit.`, "error");
        if (!session?.user?.email) return notify("Please log in to upload.", "error");
        
        setLoading(true);
        try {
            let pdfUrl = initialData?.pdfUrl;
            
            // 1. UPLOAD TO SUPABASE (Storage)
            if (file) {
                const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const { error: upError } = await supabase.storage.from('mentora-files').upload(fileName, file);
                if (upError) throw upError;
                const { data: { publicUrl } } = supabase.storage.from('mentora-files').getPublicUrl(fileName);
                pdfUrl = publicUrl;
            }
            
            // 2. SAVE DATA TO PYTHON BACKEND
            // Note: We use the generic /api/uploads endpoint for POST/PUT, 
            // but we MUST send the header so the backend records the email.
            const baseUrl = "http://localhost:8000";
            const url = initialData ? `${baseUrl}/api/uploads/${initialData._id}` : `${baseUrl}/api/uploads`;
            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-email': session.user.email // <--- CRITICAL: Links upload to user
                },
                body: JSON.stringify({ 
                    title: form.title, 
                    description: form.desc, 
                    pdfUrl: pdfUrl, 
                    tags: tags, 
                    category: form.category, 
                    commentsEnabled: form.comments, 
                    visibility: form.visibility 
                })
            });
            
            if (res.ok) { 
                notify(initialData ? "Updated successfully" : "Uploaded successfully", "success");
                window.location.reload(); 
            } else { 
                const errData = await res.json(); 
                notify(errData.detail || "Error saving document", "error"); 
            }
        } catch (err) { 
            console.error(err);
            notify(err.message || "Network error", "error"); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
       <div className="p-8 bg-white rounded-2xl shadow-2xl text-gray-900">
            <h2 className="text-2xl font-black text-gray-900 mb-6 border-b pb-4">
                {initialData && initialData._id ? "Edit Document" : "Upload New PDF"}
            </h2>

            {!initialData && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
                    <input type="file" id="pdf-up" hidden onChange={handleFileChange} accept=".pdf" />
                    <label htmlFor="pdf-up" className="cursor-pointer block w-full h-full">
                        <BiFileBlank size={48} className="text-gray-400 mx-auto mb-3" />
                        <span className="text-sm font-bold text-gray-600 block">
                            {file ? file.name : "Click to select PDF file"}
                        </span>
                    </label>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                    <input 
                        className="w-full p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg outline-none focus:border-blue-500" 
                        value={form.title} 
                        onChange={e => setForm({ ...form, title: e.target.value })} 
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                        <select 
                            className="w-full p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg outline-none focus:border-blue-500" 
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            value={form.category}
                        >
                            <option value="Others">Others</option>
                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Visibility</label>
                        <select 
                            className="w-full p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg outline-none focus:border-blue-500" 
                            onChange={e => setForm({ ...form, visibility: e.target.value })}
                            value={form.visibility}
                        >
                            <option value="Public">Public</option>
                            <option value="Private">Private</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea 
                        className="w-full p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg outline-none focus:border-blue-500" 
                        value={form.desc} 
                        onChange={e => setForm({ ...form, desc: e.target.value })}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Tags</label>
                        <span className={`text-xs font-bold ${isTagLimitReached ? 'text-red-500' : 'text-gray-500'}`}>
                            {currentTagLength}/{TAG_LIMIT}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg min-h-[50px]">
                        {tags.map((tag, index) => (
                            <span key={index} className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1">
                                {tag} <BiX className="cursor-pointer" onClick={() => removeTag(index)} />
                            </span>
                        ))}
                        <input 
                            className="flex-1 bg-transparent outline-none min-w-[100px]"
                            value={tagInput} 
                            onKeyDown={handleKeyDown} 
                            onChange={(e) => setTagInput(e.target.value)} 
                            placeholder="Add tags..."
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#F3F4F6] rounded-lg border border-gray-300">
                    <input
                        type="checkbox"
                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                        checked={form.comments} 
                        onChange={e => setForm({ ...form, comments: e.target.checked })}
                    />
                    <label className="text-sm font-bold text-gray-900">Allow user comments</label>
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button onClick={close} className="flex-1 py-3 font-bold text-gray-600 hover:text-gray-900">Cancel</button>
                <button
                    onClick={handleUpload}
                    disabled={loading || isTagLimitReached}
                    className="flex-1 py-3 rounded-lg font-bold shadow-lg bg-[#065FD4] hover:bg-[#0A4EB9] text-white disabled:opacity-50"
                >
                    {loading ? 'Saving...' : (initialData && initialData._id ? 'Update Changes' : 'Publish Document')}
                </button>
            </div>
        </div>
    );
}
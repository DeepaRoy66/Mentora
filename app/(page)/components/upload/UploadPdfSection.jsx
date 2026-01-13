"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BiX, BiFileBlank, BiErrorAlt } from 'react-icons/bi';

export default function UploadPdfSection({ categories, initialData, initialFile, close, notify }) {
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
        const defaultState = { 
            title: '', 
            desc: '', 
            category: 'Others', 
            comments: true, 
            visibility: 'Public' 
        };

        if (initialData && initialData._id) {
            // Edit Mode
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
            // New Upload Mode (Pre-selected file)
            setForm(defaultState);
            setTags([]);
            setFile(initialFile);
        } else {
            // New Upload Mode (No file yet)
            setForm(defaultState);
            setTags([]);
            setFile(null);
            setTagInput('');
        }
    }, [initialData, initialFile]); // ✅ Warning gone

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected?.type !== 'application/pdf') {
            notify("Only PDF files are allowed");
            return;
        }
        setFile(selected);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim().replace(',', '');
            
            if (currentTagLength + val.length > TAG_LIMIT) {
                notify("Tag limit reached (500 characters)");
                return;
            }

            if (val && !tags.includes(val)) { 
                setTags([...tags, val]); 
                setTagInput(''); 
            }
        }
    };

    const removeTag = (indexToRemove) => {
        setTags(tags.filter((_, index) => index !== indexToRemove));
    };

    const handleUpload = async () => {
        if (!form.title) return notify("Document Title is required");
        if (isTagLimitReached) return notify(`Tags exceed ${TAG_LIMIT} characters limit.`);
        
        setLoading(true);
        try {
            let pdfUrl = initialData?.pdfUrl;
            
            if (file) {
                const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const { error: upError } = await supabase.storage.from('mentora-files').upload(fileName, file);
                if (upError) throw upError;
                const { data: { publicUrl } } = supabase.storage.from('mentora-files').getPublicUrl(fileName);
                pdfUrl = publicUrl;
            }
            
            const method = initialData ? 'PUT' : 'POST';
            const url = initialData ? `/api/uploads/${initialData._id}` : '/api/uploads';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
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
                window.location.reload(); 
            } else { 
                const errData = await res.json(); 
                notify(errData.error || "Error saving document"); 
            }
        } catch (err) { 
            console.error(err);
            notify(err.message || "Network error saving document"); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
       <div className="p-8 bg-white rounded-2xl shadow-2xl text-gray-900">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-black text-gray-900">
                    {initialData && initialData._id ? "Edit Document" : "Upload New PDF"}
                </h2>
            </div>

            {/* File Upload Area (Only for New Uploads) */}
            {!initialData && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
                    <input type="file" id="pdf-up" hidden onChange={handleFileChange} accept=".pdf" />
                    <label htmlFor="pdf-up" className="cursor-pointer block w-full h-full">
                        <BiFileBlank size={48} className="text-gray-400 mx-auto mb-3" />
                        <span className="text-sm font-bold text-gray-600 block">
                            {file ? file.name : "Click to select PDF file"}
                        </span>
                        {file && <span className="block text-xs text-green-600 mt-1 font-medium">File selected</span>}
                    </label>
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                    <input 
                        className="w-full p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-gray-900 transition-all" 
                        placeholder="Document Title" 
                        value={form.title} 
                        onChange={e => setForm({ ...form, title: e.target.value })} 
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                        <select 
                            className="w-full p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-gray-900" 
                            onChange={e => setForm({ ...form, category: e.target.value })}
                        >
                            <option value="Others">Others</option>
                            {categories.map(c => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Visibility</label>
                        <select 
                            className="w-full p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-gray-900" 
                            onChange={e => setForm({ ...form, visibility: e.target.value })}
                            value={form.visibility}
                        >
                            <option value="Public">Public</option>
                            <option value="Private">Private</option>
                            {/* Removed Unlisted */}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea 
                        className="w-full p-3 bg-[#F3F4F6] border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:bg-white text-gray-900" 
                        placeholder="Short description..." 
                        value={form.desc} 
                        onChange={e => setForm({ ...form, desc: e.target.value })}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Tags (Enter to add)</label>
                        <span className={`text-xs font-bold ${isTagLimitReached ? 'text-red-500' : 'text-gray-500'}`}>
                            {currentTagLength}/{TAG_LIMIT}
                        </span>
                    </div>
                    <div className={`flex flex-wrap gap-2 p-3 bg-[#F3F4F6] border ${isTagLimitReached ? 'border-red-500' : 'border-gray-300'} rounded-lg min-h-[50px] focus-within:border-blue-500 focus-within:bg-white transition-all`}>
                        {tags.map((tag, index) => (
                            <span key={index} className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1">
                                {tag} 
                                <BiX className="cursor-pointer hover:text-red-300" onClick={() => removeTag(index)} />
                            </span>
                        ))}
                        <input 
                            className="flex-1 bg-transparent outline-none text-gray-900 min-w-[100px]"
                            value={tagInput} 
                            onKeyDown={handleKeyDown} 
                            onChange={(e) => setTagInput(e.target.value)} 
                            placeholder="Add tags..."
                        />
                    </div>
                    {isTagLimitReached && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <BiErrorAlt /> Tag limit exceeded. Reduce length.
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#F3F4F6] rounded-lg border border-gray-300">
                    <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 accent-blue-600 cursor-pointer"
                        checked={form.comments} 
                        onChange={e => setForm({ ...form, comments: e.target.checked })}
                    />
                    <label className="text-sm font-bold text-gray-900 cursor-pointer select-none">Allow user comments on this PDF</label>
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button onClick={close} className="flex-1 py-3 font-bold text-gray-600 hover:text-gray-900 transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleUpload}
                    disabled={loading || isTagLimitReached}
                    className={`flex-1 py-3 rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 ${isTagLimitReached ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#065FD4] hover:bg-[#0A4EB9] text-white'}`}
                >
                    {loading ? 'Saving...' : (initialData && initialData._id ? 'Update Changes' : 'Publish Document')}
                </button>
            </div>
        </div>
    );
}

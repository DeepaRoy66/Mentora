"use client"
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BiX, BiCloudUpload } from 'react-icons/bi';

export default function UploadPdfSection({ categories }) {
    const [file, setFile] = useState(null);
    const [showCard, setShowCard] = useState(false);
    const [loading, setLoading] = useState(false);

    // Tag state for YouTube-style tags
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);

    const [form, setForm] = useState({
        title: '',
        desc: '',
        category: 'Others',
        comments: true
    });

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected?.type !== 'application/pdf') return alert("Only PDFs allowed");
        setFile(selected);
        setShowCard(true);
    };

    // YouTube-style Tag Logic
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagInput.trim().replace(',', '');
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
        if (!form.title) return alert("Title is required");
        setLoading(true);

        try {
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

            // Fixed to your actual bucket name: 'mentora-files'
            const { data: upData, error: upError } = await supabase.storage
                .from('mentora-files')
                .upload(fileName, file);

            if (upError) throw upError;

            const { data: { publicUrl } } = supabase.storage
                .from('mentora-files')
                .getPublicUrl(fileName);

            const res = await fetch('/api/uploads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    pdfUrl: publicUrl,
                    tags: tags // Sends the array of tags directly
                })
            });

            if (res.ok) {
                window.location.reload();
            } else {
                const errData = await res.json();
                alert(errData.error || "Permission Denied");
            }

        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section>
            {/* Upload Trigger Area */}
            <div className="bg-white p-16 rounded-[2.5rem] border-4 border-dashed border-gray-200 text-center hover:border-black transition-all group">
                <input type="file" id="pdf-up" hidden onChange={handleFileChange} accept=".pdf" />
                <label htmlFor="pdf-up" className="cursor-pointer flex flex-col items-center">
                    <BiCloudUpload size={64} className="text-gray-300 group-hover:text-black transition-colors mb-4" />
                    <span className="bg-black text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform">
                        Select PDF to Upload
                    </span>
                    <p className="mt-4 text-gray-500 font-medium text-sm">PDF files only. High contrast UI enabled.</p>
                </label>
            </div>

            {/* Upload Metadata Card */}
            {showCard && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
                        <h2 className="text-3xl font-black mb-8 text-black">Upload Details</h2>

                        <div className="space-y-6">
                            {/* Title Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-black text-black ml-1 uppercase tracking-wider">Document Title *</label>
                                <input
                                    placeholder="e.g. Final Year Thesis"
                                    className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black focus:bg-white text-black font-semibold outline-none transition-all placeholder:text-gray-400"
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                />
                            </div>

                            {/* Description Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-black text-black ml-1 uppercase tracking-wider">Description</label>
                                <textarea
                                    placeholder="What is this PDF about?"
                                    rows="3"
                                    className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black focus:bg-white text-black font-semibold outline-none transition-all placeholder:text-gray-400"
                                    onChange={e => setForm({ ...form, desc: e.target.value })}
                                />
                            </div>

                            {/* YouTube Style Tags Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-black text-black ml-1 uppercase tracking-wider">Tags (Press Enter)</label>
                                <div className="w-full p-3 bg-gray-50 rounded-2xl border-2 border-transparent focus-within:border-black focus-within:bg-white transition-all flex flex-wrap gap-2">
                                    {tags.map((tag, index) => (
                                        <span key={index} className="bg-black text-white pl-3 pr-2 py-1 rounded-lg flex items-center text-sm font-bold">
                                            {tag}
                                            <button onClick={() => removeTag(index)} className="ml-1 hover:text-red-400">
                                                <BiX size={18} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        value={tagInput}
                                        onKeyDown={handleKeyDown}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        placeholder={tags.length === 0 ? "add tags..." : ""}
                                        className="flex-1 bg-transparent border-none outline-none text-black font-semibold min-w-[120px]"
                                    />
                                </div>
                            </div>

                            {/* Category Dropdown */}
                            <div className="space-y-2">
                                <label className="text-sm font-black text-black ml-1 uppercase tracking-wider">Category</label>
                                <select
                                    className="w-full p-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-black focus:bg-white text-black font-bold outline-none appearance-none"
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                >
                                    <option value="Others">Select Category (Default: Others)</option>
                                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Comment Toggle */}
                            <div className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-gray-200 transition-all cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="comments"
                                    className="w-6 h-6 accent-black cursor-pointer"
                                    checked={form.comments}
                                    onChange={e => setForm({ ...form, comments: e.target.checked })}
                                />
                                <label htmlFor="comments" className="font-black text-black cursor-pointer select-none">Allow user comments on this PDF</label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-12">
                            <button onClick={() => setShowCard(false)} className="flex-1 py-5 font-black text-gray-400 hover:text-black transition-colors">
                                Discard
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={loading}
                                className="flex-1 py-5 bg-black text-white rounded-[1.5rem] font-black shadow-2xl disabled:bg-gray-300 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {loading ? 'Processing File...' : 'Publish Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
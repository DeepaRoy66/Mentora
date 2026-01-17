"use client";

import { useState } from "react";
import { Leaf, Zap, Globe, AlertTriangle, CheckCircle2, Server, Trees, ArrowRight } from "lucide-react";

export default function EcoAuditor() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runAudit = async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`http://localhost:8000/audit?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.status === "success") {
        setResult(data);
      } else {
        setError(data.message || "Could not retrieve audit details.");
      }
    } catch (err) {
      setError("Backend server is not reachable. Please start your Python main.py.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ADDED: pt-24 md:pt-32 to push content below your fixed Navbar
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 pt-24 md:pt-32 pb-20">
      
      {/* Tool Header - Optional (Kept distinct from your main Navbar) */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex justify-between items-center border-b border-dashed border-green-200 pb-4">
          <div className="flex items-center gap-2 font-black text-xl md:text-2xl text-green-700">
            <Leaf fill="currentColor" className="w-6 h-6 md:w-8 md:h-8" />
            <span>EcoAudit</span>
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider">
            Beta 2026
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400 font-serif italic">Green</span> is your Web?
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto px-4">
            Measure your website&apos;s carbon footprint and discover actionable insights to build a sustainable digital future.
          </p>
        </div>

        {/* Search Bar - Made Responsive */}
        <div className="max-w-3xl mx-auto bg-white p-3 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col md:flex-row items-center gap-3 mb-16 relative z-10">
          <div className="pl-4 text-slate-400 hidden md:block">
            <Globe size={24} />
          </div>
          <input 
            className="w-full flex-1 p-4 rounded-2xl outline-none text-lg bg-transparent text-center md:text-left placeholder:text-slate-300"
            placeholder="Enter website URL (e.g. google.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runAudit()}
          />
          <button 
            onClick={runAudit}
            disabled={loading}
            className="w-full md:w-auto bg-slate-900 hover:bg-green-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
               <span className="flex items-center gap-2">Scanning... <span className="animate-spin">⟳</span></span>
            ) : (
               <>Audit Now <ArrowRight size={18}/></>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto bg-red-50 text-red-600 p-4 rounded-2xl mb-10 text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        {/* Results Area */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            
            {/* 1. Eco Score Card (Main Highlight) */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              <span className="text-slate-400 font-bold text-xs uppercase mb-4 tracking-widest">Sustainability Grade</span>
              <div className="relative z-10">
                 <div className="text-[8rem] leading-none font-black text-green-600 group-hover:scale-110 transition-transform duration-300">
                    {result.grade}
                 </div>
                 <CheckCircle2 className="absolute top-2 -right-4 text-green-400" size={40} />
              </div>
              <p className="mt-4 text-slate-500 text-center text-sm font-medium">
                Based on page weight & resource load.
              </p>
            </div>

            {/* 2. Stats Dashboard (Grid of 2 small cards) */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* CO2 Stat */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-orange-200 transition-colors">
                <div className="bg-orange-50 w-14 h-14 rounded-2xl flex items-center justify-center text-orange-500 mb-4">
                  <Zap size={28} />
                </div>
                <div>
                    <div className="text-4xl font-bold text-slate-800">{result.co2_emitted_grams}<span className="text-lg text-slate-400 font-medium">g</span></div>
                    <div className="text-slate-500 font-medium mt-1">Carbon Emitted</div>
                </div>
              </div>

              {/* Page Weight Stat */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-colors">
                <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                  <Server size={28} />
                </div>
                <div>
                    <div className="text-4xl font-bold text-slate-800">{result.page_weight_mb} <span className="text-lg text-slate-400 font-medium">MB</span></div>
                    <div className="text-slate-500 font-medium mt-1">Total Resource Size</div>
                </div>
              </div>

              {/* Advice Section (Full width of the sub-grid) */}
              <div className="bg-[#1a2e22] text-white p-8 rounded-[32px] shadow-lg sm:col-span-2 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-green-500 rounded-full opacity-10 blur-3xl"></div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2 uppercase tracking-wide text-green-400 flex items-center gap-2">
                    <Trees size={18} /> Optimization Tip
                  </h3>
                  {/* FIX: Escaped quotes below (&quot;) */}
                  <p className="text-green-100 leading-relaxed text-lg font-light">&quot;{result.advice}&quot;</p>
                </div>
              </div>
            </div>

            {/* 3. Technical Issues (Full Width at bottom) */}
            {result.issues && result.issues.length > 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-8 rounded-[32px] shadow-sm border border-red-100">
                <div className="flex items-center gap-3 text-red-500 font-bold mb-6 text-lg uppercase tracking-tight border-b border-red-50 pb-4">
                  <AlertTriangle size={24} />
                  <span>Optimization Opportunities</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.issues.map((issue, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-red-50/50 rounded-2xl text-slate-700 items-start hover:bg-red-50 transition-colors">
                      <div className="bg-red-500 w-2 h-2 rounded-full mt-2.5 flex-shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      <p className="font-medium leading-relaxed text-sm md:text-base">{issue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
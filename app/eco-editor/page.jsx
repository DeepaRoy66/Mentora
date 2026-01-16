"use client";

import { useState } from "react";
import { Leaf, Zap, Globe, AlertTriangle, CheckCircle2, Server, Trees } from "lucide-react";

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
      // Ensure your Python backend is running on port 8000
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
    <div className="min-h-screen bg-[#fcfdfa] text-slate-900 pb-20">
      
      {/* NOTE: This is a specific Sub-Header for the Tool. 
        If your Main Layout already has a Navbar, you might have two bars. 
        You can keep this as a "Tool Title" or remove it if it feels crowded.
      */}
      <div className="p-6 max-w-7xl mx-auto flex justify-between items-center border-b border-dashed border-green-100">
        <div className="flex items-center gap-2 font-black text-2xl text-green-700">
          <Leaf fill="currentColor" size={32} />
          <span>EcoAudit</span>
        </div>
        <div className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
          2026 Sustainable Tech
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-6 pt-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-6 tracking-tight text-slate-800 leading-tight">
            How <span className="text-green-600 font-serif italic">Green</span> is your Software?
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Our Auditor measures website carbon emissions and helps you reduce your digital footprint.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto bg-white p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center gap-2 mb-20">
          <div className="pl-4 text-slate-400">
            <Globe size={24} />
          </div>
          <input 
            className="flex-1 p-4 rounded-2xl outline-none text-xl bg-transparent"
            placeholder="Enter website URL (e.g. google.com)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runAudit()}
          />
          <button 
            onClick={runAudit}
            disabled={loading}
            className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Audit Now"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-10 text-center flex items-center justify-center gap-2">
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        {/* Results Area */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-500">
            
            {/* Eco Score Card */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-slate-400 font-bold text-sm uppercase mb-4 tracking-widest">Eco-Grade</span>
              <div className="relative">
                 <div className="text-8xl font-black text-green-600">{result.grade}</div>
                 <CheckCircle2 className="absolute -top-2 -right-6 text-green-500" size={32} />
              </div>
              <p className="mt-6 text-slate-500 text-center text-sm font-medium leading-relaxed">
                This grade is assigned based on the total load size of the page assets.
              </p>
            </div>

            {/* Stats Dashboard */}
            <div className="md:col-span-2 grid grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                  <Zap size={24} />
                </div>
                <div className="text-4xl font-bold text-slate-800">{result.co2_emitted_grams}g</div>
                <div className="text-slate-500 font-medium">CO2 per visit</div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                  <Server size={24} />
                </div>
                <div className="text-4xl font-bold text-slate-800">{result.page_weight_mb} MB</div>
                <div className="text-slate-500 font-medium">Total Page Weight</div>
              </div>

              <div className="bg-green-900 text-white p-8 rounded-[40px] shadow-lg col-span-2 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Sustainable Advice</h3>
                  <p className="text-green-200 leading-relaxed">{result.advice}</p>
                </div>
                <div className="flex flex-col items-center">
                  <Trees size={48} className="text-green-400 opacity-50 mb-2" />
                  <span className="text-xs text-green-300 font-bold">Eco-Target</span>
                </div>
              </div>
            </div>

            {/* Technical Issues Section (Points) */}
            {result.issues && result.issues.length > 0 && (
              <div className="col-span-1 md:col-span-3 mt-4 bg-white p-8 rounded-[40px] shadow-sm border border-red-50">
                <div className="flex items-center gap-2 text-red-500 font-bold mb-6 text-xl uppercase tracking-tight">
                  <AlertTriangle size={24} />
                  <span>Detected Technical Issues</span>
                </div>
                <div className="space-y-4">
                  {result.issues.map((issue, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-red-50 rounded-2xl text-slate-700 items-start transition-hover hover:bg-red-100">
                      <div className="bg-red-500 w-2 h-2 rounded-full mt-2.5 flex-shrink-0" />
                      <p className="font-medium leading-relaxed tracking-tight">{issue}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      <footer className="mt-20 border-t py-10 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">
        Built for Green Tech Hackathon 2026 • Powering Sustainable Digital Futures
      </footer>
    </div>
  );
}
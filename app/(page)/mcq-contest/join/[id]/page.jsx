"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogIn, User, Eye, Loader2, ArrowRight } from "lucide-react";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [role, setRole] = useState("player");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    const savedUid = localStorage.getItem("quiz_uid");
    const savedName = localStorage.getItem("quiz_name");
    
    if (savedUid && savedName) {
      setAlreadyJoined(true);
      setName(savedName);
    }
  }, [params.id]);

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim() || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Session not found, full, or already started.");
      }

      const data = await res.json();

      localStorage.setItem("quiz_uid", data.id);
      localStorage.setItem("quiz_role", data.role); 
      localStorage.setItem("quiz_name", data.name);

      router.push(`/mcq-contest/match/${params.id}`);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const clearSessionAndRetry = () => {
    localStorage.removeItem("quiz_uid");
    localStorage.removeItem("quiz_role");
    localStorage.removeItem("quiz_name");
    setAlreadyJoined(false);
    setName("");
  };

  // CRITICAL FIX: Rejoin Logic
  // We MUST hit the API here. This tells the backend "I am back, show me on the leaderboard".
  // If we skip this, the Admin won't see the user.
  const handleRejoin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const savedUid = localStorage.getItem("quiz_uid");
      const savedRole = localStorage.getItem("quiz_role") || "player";

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role: savedRole, uid: savedUid }), // PASS UID!
      });

      if (!res.ok) {
        // If session cancelled or user deleted, treat as new join
        const errData = await res.json();
        throw new Error(errData.detail || "Session ended. Please refresh.");
      }

      const data = await res.json();

      // Update LocalStorage with fresh data from server (Restores Score/Role)
      localStorage.setItem("quiz_uid", data.id);
      localStorage.setItem("quiz_role", data.role);
      localStorage.setItem("quiz_name", data.name);

      router.push(`/mcq-contest/match/${params.id}`);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            MENTORA<span className="text-blue-500">.</span>
          </h1>
          <div className="inline-block px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <p className="text-slate-400 text-xs font-mono">ROOM CODE: {params.id}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
              <p className="text-slate-900 font-bold">Joining Lobby...</p>
            </div>
          )}

          {alreadyJoined ? (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome back, {name}</h2>
              <p className="text-slate-500 mt-2 mb-8">Reconnecting to session...</p>
              
              <div className="space-y-3">
                {/* FIX: Call handleRejoin (which hits API) instead of just router.push */}
                <button
                  onClick={handleRejoin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
                >
                  Enter Match <ArrowRight size={20} />
                </button>
                <button
                  onClick={clearSessionAndRetry}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl font-medium transition-all"
                >
                  Join as someone else
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Join the Contest</h2>
                <p className="text-slate-500">Enter your details to participate</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Screen Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex_99"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Select Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("player")}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                        role === "player"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      <User size={24} />
                      <span className="font-bold text-sm">Contestant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("spectator")}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                        role === "spectator"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      <Eye size={24} />
                      <span className="font-bold text-sm">Viewer</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!name.trim() || isLoading}
                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-lg flex justify-center items-center gap-2 transition-all shadow-xl disabled:bg-slate-300 disabled:shadow-none"
              >
                <LogIn size={22} /> JOIN LOBBY
              </button>
            </form>
          )}
        </div>
        
   
      </div>
    </div>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Users, ShieldCheck, User, Eye, Loader2, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const params = useParams();
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("WAITING");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUid = localStorage.getItem(`admin_uid_${params.id}`);
    if (storedUid) {
      setIsJoined(true);
      connectToWebSocket(storedUid);
    }
  }, [params.id]);

  const connectToWebSocket = (uid) => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // Points to the same WebSocket as normal players
    const ws = new WebSocket(`${protocol}://${window.location.host.replace(":3000", ":8000")}/mcq/ws/${params.id}/${uid}`);
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === "INIT") {
        setGameState(msg.payload.state);
        setPlayers(msg.payload.players);
        
        // If the game is already in progress when admin refreshes, send them to the match
        if (msg.payload.state !== "WAITING") {
          router.push(`/mcq-contest/match/${params.id}`);
        }
      } 
      else if (msg.type === "NEW_QUESTION") {
        // As soon as the first question is generated, move admin to the arena
        router.push(`/mcq-contest/match/${params.id}`);
      }
    };
  };

  const handleAdminJoin = async () => {
    if (!adminName.trim()) return alert("Please enter a name");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: adminName, role: "player" }), 
      });
      
      const data = await res.json();
      
      // Critical: Save both IDs so the Match Page knows this is the SAME person
      localStorage.setItem(`admin_uid_${params.id}`, data.id);
      localStorage.setItem(`quiz_uid`, data.id); 
      localStorage.setItem(`quiz_name`, data.name);
      localStorage.setItem(`quiz_role`, data.role);
      
      setIsJoined(true);
      connectToWebSocket(data.id);
    } catch (err) {
      console.error("Join failed", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (uid) => {
    // Tells backend to swap player <-> spectator
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/toggle-role/${uid}`, { 
      method: "POST" 
    });
  };

  const startGame = async () => {
    setLoading(true);
    // This triggers start_next_question in backend, which broadcasts NEW_QUESTION
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/start`, { 
      method: "POST" 
    });
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border-b-8 border-slate-200">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="text-blue-600" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Admin Entry</h2>
          <p className="text-slate-500 mb-8 font-medium">Set your display name to manage the lobby.</p>
          
          <input 
            className="w-full p-5 bg-slate-100 border-2 border-transparent rounded-2xl mb-6 outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-bold"
            placeholder="e.g. QuizMaster"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
          />
          
          <button 
            onClick={handleAdminJoin} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Access Control Panel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Lobby Management</h1>
            <p className="text-slate-400 font-medium">Session ID: <span className="text-blue-400 font-mono">{params.id}</span></p>
          </div>
          <div className="flex gap-3">
             <div className="bg-slate-900 px-6 py-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                <span className="font-bold text-sm">System Live</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Card */}
          <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
              <Play size={20} className="text-blue-500" /> Match Controls
            </h3>
            
            <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-2">
                <Play className="text-green-500" size={32} fill="currentColor" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-2">Ready to launch?</h2>
                <p className="text-slate-400 max-w-xs mx-auto">Once started, players will immediately see the first question on their screens.</p>
              </div>
              
              <button 
                onClick={startGame}
                disabled={loading || players.length === 0}
                className="group w-full max-w-sm mx-auto bg-green-600 hover:bg-green-500 py-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-green-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : "START MATCH"}
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>

          {/* Players Sidebar */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Users size={16}/> Players ({players.length})
              </h3>
            </div>

            <div className="space-y-3">
              {players.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-600 font-bold italic">No one has joined yet...</p>
                </div>
              )}
              {players.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 group hover:border-blue-500/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${p.role === 'player' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{p.name} {p.id === localStorage.getItem(`admin_uid_${params.id}`) && "(You)"}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${p.role === 'player' ? 'text-blue-400' : 'text-slate-500'}`}>
                        {p.role}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => toggleRole(p.id)}
                    title={p.role === 'player' ? "Switch to Spectator" : "Switch to Player"}
                    className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-800 transition-all"
                  >
                    {p.role === 'player' ? <User size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
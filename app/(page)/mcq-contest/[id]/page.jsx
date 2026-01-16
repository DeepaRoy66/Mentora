"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Users, ShieldCheck, User, Eye, Loader2, ArrowRight, X, AlertTriangle, Settings2, Check } from "lucide-react";

export default function AdminDashboard() {
  const params = useParams();
  const router = useRouter();
  
  const [adminName, setAdminName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("WAITING");
  const [loading, setLoading] = useState(false);
  
  // NEW: Config State
  const [playerLimit, setPlayerLimit] = useState(10);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState("");
  const [configLoading, setConfigLoading] = useState(false);

  const [toggleError, setToggleError] = useState(""); 
  const [socket, setSocket] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const connectToWebSocket = (uid) => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.host.includes('localhost') 
      ? window.location.host.replace(':3000', ':8000') 
      : window.location.host;

    const ws = new WebSocket(`${protocol}://${wsHost}/mcq/ws/${params.id}/${uid}`);
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === "INIT") {
        setGameState(msg.payload.state);
        setPlayers(msg.payload.players);
        
        // FIX: Extract and set player limit from config
        if (msg.payload.config) {
            setPlayerLimit(msg.payload.config.playerLimit);
            setTempLimit(msg.payload.config.playerLimit);
        }

        if (msg.payload.state !== "WAITING") {
          router.push(`/mcq-contest/match/${params.id}`);
        }
      } 
      else if (msg.type === "SESSION_CANCELLED") {
          localStorage.removeItem(`admin_uid_${params.id}`);
          localStorage.removeItem("quiz_uid");
          router.push("/");
      }
      else if (msg.type === "NEW_QUESTION") {
        router.push(`/mcq-contest/match/${params.id}`);
      }
    };

    setSocket(ws);
    return () => ws.close();
  };

  useEffect(() => {
    const storedUid = localStorage.getItem(`admin_uid_${params.id}`);
    if (storedUid) {
      setIsJoined(true);
      connectToWebSocket(storedUid);
    }
  }, [params.id]);

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
      localStorage.setItem(`admin_uid_${params.id}`, data.id);
      localStorage.setItem("quiz_uid", data.id); 
      localStorage.setItem("quiz_name", data.name);
      localStorage.setItem("quiz_role", data.role);
      
      setIsJoined(true);
      connectToWebSocket(data.id);
      setLoading(false);
    } catch (err) {
      console.error("Join failed", err);
      setLoading(false);
    }
  };

  const toggleRole = async (uid) => {
    setToggleError(""); 
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/toggle-role/${uid}`, { 
        method: "POST" 
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Cannot toggle role");
      }

      const updatedUser = await res.json();
      setPlayers(prev => prev.map(p => p.id === uid ? updatedUser : p));

    } catch (err) {
      setToggleError(err.message);
      setTimeout(() => setToggleError(""), 3000);
    }
  };

  // NEW: Handle Config Update
  const handleUpdateLimit = async () => {
      setConfigLoading(true);
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/update-config`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playerLimit: tempLimit }),
          });
          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.detail || "Failed to update limit");
          }
          const data = await res.json();
          setPlayerLimit(data.newLimit);
          setIsEditingLimit(false);
      } catch (err) {
          alert(err.message);
      } finally {
          setConfigLoading(false);
      }
  }

  const cancelMatch = async () => {
    setShowCancelModal(false);
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/cancel`, { 
      method: "POST" 
    });
    setLoading(false);
  };

  const startGame = async () => {
    setLoading(true);
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
          <input 
            className="w-full p-5 bg-slate-100 border-2 border-transparent rounded-2xl mb-6 outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-bold"
            placeholder="Admin Name"
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
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-2">Cancel Match?</h3>
                <p className="text-slate-400 mb-6">This will end the session and disconnect all players.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Keep</button>
                    <button onClick={cancelMatch} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors">Cancel Session</button>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Lobby Management</h1>
            <p className="text-slate-400 font-medium">Session ID: <span className="text-blue-400 font-mono">{params.id}</span></p>
          </div>
          <button 
            onClick={() => setShowCancelModal(true)} 
            className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full transition-all text-sm font-bold border border-red-500/20"
          >
            <X size={16}/> Cancel Match
          </button>
        </header>

        {toggleError && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 animate-in fade-in">
                <AlertTriangle className="text-red-500" size={20} />
                <span className="font-bold text-red-200">{toggleError}</span>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Match Controls */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl">
              <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                <Play size={20} className="text-blue-500" /> Match Controls
              </h3>
              
              <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-2">
                  <Play className="text-green-500" size={32} fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-2xl font-black mb-2">Ready to launch?</h2>
                  <p className="text-slate-400 max-w-xs mx-auto">{players.length} users in lobby.</p>
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

            {/* NEW: SETTINGS CARD */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <Settings2 size={20} className="text-purple-500" /> Session Settings
                </h3>
                <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-1">Contestant Limit</p>
                            <p className="text-slate-500 text-xs">Max players allowed in the match</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {!isEditingLimit ? (
                                <div 
                                    onClick={() => {
                                        setTempLimit(playerLimit);
                                        setIsEditingLimit(true);
                                    }}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl cursor-pointer border border-slate-700 flex items-center gap-2 group transition-all"
                                >
                                    <span className="font-black text-xl text-white">{playerLimit}</span>
                                    <Users size={18} className="text-slate-400 group-hover:text-white"/>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-2xl border border-blue-500 ring-2 ring-blue-500/20">
                                    <input 
                                        type="number"
                                        value={tempLimit}
                                        onChange={(e) => setTempLimit(e.target.value)}
                                        className="w-20 bg-transparent text-white font-black text-center focus:outline-none"
                                    />
                                    <button 
                                        onClick={handleUpdateLimit}
                                        disabled={configLoading || !tempLimit}
                                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50"
                                    >
                                        {configLoading ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800">
             <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Users size={16}/> Users ({players.length})
            </h3>

            <div className="space-y-3">
              {players.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 group hover:border-blue-500/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${p.role === 'player' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${p.role === 'player' ? 'text-blue-400' : 'text-slate-500'}`}>
                        {p.role}
                      </p>
                    </div>
                  </div>
                  
                  {gameState === "WAITING" && (
                    <button 
                      onClick={() => toggleRole(p.id)}
                      className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-800 transition-all"
                    >
                      {p.role === 'player' ? <User size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
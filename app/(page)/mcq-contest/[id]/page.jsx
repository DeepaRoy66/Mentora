"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Users, ShieldCheck, User, Eye, Loader2, ArrowRight, X, AlertTriangle, Settings2, Check } from "lucide-react";

export default function AdminDashboard() {
  const params = useParams();
  const router = useRouter();
  
  // --- State ---
  const [adminName, setAdminName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("WAITING");
  const [loading, setLoading] = useState(false);
  
  const [playerLimit, setPlayerLimit] = useState(10);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState("");
  const [configLoading, setConfigLoading] = useState(false);

  const [toggleError, setToggleError] = useState(""); 
  const [socket, setSocket] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // --- FIX: Cleanup generic data on session change ---
  useEffect(() => {

    localStorage.removeItem("quiz_uid");
    localStorage.removeItem("quiz_name");
    localStorage.removeItem("quiz_role");
  }, [params.id]);

  // --- WebSocket Connection ---
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
        if (msg.payload.config) {
            setPlayerLimit(msg.payload.config.playerLimit);
            setTempLimit(msg.payload.config.playerLimit);
        }

        if (msg.payload.state !== "WAITING") {
          router.push(`/mcq-contest/match/${params.id}`);
        }
      } 
      else if (msg.type === "SESSION_CANCELLED") {
          // Clean up specific session data
          localStorage.removeItem(`admin_uid_${params.id}`);
          // Also clean generic data to be safe
          localStorage.removeItem("quiz_uid");
          localStorage.removeItem("quiz_name");
          localStorage.removeItem("quiz_role");
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

  // --- Handlers ---
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
      
      // Save SPECIFIC session data
      localStorage.setItem(`admin_uid_${params.id}`, data.id);
      
      // Save GLOBAL generic data for MatchPage usage
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

  // --- Render: Login View ---
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="bg-black text-white p-4 rounded-xl shadow-md">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black text-black tracking-tight">Admin Entry</h2>
            <p className="text-gray-500 text-sm font-medium">Access the control panel</p>
          </div>
          
          <input 
            className="w-full p-4 bg-white border-2 border-black rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black text-lg font-bold transition-all"
            placeholder="Enter Admin Name"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
          />
          
          <button 
            onClick={handleAdminJoin} 
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-lg font-black text-lg flex justify-center items-center gap-2 hover:bg-neutral-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Access Panel <ArrowRight size={20}/></>}
          </button>
        </div>
      </div>
    );
  }

  // --- Render: Dashboard ---
  return (
    <div className="min-h-screen bg-white text-black p-6 md:p-12">
      
      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 text-center">
            <div className="mx-auto bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mb-4 border-2 border-black">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-black mb-2">Cancel Match?</h3>
            <p className="text-gray-600 mb-6 text-sm">This will end the session and disconnect all players immediately.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-white border-2 border-black hover:bg-gray-50 text-black font-bold transition-colors">Keep</button>
              <button onClick={cancelMatch} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">End It</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b-2 border-black pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-1">Lobby Management</h1>
            <p className="text-gray-600 font-mono text-sm font-bold bg-gray-100 inline-block px-2 py-1 rounded border border-gray-300">
              Session ID: <span className="text-black">{params.id}</span>
            </p>
          </div>
          <button 
            onClick={() => setShowCancelModal(true)} 
            className="flex items-center gap-2 bg-white border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-6 py-3 rounded-lg font-bold transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
          >
            <X size={18}/> CANCEL MATCH
          </button>
        </header>

        {/* Toggle Error Alert */}
        {toggleError && (
            <div className="mb-6 bg-white text-red-600 p-4 rounded-lg text-sm border-2 border-red-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="text-red-600" size={20} />
                <span className="font-bold">{toggleError}</span>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Controls */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Match Controls */}
            <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <div className="bg-black text-white p-1 rounded"><Play size={20} fill="white" /></div> 
                  Controls
                </h3>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Status</span>
              </div>
              
              <div className="bg-gray-50 border-2 border-black rounded-lg p-8 text-center space-y-6 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
                
                <div>
                  <h2 className="text-3xl font-black mb-2">Ready to Launch?</h2>
                  <p className="text-gray-600 font-medium">
                    {players.length} User{players.length !== 1 && 's'} currently in the lobby.
                  </p>
                </div>
                
                <button 
                  onClick={startGame}
                  disabled={loading || players.length === 0}
                  className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-500 text-white py-5 rounded-lg font-black text-xl flex items-center justify-center gap-4 transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "START MATCH"}
                  <ArrowRight />
                </button>
              </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                    <div className="bg-black text-white p-1 rounded"><Settings2 size={20} /></div>
                    Configuration
                </h3>
                <div className="bg-gray-50 border-2 border-black rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-black font-bold text-sm uppercase tracking-wider mb-1">Contestant Limit</p>
                            <p className="text-gray-500 text-xs font-medium">Maximum allowed players</p>
                        </div>
                        
                        <div className="w-full sm:w-auto">
                            {!isEditingLimit ? (
                                <div 
                                    onClick={() => {
                                        setTempLimit(playerLimit);
                                        setIsEditingLimit(true);
                                    }}
                                    className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-black rounded-lg cursor-pointer hover:bg-gray-100 flex items-center justify-center gap-2 font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
                                >
                                    <span className="text-xl">{playerLimit}</span>
                                    <Users size={18} className="text-gray-500"/>
                                </div>
                            ) : (
                                <div className="flex items-center gap-0 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                    <input 
                                        type="number"
                                        value={tempLimit}
                                        onChange={(e) => setTempLimit(e.target.value)}
                                        className="w-20 bg-transparent text-black font-black text-center p-3 focus:outline-none border-r border-gray-200"
                                    />
                                    <button 
                                        onClick={handleUpdateLimit}
                                        disabled={configLoading || !tempLimit}
                                        className="bg-black hover:bg-neutral-800 text-white px-4 py-3 disabled:opacity-50 transition-colors"
                                    >
                                        {configLoading ? <Loader2 size={16} className="animate-spin"/> : <Check size={20}/>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

          </div>

          {/* Right Column: Users */}
          <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 h-fit">
             <h3 className="text-xl font-black text-black mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2"><Users size={20}/> Users</span>
                <span className="bg-black text-white px-2 py-1 rounded text-sm">{players.length}</span>
            </h3>

            <div className="space-y-3">
              {players.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white border-2 border-gray-200 p-3 rounded-lg group hover:border-black transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center font-black text-sm border-2 ${p.role === 'player' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-sm truncate text-black">{p.name}</p>
                      <p className={`text-[10px] font-black uppercase tracking-wider ${p.role === 'player' ? 'text-gray-800' : 'text-gray-400'}`}>
                        {p.role}
                      </p>
                    </div>
                  </div>
                  
                  {gameState === "WAITING" && (
                    <button 
                      onClick={() => toggleRole(p.id)}
                      className="p-2 border-2 border-gray-200 hover:border-black rounded-md text-gray-400 hover:text-black transition-all active:bg-gray-100"
                      title="Toggle Role"
                    >
                      {p.role === 'player' ? <User size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              ))}
              
              {players.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm font-medium">
                      Waiting for players...
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
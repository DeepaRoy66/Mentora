"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Users, LayoutList, ShieldAlert, CheckCircle, LogOut, X, AlertTriangle, Clock } from "lucide-react";

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  
  // --- State (UNCHANGED LOGIC) ---
  const [userData, setUserData] = useState(null);
  const [gameState, setGameState] = useState("WAITING"); 
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [winners, setWinners] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); 
  const [breakTimeLeft, setBreakTimeLeft] = useState(0); 
  
  const [socket, setSocket] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // NEW: Custom Alert State
  const [customAlert, setCustomAlert] = useState({ isOpen: false, message: "", action: null });

  const syncTimer = (endTime, isBreak = false) => {
    const now = Date.now() / 1000;
    const diff = Math.round(endTime - now);
    if (isBreak) {
        setBreakTimeLeft(Math.max(0, diff));
    } else {
        setTimeLeft(Math.max(0, diff));
    }
  };

  // Helper to clear ALL session data
  const clearSessionData = () => {
      localStorage.removeItem("quiz_uid");
      localStorage.removeItem("quiz_role");
      localStorage.removeItem("quiz_name");
      localStorage.removeItem(`admin_uid_${params.id}`);
  };

  const confirmLeave = async () => {
    setShowLeaveModal(false);
    const uid = localStorage.getItem("quiz_uid");
    
    // Attempt to notify server
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/leave`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ uid })
        });
    } catch (e) {
        console.error("Leave request failed", e);
    } finally {
        // Regardless of API success, clear local data and leave
        clearSessionData();
        router.push("/");
    }
  };

  useEffect(() => {
    const adminUid = localStorage.getItem(`admin_uid_${params.id}`);
    const playerUid = localStorage.getItem("quiz_uid");
    const name = localStorage.getItem("quiz_name") || "Admin";
    const uid = adminUid || playerUid;

    if (!uid) return router.push(`/mcq-contest/join/${params.id}`);
    setUserData({ uid, name });

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = window.location.host.includes('localhost') 
      ? window.location.host.replace(':3000', ':8000') 
      : window.location.host;
      
    const ws = new WebSocket(`${protocol}://${wsHost}/mcq/ws/${params.id}/${uid}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      if (msg.type === "INIT") {
        setPlayers(msg.payload.players);
        setGameState(msg.payload.state);
        const me = msg.payload.players.find(p => p.id === uid);
        if (me) setUserData(prev => ({ ...prev, role: me.role }));
      } 
      else if (msg.type === "SESSION_CANCELLED") {
          // Replaced Alert with Custom Alert
          setCustomAlert({ 
              isOpen: true, 
              message: "The admin cancelled the session.", 
              action: () => {
                  clearSessionData();
                  router.push("/");
              }
          });
      }
      else if (msg.type === "NEW_QUESTION") {
        setGameState("QUESTION");
        setCurrentQuestion(msg.payload);
        setSelectedAnswer(null);
        setBreakTimeLeft(0); 
        syncTimer(msg.payload.endTime, false);
      }
      else if (msg.type === "CURRENT_QUESTION") {
        setGameState("QUESTION");
        setCurrentQuestion(msg.payload);
        setSelectedAnswer(null);
        syncTimer(msg.payload.endTime, false);
      }
      else if (msg.type === "ROUND_RESULT") {
        setGameState("LEADERBOARD");
        setPlayers(msg.leaderboard);
        setTimeLeft(0); 
        if (msg.break_end) {
            syncTimer(msg.break_end, true);
        }
      }
      else if (msg.type === "GAME_OVER") {
        setGameState("FINISHED");
        setPlayers(msg.payload);
        setWinners(msg.winners);
        setAllQuestions(msg.questions);
        setBreakTimeLeft(0);
      }
    };
    
    setSocket(ws);
    return () => ws.close();
  }, [params.id]);

  // Timers (UNCHANGED LOGIC)
  useEffect(() => {
    if (gameState === "QUESTION" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, gameState]);

  useEffect(() => {
    if (gameState === "LEADERBOARD" && breakTimeLeft > 0) {
      const timer = setInterval(() => setBreakTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [breakTimeLeft, gameState]);

  const isSpectator = userData?.role === "spectator";
  const leaderboardPlayers = players.filter(p => p.role === 'player');

  return (
    <div className="min-h-screen bg-white text-black p-4 font-sans relative">
        
        {/* --- GLOBAL ALERT POPUP --- */}
        {customAlert.isOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 text-center animate-in fade-in zoom-in">
                    <div className="mx-auto bg-black text-white rounded-full w-12 h-12 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-black mb-2">Attention</h3>
                    <p className="text-gray-700 mb-6 leading-relaxed">{customAlert.message}</p>
                    <button
                        onClick={() => {
                            if(customAlert.action) customAlert.action();
                            else setCustomAlert({ isOpen: false, message: "", action: null });
                        }}
                        className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-neutral-800 transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px]"
                    >
                        OK
                    </button>
                </div>
            </div>
        )}

        {/* --- HEADER / NAV --- */}
        <div className="fixed top-4 right-4 z-50">
            <button 
                onClick={() => setShowLeaveModal(true)} 
                className="flex items-center gap-2 bg-white border-2 border-black text-black hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px]"
            >
                <LogOut size={18}/> LEAVE MATCH
            </button>
        </div>

        {/* --- LEAVE MODAL --- */}
        {showLeaveModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 text-center">
                    <h3 className="text-xl font-black mb-2">Leave Match?</h3>
                    <p className="text-gray-600 mb-6 text-sm">Leaving will reset your local session data.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-3 bg-white border-2 border-black hover:bg-gray-50 text-black font-bold transition-colors rounded-lg">STAY</button>
                        <button onClick={confirmLeave} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold transition-colors border-2 border-red-600 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px]">LEAVE</button>
                    </div>
                </div>
            </div>
        )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 pt-20">
        
        {/* MAIN GAME AREA */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* WAITING STATE */}
          {gameState === "WAITING" && (
            <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
               <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black">
                    <Users className="text-black animate-pulse" size={40} />
               </div>
               <h2 className="text-3xl font-black mb-4">Waiting for Host to Start...</h2>
               <div className="flex justify-center gap-3 mt-8 flex-wrap">
                   {players.map((p, i) => (
                       <div key={p.id} className="bg-white border-2 border-black px-4 py-2 rounded-lg font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                           {p.name}
                           <span className="text-[10px] bg-gray-200 px-1 rounded ml-2 text-gray-600 uppercase">{p.role}</span>
                       </div>
                   ))}
               </div>
               {players.length === 0 && <p className="text-gray-500 mt-4 font-bold italic">Lobby is empty</p>}
            </div>
          )}

          {/* SPECTATOR BANNER */}
          {isSpectator && gameState === "QUESTION" && (
            <div className="bg-amber-100 border-2 border-black rounded-lg p-4 text-center flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <ShieldAlert className="text-amber-700" />
              <p className="text-amber-800 font-black uppercase tracking-wider text-sm">Spectator Mode Active</p>
            </div>
          )}

          {/* QUESTION STATE */}
          {!isSpectator && gameState === "QUESTION" && currentQuestion && (
            <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 animate-in zoom-in duration-300 relative overflow-hidden">
               {/* Top Bar */}
               <div className="flex justify-between items-center mb-8">
                  <div className="bg-black text-white px-4 py-2 rounded font-black text-xs uppercase tracking-wider">
                    Q {currentQuestion.q_num} / {currentQuestion.total}
                  </div>
                  <div className={`flex items-center gap-2 bg-white border-2 ${timeLeft < 5 ? 'border-red-600 text-red-600' : 'border-black text-black'} px-4 py-2 rounded font-mono font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                    <Clock size={20} className={timeLeft < 5 ? "animate-pulse" : ""}/>
                    {timeLeft}s
                  </div>
               </div>

               {/* Question Text */}
               <h2 className="text-3xl md:text-5xl font-black text-black leading-tight mb-10">
                 {currentQuestion.text}
               </h2>

               {/* Options */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={!!selectedAnswer}
                      onClick={() => {
                        setSelectedAnswer(opt);
                        socket.send(JSON.stringify({ type: "SUBMIT_ANSWER", answer: opt }));
                      }}
                      className={`p-6 text-left text-lg font-bold rounded-lg border-2 transition-all duration-100 flex items-center gap-4 ${
                        selectedAnswer === opt 
                        ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[2px]" 
                        : "bg-white border-black text-black hover:bg-gray-50 hover:border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                      }`}
                    >
                        <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs shrink-0">
                           {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {/* LEADERBOARD / ROUND RESULT */}
          {gameState === "LEADERBOARD" && (
            <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-10 text-center animate-in fade-in">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                    <CheckCircle className="text-green-600" size={32} />
                </div>
                <h2 className="text-2xl font-black mb-2 text-gray-600 uppercase tracking-widest">Round Finished</h2>
                <p className="text-5xl font-black text-black">Get Ready!</p>
                
                {/* Break Timer */}
                {breakTimeLeft > 0 && (
                    <div className="mt-8 inline-block bg-black text-white px-8 py-4 rounded-lg font-mono font-bold text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        Next: {breakTimeLeft}s
                    </div>
                )}
            </div>
          )}

          {/* FINISHED STATE */}
          {gameState === "FINISHED" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
              
              {/* Winner Card */}
              <div className="bg-yellow-300 border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>
                <Trophy className="mx-auto text-yellow-600 drop-shadow-sm mb-6" size={80} />
                <h2 className="text-4xl md:text-5xl font-black text-black mb-6 uppercase">
                  {winners.length > 1 ? "Champions!" : "Winner!"}
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  {winners.map(w => (
                    <div key={w.id} className="bg-white border-2 border-black px-8 py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                       <p className="text-2xl font-black text-black">{w.name}</p>
                       <p className="text-gray-600 font-bold">{w.score} PTS</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Review */}
              <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-900">
                  <div className="bg-black text-white p-1 rounded"><LayoutList size={20}/></div>
                  FULL REVIEW
                </h3>
                <div className="space-y-4">
                  {allQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="text-black font-bold text-xs uppercase mb-1 block border-b-2 border-black inline-block pb-1">Q{idx+1}</span>
                        <p className="text-lg font-bold text-gray-800">{q.text}</p>
                      </div>
                      <div className="bg-green-500 text-white border-2 border-black px-4 py-2 rounded font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {q.correct}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR LEADERBOARD */}
        <div className="lg:col-span-1">
          <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sticky top-6">
             <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black">
                <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Users size={16}/> LIVE RANK
                </h3>
                <span className="bg-black text-white text-[10px] font-black px-2 py-1 rounded">LIVE</span>
             </div>
             <div className="space-y-3">
                {leaderboardPlayers.length > 0 ? leaderboardPlayers.map((p, i) => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    p.id === userData?.uid 
                    ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-105" 
                    : "bg-gray-50 border-gray-200 text-black hover:border-black"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-xs w-6 ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>#{i+1}</span>
                      <span className="font-bold text-sm truncate max-w-[80px]">{p.name}</span>
                    </div>
                    <span className="font-mono font-black text-sm">{p.score}</span>
                  </div>
                )) : <p className="text-center text-gray-500 text-xs font-bold italic mt-4">No active players</p>}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
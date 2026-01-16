"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Users, LayoutList, ShieldAlert, CheckCircle, LogOut, X } from "lucide-react";

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  
  const [userData, setUserData] = useState(null);
  const [gameState, setGameState] = useState("WAITING"); 
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [winners, setWinners] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // Question Timer
  const [breakTimeLeft, setBreakTimeLeft] = useState(0); // Break Timer
  
  const [socket, setSocket] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const syncTimer = (endTime, isBreak = false) => {
    const now = Date.now() / 1000;
    const diff = Math.round(endTime - now);
    if (isBreak) {
        setBreakTimeLeft(Math.max(0, diff));
    } else {
        setTimeLeft(Math.max(0, diff));
    }
  };

  const confirmLeave = async () => {
    setShowLeaveModal(false);
    const uid = localStorage.getItem("quiz_uid");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/${params.id}/leave`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ uid })
    });
    localStorage.removeItem("quiz_uid");
    localStorage.removeItem("quiz_role");
    localStorage.removeItem("quiz_name");
    router.push("/");
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
          alert("The admin cancelled the session.");
          localStorage.removeItem("quiz_uid");
          router.push("/");
      }
      else if (msg.type === "NEW_QUESTION") {
        setGameState("QUESTION");
        setCurrentQuestion(msg.payload);
        setSelectedAnswer(null);
        setBreakTimeLeft(0); // Clear break timer
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
        setTimeLeft(0); // Clear question timer
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

  // Timers
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
        <div className="fixed top-4 right-4 z-50">
            <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors shadow-lg border border-slate-700">
                <LogOut size={16}/> Leave Match
            </button>
        </div>

        {/* Custom Leave Modal */}
        {showLeaveModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl">
                    <h3 className="text-2xl font-black text-white mb-2">Leave Match?</h3>
                    <p className="text-slate-400 mb-6">You cannot rejoin after leaving.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Stay</button>
                        <button onClick={confirmLeave} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors">Leave</button>
                    </div>
                </div>
            </div>
        )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 pt-16">
        
        {/* MAIN GAME AREA */}
        <div className="lg:col-span-3 space-y-6">
          
          {gameState === "WAITING" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center animate-in fade-in">
               <Users className="mx-auto text-blue-500 mb-6 animate-pulse" size={60} />
               <h2 className="text-3xl font-black mb-4">Waiting for Host to Start...</h2>
               <div className="flex justify-center gap-4 mt-8 flex-wrap">
                   {players.map((p, i) => (
                       <div key={p.id} className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700">
                           <span className="font-bold">{p.name}</span>
                           <span className="text-xs text-slate-400 ml-2 uppercase">({p.role})</span>
                       </div>
                   ))}
               </div>
               {players.length === 0 && <p className="text-slate-500 mt-4 italic">Lobby is empty</p>}
            </div>
          )}

          {isSpectator && gameState === "QUESTION" && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
              <ShieldAlert className="mx-auto text-amber-500 mb-2" />
              <p className="text-amber-500 font-bold uppercase tracking-wider text-sm">Spectator Mode Active</p>
            </div>
          )}

          {!isSpectator && gameState === "QUESTION" && currentQuestion && (
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl animate-in zoom-in duration-300">
               <div className="flex justify-between items-center mb-8">
                  <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-black text-sm uppercase">
                    Question {currentQuestion.q_num} of {currentQuestion.total}
                  </div>
                  <div className={`text-3xl font-mono font-black ${timeLeft < 5 ? 'text-red-600 animate-bounce' : 'text-slate-900'}`}>
                    {timeLeft}s
                  </div>
               </div>
               <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-10">
                 {currentQuestion.text}
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={!!selectedAnswer}
                      onClick={() => {
                        setSelectedAnswer(opt);
                        socket.send(JSON.stringify({ type: "SUBMIT_ANSWER", answer: opt }));
                      }}
                      className={`p-6 text-left text-xl font-bold rounded-2xl border-b-4 transition-all duration-100 ${
                        selectedAnswer === opt 
                        ? "bg-blue-600 border-blue-800 text-white translate-y-1 shadow-none" 
                        : "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200 active:translate-y-1"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {gameState === "LEADERBOARD" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center animate-in fade-in">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold mb-2 text-slate-400 uppercase tracking-widest">Round Finished</h2>
                <p className="text-5xl font-black text-white">Get Ready!</p>
                {/* BREAK TIMER */}
                {breakTimeLeft > 0 && (
                    <div className="mt-6 text-blue-400 font-mono font-bold text-xl">
                        Next question in {breakTimeLeft}s
                    </div>
                )}
            </div>
          )}

          {gameState === "FINISHED" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
              <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
                <Trophy className="mx-auto text-white drop-shadow-lg mb-6" size={100} />
                <h2 className="text-5xl font-black text-white mb-4 uppercase">
                  {winners.length > 1 ? "The Champions!" : "Match Winner!"}
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  {winners.map(w => (
                    <div key={w.id} className="bg-white/20 backdrop-blur-xl px-10 py-4 rounded-3xl border border-white/30">
                       <p className="text-3xl font-black text-white">{w.name}</p>
                       <p className="text-white/80 font-bold">{w.score} PTS</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <LayoutList className="text-blue-500" /> FULL QUESTION REVIEW
                </h3>
                <div className="space-y-4">
                  {allQuestions.map((q, idx) => (
                    <div key={idx} className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="text-blue-500 font-bold text-xs uppercase mb-1 block">Question {idx+1}</span>
                        <p className="text-lg font-bold">{q.text}</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-2 rounded-xl font-black">
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-6 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xs text-slate-500 uppercase tracking-tighter flex items-center gap-2">
                  <Users size={14}/> Live Rankings
                </h3>
                <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black px-2 py-1 rounded">LIVE</span>
             </div>
             <div className="space-y-3">
                {leaderboardPlayers.length > 0 ? leaderboardPlayers.map((p, i) => (
                  <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    p.id === userData?.uid ? "bg-blue-600 border-blue-400 ring-4 ring-blue-500/20 scale-105" : "bg-slate-950 border-slate-800"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-xs ${i === 0 ? 'text-yellow-400' : 'text-slate-600'}`}>#{i+1}</span>
                      <span className="font-bold text-sm truncate max-w-[80px]">{p.name}</span>
                    </div>
                    <span className="font-mono font-black text-xs">{p.score}</span>
                  </div>
                )) : <p className="text-center text-slate-600 text-xs italic mt-4">No active players</p>}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
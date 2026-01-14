"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Users, LayoutList, ShieldAlert, CheckCircle } from "lucide-react";

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
  const [timeLeft, setTimeLeft] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. Find who I am (Admin or Player)
    const adminUid = localStorage.getItem(`admin_uid_${params.id}`);
    const playerUid = localStorage.getItem("quiz_uid");
    const name = localStorage.getItem("quiz_name") || "Admin";
    const uid = adminUid || playerUid;

    if (!uid) return router.push(`/mcq-contest/join/${params.id}`);
    setUserData({ uid, name });

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host.replace(":3000", ":8000")}/mcq/ws/${params.id}/${uid}`);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "INIT") {
        setPlayers(msg.payload.players);
        setGameState(msg.payload.state);
        const me = msg.payload.players.find(p => p.id === uid);
        if (me) setUserData(prev => ({ ...prev, role: me.role }));
      } 
      else if (msg.type === "NEW_QUESTION") {
        setGameState("QUESTION");
        setCurrentQuestion(msg.payload);
        setSelectedAnswer(null);
        setTimeLeft(Math.round(msg.payload.endTime - (Date.now() / 1000)));
      }
      else if (msg.type === "ROUND_RESULT") {
        setGameState("LEADERBOARD");
        setPlayers(msg.leaderboard);
      }
      else if (msg.type === "GAME_OVER") {
        setGameState("FINISHED");
        setPlayers(msg.payload);
        setWinners(msg.winners);
        setAllQuestions(msg.questions);
      }
    };
    setSocket(ws);
    return () => ws.close();
  }, [params.id]);

  useEffect(() => {
    if (gameState !== "QUESTION" || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const isSpectator = userData?.role === "spectator";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* MAIN GAME AREA */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Waiting for Start */}
          {gameState === "WAITING" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center">
               <Users className="mx-auto text-blue-500 mb-6 animate-pulse" size={60} />
               <h2 className="text-3xl font-black">Waiting for Match to Start...</h2>
            </div>
          )}

          {/* Spectator Warning */}
          {isSpectator && gameState === "QUESTION" && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
              <ShieldAlert className="mx-auto text-amber-500 mb-2" />
              <p className="text-amber-500 font-bold uppercase tracking-wider text-sm">Spectator Mode Active</p>
            </div>
          )}

          {/* Question View (Active Players Only) */}
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

          {/* Leaderboard/Round Result Intermission */}
          {gameState === "LEADERBOARD" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center animate-in fade-in">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold mb-2 text-slate-400 uppercase tracking-widest">Round Finished</h2>
                <p className="text-5xl font-black text-white">Get Ready!</p>
            </div>
          )}

          {/* GAME FINISHED - WINNER TROPHY & REVIEW */}
          {gameState === "FINISHED" && (
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
              {/* TROPHY SECTION */}
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

              {/* FULL QUESTION REVIEW */}
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

        {/* SIDEBAR LEADERBOARD (Always Visible) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-6 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xs text-slate-500 uppercase tracking-tighter flex items-center gap-2">
                  <Users size={14}/> Live Rankings
                </h3>
                <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black px-2 py-1 rounded">LIVE</span>
             </div>
             <div className="space-y-3">
                {players.map((p, i) => (
                  <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    p.id === userData?.uid ? "bg-blue-600 border-blue-400 ring-4 ring-blue-500/20 scale-105" : "bg-slate-950 border-slate-800"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-xs ${i === 0 ? 'text-yellow-400' : 'text-slate-600'}`}>#{i+1}</span>
                      <span className="font-bold text-sm truncate max-w-[80px]">{p.name}</span>
                    </div>
                    <span className="font-mono font-black text-xs">{p.score}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
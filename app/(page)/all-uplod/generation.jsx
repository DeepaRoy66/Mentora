'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { authFetch } from '@/lib/api';
import { 
  FileText, MessageSquare, Brain, 
  Maximize2, Minimize2, ChevronUp, ChevronDown, 
  Loader2, AlertCircle, X, CheckCircle 
} from 'lucide-react';

export default function StudyAssistant({ pdfUrl, docTitle }) {
  const { data: session } = useSession();
  const containerRef = useRef(null);
  
  // State Management
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Results State
  const [resultText, setResultText] = useState('');
  const [quizData, setQuizData] = useState([]);
  const [qaData, setQaData] = useState([]);
  
  // Interaction State
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [visibleHints, setVisibleHints] = useState({});
  const [visibleAnswers, setVisibleAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // --- Handlers ---

  const toggleCategory = (category) => {
    if (activeCategory === category) setActiveCategory(null);
    else setActiveCategory(category);
  };

  const handleError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  const fetchPdfAsFile = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], "document.pdf", { type: "application/pdf" });
  };

  const processFile = async (specificMode) => {
    if (!pdfUrl) return;
    setError('');
    setLoading(true);
    setResultText('');
    setQuizData([]);
    setQaData([]);
    setSubmitted(false);
    setUserAnswers({});
    setVisibleHints({});
    setVisibleAnswers({});

    try {
      const file = await fetchPdfAsFile(pdfUrl);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', specificMode);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Server Error');

      const result = await response.json();

      if (specificMode === 'mcq') {
        try { setQuizData(JSON.parse(result.data)); } 
        catch (e) { handleError("Failed to parse quiz data."); }
      } 
      else if (specificMode === 'qa_short' || specificMode === 'qa_long') {
        try { setQaData(JSON.parse(result.data)); } 
        catch (e) { handleError("Failed to parse Q&A data."); }
      } 
      else {
        setResultText(result.data);
      }
      
      setActiveCategory(null);

    } catch (error) {
      console.error(error);
      handleError("Server Error. Could not process this document.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (qIndex, key) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: key }));
  };

  const toggleHint = (index) => {
    setVisibleHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleAnswer = (index) => {
    setVisibleAnswers((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    let currentScore = 0;
    quizData.forEach((q, index) => {
      if (userAnswers[index] === q.correct) currentScore++;
    });
    setScore(currentScore);
    setSubmitted(true);

    if (session?.user?.email) {
      setSubmittingQuiz(true);
      try {
        const quizId = docTitle ? `${docTitle}-${Date.now()}` : `quiz-${Date.now()}`;
        await authFetch('/api/quiz/complete', {
          method: 'POST',
          body: JSON.stringify({ quizId, score: currentScore, totalQuestions: quizData.length })
        });
      } catch (error) {
        console.error(error);
      } finally {
        setSubmittingQuiz(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        handleError("Error enabling fullscreen");
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const getOptionClass = (qIndex, key, correctKey) => {
    const isSelected = userAnswers[qIndex] === key;
    const baseClass = "block p-3 mb-2 rounded-xl border cursor-pointer transition-all duration-200 text-sm md:text-base flex items-start gap-3";
    const lightDark = "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300";
    
    if (!submitted) {
      return isSelected 
        ? `${baseClass} bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-500 text-indigo-900 dark:text-indigo-100` 
        : `${baseClass} ${lightDark} hover:bg-gray-100 dark:hover:bg-slate-700`;
    } else {
      if (key === correctKey) return `${baseClass} bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-500 text-green-800 dark:text-green-200 opacity-80`;
      else if (isSelected && key !== correctKey) return `${baseClass} bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-500 text-red-800 dark:text-red-200`;
      else return `${baseClass} ${lightDark} opacity-50`;
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col h-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden transition-colors duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            {/* Replaced BrainCircuit with Brain */}
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">AI Assistant</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{docTitle}</p>
          </div>
        </div>
        <button onClick={toggleFullscreen} className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-50 animate-fade-in-down">
          <div className="bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-100 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto hover:bg-red-100 dark:hover:bg-red-800 rounded p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
        
        {/* --- MAIN ACTION BUTTONS --- */}
        <div className="grid gap-3 mb-6">
          
          {/* Summary Button */}
          <button
            onClick={() => toggleCategory('summary')}
            className={`w-full p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${
              activeCategory === 'summary'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-5 h-5 ${activeCategory === 'summary' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
              <span>Summary</span>
            </div>
            {activeCategory === 'summary' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />}
          </button>

          {/* Q&A Button */}
          <button
            onClick={() => toggleCategory('qa')}
            className={`w-full p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group ${
              activeCategory === 'qa'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Replaced MessageSquareQuestion with MessageSquare */}
              <MessageSquare className={`w-5 h-5 ${activeCategory === 'qa' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
              <span>Q&A</span>
            </div>
            {activeCategory === 'qa' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />}
          </button>

          {/* Quiz Button (Direct) */}
          <button
            onClick={() => processFile('mcq')}
            disabled={loading}
            className="w-full p-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              {/* Replaced BrainCircuit with Brain */}
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Create MCQ Quiz</span>
            </div>
            <span className="text-xs opacity-50 group-hover:opacity-100 font-bold">RUN &rarr;</span>
          </button>
        </div>

        {/* --- EXPANDED OPTIONS --- */}
        
        {activeCategory === 'summary' && (
          <div className="flex gap-2 mb-6 animate-fade-in">
            <button onClick={() => processFile('summary_short')} disabled={loading} className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all">Short</button>
            <button onClick={() => processFile('summary_long')} disabled={loading} className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all">Detailed</button>
          </div>
        )}

        {activeCategory === 'qa' && (
          <div className="flex gap-2 mb-6 animate-fade-in">
            <button onClick={() => processFile('qa_short')} disabled={loading} className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all">Short Q&A</button>
            <button onClick={() => processFile('qa_long')} disabled={loading} className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all">Long Q&A</button>
          </div>
        )}

        {/* --- LOADING STATE --- */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 animate-fade-in">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <span className="text-sm font-medium">Analyzing PDF content...</span>
          </div>
        )}

        {/* --- RESULTS AREA --- */}
        {(resultText || quizData.length > 0 || qaData.length > 0) && (
          <div className="mt-2 space-y-4">
            
            {/* Summary Result */}
            {resultText && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 leading-relaxed text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-300">
                {resultText}
              </div>
            )}

            {/* Quiz Result */}
            {quizData.length > 0 && (
              <div className="space-y-4">
                {quizData.map((q, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="font-bold mb-3 text-sm text-gray-900 dark:text-white">{index + 1}. {q.question}</div>
                    {Object.entries(q.options).map(([key, val]) => (
                      <div key={key} onClick={() => handleOptionClick(index, key)} className={getOptionClass(index, key, q.correct)}>
                        <span className="font-mono font-bold opacity-60">{key}.</span>
                        <span className="mt-0.5">{val}</span>
                      </div>
                    ))}
                    <button onClick={() => toggleHint(index)} className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mt-2 flex items-center gap-1 hover:underline">
                      {visibleHints[index] ? 'Hide Hint' : 'Show Hint'}
                    </button>
                    {visibleHints[index] && <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-200 border border-amber-100 dark:border-amber-800">{q.hint}</div>}
                  </div>
                ))}
                {!submitted ? (
                  <button onClick={handleSubmit} disabled={submittingQuiz} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70">
                    {submittingQuiz ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Quiz'}
                  </button>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
                    {/* Replaced CheckCircle2 with CheckCircle */}
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <div className="text-green-800 dark:text-green-200 font-bold">Score: {score} / {quizData.length}</div>
                  </div>
                )}
              </div>
            )}

            {/* Q&A Result */}
            {qaData.length > 0 && (
              <div className="space-y-3">
                {qaData.map((item, index) => (
                  <div key={index} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                    <div className="flex gap-3 mb-2">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                        {index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug pt-0.5">{item.question}</h4>
                    </div>
                    <div className="ml-9">
                      {!visibleAnswers[index] ? (
                        <button onClick={() => toggleAnswer(index)} className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors">
                          <span>Show Answer</span>
                        </button>
                      ) : (
                        <div className="animate-fade-in">
                          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {item.answer}
                          </div>
                          <button onClick={() => toggleAnswer(index)} className="text-xs text-gray-400 mt-2 hover:text-gray-600 dark:hover:text-gray-200 underline">Hide</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
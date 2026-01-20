'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/api';

export default function StudyAssistant() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State Management
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null); 
  const [showAuthModal, setShowAuthModal] = useState(false);
  
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

  // Refs
  const fileInputRef = useRef(null);

  // --- Auth Guard Logic ---
  const checkAuth = (e) => {
    if (status === 'unauthenticated') {
      if (e) {
        e.preventDefault();
        e.stopPropagation(); // Stops the click from reaching the hidden input
      }
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // --- Redirection Handler ---
  const handleGoHome = () => {
    setShowAuthModal(false);
    router.push('/'); 
  };

  // --- Handlers ---

  const handleFileClick = (e) => {
    // If not logged in, show modal and STOP. 
    // If logged in, open the file picker.
    if (checkAuth(e)) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!checkAuth(e)) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    if (file.type !== 'application/pdf') {
      alert("PDF only.");
      return;
    }
    setFile(file);
    setResultText('');
    setQuizData([]);
    setQaData([]);
    setUserAnswers({});
    setVisibleAnswers({});
    setSubmitted(false);
    setActiveCategory(null);
  };

  const toggleCategory = (category) => {
    if (!checkAuth()) return;
    if (activeCategory === category) {
      setActiveCategory(null);
    } else {
      setActiveCategory(category);
    }
  };

  const processFile = async (specificMode) => {
    if (!checkAuth()) return;
    if (!file) return;

    setLoading(true);
    setResultText('');
    setQuizData([]);
    setQaData([]);
    setSubmitted(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', specificMode);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Server Error');
      const result = await response.json();

      if (specificMode === 'mcq') {
        try { setQuizData(JSON.parse(result.data)); } catch (e) { alert("Quiz failed."); }
      } 
      else if (specificMode === 'qa_short' || specificMode === 'qa_long') {
        try { setQaData(JSON.parse(result.data)); } catch (e) { alert("Q&A failed."); }
      } 
      else {
        setResultText(result.data);
      }
      setActiveCategory(null);
    } catch (error) {
      alert("Server Error.");
    } finally {
      setLoading(false);
    }
  };

  const getOptionClass = (qIndex, key, correctKey) => {
    const isSelected = userAnswers[qIndex] === key;
    const baseClass = "block p-3 mb-2 bg-slate-50 border border-gray-200 rounded cursor-pointer transition-colors duration-200 hover:bg-gray-100 text-sm md:text-base";
    if (!submitted) {
      return isSelected ? `${baseClass} bg-emerald-500 text-white border-emerald-500` : baseClass;
    } else {
      if (key === correctKey) return `${baseClass} bg-emerald-500 text-white border-emerald-500 opacity-80`;
      else if (isSelected && key !== correctKey) return `${baseClass} bg-red-500 text-white border-red-500`;
      else return `${baseClass} opacity-50`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex justify-center items-start md:items-center p-4 md:p-6 font-sans text-gray-800">
      
      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">You have to login first to generate summary and all the other functionality.</p>
            <button
              onClick={handleGoHome}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      )}

      {/* Main Container - removed pointer-events-none */}
      <div className={`w-full max-w-[800px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col my-4 md:my-0 ${showAuthModal ? 'blur-sm' : ''}`}>
        
        <header className="p-4 md:p-6 border-b border-gray-200 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-black">Study Assistant</h1>
        </header>

        <main className="p-4 md:p-8">
          
          <div 
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 md:p-10 text-center cursor-pointer relative bg-slate-50 transition-colors duration-200 hover:border-indigo-600 hover:bg-indigo-50 group"
            onClick={handleFileClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={status === 'unauthenticated'}
            />
            <span className="font-semibold text-base md:text-lg text-gray-700 group-hover:text-indigo-700 transition-colors">
              {file ? file.name : "Click to Upload PDF"}
            </span>
            {!file && <p className="text-xs text-gray-400 mt-2">or drag and drop here</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 my-5 justify-center">
            <button onClick={() => toggleCategory('summary')} className={`w-full sm:w-auto px-6 py-3 border-2 rounded text-sm font-medium ${activeCategory === 'summary' ? 'border-indigo-600 bg-indigo-100 text-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
              Summary {activeCategory === 'summary' ? '▲' : '▼'}
            </button>
            <button onClick={() => toggleCategory('qa')} className={`w-full sm:w-auto px-6 py-3 border-2 rounded text-sm font-medium ${activeCategory === 'qa' ? 'border-indigo-600 bg-indigo-100 text-indigo-600' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
              Questions {activeCategory === 'qa' ? '▲' : '▼'}
            </button>
            <button onClick={() => processFile('mcq')} className="w-full sm:w-auto px-6 py-3 border-2 rounded text-sm font-medium border-gray-200 text-gray-500 hover:bg-gray-100">
              MCQ Quiz
            </button>
          </div>

          {activeCategory === 'summary' && (
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-5 justify-center animate-fade-in">
              <button onClick={() => processFile('summary_short')} className="w-full sm:w-auto px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100">Short Summary</button>
              <button onClick={() => processFile('summary_long')} className="w-full sm:w-auto px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100">Detailed Summary</button>
            </div>
          )}

          {activeCategory === 'qa' && (
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-5 justify-center animate-fade-in">
              <button onClick={() => processFile('qa_short')} className="w-full sm:w-auto px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100">Short Question</button>
              <button onClick={() => processFile('qa_long')} className="w-full sm:w-auto px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100">Long Question</button>
            </div>
          )}

          {loading && (
            <div className="text-center my-5 text-gray-500">
              <div className="border-4 border-slate-200 border-t-indigo-600 rounded-full w-6 h-6 animate-spin mx-auto mb-2.5"></div>
              <span>Analyzing PDF content...</span>
            </div>
          )}

          {/* Result areas restored exactly */}
          {(resultText || quizData.length > 0 || qaData.length > 0) && (
            <div className="mt-6 md:mt-8">
              {resultText && <div className="bg-slate-50 p-4 md:p-6 rounded-lg leading-relaxed text-sm md:text-base whitespace-pre-wrap max-h-[500px] overflow-y-auto">{resultText}</div>}
              {quizData.length > 0 && (
                <div className="flex flex-col gap-0 mt-4">
                  {quizData.map((q, index) => (
                    <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                      <div className="font-semibold mb-4">{index + 1}. {q.question}</div>
                      {Object.entries(q.options).map(([key, val]) => (
                        <div key={key} onClick={() => { if(!submitted) setUserAnswers(p => ({...p, [index]: key})) }} className={getOptionClass(index, key, q.correct)}>
                          <strong>{key}:</strong> {val}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => window.location.reload()} className="w-full mt-6 py-3 bg-white border border-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-50 transition-colors">
                Upload New PDF
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
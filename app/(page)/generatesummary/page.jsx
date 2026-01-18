'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { authFetch } from '@/lib/api';

export default function StudyAssistant() {
  const { data: session } = useSession();
  
  // State Management
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState(''); 
  const [quizData, setQuizData] = useState([]); 
  const [activeCategory, setActiveCategory] = useState(null); // 'summary' or 'qa'
  
  // Results State
  const [resultText, setResultText] = useState(''); // Summaries
  const [quizData, setQuizData] = useState([]);     // MCQs
  const [qaData, setQaData] = useState([]);         // Q&A
  
  // Interaction State
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [visibleHints, setVisibleHints] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [visibleAnswers, setVisibleAnswers] = useState({}); 

  // Refs
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
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
    // Reset ALL results
    setResultText('');
    setQuizData([]);
    setQaData([]);
    setUserAnswers({});
    setVisibleAnswers({});
    setSubmitted(false);
    setActiveCategory(null);
  };

  const toggleCategory = (category) => {
    if (activeCategory === category) {
      setActiveCategory(null); // Close if already open
    } else {
      setActiveCategory(category); // Open new category
    }
  };

  const processFile = async (specificMode) => {
    if (!file) return;

    setLoading(true);
    // Clear previous view
    setResultText('');
    setQuizData([]);
    setQaData([]);
    setSubmitted(false);
    setUserAnswers({});
    setVisibleHints({});
    setVisibleAnswers({});

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
        try {
          setQuizData(JSON.parse(result.data));
        } catch (e) { alert("Quiz generation failed."); }
      } 
      else if (specificMode === 'qa_short' || specificMode === 'qa_long') {
        try {
          setQaData(JSON.parse(result.data));
        } catch (e) { alert("Q&A generation failed."); }
      } 
      else {
        setResultText(result.data);
      }
      
      // Close dropdown after generation
      setActiveCategory(null);

    } catch (error) {
      console.error(error);
      alert("Server Error.");
    } finally {
      setLoading(false);
    }
  };

  // MCQ Handlers
  const handleOptionClick = (qIndex, key) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: key }));
  };

  const toggleHint = (index) => {
    setVisibleHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Q&A Handlers
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

    // Call quiz completion API if user is logged in
    if (session?.user?.email) {
      setSubmittingQuiz(true);
      try {
        const quizId = file ? `${file.name}-${Date.now()}` : `quiz-${Date.now()}`;
        
        const response = await authFetch('/api/quiz/complete', {
          method: 'POST',
          body: JSON.stringify({
            quizId: quizId,
            score: currentScore,
            totalQuestions: quizData.length
          })
        });

        if (response.ok) {
          console.log('Quiz completion recorded successfully');
        } else {
          console.error('Failed to record quiz completion:', response.statusText);
        }
      } catch (error) {
        console.error('Error recording quiz completion:', error);
      } finally {
        setSubmittingQuiz(false);
      }
    }
  };

  const resetApp = () => {
    window.location.reload();
  };

  // Styles
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
      <div className="w-full max-w-[800px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col my-4 md:my-0">
        
        <header className="p-4 md:p-6 border-b border-gray-200 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-indigo-600">AI Study Assistant</h1>
        </header>

        <main className="p-4 md:p-8">
          
          {/* Upload Zone */}
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
            />
            <span className="font-semibold text-base md:text-lg text-gray-700 group-hover:text-indigo-700 transition-colors">
              {file ? file.name : "Click to Upload PDF"}
            </span>
            {!file && <p className="text-xs text-gray-400 mt-2">or drag and drop here</p>}
          </div>

          {/* --- MAIN BUTTONS ROW --- */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 my-5 justify-center">
            
            {/* 1. Summary Button (Toggles Options) */}
            <button
              onClick={() => toggleCategory('summary')}
              className={`w-full sm:w-auto px-6 py-3 md:py-2 border-2 rounded text-sm font-medium transition-colors duration-200 ${
                activeCategory === 'summary'
                  ? 'border-indigo-600 bg-indigo-100 text-indigo-600'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              Summary {activeCategory === 'summary' ? '▲' : '▼'}
            </button>

            {/* 2. Questions Button (Toggles Options) */}
            <button
              onClick={() => toggleCategory('qa')}
              className={`w-full sm:w-auto px-6 py-3 md:py-2 border-2 rounded text-sm font-medium transition-colors duration-200 ${
                activeCategory === 'qa'
                  ? 'border-indigo-600 bg-indigo-100 text-indigo-600'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              Questions {activeCategory === 'qa' ? '▲' : '▼'}
            </button>

            {/* 3. MCQ Button (Immediate Action) */}
            <button
              onClick={() => processFile('mcq')}
              className="w-full sm:w-auto px-6 py-3 md:py-2 border-2 rounded text-sm font-medium border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              MCQ Quiz
            </button>
          </div>

          {/* --- DROPDOWN OPTIONS (Conditional Rendering) --- */}
          
          {/* Summary Options */}
          {activeCategory === 'summary' && (
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-5 justify-center animate-fade-in">
              <button
                onClick={() => processFile('summary_short')}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100"
              >
                Short Summary
              </button>
              <button
                onClick={() => processFile('summary_long')}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100"
              >
                Detailed Summary
              </button>
            </div>
          )}

          {/* Q&A Options */}
          {activeCategory === 'qa' && (
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mb-5 justify-center animate-fade-in">
              <button
                onClick={() => processFile('qa_short')}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100"
              >
                Short Question
              </button>
              <button
                onClick={() => processFile('qa_long')}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100"
              >
                Long Question
              </button>
            </div>
          )}

          {/* Loader */}
          {loading && (
            <div className="text-center my-5 text-gray-500">
              <div className="border-4 border-slate-200 border-t-indigo-600 rounded-full w-6 h-6 animate-spin mx-auto mb-2.5"></div>
              <span>Analyzing PDF content...</span>
            </div>
          )}

          {/* Result Area */}
          {(resultText || quizData.length > 0 || qaData.length > 0) && (
            <div className="mt-6 md:mt-8">
              
              {/* Summary View */}
              {resultText && (
                <div className="bg-slate-50 p-4 md:p-6 rounded-lg leading-relaxed text-sm md:text-base whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                  {resultText}
                </div>
              )}

              {/* Quiz View */}
              {quizData.length > 0 && (
                <div className="flex flex-col gap-0">
                  {quizData.map((q, index) => (
                    <div key={index} className="border border-gray-200 p-4 md:p-5 rounded-lg mb-4">
                      <div className="font-semibold mb-4 text-sm md:text-base">{index + 1}. {q.question}</div>
                      {Object.entries(q.options).map(([key, val]) => (
                        <div key={key} onClick={() => handleOptionClick(index, key)} className={getOptionClass(index, key, q.correct)}>
                          <strong>{key}:</strong> {val}
                        </div>
                      ))}
                      <span onClick={() => toggleHint(index)} className="text-xs text-indigo-600 cursor-pointer underline mt-2.5 inline-block select-none">
                        {visibleHints[index] ? 'Hide Hint' : 'Show Hint'}
                      </span>
                      {visibleHints[index] && <div className="text-sm text-gray-500 bg-amber-50 p-2.5 rounded mt-2">{q.hint}</div>}
                    </div>
                  ))}
                  {!submitted ? (
                    <button onClick={handleSubmit} className="w-full py-3 md:py-3.5 bg-indigo-600 text-white rounded-md text-base font-semibold cursor-pointer hover:bg-indigo-700 shadow-md">Submit Quiz</button>
                  ) : (
                    <div className="text-center text-xl md:text-2xl font-bold my-5">Score: {score} / {quizData.length}</div>
                  )}
                </div>
              )}

              {/* Q&A View */}
              {qaData.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                    Study Questions
                  </h3>
                  
                  {qaData.map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 p-4 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                      
                      <div className="flex gap-3 md:gap-4 mb-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs md:text-sm">
                          {index + 1}
                        </span>
                        <h4 className="text-base md:text-lg font-semibold text-gray-900 pt-0.5">{item.question}</h4>
                      </div>

                      {/* Adjusted Indentation: No left margin on mobile, 3rem (ml-12) on desktop */}
                      <div className="mt-3 md:mt-0 md:ml-12">
                        {!visibleAnswers[index] ? (
                          <button 
                            onClick={() => toggleAnswer(index)}
                            className="w-full md:w-auto text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors flex items-center justify-center md:justify-start gap-2"
                          >
                            <span>👁️ Show Answer</span>
                          </button>
                        ) : (
                          <div className="animate-fade-in">
                            <div className="text-gray-700 leading-relaxed bg-slate-50 p-3 md:p-4 rounded-md border border-gray-200 text-sm md:text-base">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-emerald-600 text-xs uppercase tracking-wider">Answer</span>
                                <button 
                                  onClick={() => toggleAnswer(index)}
                                  className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
                                >
                                  Hide
                                </button>
                              </div>
                              {item.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={resetApp}
                className="w-full mt-6 md:mt-8 py-3 bg-white border border-gray-200 text-gray-800 rounded font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Upload New PDF
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
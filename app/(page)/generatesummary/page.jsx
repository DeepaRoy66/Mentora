'use client';

import { useState, useRef } from 'react';

export default function StudyAssistant() {
  // State Management
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [visibleAnswers, setVisibleAnswers] = useState({}); 

  // Refs
  const fileInputRef = useRef(null);

  // --- Handlers ---

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

  const handleSubmit = () => {
    if (submitted) return;
    let currentScore = 0;
    quizData.forEach((q, index) => {
      if (userAnswers[index] === q.correct) currentScore++;
    });
    setScore(currentScore);
    setSubmitted(true);
  };

  const resetApp = () => {
    window.location.reload();
  };

  // Styles
  const getOptionClass = (qIndex, key, correctKey) => {
    const isSelected = userAnswers[qIndex] === key;
    const baseClass = "block p-3 mb-2 bg-slate-50 border border-gray-200 rounded cursor-pointer transition-colors duration-200 hover:bg-gray-100";
    if (!submitted) {
      return isSelected ? `${baseClass} bg-emerald-500 text-white border-emerald-500` : baseClass;
    } else {
      if (key === correctKey) return `${baseClass} bg-emerald-500 text-white border-emerald-500 opacity-80`;
      else if (isSelected && key !== correctKey) return `${baseClass} bg-red-500 text-white border-red-500`;
      else return `${baseClass} opacity-50`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex justify-center items-center p-5 font-sans text-gray-800">
      <div className="w-full max-w-[800px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col">
        
        <header className="p-6 border-b border-gray-200 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">AI Study Assistant</h1>
        </header>

        <main className="p-[30px]">
          
          {/* Upload Zone */}
          <div 
            className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center cursor-pointer relative bg-slate-50 transition-colors duration-200 hover:border-indigo-600 hover:bg-indigo-50"
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
            <span className="font-semibold text-lg text-gray-700">
              {file ? file.name : "Click to Upload PDF"}
            </span>
          </div>

          {/* --- MAIN BUTTONS ROW --- */}
          <div className="flex flex-wrap gap-2.5 my-5 justify-center">
            
            {/* 1. Summary Button (Toggles Options) */}
            <button
              onClick={() => toggleCategory('summary')}
              className={`px-6 py-2 border-2 rounded text-sm font-medium transition-colors duration-200 ${
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
              className={`px-6 py-2 border-2 rounded text-sm font-medium transition-colors duration-200 ${
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
              className="px-6 py-2 border-2 rounded text-sm font-medium border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors duration-200"
            >
              MCQ Quiz
            </button>
          </div>

          {/* --- DROPDOWN OPTIONS (Conditional Rendering) --- */}
          
          {/* Summary Options */}
          {activeCategory === 'summary' && (
            <div className="flex gap-2.5 mb-5 justify-center animate-fade-in">
              <button
                onClick={() => processFile('summary_short')}
                className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100"
              >
                Short Summary
              </button>
              <button
                onClick={() => processFile('summary_long')}
                className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100"
              >
                Detailed Summary
              </button>
            </div>
          )}

          {/* Q&A Options */}
          {activeCategory === 'qa' && (
            <div className="flex gap-2.5 mb-5 justify-center animate-fade-in">
              <button
                onClick={() => processFile('qa_short')}
                className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100"
              >
                Short Question
              </button>
              <button
                onClick={() => processFile('qa_long')}
                className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700 hover:bg-indigo-100"
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
            <div className="mt-7">
              
              {/* Summary View */}
              {resultText && (
                <div className="bg-slate-50 p-5 rounded-lg leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                  {resultText}
                </div>
              )}

              {/* Quiz View */}
              {quizData.length > 0 && (
                <div className="flex flex-col gap-0">
                  {quizData.map((q, index) => (
                    <div key={index} className="border border-gray-200 p-5 rounded-lg mb-4">
                      <div className="font-semibold mb-4">{index + 1}. {q.question}</div>
                      {Object.entries(q.options).map(([key, val]) => (
                        <div key={key} onClick={() => handleOptionClick(index, key)} className={getOptionClass(index, key, q.correct)}>
                          <strong>{key}:</strong> {val}
                        </div>
                      ))}
                      <span onClick={() => toggleHint(index)} className="text-xs text-indigo-600 cursor-pointer underline mt-2.5 inline-block">
                        {visibleHints[index] ? 'Hide Hint' : 'Show Hint'}
                      </span>
                      {visibleHints[index] && <div className="text-sm text-gray-500 bg-amber-50 p-2.5 rounded mt-2">{q.hint}</div>}
                    </div>
                  ))}
                  {!submitted ? (
                    <button onClick={handleSubmit} className="w-full py-[14px] bg-indigo-600 text-white rounded-md text-base font-semibold cursor-pointer hover:bg-indigo-700">Submit Quiz</button>
                  ) : (
                    <div className="text-center text-2xl font-bold my-5">Score: {score} / {quizData.length}</div>
                  )}
                </div>
              )}

              {/* Q&A View */}
              {qaData.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Study Questions
                  </h3>
                  
                  {qaData.map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                      
                      <div className="flex gap-4 mb-4">
                        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                          {index + 1}
                        </span>
                        <h4 className="text-lg font-semibold text-gray-900 pt-1">{item.question}</h4>
                      </div>

                      <div className="ml-12">
                        {!visibleAnswers[index] ? (
                          <button 
                            onClick={() => toggleAnswer(index)}
                            className="text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-2 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-2"
                          >
                            <span>👁️ Show Answer</span>
                          </button>
                        ) : (
                          <div className="animate-fade-in">
                            <div className="text-gray-700 leading-relaxed bg-slate-50 p-4 rounded-md border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-emerald-600 text-xs uppercase tracking-wider">Answer</span>
                                <button 
                                  onClick={() => toggleAnswer(index)}
                                  className="text-gray-400 hover:text-gray-600 text-xs"
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
                className="w-full mt-8 py-2 bg-transparent border border-gray-200 text-gray-800 rounded font-semibold cursor-pointer hover:bg-gray-50"
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
'use client';

import { useState, useRef } from 'react';

export default function StudyAssistant() {
  // State Management
  const [selectedMode, setSelectedMode] = useState('summary_short');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState(''); // For summaries
  const [quizData, setQuizData] = useState([]); // For MCQs
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [visibleHints, setVisibleHints] = useState({});

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
    // Reset previous results
    setResultText('');
    setQuizData([]);
    setUserAnswers({});
    setSubmitted(false);
  };

  const selectMode = (mode) => {
    setSelectedMode(mode);
    // Auto regenerate if file exists (Same functionality as original)
    if (file) {
      processFile(mode);
    }
  };

  const processFile = async (specificMode = selectedMode) => {
    if (!file) return;

    setLoading(true);
    setResultText('');
    setQuizData([]);
    setSubmitted(false);
    setUserAnswers({});
    setVisibleHints({});

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
          const parsedQuiz = JSON.parse(result.data);
          setQuizData(parsedQuiz);
        } catch (e) {
          alert("Quiz generation failed.");
          console.error(e);
        }
      } else {
        setResultText(result.data);
      }
    } catch (error) {
      console.error(error);
      alert("Server Error.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (qIndex, key) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: key }));
  };

  const toggleHint = (index) => {
    setVisibleHints((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSubmit = () => {
    if (submitted) return;

    let currentScore = 0;
    quizData.forEach((q, index) => {
      if (userAnswers[index] === q.correct) {
        currentScore++;
      }
    });

    setScore(currentScore);
    setSubmitted(true);
  };

  const resetApp = () => {
    window.location.reload();
  };

  // --- Helper to determine Option Classes ---
  const getOptionClass = (qIndex, key, correctKey) => {
    const isSelected = userAnswers[qIndex] === key;
    const baseClass = "block p-3 mb-2 bg-slate-50 border border-gray-200 rounded cursor-pointer transition-colors duration-200 hover:bg-gray-100";
    
    if (!submitted) {
      return isSelected 
        ? `${baseClass} bg-emerald-500 text-white border-emerald-500` 
        : baseClass;
    } else {
      // Review Mode
      if (key === correctKey) {
        return `${baseClass} bg-emerald-500 text-white border-emerald-500 opacity-80`;
      } else if (isSelected && key !== correctKey) {
        return `${baseClass} bg-red-500 text-white border-red-500`;
      } else {
        return `${baseClass} opacity-50`;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex justify-center items-center p-5 font-sans text-gray-800">
      <div className="w-full max-w-[700px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
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

          {/* Mode Grid */}
          <div className="grid grid-cols-3 gap-2.5 my-5">
            {[
              { id: 'summary_short', label: 'Short' },
              { id: 'summary_long', label: 'Long' },
              { id: 'mcq', label: 'MCQ Quiz' }
            ].map((mode) => (
              <div
                key={mode.id}
                onClick={() => selectMode(mode.id)}
                className={`p-2.5 border-2 rounded text-center cursor-pointer text-sm transition-colors duration-200 ${
                  selectedMode === mode.id
                    ? 'border-indigo-600 bg-indigo-100 text-indigo-600 font-semibold'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {mode.label}
              </div>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={() => processFile()}
            disabled={!file || loading}
            className="w-full py-[14px] bg-indigo-600 text-white rounded-md text-base font-semibold cursor-pointer hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
          >
            Generate Content
          </button>

          {/* Loader */}
          {loading && (
            <div className="text-center my-5 text-gray-500">
              <div className="border-4 border-slate-200 border-t-indigo-600 rounded-full w-6 h-6 animate-spin mx-auto mb-2.5"></div>
              <span>Analyzing whole PDF...</span>
            </div>
          )}

          {/* Result Area */}
          {(resultText || quizData.length > 0) && (
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
                      
                      {/* Options */}
                      {Object.entries(q.options).map(([key, val]) => (
                        <div
                          key={key}
                          onClick={() => handleOptionClick(index, key)}
                          className={getOptionClass(index, key, q.correct)}
                        >
                          <strong>{key}:</strong> {val}
                        </div>
                      ))}

                      {/* Hint Toggle */}
                      <span 
                        onClick={() => toggleHint(index)}
                        className="text-xs text-indigo-600 cursor-pointer underline mt-2.5 inline-block"
                      >
                        {visibleHints[index] ? 'Hide Hint' : 'Show Hint'}
                      </span>
                      
                      {visibleHints[index] && (
                        <div className="text-sm text-gray-500 bg-amber-50 p-2.5 rounded mt-2">
                          {q.hint}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submit Button / Score */}
                  {!submitted ? (
                    <button onClick={handleSubmit} className="w-full py-[14px] bg-indigo-600 text-white rounded-md text-base font-semibold cursor-pointer hover:bg-indigo-700">
                      Submit Quiz
                    </button>
                  ) : (
                    <div className="text-center text-2xl font-bold my-5">
                      Score: {score} / {quizData.length}
                    </div>
                  )}
                </div>
              )}

              {/* New File Button */}
              <button 
                onClick={resetApp}
                className="w-full mt-4 py-2 bg-transparent border border-gray-200 text-gray-800 rounded font-semibold cursor-pointer hover:bg-gray-50"
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
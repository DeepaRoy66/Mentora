"use client";

import { useEffect, useState, useRef } from "react";

export default function UploadStudyPage({ params }) {
  const { id } = params;

  // DB Data
  const [pdfData, setPdfData] = useState(null);

  // Study Assistant States
  const [selectedMode, setSelectedMode] = useState("summary_short");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [quizData, setQuizData] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [visibleHints, setVisibleHints] = useState({});


  useEffect(() => {
    fetch(`/api/fetch/${id}`)
      .then((res) => res.json())
      .then((data) => setPdfData(data.data))
      .catch((err) => console.error(err));
  }, [id]);


  const processFile = async (specificMode = selectedMode) => {
    if (!pdfData?.pdfUrl) return;

    setLoading(true);
    setResultText("");
    setQuizData([]);
    setSubmitted(false);
    setUserAnswers({});
    setVisibleHints({});

    try {
      const pdfResponse = await fetch(pdfData.pdfUrl);
      const pdfBlob = await pdfResponse.blob();

      const file = new File([pdfBlob], pdfData.title + ".pdf", {
        type: "application/pdf",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", specificMode);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process_pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server Error");

      const result = await response.json();

      if (specificMode === "mcq") {
        const parsedQuiz = JSON.parse(result.data);
        setQuizData(parsedQuiz);
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
    setVisibleHints((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = () => {
    let currentScore = 0;
    quizData.forEach((q, i) => {
      if (userAnswers[i] === q.correct) currentScore++;
    });
    setScore(currentScore);
    setSubmitted(true);
  };

  const resetApp = () => {
    window.location.reload();
  };

  const getOptionClass = (qIndex, key, correctKey) => {
    const isSelected = userAnswers[qIndex] === key;
    const base =
      "block p-3 mb-2 bg-slate-50 border rounded cursor-pointer";

    if (!submitted) {
      return isSelected ? `${base} bg-indigo-600 text-white` : base;
    } else {
      if (key === correctKey) return `${base} bg-green-500 text-white`;
      if (isSelected && key !== correctKey) return `${base} bg-red-500 text-white`;
      return `${base} opacity-50`;
    }
  };

  if (!pdfData) return <p>Loading...</p>;

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* LEFT - PDF PREVIEW */}
      <div className="border-r p-3">
        <iframe
          src={pdfData.pdfUrl}
          className="w-full h-screen"
        />
      </div>

      {/* RIGHT - AI ASSISTANT */}
      <div className="p-6 overflow-y-auto">

        <h2 className="text-xl font-bold mb-3">{pdfData.title}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Uploaded by: {pdfData.uploaderEmail} | {new Date(pdfData.createdAt).toLocaleString()}
        </p>

        {/* MODE */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: "summary_short", label: "Short" },
            { id: "summary_long", label: "Long" },
            { id: "mcq", label: "MCQ" }
          ].map((mode) => (
            <div
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-2 text-center border rounded cursor-pointer ${
                selectedMode === mode.id
                  ? "bg-indigo-100 border-indigo-600"
                  : ""
              }`}
            >
              {mode.label}
            </div>
          ))}
        </div>

        <button
          onClick={() => processFile()}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded"
        >
          {loading ? "Processing..." : "Generate"}
        </button>

        {/* RESULT */}
        {resultText && (
          <div className="mt-5 bg-gray-50 p-4 rounded whitespace-pre-wrap max-h-[500px] overflow-y-auto">
            {resultText}
          </div>
        )}

        {/* QUIZ */}
        {quizData.length > 0 && (
          <div className="mt-5">
            {quizData.map((q, i) => (
              <div key={i} className="mb-4 border p-4 rounded">
                <b>{i + 1}. {q.question}</b>

                {Object.entries(q.options).map(([k, v]) => (
                  <div
                    key={k}
                    onClick={() => handleOptionClick(i, k)}
                    className={getOptionClass(i, k, q.correct)}
                  >
                    {k}: {v}
                  </div>
                ))}

                <span
                  onClick={() => toggleHint(i)}
                  className="text-sm text-indigo-600 cursor-pointer"
                >
                  {visibleHints[i] ? "Hide Hint" : "Show Hint"}
                </span>

                {visibleHints[i] && (
                  <p className="text-sm mt-2 bg-yellow-50 p-2">{q.hint}</p>
                )}
              </div>
            ))}

            {!submitted ? (
              <button
                onClick={handleSubmit}
                className="w-full bg-indigo-600 text-white py-2 rounded"
              >
                Submit
              </button>
            ) : (
              <p className="text-center text-xl font-bold">
                Score: {score}/{quizData.length}
              </p>
            )}
          </div>
        )}

        {/* RESET */}
        <button
          onClick={resetApp}
          className="w-full mt-4 py-2 bg-gray-100 border border-gray-300 rounded"
        >
          Analyze Another PDF
        </button>

      </div>
    </div>
  );
}

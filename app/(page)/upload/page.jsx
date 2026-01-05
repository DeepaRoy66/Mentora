"use client";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const [selectedMode, setSelectedMode] = useState("summary_short");
  const [fileData, setFileData] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("PDF only.");
      return;
    }
    setFileData(file);
    document.getElementById("fileNameDisplay").textContent = file.name;
  };

  const selectMode = (mode, element) => {
    setSelectedMode(mode);
    document.querySelectorAll(".mode-card").forEach((c) =>
      c.classList.remove("active")
    );
    element.classList.add("active");

    if (fileData) processFile();
  };

  const processFile = async () => {
    if (!fileData) return;

    setLoading(true);
    setShowResult(false);

    const formData = new FormData();
    formData.append("file", fileData);
    formData.append("mode", selectedMode);

    try {
      const response = await fetch("http://localhost:8000/process_pdf", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setLoading(false);
      setShowResult(true);

      if (selectedMode === "mcq") {
        const parsed = JSON.parse(result.data);
        setQuizData(parsed);
        setUserAnswers({});
        setIsSubmitted(false);
      } else {
        document.getElementById("summaryView").innerText = result.data;
        document.getElementById("summaryView").style.display = "block";
        document.getElementById("activeQuizView").style.display = "none";
      }
    } catch (err) {
      console.error(err);
      alert("Server Error.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMode === "mcq" && quizData.length) {
      renderQuiz();
    }
  }, [quizData]);

  const renderQuiz = () => {
    const container = document.getElementById("activeQuizView");
    container.innerHTML = "";
    document.getElementById("summaryView").style.display = "none";
    container.style.display = "block";

    quizData.forEach((q, index) => {
      const card = document.createElement("div");
      card.className = "quiz-card";

      let optionsHTML = "";
      Object.entries(q.options).forEach(([key, val]) => {
        optionsHTML += `
          <div class="option" id="opt-${index}-${key}">
            <strong>${key}:</strong> ${val}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="q-text">${index + 1}. ${q.question}</div>
        ${optionsHTML}
        <span class="hint-toggle">Show Hint</span>
        <div class="hint-text">${q.hint}</div>
      `;

      container.appendChild(card);

      card.querySelectorAll(".option").forEach((opt) => {
        opt.onclick = () => selectOption(index, opt.id.split("-")[2]);
      });

      card.querySelector(".hint-toggle").onclick = () => {
        const hint = card.querySelector(".hint-text");
        hint.style.display = hint.style.display === "block" ? "none" : "block";
      };
    });

    const submitBtn = document.createElement("button");
    submitBtn.className = "btn";
    submitBtn.innerText = "Submit Quiz";
    submitBtn.onclick = calculateScore;
    container.appendChild(submitBtn);
  };

  const selectOption = (qIndex, val) => {
    if (isSubmitted) return;

    setUserAnswers((prev) => ({ ...prev, [qIndex]: val }));

    ["A", "B", "C", "D"].forEach((k) => {
      const el = document.getElementById(`opt-${qIndex}-${k}`);
      if (el) el.classList.remove("correct-selected", "wrong-selected");
    });

    document
      .getElementById(`opt-${qIndex}-${val}`)
      .classList.add("correct-selected");
  };

  const calculateScore = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    let score = 0;

    quizData.forEach((q, index) => {
      const userSelected = userAnswers[index];
      const correctAns = q.correct;

      ["A", "B", "C", "D"].forEach((k) => {
        const el = document.getElementById(`opt-${index}-${k}`);
        if (el) el.onclick = null;
      });

      if (userSelected === correctAns) score++;
      else {
        const correctEl = document.getElementById(
          `opt-${index}-${correctAns}`
        );
        if (correctEl) correctEl.classList.add("reveal-correct");
      }
    });

    const container = document.getElementById("activeQuizView");
    const resultMsg = document.createElement("div");
    resultMsg.style.textAlign = "center";
    resultMsg.style.fontSize = "1.5rem";
    resultMsg.style.fontWeight = "bold";
    resultMsg.style.margin = "20px 0";
    resultMsg.innerText = `Score: ${score} / 10`;

    container.lastElementChild.replaceWith(resultMsg);
  };

  return (
    <>
      <style jsx global>{`/* SAME CSS – UNCHANGED */ 
        ${require("fs").readFileSync(
          process.cwd() + "/styles.css",
          "utf8"
        )}
      `}</style>

      <div className="app-container">
        <header>
          <h1>AI Study Assistant</h1>
        </header>

        <main>
          <div
            className="upload-zone"
            onClick={() => fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <span className="file-name" id="fileNameDisplay">
              Click to Upload PDF
            </span>
          </div>

          <div className="mode-grid">
            <div
              className="mode-card active"
              onClick={(e) => selectMode("summary_short", e.target)}
            >
              Short
            </div>
            <div
              className="mode-card"
              onClick={(e) => selectMode("summary_long", e.target)}
            >
              Long
            </div>
            <div
              className="mode-card"
              onClick={(e) => selectMode("mcq", e.target)}
            >
              MCQ Quiz
            </div>
          </div>

          <button className="btn" disabled={!fileData} onClick={processFile}>
            Generate Content
          </button>

          {loading && (
            <div className="loader">
              <div className="spinner"></div>
              Analyzing whole PDF...
            </div>
          )}

          {showResult && (
            <div id="resultArea" style={{ marginTop: "25px" }}>
              <div id="summaryView" className="summary-box"></div>
              <div id="activeQuizView"></div>
              <button
                className="btn btn-outline"
                onClick={() => window.location.reload()}
              >
                Upload New PDF
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

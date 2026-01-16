"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Upload, Users, FileQuestion, ArrowRight, Loader2, AlertCircle, Hash } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizGeneratorPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    pdfFile: null,
    contestantCount: "",
    mcqCount: "",
    questionTime: 30,
    generatedQuestions: null, 
  });

  const [sessionId, setSessionId] = useState(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Update Form Data
      setFormData(prev => ({ ...prev, pdfFile: file }));
      
      // Reset State when file changes
      setFormData(prev => ({ ...prev, generatedQuestions: null }));
      setProcessError("");
    }
  };

  // 2. Handle Next Step (Fixed Async Event Handler)
  const handleNext = async () => {
    // Validation
    if (step === 1 && !formData.pdfFile) return alert("Please upload a PDF first.");
    if (step === 2 && !formData.contestantCount) return alert("Enter contestant count.");

    if (step === 3) {
      if (!formData.pdfFile) return alert("No PDF uploaded.");
      if (!formData.mcqCount || parseInt(formData.mcqCount) <= 0) {
         return alert("Please enter a valid number of MCQs.");
      }

      setIsProcessing(true);
      setProcessError("");

      try {
        // --- PHASE 1: Process PDF to get Questions ---
        const formDataToApi = new FormData();
        formDataToApi.append("file", formData.pdfFile);
        formDataToApi.append("mode", "mcq");
        formDataToApi.append("mcq_count", formData.mcqCount);

        // API URL updated to match Backend Prefix (/mcq)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/process_pdf`, {
          method: "POST",
          body: formDataToApi,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to process PDF.");
        }

        const data = await res.json();
        
        // Validate response format
        if (data.data && Array.isArray(data.data)) {
          // Save questions to state
          setFormData(prev => ({ ...prev, generatedQuestions: data.data }));
          
          // --- PHASE 2: Create the Game Session ---
          const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerLimit: parseInt(formData.contestantCount),
              questionTime: parseInt(formData.questionTime),
              questions: data.data // Pass the generated questions to the session
            }),
          });

          if (!sessionRes.ok) {
             throw new Error("Failed to create game session.");
          }

          const sessionData = await sessionRes.json();
          
          // Set Session State
          setSessionId(sessionData.sessionId);
          setJoinUrl(`${window.location.origin}/join?session=${sessionData.sessionId}`);
          
          // Automatically advance to Step 4 (QR Code)
          setStep(4);
        } else {
          throw new Error("Invalid response format from server.");
        }

      } catch (err) {
        console.error("Processing Error:", err);
        setProcessError(err.message || "Error processing PDF.");
        setFormData(prev => ({ ...prev, generatedQuestions: null })); 
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Standard Next Step for 1 -> 2 -> 3
      setStep(step + 1);
    }
  };

  // --- Render Helpers ---

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Upload className="w-6 h-6 text-blue-600" /> Upload Question PDF
      </h2>
      
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      {formData.pdfFile && <p className="text-green-600">Selected: {formData.pdfFile.name}</p>}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-600" /> Contestant Count
      </h2>
      <input
        type="number"
        placeholder="Number of contestants"
        value={formData.contestantCount}
        onChange={(e) => setFormData({ ...formData, contestantCount: e.target.value })}
        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Hash className="w-6 h-6 text-blue-600" /> MCQ Generation
      </h2>
      
      {/* MCQ Count Input */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Number of MCQs</label>
        <input
          type="number"
          placeholder="e.g. 10"
          value={formData.mcqCount}
          onChange={(e) => setFormData({ ...formData, mcqCount: e.target.value })}
          className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Time per question (seconds)</label>
        <input
          type="number"
          placeholder="30"
          value={formData.questionTime}
          onChange={(e) => setFormData({ ...formData, questionTime: e.target.value })}
          className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading Indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-blue-600 animate-pulse">
           <Loader2 size={20} className="animate-spin" />
           <span className="text-sm font-bold">
             Generating Questions...
           </span>
        </div>
      )}

      {/* Success Indicator */}
      {formData.generatedQuestions && !processError && !isProcessing && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200">
          <span className="font-bold">✅ Success! {formData.generatedQuestions.length} Questions Generated.</span>
        </div>
      )}

      {/* Error Display */}
      {processError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{processError}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-bold text-green-800">Session Created!</h2>
      <p>Scan QR or open link to join contestants:</p>
      <div className="flex justify-center bg-white p-4 rounded-lg shadow-sm w-fit mx-auto">
        <QRCodeSVG value={joinUrl} size={200} />
      </div>
      <p className="mt-2 font-mono border rounded px-2 py-1 inline-block">
        Session ID: {sessionId}
      </p>
      <button
        onClick={() => router.push(`/mcq-contest/${sessionId}`)}
        className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold"
      >
        Go to Admin Dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 w-full max-w-md rounded-2xl shadow-xl space-y-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {step < 4 && (
          <button
            onClick={handleNext}
            disabled={isProcessing || (step === 3 && (!formData.mcqCount || parseInt(formData.mcqCount) <= 0))}
            className="mt-4 w-full py-3 bg-black text-white rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Dynamic Text & Loader */}
            {isProcessing && step === 3 ? <Loader2 size={18} className="animate-spin" /> : null}
            <span>{step === 3 ? "Generate Questions" : "Next Step"} <ArrowRight size={18} /></span>
          </button>
        )}
        {step > 1 && step < 4 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full mt-2 text-gray-500 text-sm hover:underline"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
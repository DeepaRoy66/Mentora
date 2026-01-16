"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Upload, Users, FileQuestion, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizGeneratorPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pdfFile: null,
    contestantCount: "",
    questionTime: 30,
    generatedQuestions: null, // NEW: Store real MCQs
  });
  const [sessionId, setSessionId] = useState(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // NEW: Loading state for OCR
  const [processError, setProcessError] = useState(""); // NEW: Error state
  
  const router = useRouter();

  // STEP 1: Handle File Change -> Call OCR API
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, pdfFile: e.target.files[0] });
      
      // IMMEDIATELY PROCESS PDF
      const file = e.target.files[0];
      setIsProcessing(true);
      setProcessError("");

      try {
        const formDataToApi = new FormData();
        formDataToApi.append("file", file);
        formDataToApi.append("mode", "mcq"); // We want MCQs

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/process_pdf`, {
          method: "POST",
          body: formDataToApi, // No headers needed for FormData
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Failed to process PDF.");
        }

        const data = await res.json();
        
        // SAFETY: Validate that data is actually an array of questions
        if (data.data && Array.isArray(data.data)) {
          setFormData(prev => ({ ...prev, generatedQuestions: data.data }));
        } else {
          throw new Error("Invalid response format from server.");
        }

      } catch (err) {
        console.error("OCR Error:", err);
        setProcessError(err.message || "Error processing PDF.");
        setFormData(prev => ({ ...prev, generatedQuestions: null })); // Clear data
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleNext = async () => {
    if (step === 1 && !formData.pdfFile) return alert("Please upload a PDF first.");
    if (step === 2 && !formData.contestantCount) return alert("Enter contestant count.");
    
    // Removed Step 3 check (MCQ Count) because it comes from PDF

    if (step === 3) {
      // Validate we have real questions
      if (!formData.generatedQuestions) {
        return alert("No questions generated. Please re-upload PDF.");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerLimit: Number(formData.contestantCount),
          questionTime: Number(formData.questionTime),
          questions: formData.generatedQuestions // SEND REAL QUESTIONS
        }),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setJoinUrl(`${window.location.origin}/mcq-contest/join/${data.sessionId}`);
      setStep(4);
    } else {
      setStep(step + 1);
    }
  };

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
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-blue-600 animate-pulse">
           <Loader2 size={20} className="animate-spin" />
           <span className="text-sm font-bold">Analyzing PDF and Generating MCQs... (Do not close)</span>
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

      {/* Success Indicator */}
      {formData.generatedQuestions && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200">
          <span className="font-bold">✅ Success! {formData.generatedQuestions.length} Questions Generated.</span>
        </div>
      )}
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
        <FileQuestion className="w-6 h-6 text-blue-600" /> Timer Settings
      </h2>
      {/* REMOVED MCQ Count Input */}
      
      <input
        type="number"
        placeholder="Time per question (seconds)"
        value={formData.questionTime}
        onChange={(e) => setFormData({ ...formData, questionTime: e.target.value })}
        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
      />
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
            disabled={step === 3 && !formData.generatedQuestions} // Disable if no questions
            className="mt-4 w-full py-3 bg-black text-white rounded-lg font-semibold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 3 ? "Create Session" : "Next Step"} <ArrowRight size={18} />
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
"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Upload, Users, FileQuestion, ArrowRight, Loader2, AlertCircle, Hash, Copy, Share2, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizGeneratorPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false); // State for copy feedback

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
      setFormData(prev => ({ ...prev, pdfFile: file }));
      setFormData(prev => ({ ...prev, generatedQuestions: null }));
      setProcessError("");
    }
  };

  // Helper to handle numeric-only text input
  const handleNumericChange = (e, field) => {
    // Remove anything that is not a number
    const value = e.target.value.replace(/[^0-9]/g, "");
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Share Handlers ---
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Quiz Session',
          text: `Join my quiz session! ID: ${sessionId}`,
          url: joinUrl,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      alert("Sharing not supported on this browser/device.");
    }
  };

  // -------------------------

  const handleNext = async () => {
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

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/process_pdf`, {
          method: "POST",
          body: formDataToApi,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to process PDF.");
        }

        const data = await res.json();
        
        if (data.data && Array.isArray(data.data)) {
          setFormData(prev => ({ ...prev, generatedQuestions: data.data }));
          
          // --- PHASE 2: Create the Game Session ---
          const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerLimit: parseInt(formData.contestantCount),
              questionTime: parseInt(formData.questionTime),
              questions: data.data
            }),
          });

          if (!sessionRes.ok) {
             throw new Error("Failed to create game session.");
          }

          const sessionData = await sessionRes.json();
          setSessionId(sessionData.sessionId);
          setJoinUrl(`${window.location.origin}/join?session=${sessionData.sessionId}`);
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
      setStep(step + 1);
    }
  };

  // --- Render Helpers ---

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2 text-black">
        <Upload className="w-6 h-6 text-black" /> Upload PDF
      </h2>
      
      <div className="w-full">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-black bg-white border border-gray-300 rounded-lg cursor-pointer p-3 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
        />
      </div>
      
      {formData.pdfFile && (
        <p className="text-black font-medium bg-gray-100 p-2 rounded">
          Selected: {formData.pdfFile.name}
        </p>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2 text-black">
        <Users className="w-6 h-6 text-black" /> Contestant Count
      </h2>
      
      <label className="block text-black font-medium">Number of Contestants</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="e.g. 50"
        value={formData.contestantCount}
        onChange={(e) => handleNumericChange(e, "contestantCount")}
        className="w-full p-4 bg-white text-black border-2 border-gray-300 rounded-lg outline-none focus:border-black text-lg"
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2 text-black">
        <Hash className="w-6 h-6 text-black" /> Settings
      </h2>
      
      <div>
        <label className="block text-black font-medium mb-2">Number of MCQs</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 10"
          value={formData.mcqCount}
          onChange={(e) => handleNumericChange(e, "mcqCount")}
          className="w-full p-4 bg-white text-black border-2 border-gray-300 rounded-lg outline-none focus:border-black text-lg"
        />
      </div>

      <div>
        <label className="block text-black font-medium mb-2">Time per question (seconds)</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="30"
          value={formData.questionTime}
          onChange={(e) => handleNumericChange(e, "questionTime")}
          className="w-full p-4 bg-white text-black border-2 border-gray-300 rounded-lg outline-none focus:border-black text-lg"
        />
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 text-black font-medium p-4 bg-gray-100 rounded-lg">
           <Loader2 size={20} className="animate-spin" />
           <span>Generating Questions...</span>
        </div>
      )}

      {formData.generatedQuestions && !processError && !isProcessing && (
        <div className="bg-black text-white p-4 rounded-lg text-sm font-medium">
          ✅ Success! {formData.generatedQuestions.length} Questions Generated.
        </div>
      )}

      {processError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm font-medium">
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
      <h2 className="text-2xl font-bold text-black">Session Created!</h2>
      <p className="text-gray-700">Scan QR or share the link:</p>
      
      <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-gray-300 shadow-sm w-fit mx-auto">
        <QRCodeSVG value={joinUrl} size={200} fgColor="#000000" bgColor="#ffffff" />
      </div>
      
      <p className="mt-2 font-mono text-black bg-gray-100 border border-gray-300 rounded px-4 py-2 inline-block text-lg">
        ID: {sessionId}
      </p>

      {/* Share Options */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
        
        {/* 1. Copy Link */}
        <button
          onClick={handleCopyLink}
          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition ${
            copied ? "border-black bg-black text-white" : "border-gray-300 text-black hover:bg-gray-50"
          }`}
        >
          <Copy size={20} />
          <span className="text-xs font-bold">{copied ? "Copied!" : "Copy"}</span>
        </button>

        {/* 2. Native Share (FB, Messenger, etc) */}
        <button
          onClick={handleNativeShare}
          className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-black bg-black text-white hover:bg-gray-800 transition"
        >
          <Share2 size={20} />
          <span className="text-xs font-bold">Share</span>
        </button>

        {/* 3. WhatsApp Direct */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Join my quiz! ${joinUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-gray-300 text-black hover:bg-gray-50 transition"
        >
          <MessageCircle size={20} />
          <span className="text-xs font-bold">WhatsApp</span>
        </a>
      </div>
      
      <button
        onClick={() => router.push(`/mcq-contest/${sessionId}`)}
        className="mt-4 w-full py-4 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition"
      >
        Go to Admin Dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 w-full max-w-md rounded-xl shadow-lg space-y-6 border border-gray-200">
        
        {/* Steps Indicator */}
        <div className="flex justify-center space-x-2 mb-4">
            {[1, 2, 3, 4].map((s) => (
                <div 
                    key={s} 
                    className={`h-2 rounded-full transition-all duration-300 ${step >= s ? 'bg-black w-8' : 'bg-gray-300 w-2'}`}
                ></div>
            ))}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {step < 4 && (
          <button
            onClick={handleNext}
            disabled={isProcessing || (step === 3 && (!formData.mcqCount || parseInt(formData.mcqCount) <= 0))}
            className="mt-4 w-full py-4 bg-black text-white rounded-lg font-bold text-lg flex justify-center items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isProcessing && step === 3 ? <Loader2 size={20} className="animate-spin" /> : null}
            <span>{step === 3 ? "Generate Questions" : "Next Step"} <ArrowRight size={20} /></span>
          </button>
        )}
        
        {step > 1 && step < 4 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full mt-3 text-gray-600 font-medium text-sm hover:text-black underline"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
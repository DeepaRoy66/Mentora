"use client";

import React, { useState, useEffect } from "react"; // Added useEffect
import { QRCodeSVG } from "qrcode.react";
import { 
  Upload, 
  Users, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Hash, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Facebook, 
  Mail 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizGeneratorPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  // New state for the custom alert popup
  const [customAlert, setCustomAlert] = useState({ isOpen: false, message: "" });

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

  // --- FIX: Reset sessionId when component mounts to prevent old session ID persistence ---
  useEffect(() => {
    setSessionId(null);
  }, []);

  // --- Input Helper: Allow only numbers in text input ---
  const handleNumberInput = (field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ 
        ...prev, 
        pdfFile: file, 
        generatedQuestions: null // Clear previous game data
      }));
      // --- FIX: Reset sessionId whenever a new file is uploaded ---
      setSessionId(null);
      setJoinUrl("");
      setProcessError("");
    }
  };

  // --- Sharing Logic ---
  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform) => {
    const text = `Join my Quiz Session! Code: ${sessionId}`;
    const url = encodeURIComponent(joinUrl);
    const msg = encodeURIComponent(text);

    let shareLink = "";

    switch (platform) {
      case "whatsapp":
        shareLink = `https://wa.me/?text=${msg}%20${url}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "email":
        shareLink = `mailto:?subject=Join Quiz&body=${msg} ${url}`;
        break;
      case "native":
        if (navigator.share) {
          navigator.share({
            title: 'Join Quiz',
            text: text,
            url: joinUrl,
          }).catch(console.error);
          return;
        }
        break;
      default:
        return;
    }
    if (shareLink) window.open(shareLink, '_blank');
  };

  const handleNext = async () => {
    // Validation with Custom Alert instead of window.alert
    if (step === 1 && !formData.pdfFile) {
      setCustomAlert({ isOpen: true, message: "Please upload a PDF first." });
      return;
    }
    if (step === 2 && !formData.contestantCount) {
      setCustomAlert({ isOpen: true, message: "Enter contestant count." });
      return;
    }

    if (step === 3) {
      if (!formData.pdfFile) {
         setCustomAlert({ isOpen: true, message: "No PDF uploaded." });
         return;
      }
      if (!formData.mcqCount || parseInt(formData.mcqCount) <= 0) {
         setCustomAlert({ isOpen: true, message: "Please enter a valid number of MCQs." });
         return;
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
          // Fixed URL Structure
          setJoinUrl(`${window.location.origin}/mcq-contest/join/${sessionData.sessionId}`);
          
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
      <div className="text-center">
        <h2 className="text-2xl font-bold text-black mb-2 flex items-center justify-center gap-2">
          <Upload className="w-6 h-6" /> Upload PDF
        </h2>
        <p className="text-gray-600 text-sm">Select the source file for your quiz.</p>
      </div>
      
      <div className="relative border-2 border-dashed border-black rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-center group">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="w-10 h-10 text-black transition-transform duration-300 group-hover:-translate-y-1" />
            <span className="text-sm font-semibold text-black">Click to Browse PDF</span>
        </div>
      </div>
      
      {formData.pdfFile && (
        <div className="p-3 bg-black text-white rounded-md text-sm text-center shadow-md">
          Selected: <span className="font-bold">{formData.pdfFile.name}</span>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black flex items-center gap-2">
        <Users className="w-6 h-6" /> Contestants
      </h2>
      <div>
        <label className="block text-sm font-bold text-black mb-2">How many players?</label>
        <input
          type="text" 
          inputMode="numeric"
          placeholder="e.g. 50"
          value={formData.contestantCount}
          onChange={(e) => handleNumberInput("contestantCount", e.target.value)}
          className="w-full p-4 bg-white border-2 border-black rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black text-lg transition-all"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black flex items-center gap-2">
        <Hash className="w-6 h-6" /> Settings
      </h2>
      
      <div>
        <label className="block text-sm font-bold text-black mb-2">Number of Questions (MCQs)</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 10"
          value={formData.mcqCount}
          onChange={(e) => handleNumberInput("mcqCount", e.target.value)}
          className="w-full p-4 bg-white border-2 border-black rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black text-lg transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-black mb-2">Seconds per Question</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="30"
          value={formData.questionTime}
          onChange={(e) => handleNumberInput("questionTime", e.target.value)}
          className="w-full p-4 bg-white border-2 border-black rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black text-lg transition-all"
        />
      </div>

      {/* Error Display */}
      {processError && (
        <div className="bg-white text-red-600 p-3 rounded-lg text-sm border-2 border-red-600 flex items-center gap-2">
           <AlertCircle size={20} />
           <span>{processError}</span>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center space-y-6">
      <div className="border-b-2 border-black pb-4">
          <h2 className="text-2xl font-black text-black uppercase">Ready to Join</h2>
          <p className="text-black mt-1">Session ID: <span className="font-mono bg-black text-white px-2 py-1 rounded">{sessionId}</span></p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-2 border-2 border-black rounded-lg shadow-lg">
          <QRCodeSVG value={joinUrl} size={180} />
        </div>
      </div>

      {/* Share Options */}
      <div className="space-y-3">
          <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg p-2">
              <input 
                readOnly 
                value={joinUrl} 
                className="w-full bg-transparent text-black text-sm outline-none px-2 font-medium"
              />
              <button 
                onClick={handleCopyLink}
                className="bg-black text-white p-2 rounded hover:bg-neutral-700 transition-colors duration-300"
                title="Copy Link"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
             {/* WhatsApp - Hovers Green */}
             <button 
               onClick={() => handleShare('whatsapp')} 
               className="group flex flex-col items-center justify-center p-2 border-2 border-black rounded transition-all duration-300 hover:border-green-500 hover:bg-green-500 hover:text-white"
             >
                <MessageCircle size={24} className="text-black mb-1 transition-colors duration-300 group-hover:text-white" />
                <span className="text-[10px] font-bold">WhatsApp</span>
             </button>

             {/* Facebook - Hovers Blue */}
             <button 
               onClick={() => handleShare('facebook')} 
               className="group flex flex-col items-center justify-center p-2 border-2 border-black rounded transition-all duration-300 hover:border-blue-600 hover:bg-blue-600 hover:text-white"
             >
                <Facebook size={24} className="text-black mb-1 transition-colors duration-300 group-hover:text-white" />
                <span className="text-[10px] font-bold">Facebook</span>
             </button>

             {/* Email - Hovers Red */}
             <button 
               onClick={() => handleShare('email')} 
               className="group flex flex-col items-center justify-center p-2 border-2 border-black rounded transition-all duration-300 hover:border-red-500 hover:bg-red-500 hover:text-white"
             >
                <Mail size={24} className="text-black mb-1 transition-colors duration-300 group-hover:text-white" />
                <span className="text-[10px] font-bold">Email</span>
             </button>

             {/* Other - Hovers Dark Gray */}
             <button 
               onClick={() => handleShare('native')} 
               className="group flex flex-col items-center justify-center p-2 border-2 border-black rounded transition-all duration-300 hover:border-gray-600 hover:bg-gray-600 hover:text-white"
             >
                <Share2 size={24} className="text-black mb-1 transition-colors duration-300 group-hover:text-white" />
                <span className="text-[10px] font-bold">Other</span>
             </button>
          </div>
      </div>

      <button
        onClick={() => router.push(`/mcq-contest/${sessionId}`)}
        disabled={!sessionId || isProcessing} // Added safety check
        className="w-full py-4 bg-black text-white rounded-lg font-bold text-lg hover:bg-neutral-800 transition-colors duration-300 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Launch Dashboard
      </button>
    </div>
  );

  return (
    <>
      {/* Custom Alert Popup Modal */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto bg-black text-white rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Notice</h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              {customAlert.message}
            </p>
            <button
              onClick={() => setCustomAlert({ isOpen: false, message: "" })}
              className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-neutral-800 transition-colors border-2 border-black"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-md bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6">
          
          {/* Progress Bar */}
          {step < 4 && (
              <div className="w-full bg-gray-200 h-2 rounded-full mb-6 overflow-hidden">
                  <div 
                      className="bg-black h-full transition-all duration-500 ease-in-out" 
                      style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
              </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          {step < 4 && (
            <button
              onClick={handleNext}
              disabled={isProcessing || (step === 3 && (!formData.mcqCount || parseInt(formData.mcqCount) <= 0))}
              className="w-full py-4 bg-black text-white rounded-lg font-bold text-lg flex justify-center items-center gap-2 hover:bg-neutral-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing && step === 3 ? (
                <>
                   <Loader2 size={22} className="animate-spin" />
                   <span>Analysing & Generating...</span>
                </>
              ) : (
                <>
                  <span>{step === 3 ? "Generate Quiz" : "Next"}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          )}
          
          {step > 1 && step < 4 && (
            <button
              onClick={() => !isProcessing && setStep(step - 1)}
              disabled={isProcessing}
              className="w-full text-center text-gray-500 text-sm font-semibold hover:text-black hover:underline disabled:opacity-50"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </>
  );
}
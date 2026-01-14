//app/mcq-contest/page.jsx
"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Upload, Users, FileQuestion, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizGeneratorPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pdfFile: null,
    contestantCount: "",
    mcqCount: "",
    questionTime: 30,
  });
  const [sessionId, setSessionId] = useState(null);
  const [joinUrl, setJoinUrl] = useState("");
  const router = useRouter();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, pdfFile: e.target.files[0] });
    }
  };

  const handleNext = async () => {
    if (step === 1 && !formData.pdfFile) return alert("Please upload a PDF first.");
    if (step === 2 && !formData.contestantCount) return alert("Enter contestant count.");
    if (step === 3 && !formData.mcqCount) return alert("Enter MCQ count.");

    if (step === 3) {
      // Create session via backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mcq/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerLimit: Number(formData.contestantCount),
          mcqCount: Number(formData.mcqCount),
          questionTime: Number(formData.questionTime),
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
        <FileQuestion className="w-6 h-6 text-blue-600" /> MCQ Count & Timer
      </h2>
      <input
        type="number"
        placeholder="Number of MCQs"
        value={formData.mcqCount}
        onChange={(e) => setFormData({ ...formData, mcqCount: e.target.value })}
        className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
      />
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
            className="mt-4 w-full py-3 bg-black text-white rounded-lg font-semibold flex justify-center items-center gap-2"
          >
            {step === 3 ? "Generate Session" : "Next Step"} <ArrowRight size={18} />
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

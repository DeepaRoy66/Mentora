"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    if (!message) {
      setToast(null);
      return;
    }
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return { toast, showToast };
}

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === "success";
  const bgColor = isSuccess ? "bg-green-500" : "bg-red-500";
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl animate-in slide-in-from-top-5 duration-300 min-w-[300px] max-w-md`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 font-medium text-sm">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

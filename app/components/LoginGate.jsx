"use client";
import { useSession, signIn } from "next-auth/react";

export default function LoginGate({ children }) {
  const { data: session } = useSession();
  if (!session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-slate-900 text-white p-6 rounded-xl max-w-sm text-center space-y-4">
          <h1 className="text-xl font-bold">Please login first</h1>
          <button
            onClick={() => signIn("google")}
            className="bg-blue-600 px-6 py-3 rounded-lg font-bold"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }
  return children;
}

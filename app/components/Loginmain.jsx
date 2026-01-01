"use client"

import { signIn } from "next-auth/react"
import { Button } from "./ui/button"
import { FcGoogle } from "react-icons/fc"

export function LoginModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 w-[90%] max-w-md shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Login to Mentora
        </h2>

        <Button
          className="w-full flex items-center gap-3 text-lg"
          onClick={() => signIn("google")}
        >
          <FcGoogle className="h-6 w-6" />
          Continue with Google
        </Button>
      </div>
    </div>
  )
}

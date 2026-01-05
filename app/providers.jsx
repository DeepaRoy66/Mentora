"use client"

import { SessionProvider } from "next-auth/react"
import { Navbar } from "./components/navbar"

export function Providers({ children }) {
  return <SessionProvider><Navbar />{children}</SessionProvider>
}

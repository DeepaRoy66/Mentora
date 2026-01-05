"use client"

import Link from "next/link"
import {
  Search,
  Upload,
  LogIn,
  Home,
  TrendingUp,
  Clock,
  Menu,
  X,
  FileText,
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"

export function Navbar() {
  const trendingTopics = [
    "Next.js 16",
    "AI in Education",
    "Quantum Computing",
    "UI Design Trends",
    "Sustainable Energy",
  ]

  const { data: session } = useSession()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* MAIN BAR - Pure white frosted glass, higher opacity for clean look */}
      <div className="backdrop-blur-xl bg-white/90 border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* LOGO */}
            <Link href="/" className="text-2xl font-bold text-black">
              MENTORA
            </Link>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:block flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/60" />
                <Input
                  placeholder="Search..."
                  className="pl-10 bg-white/70 border-white/40 text-black placeholder:text-black/50 backdrop-blur"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
              {/* MOBILE ICONS */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-black hover:bg-white/30"
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen)
                  setMobileMenuOpen(false)
                }}
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-black hover:bg-white/30"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen)
                  setMobileSearchOpen(false)
                }}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {/* DESKTOP BUTTONS */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-black hover:bg-white/30">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild className="text-black hover:bg-white/30">
                  <Link href="/upload">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild className="text-black hover:bg-white/30">
                  <Link href="/tools/pdf-to-summary">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF to Summary
                  </Link>
                </Button>

                {session ? (
                  <>
                    <img
                      src={session.user?.image ?? ""}
                      alt="user"
                      className="h-8 w-8 rounded-full border-2 border-white/40"
                    />
                    <Button size="sm" variant="outline" onClick={() => signOut()}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => signIn("google")}>
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE SEARCH */}
          {mobileSearchOpen && (
            <div className="md:hidden mt-3 pb-4">
              <Input
                autoFocus
                placeholder="Search..."
                className="bg-white/70 border-white/40 text-black"
              />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-white/30">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="flex items-center gap-2 py-2 text-black">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link href="/upload" className="flex items-center gap-2 py-2 text-black">
              <Upload className="h-4 w-4" />
              PDF Upload
            </Link>
            <Link href="/tools/pdf-to-summary" className="flex items-center gap-2 py-2 text-black">
              <FileText className="h-4 w-4" />
              PDF to Summary
            </Link>

            <div className="border-t border-white/30 pt-4">
              {session ? (
                <Button className="w-full" variant="outline" onClick={() => signOut()}>
                  Logout
                </Button>
              ) : (
                <Button className="w-full" onClick={() => signIn("google")}>
                  Login with Google
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRENDING */}
      <div className="bg-white/85 backdrop-blur-xl border-t border-white/30">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-6 text-sm overflow-x-auto">
          <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
          {trendingTopics.map((topic) => (
            <Link
              key={topic}
              href={`/search?q=${encodeURIComponent(topic)}`}
              className="text-black/80 hover:text-black transition-colors whitespace-nowrap"
            >
              {topic}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-1 text-black/80">
            <Clock className="h-3 w-3" />
            Recent
          </div>
        </div>
      </div>
    </nav>
  )
}
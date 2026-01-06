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
import { signIn, useSession } from "next-auth/react"

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
      {/* MAIN BAR */}
      <div className="backdrop-blur-xl bg-background/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* LOGO */}
            <Link href="/" className="text-2xl font-bold">
              MENTORA
            </Link>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:block flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10 bg-white/40 dark:bg-black/30 border border-white/20 backdrop-blur"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
              {/* MOBILE SEARCH */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen)
                  setMobileMenuOpen(false)
                }}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* MOBILE MENU */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen)
                  setMobileSearchOpen(false)
                }}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </Button>

              {/* DESKTOP NAV */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/">
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild>
                  <Link href="/upload">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tools/pdf-to-summary">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF to Summary
                  </Link>
                </Button>

                {/* AUTH */}
                {session ? (
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 ml-2"
                  >
                    <img
                      src={session.user?.image ?? ""}
                      alt="profile"
                      className="h-8 w-8 rounded-full border border-white/20"
                    />
                    <span className="text-sm font-medium hidden lg:block">
                      {session.user?.name}
                    </span>
                  </Link>
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
            <div className="md:hidden mt-3 pb-3">
              <Input
                autoFocus
                placeholder="Search..."
                className="bg-white/40 border border-white/20 backdrop-blur"
              />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/70 backdrop-blur-xl border-b">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="flex items-center gap-2 py-2">
              <Home className="h-4 w-4" />
              Home
            </Link>

            <Link href="/upload" className="flex items-center gap-2 py-2">
              <Upload className="h-4 w-4" />
              Pdf Upload
            </Link>

            <Link href="/tools/pdf-to-summary" className="flex items-center gap-2 py-2">
              <FileText className="h-4 w-4" />
              PDF to Summary
            </Link>

            <div className="border-t border-white/10 pt-3">
              {session ? (
                <Link href="/profile" className="flex items-center gap-3">
                  <img
                    src={session.user?.image ?? ""}
                    alt="profile"
                    className="h-10 w-10 rounded-full border"
                  />
                  <div>
                    <p className="font-medium">{session.user?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      View Profile
                    </p>
                  </div>
                </Link>
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
      <div className="bg-background/50 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-6 text-sm overflow-x-auto">
          <TrendingUp className="h-4 w-4 text-accent" />
          {trendingTopics.map((topic) => (
            <Link key={topic} href={`/search?q=${encodeURIComponent(topic)}`}>
              {topic}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Recent
          </div>
        </div>
      </div>
    </nav>
  )
}

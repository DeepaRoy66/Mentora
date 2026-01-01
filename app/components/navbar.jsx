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
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useState } from "react"

export function Navbar() {
  const trendingTopics = [
    "Next.js 16",
    "AI in Education",
    "Quantum Computing",
    "UI Design Trends",
    "Sustainable Energy",
  ]

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* MAIN GLASS BAR */}
      <div className="backdrop-blur-xl bg-background/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* LOGO */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight hover:text-accent transition"
            >
              MENTORA
            </Link>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:block flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses, mentors, topics..."
                  className="pl-10 bg-white/40 dark:bg-black/30 border border-white/20 backdrop-blur"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* MOBILE SEARCH ICON */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-white/20"
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen)
                  setMobileMenuOpen(false)
                }}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* HAMBURGER */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-white/20"
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen)
                  setMobileSearchOpen(false)
                }}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>

              {/* DESKTOP BUTTONS */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild>
                  <Link href="/upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-accent" />
                    Upload PDF
                  </Link>
                </Button>

                <Button size="sm" className="ml-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </div>
            </div>
          </div>

          {/* MOBILE SEARCH EXPAND */}
          <div
            className={`md:hidden transition-all duration-300 overflow-hidden ${
              mobileSearchOpen ? "max-h-20 mt-3" : "max-h-0"
            }`}
          >
            <div className="relative pb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search..."
                className="pl-10 bg-white/40 dark:bg-black/30 border border-white/20 backdrop-blur"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-64 border-b" : "max-h-0"
        }`}
      >
        <div className="bg-background/70 backdrop-blur-xl px-4 py-4 space-y-3 border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/20"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>

          <Link
            href="/upload"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/20"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Upload className="h-4 w-4 text-accent" />
            Upload PDF
          </Link>

          <Button className="w-full backdrop-blur">
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </div>
      </div>

      {/* TRENDING BAR */}
      <div className="bg-background/50 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-6 text-sm overflow-x-auto">
          <div className="flex items-center gap-2 text-accent font-medium shrink-0">
            <TrendingUp className="h-4 w-4" />
            Trending
          </div>

          {trendingTopics.map((topic) => (
            <Link
              key={topic}
              href={`/search?q=${topic}`}
              className="text-muted-foreground hover:text-foreground whitespace-nowrap transition"
            >
              {topic}
            </Link>
          ))}

          <div className="ml-auto flex items-center gap-2 text-muted-foreground border-l border-white/20 pl-4 shrink-0">
            <Clock className="h-3 w-3" />
            Recent
          </div>
        </div>
      </div>
    </nav>
  )
}

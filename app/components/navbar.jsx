"use client"

import Link from "next/link"
import { Search, Upload, LogIn, Home, TrendingUp, Clock, Menu } from "lucide-react"
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tighter hover:text-accent transition-colors"
            >
              MENTORA
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
              <Input
                type="search"
                placeholder="Search courses, mentors, or topics..."
                className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>
          </div>

          {/* Desktop Menu Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="flex items-center gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="flex items-center gap-2">
              <Link href="/upload">
                <Upload className="h-4 w-4 text-accent" />
                <span>PDF Upload</span>
              </Link>
            </Button>
            <div className="h-6 w-[1px] bg-border mx-2" />
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="px-4 py-2 flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-2 hover:text-accent">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link href="/upload" className="flex items-center gap-2 hover:text-accent">
              <Upload className="h-4 w-4" />
              PDF Upload
            </Link>
            <Link href="/login" className="flex items-center gap-2 hover:text-accent">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses, mentors, or topics..."
                className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub Navbar: Trending & Recent */}
      <div className="border-t bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-6 text-sm overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 text-accent shrink-0 font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>Trending:</span>
          </div>
          {trendingTopics.map((topic) => (
            <Link
              key={topic}
              href={`/search?q=${topic}`}
              className="text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
            >
              {topic}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-2 text-muted-foreground shrink-0 border-l pl-6">
            <Clock className="h-3 w-3" />
            <span>Recent</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

"use client"

import Link from "next/link"
import {
  Search,
  Upload,
  LogIn,
  Home,
  Menu,
  X,
  FileText,
  User,
  TrendingUp,
  LogOut,
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input" 
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useState, useRef, useEffect } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils" 

export function Navbar() {
  // 1. CHANGE: Start with empty array so nothing shows initially
  const [trendingTopics, setTrendingTopics] = useState([])

  const { data: session, status } = useSession()
  const loading = status === "loading"
  const user = session?.user

  // State management
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef(null)

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Fetch trending topics from backend
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/trending") 
        if (res.ok) {
          const data = await res.json()
          if (data.categories && data.categories.length > 0) {
            setTrendingTopics(data.categories)
          }
        }
      } catch (error) {
        console.error("Failed to fetch trending topics", error)
        // We do NOTHING here, so the list remains empty [] and the bar stays hidden
      }
    }
    fetchTrending()
  }, [])

  // Handle clicking outside to close search
  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (!searchInputRef.current?.value) {
        setIsSearchOpen(false)
      }
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col font-sans tracking-tight shadow-sm">
      
      {/* MAIN NAVBAR */}
      <div className="w-full bg-white/90 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between gap-6">
            
            {/* LOGO */}
            <Link 
              href="/" 
              className="text-3xl font-extrabold text-black hover:opacity-80 transition-opacity tracking-tighter"
            >
              MENTORA
            </Link>

            {/* DESKTOP ACTIONS */}
            <div className="flex items-center gap-3 md:gap-4 flex-1 justify-end">
              
              {/* SEARCH BAR */}
              <div 
                className={cn(
                  "hidden md:flex items-center transition-all duration-300 ease-in-out mr-2",
                  isSearchOpen ? "w-72" : "w-12"
                )}
                onBlur={handleBlur}
              >
                {isSearchOpen ? (
                  <div className="relative w-full animate-in fade-in zoom-in-95 duration-200">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search topics..."
                      className="pl-11 pr-10 h-10 bg-gray-100/80 border-transparent text-black placeholder:text-gray-500 rounded-full focus-visible:ring-1 focus-visible:ring-gray-300 text-base"
                    />
                    <button 
                      onClick={() => setIsSearchOpen(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSearchOpen(true)}
                    className="rounded-full h-10 w-10 hover:bg-gray-100 text-gray-600 hover:text-black"
                  >
                    <Search className="h-6 w-6" />
                  </Button>
                )}
              </div>

              {/* NAV LINKS */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild className="text-base font-semibold text-gray-700 hover:text-black hover:bg-gray-100/80 h-10 px-4">
                  <Link href="/">
                    <Home className="h-5 w-5 mr-2" />
                    Home
                  </Link>
                </Button>

                <Button variant="ghost" asChild className="text-base font-semibold text-gray-700 hover:text-black hover:bg-gray-100/80 h-10 px-4">
                  <Link href="/upload">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload
                  </Link>
                </Button>

                <Button variant="ghost" asChild className="text-base font-semibold text-gray-700 hover:text-black hover:bg-gray-100/80 h-10 px-4">
                  <Link href="/generatesummary">
                    <FileText className="h-5 w-5 mr-2" />
                    Pdf-Summary
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="text-base font-semibold text-gray-700 hover:text-black hover:bg-gray-100/80 h-10 px-4">
                  <Link href="/mcq-contest">
                    <FileText className="h-5 w-5 mr-2" />
                    MCQ-War
                  </Link>
                </Button>
                 <Button variant="ghost" asChild className="text-base font-semibold text-gray-700 hover:text-black hover:bg-gray-100/80 h-10 px-4">
                  <Link href="/eco-editor">
                    <FileText className="h-5 w-5 mr-2" />
                    Ecoediotr
                  </Link>
                </Button>
              </div>

              {/* DIVIDER */}
              <div className="hidden md:block h-8 w-px bg-gray-200 mx-1"></div>

              {/* USER / LOGIN */}
              <div className="hidden md:flex items-center">
                {loading ? (
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                ) : user ? (
                  <Button variant="ghost" asChild className="rounded-full pl-2 pr-5 h-11 hover:bg-gray-100">
                    <Link href="/profile" className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="bg-gray-100 text-black text-sm font-bold">{user.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-base font-bold text-gray-800">{user.name?.split(" ")[0]}</span>
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => signIn("google")} className="rounded-full bg-black text-white hover:bg-black/80 font-semibold px-6 text-base">
                    <LogIn className="h-5 w-5 mr-2" />
                    Login
                  </Button>
                )}
              </div>

              {/* MOBILE MENU BUTTON */}
              <div className="flex items-center md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-black hover:bg-gray-100 h-10 w-10"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHANGE: TRENDING BAR - Only renders if trendingTopics has items */}
      {trendingTopics.length > 0 && (
        <div className="w-full bg-white/90 backdrop-blur-xl border-b border-gray-200 h-12 z-40">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-6 overflow-hidden">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide flex-shrink-0">
              <TrendingUp className="h-4 w-4" />
              Trending
            </span>
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
              {trendingTopics.map((topic) => (
                <Link
                  key={topic}
                  href={`/search?q=${encodeURIComponent(topic)}`}
                  className="text-sm font-medium text-gray-600 hover:text-black transition-colors whitespace-nowrap"
                >
                  {topic}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[calc(72px+48px)] left-0 right-0 border-b border-gray-200 bg-white/95 backdrop-blur-2xl shadow-xl animate-in slide-in-from-top-2">
          <div className="p-5 space-y-5">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input 
                placeholder="Search..." 
                className="pl-12 h-11 bg-gray-100 border-transparent text-black text-base" 
              />
            </div>
            
            <div className="space-y-2">
              <Link href="/" className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 text-base font-semibold text-gray-800 transition-colors">
                <Home className="h-6 w-6" /> 
                Home
              </Link>
              <Link href="/upload" className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 text-base font-semibold text-gray-800 transition-colors">
                <Upload className="h-6 w-6" /> 
                Upload PDF
              </Link>
              <Link href="/generatesummary" className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 text-base font-semibold text-gray-800 transition-colors">
                <FileText className="h-6 w-6" /> 
                Generate Summary
              </Link>
              <Link href="/profile" className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 text-base font-semibold text-gray-800 transition-colors">
                <User className="h-6 w-6" /> 
                Profile
              </Link>
            </div>

            <div className="pt-5 border-t border-gray-200">
              {user ? (
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="bg-gray-100 text-black font-bold">U</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-bold text-gray-900 text-base">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => signOut()}>
                      <LogOut className="h-6 w-6 text-red-500" />
                   </Button>
                </div>
              ) : (
                <Button className="w-full bg-black text-white hover:bg-black/80 font-bold h-11 text-base" onClick={() => signIn("google")}>
                  <LogIn className="h-5 w-5 mr-2" />
                  Login with Google
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  MessageSquare,
  Trophy,
  Swords,
  Leaf,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import { useState, useRef, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const user = session?.user;

  // State for Search
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // State for Trending Categories
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // --- Fetch Trending Categories ---
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trending`);
        if (res.ok) {
          const data = await res.json();
          setTrendingTopics(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch trending", error);
      }
    };
    fetchTrending();
  }, []);

  // --- Fetch Suggestions ---
  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      const fetchSuggestions = async () => {
        setSearchLoading(true);
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`
          );
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.suggestions || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        } finally {
          setSearchLoading(false);
        }
      };
      fetchSuggestions();
    }, 300); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // --- Click Outside Handler ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      const query = searchInputRef.current?.value;
      if (query?.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        setIsSearchOpen(false);
        setSearchQuery(""); 
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    setIsSearchOpen(false);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col font-sans tracking-tight shadow-sm">
      {/* MAIN NAVBAR */}
      <div className="w-full bg-white/90 backdrop-blur-xl transition-all duration-300 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between gap-6">
            
            <Link href="/" className="text-3xl font-extrabold text-black hover:opacity-80 transition-opacity tracking-tighter">
              MENTORA
            </Link>

            <div className="flex items-center gap-3 md:gap-4 flex-1 justify-end">
              
              {/* SEARCH BAR */}
              <div className={cn(
                  "hidden md:flex items-center transition-all duration-300 ease-in-out mr-2 relative",
                  isSearchOpen ? "w-80" : "w-12"
                )}>
                {isSearchOpen ? (
                  <div className="relative w-full animate-in fade-in zoom-in-95 duration-200">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchSubmit}
                      onFocus={() => { if(searchQuery) setShowSuggestions(true) }}
                      placeholder="Search topics..."
                      className="pl-11 pr-10 h-10 bg-gray-100/80 border-transparent text-black rounded-full focus-visible:ring-1 focus-visible:ring-gray-300 text-base"
                    />
                    <button onClick={() => {setIsSearchOpen(false); setShowSuggestions(false);}} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black p-1">
                      <X className="h-4 w-4" />
                    </button>

                    {showSuggestions && (
                      <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                        {searchLoading ? (
                          <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" /> Loading...
                          </div>
                        ) : (
                          <ul className="max-h-60 overflow-y-auto py-1">
                            {suggestions.map((s, idx) => (
                              <li key={idx} onClick={() => handleSuggestionClick(s)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 flex items-center gap-2">
                                <Search className="h-3 w-3 text-blue-400" /> {s}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="rounded-full h-10 w-10 hover:bg-gray-100 text-gray-600">
                    <Search className="h-6 w-6 text-blue-500" />
                  </Button>
                )}
              </div>

              {/* NAV LINKS */}
              <div className="hidden md:flex items-center gap-1">
                <NavBtn href="/" icon={<Home className="h-5 w-5 mr-2 text-indigo-500" />} label="Home" />
                <NavBtn href="/upload" icon={<Upload className="h-5 w-5 mr-2 text-orange-500" />} label="Upload" />
                <NavBtn href="/generatesummary" icon={<FileText className="h-5 w-5 mr-2 text-red-500" />} label="Summary" />
                <NavBtn href="/questions" icon={<MessageSquare className="h-5 w-5 mr-2 text-cyan-500" />} label="Q&A" />
                <NavBtn href="/mcq-contest" icon={<Swords className="h-5 w-5 mr-2 text-rose-500" />} label="MCQ-War" />
                <NavBtn href="/eco-editor" icon={<Leaf className="h-5 w-5 mr-2 text-emerald-500" />} label="Eco-auditor" />
                {user && <NavBtn href="/badges" icon={<Trophy className="h-5 w-5 mr-2 text-amber-500" />} label="Badges" />}
              </div>

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
                    <LogIn className="h-5 w-5 mr-2 text-white" />Login
                  </Button>
                )}
              </div>

              <div className="flex items-center md:hidden">
                <Button variant="ghost" size="icon" className="text-black hover:bg-gray-100 h-10 w-10" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRENDING BAR */}
      {trendingTopics.length > 0 && (
        <div className="w-full bg-white/90 backdrop-blur-xl border-b border-gray-200 h-12 z-40">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-6 overflow-hidden">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-pink-500" />
              Trending
            </span>
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
              {trendingTopics.map((topic) => (
                <Link key={topic} href={`/search?q=${encodeURIComponent(topic)}`} className="text-sm font-medium text-gray-600 hover:text-black hover:underline whitespace-nowrap transition-colors">
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
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
              <Input 
                placeholder="Search..." 
                className="pl-12 h-11 bg-gray-100 border-transparent text-black text-base rounded-xl" 
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        router.push(`/search?q=${encodeURIComponent(e.target.value)}`);
                        setMobileMenuOpen(false);
                    }
                }}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-1">
              <MobileLink href="/" icon={<Home className="h-6 w-6 text-indigo-500" />} label="Home" />
              <MobileLink href="/upload" icon={<Upload className="h-6 w-6 text-orange-500" />} label="Upload PDF" />
              <MobileLink href="/generatesummary" icon={<FileText className="h-6 w-6 text-red-500" />} label="Summary" />
              <MobileLink href="/questions" icon={<MessageSquare className="h-6 w-6 text-cyan-500" />} label="Q&A" />
              <MobileLink href="/mcq-contest" icon={<Swords className="h-6 w-6 text-rose-500" />} label="MCQ-War" />
              <MobileLink href="/eco-editor" icon={<Leaf className="h-6 w-6 text-emerald-500" />} label="Ecoeditor" />
              {user && <MobileLink href="/badges" icon={<Trophy className="h-6 w-6 text-amber-500" />} label="Badges" />}
              <MobileLink href="/profile" icon={<User className="h-6 w-6 text-purple-500" />} label="Profile" />
            </div>

            <div className="pt-5 border-t border-gray-200">
              {user ? (
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10"><AvatarImage src={user.image} /><AvatarFallback className="bg-gray-100 text-black font-bold">U</AvatarFallback></Avatar>
                      <div className="text-sm">
                        <div className="font-bold text-gray-900 text-base">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => signOut()}><LogOut className="h-6 w-6 text-red-500" /></Button>
                </div>
              ) : (
                <Button className="w-full bg-black text-white hover:bg-black/80 font-bold h-11 text-base rounded-xl" onClick={() => signIn("google")}><LogIn className="h-5 w-5 mr-2 text-white" />Login with Google</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// Sub-components to keep clean
function NavBtn({ href, icon, label }) {
  return (
    <Button variant="ghost" asChild className="text-base font-semibold text-gray-700 hover:text-black hover:bg-gray-100/80 h-10 px-4">
      <Link href={href}>{icon}{label}</Link>
    </Button>
  );
}

function MobileLink({ href, icon, label }) {
  return (
    <Link href={href} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 text-base font-semibold text-gray-800 transition-colors">
      {icon} {label}
    </Link>
  );
}
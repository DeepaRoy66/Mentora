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
  User,
  Mail,
  Zap, // for points icon
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback,AvatarImage } from "./ui/avatar"
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

  const { data: session, status } = useSession()
  const loading = status === "loading"

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const user = session?.user

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* MAIN BAR */}
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
            <div className="flex items-center gap-3">
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

              {/* DESKTOP USER INFO & BUTTONS */}
              <div className="hidden md:flex items-center gap-4">
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

                {/* LOGGED IN STATE */}
                {loading ? (
                  <div className="text-sm text-black/60">Loading...</div>
                ) : user ? (
                  <div className="flex items-center gap-3">
                    {/* Profile Image + User Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-white/40">
                        <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                        <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>

                      <div className="text-sm">
                        <div className="font-medium text-black">{user.name || "User"}</div>
                        <div className="flex items-center gap-3 text-black/70">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <Zap className="h-3.5 w-3.5" />
                            {user.contributionPoints || 0} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" onClick={() => signOut()}>
                      Logout
                    </Button>
                  </div>
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
          <div className="px-4 py-4 space-y-4">
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

            {/* Mobile User Section */}
            <div className="border-t border-white/30 pt-4">
              {loading ? (
                <div className="text-center text-black/60">Loading...</div>
              ) : user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-black">{user.name}</div>
                      <div className="text-xs text-black/70">{user.email}</div>
                      <div className="text-xs font-semibold text-primary flex items-center gap-1 mt-1">
                        <Zap className="h-3 w-3" />
                        {user.contributionPoints || 0} points
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => signOut()}>
                    Logout
                  </Button>
                </div>
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
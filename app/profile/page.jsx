"use client"

import React from "react"
import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Mail,
  Star,
  FileText,
  Trophy,
  LogOut,
  Settings,
  ChevronRight,
  TrendingUp,
  Clock,
  BookOpen,
} from "lucide-react"

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  if (!session) redirect("/")

  const contributionPoints = 320
  const badges = 4
  const uploadedNotes = 9

  return (
    <div className="min-h-screen bg-background/50 text-foreground font-sans selection:bg-primary/10">
      <main className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={session.user?.image ?? ""} alt={session.user?.name ?? "Profile"} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {session.user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-balance mb-2">{session.user?.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  {session.user?.email}
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30 hidden sm:block" />
                <Badge variant="secondary" className="font-semibold text-xs py-0 px-2 rounded-full">
                  Pro Member
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 border-border/50 hover:bg-accent transition-all bg-transparent"
            >
              <Settings className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => signOut()}
              className="rounded-full px-4 hover:shadow-lg hover:shadow-destructive/20 transition-all"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT: STATS & RECENT ACTIVITY */}
          <div className="lg:col-span-8 space-y-10">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
                Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard icon={<Star className="h-5 w-5 text-amber-500" />} label="Points" value={contributionPoints} trend="+12% this week" />
                <StatCard icon={<Trophy className="h-5 w-5 text-blue-500" />} label="Badges" value={badges} trend="2 new badges" />
                <StatCard icon={<FileText className="h-5 w-5 text-emerald-500" />} label="Notes" value={uploadedNotes} trend="Total uploads" />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h2>
                <Button variant="link" className="text-primary p-0 h-auto font-semibold">
                  View all
                </Button>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Uploaded: Advanced Calculus Notes", date: "2 hours ago", icon: <FileText /> },
                  { title: "Earned 'Problem Solver' Badge", date: "1 day ago", icon: <Trophy /> },
                  { title: "Reached 300 Contribution Points", date: "3 days ago", icon: <TrendingUp /> },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-pretty">{item.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {item.date}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: SIDEBAR INFO */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="rounded-3xl border-none bg-primary text-primary-foreground overflow-hidden shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
                  You've helped over 250 students this month with your contributions.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Current Level: 4</span>
                    <span>75% to Level 5</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-3/4 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-muted/30 border border-border/40">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Top Subjects
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Mathematics", "Physics", "Computer Science", "Economics"].map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-background/50 hover:bg-primary/10 hover:text-primary transition-colors cursor-default border-border/60"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, trend }) {
  return (
    <div className="bg-card border border-border/40 rounded-3xl p-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-2xl bg-muted/50">{icon}</div>
      </div>
      <div>
        <p className="text-4xl font-bold tracking-tight mb-1">{value}</p>
        <p className="text-sm font-bold text-muted-foreground tracking-wide uppercase">{label}</p>
        <p className="text-[10px] font-bold text-primary mt-3 tracking-wider flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </p>
      </div>
    </div>
  )
}

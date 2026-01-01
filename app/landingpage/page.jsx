"use client"

import Link from "next/link"
import { Navbar } from "../components/navbar"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { BookOpen, Users, GraduationCap, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function LandingPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-br from-[#F5F7FA] via-white to-[#EEF3F9]">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-32">
        {/* Glow */}
        <div className="absolute inset-0 -z-10 flex justify-center">
          <div className="h-72 w-72 bg-[#0078B4]/20 blur-[120px] rounded-full" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-tight text-[#002C5F]"
        >
          Master any subject with{" "}
          <span className="text-[#0078B4] italic">Mentora</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-xl text-[#002C5F]/80 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Upload study materials, connect with world-class mentors, and transform
          the way you learn using AI-powered tools.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            className="h-14 px-8 text-lg bg-[#0078B4] hover:bg-[#006699] min-w-[200px] group"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 text-lg border-[#0078B4] text-[#0078B4] hover:bg-[#C2E7FF]/50 min-w-[200px]"
          >
            Browse Courses
          </Button>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
        {features.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <Card className="group bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-md hover:shadow-xl transition-all">
              <CardContent className="pt-10 pb-8 text-center">
                <div className="h-14 w-14 rounded-full bg-[#C2E7FF] flex items-center justify-center mb-6 text-[#0078B4] mx-auto group-hover:scale-110 transition">
                  <item.icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-semibold mb-3 text-[#002C5F]">
                  {item.title}
                </h3>

                <p className="text-[#002C5F]/80 leading-relaxed">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* CTA SECTION */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto px-6 py-20 rounded-3xl bg-[#0078B4] text-white text-center shadow-xl mb-32"
      >
        <h2 className="text-4xl font-bold mb-6">
          Start learning smarter today
        </h2>
        <p className="text-lg text-white/90 mb-8">
          Join thousands of learners using Mentora to achieve more in less time.
        </p>
        <Button size="lg" className="bg-white text-[#0078B4] hover:bg-white/90">
          Join Now
        </Button>
      </motion.section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t pt-12 pb-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[#002C5F]">
        <div className="text-xl font-bold tracking-tighter">MENTORA</div>

        <div className="flex gap-8 text-sm">
          <Link href="#" className="hover:text-[#0078B4]">About</Link>
          <Link href="#" className="hover:text-[#0078B4]">Contact</Link>
          <Link href="#" className="hover:text-[#0078B4]">Privacy</Link>
          <Link href="#" className="hover:text-[#0078B4]">Terms</Link>
        </div>

        <div className="text-sm text-[#002C5F]/70">
          © 2025 Mentora Inc. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: "Interactive Learning",
    desc: "Upload PDFs and let AI generate quizzes, summaries, and flashcards instantly.",
    icon: BookOpen,
  },
  {
    title: "Expert Mentorship",
    desc: "Connect one-on-one with industry leaders and academic experts.",
    icon: Users,
  },
  {
    title: "Verified Certificates",
    desc: "Earn industry-recognized certificates as you master new skills.",
    icon: GraduationCap,
  },
]

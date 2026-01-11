"use client"

import Link from "next/link"

import { Button } from "../components/ui/button"
import { BookOpen, Users, GraduationCap, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import UploadsPage from "../components/all-upload/page"


export default function LandingPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 bg-gradient-to-br from-[#F5F7FA] via-white to-[#EEF3F9]">
      
     <UploadsPage/>

      

      
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

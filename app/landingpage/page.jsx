"use client"

import Link from "next/link"
import { Button } from "../components/ui/button"
import { motion } from "framer-motion"
import UploadsPage from "../components/all-upload/page"
import { Sparkles, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    // Updated main gradient background for a fresher look
    <div className="min-h-screen bg-[#F5F7FA] overflow-hidden relative font-sans text-[#002C5F]">
      
      {/* DECORATIVE BACKGROUND BLOBS */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-100/60 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-yellow-100/40 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-blue-50/80 blur-3xl -z-10 pointer-events-none" />


      {/* 1. MAIN CONTENT: PDF DISPLAY SECTION */}
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 mb-12 relative z-10">
        
        {/* Header with slight decoration */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#0078B4] mb-2 font-medium">
                <Sparkles size={18} /> Let's get studying
            </div>
            <h1 className="text-4xl font-extrabold text-[#002C5F] tracking-tight">
                Recent Documents
            </h1>
            <p className="text-lg text-gray-500 mt-2 max-w-xl">
                Explore the latest study materials uploaded by the community.
            </p>
          </div>
           {/* Optional: A "View All" link if you want it back */}
           {/* <Link href="#" className="group flex items-center gap-1 text-[#0078B4] font-semibold">
              View all <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
           </Link> */}
        </div>

        {/* The PDF Grid Container - Dressed up */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="min-h-[500px] bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 border border-white/50 relative"
        >
           {/* A subtle decorative element hanging off the corner */}
           <div className="absolute -top-6 -right-6 w-20 h-20 bg-[url('https://images.unsplash.com/photo-1629904853090-ec9a80d41b8e?w=300&h=300&fit=crop')] bg-cover rounded-2xl rotate-12 shadow-lg border-4 border-white hidden md:block" />
           
           {/* This component displays your grid of 20 PDFs */}
           <UploadsPage />
        </motion.div>
      </div>


      {/* 2. CTA SECTION (Redesigned) */}
      <div className="max-w-7xl mx-auto px-6 pb-20 relative z-10">
        <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            // Using an image overlay background instead of plain color
            className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-900/20"
        >
            {/* Background Image with Overlay */}
            <div 
                className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#002C5F]/95 to-[#0078B4]/90 mix-blend-multiply" />
            </div>
            
            <div className="relative z-10 px-8 py-20 md:py-24 text-center text-white">
                {/* Decorative floating icons */}
                <div className="absolute top-10 left-10 text-blue-300/30 hidden md:block"><Sparkles size={48} /></div>
                <div className="absolute bottom-10 right-10 text-blue-300/30 hidden md:block"><Sparkles size={32} /></div>

                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Start learning <span className="text-yellow-300">smarter</span> today.
                </h2>
                <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of learners using Mentora's AI-powered tools to grasp complex topics faster and achieve more in less time.
                </p>
                <Button 
                    size="lg" 
                    className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-10 py-7 text-lg rounded-full font-bold shadow-lg shadow-yellow-400/20 transition-all hover:scale-105"
                >
                Join Now — It's Free
                </Button>
            </div>
        </motion.section>
      </div>


      {/* 3. FOOTER */}
      <footer className="bg-white/60 backdrop-blur-md border-t border-blue-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-gradient-to-br from-[#0078B4] to-[#002C5F] rounded-xl shadow-sm flex items-center justify-center text-white font-bold">M</div>
            <div className="text-xl font-bold tracking-tighter text-[#002C5F]">MENTORA</div>
          </div>

          <div className="flex gap-8 text-sm font-medium text-[#002C5F]/80">
            <Link href="#" className="hover:text-[#0078B4] transition-colors">About</Link>
            <Link href="#" className="hover:text-[#0078B4] transition-colors">Contact</Link>
            <Link href="#" className="hover:text-[#0078B4] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#0078B4] transition-colors">Terms</Link>
          </div>

          <div className="text-sm text-[#002C5F]/60">
            © 2025 Mentora Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
import Link from "next/link"
import { Navbar } from "../components/navbar"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { ArrowRight, BookOpen, Users, GraduationCap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] pt-32 pb-20">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-24">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-tight text-[#002C5F]">
          Master any subject with <span className="text-[#0078B4] italic">Mentora</span>
        </h1>

        <p className="text-xl text-[#002C5F]/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your study materials, connect with world-class mentors, and transform the way you learn with our
          intelligent platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-14 px-8 text-lg font-medium bg-[#0078B4] text-white hover:bg-[#006699] min-w-[200px]"
          >
            Get Started Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 text-lg font-medium border-[#0078B4] text-[#0078B4] hover:bg-[#C2E7FF]/50 min-w-[200px] bg-transparent"
          >
            Browse Courses
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <Card className="bg-white border-none rounded-xl shadow hover:shadow-lg transition">
          <CardContent className="pt-8 text-center">
            <div className="h-12 w-12 rounded-full bg-[#C2E7FF] flex items-center justify-center mb-6 text-[#0078B4] mx-auto">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-[#002C5F]">Interactive Learning</h3>
            <p className="text-[#002C5F]/80 leading-relaxed">
              Upload PDFs and let our AI create interactive quizzes, summaries, and flashcards instantly.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none rounded-xl shadow hover:shadow-lg transition">
          <CardContent className="pt-8 text-center">
            <div className="h-12 w-12 rounded-full bg-[#C2E7FF] flex items-center justify-center mb-6 text-[#0078B4] mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-[#002C5F]">Expert Mentorship</h3>
            <p className="text-[#002C5F]/80 leading-relaxed">
              Connect 1-on-1 with industry leaders and academic experts to accelerate your growth.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none rounded-xl shadow hover:shadow-lg transition">
          <CardContent className="pt-8 text-center">
            <div className="h-12 w-12 rounded-full bg-[#C2E7FF] flex items-center justify-center mb-6 text-[#0078B4] mx-auto">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-[#002C5F]">Verified Certificates</h3>
            <p className="text-[#002C5F]/80 leading-relaxed">
              Earn industry-recognized certificates as you master new skills and complete challenges.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 border-t pt-12 pb-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[#002C5F]">
        <div className="text-xl font-bold tracking-tighter">MENTORA</div>
        <div className="flex gap-8 text-sm">
          <Link href="#" className="hover:text-[#0078B4]">About</Link>
          <Link href="#" className="hover:text-[#0078B4]">Contact</Link>
          <Link href="#" className="hover:text-[#0078B4]">Privacy</Link>
          <Link href="#" className="hover:text-[#0078B4]">Terms</Link>
        </div>
        <div className="text-sm">© 2025 Mentora Inc. All rights reserved.</div>
      </footer>
    </div>
  )
}

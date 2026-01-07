"use client"

import { useEffect, useState } from "react"
import Navbar from "./components/navbar"
import QuestionList from "./components/question-list"
import Link from "next/link"

export default function Home() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:8000/MentoraQ/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")
      const data = await response.json()
      setQuestions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Questions</h1>
          <Link href="/MentoraQ/ask">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Ask Question
            </button>
          </Link>
        </div>

        {loading && <p className="text-center text-gray-500">Loading questions...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}

        {!loading && questions.length === 0 && (
          <p className="text-center text-gray-500">No questions yet. Be the first to ask!</p>
        )}

        {!loading && questions.length > 0 && <QuestionList questions={questions} />}
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Navbar from "../../components/navbar"
import AnswerSection from "../../components/answer-section"
import CommentForm from "../../components/comment-form"
import VoteButtons from "../../components/vote-buttons"

const API = process.env.NEXT_PUBLIC_API_URL

export default function QuestionDetail() {
  const params = useParams()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [params.id])

  const fetchData = async (signal) => {
    try {
      setLoading(true)

      const [qRes, aRes] = await Promise.all([
        fetch(`${API}/MentoraQ/questions/${params.id}`, { signal }),
        fetch(`${API}/MentoraQ/questions/${params.id}/answers`, { signal })
      ])
      
      if (!qRes.ok || !aRes.ok) throw new Error("Failed to load")

      setQuestion(await qRes.json())
      setAnswers(await aRes.json())
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>
  if (error) return <p className="text-center text-red-600">{error}</p>
  if (!question) return <p className="text-center">Not found</p>

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto p-6">

        <div className="flex gap-4 border-b pb-6">
          <VoteButtons
            type="question"
            id={question._id}
            votes={question.votes}
            onVote={() => fetchData()}
          />

          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {question.title}
            </h1>

            <p className="mt-4 whitespace-pre-wrap">
              {question.description}
            </p>

            {question.tags?.length > 0 && (
              <div className="flex gap-2 mt-3">
                {question.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-gray-200 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs mt-2 text-gray-500">
              {new Date(question.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="ml-12 mt-6">
          <CommentForm
            targetType="question"
            targetId={question._id}
            onCommentPosted={() => fetchData()}
          />

          {question.comments?.length > 0 && (
            <div className="space-y-3 mt-4">
              {question.comments.map(c => (
                <div
                  key={c._id}
                  className="bg-gray-50 p-3 rounded"
                >
                  <p>{c.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mt-10">
          {answers.length} Answers
        </h2>

        {answers.length === 0 ? (
          <p className="text-gray-500 mt-4">
            No answers yet
          </p>
        ) : (
          <div className="space-y-6 mt-6">
            {answers.map(ans => (
              <AnswerSection
                key={ans._id}
                answer={ans}
                questionId={params.id}
                onUpdate={() => fetchData()}
              />
            ))}
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg mt-10">
          <h3 className="text-xl font-bold mb-4">
            Your Answer
          </h3>

          <AnswerSection
            isNew
            questionId={params.id}
            onUpdate={() => fetchData()}
          />
        </div>

      </main>
    </div>
  )
}

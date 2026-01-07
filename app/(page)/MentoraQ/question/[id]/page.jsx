"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Navbar from "../../components/navbar"
import AnswerSection from "../../components/answer-section"
import CommentForm from "../../components/comment-form"
import VoteButtons from "../../components/vote-buttons"

export default function QuestionDetail() {
  const params = useParams()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchQuestionAndAnswers()
  }, [params.id])

  const fetchQuestionAndAnswers = async () => {
    try {
      setLoading(true)
      const [qRes, aRes] = await Promise.all([
        fetch(`http://localhost:8000/backend/MentoraQ/questions/${params.id}`),
        fetch(`http://localhost:8000/backend/MentoraQ/questions/${params.id}/answers`),
      ])

      if (!qRes.ok || !aRes.ok) throw new Error("Failed to fetch")

      const questionData = await qRes.json()
      const answersData = await aRes.json()

      setQuestion(questionData)
      setAnswers(answersData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="text-center mt-8">Loading...</p>
      </div>
    )
  if (error)
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="text-center mt-8 text-red-600">{error}</p>
      </div>
    )
  if (!question)
    return (
      <div className="min-h-screen">
        <Navbar />
        <p className="text-center mt-8">Question not found</p>
      </div>
    )

  const handleAnswerPosted = () => {
    fetchQuestionAndAnswers()
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Question */}
        <div className="mb-8 pb-8 border-b">
          <div className="flex gap-4">
            <VoteButtons type="question" id={question._id} votes={question.votes} onVote={fetchQuestionAndAnswers} />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-4">{question.title}</h1>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{question.description}</p>

              {question.tags && question.tags.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {question.tags.map((tag) => (
                    <span key={tag} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500">asked {new Date(question.created_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Question Comments */}
          <div className="mt-6 ml-12">
            <CommentForm targetType="question" targetId={question._id} onCommentPosted={fetchQuestionAndAnswers} />
            {question.comments && question.comments.length > 0 && (
              <div className="mt-4 space-y-3">
                {question.comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-3 rounded text-sm">
                    <p className="text-gray-700">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Answers */}
        <div>
          <h2 className="text-2xl font-bold mb-6">{answers.length} Answers</h2>

          {answers.length === 0 ? (
            <p className="text-gray-500 mb-8">No answers yet. Be the first to answer!</p>
          ) : (
            <div className="space-y-6 mb-8">
              {answers.map((answer) => (
                <AnswerSection
                  key={answer._id}
                  answer={answer}
                  questionId={params.id}
                  onUpdate={fetchQuestionAndAnswers}
                />
              ))}
            </div>
          )}
        </div>

        {/* Post Answer */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Your Answer</h3>
          <AnswerSection isNew questionId={params.id} onUpdate={handleAnswerPosted} />
        </div>
      </main>
    </div>
  )
}

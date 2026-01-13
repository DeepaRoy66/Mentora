"use client"

import { useState } from "react"
import VoteButtons from "./vote-buttons"
import CommentForm from "./comment-form"

export default function AnswerSection({ answer, questionId, isNew = false, onUpdate }) {
  const [content, setContent] = useState(answer?.content || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/MentoraQ/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      })

      if (!response.ok) throw new Error("Failed to post answer")

      setContent("")
      onUpdate?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isNew) {
    return (
      <form onSubmit={handleSubmit}>
        {error && <p className="mb-4 text-red-600">{error}</p>}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows="6"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write your answer here..."
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? "Posting..." : "Post Your Answer"}
        </button>
      </form>
    )
  }

  return (
    <div className="pb-6 border-b">
      <div className="flex gap-4">
        <VoteButtons type="answer" id={answer._id} votes={answer.votes} onVote={onUpdate} />
        <div className="flex-1">
          <p className="text-gray-700 whitespace-pre-wrap">{answer.content}</p>
          <p className="text-xs text-gray-500 mt-3">answered {new Date(answer.created_at).toLocaleString()}</p>

          {/* Answer Comments */}
          <div className="mt-4">
            <CommentForm targetType="answer" targetId={answer._id} questionId={questionId} onCommentPosted={onUpdate} />
            {answer.comments && answer.comments.length > 0 && (
              <div className="mt-3 space-y-2">
                {answer.comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-2 rounded text-sm">
                    <p className="text-gray-700">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

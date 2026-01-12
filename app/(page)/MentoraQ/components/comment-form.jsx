"use client"

import { useState } from "react"

export default function CommentForm({ targetType, targetId, onCommentPosted }) {
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let url = ""
      if (targetType === "question") {
        url = `http://localhost:8000/MentoraQ/comment/question/${targetId}`
      } else if (targetType === "answer") {
        url = `http://localhost:8000/MentoraQ/comment/answer/${targetId}`
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment }),
      })

      if (!response.ok) throw new Error("Failed to post comment")

      setComment("")
      onCommentPosted?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={loading || !comment.trim()}
        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-400 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
      >
        {loading ? "Posting..." : "Comment"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  )
}

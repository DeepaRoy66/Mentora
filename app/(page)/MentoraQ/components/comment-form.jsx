"use client"
import { useState } from "react"
import { authFetch } from "@/lib/api"

export default function CommentForm({ targetType, targetId, onCommentPosted }) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const submitComment = async () => {
    if (!text.trim()) return
    setLoading(true)

    try {
      await authFetch(`/MentoraQ/comment/${targetType}/${targetId}`, {
        method: "POST",
        body: JSON.stringify({ text }),
      })
      setText("")
      if (onCommentPosted) onCommentPosted()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Add a comment..."
      />
      <button
        onClick={submitComment}
        disabled={loading}
        className="mt-2 bg-blue-600 text-white px-4 py-1 rounded disabled:bg-gray-400"
      >
        {loading ? "Posting..." : "Comment"}
      </button>
    </div>
  )
}

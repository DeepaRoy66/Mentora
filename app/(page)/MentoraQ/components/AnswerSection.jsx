"use client"
import { useState } from "react"
import { authFetch } from "@/lib/api"
import VoteButtons from "./vote-buttons"
import CommentForm from "./comment-form"

export default function AnswerSection({ answer, questionId, onUpdate, isNew }) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const postAnswer = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      await authFetch(`/MentoraQ/questions/${questionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ text }),
      })
      setText("")
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (isNew) {
    return (
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write your answer..."
        />
        <button
          onClick={postAnswer}
          disabled={loading}
          className="mt-2 bg-green-600 text-white px-4 py-1 rounded disabled:bg-gray-400"
        >
          {loading ? "Posting..." : "Post Answer"}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex gap-4">
        <VoteButtons
          type="answer"
          id={answer._id}
          votes={answer.votes}
          onVote={onUpdate}
        />
        <div className="flex-1">
          <p className="whitespace-pre-wrap">{answer.text}</p>

          {(answer.comments || []).length > 0 && (
            <div className="mt-3 space-y-2 ml-6">
              {answer.comments.map(c => (
                <div key={c._id} className="bg-gray-50 p-2 rounded">
                  <p>{c.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="ml-6">
            <CommentForm
              targetType="answer"
              targetId={answer._id}
              onCommentPosted={onUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

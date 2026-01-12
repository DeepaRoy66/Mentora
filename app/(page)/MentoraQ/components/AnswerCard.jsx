"use client"
import { authFetch } from "@/lib/api"
import { useSession } from "next-auth/react"

export default function AnswerCard({ a, q }) {
  const { data: session } = useSession()

  async function accept() {
    await authFetch(`/MentoraQ/questions/${q._id}/accept/${a._id}`, { method: "POST" })
    location.reload()
  }

  return (
    <div className={`border p-4 mt-4 ${q.accepted_answer_id === a._id ? "bg-green-100" : ""}`}>
      <p>{a.text}</p>

      {session?.user?.email === q.author_email && (
        <button onClick={accept} className="text-sm text-green-700">Accept</button>
      )}
    </div>
  )
}

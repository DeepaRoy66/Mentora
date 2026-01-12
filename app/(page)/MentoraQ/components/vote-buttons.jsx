"use client"
import { authFetch } from "@/lib/api"
import { useState } from "react"

export default function VoteButtons({ type, id, votes, onVote }) {
  const [localVotes, setLocalVotes] = useState(votes)

  const vote = async (value) => {
    try {
      await authFetch(`/MentoraQ/vote/${type}/${id}/${value}`, { method: "POST" })
      setLocalVotes(localVotes + value)
      if (onVote) onVote()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col items-center w-12">
      <button
        onClick={() => vote(1)}
        className="text-green-600 text-lg font-bold"
      >▲</button>
      <span className="font-bold">{localVotes}</span>
      <button
        onClick={() => vote(-1)}
        className="text-red-600 text-lg font-bold"
      >▼</button>
    </div>
  )
}

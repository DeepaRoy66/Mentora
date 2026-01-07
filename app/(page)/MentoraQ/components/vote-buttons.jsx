"use client"

import { useState } from "react"

export default function VoteButtons({ type, id, votes = 0, onVote }) {
  const [localVotes, setLocalVotes] = useState(votes)
  const [userVote, setUserVote] = useState(0)

  const handleVote = async (direction) => {
    try {
      const newDirection = userVote === direction ? 0 : direction
      const response = await fetch(`http://localhost:8000/vote/${type}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: newDirection }),
      })

      if (response.ok) {
        const data = await response.json()
        setLocalVotes(data.votes)
        setUserVote(newDirection)
        onVote?.()
      }
    } catch (err) {
      console.error("Vote error:", err)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 bg-gray-50 p-2 rounded">
      <button
        onClick={() => handleVote(1)}
        className={`text-xl ${userVote === 1 ? "text-orange-500" : "text-gray-400"} hover:text-orange-500`}
      >
        ▲
      </button>
      <span className="text-sm font-semibold">{localVotes}</span>
      <button
        onClick={() => handleVote(-1)}
        className={`text-xl ${userVote === -1 ? "text-blue-500" : "text-gray-400"} hover:text-blue-500`}
      >
        ▼
      </button>
    </div>
  )
}

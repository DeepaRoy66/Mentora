"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authFetch } from "@/lib/api"

export default function Ask() {
  const [title, setTitle] = useState("")
  const [description, setDesc] = useState("")
  const [tags, setTags] = useState("")
  const router = useRouter()

  async function submit(e) {
    e.preventDefault()
    const res = await authFetch("/MentoraQ/questions", {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        tags: tags.split(",").map(t => t.trim()),
      }),
    })
    const q = await res.json()
    router.push(`/question/${q._id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form 
        onSubmit={submit} 
        className="bg-white shadow-lg rounded-xl w-full max-w-lg p-8 space-y-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Ask a Question
        </h2>

        {/* Title Input */}
        <div className="flex flex-col">
          <label className="mb-1 text-gray-600 font-medium">Title</label>
          <input
            type="text"
            placeholder="Enter your question title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="p-3 border rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            required
          />
        </div>

        {/* Description Input */}
        <div className="flex flex-col">
          <label className="mb-1 text-gray-600 font-medium">Description</label>
          <textarea
            placeholder="Describe your question in detail"
            value={description}
            onChange={e => setDesc(e.target.value)}
            className="p-3 border rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition h-32 resize-none"
            required
          />
        </div>

        {/* Tags Input */}
        <div className="flex flex-col">
          <label className="mb-1 text-gray-600 font-medium">Tags</label>
          <input
            type="text"
            placeholder="Add tags separated by commas"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="p-3 border rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Post Question
        </button>
      </form>
    </div>
  )
}

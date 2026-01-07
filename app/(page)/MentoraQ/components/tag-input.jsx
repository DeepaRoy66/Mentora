"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

const POPULAR_TAGS = [
  "javascript",
  "react",
  "nextjs",
  "typescript",
  "python",
  "django",
  "node",
  "html",
  "css",
  "sql",
  "mongodb",
  "firebase",
  "vue",
  "angular",
]

export default function TagInput({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t)

  const handleInputChange = (e) => {
    const input = e.target.value.toLowerCase()
    onChange(e)

    if (input.length > 0) {
      const filtered = POPULAR_TAGS.filter((tag) => tag.includes(input) && !tags.includes(tag))
      setSuggestions(filtered.slice(0, 5))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      const newValue = tags.length > 0 ? `${value},${tag}` : tag
      onChange({ target: { name: "tags", value: newValue } })
    }
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove) => {
    const newTags = tags.filter((t) => t !== tagToRemove)
    onChange({ target: { name: "tags", value: newTags.join(", ") } })
  }

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          name="tags"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 z-10">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 transition"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <div key={tag} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

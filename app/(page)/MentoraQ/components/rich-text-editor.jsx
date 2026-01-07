"use client"

import { useState } from "react"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  ImageIcon,
  Code2,
  List,
  ListOrdered,
  Table,
  Heading2,
  HelpCircle,
} from "lucide-react"

export default function RichTextEditor({ value, onChange, placeholder, minLength }) {
  const [isFocused, setIsFocused] = useState(false)

  const insertMarkdown = (before, after = "") => {
    const textarea = document.querySelector('textarea[name="body"]')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.substring(start, end)
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end)

    onChange({ target: { name: "body", value: newValue } })

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + before.length + selected.length
      textarea.focus()
    }, 0)
  }

  const buttons = [
    { icon: Heading2, label: "Heading", action: () => insertMarkdown("## ", "") },
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: Strikethrough, label: "Strikethrough", action: () => insertMarkdown("~~", "~~") },
    { icon: Code, label: "Inline Code", action: () => insertMarkdown("`", "`") },
    { icon: Link, label: "Link", action: () => insertMarkdown("[text](", ")") },
    { icon: ImageIcon, label: "Image", action: () => insertMarkdown("![alt](", ")") },
    { icon: Code2, label: "Code Block", action: () => insertMarkdown("```\n", "\n```") },
    { icon: List, label: "Bullet List", action: () => insertMarkdown("- ", "") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("1. ", "") },
    {
      icon: Table,
      label: "Table",
      action: () => insertMarkdown("| Col1 | Col2 |\n|------|------|\n| Data | Data |", ""),
    },
  ]

  return (
    <div className="space-y-2">
      {isFocused && (
        <div className="bg-blue-50 border border-blue-200 rounded-t-lg p-3 flex flex-wrap gap-1">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={btn.action}
              title={btn.label}
              className="p-2 hover:bg-blue-100 rounded text-gray-600 hover:text-gray-900 transition"
              aria-label={btn.label}
            >
              <btn.icon size={18} />
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <HelpCircle size={16} />
            <span>Markdown supported</span>
          </div>
        </div>
      )}

      <textarea
        name="body"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        rows="8"
        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition font-sans ${
          isFocused ? "border-blue-500 bg-white rounded-b-none" : "border-gray-300 bg-white"
        }`}
      />
    </div>
  )
}

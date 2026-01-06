// components/ui/stat.jsx
import React from "react"

export function Stat({ icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-8 text-center border shadow-sm">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-gray-600">{label}</p>
    </div>
  )
}

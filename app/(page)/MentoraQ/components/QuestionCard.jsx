import Link from "next/link"

export default function QuestionCard({ q }) {
  return (
    <Link href={`/MentoraQ/question/${q._id}`}>
      <div className="bg-white p-4 rounded mb-4 shadow">
        <h2 className="font-bold text-lg">{q.title}</h2>
        <p className="text-sm text-gray-600">{q.description}</p>
      </div>
    </Link>
  )
}

import Link from "next/link"

export default function QuestionList({ questions }) {
  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Link key={question._id} href={`/question/${question._id}`}>
          <div className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
            <div className="flex-shrink-0 text-center bg-gray-50 p-3 rounded min-w-16">
              <div className="text-lg font-bold text-blue-600">{question.votes || 0}</div>
              <div className="text-xs text-gray-500">votes</div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700">{question.title}</h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{question.description}</p>

              {question.tags && question.tags.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {question.tags.map((tag) => (
                    <span key={tag} className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {question.answers_count || 0} answers • asked {new Date(question.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

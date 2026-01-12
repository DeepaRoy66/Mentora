import QuestionCard from "./components/QuestionCard"

export default async function Home() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/MentoraQ/questions`, { cache: "no-store" })
  const questions = await res.json()

  return (
    <main className="max-w-3xl mx-auto p-6">
      {questions.map(q => (
        <QuestionCard key={q._id} q={q} />
      ))}
    </main>
  )
}

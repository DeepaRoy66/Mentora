"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Mail,
  FileText,
  Zap,
  Trophy,
  LogOut,
  Camera,
  MessageSquare,
  HelpCircle,
  Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ points: 0, notes: 0, badges: 0 });
  const [contributions, setContributions] = useState(null);
  const [myQuestions, setMyQuestions] = useState([]);
  const [myAnswers, setMyAnswers] = useState([]);
  const [backendImage, setBackendImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    // 1. Wait for user to be logged in
    if (!session?.user?.email) return;

    // 2. Fetch Stats from PYTHON Backend
    // Must use x-user-email header so Python knows who we are
    fetch("http://127.0.0.1:8000/api/user-stats", {
      headers: { 
        "x-user-email": session.user.email,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Backend error " + res.status);
        return res.json();
      })
      .then((data) => {
        setStats({
          points: data.contributionPoints || 0,
          notes: data.notesCount || 0,
          badges: data.badgesCount || 0,
        });
        if (data.image) setBackendImage(data.image);
      })
      .catch((err) => console.error("Stats Fetch Error:", err));

    // Fetch detailed contributions
    if (session?.user?.email) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${session.user.email}/contributions`
      )
        .then((res) => res.json())
        .then((data) => setContributions(data))
        .catch((err) => console.error("Contributions Fetch Error:", err));

      // Fetch user's questions and answers
      Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/questions?page=1&limit=5`
        ).then((r) => r.json()),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/questions?page=1&limit=20`
        ).then((r) => r.json()),
      ])
        .then(([questionsData]) => {
          // Filter user's questions and answers (simplified - in production, add authorId filter to API)
          const userQuestions = (questionsData.questions || []).filter(
            (q) => q.authorId === session.user.email
          );
          setMyQuestions(userQuestions.slice(0, 5));
        })
        .catch((err) => console.error("Q&A Fetch Error:", err));
    }
  }, [session]);

  if (status === "loading")
    return <div className="p-10 text-center">Loading profile...</div>;
  if (!session)
    return (
      <div className="p-10 text-center">Please log in to view profile.</div>
    );

  const user = session.user;
  const displayImage = uploadedImage || backendImage || user.image;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-white">
      <Card className="min-h-screen rounded-none border-0 shadow-none">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 md:px-16 py-12 md:py-24 relative">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 text-white w-full">
            <div className="relative group h-32 w-32 md:h-40 md:w-40 rounded-full ring-4 ring-white shadow-2xl overflow-hidden bg-white shrink-0">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Profile"
                  className="object-cover h-full w-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-5xl font-bold text-blue-600 bg-white">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-8 h-8 text-white" />
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {user.name}
              </h1>
              <p className="text-blue-100 mt-2 text-lg font-medium opacity-90">
                {user.email}
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <Button onClick={() => signOut()} variant="secondary" size="lg">
                <LogOut className="mr-2 h-4 w-4" /> LogOut
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 md:px-16 py-12 space-y-12 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Stat
              icon={<Zap className="w-8 h-8 text-yellow-500" />}
              label="Contribution Points"
              value={stats.points}
            />
            <Stat
              icon={<FileText className="w-8 h-8 text-blue-600" />}
              label="Uploaded Notes"
              value={stats.notes}
            />
            <Stat
              icon={<Trophy className="w-8 h-8 text-purple-600" />}
              label="Badges Earned"
              value={stats.badges}
            />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-black font-semibold"
              onClick={() => router.push("/questions")}
            >
              <HelpCircle className="w-6 h-6 text-black" />
              <span className="text-black">Browse Questions</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-black font-semibold"
              onClick={() => router.push("/questions/ask")}
            >
              <MessageSquare className="w-6 h-6 text-black" />
              <span className="text-black">Ask Question</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-black font-semibold"
              onClick={() => router.push("/badges")}
            >
              <Trophy className="w-6 h-6 text-black" />
              <span className="text-black">View Badges</span>
            </Button>
          </div>

          {/* Contribution Details */}
          {contributions && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-black">Contribution Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black font-medium">PDFs Uploaded</p>
                  <p className="text-2xl font-bold text-black">
                    {contributions.uploadedPdfCount || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black font-medium">Quizzes Completed</p>
                  <p className="text-2xl font-bold text-black">
                    {contributions.completedQuizCount || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black font-medium">Accepted Answers</p>
                  <p className="text-2xl font-bold text-black">
                    {contributions.acceptedAnswersCount || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black font-medium">Total Points</p>
                  <p className="text-2xl font-bold text-black">
                    {contributions.contributionPoints || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* My Questions */}
          {myQuestions.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-black">My Questions</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 border border-gray-300 text-black"
                  onClick={() => router.push("/questions")}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {myQuestions.map((q) => {
                  const questionId = q.id || q._id;
                  if (!questionId || questionId === "undefined") return null;
                  
                  return (
                    <Card
                      key={questionId}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        if (questionId && questionId !== "undefined") {
                          router.push(`/questions/${questionId}`);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1 text-black">{q.title}</h3>
                        <p className="text-sm text-black">
                          {q.answerCount || 0} answers •{" "}
                          {new Date(q.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-4 bg-gray-50 w-16 h-16 rounded-full items-center mx-auto">
        {icon}
      </div>
      <p className="text-4xl font-bold text-black mb-1">{value}</p>
      <p className="text-sm font-semibold text-black uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Trophy, Lock, CheckCircle, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { authFetch } from "@/lib/api";

export default function BadgesPage() {
  const { data: session, status } = useSession();
  const [contributions, setContributions] = useState(null);
  const [badges, setBadges] = useState({ earned: [], locked: [] });
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (session?.user?.email && !hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    } else if (!session?.user?.email) {
      setLoading(false);
    }
  }, [session]);

  const fetchData = async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      // Fetch contributions and badges
      const [contribRes, badgesRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/${session.user.email}/contributions`
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/${session.user.email}/badges`
        ),
      ]);

      const contribData = await contribRes.json();
      const badgesData = await badgesRes.json();

      setContributions(contribData);
      setBadges(badgesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="container mx-auto p-8 text-center">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p>Please log in to view your badges</p>
      </div>
    );
  }

  const totalPoints = contributions?.contributionPoints || 0;
  const earnedCount = badges.earned?.length || 0;
  const totalBadges =
    (badges.earned?.length || 0) + (badges.locked?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl pt-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Badges & Contributions
        </h1>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-yellow-100 rounded-xl shadow-sm hover:bg-yellow-200 transition-colors duration-300">
                  <Zap className="w-8 h-8 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Contribution Points
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalPoints}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-purple-100 rounded-xl shadow-sm hover:bg-purple-200 transition-colors duration-300">
                  <Trophy className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Badges Earned
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {earnedCount} / {totalBadges}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 transform">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-100 rounded-xl shadow-sm hover:bg-blue-200 transition-colors duration-300">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Accepted Answers
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {contributions?.acceptedAnswersCount || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card className="mb-10 bg-white border border-gray-200 shadow-md">
          <CardHeader className="pb-4 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">
              Contribution Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  PDFs Uploaded
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {contributions?.uploadedPdfCount || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Quizzes Completed
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {contributions?.completedQuizCount || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Accepted Answers
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {contributions?.acceptedAnswersCount || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Total Points
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalPoints}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earned Badges */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Earned Badges</h2>
          {badges.earned?.length === 0 ? (
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardContent className="py-12 text-center text-gray-500">
                No badges earned yet. Keep contributing to unlock badges!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {badges.earned.map((badge) => (
                <Card
                  key={badge.id}
                  className="bg-white border-2 border-green-500 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 transform"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {badge.iconUrl ? (
                        <img
                          src={badge.iconUrl}
                          alt={badge.name}
                          className="w-14 h-14 rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center shadow-sm">
                          <Trophy className="w-7 h-7 text-green-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">
                          {badge.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {badge.description}
                        </p>
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out animate-pulse"
                              style={{ width: "100%" }}
                            ></div>
                          </div>
                          <p className="text-xs font-medium text-green-600">
                            Unlocked
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Locked Badges */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Locked Badges</h2>
          {badges.locked?.length === 0 ? (
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardContent className="py-12 text-center text-gray-500">
                Congratulations! You've unlocked all badges!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {badges.locked.map((badge) => {
                // Calculate progress - match backend ruleType values
                let progress = 0;
                let current = 0;
                const threshold = badge.threshold || 1; // Ensure threshold is at least 1 to avoid division by zero

                // Ensure contributions is loaded before calculating
                if (!contributions) {
                  current = 0;
                  progress = 0;
                } else {
                  // Ensure we're working with numbers
                  const contrib = contributions || {};
                  
                  if (badge.ruleType === "points") {
                    current = Number(totalPoints) || 0;
                    progress = threshold > 0 ? Math.min(100, Math.max(0, (current / threshold) * 100)) : 0;
                  } else if (badge.ruleType === "accepted_answer_count") {
                    current = Number(contrib.acceptedAnswersCount) || 0;
                    progress = threshold > 0 ? Math.min(100, Math.max(0, (current / threshold) * 100)) : 0;
                  } else if (badge.ruleType === "pdf_upload_count") {
                    current = Number(contrib.uploadedPdfCount) || 0;
                    progress = threshold > 0 ? Math.min(100, Math.max(0, (current / threshold) * 100)) : 0;
                  } else if (badge.ruleType === "question_count") {
      
                    current = Number(contrib.askQuestionCount) || 0;
                    progress = threshold > 0 ? Math.min(100, Math.max(0, (current / threshold) * 100)) : 0;
                  } else if (badge.ruleType === "answer_count") {
                    current = Number(contrib.answerQuestionCount) || 0;
                    progress = threshold > 0 ? Math.min(100, Math.max(0, (current / threshold) * 100)) : 0;
                  } else if (badge.ruleType === "quiz_completion_count") {
                    const quizCount = contrib.completedQuizCount;
                    current = Number(quizCount) || 0;
                    progress = threshold > 0 ? Math.min(100, Math.max(0, (current / threshold) * 100)) : 0;
                  }
                }
                
                if (isNaN(progress) || !isFinite(progress)) {
                  progress = 0;
                }

                return (
                  <Card
                    key={badge.id}
                    className="bg-white border border-gray-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 transform opacity-75 hover:opacity-90"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {badge.iconUrl ? (
                          <img
                            src={badge.iconUrl}
                            alt={badge.name}
                            className="w-14 h-14 rounded-lg grayscale shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                            <Lock className="w-7 h-7 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 mb-2">
                            {badge.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            {badge.description}
                          </p>
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                                style={{ 
                                  width: `${Math.max(0, Math.min(100, progress))}%`,
                                  minWidth: progress > 0 ? '2px' : '0px' // Ensure bar is visible even at small progress
                                }}
                              ></div>
                            </div>
                            <p className="text-xs font-medium text-gray-600">
                              {current} / {threshold} ({Math.round(Math.max(0, Math.min(100, progress)))}%)
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

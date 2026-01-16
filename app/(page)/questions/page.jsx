"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Tag,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { authFetch } from "@/lib/api";
import { useToast, Toast } from "../../components/ui/toast";

export default function QuestionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Use refs for synchronous tracking to prevent rapid clicks
  const votingRefs = useRef({});

  // Track expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // Toast notifications
  const { toast, showToast } = useToast();

  const toggleDescription = (questionId, e) => {
    e.stopPropagation();
    setExpandedDescriptions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, search, session]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.append("search", search);

      const headers = {};
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/questions?${params}`,
        { headers }
      );
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (questionId, voteType) => {
    // IMMEDIATE ref check - must be first to prevent rapid clicks
    if (votingRefs.current[questionId]) {
      console.log(
        "Vote already in progress - ignoring duplicate click:",
        questionId
      );
      return;
    }

    // Set ref IMMEDIATELY before any other checks
    votingRefs.current[questionId] = true;

    if (!session) {
      votingRefs.current[questionId] = false; // Clear ref on early return
      router.push("/api/auth/signin");
      return;
    }

    // Find the question and update optimistically
    const questionIndex = questions.findIndex(
      (q) => (q.id || q._id) === questionId
    );
    if (questionIndex === -1) {
      votingRefs.current[questionId] = false; // Clear ref on early return
      return;
    }

    const question = questions[questionIndex];
    const previousVote = question.userVote;
    const previousUpvotes = question.upvotes || 0;
    const previousDownvotes = question.downvotes || 0;

    let newUpvotes = previousUpvotes;
    let newDownvotes = previousDownvotes;
    let newUserVote = voteType;

    if (voteType === "upvote") {
      if (previousVote === "upvote") {
        // Toggle off
        newUpvotes = previousUpvotes - 1;
        newUserVote = null;
      } else if (previousVote === "downvote") {
        // Switch from downvote to upvote
        newUpvotes = previousUpvotes + 1;
        newDownvotes = previousDownvotes - 1;
      } else {
        // New upvote
        newUpvotes = previousUpvotes + 1;
      }
    } else if (voteType === "downvote") {
      if (previousVote === "downvote") {
        // Toggle off
        newDownvotes = previousDownvotes - 1;
        newUserVote = null;
      } else if (previousVote === "upvote") {
        // Switch from upvote to downvote
        newUpvotes = previousUpvotes - 1;
        newDownvotes = previousDownvotes + 1;
      } else {
        // New downvote
        newDownvotes = previousDownvotes + 1;
      }
    }

    // Update state immediately
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...question,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote,
    };
    setQuestions(updatedQuestions);

    try {
      await authFetch(`/api/questions/${questionId}/vote`, {
        method: "POST",
        body: JSON.stringify({ voteType }),
      });
      fetchQuestions();
      showToast(
        voteType === "upvote"
          ? "Upvoted successfully!"
          : "Downvoted successfully!",
        "success"
      );
    } catch (error) {
      console.error("Error voting:", error);
      // Revert on error
      const revertedQuestions = [...questions];
      revertedQuestions[questionIndex] = {
        ...question,
        upvotes: previousUpvotes,
        downvotes: previousDownvotes,
        userVote: previousVote,
      };
      setQuestions(revertedQuestions);
      showToast("Failed to vote. Please try again.", "error");
    } finally {
      // Reset ref
      votingRefs.current[questionId] = false;
    }
  };

  if (status === "loading") {
    return <div className="container mx-auto p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Toast toast={toast} onClose={() => showToast("", "success")} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="w-full sm:w-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 pb-3 border-b-4 border-blue-500 inline-block">
              Questions & Answers
            </h1>
          </div>
          {session && (
            <Button
              onClick={() => router.push("/questions/ask")}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-6 py-2.5"
            >
              <Plus className="w-4 h-4" />
              <span className="font-semibold">Ask Question</span>
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8 sm:mb-10">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-12 pr-4 h-14 text-base border-2 border-gray-200 rounded-2xl shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:shadow-lg transition-all duration-300 bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="bg-white border border-gray-200 shadow-sm rounded-2xl animate-pulse"
              >
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card className="bg-white border-2 border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="py-16 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                No questions found
              </p>
              <p className="text-gray-500">
                {search
                  ? "Try adjusting your search terms"
                  : "Be the first to ask a question!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => {
              const qId = question.id || question._id;
              if (!qId) {
                console.error("Question missing ID:", question);
                return null;
              }
              const isExpanded = expandedDescriptions[qId];
              const descriptionText = question.description || "";

              return (
                <Card
                  key={qId}
                  className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden group"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      {/* Main Content - 80% */}
                      <div className="flex-1 min-w-0" style={{ width: "80%" }}>
                        {/* Question Title - Clickable */}
                        <h2
                          onClick={() => router.push(`/questions/${qId}`)}
                          className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 leading-tight hover:text-blue-600 hover:underline cursor-pointer transition-colors duration-200"
                        >
                          {question.title}
                        </h2>

                        {/* Description Preview with Expand/Collapse */}
                        <div className="mb-4">
                          <div
                            className={`text-gray-600 leading-relaxed text-sm transition-all duration-300 ${
                              isExpanded ? "" : "line-clamp-3"
                            }`}
                            dangerouslySetInnerHTML={{
                              __html: descriptionText,
                            }}
                          />
                          {descriptionText.length > 150 && (
                            <button
                              onClick={(e) => toggleDescription(qId, e)}
                              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors duration-200"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  View less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  View more
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Meta Info Row */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          {/* Author */}
                          {question.authorId && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="font-medium">
                                {question.authorId}
                              </span>
                            </div>
                          )}

                          {/* Date */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium">
                              {new Date(
                                question.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Answers Count */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium">
                              {question.answerCount || 0}{" "}
                              {question.answerCount === 1
                                ? "answer"
                                : "answers"}
                            </span>
                          </div>
                        </div>

                        {/* Tags */}
                        {question.tags && (
                          <div className="flex flex-wrap gap-2">
                            {question.tags
                              .split(",")
                              .filter(Boolean)
                              .slice(0, 5)
                              .map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full px-3 py-1 border border-blue-100 hover:bg-blue-100 transition-colors duration-200"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag.trim()}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Vote Controls - Top Right Compact Pill */}
                      <div
                        className="flex flex-col items-center gap-1 w-12 bg-gray-50 rounded-full border border-gray-200 p-2 flex-shrink-0 hover:shadow-md transition-shadow duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Upvote Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!votingRefs.current[qId]) {
                              handleVote(qId, "upvote");
                            }
                          }}
                          disabled={votingRefs.current[qId]}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                            question.userVote === "upvote"
                              ? "bg-blue-500 text-white shadow-md scale-110"
                              : "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-300"
                          } ${
                            votingRefs.current[qId]
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer hover:scale-105"
                          }`}
                          title={
                            question.userVote === "upvote"
                              ? "Click to remove upvote"
                              : "Upvote this question"
                          }
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        {/* Score */}
                        <span className="text-sm font-bold text-gray-900 py-1 min-w-[2rem] text-center">
                          {(question.upvotes || 0) - (question.downvotes || 0)}
                        </span>

                        {/* Downvote Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!votingRefs.current[qId]) {
                              handleVote(qId, "downvote");
                            }
                          }}
                          disabled={votingRefs.current[qId]}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                            question.userVote === "downvote"
                              ? "bg-red-500 text-white shadow-md scale-110"
                              : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-300"
                          } ${
                            votingRefs.current[qId]
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer hover:scale-105"
                          }`}
                          title={
                            question.userVote === "downvote"
                              ? "Click to remove downvote"
                              : "Downvote this question"
                          }
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10 sm:mt-12">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl px-6 py-2.5 border-2 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm sm:text-base font-semibold text-gray-700 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl px-6 py-2.5 border-2 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Editor } from "@tinymce/tinymce-react";
import {
  ArrowUp,
  ArrowDown,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  User,
  Clock,
  Eye,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { authFetch, authFetchWithFormData } from "@/lib/api";
import { useToast, Toast } from "../../../components/ui/toast";

export default function QuestionDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const questionId = params.id;

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState("");
  const [commentContent, setCommentContent] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showAnswerEditor, setShowAnswerEditor] = useState(false);
  const [showCommentEditors, setShowCommentEditors] = useState({});
  const [votingInProgress, setVotingInProgress] = useState({
    question: false,
    answers: {},
    comments: {},
  });

  // Use refs for synchronous tracking to prevent rapid clicks
  const votingRefs = useRef({
    question: false,
    answers: {},
    comments: {},
  });

  // Toast notifications
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (questionId && questionId !== "undefined") {
      fetchQuestion();
    } else {
      setLoading(false);
      console.error("Question ID is missing");
    }
  }, [questionId, session]);

  const fetchQuestion = async () => {
    if (!questionId || questionId === "undefined") {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      // Add authorization header if user is logged in
      if (session?.accessToken) {
        headers.Authorization = `Bearer ${session.accessToken}`;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/questions/${questionId}`,
        { headers }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch question: ${res.status}`);
      }

      const data = await res.json();
      setQuestion(data.question);
      setAnswers(data.answers || []);

      // Fetch comments for question and answers with auth header
      const commentPromises = [
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/comments?parentType=question&parentId=${questionId}`,
          { headers }
        ).then((r) => r.json()),
        ...(data.answers || []).map((a) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/comments?parentType=answer&parentId=${a.id}`,
            { headers }
          ).then((r) => r.json())
        ),
      ];
      const commentResults = await Promise.all(commentPromises);
      const commentMap = {};
      commentMap[questionId] = commentResults[0];
      data.answers?.forEach((a, idx) => {
        commentMap[a.id] = commentResults[idx + 1];
      });
      setComments(commentMap);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    // IMMEDIATE ref check - must be first to prevent rapid clicks
    if (votingRefs.current.question) {
      console.log("Vote already in progress - ignoring duplicate click");
      return;
    }

    // Set ref IMMEDIATELY before any other checks
    votingRefs.current.question = true;

    if (!session) {
      votingRefs.current.question = false; // Clear ref on early return
      router.push("/api/auth/signin");
      return;
    }

    // Early return if question is not loaded
    if (!question || !question.id) {
      votingRefs.current.question = false; // Clear ref on early return
      return;
    }

    const idToUse = question.id;

    if (!idToUse || idToUse === "undefined") {
      votingRefs.current.question = false; // Clear ref on early return
      return;
    }

    setVotingInProgress((prev) => ({ ...prev, question: true }));

    // Optimistic update
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
    setQuestion({
      ...question,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote,
    });

    try {
      await authFetch(`/api/questions/${idToUse}/vote`, {
        method: "POST",
        body: JSON.stringify({ voteType }),
      });
      // Refetch question to get updated vote count and user vote status
      await fetchQuestion();
      showToast(
        voteType === "upvote"
          ? "Upvoted successfully!"
          : "Downvoted successfully!",
        "success"
      );
    } catch (error) {
      console.error("Error voting:", error);
      // Revert on error
      setQuestion({
        ...question,
        upvotes: previousUpvotes,
        downvotes: previousDownvotes,
        userVote: previousVote,
      });
      showToast("Failed to vote. Please try again.", "error");
    } finally {
      // Reset both ref and state
      votingRefs.current.question = false;
      setVotingInProgress((prev) => ({ ...prev, question: false }));
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerContent.trim() || !session) return;

    setSubmitting(true);
    try {
      await authFetch("/api/answers", {
        method: "POST",
        body: JSON.stringify({
          questionId,
          content: answerContent,
        }),
      });
      setAnswerContent("");
      setShowAnswerEditor(false);
      fetchQuestion();
    } catch (error) {
      console.error("Error submitting answer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!session) return;

    if (!answerId || answerId === "undefined" || answerId === null) {
      console.error("Invalid answer ID:", answerId);
      alert("Invalid answer ID. Please try again.");
      return;
    }

    try {
      const response = await authFetch(`/api/answers/${answerId}/accept`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      await fetchQuestion();
      showToast("Answer accepted!", "success");
    } catch (error) {
      console.error("Error accepting answer:", error);
      showToast(
        error.message || "Failed to accept answer. Please try again.",
        "error"
      );
    }
  };

  const handleAnswerUseful = async (answerId, voteType) => {
    // IMMEDIATE ref check - must be first to prevent rapid clicks
    if (votingRefs.current.answers[answerId]) {
      console.log(
        "Answer vote already in progress - ignoring duplicate click:",
        answerId
      );
      return;
    }

    if (!session) {
      router.push("/api/auth/signin");
      return;
    }

    if (!answerId || answerId === "undefined") {
      return;
    }

    // Find the answer and update optimistically
    const answerIndex = answers.findIndex((a) => a.id === answerId);
    if (answerIndex === -1) return;

    // Set ref IMMEDIATELY before any other operations
    votingRefs.current.answers[answerId] = true;
    setVotingInProgress((prev) => ({
      ...prev,
      answers: { ...prev.answers, [answerId]: true },
    }));

    const answer = answers[answerIndex];
    const previousVote = answer.userVote;
    const previousUseful = answer.usefulCount || 0;
    const previousNotUseful = answer.notUsefulCount || 0;

    let newUseful = previousUseful;
    let newNotUseful = previousNotUseful;
    let newUserVote = voteType;

    if (voteType === "useful") {
      if (previousVote === "useful") {
        newUseful = previousUseful - 1;
        newUserVote = null;
      } else if (previousVote === "notUseful") {
        newUseful = previousUseful + 1;
        newNotUseful = previousNotUseful - 1;
      } else {
        newUseful = previousUseful + 1;
      }
    } else if (voteType === "notUseful") {
      if (previousVote === "notUseful") {
        newNotUseful = previousNotUseful - 1;
        newUserVote = null;
      } else if (previousVote === "useful") {
        newUseful = previousUseful - 1;
        newNotUseful = previousNotUseful + 1;
      } else {
        newNotUseful = previousNotUseful + 1;
      }
    }

    // Update state immediately
    const updatedAnswers = [...answers];
    updatedAnswers[answerIndex] = {
      ...answer,
      usefulCount: newUseful,
      notUsefulCount: newNotUseful,
      userVote: newUserVote,
    };
    setAnswers(updatedAnswers);

    try {
      await authFetch(`/api/answers/${answerId}/useful`, {
        method: "POST",
        body: JSON.stringify({ voteType }),
      });
      await fetchQuestion();
      showToast(
        voteType === "useful" ? "Marked as useful!" : "Marked as not useful!",
        "success"
      );
    } catch (error) {
      console.error("Error voting on answer:", error);
      // Revert on error
      const revertedAnswers = [...answers];
      revertedAnswers[answerIndex] = {
        ...answer,
        usefulCount: previousUseful,
        notUsefulCount: previousNotUseful,
        userVote: previousVote,
      };
      setAnswers(revertedAnswers);
      showToast("Failed to vote. Please try again.", "error");
    } finally {
      // Reset both ref and state
      votingRefs.current.answers[answerId] = false;
      setVotingInProgress((prev) => ({
        ...prev,
        answers: { ...prev.answers, [answerId]: false },
      }));
    }
  };

  const handleCommentLike = async (commentId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // IMMEDIATE ref check - must be first to prevent rapid clicks
    if (votingRefs.current.comments[commentId]) {
      console.log(
        "Comment like already in progress - ignoring duplicate click:",
        commentId
      );
      return;
    }

    // Set ref IMMEDIATELY before any other checks
    votingRefs.current.comments[commentId] = true;

    if (!session) {
      votingRefs.current.comments[commentId] = false; // Clear ref on early return
      router.push("/api/auth/signin");
      return;
    }

    if (!commentId || commentId === "undefined" || commentId === null) {
      console.error("Invalid comment ID:", commentId);
      votingRefs.current.comments[commentId] = false; // Clear ref on early return
      return;
    }

    setVotingInProgress((prev) => ({
      ...prev,
      comments: { ...prev.comments, [commentId]: true },
    }));

    console.log("Liking comment:", commentId);

    // Store previous state for revert
    const previousComments = JSON.parse(JSON.stringify(comments));

    // Optimistic update for comments
    const updatedComments = { ...comments };
    Object.keys(updatedComments).forEach((key) => {
      updatedComments[key] = updatedComments[key].map((comment) => {
        const commentIdToCheck = comment.id || comment._id;
        if (commentIdToCheck === commentId) {
          const previousVote = comment.userVote;
          const previousLikes = comment.likes || 0;
          const previousDislikes = comment.dislikes || 0;

          let newLikes = previousLikes;
          let newDislikes = previousDislikes;
          let newUserVote = "like";

          if (previousVote === "like") {
            newLikes = previousLikes - 1;
            newUserVote = null;
          } else if (previousVote === "dislike") {
            newLikes = previousLikes + 1;
            newDislikes = previousDislikes - 1;
          } else {
            newLikes = previousLikes + 1;
          }

          return {
            ...comment,
            likes: newLikes,
            dislikes: newDislikes,
            userVote: newUserVote,
          };
        }
        return comment;
      });
    });
    setComments(updatedComments);

    try {
      const response = await authFetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchQuestion();
      showToast("Liked comment!", "success");
    } catch (error) {
      console.error("Error liking comment:", error);
      // Revert on error
      setComments(previousComments);
      showToast("Failed to like comment. Please try again.", "error");
    } finally {
      // Reset both ref and state
      votingRefs.current.comments[commentId] = false;
      setVotingInProgress((prev) => ({
        ...prev,
        comments: { ...prev.comments, [commentId]: false },
      }));
    }
  };

  const handleCommentDislike = async (commentId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // IMMEDIATE ref check - must be first to prevent rapid clicks
    if (votingRefs.current.comments[commentId]) {
      console.log(
        "Comment dislike already in progress - ignoring duplicate click:",
        commentId
      );
      return;
    }

    // Set ref IMMEDIATELY before any other checks
    votingRefs.current.comments[commentId] = true;

    if (!session) {
      votingRefs.current.comments[commentId] = false; // Clear ref on early return
      router.push("/api/auth/signin");
      return;
    }

    if (!commentId || commentId === "undefined" || commentId === null) {
      console.error("Invalid comment ID:", commentId);
      votingRefs.current.comments[commentId] = false; // Clear ref on early return
      return;
    }

    setVotingInProgress((prev) => ({
      ...prev,
      comments: { ...prev.comments, [commentId]: true },
    }));

    console.log("Disliking comment:", commentId);

    // Store previous state for revert
    const previousComments = JSON.parse(JSON.stringify(comments));

    // Optimistic update for comments
    const updatedComments = { ...comments };
    Object.keys(updatedComments).forEach((key) => {
      updatedComments[key] = updatedComments[key].map((comment) => {
        const commentIdToCheck = comment.id || comment._id;
        if (commentIdToCheck === commentId) {
          const previousVote = comment.userVote;
          const previousLikes = comment.likes || 0;
          const previousDislikes = comment.dislikes || 0;

          let newLikes = previousLikes;
          let newDislikes = previousDislikes;
          let newUserVote = "dislike";

          if (previousVote === "dislike") {
            newDislikes = previousDislikes - 1;
            newUserVote = null;
          } else if (previousVote === "like") {
            newLikes = previousLikes - 1;
            newDislikes = previousDislikes + 1;
          } else {
            newDislikes = previousDislikes + 1;
          }

          return {
            ...comment,
            likes: newLikes,
            dislikes: newDislikes,
            userVote: newUserVote,
          };
        }
        return comment;
      });
    });
    setComments(updatedComments);

    try {
      const response = await authFetch(`/api/comments/${commentId}/dislike`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchQuestion();
      showToast("Disliked comment!", "success");
    } catch (error) {
      console.error("Error disliking comment:", error);
      // Revert on error
      setComments(previousComments);
      showToast("Failed to dislike comment. Please try again.", "error");
    } finally {
      // Reset both ref and state
      votingRefs.current.comments[commentId] = false;
      setVotingInProgress((prev) => ({
        ...prev,
        comments: { ...prev.comments, [commentId]: false },
      }));
    }
  };

  const handleCommentSubmit = async (parentType, parentId) => {
    const content = commentContent[parentId] || "";
    if (!content.trim() || !session) return;

    try {
      await authFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          parentType,
          parentId,
          content,
        }),
      });
      setCommentContent({ ...commentContent, [parentId]: "" });
      setShowCommentEditors({ ...showCommentEditors, [parentId]: false });
      fetchQuestion();
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const handleImageUpload = async (blobInfo) => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append("file", blobInfo.blob(), blobInfo.filename());

        const res = await authFetchWithFormData(
          "/api/uploads/editor-image",
          formData
        );
        const data = await res.json();
        resolve(data.url);
      } catch (error) {
        reject(error);
      }
    });
  };

  if (loading) {
    return <div className="container mx-auto p-8 text-center">Loading...</div>;
  }

  if (!question) {
    return (
      <div className="container mx-auto p-8 text-center">
        Question not found
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">Loading question...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isQuestionOwner = session?.user?.email === question.authorId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Toast toast={toast} onClose={() => showToast("", "success")} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <ArrowDown className="w-4 h-4 rotate-90" />
          Back to Questions
        </button>

        {/* Question Card */}
        <Card className="mb-8 bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
          <CardContent className="p-1 sm:p-3 lg:p-5">
            <div className="flex flex-col gap-6">
              {/* Question Content */}
              <div className="w-full">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight">
                  {question.title}
                </CardTitle>

                <div
                  className="prose prose-slate max-w-none mb-6 sm:mb-8 text-gray-700 leading-relaxed text-base sm:text-lg"
                  dangerouslySetInnerHTML={{ __html: question.description }}
                />

                {/* Facebook-style Like / Dislike */}
                <div className="flex items-center gap-6 mb-6">
                  {/* Like */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (question?.id && !votingRefs.current.question) {
                        handleVote("upvote");
                      }
                    }}
                    disabled={
                      !question ||
                      !question.id ||
                      votingInProgress.question ||
                      votingRefs.current.question
                    }
                    className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                      question?.userVote === "upvote"
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-blue-600"
                    } ${
                      votingInProgress.question
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <ArrowUp
                      className={`w-5 h-5 ${
                        question?.userVote === "upvote" ? "fill-blue-600" : ""
                      }`}
                    />
                    Upvote
                  </button>

                  {/* Vote Count */}
                  <span className="text-sm font-bold text-gray-700">
                    {(question?.upvotes || 0) - (question?.downvotes || 0)}{" "}
                    votes
                  </span>

                  {/* Dislike */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (question?.id && !votingRefs.current.question) {
                        handleVote("downvote");
                      }
                    }}
                    disabled={
                      !question ||
                      !question.id ||
                      votingInProgress.question ||
                      votingRefs.current.question
                    }
                    className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                      question?.userVote === "downvote"
                        ? "text-red-600"
                        : "text-gray-500 hover:text-red-600"
                    } ${
                      votingInProgress.question
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <ArrowDown
                      className={`w-5 h-5 ${
                        question?.userVote === "downvote" ? "fill-red-600" : ""
                      }`}
                    />
                    Downvote
                  </button>
                </div>

                {/* Question Meta Info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-6 border-t-2 border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Asked by
                      </span>
                      <p className="font-bold text-gray-900">
                        {question.authorId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {answers.length}{" "}
                      {answers.length === 1 ? "answer" : "answers"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments for Question */}
        <Card className="mb-8 bg-white border-2 border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-gray-200 px-5 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Comments
                <span className="text-base font-normal text-gray-500">
                  ({(comments[questionId] || []).length})
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <div className="space-y-4">
              {(comments[questionId] || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium">No comments yet</p>
                </div>
              ) : (
                (comments[questionId] || []).map((comment, index) => (
                  <div
                    key={comment.id || `comment-${questionId}-${index}`}
                    className="bg-gradient-to-r from-gray-50 to-blue-50 border-l-4 border-blue-500 pl-5 pr-4 py-4 rounded-r-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div
                      className="text-gray-800 leading-relaxed mb-4 text-sm sm:text-base"
                      dangerouslySetInnerHTML={{ __html: comment.content }}
                    />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {comment.authorId}
                          </span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {session && (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const commentId = comment.id || comment._id;
                              if (
                                commentId &&
                                !votingRefs.current.comments[commentId]
                              ) {
                                handleCommentLike(commentId, e);
                              }
                            }}
                            disabled={
                              votingInProgress.comments[
                                comment.id || comment._id
                              ] ||
                              votingRefs.current.comments[
                                comment.id || comment._id
                              ]
                            }
                            className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                              comment.userVote === "like"
                                ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                                : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-2 border-gray-300 hover:border-blue-400"
                            } ${
                              votingInProgress.comments[
                                comment.id || comment._id
                              ]
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:scale-105"
                            }`}
                            title="Like this comment"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{comment.likes || 0}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const commentId = comment.id || comment._id;
                              if (
                                commentId &&
                                !votingRefs.current.comments[commentId]
                              ) {
                                handleCommentDislike(commentId, e);
                              }
                            }}
                            disabled={
                              votingInProgress.comments[
                                comment.id || comment._id
                              ] ||
                              votingRefs.current.comments[
                                comment.id || comment._id
                              ]
                            }
                            className={`h-9 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                              comment.userVote === "dislike"
                                ? "bg-red-500 text-white hover:bg-red-600 shadow-md"
                                : "bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 border-2 border-gray-300 hover:border-red-400"
                            } ${
                              votingInProgress.comments[
                                comment.id || comment._id
                              ]
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:scale-105"
                            }`}
                            title="Dislike this comment"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>{comment.dislikes || 0}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {session && !isQuestionOwner && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  {!showCommentEditors[questionId] ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowCommentEditors({
                          ...showCommentEditors,
                          [questionId]: true,
                        })
                      }
                      className="text-blue-600 border-2 border-blue-300 hover:bg-blue-50 font-semibold rounded-xl px-4 py-2 transition-all duration-200 hover:shadow-md"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add a Comment
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                        <Editor
                          apiKey={
                            process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
                            "no-api-key"
                          }
                          value={commentContent[questionId] || ""}
                          onEditorChange={(content) =>
                            setCommentContent({
                              ...commentContent,
                              [questionId]: content,
                            })
                          }
                          init={{
                            height: 150,
                            menubar: false,
                            statusbar: false,
                            plugins: ["lists", "link"],
                            toolbar: "bold italic | bullist numlist | link",
                            images_upload_handler: handleImageUpload,
                            content_style:
                              "body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6; margin: 12px; }",
                            skin: "oxide",
                            content_css: "default",
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleCommentSubmit("question", questionId)
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-2 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Post Comment
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setShowCommentEditors({
                              ...showCommentEditors,
                              [questionId]: false,
                            })
                          }
                          className="border-2 rounded-xl px-6 py-2 font-semibold hover:bg-gray-50 transition-all duration-200"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {session && isQuestionOwner && (
                <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        You cannot comment on your own question
                      </p>
                      <p className="text-sm text-blue-700">
                        You can reply to comments and answers from other users
                        to provide clarification.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Answers Section */}
      <div className="mb-8">
  <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
      <MessageSquare className="w-6 h-6 text-blue-600" />
      {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
    </h2>
    {answers.length > 0 && (
      <div className="text-sm text-gray-500 font-medium">
        Sorted by votes
      </div>
    )}
  </div>

  {answers.length === 0 ? (
    <Card className="bg-white border-2 border-gray-200 shadow-lg rounded-2xl">
      <CardContent className="p-12 sm:p-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-12 h-12 text-blue-500" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          No answers yet
        </h3>
        <p className="text-gray-600 mb-8 text-base sm:text-lg max-w-md mx-auto">
          Be the first to share your knowledge and help others!
        </p>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-6">
      {answers.map((answer, index) => (
        <Card
          key={answer.id || `answer-${index}`}
          className={`bg-white border-2 rounded-2xl ${
            answer.accepted
              ? "border-green-500 shadow-xl ring-2 ring-green-200"
              : "border-gray-200 shadow-md"
          } hover:shadow-xl transition-all duration-300`}
        >
          <CardContent className="p-6 sm:p-8">
            {/* Accepted Badge */}
            {answer.accepted && (
              <div className="flex items-center gap-3 text-green-700 mb-6 bg-green-50 border-2 border-green-400 px-5 py-4 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-bold text-lg">
                  Accepted Answer
                </span>
              </div>
            )}

            {/* Answer Content */}
            <div
              className="prose prose-slate max-w-none mb-6 text-gray-700"
              dangerouslySetInnerHTML={{ __html: answer.content }}
            />

            {/* Facebook-style Like / Dislike */}
            <div className="flex items-center gap-6 mb-6">
              {/* Like */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (
                    answer?.id &&
                    !votingInProgress.answers[answer.id] &&
                    !votingRefs.current.answers[answer.id]
                  ) {
                    handleAnswerUseful(answer.id, "useful");
                  }
                }}
                disabled={
                  votingInProgress.answers[answer.id] ||
                  votingRefs.current.answers[answer.id]
                }
                className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                  answer.userVote === "useful"
                    ? "text-green-600"
                    : "text-gray-500 hover:text-green-600"
                } ${
                  votingInProgress.answers[answer.id]
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                Like
              </button>

              {/* Vote Count */}
              <span className="text-sm font-bold text-gray-700">
                {(answer?.usefulCount || 0) -
                  (answer?.notUsefulCount || 0)}{" "}
                votes
              </span>

              {/* Dislike */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (
                    answer?.id &&
                    !votingInProgress.answers[answer.id] &&
                    !votingRefs.current.answers[answer.id]
                  ) {
                    handleAnswerUseful(answer.id, "notUseful");
                  }
                }}
                disabled={
                  votingInProgress.answers[answer.id] ||
                  votingRefs.current.answers[answer.id]
                }
                className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                  answer.userVote === "notUseful"
                    ? "text-red-600"
                    : "text-gray-500 hover:text-red-600"
                } ${
                  votingInProgress.answers[answer.id]
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                Dislike
              </button>
            </div>

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {answer.authorId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date(answer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {isQuestionOwner && !answer.accepted && (
                <Button
                  size="sm"
                  onClick={() => handleAcceptAnswer(answer.id)}
                  className="border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl font-semibold"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept Answer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )}
</div>


        {/* Answer Form */}
        {session && !isQuestionOwner && (
          <Card
            id="answer-form"
            className="bg-white border-2 border-gray-200 shadow-lg rounded-2xl overflow-hidden"
          >
            <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  Your Answer
                </CardTitle>
                {!showAnswerEditor && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnswerEditor(true)}
                    className="text-blue-600 border-2 border-blue-300 hover:bg-blue-50 font-bold rounded-xl px-5 py-2 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Write an Answer
                  </Button>
                )}
              </div>
            </CardHeader>
            {showAnswerEditor && (
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleAnswerSubmit} className="space-y-6">
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                    <Editor
                      apiKey={
                        process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"
                      }
                      value={answerContent}
                      onEditorChange={setAnswerContent}
                      init={{
                        height: 350,
                        min_height: 250,
                        menubar: false,
                        statusbar: false,
                        plugins: [
                          "advlist",
                          "autolink",
                          "lists",
                          "link",
                          "image",
                          "charmap",
                          "preview",
                          "anchor",
                          "searchreplace",
                          "visualblocks",
                          "code",
                          "fullscreen",
                          "insertdatetime",
                          "media",
                          "table",
                          "code",
                          "help",
                          "wordcount",
                        ],
                        toolbar:
                          "undo redo | blocks | " +
                          "bold italic forecolor | alignleft aligncenter " +
                          "alignright alignjustify | bullist numlist outdent indent | " +
                          "removeformat | help | code",
                        images_upload_handler: handleImageUpload,
                        content_style:
                          "body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6; margin: 16px; }",
                        skin: "oxide",
                        content_css: "default",
                      }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Posting...
                        </span>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Post Answer
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAnswerEditor(false);
                        setAnswerContent("");
                      }}
                      className="px-8 py-3 text-base font-semibold border-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>
        )}
        {session && isQuestionOwner && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg rounded-2xl">
            <CardContent className="p-8 sm:p-10">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue-900 mb-3">
                  You cannot answer your own question
                </h3>
                <p className="text-base sm:text-lg text-blue-700 max-w-md mx-auto">
                  You can reply to comments and answers from other users to
                  provide clarification or additional information.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

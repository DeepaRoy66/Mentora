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
  HelpCircle,
  Edit,
  Trash2,
  Reply,
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
  const [commentReplies, setCommentReplies] = useState({}); 
  const [loading, setLoading] = useState(false); 
  const [answerContent, setAnswerContent] = useState("");
  const [commentContent, setCommentContent] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showAnswerEditor, setShowAnswerEditor] = useState(false);
  const [showCommentEditors, setShowCommentEditors] = useState({});
  const [openReplyInput, setOpenReplyInput] = useState(null); 
  const [replyContent, setReplyContent] = useState({});
  const [replyToCommentId, setReplyToCommentId] = useState({}); 
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editQuestionTitle, setEditQuestionTitle] = useState("");
  const [editQuestionDescription, setEditQuestionDescription] = useState("");
  const [editQuestionTags, setEditQuestionTags] = useState("");
  const [editingAnswer, setEditingAnswer] = useState(null); 
  const [editAnswerContent, setEditAnswerContent] = useState("");
  const [editingComment, setEditingComment] = useState(null); 
  const [editCommentContent, setEditCommentContent] = useState("");
  const [votingInProgress, setVotingInProgress] = useState({
    question: false,
    answers: {},
    comments: {},
  });
  const votingRefs = useRef({
    question: false,
    answers: {},
    comments: {},
  });
  const { toast, showToast } = useToast();
  const hasFetched = useRef(false);
  useEffect(() => {
    if (questionId && questionId !== "undefined" && !hasFetched.current) {
      hasFetched.current = true;
      fetchQuestion();
    } else if (!questionId || questionId === "undefined") {
      setLoading(false);
      console.error("Question ID is missing");
    }
  }, [questionId]);
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
      const validAnswers = (data.answers || []).filter(
        (a) => a.id || a._id
      );
      const commentPromises = [
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/comments?parentType=question&parentId=${questionId}`,
          { headers }
        ).then((r) => r.json()),
        ...validAnswers.map((a) => {
          const answerId = a.id || a._id;
          if (!answerId || answerId === "undefined") {
            return Promise.resolve([]);
          }
          return fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/comments?parentType=answer&parentId=${answerId}`,
            { headers }
          ).then((r) => r.json());
        }),
      ];
      const commentResults = await Promise.all(commentPromises);
      const commentMap = {};
      commentMap[questionId] = commentResults[0];
      validAnswers.forEach((a, idx) => {
        const answerId = a.id || a._id;
        if (answerId && answerId !== "undefined") {
          commentMap[answerId] = commentResults[idx + 1];
        }
      });
  
      const repliesMap = {};
      const topLevelComments = {};
      const storageKey = `commentReplies_${questionId}`;
      let storedReplies = {};
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          storedReplies = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Error reading localStorage:", e);
      }
      
      Object.keys(commentMap).forEach((parentId) => {
        const allComments = commentMap[parentId] || [];
        const topLevel = [];
        
        allComments.forEach((comment) => {
          const commentId = comment.id || comment._id;
          if (storedReplies[commentId]) {
            const parentCommentId = storedReplies[commentId];
            if (!repliesMap[parentCommentId]) {
              repliesMap[parentCommentId] = [];
            }
            repliesMap[parentCommentId].push(comment);
          } else {
            topLevel.push(comment);
          }
        });
        
        topLevelComments[parentId] = topLevel;
      });
      
      setComments(topLevelComments);
      setCommentReplies(repliesMap);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (votingRefs.current.question) {
      console.log("Vote already in progress - ignoring duplicate click");
      return;
    }
    votingRefs.current.question = true;

    if (!session) {
      votingRefs.current.question = false; 
      router.push("/api/auth/signin");
      return;
    }
    if (!question) {
      votingRefs.current.question = false; 
      return;
    }
    const idToUse = question.id || question._id;
    if (!idToUse || idToUse === "undefined") {
      votingRefs.current.question = false; 
      return;
    }
    setVotingInProgress((prev) => ({ ...prev, question: true }));
    const previousVote = question.userVote;
    const previousUpvotes = question.upvotes || 0;
    const previousDownvotes = question.downvotes || 0;

    let newUpvotes = previousUpvotes;
    let newDownvotes = previousDownvotes;
    let newUserVote = voteType;

    if (voteType === "upvote") {
      if (previousVote === "upvote") {
        newUpvotes = previousUpvotes - 1;
        newUserVote = null;
      } else if (previousVote === "downvote") {
        newUpvotes = previousUpvotes + 1;
        newDownvotes = previousDownvotes - 1;
      } else {
        newUpvotes = previousUpvotes + 1;
      }
    } else if (voteType === "downvote") {
      if (previousVote === "downvote") {
        newDownvotes = previousDownvotes - 1;
        newUserVote = null;
      } else if (previousVote === "upvote") {
        newUpvotes = previousUpvotes - 1;
        newDownvotes = previousDownvotes + 1;
      } else {
        newDownvotes = previousDownvotes + 1;
      }
    }
    setQuestion({
      ...question,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote,
    });

    try {
      const response = await authFetch(`/api/questions/${idToUse}/vote`, {
        method: "POST",
        body: JSON.stringify({ voteType }),
      });
      
      if (response.ok) {
        const updatedQuestion = await response.json();
        setQuestion({
          ...question,
          upvotes: updatedQuestion.upvotes,
          downvotes: updatedQuestion.downvotes,
          userVote: updatedQuestion.userVote,
        });
        showToast(
          voteType === "upvote"
            ? "Upvoted successfully!"
            : "Downvoted successfully!",
          "success"
        );
      } else {
        throw new Error("Failed to vote");
      }
    } catch (error) {
      console.error("Error voting:", error);
      setQuestion({
        ...question,
        upvotes: previousUpvotes,
        downvotes: previousDownvotes,
        userVote: previousVote,
      });
      showToast("Failed to vote. Please try again.", "error");
    } finally {
      votingRefs.current.question = false;
      setVotingInProgress((prev) => ({ ...prev, question: false }));
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerContent.trim() || !session) return;

    setSubmitting(true);
    try {
      const response = await authFetch("/api/answers", {
        method: "POST",
        body: JSON.stringify({
          questionId,
          content: answerContent,
        }),
      });
      
      if (response.ok) {
        const newAnswer = await response.json();
        setAnswers([...answers, newAnswer]);
        setAnswerContent("");
        setShowAnswerEditor(false);
        showToast("Answer posted successfully!", "success");
      } else {
        throw new Error("Failed to post answer");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      showToast("Failed to post answer. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!session) return;

    if (!answerId || answerId === "undefined" || answerId === null) {
      console.error("Invalid answer ID:", answerId);
      showToast("Invalid answer ID. Please try again.", "error");
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
      const updatedAnswers = answers.map((a) => {
        const aId = a.id || a._id;
        if (aId === answerId) {
          return { ...a, accepted: true };
        }
        return a;
      });
      setAnswers(updatedAnswers);
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
    const answerIndex = answers.findIndex(
      (a) => (a.id || a._id) === answerId
    );
    if (answerIndex === -1) return;
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
    const updatedAnswers = [...answers];
    updatedAnswers[answerIndex] = {
      ...answer,
      usefulCount: newUseful,
      notUsefulCount: newNotUseful,
      userVote: newUserVote,
    };
    setAnswers(updatedAnswers);

    try {
      const response = await authFetch(`/api/answers/${answerId}/useful`, {
        method: "POST",
        body: JSON.stringify({ voteType }),
      });  
      if (response.ok) {
        const updatedAnswer = await response.json();
        const updatedAnswers = [...answers];
        updatedAnswers[answerIndex] = {
          ...answer,
          usefulCount: updatedAnswer.usefulCount,
          notUsefulCount: updatedAnswer.notUsefulCount,
          userVote: updatedAnswer.userVote,
        };
        setAnswers(updatedAnswers);
        showToast(
          voteType === "useful" ? "Marked as useful!" : "Marked as not useful!",
          "success"
        );
      } else {
        throw new Error("Failed to vote");
      }
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
    if (votingRefs.current.comments[commentId]) {
      console.log(
        "Comment like already in progress - ignoring duplicate click:",
        commentId
      );
      return;
    }
    votingRefs.current.comments[commentId] = true;

    if (!session) {
      votingRefs.current.comments[commentId] = false; 
      router.push("/api/auth/signin");
      return;
    }

    if (!commentId || commentId === "undefined" || commentId === null) {
      console.error("Invalid comment ID:", commentId);
      votingRefs.current.comments[commentId] = false; 
      return;
    }

    setVotingInProgress((prev) => ({
      ...prev,
      comments: { ...prev.comments, [commentId]: true },
    }));

    const previousComments = JSON.parse(JSON.stringify(comments));
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

      if (response.ok) {
        const updatedComment = await response.json();
        // Update state with API response
        const updatedComments = { ...comments };
        Object.keys(updatedComments).forEach((key) => {
          updatedComments[key] = updatedComments[key].map((comment) => {
            const commentIdToCheck = comment.id || comment._id;
            if (commentIdToCheck === commentId) {
              return {
                ...comment,
                likes: updatedComment.likes,
                dislikes: updatedComment.dislikes,
                userVote: updatedComment.userVote,
              };
            }
            return comment;
          });
        });
        setComments(updatedComments);
        showToast("Liked comment!", "success");
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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
    votingRefs.current.comments[commentId] = true;

    if (!session) {
      votingRefs.current.comments[commentId] = false; 
      router.push("/api/auth/signin");
      return;
    }

    if (!commentId || commentId === "undefined" || commentId === null) {
      console.error("Invalid comment ID:", commentId);
      votingRefs.current.comments[commentId] = false;
      return;
    }

    setVotingInProgress((prev) => ({
      ...prev,
      comments: { ...prev.comments, [commentId]: true },
    }));
    const previousComments = JSON.parse(JSON.stringify(comments));
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

      if (response.ok) {
        const updatedComment = await response.json();
        const updatedComments = { ...comments };
        Object.keys(updatedComments).forEach((key) => {
          updatedComments[key] = updatedComments[key].map((comment) => {
            const commentIdToCheck = comment.id || comment._id;
            if (commentIdToCheck === commentId) {
              return {
                ...comment,
                likes: updatedComment.likes,
                dislikes: updatedComment.dislikes,
                userVote: updatedComment.userVote,
              };
            }
            return comment;
          });
        });
        setComments(updatedComments);
        showToast("Disliked comment!", "success");
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error disliking comment:", error);
      setComments(previousComments);
      showToast("Failed to dislike comment. Please try again.", "error");
    } finally {
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

    setSubmitting(true);
    try {
      const response = await authFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          parentType,
          parentId,
          content,
        }),
      });
      
      if (response.ok) {
        const newComment = await response.json();
        const updatedComments = { ...comments };
        if (!updatedComments[parentId]) {
          updatedComments[parentId] = [];
        }
        updatedComments[parentId] = [...updatedComments[parentId], newComment];
        setComments(updatedComments);
        
        setCommentContent({ ...commentContent, [parentId]: "" });
        setShowCommentEditors({ ...showCommentEditors, [parentId]: false });
        showToast("Comment posted successfully!", "success");
      } else {
        throw new Error("Failed to post comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      showToast("Failed to post comment. Please try again.", "error");
    } finally {
      setSubmitting(false);
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

  const handleEditQuestion = () => {
    if (!question) return;
    setEditQuestionTitle(question.title);
    setEditQuestionDescription(question.description);
    setEditQuestionTags(question.tags || "");
    setEditingQuestion(true);
  };

  const handleSaveQuestion = async () => {
    if (!question) return;
    const qId = question.id || question._id;
    if (!qId) return;

    setSubmitting(true);
    try {
      const response = await authFetch(`/api/questions/${qId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: editQuestionTitle,
          description: editQuestionDescription,
          tags: editQuestionTags,
        }),
      });
      const updatedQuestion = await response.json();
      setQuestion({
        ...question,
        title: updatedQuestion.title,
        description: updatedQuestion.description,
        tags: updatedQuestion.tags,
      });
      setEditingQuestion(false);
      showToast("Question updated successfully!", "success");
    } catch (error) {
      console.error("Error updating question:", error);
      showToast("Failed to update question", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestion(false);
    setEditQuestionTitle("");
    setEditQuestionDescription("");
    setEditQuestionTags("");
  };

  const handleEditAnswer = (answer) => {
    const answerId = answer.id || answer._id;
    setEditAnswerContent(answer.content);
    setEditingAnswer(answerId);
  };

  const handleSaveAnswer = async () => {
    if (!editingAnswer) return;

    setSubmitting(true);
    try {
      await authFetch(`/api/answers/${editingAnswer}`, {
        method: "PUT",
        body: JSON.stringify({
          content: editAnswerContent,
        }),
      });
      const updatedAnswer = await response.json();
      const updatedAnswers = answers.map((a) => {
        const aId = a.id || a._id;
        if (aId === editingAnswer) {
          return { ...a, content: updatedAnswer.content };
        }
        return a;
      });
      setAnswers(updatedAnswers);
      setEditingAnswer(null);
      setEditAnswerContent("");
      showToast("Answer updated successfully!", "success");
    } catch (error) {
      console.error("Error updating answer:", error);
      showToast("Failed to update answer", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEditAnswer = () => {
    setEditingAnswer(null);
    setEditAnswerContent("");
  };

  const handleEditComment = (comment) => {
    const commentId = comment.id || comment._id;
    setEditCommentContent(comment.content);
    setEditingComment(commentId);
  };

  const handleSaveComment = async () => {
    if (!editingComment) return;

    setSubmitting(true);
    try {
      const response = await authFetch(`/api/comments/${editingComment}`, {
        method: "PUT",
        body: JSON.stringify({
          content: editCommentContent,
        }),
      });
      if (response.ok) {
        const updatedComment = await response.json();
        const updatedComments = { ...comments };
        Object.keys(updatedComments).forEach((key) => {
          updatedComments[key] = updatedComments[key].map((c) => {
            const commentId = c.id || c._id;
            if (commentId === editingComment) {
              return { ...c, content: updatedComment.content };
            }
            return c;
          });
        });
        setComments(updatedComments);
        setEditingComment(null);
        setEditCommentContent("");
        showToast("Comment updated successfully!", "success");
      } else {
        throw new Error("Failed to update comment");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      showToast("Failed to update comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEditComment = () => {
    setEditingComment(null);
    setEditCommentContent("");
  };

  const handleReplyToComment = (comment) => {
    const commentId = comment.id || comment._id;
    const replyKey = `comment-${commentId}`;
    setOpenReplyInput(replyKey);
    setReplyContent({ ...replyContent, [replyKey]: "" });
    setReplyToCommentId({ ...replyToCommentId, [replyKey]: commentId });
  };

  const handleReplyToAnswer = (answer) => {
    const answerId = answer.id || answer._id;
    const replyKey = `answer-${answerId}`;
    setOpenReplyInput(replyKey);
    setReplyContent({ ...replyContent, [replyKey]: "" });
    setReplyToCommentId({ ...replyToCommentId, [replyKey]: null }); 
  };

  const handleSubmitReply = async (parentType, parentId, replyKey) => {
    const content = replyContent[replyKey] || "";
    const textContent = content.replace(/<[^>]*>/g, "").trim();
    if (!textContent || !session) {
      console.log("Cannot submit reply - content or session missing:", { hasContent: !!textContent, hasSession: !!session });
      return;
    }

    setSubmitting(true);
    try {
      const response = await authFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          parentType,
          parentId,
          content,
        }),
      });
      
      if (response.ok) {
        const newComment = await response.json();
        const repliedToCommentIdValue = replyToCommentId[replyKey];
        if (repliedToCommentIdValue) {
          const updatedReplies = { ...commentReplies };
          if (!updatedReplies[repliedToCommentIdValue]) {
            updatedReplies[repliedToCommentIdValue] = [];
          }
          updatedReplies[repliedToCommentIdValue] = [...updatedReplies[repliedToCommentIdValue], newComment];
          setCommentReplies(updatedReplies);
          const storageKey = `commentReplies_${questionId}`;
          try {
            let storedReplies = {};
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              storedReplies = JSON.parse(stored);
            }
            storedReplies[newComment.id || newComment._id] = repliedToCommentIdValue;
            localStorage.setItem(storageKey, JSON.stringify(storedReplies));
          } catch (e) {
            console.error("Error saving to localStorage:", e);
          }
        } else {
          const updatedComments = { ...comments };
          if (!updatedComments[parentId]) {
            updatedComments[parentId] = [];
          }
          updatedComments[parentId] = [...updatedComments[parentId], newComment];
          setComments(updatedComments);
        }
        
        setReplyContent({ ...replyContent, [replyKey]: "" });
        setOpenReplyInput(null); 
        const updatedReplyToCommentId = { ...replyToCommentId };
        delete updatedReplyToCommentId[replyKey];
        setReplyToCommentId(updatedReplyToCommentId);
        showToast("Reply posted successfully!", "success");
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("API error response:", response.status, errorText);
        throw new Error(`Failed to post reply: ${response.status}`);
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      showToast("Failed to post reply. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReply = (replyKey) => {
    setOpenReplyInput(null);
    setReplyContent({ ...replyContent, [replyKey]: "" });
    const updated = { ...replyToCommentId };
    delete updated[replyKey];
    setReplyToCommentId(updated);
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl pt-4">
        {/* Back Button */}
        <button
  onClick={() => router.back()}
  className="
    mb-6
    inline-flex items-center gap-2
    rounded-full border border-gray-200
    bg-white/80 backdrop-blur
    px-4 py-2
    text-sm font-semibold text-gray-700
    shadow-sm
    transition-all duration-200
    hover:bg-gray-100 hover:text-gray-900
    hover:shadow-md
    active:scale-95
  "
>
  <ArrowDown className="w-4 h-4 rotate-90 transition-transform group-hover:-translate-x-0.5" />
  <span>Back to Questions</span>
</button>

        {/* Question Card */}
        <Card className="mb-8 bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
          <CardContent className="p-1 sm:p-3 lg:p-5">
            <div className="flex flex-col gap-6">
              {/* Question Content */}
              <div className="w-full">
                {editingQuestion ? (
                  <div className="space-y-0 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editQuestionTitle}
                        onChange={(e) => setEditQuestionTitle(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        placeholder="Enter question title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                        <Editor
                          apiKey={
                            process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
                            "no-api-key"
                          }
                          value={editQuestionDescription}
                          onEditorChange={setEditQuestionDescription}
                          init={{
                            height: 300,
                            min_height: 200,
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
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editQuestionTags}
                        onChange={(e) => setEditQuestionTags(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        placeholder="e.g., javascript, react, nextjs"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSaveQuestion}
                        disabled={submitting || !editQuestionTitle.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                      >
                        {submitting ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={handleCancelEditQuestion}
                        disabled={submitting}
                        variant="outline"
                        className="px-6 py-2 rounded-lg font-semibold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4 mb-4 sm:mb-6">
                      <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 leading-tight flex-1">
                        {question.title}
                      </CardTitle>
                      {isQuestionOwner && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleEditQuestion}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit question"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this question?"
                                )
                              ) {
                                try {
                                  const qId = question.id || question._id;
                                  await authFetch(`/api/questions/${qId}`, {
                                    method: "DELETE",
                                  });
                                  showToast("Question deleted successfully", "success");
                                  router.push("/questions");
                                } catch (error) {
                                  console.error("Error deleting question:", error);
                                  showToast("Failed to delete question", "error");
                                }
                              }
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      className="prose prose-slate max-w-none mb-6 sm:mb-8 text-gray-700 leading-relaxed text-base sm:text-lg"
                      dangerouslySetInnerHTML={{ __html: question.description }}
                    />
                  </>
                )}

                {/* Like / Dislike */}
                <div className="flex items-center gap-3 mt-3 mb-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const qId = question?.id || question?._id;
                      if (qId && !votingRefs.current.question) {
                        handleVote("upvote");
                      }
                    }}
                    disabled={
                      !question ||
                      !(question.id || question._id) ||
                      votingInProgress.question ||
                      votingRefs.current.question
                    }
                    className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-md ${
                      question?.userVote === "upvote"
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
                    } ${
                      votingInProgress.question
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <ArrowUp
                      className={`w-3.5 h-3.5 ${
                        question?.userVote === "upvote" ? "fill-blue-600" : ""
                      }`}
                    />
                    <span>{(question?.upvotes || 0) - (question?.downvotes || 0)}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const qId = question?.id || question?._id;
                      if (qId && !votingRefs.current.question) {
                        handleVote("downvote");
                      }
                    }}
                    disabled={
                      !question ||
                      !(question.id || question._id) ||
                      votingInProgress.question ||
                      votingRefs.current.question
                    }
                    className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-md ${
                      question?.userVote === "downvote"
                        ? "text-red-600 bg-red-50"
                        : "text-gray-500 hover:text-red-600 hover:bg-gray-50"
                    } ${
                      votingInProgress.question
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <ArrowDown
                      className={`w-3.5 h-3.5 ${
                        question?.userVote === "downvote" ? "fill-red-600" : ""
                      }`}
                    />
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
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">
                          {comment.authorId?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-gray-900">
                            {comment.authorId}
                          </span>
                          {comment.parentType === "answer" && (
                            (() => {
                              const parentAnswer = answers.find(
                                (a) => (a.id || a._id) === comment.parentId
                              );
                              return parentAnswer ? (
                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">
                                  Replying to @{parentAnswer.authorId}
                                </span>
                              ) : null;
                            })()
                          )}
                          {comment.parentType === "question" && (
                            <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-medium">
                              Replying to @{question?.authorId}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {editingComment === (comment.id || comment._id) ? (
                          <div className="space-y-3 mb-2">
                            <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                              <Editor
                                apiKey={
                                  process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
                                  "no-api-key"
                                }
                                value={editCommentContent}
                                onEditorChange={setEditCommentContent}
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
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveComment}
                                disabled={submitting || !editCommentContent.trim()}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                              >
                                {submitting ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                onClick={handleCancelEditComment}
                                disabled={submitting}
                                variant="outline"
                                size="sm"
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className="text-gray-800 leading-relaxed mb-2 text-sm"
                              dangerouslySetInnerHTML={{ __html: comment.content }}
                            />
                            <div className="flex items-center justify-between mt-2">
                              {session && (
                                <div
                                  className="flex items-center gap-3"
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
                              className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-md ${
                                comment.userVote === "like"
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
                              } ${
                                votingInProgress.comments[
                                  comment.id || comment._id
                                ]
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
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
                              className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-md ${
                                comment.userVote === "dislike"
                                  ? "text-red-600 bg-red-50"
                                  : "text-gray-500 hover:text-red-600 hover:bg-gray-50"
                              } ${
                                votingInProgress.comments[
                                  comment.id || comment._id
                                ]
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>{comment.dislikes || 0}</span>
                            </button>
                          </div>
                          )}
                          <div className="flex items-center gap-2">
                            {session && session.user.email !== comment.authorId && (
                              <button
                                onClick={() => handleReplyToComment(comment)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Reply to comment"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {session?.user?.email === comment.authorId && !editingComment && (
                              <>
                                <button
                                  onClick={() => handleEditComment(comment)}
                                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Edit comment"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Are you sure you want to delete this comment?")) {
                                      try {
                                        const commentId = comment.id || comment._id;
                                        await authFetch(`/api/comments/${commentId}`, {
                                          method: "DELETE",
                                        });
                                        // Remove comment from state directly
                                        const updatedComments = { ...comments };
                                        Object.keys(updatedComments).forEach((key) => {
                                          updatedComments[key] = updatedComments[key].filter(
                                            (c) => (c.id || c._id) !== commentId
                                          );
                                        });
                                        setComments(updatedComments);
                                        
                                        // Remove from commentReplies if it exists there
                                        const updatedReplies = { ...commentReplies };
                                        Object.keys(updatedReplies).forEach((parentId) => {
                                          updatedReplies[parentId] = updatedReplies[parentId].filter(
                                            (c) => (c.id || c._id) !== commentId
                                          );
                                        });
                                        setCommentReplies(updatedReplies);
                                        
                                        // Remove from localStorage
                                        const storageKey = `commentReplies_${questionId}`;
                                        try {
                                          const stored = localStorage.getItem(storageKey);
                                          if (stored) {
                                            const storedReplies = JSON.parse(stored);
                                            delete storedReplies[commentId];
                                            localStorage.setItem(storageKey, JSON.stringify(storedReplies));
                                          }
                                        } catch (e) {
                                          console.error("Error updating localStorage:", e);
                                        }
                                        
                                        showToast("Comment deleted successfully", "success");
                                      } catch (error) {
                                        console.error("Error deleting comment:", error);
                                        showToast("Failed to delete comment", "error");
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                          </>
                        )}
                        {/* Reply Editor for Comment */}
                        {session && 
                         openReplyInput === `comment-${comment.id || comment._id}` && 
                         session.user.email !== comment.authorId && (
                          <div className="mt-3 ml-10 pl-4 border-l-2 border-blue-200 space-y-3">
                            <div className="mb-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-xs font-semibold text-blue-700">
                                Replying to <span className="font-bold">@{comment.authorId}</span>
                              </p>
                            </div>
                            <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                              <Editor
                                apiKey={
                                  process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
                                  "no-api-key"
                                }
                                value={replyContent[`comment-${comment.id || comment._id}`] || ""}
                                onEditorChange={(content) =>
                                  setReplyContent({
                                    ...replyContent,
                                    [`comment-${comment.id || comment._id}`]: content,
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
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  handleSubmitReply(
                                    comment.parentType,
                                    comment.parentId,
                                    `comment-${comment.id || comment._id}`
                                  )
                                }
                                disabled={submitting || !replyContent[`comment-${comment.id || comment._id}`]?.trim()}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                              >
                                {submitting ? "Posting..." : "Post Reply"}
                              </Button>
                              <Button
                                onClick={() =>
                                  handleCancelReply(`comment-${comment.id || comment._id}`)
                                }
                                disabled={submitting}
                                variant="outline"
                                size="sm"
                                className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Facebook-style Threaded Replies - Nested under parent comment */}
                        {(commentReplies[comment.id || comment._id] || []).length > 0 && (
                          <div className="mt-3 ml-10 space-y-3">
                            {(commentReplies[comment.id || comment._id] || []).map((reply, replyIndex) => (
                              <div
                                key={reply.id || `reply-${comment.id}-${replyIndex}`}
                                className="pl-4 border-l-2 border-blue-200 bg-gray-50 rounded-r-lg py-2"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-300 to-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-[10px] font-bold">
                                      {reply.authorId?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-gray-900">
                                        {reply.authorId}
                                      </span>
                                      <span className="text-[10px] text-gray-500">
                                        {new Date(reply.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div
                                      className="text-gray-700 leading-relaxed text-xs mb-2"
                                      dangerouslySetInnerHTML={{ __html: reply.content }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const replyId = reply.id || reply._id;
                                          if (replyId && !votingRefs.current.comments[replyId]) {
                                            handleCommentLike(replyId, e);
                                          }
                                        }}
                                        disabled={
                                          votingInProgress.comments[reply.id || reply._id] ||
                                          votingRefs.current.comments[reply.id || reply._id]
                                        }
                                        className={`flex items-center gap-1 text-[10px] font-medium transition-all px-1.5 py-0.5 rounded ${
                                          reply.userVote === "like"
                                            ? "text-blue-600 bg-blue-50"
                                            : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
                                        } ${
                                          votingInProgress.comments[reply.id || reply._id]
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer"
                                        }`}
                                      >
                                        <ThumbsUp className="w-2.5 h-2.5" />
                                        <span>{reply.likes || 0}</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const replyId = reply.id || reply._id;
                                          if (replyId && !votingRefs.current.comments[replyId]) {
                                            handleCommentDislike(replyId, e);
                                          }
                                        }}
                                        disabled={
                                          votingInProgress.comments[reply.id || reply._id] ||
                                          votingRefs.current.comments[reply.id || reply._id]
                                        }
                                        className={`flex items-center gap-1 text-[10px] font-medium transition-all px-1.5 py-0.5 rounded ${
                                          reply.userVote === "dislike"
                                            ? "text-red-600 bg-red-50"
                                            : "text-gray-500 hover:text-red-600 hover:bg-gray-50"
                                        } ${
                                          votingInProgress.comments[reply.id || reply._id]
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer"
                                        }`}
                                      >
                                        <ThumbsDown className="w-2.5 h-2.5" />
                                        <span>{reply.dislikes || 0}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                      className="text-blue-600 border-2 border-blue-300 bg-blue-50 font-semibold rounded-xl px-4 py-2 transition-all duration-200 hover:shadow-md"
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
            {editingAnswer === (answer.id || answer._id) ? (
              <div className="space-y-4 mb-6">
                <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                  <Editor
                    apiKey={
                      process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"
                    }
                    value={editAnswerContent}
                    onEditorChange={setEditAnswerContent}
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
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveAnswer}
                    disabled={submitting || !editAnswerContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={handleCancelEditAnswer}
                    disabled={submitting}
                    variant="outline"
                    className="px-6 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="prose prose-slate max-w-none mb-6 text-gray-700"
                dangerouslySetInnerHTML={{ __html: answer.content }}
              />
            )}

            {/* Facebook-style Like / Dislike - Inline, smaller */}
            <div className="flex items-center gap-3 mt-3 mb-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const answerId = answer?.id || answer?._id;
                  if (
                    answerId &&
                    !votingInProgress.answers[answerId] &&
                    !votingRefs.current.answers[answerId]
                  ) {
                    handleAnswerUseful(answerId, "useful");
                  }
                }}
                disabled={
                  !(answer?.id || answer?._id) ||
                  votingInProgress.answers[answer?.id || answer?._id] ||
                  votingRefs.current.answers[answer?.id || answer?._id]
                }
                className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-md ${
                  answer.userVote === "useful"
                    ? "text-green-600 bg-green-50"
                    : "text-gray-500 hover:text-green-600 hover:bg-gray-50"
                } ${
                  votingInProgress.answers[answer?.id || answer?._id]
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{(answer?.usefulCount || 0) - (answer?.notUsefulCount || 0)}</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const answerId = answer?.id || answer?._id;
                  if (
                    answerId &&
                    !votingInProgress.answers[answerId] &&
                    !votingRefs.current.answers[answerId]
                  ) {
                    handleAnswerUseful(answerId, "notUseful");
                  }
                }}
                disabled={
                  !(answer?.id || answer?._id) ||
                  votingInProgress.answers[answer?.id || answer?._id] ||
                  votingRefs.current.answers[answer?.id || answer?._id]
                }
                className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-md ${
                  answer.userVote === "notUseful"
                    ? "text-red-600 bg-red-50"
                    : "text-gray-500 hover:text-red-600 hover:bg-gray-50"
                } ${
                  votingInProgress.answers[answer?.id || answer?._id]
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
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

              <div className="flex items-center gap-2">
                {session && session.user.email !== answer.authorId && (
                  <button
                    onClick={() => handleReplyToAnswer(answer)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Reply to answer"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                )}
                {session?.user?.email === answer.authorId && !editingAnswer && (
                  <>
                    <button
                      onClick={() => handleEditAnswer(answer)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit answer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this answer?")) {
                          try {
                            const answerId = answer.id || answer._id;
                            await authFetch(`/api/answers/${answerId}`, {
                              method: "DELETE",
                            });
                            // Remove answer from state directly
                            const updatedAnswers = answers.filter(
                              (a) => (a.id || a._id) !== answerId
                            );
                            setAnswers(updatedAnswers);
                            showToast("Answer deleted successfully", "success");
                          } catch (error) {
                            console.error("Error deleting answer:", error);
                            showToast("Failed to delete answer", "error");
                          }
                        }
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete answer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {isQuestionOwner && !answer.accepted && (
                  <Button
                    size="sm"
                    onClick={() => handleAcceptAnswer(answer.id || answer._id)}
                    className="border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Answer
                  </Button>
                )}
              </div>
            </div>
            
            {/* Reply Editor for Answer */}
            {session && 
             openReplyInput === `answer-${answer.id || answer._id}` && 
             session.user.email !== answer.authorId && (
              <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-3">
                <div className="mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-700">
                    Replying to <span className="font-bold">@{answer.authorId}</span>'s answer
                  </p>
                </div>
                <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                  <Editor
                    apiKey={
                      process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"
                    }
                    value={replyContent[`answer-${answer.id || answer._id}`] || ""}
                    onEditorChange={(content) =>
                      setReplyContent({
                        ...replyContent,
                        [`answer-${answer.id || answer._id}`]: content,
                      })
                    }
                    init={{
                      height: 200,
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
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const answerId = answer.id || answer._id;
                      const replyKey = `answer-${answerId}`;
                      handleSubmitReply("answer", answerId, replyKey);
                    }}
                    disabled={
                      submitting || 
                      !replyContent[`answer-${answer.id || answer._id}`] || 
                      !replyContent[`answer-${answer.id || answer._id}`].replace(/<[^>]*>/g, "").trim()
                    }
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {submitting ? "Posting..." : "Post Reply"}
                  </Button>
                  <Button
                    onClick={() =>
                      handleCancelReply(`answer-${answer.id || answer._id}`)
                    }
                    disabled={submitting}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Display Replies/Comments for this Answer */}
            {(comments[answer.id || answer._id] || []).length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Replies ({comments[answer.id || answer._id].length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {(comments[answer.id || answer._id] || []).map((comment, commentIndex) => (
                    <div
                      key={comment.id || `answer-comment-${answer.id || answer._id}-${commentIndex}`}
                      className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">
                            {comment.authorId?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-gray-900">
                              {comment.authorId}
                            </span>
                            {comment.parentType === "answer" && (
                              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">
                                Replying to @{answer.authorId}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {editingComment === (comment.id || comment._id) ? (
                            <div className="space-y-3 mb-2">
                              <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                                <Editor
                                  apiKey={
                                    process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
                                    "no-api-key"
                                  }
                                  value={editCommentContent}
                                  onEditorChange={setEditCommentContent}
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
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveComment}
                                  disabled={submitting || !editCommentContent.trim()}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                >
                                  {submitting ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  onClick={handleCancelEditComment}
                                  disabled={submitting}
                                  variant="outline"
                                  size="sm"
                                  className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="text-gray-800 leading-relaxed mb-2 text-sm"
                                dangerouslySetInnerHTML={{ __html: comment.content }}
                              />
                              <div className="flex items-center justify-between mt-2">
                                {session && (
                                  <div
                                    className="flex items-center gap-3"
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
                                      className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-md ${
                                        comment.userVote === "like"
                                          ? "text-blue-600 bg-blue-50"
                                          : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
                                      } ${
                                        votingInProgress.comments[
                                          comment.id || comment._id
                                        ]
                                          ? "opacity-50 cursor-not-allowed"
                                          : "cursor-pointer"
                                      }`}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
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
                                      className={`flex items-center gap-1.5 text-xs font-medium transition-all px-2 py-1 rounded-md ${
                                        comment.userVote === "dislike"
                                          ? "text-red-600 bg-red-50"
                                          : "text-gray-500 hover:text-red-600 hover:bg-gray-50"
                                      } ${
                                        votingInProgress.comments[
                                          comment.id || comment._id
                                        ]
                                          ? "opacity-50 cursor-not-allowed"
                                          : "cursor-pointer"
                                      }`}
                                    >
                                      <ThumbsDown className="w-3 h-3" />
                                      <span>{comment.dislikes || 0}</span>
                                    </button>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  {session && session.user.email !== comment.authorId && (
                                    <button
                                      onClick={() => handleReplyToComment(comment)}
                                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                      title="Reply to comment"
                                    >
                                      <Reply className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {session?.user?.email === comment.authorId && !editingComment && (
                                    <>
                                      <button
                                        onClick={() => handleEditComment(comment)}
                                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Edit comment"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (confirm("Are you sure you want to delete this comment?")) {
                                            try {
                                              const commentId = comment.id || comment._id;
                                              await authFetch(`/api/comments/${commentId}`, {
                                                method: "DELETE",
                                              });
                                              // Remove comment from state directly
                                              const updatedComments = { ...comments };
                                              Object.keys(updatedComments).forEach((key) => {
                                                updatedComments[key] = updatedComments[key].filter(
                                                  (c) => (c.id || c._id) !== commentId
                                                );
                                              });
                                              setComments(updatedComments);
                                              
                                              // Remove from commentReplies if it exists there
                                              const updatedReplies = { ...commentReplies };
                                              Object.keys(updatedReplies).forEach((parentId) => {
                                                updatedReplies[parentId] = updatedReplies[parentId].filter(
                                                  (c) => (c.id || c._id) !== commentId
                                                );
                                              });
                                              setCommentReplies(updatedReplies);
                                              
                                              // Remove from localStorage
                                              const storageKey = `commentReplies_${questionId}`;
                                              try {
                                                const stored = localStorage.getItem(storageKey);
                                                if (stored) {
                                                  const storedReplies = JSON.parse(stored);
                                                  delete storedReplies[commentId];
                                                  localStorage.setItem(storageKey, JSON.stringify(storedReplies));
                                                }
                                              } catch (e) {
                                                console.error("Error updating localStorage:", e);
                                              }
                                              
                                              showToast("Comment deleted successfully", "success");
                                            } catch (error) {
                                              console.error("Error deleting comment:", error);
                                              showToast("Failed to delete comment", "error");
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                          {/* Reply Editor for Comment */}
                          {session && 
                           openReplyInput === `comment-${comment.id || comment._id}` && 
                           session.user.email !== comment.authorId && (
                            <div className="mt-3 ml-10 pl-4 border-l-2 border-blue-200 space-y-3">
                              <div className="mb-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs font-semibold text-blue-700">
                                  Replying to <span className="font-bold">@{comment.authorId}</span>
                                </p>
                              </div>
                              <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                                <Editor
                                  apiKey={
                                    process.env.NEXT_PUBLIC_TINYMCE_API_KEY ||
                                    "no-api-key"
                                  }
                                  value={replyContent[`comment-${comment.id || comment._id}`] || ""}
                                  onEditorChange={(content) =>
                                    setReplyContent({
                                      ...replyContent,
                                      [`comment-${comment.id || comment._id}`]: content,
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
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    handleSubmitReply(
                                      comment.parentType,
                                      comment.parentId,
                                      `comment-${comment.id || comment._id}`
                                    )
                                  }
                                  disabled={submitting || !replyContent[`comment-${comment.id || comment._id}`]?.trim()}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                >
                                  {submitting ? "Posting..." : "Post Reply"}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleCancelReply(`comment-${comment.id || comment._id}`)
                                  }
                                  disabled={submitting}
                                  variant="outline"
                                  size="sm"
                                  className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Facebook-style Threaded Replies - Nested under parent comment */}
                          {(commentReplies[comment.id || comment._id] || []).length > 0 && (
                            <div className="mt-3 ml-10 space-y-3">
                              {(commentReplies[comment.id || comment._id] || []).map((reply, replyIndex) => (
                                <div
                                  key={reply.id || `reply-${comment.id}-${replyIndex}`}
                                  className="pl-4 border-l-2 border-blue-200 bg-gray-50 rounded-r-lg py-2"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-300 to-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-white text-[10px] font-bold">
                                        {reply.authorId?.charAt(0)?.toUpperCase() || "U"}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-gray-900">
                                          {reply.authorId}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                          {new Date(reply.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div
                                        className="text-gray-700 leading-relaxed text-xs mb-2"
                                        dangerouslySetInnerHTML={{ __html: reply.content }}
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const replyId = reply.id || reply._id;
                                            if (replyId && !votingRefs.current.comments[replyId]) {
                                              handleCommentLike(replyId, e);
                                            }
                                          }}
                                          disabled={
                                            votingInProgress.comments[reply.id || reply._id] ||
                                            votingRefs.current.comments[reply.id || reply._id]
                                          }
                                          className={`flex items-center gap-1 text-[10px] font-medium transition-all px-1.5 py-0.5 rounded ${
                                            reply.userVote === "like"
                                              ? "text-blue-600 bg-blue-50"
                                              : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
                                          } ${
                                            votingInProgress.comments[reply.id || reply._id]
                                              ? "opacity-50 cursor-not-allowed"
                                              : "cursor-pointer"
                                          }`}
                                        >
                                          <ThumbsUp className="w-2.5 h-2.5" />
                                          <span>{reply.likes || 0}</span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const replyId = reply.id || reply._id;
                                            if (replyId && !votingRefs.current.comments[replyId]) {
                                              handleCommentDislike(replyId, e);
                                            }
                                          }}
                                          disabled={
                                            votingInProgress.comments[reply.id || reply._id] ||
                                            votingRefs.current.comments[reply.id || reply._id]
                                          }
                                          className={`flex items-center gap-1 text-[10px] font-medium transition-all px-1.5 py-0.5 rounded ${
                                            reply.userVote === "dislike"
                                              ? "text-red-600 bg-red-50"
                                              : "text-gray-500 hover:text-red-600 hover:bg-gray-50"
                                          } ${
                                            votingInProgress.comments[reply.id || reply._id]
                                              ? "opacity-50 cursor-not-allowed"
                                              : "cursor-pointer"
                                          }`}
                                        >
                                          <ThumbsDown className="w-2.5 h-2.5" />
                                          <span>{reply.dislikes || 0}</span>
                                        </button>
                                        {session && session.user.email !== reply.authorId && (
                                          <button
                                            onClick={() => handleReplyToComment(reply)}
                                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                            title="Reply to comment"
                                          >
                                            <Reply className="w-3 h-3" />
                                          </button>
                                        )}
                                        {session?.user?.email === reply.authorId && (
                                          <>
                                            <button
                                              onClick={() => handleEditComment(reply)}
                                              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                              title="Edit comment"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={async () => {
                                                if (confirm("Are you sure you want to delete this comment?")) {
                                                  try {
                                                    const replyId = reply.id || reply._id;
                                                    await authFetch(`/api/comments/${replyId}`, {
                                                      method: "DELETE",
                                                    });
                                                    // Remove from commentReplies
                                                    const updatedReplies = { ...commentReplies };
                                                    Object.keys(updatedReplies).forEach((parentId) => {
                                                      updatedReplies[parentId] = updatedReplies[parentId].filter(
                                                        (c) => (c.id || c._id) !== replyId
                                                      );
                                                    });
                                                    setCommentReplies(updatedReplies);
                                                    const updatedComments = { ...comments };
                                                    Object.keys(updatedComments).forEach((key) => {
                                                      updatedComments[key] = updatedComments[key].filter(
                                                        (c) => (c.id || c._id) !== replyId
                                                      );
                                                    });
                                                    setComments(updatedComments);
                                                    const storageKey = `commentReplies_${questionId}`;
                                                    try {
                                                      const stored = localStorage.getItem(storageKey);
                                                      if (stored) {
                                                        const storedReplies = JSON.parse(stored);
                                                        delete storedReplies[replyId];
                                                        localStorage.setItem(storageKey, JSON.stringify(storedReplies));
                                                      }
                                                    } catch (e) {
                                                      console.error("Error updating localStorage:", e);
                                                    }
                                                    
                                                    showToast("Comment deleted successfully", "success");
                                                  } catch (error) {
                                                    console.error("Error deleting comment:", error);
                                                    showToast("Failed to delete comment", "error");
                                                  }
                                                }
                                              }}
                                              className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                              title="Delete comment"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    className="text-blue-600 border-2 border-blue-300 bg-blue-50  font-bold rounded-xl px-5 py-2 shadow-sm hover:shadow-md transition-all duration-200"
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

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { authFetch, authFetchWithFormData } from "@/lib/api";

export default function AskQuestionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return <div className="container mx-auto p-8 text-center">Loading...</div>;
  }

  if (!session) {
    router.push("/api/auth/signin");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in title and description");
      return;
    }

    setLoading(true);
    try {
      await authFetch("/api/questions", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description,
          tags: tags.trim(),
        }),
      });
      router.push("/questions");
    } catch (error) {
      console.error("Error creating question:", error);
      alert("Failed to create question");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (blobInfo, progress) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
        <Card className="bg-white border-2 border-gray-100 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="px-6 sm:px-8 lg:px-10 pt-8 sm:pt-10 pb-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
            <div className="space-y-3">
              <CardTitle className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Ask a Question
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 lg:px-10 pb-8 sm:pb-10 bg-white">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Section */}
              <div className="space-y-3">
                <label
                  htmlFor="question-title"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Title
                </label>
                <div className="space-y-2">
                  <Input
                    id="question-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's your question?"
                    maxLength={200}
                    required
                    className="h-14 text-base bg-white text-gray-900 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">
                      Summarize your problem in one clear sentence
                    </p>
                    <span className="text-xs text-gray-400 font-medium">
                      {title.length}/200
                    </span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <label
                  htmlFor="question-description"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Description
                </label>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-300">
                  <Editor
                    id="question-description"
                    apiKey={
                      process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"
                    }
                    value={description}
                    onEditorChange={setDescription}
                    init={{
                      height: 400,
                      min_height: 220,
                      menubar: false,
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
                        "body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.6; margin: 12px; }",
                      toolbar_mode: "sliding",
                      resize: true,
                      branding: false,
                      skin: "oxide",
                      content_css: "default",
                      auto_focus: false,
                    }}
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                <label
                  htmlFor="question-tags"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Tags (comma-separated)
                </label>
                <div className="space-y-2">
                  <Input
                    id="question-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., javascript, react, python"
                    maxLength={500}
                    className="h-12 text-base bg-white text-gray-900 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-0 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">
                      Add tags to help others find your question
                    </p>
                    <span className="text-xs text-gray-400 font-medium">
                      {tags.length}/500
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transform hover:scale-105"
                >
                  {loading ? (
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
                    "Post Question"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="h-12 px-8 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 hover:shadow-md"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

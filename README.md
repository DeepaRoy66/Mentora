Mentora – AI Powered Study Platform

Mentora is a next-gen AI-powered learning platform where students can upload PDFs, generate smart summaries, create quizzes, ask questions, and compete in real-time multiplayer MCQ battles.



Key Highlights

AI-powered PDF understanding
Smart summary & quiz generation
Real-time multiplayer contests
Community-driven Q&A forum
Google authentication
Mobile-friendly UI
Production-ready architecture

Features
PDF Management
Google login required
Upload & manage PDFs
Supabase cloud storage
Public / private visibility
Category tags
Bulk actions

 AI Study Assistant
Short & detailed summaries
Auto-generated Q&A
MCQ quiz generation
Scoring system
Hints & answer reveal
Fullscreen AI panel
Public Library
Browse community PDFs
Category filters
Search suggestions
Pagination
Fullscreen viewer

Mentora Q
Rich-text editor (TinyMCE)
Image upload support
Upvote / downvote
Tags & pagination
Answer threads

Multiplayer MCQ Contest
Generate quiz from PDF
Create contest room
Share join link / QR
Admin lobby (WebSocket)
Live players join

Start / cancel match
User Experience
Google OAuth login
Profile & badges UI
Responsive navbar
Trending categories
Toast notifications


 Tech Stack
Frontend
Next.js 14 (App Router)
Tailwind CSS
Radix UI
Lucide Icons
TinyMCE Editor
QR Code generator
react-pdf / pdfjs-dist
Auth & Storage
NextAuth (Google OAuth)
Supabase Storage

Backend
FastAPI
MongoDB
WebSockets (live contest)
Utilities
jsonwebtoken
clsx
class-variance-authority
tailwind-merge
nextjs-toploader
Geist font

 Folder Structure
app/
 ├─ page.js
 ├─ upload/
 ├─ all-upload/
 ├─ generatesummary/
 ├─ questions/
 ├─ search/
 ├─ mcq-contest/
 ├─ profile/
 ├─ badges/

components/
 ├─ navbar/
 ├─ auth/
 ├─ loading/
 ├─ ui/

api/
 └─ auth/[...nextauth]

lib/
 ├─ api helpers
 ├─ supabase client
 └─ models

public/
 └─ assets



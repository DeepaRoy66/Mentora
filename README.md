🚀 Mentora – AI Powered Study Platform

Mentora is a next-gen AI-powered learning platform where students can upload PDFs, generate smart summaries, create quizzes, ask questions, and compete in real-time multiplayer MCQ battles.

🎯 Built for hackathons
⚡ Scalable for production
🔐 Secure & cloud-ready

🌟 Key Highlights

AI-powered PDF understanding

Smart summary & quiz generation

Real-time multiplayer contests

Community-driven Q&A forum

Google authentication

Cloud storage with Supabase

Mobile-friendly UI

Production-ready architecture

🔥 Features
📄 PDF Management

Google login required

Upload & manage PDFs

Supabase cloud storage

Public / private visibility

Category tags

Bulk actions

🤖 AI Study Assistant

Short & detailed summaries

Auto-generated Q&A

MCQ quiz generation

Scoring system

Hints & answer reveal

Fullscreen AI panel

🌍 Public Library

Browse community PDFs

Category filters

Search suggestions

Pagination

Fullscreen viewer

💬 Q&A Forum

Rich-text editor (TinyMCE)

Image upload support

Upvote / downvote

Tags & pagination

Answer threads

🎮 Multiplayer MCQ Contest

Generate quiz from PDF

Create contest room

Share join link / QR

Admin lobby (WebSocket)

Live players join

Start / cancel match

👤 User Experience

Google OAuth login

Profile & badges UI

Responsive navbar

Trending categories

Toast notifications

Framer Motion animations

🛠 Tech Stack
Frontend

Next.js 14 (App Router)

React 18

Tailwind CSS

Framer Motion

Radix UI

Lucide Icons

react-icons

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

📁 Folder Structure
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

⚙ Installation
git clone <repo-url>
cd Mentora
npm install

Run Development
npm run dev


➡ http://localhost:3000

🔐 Environment Variables

Create .env.local

NEXT_PUBLIC_API_URL=http://localhost:8000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_TINYMCE_API_KEY=


⚠ If any variable is missing, related features will fail.

📜 Scripts
Command	Purpose
npm run dev	Start dev server
npm run build	Build for production
npm run start	Run production
npm run lint	Code lint
🌐 Production Deployment
Steps
npm install
npm run build
npm run start
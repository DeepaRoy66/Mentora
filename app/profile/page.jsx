"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { Mail, FileText, Zap, Trophy, LogOut, Camera } from "lucide-react"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState({ points: 0, notes: 0, badges: 0 })
  const [backendImage, setBackendImage] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)

  useEffect(() => {
    // 1. Wait for user to be logged in
    if (!session?.user?.email) return

    // 2. Fetch Stats from PYTHON Backend
    // Must use x-user-email header so Python knows who we are
    fetch("http://127.0.0.1:8000/api/user-stats", {
      headers: { 
        "x-user-email": session.user.email 
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("Backend error " + res.status)
        return res.json()
      })
      .then(data => {
        setStats({
          points: data.contributionPoints || 0,
          notes: data.notesCount || 0,
          badges: data.badgesCount || 0,
        })
        if (data.image) setBackendImage(data.image)
      })
      .catch(err => console.error("Stats Fetch Error:", err))
  }, [session])

  if (status === "loading") return <div className="p-10 text-center">Loading profile...</div>
  if (!session) return <div className="p-10 text-center">Please log in to view profile.</div>

  const user = session.user
  const displayImage = uploadedImage || backendImage || user.image

  const handleImageUpload = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setUploadedImage(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Card className="min-h-screen rounded-none border-0 shadow-none">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 md:px-16 py-12 md:py-24 relative">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 text-white w-full">
            <div className="relative group h-32 w-32 md:h-40 md:w-40 rounded-full ring-4 ring-white shadow-2xl overflow-hidden bg-white shrink-0">
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="object-cover h-full w-full" referrerPolicy="no-referrer"/>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-5xl font-bold text-blue-600 bg-white">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-8 h-8 text-white" />
                <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{user.name}</h1>
              <p className="text-blue-100 mt-2 text-lg font-medium opacity-90">{user.email}</p>
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
            <Stat icon={<Zap className="w-8 h-8 text-yellow-500"/>} label="Contribution Points" value={stats.points}/>
            <Stat icon={<FileText className="w-8 h-8 text-blue-600"/>} label="Uploaded Notes" value={stats.notes}/>
            <Stat icon={<Trophy className="w-8 h-8 text-purple-600"/>} label="Badges Earned" value={stats.badges}/>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-4 bg-gray-50 w-16 h-16 rounded-full items-center mx-auto">{icon}</div>
      <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  )
}
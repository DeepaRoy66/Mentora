"use client"

import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { Mail, FileText, Zap, Trophy, LogOut, Camera } from "lucide-react"

// Ensure these paths match your project structure
import { Avatar,AvatarFallback,AvatarImage } from "../components/ui/avatar"
import { Card,CardContent,CardHeader} from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  
  const [stats, setStats] = useState({ points: 0, notes: 0, badges: 0 })
  const [uploadedImage, setUploadedImage] = useState(null) // Only used if user manually uploads a new file

  // Fetch live stats from Python
  useEffect(() => {
    if (session?.user?.email) {
      fetch(`http://127.0.0.1:5000/api/user-stats?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          setStats({
            points: data.contributionPoints || 0,
            notes: data.notesCount || 0,
            badges: data.badgesCount || 0
          })
        })
        .catch((err) => console.error("Error connecting to Python backend:", err))
    }
  }, [session])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  // Redirect if not logged in
  if (!session) redirect("/")

  const user = session.user
  
  // Logic: Use manually uploaded image -> OR use Session image -> OR default to empty
  const displayImage = uploadedImage || user.image

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setUploadedImage(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Card className="min-h-screen rounded-none border-0 shadow-none">
        
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 px-16 py-24 relative">
          <div className="flex flex-col md:flex-row items-center gap-10 text-white">
            
            {/* AVATAR SECTION (Cleaned up) */}
            <div className="relative group h-40 w-40 rounded-full ring-4 ring-white shadow-2xl overflow-hidden bg-white">
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

              {/* Camera Overlay */}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="w-8 h-8 text-white" />
                <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

            {/* User Info */}
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-bold tracking-tight">{user.name}</h1>
              <p className="text-blue-100 mt-2 text-lg font-medium opacity-90">
                {user.email}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 md:px-16 py-12 space-y-12 bg-white">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Stat icon={<Zap className="w-8 h-8 text-yellow-500" />} label="Contribution Points" value={stats.points} />
            <Stat icon={<FileText className="w-8 h-8 text-blue-600" />} label="Uploaded Notes" value={stats.notes} />
            <Stat icon={<Trophy className="w-8 h-8 text-purple-600" />} label="Badges Earned" value={stats.badges} />
          </div>

          {/* Sign Out Button */}
          <div className="flex justify-center md:justify-end pt-8 border-t">
            <Button size="lg" variant="destructive" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper Component for Stats
function Stat({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
      <div className="flex justify-center mb-4 bg-gray-50 w-16 h-16 rounded-full items-center mx-auto">
        {icon}
      </div>
      <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  )
}
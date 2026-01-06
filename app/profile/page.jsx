"use client"

import { useSession, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"

import {
  Mail,
  FileText,
  Zap,
  Trophy,
  LogOut,
  Camera,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Card,CardContent,CardDescription,CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"


export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [image, setImage] = useState("")

  useEffect(() => {
    if (session?.user) {
      setImage(session.user.image || "")
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-blue-600" />
      </div>
    )
  }

  if (!session) redirect("/")

  const user = session.user

  const uploadImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* PROFILE CARD */}
      <Card className="min-h-screen rounded-none border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 px-16 py-24 relative">
          <div className="flex items-center gap-10 text-white">
            <div className="relative group">
              <Avatar className="h-40 w-40 ring-4 ring-white">
                <AvatarImage src={image} />
                <AvatarFallback className="text-5xl bg-white text-blue-600">
                  {user.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Optional: Allow only image upload */}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100">
                <Camera />
                <input hidden type="file" accept="image/*" onChange={uploadImage} />
              </label>
            </div>

            {/* Display name only, no editing */}
            <h1 className="text-5xl font-bold">{user.name}</h1>
          </div>
        </CardHeader>

        <CardContent className="px-16 py-20 space-y-12 bg-white">
          <div className="flex items-center gap-3 text-lg">
            <Mail />
            {user.email}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Stat icon={<Zap className="text-yellow-500" />} label="Points" value="320" />
            <Stat icon={<FileText className="text-blue-600" />} label="Uploaded Notes" value="9" />
            <Stat icon={<Trophy className="text-purple-600" />} label="Badges" value="4" />
          </div>

          <div className="flex justify-end items-center">
            <Button size="lg" variant="destructive" onClick={() => signOut()}>
              <LogOut className="mr-2" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-8 text-center border">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-4xl font-bold">{value}</p>
      <p className="text-gray-600">{label}</p>
    </div>
  )
}

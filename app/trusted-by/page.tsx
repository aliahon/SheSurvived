"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Bell } from "lucide-react"

export default function TrustedByPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [trustedBy, setTrustedBy] = useState<any[]>([])

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    setUser(userData)

    // Get all users
    const allUsers = JSON.parse(localStorage.getItem("safetyUsers") || "[]")

    // Get users who trust this user
    if (userData.trustedBy && userData.trustedBy.length > 0) {
      const userTrustedBy = allUsers.filter((u: any) => userData.trustedBy.includes(u.id))
      setTrustedBy(userTrustedBy)
    }
  }, [router])

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center py-4">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-pink-700">People Trusting You</h1>
      </header>

      <div className="flex-1">
        <div className="space-y-4">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-pink-500 mr-2" />
            <h2 className="text-lg font-medium">People Who Trust You</h2>
          </div>

          {trustedBy.length > 0 ? (
            <div className="space-y-3">
              {trustedBy.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{contact.fullName}</h3>
                        <p className="text-sm text-gray-500">{contact.email}</p>
                      </div>
                      <div className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full">Trusts You</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No one has added you as a trusted contact yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

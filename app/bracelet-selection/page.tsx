"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Watch, Users } from "lucide-react"

export default function BraceletSelectionPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(currentUser))
  }, [router])

  const handleSelection = (hasBracelet: boolean) => {
    if (!user) return

    // Update user in local storage
    const updatedUser = { ...user, hasBracelet }
    localStorage.setItem("safetyUser", JSON.stringify(updatedUser))

    // Update user in users array
    const users = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
    const updatedUsers = users.map((u: any) => (u.id === user.id ? updatedUser : u))
    localStorage.setItem("safetyUsers", JSON.stringify(updatedUsers))

    // Redirect to dashboard
    router.push("/dashboard")
  }

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center mb-8">
        <Shield className="h-12 w-12 text-pink-500" />
        <h1 className="text-3xl font-bold text-pink-700 mt-2">SafeGuard</h1>
        <p className="text-sm text-gray-500">Your personal safety companion</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-pink-700">Choose Your Role</CardTitle>
          <CardDescription className="text-center">
            Do you have a SafeGuard bracelet or are you a trusted contact?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleSelection(true)}
            className="w-full h-24 flex flex-col items-center justify-center bg-pink-500 hover:bg-pink-600"
          >
            <Watch className="h-8 w-8 mb-2" />
            <span>I have a SafeGuard bracelet</span>
          </Button>

          <Button
            onClick={() => handleSelection(false)}
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center border-pink-300 text-pink-700 hover:bg-pink-100"
          >
            <Users className="h-8 w-8 mb-2" />
            <span>I am a trusted contact</span>
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">You can change this selection later in your profile settings</p>
        </CardFooter>
      </Card>
    </div>
  )
}

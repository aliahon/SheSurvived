"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Watch, Users } from "lucide-react"
import SheSurvivedLogo from "@/components/she-survived-logo"

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
    const updatedUser = {
      ...user,
      hasBracelet,
      // If user doesn't have a bracelet, mark as verified (no need for verification)
      // If user has a bracelet, they need to verify it (braceletVerified = false)
      braceletVerified: !hasBracelet,
    }
    localStorage.setItem("safetyUser", JSON.stringify(updatedUser))

    // Update user in users array
    const users = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
    const updatedUsers = users.map((u: any) => (u.id === user.id ? updatedUser : u))
    localStorage.setItem("safetyUsers", JSON.stringify(updatedUsers))

    // Redirect to verification page if user has bracelet, otherwise to dashboard
    if (hasBracelet) {
      router.push("/bracelet-verification")
    } else {
      router.push("/dashboard")
    }
  }

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center mb-8">
        <SheSurvivedLogo size="lg" />
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-pink-700">Choose Your Role</CardTitle>
          <CardDescription className="text-center">
            Do you have a SheSurvived bracelet or are you a trusted contact?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => handleSelection(true)}
            className="w-full h-24 flex flex-col items-center justify-center bg-pink-500 hover:bg-pink-600"
          >
            <Watch className="h-8 w-8 mb-2" />
            <span>I have a SheSurvived bracelet</span>
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

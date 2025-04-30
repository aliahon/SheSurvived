"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import SheSurvivedLogo from "@/components/she-survived-logo"

export default function BraceletVerificationPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [braceletCode, setBraceletCode] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)

    // If user doesn't have bracelet or already verified, redirect to dashboard
    if (!userData.hasBracelet || userData.braceletVerified) {
      router.push("/dashboard")
      return
    }

    setUser(userData)
  }, [router])

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    // Simple validation
    if (!braceletCode.trim()) {
      setError("Please enter your bracelet code")
      setIsSubmitting(false)
      return
    }

    // Validate bracelet code format (example: 8 characters alphanumeric)
    const codeRegex = /^[A-Za-z0-9]{8}$/
    if (!codeRegex.test(braceletCode)) {
      setError("Invalid bracelet code format. Please enter the 8-character code from your bracelet")
      setIsSubmitting(false)
      return
    }

    // In a real app, you would verify this code against a database
    // For demo purposes, we'll simulate a verification delay and accept any valid format
    setTimeout(() => {
      if (!user) return

      // Update user in local storage
      const updatedUser = {
        ...user,
        braceletVerified: true,
        braceletCode: braceletCode,
        braceletVerifiedAt: new Date().toISOString(),
      }
      localStorage.setItem("safetyUser", JSON.stringify(updatedUser))

      // Update user in users array
      const users = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
      const updatedUsers = users.map((u: any) => (u.id === user.id ? updatedUser : u))
      localStorage.setItem("safetyUsers", JSON.stringify(updatedUsers))

      // Redirect to dashboard
      router.push("/dashboard")
    }, 1500)
  }

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center mb-8">
        <SheSurvivedLogo size="lg" />
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-pink-700">Verify Your Bracelet</CardTitle>
          <CardDescription className="text-center">
            Please enter the unique code that came with your SheSurvived bracelet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="braceletCode">Bracelet Code</Label>
              <Input
                id="braceletCode"
                placeholder="Enter 8-character code (e.g., AB12CD34)"
                value={braceletCode}
                onChange={(e) => setBraceletCode(e.target.value.toUpperCase())}
                className="text-center tracking-widest text-lg"
                maxLength={8}
              />
              <p className="text-xs text-gray-500">
                You can find this code on the back of your bracelet or on the packaging
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify Bracelet"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">Lost your code? Contact customer support for assistance</p>
        </CardFooter>
      </Card>
    </div>
  )
}

"use client"

import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  withText?: boolean
  className?: string
}

export default function SheSurvivedLogo({ size = "md", withText = true, className = "" }: LogoProps) {
  // Size mapping for the logo
  const sizeMap = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-2xl" },
    xl: { icon: 72, text: "text-3xl" },
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image */}
      <div className="relative">
        <Image
          src="/images/simplest_nobg.png"
          alt="SheSurvived Logo"
          width={sizeMap[size].icon}
          height={sizeMap[size].icon}
          priority
        />
      </div>

      {/* Logo Text */}
      {withText && (
        <div className="ml-2 flex flex-col">
          <span className={`font-bold text-black leading-none ${sizeMap[size].text}`}>SheSurvived</span>
          <span className="text-xs text-gray-500">PROTECTING YOUR JOURNEY</span>
        </div>
      )}
    </div>
  )
}

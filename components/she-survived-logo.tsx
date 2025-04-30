"use client"

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
      {/* Logo Symbol - Extracted from the provided image */}
      <div className="relative">
        <svg
          width={sizeMap[size].icon}
          height={sizeMap[size].icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-black"
        >
          {/* Woman silhouette extracted from the image */}
          <path
            d="M50 5C40.5 5 30.5 10 25 20C19.5 30 20 40 25 50C30 60 35 65 35 75C35 85 30 90 20 95H35C40 90 42.5 85 42.5 80C42.5 75 40 70 35 65C30 60 25 55 25 45C25 35 30 25 40 20C50 15 60 20 65 30C70 40 65 50 60 55C55 60 50 65 50 70C50 75 52.5 80 57.5 85H75C65 80 60 75 60 70C60 65 65 60 70 55C75 50 80 40 80 30C80 20 70 10 60 10C55 10 50 12.5 45 17.5C40 12.5 35 5 25 5H50Z"
            fill="currentColor"
          />
        </svg>
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

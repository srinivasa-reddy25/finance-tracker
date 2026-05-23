'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Calculate subtle movement based on mouse position
  const xOffset =
    typeof window !== 'undefined'
      ? (mousePosition.x - window.innerWidth / 2) * 0.05
      : 0
  const yOffset =
    typeof window !== 'undefined'
      ? (mousePosition.y - window.innerHeight / 2) * 0.05
      : 0

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background font-brand selection:bg-foreground selection:text-background text-foreground">
      {/* Dynamic background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]"></div>

      {/* Main 404 Text */}
      <div
        className="relative z-10 select-none text-[30vw] sm:text-[25vw] font-black leading-none tracking-tighter drop-shadow-sm"
        style={{
          transform: `translate(${xOffset}px, ${yOffset}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        404
      </div>

      <div className="z-10 mt-8 flex flex-col items-center gap-8 px-4 text-center">
        <p className="max-w-md text-lg font-medium tracking-wide text-muted-foreground sm:text-xl">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-foreground px-8 py-4 text-sm font-bold uppercase tracking-widest text-background transition-transform duration-300 hover:scale-105 active:scale-95"
          href="/"
        >
          <span className="relative z-10 flex items-center gap-2">
            Return home
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 8l4 4m0 0l-4 4m4-4H3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </span>
          {/* Hover Sweep Effect */}
          <div className="absolute inset-0 -translate-x-full bg-background/20 transition-transform duration-500 ease-out group-hover:translate-x-0"></div>
        </Link>
      </div>

      {/* Modern Blurry Orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/5 opacity-50 mix-blend-multiply blur-3xl dark:opacity-20"></div>
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 translate-x-1/2 translate-y-1/2 rounded-full bg-foreground/5 opacity-50 mix-blend-multiply blur-3xl dark:opacity-20 animate-pulse"
        style={{ animationDuration: '4s' }}
      ></div>
    </div>
  )
}

"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"

export default function Loading() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Progress value={progress} />
    </div>
  )
} 
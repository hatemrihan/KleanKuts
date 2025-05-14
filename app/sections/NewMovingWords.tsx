'use client'

import React from 'react'

const MovingWords = () => {
  return (
    <div className="w-full overflow-hidden bg-white dark:bg-black py-4">
      <div className="flex whitespace-nowrap animate-[marquee_15s_linear_infinite]">
        {/* Create multiple instances to ensure continuous flow */}
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="text-[4.5vw] text-black dark:text-white font-light flex-shrink-0 mx-8 flex items-center"
          >
            <span className="mr-4">•</span>
            <span>SUMMER COLLECTION DROPPED</span>
            <span className="ml-4">•</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovingWords
'use client'

import React from 'react'

const MovingWords = () => {
  return (
    <div className="w-full overflow-hidden bg-white dark:bg-black py-2">
      <div className="flex whitespace-nowrap animate-[marquee_8s_linear_infinite]">
        {/* Create multiple instances to ensure continuous flow */}
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="text-[5vw] text-black dark:text-white font-light pl-[4vw] flex-shrink-0"
          >
           ELEVE ®
          </div>
        ))}
      </div>
    </div>
  )
}

export default MovingWords
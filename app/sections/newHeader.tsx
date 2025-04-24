"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const NewHeader = () => {
  return (
    <div className="relative w-full min-h-screen bg-neutral-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/malakandmodel-image.jpg"
          alt="Background Image"
          fill
          className="object-cover object-center brightness-75"
          sizes="100vw"
          quality={100}
          priority
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* Desktop Content Positioning */}
        <div className="flex-1 flex flex-col justify-end pb-40 px-4 ml-10">
          {/* Sponsor Text */}
          <div className="text-center mb-2">
            <p className="text-white/90 text-sm sm:text-base md:text-lg tracking-widest">
            EST. 2025
            </p>
          </div>

          {/* Main Title */}
          <h1 className="text-white text-5xl sm:text-7xl md:text-8xl lg:text-[9rem]  tracking-wider text-center mb-8 font-bold">
            KLEAN KUTS
          </h1>

          {/* CTA Button */}
          <div className="text-center">
            <Link 
              href="/collection"
              className="inline-block border border-white/30 text-white px-8 py-3 text-sm sm:text-base
                tracking-wider hover:bg-white hover:text-black transition-all duration-300 mb-8"
            >
              CHECK COLLECTION
            </Link>
          </div>
        </div>
      </div>

      {/* Optional: Add a scroll indicator */}

    </div>
  )
}

export default NewHeader
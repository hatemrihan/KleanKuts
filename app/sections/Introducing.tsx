import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ahlaImage from '@/public/images/ahla-image.jpg'

const Introducing = () => {
  return (
    <section className="w-full h-screen bg-white relative flex flex-col lg:flex-row">
      {/* Left content */}
      <div className="absolute lg:relative w-full lg:w-1/2 h-full flex items-center justify-center lg:justify-start lg:pl-16 z-10">
        <div className="space-y-4 lg:space-y-6 max-w-xl text-center lg:text-left px-6 md:px-12 lg:px-0">
          <div className="space-y-2 lg:space-y-4">
            <p className="text-white lg:text-black font-semibold text-sm md:text-xl">Introducing</p>
            <h1 className="text-white lg:text-black text-4xl md:text-7xl lg:text-8xl font-bold leading-none">SAGE-25</h1>
          </div>
          <p className="text-white lg:text-black text-sm md:text-lg font-light leading-relaxed">
            Get ready to level up the scene with pieces that redefines the clothing market,
            balancing provocative edge with sleek sophistication. Elevate your style, Trust.
          </p>
          <Link 
            href="/collection" 
            className="inline-block border border-white lg:border-black text-white lg:text-black px-6 md:px-12 py-2 md:py-3 rounded-full hover:bg-white hover:text-black lg:hover:bg-black lg:hover:text-white transition-colors text-sm md:text-lg"
          >
            Discover
          </Link>
        </div>
      </div>

      {/* Right content - Image */}
      <div className="absolute lg:relative lg:w-1/2 inset-0 lg:inset-auto">
        <Image
          src={ahlaImage}
          alt="FW25 Collection Model"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20 lg:hidden"></div>
      </div>
    </section>
  )
}

export default Introducing
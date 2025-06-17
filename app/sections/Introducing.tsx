'use client'

import React from 'react'
import Image from 'next/image'
import first from '@/public/images/first.jpg'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'

const Introducing = () => {
  const containerRef = React.useRef(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  }
  
  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  }

  return (
    <section 
      ref={containerRef}
      className="w-full min-h-screen bg-white dark:bg-black flex flex-col lg:flex-row items-stretch overflow-hidden"
    >
      {/* Left: Text content */}
      <motion.div 
        className="flex flex-col lg:flex-row flex-1"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Center: Headline and text */}
        <div className="flex-1 flex flex-col justify-center items-center lg:items-start px-4 md:px-10 py-8">
          <motion.h1 
            className="text-black dark:text-white font-light text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-none mb-4 text-center lg:text-left tracking-widest" 
            style={{lineHeight: 0.9}}
            variants={itemVariants}
          >
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">Be</span>
            <span className="block">Uniquely</span>
            <span className="block">Different</span>
          </motion.h1>
          
          <motion.div 
            className="max-w-xl w-full flex flex-col md:flex-row gap-6 items-center md:items-start"
            variants={itemVariants}
          >
            <div className="flex-1 text-center md:text-left">
              <motion.div 
                className="flex flex-col md:flex-row gap-4 text-sm text-gray-700 dark:text-gray-300 mt-4 font-light tracking-wide"
                variants={itemVariants}
              >
                <div className="flex-1">
                  Discover Eleve, Egypt's premium clothing collection. Hoodies, t-shirts 
                <div className="flex-1">
                   pants with elegant designs & exceptional fabrics.
                </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Right: Large portrait image - reduced size */}
      <motion.div 
        className="relative w-full lg:w-[450px] xl:w-[600px] min-h-[450px] h-[50vh] lg:h-auto flex-shrink-0"
        variants={imageVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <Image
          src={first}
          alt="Eleve Collection Model"
          fill
          className="object-contain object-center"
          priority
          sizes="(max-width: 1024px) 100vw, 420px"
        />
      </motion.div>
    </section>
  )
}

export default Introducing
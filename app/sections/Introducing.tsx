'use client'

import React from 'react'
import Image from 'next/image'
import ahlaImage from '@/public/images/try-image.jpg'
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
      {/* Left: Small image and text block */}
      <motion.div 
        className="flex flex-col lg:flex-row flex-1"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Small image on the left - visible only on mobile and tablet */}
        <motion.div 
          className="flex flex-col items-center justify-start pt-8 block lg:hidden px-4"
          variants={itemVariants}
        >
          <div className="w-16 h-20 mb-6 relative">
            <Image src={ahlaImage} alt="small" fill className="object-cover rounded" />
          </div>
        </motion.div>
        
        {/* Center: Headline and text */}
        <div className="flex-1 flex flex-col justify-center items-center lg:items-start px-4 md:px-8 py-8">
          <motion.h1 
            className="text-black dark:text-white font-bold text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-none mb-8 text-center lg:text-left" 
            style={{lineHeight:1.05}}
            variants={itemVariants}
          >
            Be <br />Uniquely<br />Different<br />
          </motion.h1>
          
          <motion.div 
            className="max-w-xl w-full flex flex-col md:flex-row gap-6 items-center md:items-start"
            variants={itemVariants}
          >
            <div className="flex-1 text-center md:text-left">
              <motion.p 
                className="text-2xl font-light mb-2 text-black dark:text-white"
                variants={itemVariants}
              >
                ПОЗВОЛЬТЕ СЕБЕ<br />БЫТЬ СОБОЙ<br />ПЕРЕД КАМЕРОЙ
              </motion.p>
              
              <motion.div 
                className="flex flex-col md:flex-row gap-4 text-xs text-gray-700 dark:text-gray-300 mt-4"
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
      
      {/* Right: Large portrait image */}
      <motion.div 
        className="relative w-full lg:w-[420px] xl:w-[520px] min-h-[320px] h-[50vw] lg:h-auto flex-shrink-0"
        variants={imageVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        <Image
          src={ahlaImage}
          alt="FW25 Collection Model"
          fill
          className="object-cover object-right"
          priority
        />
      </motion.div>
    </section>
  )
}

export default Introducing
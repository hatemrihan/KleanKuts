import React from 'react'
import Image from 'next/image'
import ahlaImage from '@/public/images/try-image.jpg'

const Introducing = () => {
  return (
    <section className="w-full min-h-screen bg-white dark:bg-black flex flex-col lg:flex-row items-stretch overflow-hidden">
      {/* Left: Small image and text block */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Small image on the left - visible only on mobile and tablet */}
        <div className="flex flex-col items-center justify-start pt-8 block lg:hidden px-4">
          <div className="w-16 h-20 mb-6 relative">
            <Image src={ahlaImage} alt="small" fill className="object-cover rounded" />
          </div>
        </div>
        {/* Center: Headline and text */}
        <div className="flex-1 flex flex-col justify-center items-center lg:items-start px-4 md:px-8 py-8">
          <h1 className="text-black dark:text-white font-bold text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-none mb-8 text-center lg:text-left" style={{lineHeight:1.05}}>
            First you<br />don't talk<br />about<br />design
          </h1>
          <div className="max-w-xl w-full flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="flex-1 text-center md:text-left">
              <p className="text-2xl font-light mb-2 text-black dark:text-white">ПОЗВОЛЬТЕ СЕБЕ<br />БЫТЬ СОБОЙ<br />ПЕРЕД КАМЕРОЙ</p>
              <div className="flex flex-col md:flex-row gap-4 text-xs text-gray-700 dark:text-gray-300 mt-4">
                <div className="flex-1">
                  Моя цель — это раскрыть вас актёра, обнажить вашу сущность и подчеркнуть эстетику через снимки.
                </div>
                <div className="flex-1">
                  Мне важно — показать ваши эмоции, которые вы проживаете в моменте, показать вас настоящих.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Right: Large portrait image */}
      <div className="relative w-full lg:w-[420px] xl:w-[520px] min-h-[320px] h-[50vw] lg:h-auto flex-shrink-0">
        <Image
          src={ahlaImage}
          alt="FW25 Collection Model"
          fill
          className="object-cover object-right"
          priority
        />
      </div>
    </section>
  )
}

export default Introducing
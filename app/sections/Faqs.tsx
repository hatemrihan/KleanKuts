"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { twMerge } from "tailwind-merge";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "What materials do you use?",
    answer: "We use premium quality materials sourced from sustainable suppliers. Our fabrics include organic cotton, linen, and recycled polyester blends that are both comfortable and environmentally friendly.",
  },
  {
    question: "Shipping Time",
    answer: "3-7 days || Dilevery is free.",
  },
  {
    question: "What is your shipping policy?",
answer: "Shipping Coverage We currently ship only within the Arab Republic of Egypt. - Carrier  Deliveries are handled via hashtag courier service.  Delivery Time Orders arrive within 3-7 business days from confirmation. Same‑day delivery is not available. Order Tracking & Support For updates or questions, contact us via: Phone/WhatsApp: 01024491885  Email:[eleve.egy.1@gmail.com](mailto:eleve.egy.1@gmail.com) Damaged in Transit  If your item arrives damaged during shipping, we will replace it at no extra cost. All other cases are not eligible for replacement, refund, or re‑shipment."
  },
  {
    question: "How can i track my orders?",
    answer:
      "By contacting us on our email or social media.",
  },
  {
    question: "How to join our Ambassadors program?",
    answer:
      "By [applying](/ambassador) in our website and following the instructions.",
  },
  
 
];

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });

  // Initialize the refs array with the correct length
  useEffect(() => {
    answerRefs.current = answerRefs.current.slice(0, faqs.length);
    while (answerRefs.current.length < faqs.length) {
      answerRefs.current.push(null);
    }
  }, []);

  useEffect(() => {
    // Measure heights of all answer elements
    const heights = answerRefs.current.map((ref) => ref?.scrollHeight || 0);
    setItemHeights(heights);
  }, [faqs]); // Re-measure when faqs content changes

  const toggleFaq = (index: number) => {
    setActiveIndex(prev => prev === index ? null : index);
  };

  return (
    <motion.section
      ref={sectionRef}
      className={twMerge("section py-16 md:py-24 bg-white dark:bg-black", "w-full bg-white dark:bg-black py-16 px-4 md:px-8")}
      id="faqs"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <div className="container max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column - Heading and Description */}
          <motion.div
            className="md:col-span-5"
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-yellow-500 dark:text-white">
              Any questions?<br />
             ELEVE  got you.
            </h2>
           

            <motion.div
              className="mt-6"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
             
            </motion.div>
          </motion.div>

          {/* Right Column - FAQ Items */}
          <motion.div 
            className="md:col-span-7"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 }
            }}
            transition={{ duration: 0.6 }}
          >
            <AnimatePresence>
              {faqs.map((faq, index) => (
                <motion.div
                  key={`faq-${index}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="mb-4"
                >
                  <div
                    className="border-t border-black dark:border-white pt-4 cursor-pointer"
                    onClick={() => toggleFaq(index)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-black dark:text-white">
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{
                          rotate: activeIndex === index ? 45 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-6 h-6 flex items-center justify-center text-black dark:text-white"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7 0V14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M0 7H14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={false}
                      animate={{
                        height: activeIndex === index ? 'auto' : 0,
                        opacity: activeIndex === index ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div 
                        ref={(el) => {
                          answerRefs.current[index] = el;
                        }}
                        className="py-4 text-black/70 dark:text-white/70 whitespace-normal break-words"
                        dangerouslySetInnerHTML={{
                          __html: faq.answer
                            .replace(/\n/g, '<br/>')
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-500 underline">$1</a>')
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default FAQs;

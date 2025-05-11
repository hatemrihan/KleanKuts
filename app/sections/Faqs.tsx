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
    question: "How do I care for my garments?",
    answer: "Most of our garments can be machine washed on a gentle cycle with cold water and similar colors. We recommend air drying to maintain the shape and quality of the fabrics. Detailed care instructions are included on each product's label.",
  },
  {
    question: "What is your shipping policy?",
    answer: "We offer free standard shipping on all orders over $100. Standard shipping typically takes 3-5 business days. Express shipping options are available at checkout for an additional fee. International shipping is available to select countries.",
  },
  {
    question: "Can I return or exchange items?",
    answer: "Yes, we accept returns and exchanges within 30 days of purchase for unworn items with original tags attached. Return shipping is free for exchanges, but a small fee applies for returns. Sale items are final sale and cannot be returned or exchanged.",
  },
  {
    question: "Do you offer size customization?",
    answer: "We currently don't offer custom sizing, but we're working on implementing this feature in the future. Our sizing chart provides detailed measurements to help you find the best fit. If you're between sizes, we generally recommend sizing up.",
  },
  {
    question: "How sustainable are your practices?",
    answer: "Sustainability is at the core of our brand. We use eco-friendly materials, minimize waste in our production process, use recyclable packaging, and partner with manufacturers who maintain fair labor practices. We're constantly working to improve our environmental impact.",
  },
  {
    question: "How this work?",
    answer:
      "Yet bed any for assistance indulgence unpleasing. Not thoughts all exercise blessing. Indulgence way everything joy alteration boisterous the attachment.",
  },
  {
    question: "Are there any additional fee?",
    answer:
      "Yet bed any for assistance indulgence unpleasing. Not thoughts all exercise blessing. Indulgence way everything joy alteration boisterous the attachment.",
  },
  {
    question: "How can I get the app?",
    answer:
      "Yet bed any for assistance indulgence unpleasing. Not thoughts all exercise blessing. Indulgence way everything joy alteration boisterous the attachment.",
  },
  {
    question: "What features do you offer and other not?",
    answer:
      "Yet bed any for assistance indulgence unpleasing. Not thoughts all exercise blessing. Indulgence way everything joy alteration boisterous the attachment.",
  },
];

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const answerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });

  useEffect(() => {
    // Measure heights of all answer elements
    const heights = answerRefs.current.map((ref) => ref?.scrollHeight || 0);
    setItemHeights(heights);
  }, []);

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
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
            <p className="text-gray-700 dark:text-white/70">
              Yet bed any for assistance indulgence unpleasing. Not thoughts all
              exercise blessing. Indulgence way everything joy alteration
              boisterous the attachment.
            </p>

            <motion.div
              className="mt-6"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <a
                href="#"
                className="text-black dark:text-white inline-flex items-center font-medium"
              >
                More FAQs
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
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
                  key={index}
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
                        height: activeIndex === index ? itemHeights[index] || 'auto' : 0,
                        opacity: activeIndex === index ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div 
                        ref={(el) => {
                          if (answerRefs.current) {
                            answerRefs.current[index] = el;
                          }
                        }}
                        className="py-4 text-black/70 dark:text-white/70"
                      >
                        {faq.answer}
                      </div>
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

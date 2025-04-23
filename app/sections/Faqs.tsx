"use client";
import { FC, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";


/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const faqs = [
  {
    question: "How can I make an exchange?",
    answer:
      "To exchange an item, the customer must return it to the courier while they are at the door and place a new order for the desired item.",
  },
  {
    question: "How can I make a return/refund?",
    answer:
      "Customers can try on items at the time of delivery while the courier is present. If unsatisfied, they must return the item immediately to the courier. Once the courier leaves, the sale is final—no returns, exchanges, or refunds will be accepted. Items must be undamaged and in original packaging for a valid return. By ordering, customers agree to these terms. For help, contact @kleankuts on Instagram.",
  },
  {
    question: "How do I know my size?",
    answer:
      "We provide detailed size guides for all our products. You can find measurement charts on each product page. For the most accurate fit, we recommend measuring yourself and comparing with our size chart. If you're between sizes, we suggest sizing up.",
  },
  {
    question: "How long do orders take to be delivered?",
    answer:
      "Standard delivery typically takes 3-7 days business days within the country. Express shipping options are available at checkout.",
  },
];

const FAQs: FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number|null>(null);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.section 
      className="section py-16 md:py-24" 
      id="faqs"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    > 
      <div className="container max-w-[1000px] mx-auto px-4">
        <div className="text-center mb-4">
          <motion.p 
            className="text-sm uppercase tracking-wider text-gray-600 mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            NEED HELP?
          </motion.p>
          <motion.h2 
            className="text-2xl md:text-3xl uppercase tracking-wide font-medium"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            FREQUENTLY ASKED QUESTIONS
          </motion.h2>
        </div>

        <motion.div className="mt-8 md:mt-12">
          {faqs.map(({question, answer}, faqIndex) => (
            <motion.div 
              key={question} 
              variants={itemVariants}
              className="border-t border-gray-200 last:border-b" 
              onClick={() => {
                if(faqIndex === selectedIndex){
                  setSelectedIndex(null);
                } else {
                  setSelectedIndex(faqIndex);
                }
              }}
            >
              <div className={twMerge(
                "flex items-center justify-between py-5 cursor-pointer",
                faqIndex === selectedIndex && 'font-medium'
              )}>
                <div className="text-base md:text-lg">{question}</div>
                <motion.div 
                  className="ml-4"
                  animate={{ 
                    rotate: faqIndex === selectedIndex ? 45 : 0 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </motion.div>
              </div>
              <AnimatePresence>
                {faqIndex === selectedIndex && (
                  <motion.div
                    className="overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: 'auto', 
                      opacity: 1,
                      transition: {
                        height: { duration: 0.3 },
                        opacity: { duration: 0.2 }
                      }
                    }}
                    exit={{ 
                      height: 0,
                      opacity: 0,
                      transition: {
                        height: { duration: 0.3 },
                        opacity: { duration: 0.1 }
                      }
                    }}
                  >
                    <motion.p 
                      className="text-gray-600 pb-5 text-base"
                      initial={{ y: 10 }}
                      animate={{ y: 0 }}
                      exit={{ y: -10 }}
                    >
                      {answer}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FAQs;

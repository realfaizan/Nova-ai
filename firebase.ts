import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Search, CheckCircle2, Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const ThinkingStatus = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1500); // Searching/Analyzing
    const timer2 = setTimeout(() => setStep(2), 3500); // Final touches
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const steps = [
    { text: 'Thinking', icon: Sparkles },
    { text: 'Searching & Analyzing', icon: Search },
    { text: 'Final touches', icon: CheckCircle2 }
  ];

  const currentStep = steps[step] || steps[0];
  const Icon = currentStep.icon;

  return (
    <div className="flex flex-col gap-2 py-2">
      <motion.div 
        key={step}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 text-purple-600 dark:text-purple-400 font-medium text-sm bg-white/40 dark:bg-gray-800/40 border border-white/40 dark:border-white/5 px-4 py-2.5 rounded-2xl w-fit shadow-sm"
      >
        <Icon size={16} className={step < 2 ? "animate-pulse" : ""} />
        <span>{currentStep.text}</span>
        {step < 2 && (
          <span className="flex items-center gap-0.5 ml-1">
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
          </span>
        )}
      </motion.div>
    </div>
  );
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isThinking = !isUser && !message.content;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="px-4 py-3 md:px-8 flex flex-col w-full group"
    >
      <div className={cn(
        "max-w-3xl w-full mx-auto flex",
        isUser ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "flex flex-col gap-2 w-full relative",
          isUser 
            ? "max-w-[85%] bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm border border-white/40 dark:border-white/5 text-gray-900 dark:text-gray-100 rounded-3xl rounded-tr-sm px-5 py-3" 
            : "text-gray-900 dark:text-gray-100 py-2"
        )}>
          {message.imageBase64 && (
            <div className="mt-1 mb-2">
              <img src={message.imageBase64} alt="Uploaded content" className="max-w-sm w-full h-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700" />
            </div>
          )}
          
          {isThinking ? (
            <ThinkingStatus />
          ) : (
            <>
              <div className={cn(
                "prose dark:prose-invert max-w-none break-words",
                isUser ? "prose-p:my-0" : "prose-p:my-1.5 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800"
              )}>
                <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
              </div>
              {!isUser && message.content && (
                <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

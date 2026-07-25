import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Zap, Brain, Code, X, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

export default function UpgradeModal({ isOpen, onClose, onUpgradeSuccess }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const features = [
    { icon: <Zap className="text-yellow-500" size={20} />, text: "Unlimited fast responses" },
    { icon: <Brain className="text-purple-500" size={20} />, text: "Access to Deep Thinking mode" },
    { icon: <Sparkles className="text-blue-500" size={20} />, text: "Deep Research capabilities" },
    { icon: <Code className="text-green-500" size={20} />, text: "Advanced Coding assistant" },
    { icon: <Check className="text-gray-500" size={20} />, text: "Priority access to new features" },
  ];

  const handleUpgrade = () => {
    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onUpgradeSuccess();
        onClose();
      }, 2000);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading && !isSuccess ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 dark:border-gray-700/50"
          >
            {!isLoading && !isSuccess && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full transition-colors z-10"
              >
                <X size={18} />
              </button>
            )}

            <div className="p-8">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                    <Check className="text-white" size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Payment Successful!
                  </h2>
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    You are now a Pro user.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="text-white" size={32} />
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Upgrade to Pro
                  </h2>
                  <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
                    Unlock the full power of Nova AI with advanced modes and unlimited access.
                  </p>

                  <div className="space-y-4 mb-8">
                    {features.map((feature, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        key={i}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          {feature.icon}
                        </div>
                        <span className="text-gray-700 dark:text-gray-200 font-medium">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/25 flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        Processing...
                      </>
                    ) : (
                      "Upgrade Now - $20/mo"
                    )}
                  </motion.button>
                  
                  <p className="text-center text-xs text-gray-400 mt-4">
                    Cancel anytime. Terms and conditions apply.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

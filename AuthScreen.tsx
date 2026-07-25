import React, { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, X, ChevronDown, Mic } from 'lucide-react';
import { cn } from './ChatMessage';

interface ChatInputProps {
  onSendMessage: (message: string, imageBase64?: string, mode?: string) => void;
  isLoading: boolean;
  activeMode: string;
  setActiveMode: (mode: string) => void;
  onOpenUpgrade: () => void;
}

export default function ChatInput({ onSendMessage, isLoading, activeMode, setActiveMode, onOpenUpgrade }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [showModes, setShowModes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modes = [
    { id: 'general', label: 'General', icon: '✨' },
    { id: 'deep-thinking', label: 'Deep Thinking', icon: '🧠', requiresPro: true },
    { id: 'deep-research', label: 'Deep Research', icon: '🔍', requiresPro: true },
    { id: 'coding', label: 'Coding', icon: '💻', requiresPro: false },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Voice recognition is not supported in this browser.");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Simple client-side compression by drawing to canvas
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setImageBase64(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || imageBase64) && !isLoading) {
      onSendMessage(input.trim(), imageBase64, activeMode);
      setInput('');
      setImageBase64(undefined);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentModeDetails = modes.find(m => m.id === activeMode) || modes[0];

  return (
    <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-t border-white/20 dark:border-gray-700/30 px-4 py-4 pb-6 md:px-8 flex-shrink-0">
      <div className="max-w-3xl mx-auto relative flex flex-col items-center">
        
        {/* Mode Selector */}
        <div className="relative mb-3 self-start">
          <button 
            onClick={() => setShowModes(!showModes)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-gray-800/50 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-gray-700/70 transition-colors border border-white/40 dark:border-white/5 shadow-sm"
          >
            <span>{currentModeDetails.icon}</span>
            <span>{currentModeDetails.label}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {showModes && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 dark:border-gray-700 overflow-hidden z-20 py-2">
              {modes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => {
                    if (mode.requiresPro) {
                      onOpenUpgrade();
                      setShowModes(false);
                    } else {
                      setActiveMode(mode.id);
                      setShowModes(false);
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{mode.icon}</span>
                    <span className={cn(
                      activeMode === mode.id ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                    )}>{mode.label}</span>
                  </div>
                  {mode.requiresPro && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-md">
                      Pro
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {imageBase64 && (
          <div className="mb-3 relative inline-block self-start">
            <div className="relative rounded-lg overflow-hidden border border-white/40 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
              <img src={imageBase64} alt="Upload preview" className="max-h-32 object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setImageBase64(undefined)}
              className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-sm hover:bg-gray-800"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="relative w-full flex items-end rounded-[32px] bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-sm border border-white/40 dark:border-white/10 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/30"
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="absolute left-3 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Upload image"
            >
              <ImagePlus size={20} />
            </button>
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading}
              className={cn(
                "p-2 rounded-full transition-colors",
                isRecording 
                  ? "text-red-500 bg-red-100 dark:bg-red-900/30 animate-pulse" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-gray-100 dark:hover:bg-gray-700"
              )}
              title="Voice input"
            >
              <Mic size={20} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            className="w-full max-h-[200px] py-4 pl-[88px] pr-14 bg-transparent border-none focus:ring-0 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 outline-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !imageBase64) || isLoading}
            className={cn(
              "absolute right-3 bottom-2 p-2 rounded-full transition-colors flex items-center justify-center",
              (input.trim() || imageBase64) && !isLoading
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                : "bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-center mt-3 text-xs text-gray-500 dark:text-gray-400">
          Nova AI can make mistakes. Consider verifying important information.
        </div>
      </div>
    </div>
  );
}

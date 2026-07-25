import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import AuthScreen from './components/AuthScreen';
import UpgradeModal from './components/UpgradeModal';
import { Message } from './types';
import { Menu, Sparkles, X, Bot } from 'lucide-react';
import { auth, db } from './lib/firebase';
import logoUrl from './assets/images/ai_assistant_logo_1783417760234.jpg';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { AnimatePresence } from 'motion/react';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('general');

  // To keep track of messages for each chat
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (!currentUser) {
        setChats([]);
        setMessagesByChat({});
        setActiveChatId(null);
        setIsAdminOpen(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsLoadingChats(true);
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a: any, b: any) => {
        const aTime = a.updatedAt?.toMillis() || 0;
        const bTime = b.updatedAt?.toMillis() || 0;
        return bTime - aTime;
      });
      setChats(fetchedChats);
      setIsLoadingChats(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    const q = query(
      collection(db, `chats/${activeChatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        role: doc.data().role,
        content: doc.data().content,
        imageBase64: doc.data().imageBase64,
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Message[];
      setMessagesByChat(prev => ({
        ...prev,
        [activeChatId]: fetchedMessages
      }));
    });

    return unsubscribe;
  }, [activeChatId]);

  const currentMessages = activeChatId ? messagesByChat[activeChatId] || [] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleNewChat = () => {
    setActiveChatId(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteDoc(doc(db, 'chats', chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat');
    }
  };

  const handleSendMessage = async (content: string, imageBase64?: string) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Check limits
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const today = new Date().toISOString().split('T')[0];
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.isPro) {
          if (userData.lastMessageDate === today) {
            if (userData.dailyCount >= 10) {
              setIsUpgradeModalOpen(true);
              setIsLoading(false);
              return;
            }
            await updateDoc(userRef, { dailyCount: userData.dailyCount + 1, isAdmin: user.email === 'kojvhy@gmail.com' });
          } else {
            await updateDoc(userRef, { dailyCount: 1, lastMessageDate: today, isAdmin: user.email === 'kojvhy@gmail.com' });
          }
        }
      } else {
        await setDoc(userRef, { dailyCount: 1, lastMessageDate: today, isPro: false, isAdmin: user.email === 'kojvhy@gmail.com' });
      }

      let currentChatId = activeChatId;

      if (!currentChatId) {
        const chatRef = await addDoc(collection(db, 'chats'), {
          userId: user.uid,
          title: content.slice(0, 40) || 'Image Chat',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        currentChatId = chatRef.id;
        setActiveChatId(currentChatId);
      } else {
        await updateDoc(doc(db, 'chats', currentChatId), {
          updatedAt: serverTimestamp(),
        });
      }

      const userMsgData: any = {
        role: 'user',
        content,
        timestamp: serverTimestamp(),
      };
      if (imageBase64) {
        userMsgData.imageBase64 = imageBase64;
      }
      
      await addDoc(collection(db, `chats/${currentChatId}/messages`), userMsgData);

      const historyToSent = [...(messagesByChat[currentChatId as string] || []), { id: 'temp', role: 'user', content, imageBase64, timestamp: new Date() } as Message].map(msg => ({
        role: msg.role,
        content: msg.content,
        imageBase64: msg.imageBase64
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: historyToSent,
          mode: activeMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';

      const tempModelMessageId = (Date.now() + 1).toString();
      
      setMessagesByChat(prev => {
        const currentChatMessages = prev[currentChatId as string] || [];
        return {
          ...prev,
          [currentChatId as string]: [
            ...currentChatMessages,
            { id: tempModelMessageId, role: 'model', content: '', timestamp: new Date() }
          ]
        };
      });

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (data.error) {
                    accumulatedContent += `\n\n**Error:** ${data.error}`;
                  } else if (data.text) {
                    accumulatedContent += data.text;
                  }
                  
                  setMessagesByChat(prev => {
                    const currentChatMessages = prev[currentChatId as string] || [];
                    const newMessages = [...currentChatMessages];
                    const idx = newMessages.findIndex(m => m.id === tempModelMessageId);
                    if (idx !== -1) {
                      newMessages[idx].content = accumulatedContent;
                    }
                    return {
                      ...prev,
                      [currentChatId as string]: newMessages
                    };
                  });
                } catch (e) {
                  console.error('Error parsing SSE data:', e, dataStr);
                }
              }
            }
          }
        }
      }

      await addDoc(collection(db, `chats/${currentChatId}/messages`), {
        role: 'model',
        content: accumulatedContent,
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      console.error('Chat error:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Bot size={48} className="text-blue-600 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 bg-animated-gradient">
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgradeSuccess={async () => {
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { isPro: true });
            // Let the user know they are pro now, or just let the modal show the success screen
          }
        }}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={(id) => {
            setActiveChatId(id);
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }}
          onNewChat={handleNewChat}
          onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onDeleteChat={handleDeleteChat}
          userEmail={user.email}
          isLoadingChats={isLoadingChats}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0">
        {isAdminOpen ? (
          <AdminDashboard onClose={() => setIsAdminOpen(false)} />
        ) : (
          <>
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-b border-white/20 dark:border-gray-700/30 z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <Menu size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-purple-500/30">
                    <img src={logoUrl} alt="Nova AI" className="w-full h-full object-cover" />
                  </div>
                  <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                    Nova <span className="text-gray-400 text-sm font-normal">AI</span>
                  </h1>
                </div>
              </div>
              
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-purple-600 dark:text-purple-400 rounded-full transition-colors text-sm font-medium"
              >
                <Sparkles size={14} />
                <span>Upgrade</span>
              </button>
            </header>

            {/* Main Chat Area */}
            <main className="flex-1 overflow-y-auto">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto">
                  <h2 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-blue-600 via-purple-500 to-red-400 bg-clip-text text-transparent mb-2 mt-4">
                    Hello, {user.displayName ? user.displayName.split(' ')[0] : 'there'}
                  </h2>
                  <p className="text-gray-400 dark:text-gray-500 text-4xl md:text-5xl font-medium">
                    How can I help you today?
                  </p>
                </div>
              ) : (
                <div className="pb-4">
                  <AnimatePresence initial={false}>
                    {currentMessages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </main>

            {/* Input Area */}
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
              activeMode={activeMode}
              setActiveMode={setActiveMode}
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
            />
          </>
        )}
      </div>
    </div>
  );
}

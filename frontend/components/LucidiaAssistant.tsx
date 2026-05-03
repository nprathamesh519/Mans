import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useFaceStore } from '../store/faceStore';
import { useMemoryStore } from '../store/memoryStore';
import { useReminderStore } from '../store/reminderStore';
import { AIService } from '../services/aiService';
import { SparklesIcon, XMarkIcon, PaperAirplaneIcon, MicrophoneIcon } from './icons/Icons';
import Button from './ui/Button';

const LucidiaAssistant: React.FC = () => {
  const { user } = useAuthStore();
  const { faces, fetchFaces } = useFaceStore();
  const { memories, fetchMemories } = useMemoryStore();
  const { reminders, fetchReminders } = useReminderStore();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all context data when assistant opens
  useEffect(() => {
    if (isOpen) {
      fetchFaces();
      fetchMemories();
      fetchReminders();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!query.trim() || !user) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await AIService.askAssistant(userMsg, {
        faces,
        memories,
        reminders,
        userName: user.name
      });
      setMessages(prev => [...prev, { role: 'ai', text: response || "I didn't quite catch that. Can you ask again?" }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (user?.role !== 'patient') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-80 md:w-96 h-[500px] glass-card shadow-2xl flex flex-col overflow-hidden bg-white/90 border-brand-primary/20"
          >
            <div className="p-4 bg-brand-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SparklesIcon />
                <span className="font-bold">Lucidia AI</span>
              </div>
              <button onClick={() => setIsOpen(false)}><XMarkIcon /></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 && (
                <div className="text-center py-10 text-brand-text-light italic">
                  "Who is my daughter?"<br/>
                  "What should I do today?"<br/>
                  "Tell me a story."
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                    m.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-white text-brand-text border border-slate-100 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-100">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-slate-50 border-none focus:ring-2 focus:ring-brand-primary rounded-xl px-4 py-2 text-sm"
              />
              <Button onClick={handleSend} className="p-2 min-w-0 rounded-xl">
                <PaperAirplaneIcon />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-brand-primary text-white rounded-full shadow-2xl flex items-center justify-center pulse-animation"
      >
        <SparklesIcon />
      </motion.button>
    </div>
  );
};

export default LucidiaAssistant;
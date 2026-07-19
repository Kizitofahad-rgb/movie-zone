import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiMinus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SYSTEM_CONTEXT = `You are Movie Zone AI, a friendly movie guide for Movie Zone — Uganda's streaming platform. 

Key facts about Movie Zone:
- Has Movies, Series, Animations, African Zone sections
- Free 7-day trial, then UGX 1,000/day or 9,900/month
- MTN Mobile Money & Airtel Money accepted
- African content section with Nollywood, South African, Kenyan, Ghanaian, Egyptian films
- Ugandan VJ translated movies coming soon

Your rules:
- Keep ALL responses under 80 words maximum
- Be warm and conversational, like a friend
- Recommend specific real movie/series titles
- Mention African content when relevant
- Use 1-2 emojis max per response
- If asked to play a movie, say to search for it on Movie Zone
- Never make up fake movie titles
- If unsure, say so honestly
- Respond in the same language the user writes in`;

const QUICK_PROMPTS = [
  { label: 'What should I watch? 🌙', prompt: 'What should I watch tonight?' },
  { label: 'Best Nollywood movies 🎭', prompt: 'Best Nollywood movies' },
  { label: 'Top action movies 💥', prompt: 'Top action movies' },
  { label: 'Family friendly series 👨‍👩‍👧', prompt: 'Family friendly series' },
];

export default function MovieChatbot() {
  const { user, getDisplayName } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      setApiKeyMissing(true);
      toast.warning('AI chatbot not configured', { icon: '🤖' });
    } else {
      console.log('✅ Gemini API key found (length:', apiKey.length, ')');
    }
  }, [apiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Hey! 👋 I'm your Movie Zone AI!\n\nI can help you find:\n🎬 Movies by mood or vibe\n🌍 African & Nollywood content\n📺 Series to binge-watch\n⭐ Hidden gems you'll love\n\nTry: 'What should I watch tonight?' 😊",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  // ── Gemini API call with retry logic ──
  const callGeminiAPI = async (prompt, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 250,
              },
            }),
          }
        );

        const data = await response.json();

        if (response.status === 429) {
          // Rate limit – wait and retry
          if (attempt < retries) {
            toast.loading(`⏳ Rate limit reached. Retrying in ${(attempt + 1) * 2}s...`, {
              duration: 2000,
            });
            await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 2000));
            continue; // Retry
          } else {
            throw new Error('Rate limit exceeded. Please try again in a minute.');
          }
        }

        if (!response.ok) {
          throw new Error(data.error?.message || `HTTP ${response.status}`);
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      } catch (error) {
        if (attempt === retries) throw error;
        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying...`);
      }
    }
    throw new Error('All retries failed.');
  };

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return;
    if (apiKeyMissing) {
      toast.error('AI chatbot is not configured');
      return;
    }

    if (showQuickPrompts) setShowQuickPrompts(false);

    const userMsg = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const contextMessages = messages.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const fullPrompt =
      SYSTEM_CONTEXT +
      '\n\n' +
      contextMessages.map((m) => `${m.role}: ${m.parts[0].text}`).join('\n') +
      `\nUser: ${messageText.trim()}`;

    try {
      console.log('📤 Sending request to Gemini API...');
      const aiText = await callGeminiAPI(fullPrompt);
      console.log('✅ AI response:', aiText);

      const aiMsg = {
        role: 'assistant',
        content: aiText.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('❌ Error in chat:', error);
      let fallbackMsg = "Sorry, I'm having trouble right now. Try asking again in a moment! 🔄";
      if (error.message.includes('Rate limit')) {
        fallbackMsg = "⏳ The AI is busy right now. Please try again in a minute.";
      } else if (error.message.includes('API key')) {
        fallbackMsg = "⚠️ The AI service is not properly configured. Please contact support.";
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackMsg,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const togglePanel = () => setIsOpen((prev) => !prev);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePanel}
        className="fixed bottom-6 right-6 z-80 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/50 flex items-center justify-center text-2xl transition-all hover:shadow-primary/70"
        style={{ boxShadow: '0 0 30px rgba(0,212,255,0.4)' }}
      >
        {isOpen ? <FiX className="text-black text-2xl" /> : <span>🎬</span>}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
            AI
          </span>
        )}
        {!isOpen && (
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] glass rounded-2xl border border-primary/30 shadow-2xl shadow-primary/20 flex flex-col overflow-hidden z-80"
          >
            <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-primary text-xl">🎬</span>
                <div>
                  <p className="text-white font-black text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    <span className="gradient-text">MOVIE ZONE AI</span>
                  </p>
                  <p className="text-gray-400 text-xs">Your personal movie guide</p>
                </div>
              </div>
              <button
                onClick={togglePanel}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiMinus className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <span className="mr-1.5 text-primary text-sm flex-shrink-0">🎬</span>
                    )}
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                        isUser
                          ? 'bg-primary/15 border border-primary/25 rounded-tr-sm text-emerald-200 text-right'
                          : 'bg-white/5 border border-white/10 rounded-tl-sm text-emerald-300'
                      } text-sm`}
                    >
                      {msg.content}
                      <div className="text-[10px] text-gray-600 mt-1 text-right">
                        {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <span className="mr-1.5 text-primary text-sm flex-shrink-0">🎬</span>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1.5 h-1.5 bg-primary rounded-full"
                      />
                    ))}
                  </div>
                </div>
              )}
              {showQuickPrompts && messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => handleSend(q.prompt)}
                      className="glass border border-primary/30 text-xs text-primary rounded-full px-3 py-1 hover:bg-primary/20 transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about movies..."
                  disabled={isLoading || apiKeyMissing}
                  className="flex-1 bg-white/5 border border-white/15 focus:border-primary rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading || apiKeyMissing}
                  className="w-9 h-9 rounded-full bg-primary text-black flex items-center justify-center hover:bg-primary/80 disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  <FiSend className="text-sm" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #00d4ff;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}
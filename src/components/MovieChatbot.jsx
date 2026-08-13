import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiMinus, FiTrash2, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SYSTEM_PROMPT = `You are Movie Zone AI, a friendly movie guide for Movie Zone — Uganda's streaming platform.

Key facts:
- Has Movies, Series, Animations, African Zone sections
- Free 7-day trial, then UGX 1,000/day or 9,900/month
- MTN Mobile Money and Airtel Money accepted
- African content: Nollywood, South African, Kenyan, Ghanaian, Egyptian films
- Ugandan VJ translated movies coming soon

Rules:
- Keep ALL responses under 80 words maximum
- Be warm and friendly like a knowledgeable friend
- Recommend specific REAL movie and series titles
- Mention African content when relevant
- Use 1-2 emojis max per response
- If asked to play a movie, say to search for it on Movie Zone
- Never make up fake movie titles
- Respond in the same language the user writes in
- Never mention piracy or illegal streaming`;

const QUICK_PROMPTS = [
  { label: 'What should I watch? 🌙', prompt: 'What should I watch tonight?' },
  { label: 'Best Nollywood movies 🎭', prompt: 'Best Nollywood movies' },
  { label: 'Top action movies 💥', prompt: 'Top action movies' },
  { label: 'Family friendly series 👨‍👩‍👧', prompt: 'Family friendly series' },
];

const WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    "Hey! 👋 I'm your Movie Zone AI!\n\nI can help you find:\n🎬 Movies by mood or vibe\n🌍 African & Nollywood content\n📺 Series to binge-watch\n⭐ Hidden gems you'll love\n\nTry: 'What should I watch tonight?' 😊",
  timestamp: new Date(),
};

export default function MovieChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const apiKeyMissing = !apiKey;

  useEffect(() => {
    if (apiKeyMissing) {
      setIsDisabled(true);
      toast.error('AI not configured', { id: 'groq-config' });
    } else {
      setIsDisabled(false);
      console.log('✅ Groq API key found (length:', apiKey.length, ')');
    }
  }, [apiKey, apiKeyMissing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([WELCOME_MESSAGE]);
    }
  }, [isOpen, messages.length]);

  const callGroqAPI = async (conversationHistory) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 200,
        stream: false,
      }),
    });

    const data = await response.json();

    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }

    if (response.status === 401) {
      setIsDisabled(true);
      throw new Error('AUTH_ERROR');
    }

    if (!response.ok) {
      throw new Error(data.error?.message || 'UNKNOWN_ERROR');
    }

    return data.choices?.[0]?.message?.content || 'Something went wrong 😅';
  };

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || isLoading || isDisabled) return;

    if (showQuickPrompts) setShowQuickPrompts(false);

    const userContent = messageText.trim();
    const userMsg = {
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const recentHistory = messages.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    const conversation = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory,
      { role: 'user', content: userContent },
    ];

    try {
      const aiText = await callGroqAPI(conversation);
      const aiMsg = {
        role: 'assistant',
        content: aiText.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      let fallbackMsg = 'Something went wrong 😅';

      if (error.message === 'RATE_LIMIT') {
        fallbackMsg = 'Too many messages! Wait a moment ⏰';
        toast.error('Too many messages! Wait a moment ⏰');
      } else if (error.message === 'AUTH_ERROR') {
        fallbackMsg = 'AI not configured';
        toast.error('AI not configured');
      } else if (error.message === 'Failed to fetch') {
        fallbackMsg = 'Connection issue, try again 🔄';
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

  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowQuickPrompts(true);
    setInput('');
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied!');
    } catch {
      toast.error('Copy failed');
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
        className="fixed bottom-6 right-6 z-[80] w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/50 flex items-center justify-center text-2xl transition-all hover:shadow-primary/70"
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
            // ─── Background changed to solid black ───
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-black rounded-2xl border border-primary/30 shadow-2xl shadow-primary/20 flex flex-col overflow-hidden z-[80]"
          >
            {/* Header – removed gradient to keep black background */}
            <div className="flex items-center justify-between p-4 border-b border-primary/20">
              <div className="flex items-center gap-2">
                <span className="text-primary text-xl">🎬</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-black text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      <span className="gradient-text">MOVIE ZONE AI</span>
                    </p>
                    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${apiKeyMissing ? 'bg-red-500' : 'bg-emerald-400'} ${!apiKeyMissing ? 'animate-pulse' : ''}`} />
                  </div>
                  <p className="text-gray-400 text-xs">Your personal movie guide</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="Clear chat"
                >
                  <FiTrash2 className="text-sm" />
                </button>
                <button
                  onClick={togglePanel}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiMinus className="text-xl" />
                </button>
              </div>
            </div>

            {/* Messages area – inherits black background */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <span className="mr-1.5 text-primary text-sm flex-shrink-0">🎬</span>
                    )}
                    <div className="relative group max-w-[85%]">
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.content)}
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 border border-primary/30 rounded-full p-1.5 text-primary"
                          title="Copy message"
                        >
                          <FiCopy className="text-xs" />
                        </button>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
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

            {/* Input area – no extra background, inherits black */}
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about movies..."
                  disabled={isLoading || isDisabled}
                  className="flex-1 bg-white/5 border border-white/15 focus:border-primary rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading || isDisabled}
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
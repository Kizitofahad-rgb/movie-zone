import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const SYSTEM_PROMPT = `You are Movie Zone's payment verification assistant helping the admin (Kizito Fahad) verify MTN Mobile Money payments. You have access to the pending payments list. Help the admin verify transaction IDs quickly. Be concise and professional. When asked about a payment, guide the admin to check their MTN MoMo statement or dial *165*3# to check recent transactions. If the admin says a payment is confirmed, remind them to click Approve in the table. Keep responses under 60 words.`;

export default function AdminAIAssistant({ onShowPending, onBulkApprove, onSummary }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [oldestTimeAgo, setOldestTimeAgo] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Only show assistant for admin (safety)
    if (!user) return;
    // fetch pending count & oldest
    (async function fetchPending() {
      try {
        const { data, error } = await supabase
          .from('payment_requests')
          .select('id, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(1);

        const { data: allData } = await supabase
          .from('payment_requests')
          .select('id')
          .eq('status', 'pending');

        setPendingCount(allData?.length || 0);
        if (data && data.length > 0) {
          const oldest = new Date(data[0].created_at);
          const diffMs = Date.now() - oldest.getTime();
          const mins = Math.floor(diffMs / 60000);
          setOldestTimeAgo(mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} hrs ago`);
        }
      } catch (err) {
        console.error('Failed to fetch pending for AI assistant', err);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `You have ${pendingCount} pending payments waiting. Oldest is from ${oldestTimeAgo || 'some time ago'}. Shall I help you verify them?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, pendingCount, oldestTimeAgo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callGeminiAPI = async (prompt) => {
    const apiKey = import.meta.env.VITE_GROK_API_KEY;
    if (!apiKey) throw new Error('AUTH_ERROR');

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 160 },
    };

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (resp.status === 429) throw new Error('RATE_LIMIT');
    if (resp.status === 401) throw new Error('AUTH_ERROR');

    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const conversation = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text.trim() },
      ];

      const promptText = conversation.map((c) => `${c.role}: ${c.content}`).join('\n');
      const ai = await callGeminiAPI(promptText);
      setMessages((m) => [...m, { role: 'assistant', content: ai, timestamp: new Date() }]);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        toast.error('Too many messages! Wait a moment ⏰');
        setMessages((m) => [...m, { role: 'assistant', content: 'Too many messages — try again in a minute.', timestamp: new Date() }]);
      } else if (err.message === 'AUTH_ERROR') {
        toast.error('AI not configured');
        setMessages((m) => [...m, { role: 'assistant', content: 'AI is not configured (missing API key).', timestamp: new Date() }]);
      } else {
        console.error(err);
        setMessages((m) => [...m, { role: 'assistant', content: 'Connection issue, try again 🔄', timestamp: new Date() }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((s) => !s)}
        className="fixed bottom-6 right-24 z-[90] w-12 h-12 rounded-full bg-gold shadow-lg flex items-center justify-center text-black text-xl"
      >
        🤖
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[460px] glass rounded-2xl border border-primary/30 shadow-2xl z-[99] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-gradient-to-r from-primary/8 to-transparent">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <p className="text-white font-bold">Payment AI Assistant</p>
                </div>
                <p className="text-xs text-gray-400">Context-aware payment help</p>
              </div>

              <div className="flex items-center gap-2">
                <button title="Refresh" onClick={() => { setMessages([]); toast.success('Assistant refreshed'); }} className="text-gray-300 hover:text-white"><FiRefreshCw /></button>
                <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white"><FiX /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`p-2 rounded-xl ${m.role === 'assistant' ? 'bg-white/5 text-emerald-300' : 'bg-primary/10 text-right text-emerald-200'}`}>
                  {m.content}
                  <div className="text-[10px] text-gray-500 mt-1 text-right">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-gray-400 text-sm">No messages yet — ask me about a transaction ID or click a quick action.</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2 mb-2">
                <button onClick={() => { onShowPending && onShowPending(); setIsOpen(false); }} className="flex-1 px-3 py-2 bg-black/40 text-white rounded">📋 Show All Pending</button>
                <button onClick={() => onBulkApprove && onBulkApprove()} className="px-3 py-2 bg-green-500 text-black rounded">✅ Bulk Approve</button>
              </div>
              <div className="flex gap-2 items-center">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type transaction ID or question" className="flex-1 bg-white/5 rounded-full px-3 py-2 text-sm text-white outline-none" />
                <button onClick={() => handleSend()} disabled={isLoading} className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center"> <FiSend /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-thumb{background:#00d4ff;border-radius:10px}`}</style>
    </>
  );
}

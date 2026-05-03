import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AlertCircle, ChevronRight, Loader2, MessageSquare } from 'lucide-react';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
}

interface LegalChatbotProps {
  title?: string;
  initialMessage: string;
  context: string;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export default function LegalChatbot({
  title = 'AI Legal Assistant',
  initialMessage,
  context,
  placeholder = 'Ask AI a legal question...',
  suggestions = [],
  className = '',
}: LegalChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', content: initialMessage },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const sendMessage = async (messageText?: string) => {
    const trimmedMessage = (messageText ?? input).trim();
    if (!trimmedMessage || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput('');
    setError(null);

    if (!ai) {
      setError('AI assistant is not configured. Add a GEMINI_API_KEY to enable chat responses.');
      return;
    }

    setIsSending(true);

    try {
      const conversation = [...messages, userMessage]
        .slice(-8)
        .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are IntelliLaw's legal AI assistant for Pakistan law.
Context: ${context}

Conversation:
${conversation}

Respond with clear, practical legal information. If the question asks for a legal decision, explain that the user should confirm with a qualified legal professional. Keep the response concise and avoid asking for sensitive personal information.`,
      });

      const reply = response.text?.trim() || 'I could not generate a response right now. Please try again.';

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: reply,
        },
      ]);
    } catch (err) {
      console.error('Legal chatbot error:', err);
      setError('Failed to get an AI response. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className={`card flex flex-col h-[500px] ${className}`}>
      <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-neutral-900">{title}</h4>
          <p className="text-[10px] text-success font-bold uppercase tracking-widest">Online</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[88%] ${
              message.role === 'user'
                ? 'bg-primary-600 rounded-tr-none text-white ml-auto'
                : 'bg-neutral-100 rounded-tl-none text-neutral-700'
            }`}
          >
            {message.content}
          </div>
        ))}

        {isSending && (
          <div className="bg-neutral-100 p-3 rounded-2xl rounded-tl-none text-sm text-neutral-700 max-w-[88%] flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            Thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => sendMessage(suggestion)}
              disabled={isSending}
              className="px-3 py-1.5 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-all disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mb-3 p-3 bg-error/10 border border-error/20 rounded-xl flex items-start gap-2 text-error text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-neutral-100 border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            aria-label="Send message"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

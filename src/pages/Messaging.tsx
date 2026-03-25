import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Smile, 
  CheckCheck,
  User,
  Clock,
  Circle
} from 'lucide-react';

export default function Messaging() {
  const [activeChat, setActiveChat] = useState(1);

  const chats = [
    {
      id: 1,
      name: 'Ahmed Ali',
      role: 'Client',
      lastMessage: 'Thank you, Abdullah. I will review the documents.',
      time: '2m ago',
      unread: 2,
      online: true,
      avatar: 'A'
    },
    {
      id: 2,
      name: 'Adv. Sarah Khan',
      role: 'Associate',
      lastMessage: 'The hearing has been adjourned to next week.',
      time: '1h ago',
      unread: 0,
      online: false,
      avatar: 'S'
    },
    {
      id: 3,
      name: 'Zubair Ahmed',
      role: 'Assistant',
      lastMessage: 'I have uploaded the research report for case #12.',
      time: '3h ago',
      unread: 0,
      online: true,
      avatar: 'Z'
    }
  ];

  const messages = [
    { id: 1, senderId: 2, text: 'Hello Abdullah, have you seen the latest court order?', time: '10:00 AM', isMe: false },
    { id: 2, senderId: 1, text: 'Yes, I just reviewed it. We need to file a rebuttal by Friday.', time: '10:05 AM', isMe: true },
    { id: 3, senderId: 2, text: 'I will start drafting it right away. Do we have the witness statements?', time: '10:10 AM', isMe: false },
    { id: 4, senderId: 1, text: 'Zubair is collecting them. They should be ready by tomorrow morning.', time: '10:15 AM', isMe: true },
  ];

  return (
    <div className="h-[calc(100vh-var(--topbar-height)-4rem)] flex gap-8 animate-in fade-in duration-500">
      {/* Sidebar: Chat List */}
      <div className="w-80 flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900">Messages</h2>
            <button className="p-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-all">
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full p-4 flex gap-4 transition-all hover:bg-neutral-50 border-b border-neutral-50 ${
                activeChat === chat.id ? "bg-primary-50/50 border-r-4 border-r-primary-600" : ""
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-sm">
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-neutral-900 truncate">{chat.name}</h3>
                  <span className="text-[10px] text-neutral-400 font-bold">{chat.time}</span>
                </div>
                <p className="text-xs text-neutral-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-sm">
              {chats.find(c => c.id === activeChat)?.avatar}
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">{chats.find(c => c.id === activeChat)?.name}</h3>
              <div className="flex items-center gap-1.5">
                <Circle className={`w-2 h-2 fill-current ${chats.find(c => c.id === activeChat)?.online ? "text-success" : "text-neutral-300"}`} />
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                  {chats.find(c => c.id === activeChat)?.online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-neutral-50/20">
          <div className="flex justify-center">
            <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Today</span>
          </div>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] space-y-1 ${msg.isMe ? "items-end" : "items-start"}`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.isMe 
                    ? "bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-500/10" 
                    : "bg-white text-neutral-700 rounded-tl-none border border-neutral-100 shadow-sm"
                }`}>
                  {msg.text}
                </div>
                <div className={`flex items-center gap-2 px-1 ${msg.isMe ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-neutral-400 font-bold">{msg.time}</span>
                  {msg.isMe && <CheckCheck className="w-3 h-3 text-primary-600" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-4 bg-neutral-50 p-2 rounded-2xl border border-neutral-200 focus-within:border-primary-400 transition-all">
            <button className="p-2 text-neutral-400 hover:text-primary-600 transition-all">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 bg-transparent border-none outline-none text-sm py-2"
            />
            <button className="p-2 text-neutral-400 hover:text-primary-600 transition-all">
              <Smile className="w-5 h-5" />
            </button>
            <button className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

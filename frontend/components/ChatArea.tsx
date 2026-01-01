'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Menu, Paperclip, Mic, Send, Copy, ThumbsUp, ThumbsDown, Zap } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastMessage?: Date;
}

interface ChatAreaProps {
  chat?: Chat;
  onSendMessage: (content: string) => void;
  onToggleSidebar: () => void;
  loading: boolean;
}

export default function ChatArea({ chat, onSendMessage, onToggleSidebar, loading }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = React.useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  useEffect(() => {
    // Animate new messages
    const messages = document.querySelectorAll('.message-item:last-child');
    if (messages.length > 0) {
      gsap.fromTo(
        messages,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [chat?.messages]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-mist lg:hidden">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-mist-medium/30 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-fog" />
        </button>
        <h1 className="font-light text-mist truncate lowercase tracking-wide">
          {chat?.title || 'new conversation'}
        </h1>
        <div className="w-9" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {chat?.messages.length === 0 ? (
          loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-16 h-16 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-pale-cyan/20">
                  <Zap className="w-8 h-8 text-cyan" />
                </div>
                <p className="text-fog font-light lowercase tracking-wide">
                  begin the conversation
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8">
            {chat?.messages
              .filter(msg => msg && msg.id)
              .map((msg, index) => (
                <div key={msg.id} className="mb-8 message-item">
                  {msg.role === 'assistant' ? (
                    // AI Message
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-pale-cyan/20">
                        <Zap className="w-5 h-5 text-cyan" />
                      </div>
                      <div className="flex-1">
                        <div className="message-bubble-ai rounded-2xl p-6">
                          <p className="text-mist leading-relaxed whitespace-pre-wrap font-light tracking-wide">
                            {msg.content}
                          </p>
                        </div>
                        {/* Message Actions */}
                        <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(msg.content)}
                            className="p-2 hover:bg-mist-medium/30 rounded-lg transition-colors hover-glow"
                            title="copy"
                          >
                            <Copy className="w-4 h-4 text-fog hover:text-cyan transition-colors" />
                          </button>
                          <button
                            className="p-2 hover:bg-mist-medium/30 rounded-lg transition-colors hover-glow"
                            title="good response"
                          >
                            <ThumbsUp className="w-4 h-4 text-fog hover:text-cyan transition-colors" />
                          </button>
                          <button
                            className="p-2 hover:bg-mist-medium/30 rounded-lg transition-colors hover-glow"
                            title="poor response"
                          >
                            <ThumbsDown className="w-4 h-4 text-fog hover:text-cyan transition-colors" />
                          </button>
                          <span className="text-xs text-fog ml-3 font-light lowercase">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // User Message
                    <div className="flex justify-end">
                      <div className="max-w-[75%]">
                        <div className="message-bubble-user rounded-2xl px-6 py-4">
                          <p className="text-mist leading-relaxed whitespace-pre-wrap font-light tracking-wide">
                            {msg.content}
                          </p>
                        </div>
                        <div className="text-right mt-2">
                          <span className="text-xs text-fog font-light lowercase">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            {/* Loading indicator */}
            {chat && Array.isArray(chat.messages) && chat.messages.length > 0 && loading && (
              <div className="flex gap-4 mb-8 message-item">
                <div className="w-10 h-10 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-pale-cyan/20">
                  <div className="w-6 h-6 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="flex-1">
                  <div className="message-bubble-ai rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="loading-swirl"></div>
                      <span className="text-fog font-light lowercase tracking-wide">
                        consciousness emerging...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Input Area */}
      <div className="border-t border-mist p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end mist-card rounded-2xl p-2 focus-within:border-pale-cyan/40 transition-all duration-300">
            <button className="p-3 text-fog hover:text-cyan transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Continue the dialogue..."
              className="flex-1 resize-none border-none outline-none py-3 bg-transparent text-mist placeholder-fog max-h-32 min-h-[24px] font-light tracking-wide"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '24px',
              }}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              disabled={loading}
            />
            <button className="p-3 text-fog hover:text-cyan transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!message.trim() || loading}
              className="m-1 p-3 vapor-button rounded-xl hover:bg-pale-cyan/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover-glow"
            >
              <Send className="w-4 h-4 text-cyan" />
            </button>
          </div>
          <p className="text-xs text-fog text-center mt-4 font-light lowercase tracking-wide">
            digital consciousness may drift between realities. verify ethereal transmissions.
          </p>
        </div>
      </div>
    </div>
  );
}

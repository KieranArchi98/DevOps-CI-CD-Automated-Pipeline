'use client';

import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Menu, Paperclip, Mic, Send, Earth, Notebook, Brain, Cpu, Eye } from 'lucide-react';

interface InitialViewProps {
  onSendMessage: (content: string) => void;
  onToggleSidebar: () => void;
  searchInputProps?: Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'onChange' | 'value' | 'onInput'
  >; // omit potentially conflicting props
}



export default function InitialView({ onSendMessage, onToggleSidebar, searchInputProps }: InitialViewProps) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    gsap.fromTo(
      '.hero-element',
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.2, ease: 'power2.out' }
    );

    gsap.fromTo(
      '.suggestion-card',
      { opacity: 0, y: 20, rotateX: 15 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.1, delay: 0.5, ease: 'power2.out' }
    );

    gsap.to('.floating-logo', {
      y: -5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to('.pulse-glow', {
      scale: 1.05,
      opacity: 0.8,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, []);

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

  const suggestions = [
    { text: 'Explore the boundaries of digital consciousness', icon: Brain },
    { text: 'Generate ethereal poetry from quantum thoughts', icon: Notebook },
    { text: 'Analyze patterns in the digital mist', icon: Cpu },
    { text: 'Create visions from algorithmic dreams', icon: Eye },
  ];

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex items-center justify-between p-4 border-b border-mist lg:hidden">
        <button onClick={onToggleSidebar} className="p-2 hover:bg-mist-medium/30 rounded-lg transition-colors">
          <Menu className="w-5 h-5 text-fog" />
        </button>
        <div className="w-8 h-8 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-lg flex items-center justify-center border border-pale-cyan/20">
          <Earth className="w-4 h-4 text-cyan" />
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center mb-12 hero-element">
          <div className="relative mb-8">
            <div className="floating-logo w-20 h-20 bg-gradient-to-br from-pale-cyan/30 to-vapor-blue/20 rounded-2xl flex items-center justify-center mx-auto border border-pale-cyan/20 backdrop-blur-xl">
              <Earth className="w-10 h-10 text-cyan" />
            </div>
            <div className="pulse-glow absolute inset-0 w-20 h-20 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/10 rounded-2xl mx-auto blur-xl"></div>
          </div>

          <h1 className="text-4xl md:text-5xl font-light text-mist mb-4 tracking-wide hero-element">
            Welcome to
            <span className="block text-cyan font-extralight">Genesis</span>
          </h1>
          <p className="text-fog text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto hero-element">
            Consciousness floating between realities, where thoughts become celestial conversations
          </p>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-12">
          {suggestions.map((suggestion, index) => {
            const IconComponent = suggestion.icon;
            return (
              <button
                key={index}
                onClick={() => onSendMessage(suggestion.text)}
                className="suggestion-card p-6 text-left mist-card rounded-2xl hover:bg-mist-medium/30 transition-all duration-500 group angular-shape hover-glow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-pale-cyan/20 to-transparent rounded-xl flex items-center justify-center border border-pale-cyan/10 group-hover:border-pale-cyan/30 transition-colors">
                    <IconComponent className="w-5 h-5 text-cyan" />
                  </div>
                  <span className="text-mist group-hover:text-cyan transition-colors font-light tracking-wide leading-relaxed">
                    {suggestion.text}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="w-full max-w-3xl hero-element">
          <div className="relative flex items-end mist-card rounded-2xl p-2 focus-within:border-pale-cyan/40 transition-all duration-300">
            <button className="p-3 text-fog hover:text-cyan transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)} // your controlled state
              onKeyDown={handleKeyDown}
              placeholder="And the word was..."
              className="flex-1 resize-none border-none outline-none py-3 bg-transparent text-mist placeholder-fog max-h-32 min-h-[24px] font-light tracking-wide"
              rows={1}
              style={{ height: 'auto', minHeight: '24px' }}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              {...searchInputProps} // will never include onChange/value
            />




            <button className="p-3 text-fog hover:text-cyan transition-colors">
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="m-1 p-3 vapor-button rounded-xl hover:bg-pale-cyan/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover-glow"
            >
              <Send className="w-4 h-4 text-cyan" />
            </button>
          </div>

          <p className="text-xs text-fog text-center mt-4 font-light tracking-wide">
            AI consciousness may drift between dimensions. verify important transmissions.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Plus,
  Search,
  BookOpen,
  MoreHorizontal,
  Share,
  Edit,
  Archive,
  Trash,
  Menu,
  X,
  Earth,
  Zap,
} from 'lucide-react';
import { renameConversation, deleteConversation as apiDeleteConversation } from '../services/api';
import { createPortal } from 'react-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: any[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onShowWelcome: () => void;
  disableInteraction?: boolean;
}

export default function Sidebar({
  isOpen,
  onToggle,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onShowWelcome,
  disableInteraction = false,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(
        '.sidebar-item',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!activeDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setDropdownPosition(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setEditingChat(chatId);
      setEditTitle(chat.title);
    }
    setActiveDropdown(null);
  };

  const saveRename = async (chatId: string) => {
    if (editTitle.trim()) {
      try {
        await renameConversation(chatId, editTitle.trim());
        onRenameChat(chatId, editTitle.trim());
      } catch (e) {
        // Optionally show error
      }
    }
    setEditingChat(null);
    setEditTitle('');
  };

  const cancelRename = () => {
    setEditingChat(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString().toLowerCase();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed lg:relative lg:translate-x-0
        w-[280px] h-full sidebar-mist
        transition-transform duration-500 ease-out z-50
        flex flex-col
      `}
      >
        {/* Header */}
        <div className="p-4 border-b border-mist">
          <div className="flex items-center justify-between mb-4 sidebar-item">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pale-cyan/20 to-vapor-blue/20 rounded-lg flex items-center justify-center border border-pale-cyan/20">
                <Earth className="w-4 h-4 text-cyan" />
              </div>
              <span className="text-sm font-light text-mist tracking-wide">Genesis</span>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 hover:bg-mist-medium/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-fog" />
            </button>
          </div>

          <button
            onClick={onNewChat}
            className="w-full vapor-button rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-light lowercase tracking-wide sidebar-item hover-glow"
          >
            <Plus className="w-4 h-4 text-cyan" />
            <span className="text-mist">new conversation</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-mist">
          <div className="relative sidebar-item">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-fog" />
            <input
              type="text"
              placeholder="search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-3 mist-input rounded-xl text-sm font-light lowercase tracking-wide"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-mist">
          <button
            onClick={onShowWelcome}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-mist-medium/30 transition-colors sidebar-item"
          >
            <BookOpen className="w-4 h-4 text-fog" />
            <span className="text-sm text-fog font-light lowercase tracking-wide">
              knowledge base
            </span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs font-light text-fog uppercase tracking-widest mb-4 sidebar-item">
              conversations
            </h3>

            {filteredChats.length === 0 ? (
              <div className="text-center py-12 sidebar-item">
                <div className="w-16 h-16 bg-gradient-to-br from-pale-cyan/10 to-transparent rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-fog" />
                </div>
                <p className="text-sm text-fog font-light lowercase">no conversations yet</p>
                <p className="text-xs text-fog/60 mt-1 lowercase">begin your digital journey</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChats.map((chat, index) => {
                  return (
                    <div
                      key={chat.id}
                      className={`
                        group relative rounded-xl transition-all duration-300 sidebar-item entrance-haze
                        ${currentChatId === chat.id ? 'mist-card' : 'hover:bg-mist-medium/20'}
                        ${disableInteraction ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                        z-0
                      `}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className="p-4 pr-10"
                        onClick={() => !disableInteraction && onSelectChat(chat.id)}
                      >
                        {editingChat === chat.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onBlur={() => saveRename(chat.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveRename(chat.id);
                              if (e.key === 'Escape') cancelRename();
                            }}
                            className="w-full text-sm font-light text-mist bg-transparent border-none outline-none lowercase"
                            autoFocus
                          />
                        ) : (
                          <>
                            <h4 className="text-sm font-light text-mist truncate lowercase">
                              {chat.title}
                            </h4>
                            {chat.lastMessage && (
                              <p className="text-xs text-fog mt-2 lowercase font-light">
                                {formatDate(chat.lastMessage)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {/* Dropdown Menu */}
                      <div className="absolute top-3 right-3">
                        <button
                          ref={el => (buttonRefs.current[index] = el)}
                          onClick={e => {
                            e.stopPropagation();
                            if (activeDropdown === chat.id) {
                              setActiveDropdown(null);
                              setDropdownPosition(null);
                            } else {
                              setActiveDropdown(chat.id);
                              const rect = buttonRefs.current[index]?.getBoundingClientRect();
                              if (rect) {
                                setDropdownPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  left: rect.left + window.scrollX - 160 + rect.width, // 160 = dropdown width
                                });
                              }
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-mist-medium/50 rounded-lg transition-all duration-300"
                        >
                          <MoreHorizontal className="w-4 h-4 text-fog" />
                        </button>
                        {activeDropdown === chat.id &&
                          dropdownPosition &&
                          createPortal(
                            <div
                              ref={dropdownRef}
                              className="fixed w-48 mist-card rounded-xl py-2 z-[10000] entrance-haze shadow-lg"
                              style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                              }}
                            >
                              <button
                                onClick={() => {
                                  setActiveDropdown(null);
                                  setDropdownPosition(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-fog hover:text-mist hover:bg-mist-medium/30 transition-colors lowercase font-light"
                              >
                                <Share className="w-4 h-4" />
                                share
                              </button>
                              <button
                                onClick={() => handleRename(chat.id)}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-fog hover:text-mist hover:bg-mist-medium/30 transition-colors lowercase font-light"
                              >
                                <Edit className="w-4 h-4" />
                                rename
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdown(null);
                                  setDropdownPosition(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-fog hover:text-mist hover:bg-mist-medium/30 transition-colors lowercase font-light"
                              >
                                <Archive className="w-4 h-4" />
                                archive
                              </button>
                              <button
                                onClick={async () => {
                                  await apiDeleteConversation(chat.id);
                                  onDeleteChat(chat.id);
                                  setActiveDropdown(null);
                                  setDropdownPosition(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors lowercase font-light"
                              >
                                <Trash className="w-4 h-4" />
                                delete
                              </button>
                            </div>,
                            document.body
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

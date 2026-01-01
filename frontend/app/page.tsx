'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import InitialView from '@/components/InitialView';
import { Zap } from 'lucide-react';
import {
  createConversation,
  listConversations,
  getMessages,
  chatWithLLM,
  addMessage,
  getConversation,
  deleteConversation,
} from '../services/api';

const DUMMY_USER_ID = 'user1';

export default function Home() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConv, setCurrentConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isInitialView, setIsInitialView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    setLoading(true);
    try {
      const data = await listConversations(DUMMY_USER_ID);
      const mapped = data.map((conv: any) => ({
        ...conv,
        id: conv.id || conv._id,
      }));
      setConversations(mapped);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectConversation(conv: any) {
    if (!conv || !(conv.id || conv._id)) return;
    setCurrentConv(conv);
    setIsInitialView(false);
    setMsgLoading(true);
    try {
      const msgs = await getMessages(conv.id || conv._id);
      setMessages(msgs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMsgLoading(false);
    }
  }

  async function handleNewChat() {
    setLoading(true);
    try {
      const defaultTitle = `Conversation ${conversations.length + 1}`;
      const conv = await createConversation(DUMMY_USER_ID, defaultTitle);
      await fetchConversations();
      handleSelectConversation({ ...conv, id: conv.id || conv._id });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(content: string) {
    if (!currentConv) {
      const defaultTitle = `Conversation ${conversations.length + 1}`;
      const conv = await createConversation(DUMMY_USER_ID, defaultTitle);
      setCurrentConv({ ...conv, id: conv.id || conv._id });
      setIsInitialView(false);
      setMsgLoading(true);
      try {
        await chatWithLLM(conv.id || conv._id, DUMMY_USER_ID, content);
        const msgs = await getMessages(conv.id || conv._id);
        setMessages(msgs);
      } catch (e: any) {
        setError(e.message);
        await deleteConversation(conv.id || conv._id);
        await fetchConversations();
        setCurrentConv(null);
      } finally {
        setMsgLoading(false);
      }
      return;
    }
    setMsgLoading(true);
    try {
      await chatWithLLM(currentConv.id || currentConv._id, DUMMY_USER_ID, content);
      const msgs = await getMessages(currentConv.id || currentConv._id);
      setMessages(msgs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMsgLoading(false);
    }
  }

  async function handleInitialMessage(content: string) {
    setIsInitialView(false);
    const defaultTitle = `Conversation ${conversations.length + 1}`;
    const conv = await createConversation(DUMMY_USER_ID, defaultTitle);
    setCurrentConv({ ...conv, id: conv.id || conv._id });
    setMsgLoading(true);
    try {
      await chatWithLLM(conv.id || conv._id, DUMMY_USER_ID, content);
      const msgs = await getMessages(conv.id || conv._id);
      setMessages(msgs);
    } catch (e: any) {
      setError(e.message);
      await deleteConversation(conv.id || conv._id);
      await fetchConversations();
      setCurrentConv(null);
    } finally {
      setMsgLoading(false);
    }
  }

  return (
    <main className="flex-1" role="main">
      <div className="flex h-screen relative overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          chats={conversations}
          currentChatId={currentConv?.id || currentConv?._id || null}
          onSelectChat={chatId => {
            const conv = conversations.find(c => c.id === chatId || c._id === chatId);
            if (conv) handleSelectConversation(conv);
          }}
          onNewChat={handleNewChat}
          onDeleteChat={async chatId => {
            await fetchConversations();
            setConversations(prev => prev.filter(c => c.id !== chatId && c._id !== chatId));
            if (currentConv && (currentConv.id === chatId || currentConv._id === chatId)) {
              setCurrentConv(null);
              setMessages([]);
              setIsInitialView(true);
            }
          }}
          onRenameChat={async (chatId, newTitle) => {
            await fetchConversations();
            setConversations(prev =>
              prev.map(c => (c.id === chatId || c._id === chatId ? { ...c, title: newTitle } : c))
            );
          }}
          onShowWelcome={() => {
            setIsInitialView(true);
            setCurrentConv(null);
            setMessages([]);
          }}
          disableInteraction={loading || msgLoading}
        />

        <div className="flex-1 flex flex-col relative z-10">
          {isInitialView ? (
            <InitialView
              onSendMessage={handleInitialMessage}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              searchInputProps={{ 'aria-label': 'search conversations' }}
            />
          ) : (
            <ChatArea
              chat={currentConv ? { ...currentConv, messages } : undefined}
              onSendMessage={handleSendMessage}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              loading={msgLoading}
              messageBoxProps={{ 'aria-label': 'message input' }}
            />
          )}

          {error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded shadow">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

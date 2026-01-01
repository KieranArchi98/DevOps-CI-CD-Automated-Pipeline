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
    console.log('[INIT] Mounting Home component, fetching conversations...');
    fetchConversations();
  }, []);

  async function fetchConversations() {
    setLoading(true);
    console.log('[API] Fetching conversations for user:', DUMMY_USER_ID);
    try {
      const data = await listConversations(DUMMY_USER_ID);
      const mapped = data.map((conv: any) => ({
        ...conv,
        id: conv.id || conv._id,
      }));
      console.log('[API] Conversations fetched:', mapped);
      setConversations(mapped);
    } catch (e: any) {
      console.error('[ERROR] Fetch conversations failed:', e);
      setError(e.message);
    } finally {
      setLoading(false);
      console.log('[STATE] Loading set to false after fetchConversations');
    }
  }

  async function handleSelectConversation(conv: any) {
    if (!conv || !(conv.id || conv._id)) {
      console.error('[ERROR] Tried to select an undefined or invalid conversation:', conv);
      setError('Invalid conversation selected.');
      return;
    }
    console.log('[UI] Selecting conversation:', conv);
    setCurrentConv(conv);
    setIsInitialView(false);
    setMsgLoading(true);
    try {
      const msgs = await getMessages(conv.id || conv._id);
      console.log('[API] Messages fetched for conversation', conv.id || conv._id, msgs);
      setMessages(msgs);
    } catch (e: any) {
      console.error('[ERROR] Fetch messages failed:', e);
      setError(e.message);
    } finally {
      setMsgLoading(false);
      console.log('[STATE] msgLoading set to false after handleSelectConversation');
    }
  }

  async function handleNewChat() {
    setLoading(true);
    console.log('[UI] Creating new conversation...');
    try {
      const defaultTitle = `Conversation ${conversations.length + 1}`;
      const conv = await createConversation(DUMMY_USER_ID, defaultTitle);
      console.log('[API] New conversation created:', conv);
      await fetchConversations();
      handleSelectConversation({ ...conv, id: conv.id || conv._id });
    } catch (e: any) {
      console.error('[ERROR] Create conversation failed:', e);
      setError(e.message);
    } finally {
      setLoading(false);
      console.log('[STATE] Loading set to false after handleNewChat');
    }
  }

  async function handleDeleteChat(chatId: string) {
    console.log('[UI] Deleting chat:', chatId);
    await fetchConversations();
    setConversations(prev => prev.filter(c => c.id !== chatId && c._id !== chatId));
    if (currentConv && (currentConv.id === chatId || currentConv._id === chatId)) {
      setCurrentConv(null);
      setMessages([]);
      setIsInitialView(true);
      console.log('[STATE] Current conversation deleted, resetting view.');
    }
  }

  async function handleRenameChat(chatId: string, newTitle: string) {
    console.log('[UI] Renaming chat:', chatId, 'to', newTitle);
    await fetchConversations();
    setConversations(prev =>
      prev.map(c => (c.id === chatId || c._id === chatId ? { ...c, title: newTitle } : c))
    );
  }

  async function handleSendMessage(content: string) {
    console.log('[UI] Sending message:', content);
    if (!currentConv) {
      console.log('[UI] No current conversation, creating new chat first.');
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
        console.error('[ERROR] Send message failed:', e);
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
      console.error('[ERROR] Send message failed:', e);
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
      console.error('[ERROR] Send message failed:', e);
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
        {/* Sidebar */}
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
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onShowWelcome={() => {
            setIsInitialView(true);
            setCurrentConv(null);
            setMessages([]);
          }}
          disableInteraction={loading || msgLoading}
        />
        {/* Main Content */}
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

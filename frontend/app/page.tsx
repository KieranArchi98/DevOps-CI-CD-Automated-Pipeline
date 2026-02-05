'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import InitialView from '@/components/InitialView';
import {
  createConversation,
  listConversations,
  getMessages,
  chatWithLLM,
  deleteConversation,
  renameConversation,
} from '../services/api';

const DUMMY_USER_ID = 'user1';
const DRAFT_ID = 'draft-conversation';

const buildTitleFromMessage = (content: string) => {
  const cleaned = content
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .trim();
  if (!cleaned) return 'new conversation';
  const words = cleaned.split(' ').slice(0, 7).join(' ');
  return words.length > 48 ? `${words.slice(0, 48).trim()}…` : words;
};

const isDefaultTitle = (title: string) => {
  if (!title) return true;
  const lower = title.toLowerCase();
  return lower === 'new conversation' || /^conversation\s+\d+$/i.test(title);
};

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

  useEffect(() => {
    const syncSidebarToViewport = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    syncSidebarToViewport();
    window.addEventListener('resize', syncSidebarToViewport);
    return () => {
      window.removeEventListener('resize', syncSidebarToViewport);
    };
  }, []);

  async function fetchConversations() {
    setLoading(true);
    try {
      const data = await listConversations(DUMMY_USER_ID);
      const mapped = await Promise.all(
        data.map(async (conv: any) => {
          const id = conv.id || conv._id;
          let msgs: any[] = [];
          try {
            msgs = await getMessages(id);
          } catch {
            msgs = [];
          }
          const firstUserMsg = msgs.find(m => m.role === 'user')?.content || msgs[0]?.content;
          const shouldRename = isDefaultTitle(conv.title) && !!firstUserMsg;
          let title = conv.title;
          if (shouldRename) {
            const nextTitle = buildTitleFromMessage(firstUserMsg);
            try {
              await renameConversation(id, nextTitle);
              title = nextTitle;
            } catch {
              title = conv.title;
            }
          }
          const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          const lastMessageDate = lastMessage?.timestamp
            ? new Date(lastMessage.timestamp)
            : lastMessage?.created_at
              ? new Date(lastMessage.created_at)
              : undefined;
          const searchText = [title, ...msgs.map(m => m.content)].join(' ').toLowerCase();
          return {
            ...conv,
            id,
            title,
            lastMessage: lastMessageDate,
            _messageCount: msgs.length,
            searchText,
          };
        })
      );

      const nonEmpty = mapped.filter(c => c._messageCount > 0);
      const empty = mapped.filter(c => c._messageCount === 0);
      await Promise.all(
        empty.map(c =>
          deleteConversation(c.id).catch(() => {
            // best-effort cleanup
          })
        )
      );
      setConversations(nonEmpty);
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
    setIsInitialView(false);
    setCurrentConv({ id: DRAFT_ID, title: 'new conversation' });
    setMessages([]);
  }

  async function handleSendMessage(content: string) {
    const optimisticMsg = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    if (!currentConv || currentConv.id === DRAFT_ID) {
      const title = buildTitleFromMessage(content);
      setIsInitialView(false);
      if (!currentConv) {
        setCurrentConv({ id: DRAFT_ID, title: 'new conversation' });
      }
      setCurrentConv(prev =>
        prev && prev.id === DRAFT_ID ? { ...prev, title } : prev
      );
      setMessages([optimisticMsg]);
      setMsgLoading(true);
      let createdId: string | null = null;
      try {
        const conv = await createConversation(DUMMY_USER_ID, title);
        const normalized = { ...conv, id: conv.id || conv._id, title };
        createdId = normalized.id;
        setCurrentConv(normalized);
        await chatWithLLM(normalized.id, DUMMY_USER_ID, content);
        const msgs = await getMessages(normalized.id);
        setMessages(msgs);
        await fetchConversations();
      } catch (e: any) {
        setError(e.message);
        if (createdId) {
          await deleteConversation(createdId);
        }
        await fetchConversations();
        setCurrentConv(null);
        setMessages([]);
        setIsInitialView(true);
      } finally {
        setMsgLoading(false);
      }
      return;
    }

    const previousMessages = messages;
    setMessages(prev => [...prev, optimisticMsg]);
    setMsgLoading(true);
    try {
      await chatWithLLM(currentConv.id || currentConv._id, DUMMY_USER_ID, content);
      const msgs = await getMessages(currentConv.id || currentConv._id);
      setMessages(msgs);
      await fetchConversations();
    } catch (e: any) {
      setError(e.message);
      setMessages(previousMessages);
    } finally {
      setMsgLoading(false);
    }
  }

  async function handleInitialMessage(content: string) {
    await handleSendMessage(content);
  }

  return (
    <main className="flex-1 h-screen min-h-screen" role="main">
      <div className="flex h-full relative overflow-hidden">
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

        <div className="flex-1 flex flex-col relative z-10 min-h-0 overflow-hidden">
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

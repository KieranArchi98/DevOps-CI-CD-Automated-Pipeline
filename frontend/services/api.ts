export async function healthCheck() {
  console.log('[API] healthCheck: Sending request to /health');
  const res = await fetch('http://localhost:8000/health');
  if (!res.ok) {
    console.error('[API] healthCheck: Failed', res.status, res.statusText);
    throw new Error('Health check failed');
  }
  const data = await res.json();
  console.log('[API] healthCheck: Success', data);
  return data;
}

export async function createConversation(user_id: string, title: string) {
  console.log('[API] createConversation: Sending POST to /api/conversations/', { user_id, title });
  const res = await fetch('http://localhost:8000/api/conversations/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, title }),
  });
  if (!res.ok) {
    console.error('[API] createConversation: Failed', res.status, res.statusText);
    throw new Error('Create conversation failed');
  }
  const data = await res.json();
  console.log('[API] createConversation: Success', data);
  return data;
}

export async function listConversations(user_id: string) {
  console.log('[API] listConversations: Sending GET to /api/conversations/', { user_id });
  const res = await fetch(`http://localhost:8000/api/conversations/?user_id=${user_id}`);
  if (!res.ok) {
    console.error('[API] listConversations: Failed', res.status, res.statusText);
    throw new Error('List conversations failed');
  }
  const data = await res.json();
  console.log('[API] listConversations: Success', data);
  return data;
}

export async function getConversation(conversation_id: string) {
  console.log('[API] getConversation: Sending GET to /api/conversations/' + conversation_id);
  const res = await fetch(`http://localhost:8000/api/conversations/${conversation_id}`);
  if (!res.ok) {
    console.error('[API] getConversation: Failed', res.status, res.statusText);
    throw new Error('Get conversation failed');
  }
  const data = await res.json();
  console.log('[API] getConversation: Success', data);
  return data;
}

export async function addMessage(conversation_id: string, message: any) {
  console.log(
    '[API] addMessage: Sending POST to /api/conversations/' + conversation_id + '/messages',
    message
  );
  const res = await fetch(`http://localhost:8000/api/conversations/${conversation_id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    console.error('[API] addMessage: Failed', res.status, res.statusText);
    throw new Error('Add message failed');
  }
  const data = await res.json();
  console.log('[API] addMessage: Success', data);
  return data;
}

export async function chatWithLLM(conversation_id: string, user_id: string, content: string) {
  console.log('[API] chatWithLLM: Sending POST to /api/chat/', {
    conversation_id,
    user_id,
    content,
  });
  const res = await fetch('http://localhost:8000/api/chat/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id, user_id, content }),
  });
  if (!res.ok) {
    console.error('[API] chatWithLLM: Failed', res.status, res.statusText);
    throw new Error('Chat failed');
  }
  const data = await res.json();
  console.log('[API] chatWithLLM: Success', data);
  return data;
}

export async function getMessages(conversation_id: string) {
  console.log(
    '[API] getMessages: Sending GET to /api/conversations/' + conversation_id + '/messages'
  );
  const res = await fetch(`http://localhost:8000/api/conversations/${conversation_id}/messages`);
  if (!res.ok) {
    console.error('[API] getMessages: Failed', res.status, res.statusText);
    throw new Error('Get messages failed');
  }
  const data = await res.json();
  // Map _id to id and created_at to timestamp for frontend compatibility
  const mapped = data.map((msg: any) => ({
    ...msg,
    id: msg.id || msg._id, // ensure id is present
    timestamp: msg.created_at,
  }));
  // Sort by created_at
  const sorted = mapped.sort(
    (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  console.log('[API] getMessages: Success', sorted);
  return sorted;
}

export async function deleteConversation(conversation_id: string) {
  console.log('[API] deleteConversation: Sending DELETE to /api/conversations/' + conversation_id);
  const res = await fetch(`http://localhost:8000/api/conversations/${conversation_id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    console.error('[API] deleteConversation: Failed', res.status, res.statusText);
    throw new Error('Delete conversation failed');
  }
  const data = await res.json();
  console.log('[API] deleteConversation: Success', data);
  return data;
}

export async function renameConversation(conversation_id: string, title: string) {
  console.log('[API] renameConversation: Sending PATCH to /api/conversations/' + conversation_id);
  const res = await fetch(`http://localhost:8000/api/conversations/${conversation_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    console.error('[API] renameConversation: Failed', res.status, res.statusText);
    throw new Error('Rename conversation failed');
  }
  const data = await res.json();
  console.log('[API] renameConversation: Success', data);
  return data;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { AttachmentList } from '../components/AttachmentList';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';
import { directConversationsApi } from '../lib/api-client';
import type { DirectConversation, DirectConversationRecipient, DirectMessage } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

function formatTimestamp(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

function getConversationTitle(conversation: DirectConversation, currentUserId?: number | null) {
  const others = conversation.participants.filter((participant) => participant.user_id !== currentUserId);
  if (!others.length) {
    return 'Conversation';
  }
  return others.map((participant) => participant.user.full_name).join(', ');
}

export default function DirectMessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
  const [conversationTopic, setConversationTopic] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [debouncedRecipientSearch, setDebouncedRecipientSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    attachments,
    addFiles,
    removeAttachment,
    resetAttachments,
    attachmentIds,
    isUploading,
  } = useAttachmentUpload(3);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedRecipientSearch(recipientSearch.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [recipientSearch]);

  const conversationsQuery = useQuery({
    queryKey: ['direct-conversations'],
    queryFn: () => directConversationsApi.getAll(),
    refetchInterval: 5000,
  });

  const selectedConversation = useMemo(
    () =>
      conversationsQuery.data?.conversations.find(
        (conversation) => conversation.id === selectedConversationId
      ),
    [conversationsQuery.data?.conversations, selectedConversationId]
  );

  useEffect(() => {
    if (
      !selectedConversationId &&
      conversationsQuery.data?.conversations &&
      conversationsQuery.data.conversations.length > 0
    ) {
      setSelectedConversationId(conversationsQuery.data.conversations[0].id);
    }
  }, [conversationsQuery.data?.conversations, selectedConversationId]);

  const messagesQuery = useQuery({
    queryKey: ['direct-messages', selectedConversationId],
    queryFn: () => directConversationsApi.getMessages(selectedConversationId!),
    enabled: Boolean(selectedConversationId),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (messagesQuery.data?.messages) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesQuery.data?.messages]);

  const markReadMutation = useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: number; messageId: number | null }) =>
      directConversationsApi.markRead(conversationId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
    },
  });

  useEffect(() => {
    if (!selectedConversationId || !messagesQuery.data?.messages?.length || !user?.id) return;
    const lastMessage = messagesQuery.data.messages[messagesQuery.data.messages.length - 1];
    const participant = selectedConversation?.participants.find(
      (p) => p.user_id === user.id
    );
    const lastReadId = participant?.last_read_message_id ?? null;
    if (lastMessage && (!lastReadId || lastMessage.id > lastReadId)) {
      markReadMutation.mutate({ conversationId: selectedConversationId, messageId: lastMessage.id });
    }
  }, [messagesQuery.data?.messages, markReadMutation, selectedConversation, selectedConversationId, user?.id]);

  const sendMessageMutation = useMutation({
    mutationFn: (payload: { conversationId: number; content: string; attachments: number[] }) =>
      directConversationsApi.sendMessage(payload.conversationId, {
        content: payload.content,
        attachments: payload.attachments.length ? payload.attachments : undefined,
      }),
    onSuccess: () => {
      setMessage('');
      resetAttachments();
      queryClient.invalidateQueries({ queryKey: ['direct-messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: (payload: { target_user_id: number; topic?: string }) =>
      directConversationsApi.startConversation(payload),
    onSuccess: (conversation) => {
      setShowNewChatModal(false);
      setRecipientSearch('');
      setConversationTopic('');
      setSelectedRecipientId(null);
      queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
      setSelectedConversationId(conversation.id);
    },
  });

  const recipientsQuery = useQuery({
    queryKey: ['direct-conversation-recipients', debouncedRecipientSearch],
    queryFn: () =>
      directConversationsApi.getRecipients(
        debouncedRecipientSearch ? { q: debouncedRecipientSearch } : undefined
      ),
    enabled: showNewChatModal,
    staleTime: 1000 * 30,
  });

  const conversations = conversationsQuery.data?.conversations ?? [];
  const messages: DirectMessage[] = messagesQuery.data?.messages ?? [];
  const recipientOptions: DirectConversationRecipient[] = recipientsQuery.data?.users ?? [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId || !message.trim() || sendMessageMutation.isPending || isUploading) {
      return;
    }
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: message.trim(),
      attachments: attachmentIds,
    });
  };

  const handleStartConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipientId || startConversationMutation.isPending) return;
    startConversationMutation.mutate({
      target_user_id: selectedRecipientId,
      topic: conversationTopic.trim() || undefined,
    });
  };

  const hasConversations = conversations.length > 0;
  const isSendDisabled =
    !selectedConversationId ||
    (!message.trim() && attachmentIds.length === 0) ||
    sendMessageMutation.isPending ||
    isUploading;

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[22rem,1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Direct Chat</h2>
              <p className="text-gray-600 text-sm">Message coworkers privately</p>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New chat
            </button>
          </div>

          <div className="rounded-lg bg-white shadow divide-y">
            {conversationsQuery.isLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading conversations…</div>
            ) : hasConversations ? (
              conversations.map((conversation) => {
                const title = getConversationTitle(conversation, user?.id);
                const lastMessagePreview = conversation.last_message?.content || 'No messages yet';
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`flex w-full flex-col items-start gap-1 p-4 text-left transition hover:bg-blue-50 ${
                      conversation.id === selectedConversationId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      {conversation.has_unread && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Unread messages" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate w-full">{lastMessagePreview}</p>
                    <p className="text-[11px] text-gray-400">
                      {formatTimestamp(conversation.last_message_at || conversation.updated_at)}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-sm text-gray-500">
                You haven’t started any direct conversations yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {!selectedConversationId ? (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <p className="text-gray-600">
                Select a conversation from the left or start a new chat.
              </p>
            </div>
          ) : (
            <div className="flex h-[38rem] flex-col rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 p-4">
                <p className="text-lg font-semibold text-gray-900">
                  {selectedConversation
                    ? getConversationTitle(selectedConversation, user?.id)
                    : 'Conversation'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedConversation?.topic || 'Private conversation'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messagesQuery.isLoading ? (
                  <div className="text-sm text-gray-500">Loading messages…</div>
                ) : messages.length ? (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col rounded-lg px-4 py-3 ${
                          isMine ? 'bg-blue-600 text-white ml-auto max-w-[80%]' : 'bg-white text-gray-900 shadow max-w-[80%]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs opacity-80">
                          <span>{isMine ? 'You' : msg.sender.full_name}</span>
                          <span>{formatTimestamp(msg.created_at)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm">{msg.content}</p>
                        <AttachmentList attachments={msg.attachments} />
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 space-y-3">
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <AttachmentPreviewList attachments={attachments} onRemove={removeAttachment} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      onChange={(event) => {
                        addFiles(event.target.files);
                        if (event.target.value) {
                          event.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      📎 Attach
                    </button>
                    {isUploading && (
                      <span className="text-xs text-gray-500">Uploading attachments…</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSendDisabled}
                    className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition ${
                      isSendDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {sendMessageMutation.isPending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Start a new conversation</h3>
                <p className="text-sm text-gray-500">Search for a coworker to chat with.</p>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setRecipientSearch('');
                  setSelectedRecipientId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartConversation} className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Search</label>
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Search by name, email, or employee ID"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200">
                {recipientsQuery.isLoading ? (
                  <p className="p-4 text-sm text-gray-500">Loading employees…</p>
                ) : recipientOptions.length ? (
                  recipientOptions.map((recipient) => (
                    <label
                      key={recipient.id}
                      className={`flex cursor-pointer items-center justify-between px-4 py-3 text-sm hover:bg-blue-50 ${
                        selectedRecipientId === recipient.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{recipient.full_name}</p>
                        <p className="text-xs text-gray-500">{recipient.email}</p>
                      </div>
                      <input
                        type="radio"
                        name="recipient"
                        value={recipient.id}
                        checked={selectedRecipientId === recipient.id}
                        onChange={() => setSelectedRecipientId(recipient.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  ))
                ) : (
                  <p className="p-4 text-sm text-gray-500">
                    No coworkers found. Try a different search.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Topic (optional)</label>
                <input
                  type="text"
                  value={conversationTopic}
                  onChange={(e) => setConversationTopic(e.target.value)}
                  placeholder="e.g. Project kickoff"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewChatModal(false);
                    setSelectedRecipientId(null);
                    setRecipientSearch('');
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedRecipientId || startConversationMutation.isPending}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                    !selectedRecipientId || startConversationMutation.isPending
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {startConversationMutation.isPending ? 'Starting…' : 'Start chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

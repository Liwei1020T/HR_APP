import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { AttachmentList } from '../components/AttachmentList';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';
import { directConversationsApi } from '../lib/api-client';
import type { DirectConversation, DirectConversationRecipient, DirectMessage } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Paperclip,
  X,
  User,
  MoreVertical,
  Phone,
  Video,
  Image as ImageIcon
} from 'lucide-react';

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
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>([]);
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
    mutationFn: (payload: { target_user_ids: number[]; topic?: string }) =>
      directConversationsApi.startConversation(payload),
    onSuccess: (conversation) => {
      setShowNewChatModal(false);
      setRecipientSearch('');
      setConversationTopic('');
      setSelectedRecipientIds([]);
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
    if (selectedRecipientIds.length === 0 || startConversationMutation.isPending) return;
    startConversationMutation.mutate({
      target_user_ids: selectedRecipientIds,
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
      <div className="h-[calc(100vh-7rem)] grid gap-6 lg:grid-cols-[24rem,1fr]">
        {/* Sidebar */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Messages
              </h2>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                title="New Chat"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {/* Search bar could go here if implemented for existing chats */}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {conversationsQuery.isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : hasConversations ? (
              conversations.map((conversation) => {
                const title = getConversationTitle(conversation, user?.id);
                const lastMessagePreview = conversation.last_message?.content || 'No messages yet';
                const isSelected = conversation.id === selectedConversationId;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`flex w-full items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${isSelected
                      ? 'bg-blue-50 border-blue-100 shadow-sm ring-1 ring-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                      }`}
                  >
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                      {title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {title}
                        </p>
                        {conversation.has_unread && (
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate max-w-[140px] ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                          {lastMessagePreview}
                        </p>
                        <span className={`text-[10px] ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                          {formatTimestamp(conversation.last_message_at || conversation.updated_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="p-3 bg-gray-50 rounded-full mb-3">
                  <MessageSquare className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">No messages yet</p>
                <p className="text-xs text-gray-500 mt-1">Start a conversation with a coworker.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
          {!selectedConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Direct Chat</h3>
              <p className="text-gray-500 max-w-sm">
                Select a conversation from the sidebar or start a new chat to connect with your team.
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Start New Conversation
              </button>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                    {selectedConversation
                      ? getConversationTitle(selectedConversation, user?.id).charAt(0).toUpperCase()
                      : 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {selectedConversation
                        ? getConversationTitle(selectedConversation, user?.id)
                        : 'Conversation'}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {selectedConversation?.topic ? (
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">{selectedConversation.topic}</span>
                      ) : (
                        'Private conversation'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {messagesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : messages.length ? (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex items-end gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isMine && (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                              {msg.sender.full_name.charAt(0)}
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-5 py-3 shadow-sm ${isMine
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                              }`}
                          >
                            <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
                            <AttachmentList attachments={msg.attachments} />
                          </div>
                        </div>
                        <div className={`mt-1 flex items-center gap-2 text-[10px] text-gray-400 ${isMine ? 'mr-2' : 'ml-12'}`}>
                          <span>{isMine ? 'You' : msg.sender.full_name}</span>
                          <span>•</span>
                          <span>{formatTimestamp(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
                  <AttachmentPreviewList attachments={attachments} onRemove={removeAttachment} />
                  <div className="flex items-end gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-200">
                    <div className="flex items-center gap-1 pb-2 pl-2">
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
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Attach files"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Add image"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <textarea
                      rows={1}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-3 px-2 resize-none max-h-32 min-h-[44px]"
                      style={{ height: 'auto', minHeight: '44px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />

                    <button
                      type="submit"
                      disabled={isSendDisabled}
                      className={`p-3 rounded-lg mb-1 transition-all duration-200 ${isSendDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }`}
                    >
                      {sendMessageMutation.isPending ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {isUploading && (
                    <p className="text-xs text-blue-600 animate-pulse pl-2">Uploading attachments...</p>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setShowNewChatModal(false)}></div>

            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    Start Conversation
                  </h3>
                  <button
                    onClick={() => setShowNewChatModal(false)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleStartConversation} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Search Coworkers
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Search by name, email, or employee ID"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50">
                    {recipientsQuery.isLoading ? (
                      <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading employees...</p>
                      </div>
                    ) : recipientOptions.length ? (
                      <div className="divide-y divide-gray-100">
                        {recipientOptions.map((recipient) => (
                          <label
                            key={recipient.id}
                            className={`flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-white transition-colors ${selectedRecipientIds.includes(recipient.id) ? 'bg-blue-50 hover:bg-blue-50' : ''
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                {recipient.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{recipient.full_name}</p>
                                <p className="text-xs text-gray-500">{recipient.email}</p>
                              </div>
                            </div>
                            <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${selectedRecipientIds.includes(recipient.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-300 bg-white'
                              }`}>
                              {selectedRecipientIds.includes(recipient.id) && (
                                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={selectedRecipientIds.includes(recipient.id)}
                              onChange={() => {
                                setSelectedRecipientIds((prev) =>
                                  prev.includes(recipient.id)
                                    ? prev.filter((id) => id !== recipient.id)
                                    : [...prev, recipient.id]
                                );
                              }}
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No coworkers found.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Topic <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={conversationTopic}
                      onChange={(e) => setConversationTopic(e.target.value)}
                      placeholder="e.g. Project kickoff"
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewChatModal(false);
                        setSelectedRecipientIds([]);
                        setRecipientSearch('');
                      }}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={selectedRecipientIds.length === 0 || startConversationMutation.isPending}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {startConversationMutation.isPending ? 'Starting...' : 'Start Chat'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

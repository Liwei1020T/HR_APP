import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { channelsApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { AttachmentList } from '../components/AttachmentList';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';

export default function ChannelDetailPage() {
  const { id } = useParams();
  const channelId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [sendAsAnnouncement, setSendAsAnnouncement] = useState(false);
  const {
    attachments: chatAttachments,
    addFiles: addChatFiles,
    removeAttachment: removeChatAttachment,
    resetAttachments: resetChatAttachments,
    attachmentIds: chatAttachmentIds,
    isUploading: chatUploading,
  } = useAttachmentUpload(4);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const channelQuery = useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => channelsApi.getById(channelId),
    enabled: Number.isFinite(channelId),
  });

  const messagesQuery = useQuery({
    queryKey: ['channel-messages', channelId],
    queryFn: () => channelsApi.getMessages(channelId),
    refetchInterval: 5000,
    enabled: Number.isFinite(channelId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: () =>
      channelsApi.sendMessage(channelId, message.trim(), {
        isAnnouncement: sendAsAnnouncement,
        attachments: chatAttachmentIds,
      }),
    onSuccess: () => {
      setMessage('');
      setSendAsAnnouncement(false);
      queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] });
      resetChatAttachments();
    },
  });

  const pinMessageMutation = useMutation({
    mutationFn: ({ messageId, isPinned }: { messageId: number; isPinned: boolean }) =>
      channelsApi.pinMessage(channelId, messageId, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] });
    },
  });

  useEffect(() => {
    if (messagesQuery.data?.messages) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesQuery.data?.messages]);

  if (!Number.isFinite(channelId)) {
    return (
      <AppLayout>
        <div className="bg-white rounded-lg shadow p-6 text-red-600">
          Invalid channel.
        </div>
      </AppLayout>
    );
  }

  const messages = messagesQuery.data?.messages ?? [];
  const pinnedMessages = messages.filter((msg: any) => msg.is_pinned);
  const regularMessages = messages.filter((msg: any) => !msg.is_pinned);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/channels')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Channels
        </button>

        {channelQuery.isLoading ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">Loading channel...</div>
        ) : !channelQuery.data ? (
          <div className="bg-white rounded-lg shadow p-6 text-red-600">
            Channel not found or you are not a member.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900">{channelQuery.data.name}</h1>
              <p className="text-gray-600 mt-2">{channelQuery.data.description || 'No description'}</p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-4">
                <span>Type: {channelQuery.data.channel_type}</span>
                <span>Members: {channelQuery.data.member_count ?? '--'}</span>
                {channelQuery.data.join_code && (
                  <div className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded">
                    <span className="font-semibold">Join code:</span>
                    <span className="font-mono">{channelQuery.data.join_code}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(channelQuery.data.join_code || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="text-blue-600 text-xs font-semibold hover:underline"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow h-[38rem] flex flex-col">
              {messagesQuery.isLoading ? (
                <div className="p-6 text-gray-500">Loading messages...</div>
              ) : (
                <>
                  {pinnedMessages.length > 0 && (
                    <div className="border-b-2 border-yellow-300 p-4 space-y-3 bg-yellow-50">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                        </svg>
                        <span className="text-sm font-bold uppercase text-yellow-700">Pinned Messages</span>
                      </div>
                      {pinnedMessages.map((msg: any) => (
                        <div
                          key={'pinned-' + String(msg.id)}
                          className="flex flex-col rounded-lg border-2 border-yellow-300 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                            <span>{msg.user.full_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                            {msg.is_announcement && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                📢 Announcement
                              </span>
                            )}
                            <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800 border border-yellow-300">
                              📌 Pinned
                            </span>
                            {hasRole(['hr', 'admin', 'superadmin']) && (
                              <button
                                onClick={() =>
                                  pinMessageMutation.mutate({ messageId: msg.id, isPinned: false })
                                }
                                disabled={pinMessageMutation.isPending}
                                className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Unpin
                              </button>
                            )}
                          </div>
                          <div className="mt-2 whitespace-pre-line text-gray-800">{msg.content}</div>
                          <AttachmentList attachments={msg.attachments} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {regularMessages.length ? (
                      regularMessages.map((msg: any) => (
                        <div key={msg.id} className="flex flex-col rounded-lg bg-gray-100 p-3">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                            <span>{msg.user.full_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                            {msg.is_announcement && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                Announcement
                              </span>
                            )}
                            {hasRole(['hr', 'admin', 'superadmin']) && (
                              <button
                                onClick={() =>
                                  pinMessageMutation.mutate({ messageId: msg.id, isPinned: true })
                                }
                                disabled={pinMessageMutation.isPending}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Pin
                              </button>
                            )}
                          </div>
                          <div className="mt-1 whitespace-pre-line text-gray-800">{msg.content}</div>
                          <AttachmentList attachments={msg.attachments} />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No messages yet. Start the conversation!</p>
                    )}
                    <div ref={bottomRef} />
                  </div>
                </>
              )}
              <div className="border-t border-gray-200 p-4 space-y-3">
                {hasRole(['hr', 'admin', 'superadmin']) && (
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={sendAsAnnouncement}
                      onChange={(e) => setSendAsAnnouncement(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    Send as announcement (notifies all members)
                  </label>
                )}
                <div className="flex items-end gap-3">
                  <div className="relative flex-1">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Write a message..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-full p-2 text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      📎
                    </button>
                    <input
                      ref={chatFileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => {
                        addChatFiles(e.target.files);
                        e.target.value = '';
                      }}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </div>
                  <button
                    onClick={() => sendMessageMutation.mutate()}
                    disabled={
                      !message.trim() ||
                      sendMessageMutation.isPending ||
                      chatUploading
                    }
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
                <AttachmentPreviewList
                  attachments={chatAttachments}
                  onRemove={removeChatAttachment}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { channelsApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';

export default function ChannelDetailPage() {
  const { id } = useParams();
  const channelId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const [message, setMessage] = useState('');
  const [sendAsAnnouncement, setSendAsAnnouncement] = useState(false);
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
      }),
    onSuccess: () => {
      setMessage('');
      setSendAsAnnouncement(false);
      queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] });
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
              </div>
            </div>

            <div className="bg-white rounded-lg shadow h-[32rem] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesQuery.isLoading ? (
                  <p className="text-gray-500">Loading messages...</p>
                ) : messagesQuery.data?.messages.length ? (
                  messagesQuery.data.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col rounded-lg p-3 ${
                        msg.is_pinned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                        <span>{msg.user.full_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                        {msg.is_announcement && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                            Announcement
                          </span>
                        )}
                        {msg.is_pinned && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800">
                            Pinned
                          </span>
                        )}
                        {hasRole(['hr', 'admin', 'superadmin']) && (
                          <button
                            onClick={() =>
                              pinMessageMutation.mutate({ messageId: msg.id, isPinned: !msg.is_pinned })
                            }
                            disabled={pinMessageMutation.isPending}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {msg.is_pinned ? 'Unpin' : 'Pin'}
                          </button>
                        )}
                      </div>
                      <div className="text-gray-800 mt-1 whitespace-pre-line">{msg.content}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                )}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-gray-200 p-4">
                {hasRole(['hr', 'admin', 'superadmin']) && (
                  <label className="mb-2 flex items-center gap-2 text-sm text-gray-600">
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
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    placeholder="Write a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => sendMessageMutation.mutate()}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

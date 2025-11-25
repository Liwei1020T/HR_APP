import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelsApi, membershipsApi } from '../lib/api-client';
import type { ChannelCreate } from '../lib/types';

export default function ChannelsPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<ChannelCreate>({
    name: '',
    description: '',
    channel_type: 'general',
    is_private: false,
  });
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = (type: 'success' | 'error', text: string) => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
    setBanner({ type, text });
    bannerTimeoutRef.current = setTimeout(() => setBanner(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

  // Fetch user's memberships
  const { data: myChannelsData } = useQuery({
    queryKey: ['my-channels'],
    queryFn: () => membershipsApi.getMyChannels(),
  });

  // Create channel mutation
  const createMutation = useMutation({
    mutationFn: (data: ChannelCreate) => channelsApi.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['my-channels'] });
      setShowCreateForm(false);
      setFormData({ name: '', description: '', channel_type: 'general', is_private: false });
      showBanner('success', `Channel created. Join code: ${created.join_code || 'N/A'}`);
    },
    onError: () => showBanner('error', 'Unable to create channel.'),
  });

  // Join channel mutation
  const joinMutation = useMutation({
    mutationFn: (code: string) => membershipsApi.join(code),
    onSuccess: (membership) => {
      queryClient.invalidateQueries({ queryKey: ['my-channels'] });
      setJoinCode('');
      showBanner('success', `Joined ${membership.channel?.name || 'channel'}`);
    },
    onError: () => showBanner('error', 'Invalid code or unable to join.'),
  });

  // Leave channel mutation
  const leaveMutation = useMutation({
    mutationFn: ({ id }: { id: number; name: string }) => membershipsApi.leave(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-channels'] });
      showBanner('success', `Left ${variables.name} channel`);
    },
    onError: () => showBanner('error', 'Unable to leave channel. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const myMemberships = Array.isArray(myChannelsData)
    ? myChannelsData
    : myChannelsData?.channels || [];
  const canCreateChannel = true;

  return (
    <AppLayout>
      {banner && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none">
          <div
            className={`mt-6 px-4 py-2 rounded-lg shadow ${
              banner.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {banner.text}
          </div>
        </div>
      )}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Channels</h2>
            <p className="text-gray-600">Join channels to communicate with your team</p>
          </div>
          {canCreateChannel && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Channel
            </button>
          )}
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Channel</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel Type *
                  </label>
                  <select
                    value={formData.channel_type}
                    onChange={(e) => setFormData({ ...formData, channel_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="department">Department</option>
                    <option value="project">Project</option>
                    <option value="social">Social</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="private"
                    checked={formData.is_private}
                    onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="private" className="ml-2 text-sm text-gray-700">
                    Make this channel private
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ name: '', description: '', channel_type: 'general', is_private: false });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Channel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join by code */}
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Join a channel with a code</h3>
          <p className="text-sm text-gray-600">Enter the join code shared with you to access a channel.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABCD1234"
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={() => joinMutation.mutate(joinCode.trim())}
              disabled={!joinCode.trim() || joinMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {joinMutation.isPending ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        {/* Create channel */}
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create a channel</h3>
              <p className="text-sm text-gray-600">Share the generated join code with teammates.</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>

        {/* My channels */}
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Your channels</h3>
          {myMemberships.length === 0 ? (
            <p className="text-sm text-gray-600">You have not joined any channels yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myMemberships.map((membership: any) => {
                const channelId = membership.channel_id || membership.channel?.id || membership.id;
                const channelName = membership.channel?.name || membership.name || 'Channel';
                const description = membership.channel?.description || membership.description || '';
                return (
                  <div key={channelId} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{channelName}</h4>
                        <p className="text-xs text-gray-600">{description || 'No description'}</p>
                      </div>
                      <Link to={`/channels/${channelId}`} className="text-blue-600 text-sm hover:underline">
                        Open
                      </Link>
                    </div>
                    <button
                      onClick={() => leaveMutation.mutate({ id: channelId, name: channelName })}
                      disabled={leaveMutation.isPending}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      Leave
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}



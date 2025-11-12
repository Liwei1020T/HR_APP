import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelsApi, membershipsApi } from '../lib/api-client';
import type { ChannelCreate } from '../lib/types';

export default function ChannelsPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<ChannelCreate>({
    name: '',
    description: '',
    channel_type: 'general',
    is_private: false,
  });

  // Fetch all channels
  const { data: channelsData, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: () => channelsApi.getAll(),
  });

  // Fetch user's memberships
  const { data: myChannelsData } = useQuery({
    queryKey: ['my-channels'],
    queryFn: () => membershipsApi.getMyChannels(),
  });

  // Create channel mutation
  const createMutation = useMutation({
    mutationFn: (data: ChannelCreate) => channelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setShowCreateForm(false);
      setFormData({ name: '', description: '', channel_type: 'general', is_private: false });
    },
  });

  // Join channel mutation
  const joinMutation = useMutation({
    mutationFn: (channelId: number) => membershipsApi.join(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });

  // Leave channel mutation
  const leaveMutation = useMutation({
    mutationFn: (channelId: number) => membershipsApi.leave(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const channels = channelsData?.channels || [];
  const userChannelIds = new Set(myChannelsData?.channels?.map((c) => c.id) || []);
  const canCreateChannel = hasRole(['hr', 'admin', 'superadmin']);

  return (
    <AppLayout>
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
              ➕ Create Channel
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

        {/* Channels Grid */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading channels...
          </div>
        ) : channels.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No channels yet. {canCreateChannel && 'Create one to get started!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => {
              const isMember = userChannelIds.has(channel.id);
              return (
                <div key={channel.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {channel.channel_type === 'general'
                            ? '💬'
                            : channel.channel_type === 'department'
                            ? '🏢'
                            : channel.channel_type === 'project'
                            ? '📁'
                            : '🎉'}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
                      </div>
                      {channel.is_private && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">🔒 Private</span>
                      )}
                    </div>

                    {channel.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{channel.description}</p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{channel.member_count || 0} members</span>
                      <span className="capitalize">{channel.channel_type}</span>
                    </div>

                    {isMember ? (
                      <button
                        onClick={() => leaveMutation.mutate(channel.id)}
                        disabled={leaveMutation.isPending}
                        className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {leaveMutation.isPending ? 'Leaving...' : '✓ Leave Channel'}
                      </button>
                    ) : (
                      <button
                        onClick={() => joinMutation.mutate(channel.id)}
                        disabled={joinMutation.isPending}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {joinMutation.isPending ? 'Joining...' : '➕ Join Channel'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

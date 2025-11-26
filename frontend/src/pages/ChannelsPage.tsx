import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelsApi, membershipsApi } from '../lib/api-client';
import type { ChannelCreate } from '../lib/types';
import {
  Hash,
  Plus,
  Search,
  Users,
  Lock,
  Globe,
  Briefcase,
  MessageSquare,
  LogOut,
  ArrowRight,
  X
} from 'lucide-react';

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
            className={`mt-6 px-6 py-3 rounded-xl shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 ${banner.type === 'success'
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
              }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {banner.type === 'success' ? (
                <div className="p-1 bg-white/20 rounded-full"><ArrowRight className="h-4 w-4" /></div>
              ) : (
                <div className="p-1 bg-white/20 rounded-full"><X className="h-4 w-4" /></div>
              )}
              {banner.text}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-8 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-purple-200" />
                Channels
              </h2>
              <p className="mt-2 text-purple-100 text-lg max-w-2xl">
                Join channels to communicate with your team, share updates, and stay connected.
              </p>
            </div>
            {canCreateChannel && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center justify-center rounded-xl bg-white text-purple-600 px-6 py-3 text-sm font-bold shadow-lg hover:bg-purple-50 hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Channel
              </button>
            )}
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Join & Create Actions */}
          <div className="space-y-8 lg:col-span-1">
            {/* Join by code */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Join with Code</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Enter the invite code shared with you to access a private channel.
              </p>
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCD1234"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <button
                  onClick={() => joinMutation.mutate(joinCode.trim())}
                  disabled={!joinCode.trim() || joinMutation.isPending}
                  className="w-full flex justify-center items-center px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {joinMutation.isPending ? 'Joining...' : 'Join Channel'}
                </button>
              </div>
            </div>

            {/* Quick Create Info */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Start a Community</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Create a new channel to collaborate with your team or discuss specific topics.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
              >
                Create new channel <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Your Channels */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Hash className="h-5 w-5 text-gray-400" />
                  Your Channels
                </h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {myMemberships.length} Joined
                </span>
              </div>

              <div className="p-6">
                {myMemberships.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                      <MessageSquare className="h-full w-full" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">No channels yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Join a channel or create one to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {myMemberships.map((membership: any) => {
                      const channelId = membership.channel_id || membership.channel?.id || membership.id;
                      const channelName = membership.channel?.name || membership.name || 'Channel';
                      const description = membership.channel?.description || membership.description || '';
                      const isPrivate = membership.channel?.is_private || false;
                      const type = membership.channel?.channel_type || 'general';

                      let TypeIcon = Hash;
                      if (type === 'department') TypeIcon = Briefcase;
                      if (type === 'social') TypeIcon = Users;
                      if (type === 'project') TypeIcon = Globe;
                      if (isPrivate) TypeIcon = Lock;

                      return (
                        <div
                          key={channelId}
                          className="group relative bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-purple-300 hover:shadow-md hover:bg-white transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-lg ${isPrivate ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}`}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <Link
                              to={`/channels/${channelId}`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>

                          <Link to={`/channels/${channelId}`} className="block">
                            <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                              {channelName}
                            </h4>
                            <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                              {description || 'No description provided.'}
                            </p>
                          </Link>

                          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                              {type}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                leaveMutation.mutate({ id: channelId, name: channelName });
                              }}
                              disabled={leaveMutation.isPending}
                              className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                            >
                              <LogOut className="h-3 w-3" />
                              Leave
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateForm(false)}></div>

              <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <Plus className="h-5 w-5" />
                      </div>
                      Create New Channel
                    </h3>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Channel Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Hash className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="e.g. team-updates"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="What is this channel about?"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Channel Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.channel_type}
                          onChange={(e) => setFormData({ ...formData, channel_type: e.target.value })}
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="general">General</option>
                          <option value="department">Department</option>
                          <option value="project">Project</option>
                          <option value="social">Social</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_private}
                            onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700 select-none">Make private</span>
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow-sm disabled:opacity-50 transition-all"
                      >
                        {createMutation.isPending ? 'Creating...' : 'Create Channel'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

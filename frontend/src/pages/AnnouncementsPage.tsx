import { useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { announcementsApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import type { Announcement, AnnouncementCreate } from '../lib/types';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';
import { AttachmentList } from '../components/AttachmentList';

import {
  Megaphone,
  FileText,
  Calendar,
  Gift,
  BookOpen,
  Bell,
  Plus,
  Pin,
  Trash2,
  X,
  Filter,
  Clock,
  User
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  COMPANY_NEWS: { label: 'Company News', icon: Megaphone, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  HR_POLICY: { label: 'HR Policy', icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  EVENT: { label: 'Event', icon: Calendar, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  BENEFIT: { label: 'Benefit', icon: Gift, color: 'text-green-600', bgColor: 'bg-green-100' },
  TRAINING: { label: 'Training', icon: BookOpen, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  OTHER: { label: 'Other', icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const getCategoryMeta = (value: string | undefined) =>
  CATEGORY_CONFIG[value || 'OTHER'] ?? CATEGORY_CONFIG['OTHER'];

const formatCreatorName = (announcement: Announcement) =>
  announcement.creator_name || announcement.creator?.full_name || 'HR Team';

export default function AnnouncementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementCreate & { is_pinned: boolean }>({
    title: '',
    content: '',
    category: 'COMPANY_NEWS',
    is_pinned: false,
  });
  const announcementAttachments = useAttachmentUpload(4);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const { hasRole } = useAuth();
  const canManage = hasRole(['hr', 'admin', 'superadmin']);
  const queryClient = useQueryClient();

  // Fetch announcements
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements', selectedCategory],
    queryFn: () =>
      announcementsApi.getAll(selectedCategory !== 'ALL' ? { category: selectedCategory } : undefined),
  });

  const announcements = announcementsData?.announcements || [];
  const pinnedAnnouncements = announcements.filter((a: any) => a.is_pinned);
  const regularAnnouncements = announcements.filter((a: any) => !a.is_pinned);

  const createAnnouncement = useMutation({
    mutationFn: (data: AnnouncementCreate) => announcementsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowCreateModal(false);
      setFormData({
        title: '',
        content: '',
        category: 'COMPANY_NEWS',
        is_pinned: false,
      });
      announcementAttachments.resetAttachments();
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: (vars: { id: number; data: Partial<Announcement> }) =>
      announcementsApi.update(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: number) => announcementsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setSelectedAnnouncement(null);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncement.mutate({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      is_pinned: formData.is_pinned,
      attachments: announcementAttachments.attachmentIds,
    });
  };

  const categoryOptions = ['ALL', ...Object.keys(CATEGORY_CONFIG)];

  const AnnouncementCard = ({ announcement, highlighted = false }: { announcement: Announcement; highlighted?: boolean }) => {
    const meta = getCategoryMeta(announcement.category);
    const Icon = meta.icon;

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSelectedAnnouncement(announcement)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setSelectedAnnouncement(announcement);
          }
        }}
        className={`group relative overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none ${highlighted
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 shadow-md'
          : 'bg-white border border-gray-100 shadow-sm'
          }`}
      >
        {highlighted && (
          <div className="absolute top-0 right-0 p-2">
            <Pin className="h-5 w-5 text-amber-500 fill-amber-500 rotate-45" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${meta.bgColor} ${meta.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.bgColor} ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
              </div>

              <h4 className={`text-lg font-bold mb-2 line-clamp-1 ${highlighted ? 'text-gray-900' : 'text-gray-800'}`}>
                {announcement.title}
              </h4>

              <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                {announcement.content}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-3 w-3" />
                  </div>
                  {formatCreatorName(announcement)}
                </div>

                {announcement.attachments && announcement.attachments.length > 0 && (
                  <span className="text-xs font-medium text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                    <FileText className="h-3 w-3" />
                    {announcement.attachments.length} Attachment{announcement.attachments.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-lg">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Megaphone className="h-8 w-8" />
                Announcements
              </h2>
              <p className="mt-2 text-blue-100 text-lg max-w-xl">
                Stay updated with the latest company news, policies, and events.
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="group flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                Create Announcement
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categoryOptions.map((category) => {
            const isSelected = selectedCategory === category;
            const meta = category === 'ALL' ? null : CATEGORY_CONFIG[category];
            const Icon = meta?.icon;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${isSelected
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
              >
                {category === 'ALL' ? (
                  <Filter className="h-4 w-4" />
                ) : (
                  Icon && <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : meta.color}`} />
                )}
                {category === 'ALL' ? 'All Updates' : meta?.label}
              </button>
            );
          })}
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white rounded-xl shadow-sm animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No announcements found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Pin className="h-5 w-5 text-amber-500 fill-amber-500" />
                  Pinned Updates
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {pinnedAnnouncements.map((announcement: any) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} highlighted />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Announcements */}
            {regularAnnouncements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  Recent Updates
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {regularAnnouncements.map((announcement: any) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && canManage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)}></div>

            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <Plus className="h-5 w-5" />
                    </div>
                    Create Announcement
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. New Office Policy"
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Content <span className="text-red-500">*</span></label>
                    <textarea
                      required
                      rows={6}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your announcement here..."
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachments</label>
                    <div
                      onClick={() => attachmentInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        multiple
                        onChange={(e) => {
                          announcementAttachments.addFiles(e.target.files);
                          e.target.value = '';
                        }}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <FileText className="h-6 w-6 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PDF, DOC, Images (max 4 files)</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <AttachmentPreviewList
                        attachments={announcementAttachments.attachments}
                        onRemove={announcementAttachments.removeAttachment}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.is_pinned}
                            onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-amber-500 checked:bg-amber-500 hover:border-amber-400"
                          />
                          <Pin className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Pin to top</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormData({
                          title: '',
                          content: '',
                          category: 'COMPANY_NEWS',
                          is_pinned: false,
                        });
                      }}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createAnnouncement.isPending}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {createAnnouncement.isPending ? 'Posting...' : 'Publish Announcement'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={() => setSelectedAnnouncement(null)}></div>

            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-8 sm:pb-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${getCategoryMeta(selectedAnnouncement.category).bgColor} ${getCategoryMeta(selectedAnnouncement.category).color}`}>
                      {(() => {
                        const Icon = getCategoryMeta(selectedAnnouncement.category).icon;
                        return <Icon className="h-8 w-8" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedAnnouncement.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className={`px-2.5 py-0.5 rounded-full font-medium ${getCategoryMeta(selectedAnnouncement.category).bgColor} ${getCategoryMeta(selectedAnnouncement.category).color}`}>
                          {getCategoryMeta(selectedAnnouncement.category).label}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {formatCreatorName(selectedAnnouncement)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(selectedAnnouncement.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="prose prose-blue max-w-none mb-8">
                  <p className="text-gray-700 whitespace-pre-line text-base leading-relaxed">
                    {selectedAnnouncement.content}
                  </p>
                </div>

                {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Attachments
                    </h4>
                    <AttachmentList attachments={selectedAnnouncement.attachments} />
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  {canManage ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (!selectedAnnouncement) return;
                          updateAnnouncement.mutate({
                            id: selectedAnnouncement.id,
                            data: { is_pinned: !selectedAnnouncement.is_pinned },
                          });
                          setSelectedAnnouncement({
                            ...selectedAnnouncement,
                            is_pinned: !selectedAnnouncement.is_pinned,
                          });
                        }}
                        disabled={updateAnnouncement.isPending}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedAnnouncement.is_pinned
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Pin className={`h-4 w-4 ${selectedAnnouncement.is_pinned ? 'fill-amber-700' : ''}`} />
                        {selectedAnnouncement.is_pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => {
                          if (!selectedAnnouncement) return;
                          const first = window.confirm('Delete this announcement?');
                          const second = first && window.confirm('Are you sure? This cannot be undone.');
                          if (second) {
                            deleteAnnouncement.mutate(selectedAnnouncement.id);
                          }
                        }}
                        disabled={deleteAnnouncement.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

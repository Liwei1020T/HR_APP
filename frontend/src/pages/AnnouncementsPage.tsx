import { useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import type { Announcement, AnnouncementCreate } from '../lib/types';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';
import { AttachmentList } from '../components/AttachmentList';

const ANNOUNCEMENT_CATEGORIES = [
  { value: 'COMPANY_NEWS', label: 'Company News', icon: '📰' },
  { value: 'HR_POLICY', label: 'HR Policy', icon: '📋' },
  { value: 'EVENT', label: 'Event', icon: '🎉' },
  { value: 'BENEFIT', label: 'Benefit', icon: '💼' },
  { value: 'TRAINING', label: 'Training', icon: '📚' },
  { value: 'OTHER', label: 'Other', icon: '📢' },
] as const;

const getCategoryMeta = (value: string | undefined) =>
  ANNOUNCEMENT_CATEGORIES.find((cat) => cat.value === value) ?? {
    value: value || 'OTHER',
    label: (value || 'OTHER').replace(/_/g, ' '),
    icon: '📢',
  };

const formatCreatorName = (announcement: Announcement) =>
  announcement.creator_name || announcement.creator?.full_name || 'HR Team';

export default function AnnouncementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<AnnouncementCreate & { is_pinned: boolean }>({
    title: '',
    content: '',
    category: ANNOUNCEMENT_CATEGORIES[0].value,
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
        category: ANNOUNCEMENT_CATEGORIES[0].value,
        is_pinned: false,
      });
      announcementAttachments.resetAttachments();
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

  const categoryOptions = ['ALL', ...ANNOUNCEMENT_CATEGORIES.map((cat) => cat.value)];

  const AnnouncementCard = ({ announcement, highlighted = false }: { announcement: Announcement; highlighted?: boolean }) => {
    const meta = getCategoryMeta(announcement.category);

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
        className={`${highlighted ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-white'} rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow focus:outline-none`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{meta.icon}</span>
            <div>
              <h4 className="text-xl font-semibold text-gray-900 flex items-center">
                {announcement.is_pinned && <span className="mr-2">📌</span>}
                {announcement.title}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    highlighted ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {meta.label}
                </span>
                <span>by {formatCreatorName(announcement)}</span>
                <span>•</span>
                <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-gray-700 whitespace-pre-line">{announcement.content}</p>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
            <p className="text-gray-600">Share important company-wide updates</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Create Announcement
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'ALL' ? 'ALL' : getCategoryMeta(category).label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No announcements found.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📌 Pinned Announcements</h3>
                <div className="space-y-4">
                  {pinnedAnnouncements.map((announcement: any) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} highlighted />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Announcements */}
            {regularAnnouncements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Announcements</h3>
                <div className="space-y-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create Announcement</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    announcementAttachments.addFiles(e.target.files);
                    e.target.value = '';
                  }}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="w-full text-xs text-gray-500"
                />
                <AttachmentPreviewList
                  attachments={announcementAttachments.attachments}
                  onRemove={announcementAttachments.removeAttachment}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ANNOUNCEMENT_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-3 pt-6 sm:pt-8">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPinned" className="text-sm text-gray-700">
                    Pin announcement
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      title: '',
                      content: '',
                      category: ANNOUNCEMENT_CATEGORIES[0].value,
                      is_pinned: false,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAnnouncement.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createAnnouncement.isPending ? 'Posting...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  {new Date(selectedAnnouncement.created_at).toLocaleString()}
                </p>
                <h3 className="text-2xl font-semibold text-gray-900">{selectedAnnouncement.title}</h3>
                <p className="text-sm text-gray-600">
                  {getCategoryMeta(selectedAnnouncement.category).label} •{' '}
                  {formatCreatorName(selectedAnnouncement)}
                </p>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>
            <div className="text-gray-800 whitespace-pre-line">{selectedAnnouncement.content}</div>
            <AttachmentList attachments={selectedAnnouncement.attachments} />
            <div className="flex justify-end pt-6">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

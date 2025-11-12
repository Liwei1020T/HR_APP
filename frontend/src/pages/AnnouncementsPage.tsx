import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { announcementsApi } from '../lib/api-client';

export default function AnnouncementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch announcements
  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements', selectedCategory],
    queryFn: () => announcementsApi.getAll(selectedCategory !== 'all' ? { category: selectedCategory } : {}),
  });

  const announcements = announcementsData?.announcements || [];
  const pinnedAnnouncements = announcements.filter((a) => a.is_pinned);
  const regularAnnouncements = announcements.filter((a) => !a.is_pinned);

  const categoryIcon = (category: string) => {
    switch (category) {
      case 'company_news':
        return '📰';
      case 'hr_policy':
        return '📋';
      case 'event':
        return '🎉';
      case 'benefit':
        return '💼';
      case 'training':
        return '📚';
      default:
        return '📢';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          <p className="text-gray-600">Stay updated with company news and updates</p>
        </div>

        {/* Category Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'company_news', 'hr_policy', 'event', 'benefit', 'training', 'other'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.replace('_', ' ').toUpperCase()}
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
                  {pinnedAnnouncements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{categoryIcon(announcement.category)}</span>
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900">{announcement.title}</h4>
                            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
                                {announcement.category.replace('_', ' ')}
                              </span>
                              <span>by {announcement.creator_name}</span>
                              <span>•</span>
                              <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Announcements */}
            {regularAnnouncements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Announcements</h3>
                <div className="space-y-4">
                  {regularAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{categoryIcon(announcement.category)}</span>
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900">{announcement.title}</h4>
                            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                {announcement.category.replace('_', ' ')}
                              </span>
                              <span>by {announcement.creator_name}</span>
                              <span>•</span>
                              <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

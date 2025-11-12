import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { feedbackApi, announcementsApi, notificationsApi } from '../lib/api-client';

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: feedbackData } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => feedbackApi.getAll(),
  });

  const { data: announcementsData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.getAll(),
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getAll({ is_read: false }),
  });

  const stats = [
    {
      name: 'My Feedback',
      value: feedbackData?.feedback?.filter(f => f.submitted_by === user?.id).length || 0,
      icon: '📝',
      color: 'bg-blue-500',
    },
    {
      name: 'Active Announcements',
      value: announcementsData?.total || 0,
      icon: '📢',
      color: 'bg-green-500',
    },
    {
      name: 'Unread Notifications',
      value: notificationsData?.unread_count || 0,
      icon: '🔔',
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Feedback',
      value: feedbackData?.total || 0,
      icon: '📊',
      color: 'bg-purple-500',
    },
  ];

  const recentAnnouncements = announcementsData?.announcements?.slice(0, 3) || [];
  const recentNotifications = notificationsData?.notifications?.slice(0, 5) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name}! 👋
          </h2>
          <p className="mt-2 text-gray-600">
            Here's what's happening in your organization today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 ${stat.color} rounded-lg`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Announcements */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
            </div>
            <div className="p-6">
              {recentAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {announcement.is_pinned && <span className="mr-2">📌</span>}
                            {announcement.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {announcement.content}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            by {announcement.creator_name} • {new Date(announcement.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No announcements yet.</p>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            </div>
            <div className="p-6">
              {recentNotifications.length > 0 ? (
                <div className="space-y-4">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No new notifications.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a
              href="/feedback"
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl mb-2">📝</span>
              <span className="text-sm font-medium text-gray-700">Submit Feedback</span>
            </a>
            <a
              href="/channels"
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl mb-2">💬</span>
              <span className="text-sm font-medium text-gray-700">Join Channels</span>
            </a>
            <a
              href="/announcements"
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl mb-2">📢</span>
              <span className="text-sm font-medium text-gray-700">View Announcements</span>
            </a>
            <a
              href="/notifications"
              className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl mb-2">🔔</span>
              <span className="text-sm font-medium text-gray-700">Notifications</span>
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

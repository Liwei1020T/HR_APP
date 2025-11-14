import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../lib/api-client';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () =>
      notificationsApi.getAll(filter === 'unread' ? { is_read: false } : {}),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unread_count || 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feedback':
        return '📝';
      case 'announcement':
        return '📢';
      case 'channel':
        return '💬';
      case 'system':
        return '⚙️';
      case 'birthday_invite':
        return '🎂';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = (notification: (typeof notifications)[number]) => {
    if (notification.type === 'birthday_invite') {
      const eventId = notification.metadata?.eventId || notification.related_entity_id;
      if (eventId) {
        if (!notification.is_read) {
          markAsReadMutation.mutate(notification.id);
        }
        navigate(`/birthday/${eventId}`);
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
            <p className="text-gray-600">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              ✓ Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50' : ''
                } cursor-pointer`}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleNotificationClick(notification);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-base font-semibold text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        disabled={markAsReadMutation.isPending}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                      >
                        ✓ Mark Read
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

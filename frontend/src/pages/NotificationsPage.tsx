import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../lib/api-client';
import {
  Bell,
  Check,
  Trash2,
  MessageSquare,
  Megaphone,
  Settings,
  Cake,
  Filter,
  CheckCheck,
  Clock
} from 'lucide-react';

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
      queryClient.refetchQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.notifications || [];

  // Apply client-side filter to ensure only unread notifications show when filter is 'unread'
  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notificationsData?.unread_count || 0;

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'feedback':
        return { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'announcement':
        return { icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'channel':
        return { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' };
      case 'system':
        return { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' };
      case 'birthday_invite':
        return { icon: Cake, color: 'text-pink-600', bg: 'bg-pink-100' };
      default:
        return { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' };
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
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-lg">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Notifications
              </h2>
              <p className="mt-2 text-blue-100 text-lg">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'You are all caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="group flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="h-5 w-5" />
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all'
              ? 'bg-gray-900 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Filter className="h-4 w-4" />
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'unread'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Bell className="h-4 w-4" />
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === 'unread' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
                }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-50 rounded-xl shadow-sm animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-gray-100 border-dashed rounded-xl bg-white">
              <div className="p-4 bg-gray-50 rounded-full mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No notifications</h3>
              <p className="text-gray-500 mt-1">
                {filter === 'unread' ? 'You have no unread notifications.' : 'We will notify you when something happens.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification: any) => {
                const { icon: Icon, color, bg } = getTypeConfig(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`group relative p-5 rounded-xl border transition-all duration-200 hover:shadow-md ${!notification.is_read
                      ? 'bg-white border-blue-200 shadow-sm'
                      : 'bg-gray-50/50 border-gray-100'
                      }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    {!notification.is_read && (
                      <div className="absolute top-5 right-5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${bg} ${color} flex-shrink-0`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-base font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 uppercase tracking-wider">
                            {notification.type.replace('_', ' ')}
                          </span>
                        </div>

                        <p className={`text-sm mb-3 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 bottom-4 sm:static sm:opacity-100">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            disabled={markAsReadMutation.isPending}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                            <span className="hidden sm:inline">Read</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(notification.id);
                          }}
                          disabled={deleteMutation.isPending}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
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

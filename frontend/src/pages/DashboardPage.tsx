import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { feedbackApi, announcementsApi, notificationsApi } from '../lib/api-client';

const TOUR_STORAGE_KEY = 'hr-dashboard-tour-completed';

export default function DashboardPage() {
  const { user } = useAuth();
  const statsRef = useRef<HTMLDivElement>(null);
  const announcementsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  const [isTourRunning, setIsTourRunning] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourCompleted, setTourCompleted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  });

  const tourSteps = useMemo(
    () => [
      {
        id: 'stats',
        title: 'Quick stats',
        description: 'See your feedback count, active announcements, and unread notifications all in one place.',
        ref: statsRef,
      },
      {
        id: 'announcements',
        title: 'Announcements',
        description: 'Stay aligned with company news and updates from HR or leadership.',
        ref: announcementsRef,
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Watch for real-time action items about feedback, birthdays, and system alerts.',
        ref: notificationsRef,
      },
      {
        id: 'quick-actions',
        title: 'Quick actions',
        description: 'Use these cards to jump straight into feedback, channels, announcements, or notifications.',
        ref: quickActionsRef,
      },
    ],
    []
  );

  const startTour = useCallback(() => {
    setTourStep(0);
    setIsTourRunning(true);
  }, []);

  const finishTour = useCallback(() => {
    setIsTourRunning(false);
    setTourCompleted(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }
  }, []);

  const handleRestartTour = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOUR_STORAGE_KEY);
    }
    setTourCompleted(false);
    startTour();
  };

  useEffect(() => {
    if (!tourCompleted) {
      startTour();
    }
  }, [tourCompleted, startTour]);

  useEffect(() => {
    if (!isTourRunning) return;
    const ref = tourSteps[tourStep]?.ref.current;
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isTourRunning, tourStep, tourSteps]);

  const handleNext = () => {
    if (tourStep === tourSteps.length - 1) {
      finishTour();
    } else {
      setTourStep((prev) => Math.min(prev + 1, tourSteps.length - 1));
    }
  };

  const handleBack = () => {
    setTourStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCloseTour = () => {
    finishTour();
  };

  const currentTourStep = tourSteps[tourStep];
  const highlightStep = (stepId: string) => isTourRunning && currentTourStep?.id === stepId;

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
      value: feedbackData?.feedback?.filter((f: any) => f.submitted_by === user?.id).length || 0,
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
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestartTour}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tourCompleted ? 'Restart welcome tour' : 'Launch welcome tour'}
            </button>
            {!tourCompleted && (
              <p className="text-xs text-gray-500">
                The tour runs once automatically per browser session.
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div
          ref={statsRef}
          className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 transition duration-300 ${highlightStep(
            'stats'
          )
            ? 'ring-4 ring-blue-300 shadow-2xl'
            : ''}`}
        >
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
          <div
            ref={announcementsRef}
            className={`bg-white rounded-lg shadow transition duration-300 ${
              highlightStep('announcements') ? 'ring-4 ring-blue-300' : ''
            }`}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
            </div>
            <div className="p-6">
              {recentAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {recentAnnouncements.map((announcement: any) => (
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
                            by {announcement.creator_name || announcement.creator?.full_name || 'HR Team'} • {new Date(announcement.created_at).toLocaleDateString()}
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
          <div
            ref={notificationsRef}
            className={`bg-white rounded-lg shadow transition duration-300 ${
              highlightStep('notifications') ? 'ring-4 ring-blue-300' : ''
            }`}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            </div>
            <div className="p-6">
              {recentNotifications.length > 0 ? (
                <div className="space-y-4">
                  {recentNotifications.map((notification: any) => (
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
        <div
          ref={quickActionsRef}
          className={`bg-white rounded-lg shadow p-6 transition duration-300 ${
            highlightStep('quick-actions') ? 'ring-4 ring-blue-300 shadow-2xl' : ''
          }`}
        >
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
        {/* Guided tour overlay */}
        {isTourRunning && currentTourStep && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40" aria-hidden="true"></div>
            <div className="fixed inset-x-4 bottom-6 z-50 flex justify-center">
              <div className="max-w-xl w-full rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">{currentTourStep.title}</h4>
                  <button
                    type="button"
                    onClick={handleCloseTour}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Skip
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-600">{currentTourStep.description}</p>
                <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Step {tourStep + 1} / {tourSteps.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={tourStep === 0}
                      className="rounded-full border border-gray-300 px-4 py-1 text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="rounded-full bg-blue-600 px-4 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {tourStep === tourSteps.length - 1 ? 'Finish tour' : 'Next step'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

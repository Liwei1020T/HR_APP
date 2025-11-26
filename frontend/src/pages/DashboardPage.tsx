import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { feedbackApi, announcementsApi, notificationsApi } from '../lib/api-client';
import {
  FileText,
  Megaphone,
  Bell,
  BarChart2,
  Send,

  MessageSquare,
  ArrowRight,
  Pin
} from 'lucide-react';

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
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Active Announcements',
      value: announcementsData?.total || 0,
      icon: Megaphone,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Unread Notifications',
      value: notificationsData?.unread_count || 0,
      icon: Bell,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Total Feedback',
      value: feedbackData?.total || 0,
      icon: BarChart2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const recentAnnouncements = announcementsData?.announcements?.slice(0, 3) || [];
  const recentNotifications = notificationsData?.notifications?.slice(0, 5) || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-lg">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  Welcome back, {user?.full_name}! 👋
                </h2>
                <p className="mt-2 text-blue-100 text-lg">
                  Here's what's happening in your organization today.
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <button
                  type="button"
                  onClick={handleRestartTour}
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-white/20 transition-all duration-200 border border-white/20"
                >
                  {tourCompleted ? 'Restart Tour' : 'Start Tour'}
                </button>
                {!tourCompleted && (
                  <p className="text-xs text-blue-200">
                    Runs automatically once per session
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        </div>

        {/* Stats Grid */}
        <div
          ref={statsRef}
          className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-300 ${highlightStep('stats') ? 'ring-4 ring-blue-300 shadow-2xl scale-[1.02]' : ''
            }`}
        >
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform duration-200`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Announcements */}
          <div
            ref={announcementsRef}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 flex flex-col ${highlightStep('announcements') ? 'ring-4 ring-blue-300' : ''
              }`}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-600" />
                Recent Announcements
              </h3>
              <a href="/announcements" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="p-6 flex-1">
              {recentAnnouncements.length > 0 ? (
                <div className="space-y-6">
                  {recentAnnouncements.map((announcement: any) => (
                    <div key={announcement.id} className="group relative pl-4 border-l-2 border-gray-100 hover:border-blue-500 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {announcement.is_pinned && <Pin className="inline-block h-3 w-3 mr-1 text-blue-500 rotate-45" />}
                            {announcement.title}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {announcement.content}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-medium text-gray-600">
                              {announcement.creator_name || announcement.creator?.full_name || 'HR Team'}
                            </span>
                            <span>•</span>
                            <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="p-3 bg-gray-50 rounded-full mb-3">
                    <Megaphone className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No announcements yet</p>
                  <p className="text-sm text-gray-500 mt-1">Check back later for updates.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div
            ref={notificationsRef}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 flex flex-col ${highlightStep('notifications') ? 'ring-4 ring-blue-300' : ''
              }`}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                Recent Notifications
              </h3>
              <a href="/notifications" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="p-6 flex-1">
              {recentNotifications.length > 0 ? (
                <div className="space-y-4">
                  {recentNotifications.map((notification: any) => (
                    <div key={notification.id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full ring-4 ring-blue-50"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-1">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="p-3 bg-gray-50 rounded-full mb-3">
                    <Bell className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">All caught up!</p>
                  <p className="text-sm text-gray-500 mt-1">No new notifications to display.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          ref={quickActionsRef}
          className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 transition-all duration-300 ${highlightStep('quick-actions') ? 'ring-4 ring-blue-300 shadow-2xl' : ''
            }`}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <a
              href="/feedback"
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50/50 transition-all duration-200"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-200">
                <Send className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">Submit Feedback</span>
            </a>
            <a
              href="/channels"
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md hover:bg-purple-50/50 transition-all duration-200"
            >
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-200">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700">Join Channels</span>
            </a>
            <a
              href="/announcements"
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md hover:bg-green-50/50 transition-all duration-200"
            >
              <div className="p-3 bg-green-100 text-green-600 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-200">
                <Megaphone className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-green-700">View Announcements</span>
            </a>
            <a
              href="/notifications"
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-gray-200 hover:border-yellow-500 hover:shadow-md hover:bg-yellow-50/50 transition-all duration-200"
            >
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-200">
                <Bell className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-yellow-700">Notifications</span>
            </a>
          </div>
        </div>
        {/* Guided tour overlay */}
        {isTourRunning && currentTourStep && (
          <>
            <div className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true"></div>
            <div className="fixed inset-x-4 bottom-6 z-50 flex justify-center">
              <div className="max-w-xl w-full rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 transform transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900">{currentTourStep.title}</h4>
                  <button
                    type="button"
                    onClick={handleCloseTour}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Skip Tour
                  </button>
                </div>
                <p className="text-gray-600 leading-relaxed">{currentTourStep.description}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Step {tourStep + 1} of {tourSteps.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={tourStep === 0}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                    >
                      {tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
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

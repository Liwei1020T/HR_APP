import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../lib/api-client';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Fetch unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getAll({ is_read: false }),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const unreadCount = notificationsData?.unread_count || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊', roles: ['employee', 'hr', 'admin', 'superadmin'] },
    {
      name: 'Feedback',
      href: '/feedback',
      icon: '📝',
      roles: ['employee', 'hr', 'admin', 'superadmin'],
      subItems: [
        { name: 'My Feedback', href: '/feedback', roles: ['employee', 'hr', 'admin', 'superadmin'] },
        { name: 'Dashboard', href: '/admin/feedback', roles: ['hr', 'admin', 'superadmin'] },
      ]
    },
    { name: 'Channels', href: '/channels', icon: '💬', roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'Direct Chat', href: '/direct-messages', icon: '💭', roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'Announcements', href: '/announcements', icon: '📢', roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'Notifications', href: '/notifications', icon: '🔔', roles: ['employee', 'hr', 'admin', 'superadmin'], badge: unreadCount },
    { name: 'Admin', href: '/admin', icon: '⚙️', roles: ['hr', 'admin', 'superadmin'], attribute: true },
    { name: 'Birthdays', href: '/admin/birthdays', icon: '🎂', roles: ['hr', 'admin', 'superadmin'], attribute: true },
  ];

  const filteredNavigation = navigation.filter(item => hasRole(item.roles));

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    if (href === '/admin') {
      // Avoid highlighting Admin on deeper admin pages like /admin/feedback
      return location.pathname === '/admin';
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const toggleExpand = (name: string) => {
    setExpandedItem(expandedItem === name ? null : name);
  };

  // Keep the relevant parent menu expanded based on current route
  useEffect(() => {
    const parentWithMatch = filteredNavigation.find(
      (item: any) =>
        item.subItems &&
        item.subItems.some(
          (sub: any) =>
            location.pathname === sub.href ||
            location.pathname.startsWith(sub.href + '/')
        )
    );
    if (parentWithMatch) {
      setExpandedItem(parentWithMatch.name);
    }
  }, [location.pathname, filteredNavigation]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out border-r border-gray-200`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
            <Link to="/" className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">🏢</span>
              HR APP
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Navigation Header */}
          <div className="px-4 pt-6 pb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item: any) => (
              <div key={item.name}>
                {item.subItems ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-blue-50 hover:text-blue-600`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-xl">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedItem === item.name ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedItem === item.name && (
                      <div className="pl-12 space-y-1">
                        {item.subItems.filter((sub: any) => hasRole(sub.roles)).map((subItem: any) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${location.pathname === subItem.href
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive(item.href)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                  >
                    <span className="mr-3 text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${isActive(item.href)
                          ? 'bg-white text-blue-600'
                          : 'bg-red-500 text-white'
                        }`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center mb-4 w-full text-left hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role}
                </p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center h-16 bg-white border-b border-gray-200 px-4 lg:px-8 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="flex-1 text-2xl font-semibold text-gray-900">
            {navigation.find(item => isActive(item.href))?.name || 'HR APP'}
          </h1>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Welcome,{' '}
              <button
                onClick={() => navigate('/profile')}
                className="font-medium text-blue-700 hover:underline"
              >
                {user?.full_name}
              </button>
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

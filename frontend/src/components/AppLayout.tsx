import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../lib/api-client';
import {
  LayoutDashboard,
  MessageSquare,
  Hash,
  MessageCircle,
  Megaphone,
  Bell,
  Settings,
  Cake,
  Wrench,
  Building2,
  LogOut,
  Menu,
  ChevronDown,
  Search,
  User,
  X
} from 'lucide-react';

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
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    {
      name: 'Feedback',
      href: '/feedback',
      icon: MessageSquare,
      roles: ['employee', 'hr', 'admin', 'superadmin'],
      subItems: [
        { name: 'My Feedback', href: '/feedback', roles: ['employee', 'hr', 'admin', 'superadmin'] },
        { name: 'Dashboard', href: '/admin/feedback', roles: ['hr', 'admin', 'superadmin'] },
      ]
    },
    { name: 'Channels', href: '/channels', icon: Hash, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'Direct Chat', href: '/direct-messages', icon: MessageCircle, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'Announcements', href: '/announcements', icon: Megaphone, roles: ['employee', 'hr', 'admin', 'superadmin'] },
    { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['employee', 'hr', 'admin', 'superadmin'], badge: unreadCount },
    { name: 'Admin', href: '/admin', icon: Settings, roles: ['hr', 'admin', 'superadmin'], attribute: true },
    { name: 'Birthdays', href: '/admin/birthdays', icon: Cake, roles: ['hr', 'admin', 'superadmin'], attribute: true },
    { name: 'Vendor', href: '/vendor/feedback', icon: Wrench, roles: ['vendor'], attribute: true },
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
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out border-r border-gray-100`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-8 bg-white border-b border-gray-100">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-200 group-hover:shadow-blue-300 transition-all duration-300 group-hover:scale-105">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 tracking-tight">HR APP</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Header */}
          <div className="px-6 pt-8 pb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-[1px] bg-gray-200"></span>
              Main Menu
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {filteredNavigation.map((item: any) => (
              <div key={item.name}>
                {item.subItems ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${expandedItem === item.name
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 transition-colors ${expandedItem === item.name ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                          }`} />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${expandedItem === item.name ? 'transform rotate-180 text-blue-600' : 'text-gray-400'}`}
                      />
                    </button>
                    {expandedItem === item.name && (
                      <div className="pl-4 space-y-1 mt-1">
                        {item.subItems.filter((sub: any) => hasRole(sub.roles)).map((subItem: any) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors border-l-2 ml-4 ${location.pathname === subItem.href
                              ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
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
                    className={`relative flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className={`h-5 w-5 mr-3 transition-colors ${isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm ${isActive(item.href)
                        ? 'bg-white/20 text-white backdrop-blur-sm'
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
          <div className="p-4 m-4 bg-gray-50 rounded-2xl border border-gray-100">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 w-full text-left hover:bg-white p-2 rounded-xl transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm group-hover:shadow-md transition-all">
                {user?.full_name?.charAt(0) || <User className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate font-medium">
                  {user?.role}
                </p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 transition-all duration-300">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {navigation.find(item => isActive(item.href))?.name || 'HR APP'}
            </h1>
            {/* Optional: Add a search bar here if needed */}
            <div className="hidden md:flex items-center max-w-md flex-1 ml-8">
              <div className="relative w-full max-w-xs group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs text-gray-500 font-medium">Welcome back,</span>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {user?.full_name}
              </button>
            </div>
            <button
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

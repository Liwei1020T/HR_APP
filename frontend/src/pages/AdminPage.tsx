import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { adminApi, usersApi } from '../lib/api-client';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'audit'>('metrics');

  // Fetch system metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => adminApi.getSystemMetrics(),
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    enabled: activeTab === 'users',
  });

  // Fetch audit logs
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminApi.getAuditLogs(),
    enabled: activeTab === 'audit',
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">System overview and management</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'metrics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 System Metrics
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Users
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'audit'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 Audit Logs
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'metrics' && (
              <div>
                {metricsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading metrics...</div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(metricsData || {}).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-600 capitalize">
                            {key.replace('_', ' ')}
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">
                            {typeof value === 'number' ? value : JSON.stringify(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                {usersLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading users...</div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      All Users ({usersData?.total || 0})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {usersData?.users?.map((user: any) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.full_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium uppercase">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.department || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    user.is_active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div>
                {auditLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Activity ({auditData?.total || 0} events)
                    </h3>
                    <div className="space-y-3">
                      {auditData?.logs?.map((log: any) => (
                        <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900">
                                  {log.user_name || 'System'}
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  {log.event_type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{log.description || log.action}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(log.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

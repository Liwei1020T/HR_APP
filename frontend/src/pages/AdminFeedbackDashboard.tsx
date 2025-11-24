import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, feedbackApi } from '../lib/api-client';
import AppLayout from '../components/AppLayout';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { AlertTriangle, CheckCircle, Clock, MessageSquare, FileText, Filter } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminFeedbackDashboard() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints' | 'urgent' | 'reports'>('dashboard');

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['admin-feedback-stats'],
        queryFn: () => adminApi.getFeedbackStats(),
    });

    // Fetch all feedback for lists
    const { data: feedbackData } = useQuery({
        queryKey: ['admin-feedback-list', activeTab],
        queryFn: () => feedbackApi.getAll(),
        enabled: activeTab === 'complaints' || activeTab === 'urgent',
    });

    const urgentFeedback = feedbackData?.feedback?.filter((f: any) => f.priority === 'URGENT') || [];
    const allFeedback = feedbackData?.feedback || [];

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Feedback Dashboard</h2>
                        <p className="text-gray-600">AI-Powered Insights & Management</p>
                    </div>
                    <div className="flex space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                            AI Analysis Active
                        </span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-4 px-6" aria-label="Tabs">
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: <BarChart className="w-4 h-4 mr-2" /> },
                                { id: 'complaints', label: 'All Complaints', icon: <MessageSquare className="w-4 h-4 mr-2" /> },
                                { id: 'urgent', label: 'Urgent', icon: <AlertTriangle className="w-4 h-4 mr-2" /> },
                                { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4 mr-2" /> },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.id === 'urgent' && stats?.urgentCount > 0 && (
                                        <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                                            {stats.urgentCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* DASHBOARD VIEW */}
                        {activeTab === 'dashboard' && (
                            <div className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <StatCard
                                        title="Total Complaints"
                                        value={stats?.totalComplaints || 0}
                                        icon={<MessageSquare className="w-6 h-6 text-blue-600" />}
                                        trend="+8.2% this week"
                                    />
                                    <StatCard
                                        title="Resolution Rate"
                                        value={`${stats?.resolutionRate || 0}%`}
                                        icon={<CheckCircle className="w-6 h-6 text-green-600" />}
                                        trend="+3.5%"
                                    />
                                    <StatCard
                                        title="Urgent Cases"
                                        value={stats?.urgentCount || 0}
                                        icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
                                        subtext="Require immediate attention"
                                        alert
                                    />
                                    <StatCard
                                        title="Avg Response Time"
                                        value={stats?.avgResponseTime || '0h'}
                                        icon={<Clock className="w-6 h-6 text-orange-600" />}
                                        trend="-12% faster"
                                    />
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Trend Chart */}
                                    <div className="lg:col-span-2 bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4">Complaint Trends (Last 7 Days)</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats?.trends || []}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="complaints" fill="#3B82F6" name="Complaints" />
                                                    <Bar dataKey="resolved" fill="#10B981" name="Resolved" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Distribution Chart */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats?.statusDistribution || []}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {(stats?.statusDistribution || []).map((_entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* COMPLAINTS & URGENT LISTS */}
                        {(activeTab === 'complaints' || activeTab === 'urgent') && (
                            <div>
                                <div className="flex justify-between mb-4">
                                    <h3 className="text-lg font-semibold">
                                        {activeTab === 'urgent' ? 'Urgent Attention Required' : 'All Feedback Submissions'}
                                    </h3>
                                    <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                                        <Filter className="w-4 h-4 mr-2" />
                                        Filter
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Analysis</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {(activeTab === 'urgent' ? urgentFeedback : allFeedback).map((item: any) => (
                                                <tr key={item.id} className={item.priority === 'URGENT' ? 'bg-red-50' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <PriorityBadge priority={item.priority} />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.category}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <StatusBadge status={item.status} />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                                        {item.ai_analysis ? (
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0 mt-0.5">✨</div>
                                                                <p className="ml-2 text-xs">{item.ai_analysis}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Pending analysis...</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.created_at}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button className="text-blue-600 hover:text-blue-900">View</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* REPORTS VIEW */}
                        {activeTab === 'reports' && (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Reports Generation</h3>
                                <p className="text-gray-500 mt-2">Select date range and format to export feedback reports.</p>
                                <div className="mt-6 space-x-4">
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                        Export CSV
                                    </button>
                                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                                        Export PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatCard({ title, value, icon, trend, subtext, alert }: any) {
    return (
        <div className={`bg-white rounded-lg p-6 shadow ${alert ? 'border-l-4 border-red-500' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${alert ? 'bg-red-100' : 'bg-gray-100'}`}>
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-medium ${trend.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtext && <p className="text-xs text-red-500 mt-1 font-medium">{subtext}</p>}
        </div>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const styles = {
        URGENT: 'bg-red-100 text-red-800 border-red-200',
        HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
        MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        LOW: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${styles[priority as keyof typeof styles] || styles.MEDIUM}`}>
            {priority}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        SUBMITTED: 'bg-blue-100 text-blue-800',
        UNDER_REVIEW: 'bg-purple-100 text-purple-800',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
        RESOLVED: 'bg-green-100 text-green-800',
        CLOSED: 'bg-gray-100 text-gray-800',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.SUBMITTED}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

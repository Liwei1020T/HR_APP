import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
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
    LineChart,
    Line,
} from 'recharts';
import { AlertTriangle, CheckCircle, Clock, MessageSquare, FileText, Filter } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminFeedbackDashboard() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints' | 'urgent' | 'reports'>('dashboard');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [assignedFilter, setAssignedFilter] = useState<string>('all');
    const [slaFilter, setSlaFilter] = useState<string>('all');
    const [onlyAtRisk, setOnlyAtRisk] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [reportRange, setReportRange] = useState<'7d' | '30d' | 'custom'>('7d');
    const [reportFrom, setReportFrom] = useState<string>('');
    const [reportTo, setReportTo] = useState<string>('');
    const [reportResult, setReportResult] = useState<{ summary: string; insights: string[] } | null>(null);

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['admin-feedback-stats'],
        queryFn: () => adminApi.getFeedbackStats(),
    });

    // Fetch all feedback for lists (complaints/urgent)
    const { data: feedbackData } = useQuery({
        queryKey: ['admin-feedback-list', activeTab, statusFilter, priorityFilter, assignedFilter, slaFilter, onlyAtRisk, searchTerm],
        queryFn: () =>
            feedbackApi.getAll({
                ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
                ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
                ...(assignedFilter !== 'all' ? { assigned: assignedFilter } : {}),
                ...(slaFilter !== 'all' ? { sla: slaFilter } : {}),
                ...(onlyAtRisk ? { sla: 'AT_RISK' } : {}),
                ...(searchTerm ? { q: searchTerm } : {}),
            }),
        enabled: activeTab === 'complaints' || activeTab === 'urgent',
    });

    // Fetch feedback for reports tab (to drive charts)
    const { data: reportFeedbackData, isLoading: reportFeedbackLoading } = useQuery({
        queryKey: ['admin-feedback-report-list', statusFilter, priorityFilter, reportRange, reportFrom, reportTo],
        queryFn: () =>
            feedbackApi.getAll({
                ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
                ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
            }),
        enabled: activeTab === 'reports',
    });

    const urgentFeedback = feedbackData?.feedback?.filter((f: any) => f.priority === 'URGENT') || [];
    const allFeedback = feedbackData?.feedback || [];
    const reportFeedback = reportFeedbackData?.feedback || [];

    const statusChartData = useMemo(() => {
        const map: Record<string, number> = {};
        reportFeedback.forEach((f: any) => {
            map[f.status] = (map[f.status] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [reportFeedback]);

    const priorityChartData = useMemo(() => {
        const map: Record<string, number> = {};
        reportFeedback.forEach((f: any) => {
            map[f.priority || 'MEDIUM'] = (map[f.priority || 'MEDIUM'] || 0) + 1;
        });
        return ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => ({ name: p, value: map[p] || 0 }));
    }, [reportFeedback]);

    const trendChartData = useMemo(() => {
        const days = reportRange === '30d' ? 30 : 7;
        const buckets: Record<string, { date: string; submitted: number; resolved: number }> = {};
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            buckets[key] = {
                date: `${d.getMonth() + 1}/${d.getDate()}`,
                submitted: 0,
                resolved: 0,
            };
        }
        reportFeedback.forEach((f: any) => {
            const d = new Date(f.created_at);
            const key = d.toISOString().split('T')[0];
            if (buckets[key]) {
                buckets[key].submitted += 1;
                if (['RESOLVED', 'CLOSED'].includes(f.status)) {
                    buckets[key].resolved += 1;
                }
            }
        });
        return Object.values(buckets);
    }, [reportFeedback, reportRange]);

    const formatTrend = (val?: number) => {
        if (val === undefined || val === null) return '';
        return `${val >= 0 ? '+' : ''}${val}%`;
    };

    const formatSpeedTrend = (val?: number) => {
        if (val === undefined || val === null) return '';
        return val >= 0 ? `-${val}% faster` : `+${Math.abs(val)}% slower`;
    };

    const aiReportMutation = useMutation({
        mutationFn: () =>
            adminApi.generateAiReport({
                range: reportRange,
                ...(reportRange === 'custom' ? { from: reportFrom, to: reportTo } : {}),
                status: statusFilter !== 'all' ? statusFilter : undefined,
                priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            }),
        onSuccess: (data) => setReportResult({ summary: data.summary, insights: data.insights }),
    });

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
                                        trend={formatTrend(stats?.totalTrend)}
                                    />
                                    <StatCard
                                        title="Resolution Rate"
                                        value={`${stats?.resolutionRate || 0}%`}
                                        icon={<CheckCircle className="w-6 h-6 text-green-600" />}
                                        trend={formatTrend(stats?.resolutionRateTrend)}
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
                                        value={`${stats?.avgResponseHours || 0}h`}
                                        icon={<Clock className="w-6 h-6 text-orange-600" />}
                                        trend={formatSpeedTrend(stats?.avgResponseTrend)}
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
                                <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                                    <h3 className="text-lg font-semibold">
                                        {activeTab === 'urgent' ? 'Urgent Attention Required' : 'All Feedback Submissions'}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search title/description"
                                                className="border border-gray-300 rounded px-2 py-1 bg-white"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-600">Priority:</span>
                                            <select
                                                value={priorityFilter}
                                                onChange={(e) => setPriorityFilter(e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 bg-white"
                                            >
                                                <option value="all">All</option>
                                                <option value="URGENT">Urgent</option>
                                                <option value="HIGH">High</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="LOW">Low</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-600">Assigned:</span>
                                            <select
                                                value={assignedFilter}
                                                onChange={(e) => setAssignedFilter(e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 bg-white"
                                            >
                                                <option value="all">All</option>
                                                <option value="assigned">Assigned</option>
                                                <option value="unassigned">Unassigned</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-600">SLA:</span>
                                            <select
                                                value={slaFilter}
                                                onChange={(e) => setSlaFilter(e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 bg-white"
                                            >
                                                <option value="all">All</option>
                                                <option value="NORMAL">Normal</option>
                                                <option value="WARNING">Warning</option>
                                                <option value="BREACHED">Breached</option>
                                            </select>
                                        </div>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={onlyAtRisk}
                                                onChange={(e) => setOnlyAtRisk(e.target.checked)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            />
                                            <span className="text-gray-600">SLA Warning/Breached</span>
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-600">Status:</span>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 bg-white"
                                            >
                                                <option value="all">All</option>
                                                <option value="SUBMITTED">Submitted</option>
                                                <option value="UNDER_REVIEW">Under Review</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="RESOLVED">Resolved</option>
                                                <option value="CLOSED">Closed</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setPriorityFilter('all');
                                                setAssignedFilter('all');
                                                setSlaFilter('all');
                                                setOnlyAtRisk(false);
                                                setStatusFilter('all');
                                            }}
                                            className="flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Filter className="w-4 h-4 mr-1" />
                                            Clear
                                        </button>
                                    </div>
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
                                                        <Link
                                                            to={`/feedback/${item.id}`}
                                                            state={{ from: 'admin-feedback' }}
                                                            className="text-blue-600 hover:text-blue-900 hover:underline font-medium"
                                                        >
                                                            View
                                                        </Link>
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
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">AI Report</h3>
                                                <p className="text-sm text-gray-500">Generate a concise report for your assigned feedback</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-gray-600">Range</label>
                                                <select
                                                    value={reportRange}
                                                    onChange={(e) => setReportRange(e.target.value as any)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                >
                                                    <option value="7d">Last 7 days</option>
                                                    <option value="30d">Last 30 days</option>
                                                    <option value="custom">Custom</option>
                                                </select>
                                            </div>
                                            {reportRange === 'custom' && (
                                                <>
                                                    <div>
                                                        <label className="text-sm text-gray-600">From</label>
                                                        <input
                                                            type="date"
                                                            value={reportFrom}
                                                            onChange={(e) => setReportFrom(e.target.value)}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm text-gray-600">To</label>
                                                        <input
                                                            type="date"
                                                            value={reportTo}
                                                            onChange={(e) => setReportTo(e.target.value)}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                            <div>
                                                <label className="text-sm text-gray-600">Status</label>
                                                <select
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                >
                                                    <option value="all">All</option>
                                                    <option value="SUBMITTED">Submitted</option>
                                                    <option value="UNDER_REVIEW">Under Review</option>
                                                    <option value="IN_PROGRESS">In Progress</option>
                                                    <option value="RESOLVED">Resolved</option>
                                                    <option value="CLOSED">Closed</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">Priority</label>
                                                <select
                                                    value={priorityFilter}
                                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                >
                                                    <option value="all">All</option>
                                                    <option value="URGENT">Urgent</option>
                                                    <option value="HIGH">High</option>
                                                    <option value="MEDIUM">Medium</option>
                                                    <option value="LOW">Low</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => aiReportMutation.mutate()}
                                                disabled={aiReportMutation.isPending}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {aiReportMutation.isPending ? 'Generating...' : 'Generate AI Report'}
                                            </button>
                                            {aiReportMutation.isError && (
                                                <span className="text-sm text-red-600">Failed to generate. Retry.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-6 space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900">Report Output</h3>
                                        {aiReportMutation.isPending && <p className="text-gray-500">AI is generating your report...</p>}
                                        {!aiReportMutation.isPending && reportResult && (
                                            <div className="space-y-3">
                                                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{reportResult.summary}</p>
                                                <div className="space-y-1">
                                                    {reportResult.insights.map((item, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                                            <span className="mt-1 text-blue-600">•</span>
                                                            <span>{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {!aiReportMutation.isPending && !reportResult && (
                                            <p className="text-gray-500 text-sm">Generate a report to see AI insights.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-lg shadow p-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Status Distribution</h4>
                                        {reportFeedbackLoading ? (
                                            <p className="text-gray-500 text-sm">Loading...</p>
                                        ) : statusChartData.length === 0 ? (
                                            <p className="text-gray-500 text-sm">No data in this range.</p>
                                        ) : (
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                                                            {statusChartData.map((_entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Priority Breakdown</h4>
                                        {reportFeedbackLoading ? (
                                            <p className="text-gray-500 text-sm">Loading...</p>
                                        ) : (
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={priorityChartData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis allowDecimals={false} />
                                                        <Tooltip />
                                                        <Bar dataKey="value" fill="#3B82F6" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Submissions vs Resolved (Trend)</h4>
                                        {reportFeedbackLoading ? (
                                            <p className="text-gray-500 text-sm">Loading...</p>
                                        ) : (
                                            <div className="h-72">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={trendChartData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis allowDecimals={false} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="submitted" stroke="#3B82F6" name="Submitted" />
                                                        <Line type="monotone" dataKey="resolved" stroke="#10B981" name="Resolved" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
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

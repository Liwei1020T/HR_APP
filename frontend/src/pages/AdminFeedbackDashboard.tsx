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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints' | 'urgent' | 'reports' | 'approvals'>('dashboard');
    const userRole = (localStorage.getItem('role') || '').toUpperCase();
    const isSuperAdmin = userRole === 'SUPERADMIN';
    const canSeeVendorFilters = ['SUPERADMIN', 'ADMIN', 'HR'].includes(userRole);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [assignedFilter, setAssignedFilter] = useState<string>('all');
    const [slaFilter, setSlaFilter] = useState<string>('all');
    const [onlyAtRisk, setOnlyAtRisk] = useState<boolean>(false);
    const [vendorStatusFilter, setVendorStatusFilter] = useState<string>('all');
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
        queryKey: ['admin-feedback-list', activeTab, statusFilter, priorityFilter, assignedFilter, slaFilter, onlyAtRisk, searchTerm, vendorStatusFilter],
        queryFn: () =>
            feedbackApi.getAll({
                ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
                ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
                ...(assignedFilter !== 'all' ? { assigned: assignedFilter } : {}),
                ...(slaFilter !== 'all' ? { sla: slaFilter } : {}),
                ...(onlyAtRisk ? { sla: 'AT_RISK' } : {}),
                ...(searchTerm ? { q: searchTerm } : {}),
                ...(vendorStatusFilter !== 'all' ? { vendor_status: vendorStatusFilter } : {}),
                ...(activeTab === 'approvals' ? { vendor_status: 'VENDOR_REPLIED' } : {}),
            }),
        enabled: activeTab === 'complaints' || activeTab === 'urgent' || activeTab === 'approvals',
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
    const approvalsFeedback = feedbackData?.feedback?.filter((f: any) => f.vendor_status === 'VENDOR_REPLIED') || [];
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
                        <nav
                            className="flex space-x-3 px-4 sm:px-6 overflow-x-auto no-scrollbar"
                            aria-label="Tabs"
                        >
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: <BarChart className="w-4 h-4 mr-2" /> },
                                { id: 'complaints', label: 'All Complaints', icon: <MessageSquare className="w-4 h-4 mr-2" /> },
                                { id: 'urgent', label: 'Urgent', icon: <AlertTriangle className="w-4 h-4 mr-2" /> },
                                { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4 mr-2" /> },
                                ...(isSuperAdmin
                                    ? [{ id: 'approvals', label: 'Approvals', icon: <FileText className="w-4 h-4 mr-2" /> }]
                                    : []),
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`py-4 px-3 border-b-2 font-medium text-sm transition-colors flex items-center flex-shrink-0 ${activeTab === tab.id
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

                        {/* COMPLAINTS, URGENT, APPROVALS LISTS */}
                        {(activeTab === 'complaints' || activeTab === 'urgent' || activeTab === 'approvals') && (
                            <div>
                                <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                                    <h3 className="text-lg font-semibold">
                                        {activeTab === 'urgent'
                                            ? 'Urgent Attention Required'
                                            : activeTab === 'approvals'
                                                ? 'Pending Superadmin Approval'
                                                : 'All Feedback Submissions'}
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
                                        {canSeeVendorFilters && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-600">Vendor:</span>
                                                <select
                                                    value={vendorStatusFilter}
                                                    onChange={(e) => setVendorStatusFilter(e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 bg-white"
                                                >
                                                    <option value="all">All</option>
                                                    <option value="VENDOR_REPLIED">Needs Approval</option>
                                                    <option value="APPROVED">Approved</option>
                                                    <option value="REJECTED">Rejected</option>
                                                </select>
                                            </div>
                                        )}
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
                                                setVendorStatusFilter('all');
                                            }}
                                            className="flex items-center px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            <Filter className="w-4 h-4 mr-1" />
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm max-h-[calc(100vh-300px)] overflow-y-auto relative">
                                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                                                <th className="w-[25%] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                                                <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                                <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Analysis</th>
                                                <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                                                <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="w-[5%] px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {(activeTab === 'urgent'
                                                ? urgentFeedback
                                                : activeTab === 'approvals'
                                                    ? approvalsFeedback
                                                    : allFeedback
                                            ).map((item: any) => (
                                                <tr
                                                    key={item.id}
                                                    className={`hover:bg-gray-50 transition-colors ${item.priority === 'URGENT' ? 'bg-red-50/50' : ''}`}
                                                >
                                                    <td className="px-4 py-3 whitespace-nowrap align-top">
                                                        <PriorityBadge priority={item.priority} />
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        <div className="text-sm font-semibold text-gray-900 truncate" title={item.title}>{item.title}</div>
                                                        <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 align-top">
                                                        {item.category}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap align-top">
                                                        <StatusBadge status={item.status} />
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        {item.ai_analysis ? (
                                                            <div className="group relative">
                                                                <div className="flex items-start gap-1.5">
                                                                    <span className="flex-shrink-0 mt-0.5 text-blue-500">✨</span>
                                                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed" title={item.ai_analysis}>
                                                                        {item.ai_analysis}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Pending analysis...</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 align-top">
                                                        <div className="flex flex-col gap-1">
                                                            <VendorStatusBadge status={item.vendor_status} />
                                                            {item.vendor_due_at && (
                                                                <span className="text-[10px] text-gray-400">Due: {new Date(item.vendor_due_at).toLocaleDateString()}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 align-top">
                                                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium align-top">
                                                        <Link
                                                            to={`/feedback/${item.id}`}
                                                            state={{ from: 'admin-feedback' }}
                                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
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
        URGENT: 'bg-red-50 text-red-700 border-red-200 ring-red-600/10',
        HIGH: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/10',
        MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-600/10',
        LOW: 'bg-green-50 text-green-700 border-green-200 ring-green-600/10',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ring-1 ring-inset ${styles[priority as keyof typeof styles] || styles.MEDIUM}`}>
            {priority}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
        UNDER_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
        IN_PROGRESS: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        RESOLVED: 'bg-green-50 text-green-700 border-green-200',
        CLOSED: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[status as keyof typeof styles] || styles.SUBMITTED}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles[status as keyof typeof styles]?.replace('bg-', 'bg-').replace('text-', 'bg-').split(' ')[1].replace('text-', 'bg-') || 'bg-blue-600'}`}></span>
            {status.replace('_', ' ')}
        </span>
    );
}

function VendorStatusBadge({ status }: { status?: string }) {
    const styles: Record<string, string> = {
        NONE: 'bg-gray-50 text-gray-500 border-gray-200',
        FORWARDED: 'bg-blue-50 text-blue-700 border-blue-200',
        VENDOR_REPLIED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        PAST_DUE: 'bg-red-50 text-red-700 border-red-200',
        APPROVED: 'bg-green-50 text-green-700 border-green-200',
        REJECTED: 'bg-red-50 text-red-700 border-red-200',
    };
    const label = status ? status.replace('_', ' ') : 'NONE';
    return (
        <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${styles[status || 'NONE'] || styles.NONE}`}>
            {label}
        </span>
    );
}

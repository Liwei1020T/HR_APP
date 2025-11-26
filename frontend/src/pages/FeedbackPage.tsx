import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../lib/api-client';
import type { FeedbackCreate } from '../lib/types';
import { useAttachmentUpload, AttachmentPreviewList } from '../components/AttachmentUploader';
import {
  Plus,
  Search,
  Filter,
  User,
  FileText
} from 'lucide-react';

const STATUS_OPTIONS = ['all', 'SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
const PRIORITY_OPTIONS = ['all', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const;
const SORT_OPTIONS = ['latest', 'oldest', 'priority_desc', 'priority_asc'] as const;
const ASSIGNED_OPTIONS = ['all', 'assigned', 'unassigned'] as const;
const SLA_OPTIONS = ['all', 'NORMAL', 'WARNING', 'BREACHED'] as const;

const formatStatusLabel = (status: string) =>
  status === 'all' ? 'All Status' : status.replace(/_/g, ' ').charAt(0) + status.replace(/_/g, ' ').slice(1).toLowerCase();

const getStatusBadgeStyles = (status: string) => {
  switch (status) {
    case 'RESOLVED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'UNDER_REVIEW':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'CLOSED':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'SUBMITTED':
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getPriorityBadgeStyles = (priority?: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'HIGH':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'MEDIUM':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'LOW':
      return 'bg-slate-50 text-slate-600 border-slate-200';
    default:
      return 'bg-gray-50 text-gray-500 border-gray-200';
  }
};

const getSlaBadgeStyles = (sla?: string) => {
  switch (sla) {
    case 'BREACHED':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'WARNING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-50 text-gray-500 border-gray-200';
  }
};

export default function FeedbackPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<typeof STATUS_OPTIONS[number]>('all');
  const [selectedPriority, setSelectedPriority] = useState<typeof PRIORITY_OPTIONS[number]>('all');
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('latest');
  const [assignedFilter, setAssignedFilter] = useState<typeof ASSIGNED_OPTIONS[number]>('all');
  const [slaFilter, setSlaFilter] = useState<typeof SLA_OPTIONS[number]>('all');
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const attachmentUpload = useAttachmentUpload(4);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<FeedbackCreate>({
    title: '',
    description: '',
    category: 'general',
    is_anonymous: false,
  });

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['feedback', selectedStatus, assignedFilter, slaFilter, onlyAtRisk, searchTerm],
    queryFn: () =>
      feedbackApi.getAll({
        ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
        my_feedback: true,
        ...(assignedFilter !== 'all' ? { assigned: assignedFilter } : {}),
        ...(slaFilter !== 'all' ? { sla: slaFilter } : {}),
        ...(onlyAtRisk ? { sla: 'AT_RISK' } : {}),
        ...(searchTerm ? { q: searchTerm } : {}),
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: FeedbackCreate) => feedbackApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setShowCreateForm(false);
      setFormData({ title: '', description: '', category: 'general', is_anonymous: false });
      attachmentUpload.resetAttachments();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      category: formData.category.toUpperCase(),
      attachments: attachmentUpload.attachmentIds,
    });
  };

  const rawFeedback = feedbackData?.feedback || [];

  const priorityRank: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const filteredFeedback = rawFeedback
    .filter((item: any) =>
      selectedPriority === 'all' ? true : item.priority === selectedPriority
    )
    .filter((item: any) =>
      onlyAtRisk ? item.sla_status === 'WARNING' || item.sla_status === 'BREACHED' : true
    )
    .filter((item: any) =>
      slaFilter === 'all' ? true : item.sla_status === slaFilter
    )
    .slice()
    .sort((a: any, b: any) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'latest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      const aRank = priorityRank[a.priority] || 0;
      const bRank = priorityRank[b.priority] || 0;
      if (sortBy === 'priority_desc') {
        return bRank - aRank;
      }
      if (sortBy === 'priority_asc') {
        return aRank - bRank;
      }
      return 0;
    });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search feedback..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`p-2 rounded-lg border transition-colors ${isFiltersOpen
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Submit Feedback
          </button>
        </div>

        {/* Filters Panel */}
        {isFiltersOpen && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{formatStatusLabel(status)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as any)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority_desc">Highest Priority</option>
                <option value="priority_asc">Lowest Priority</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={onlyAtRisk}
                  onChange={(e) => setOnlyAtRisk(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Show At-Risk Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Feedback List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p>Loading feedback...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No feedback found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or submit a new request.</p>
              <button
                onClick={() => {
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSearchTerm('');
                  setOnlyAtRisk(false);
                }}
                className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredFeedback.map((feedback: any) => (
                <Link
                  key={feedback.id}
                  to={`/feedback/${feedback.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {feedback.title}
                          </h3>
                          {feedback.is_anonymous && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                              Anonymous
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{feedback.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeStyles(feedback.status)}`}>
                          {formatStatusLabel(feedback.status)}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getPriorityBadgeStyles(feedback.priority)}`}>
                          {feedback.priority || 'MEDIUM'}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-purple-50 text-purple-700 border-purple-200">
                          {feedback.category}
                        </span>
                        {feedback.sla_status && feedback.sla_status !== 'NORMAL' && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getSlaBadgeStyles(feedback.sla_status)}`}>
                            {feedback.sla_status}
                          </span>
                        )}
                      </div>

                      <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span>{feedback.is_anonymous ? 'Anonymous' : feedback.submitted_by_name}</span>
                        </div>
                        {feedback.assigned_to_name && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            <span>Assigned to {feedback.assigned_to_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Submit Feedback</h3>
                  <p className="text-sm text-gray-500">We value your input to improve our workplace</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="general">General</option>
                      <option value="workplace">Workplace</option>
                      <option value="management">Management</option>
                      <option value="benefits">Benefits</option>
                      <option value="culture">Culture</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief summary of your feedback"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Please provide detailed information..."
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Attachments</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => {
                        attachmentUpload.addFiles(e.target.files);
                        e.target.value = '';
                      }}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                        <Plus className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Click to upload files</p>
                      <p className="text-xs text-gray-400">PDF, DOC, Images up to 10MB</p>
                    </div>
                  </div>
                  <AttachmentPreviewList
                    attachments={attachmentUpload.attachments}
                    onRemove={attachmentUpload.removeAttachment}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_anonymous}
                        onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-600 checked:bg-blue-600"
                      />
                      <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">Submit anonymously</span>
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || attachmentUpload.isUploading}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {createMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

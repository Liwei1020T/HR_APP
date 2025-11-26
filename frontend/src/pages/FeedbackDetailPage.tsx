import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { feedbackApi, adminApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';
import { AttachmentList } from '../components/AttachmentList';
import {
  ArrowLeft,
  Clock,
  Send,
  Paperclip,
  MoreVertical,
  Building2,
  ShieldAlert,
  History
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  SUBMITTED: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_OPTIONS = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const formatStatus = (status?: string) => status?.replace(/_/g, ' ').charAt(0) + status?.replace(/_/g, ' ').slice(1).toLowerCase() ?? '';

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

const formatSeconds = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined) return '';
  const abs = Math.abs(seconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatVendorStatus = (status?: string) => {
  if (!status) return 'NONE';
  return status.replace(/_/g, ' ');
};

const tzOptions: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Shanghai',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
};

const formatExactBreachTime = (secondsToBreach?: number | null, secondsSinceBreach?: number | null) => {
  const now = Date.now();
  if (secondsToBreach !== null && secondsToBreach !== undefined && secondsToBreach >= 0) {
    const breachAt = new Date(now + secondsToBreach * 1000);
    return breachAt.toLocaleString(undefined, tzOptions);
  }
  if (secondsSinceBreach !== null && secondsSinceBreach !== undefined && secondsSinceBreach >= 0) {
    const breachAt = new Date(now - secondsSinceBreach * 1000);
    return breachAt.toLocaleString(undefined, tzOptions);
  }
  return '';
};

export default function FeedbackDetailPage() {
  const { id } = useParams();
  const feedbackId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  const isHr = hasRole(['hr', 'admin', 'superadmin']);
  const canViewTimeline = !!user && (user.role || '').toLowerCase() !== 'employee';

  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const {
    attachments: commentAttachments,
    addFiles: addCommentFiles,
    removeAttachment: removeCommentAttachment,
    resetAttachments: resetCommentAttachments,
    attachmentIds: commentAttachmentIds,
    isUploading: commentUploading,
  } = useAttachmentUpload(4);
  const commentFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('SUBMITTED');
  const [vendorIdInput, setVendorIdInput] = useState<number | ''>('');
  const [vendorDueDays, setVendorDueDays] = useState(7);
  const [vendorMessage, setVendorMessage] = useState('');
  const [superAdminComment, setSuperAdminComment] = useState('');
  const [superAdminRequest, setSuperAdminRequest] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorPage, setVendorPage] = useState(1);
  const VENDOR_PAGE_SIZE = 10;
  const [showVendorForm, setShowVendorForm] = useState(false);

  const feedbackQuery = useQuery({
    queryKey: ['feedback-detail', feedbackId],
    queryFn: () => feedbackApi.getById(feedbackId),
    enabled: Number.isFinite(feedbackId),
  });

  const commentsQuery = useQuery({
    queryKey: ['feedback-comments', feedbackId],
    queryFn: () => feedbackApi.getComments(feedbackId),
    enabled: Number.isFinite(feedbackId),
  });

  const comments = commentsQuery.data?.comments ?? [];
  const feedback = feedbackQuery.data;
  const timelineQuery = useQuery({
    queryKey: ['feedback-timeline', feedbackId],
    queryFn: () => feedbackApi.getTimeline(feedbackId),
    enabled: Number.isFinite(feedbackId) && canViewTimeline,
  });
  const vendorsQuery = useQuery({
    queryKey: ['vendor-users'],
    queryFn: () => adminApi.getAllUsers(),
    enabled: isHr,
  });
  const vendorUsers = (vendorsQuery.data?.users || []).filter((u: any) => {
    const role = typeof u.role === 'string' ? u.role.toUpperCase() : '';
    return role === 'VENDOR';
  });
  const filteredVendors = vendorUsers.filter((v: any) => {
    const text = vendorSearch.toLowerCase();
    return (
      !text ||
      v.full_name?.toLowerCase().includes(text) ||
      v.email?.toLowerCase().includes(text) ||
      String(v.id).includes(text)
    );
  });
  const vendorTotalPages = Math.max(1, Math.ceil(filteredVendors.length / VENDOR_PAGE_SIZE));
  const pagedVendors = filteredVendors.slice((vendorPage - 1) * VENDOR_PAGE_SIZE, vendorPage * VENDOR_PAGE_SIZE);

  const canComment =
    !!feedback &&
    !!user &&
    (isHr || user.id === feedback.submitted_by);

  const addCommentMutation = useMutation({
    mutationFn: () =>
      feedbackApi.addComment(feedbackId, {
        comment,
        ...(isHr ? { is_internal: isInternal } : {}),
        attachments: commentAttachmentIds,
      }),
    onSuccess: () => {
      setComment('');
      setIsInternal(false);
      resetCommentAttachments();
      queryClient.invalidateQueries({ queryKey: ['feedback-comments', feedbackId] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => feedbackApi.updateStatus(feedbackId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-detail', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  const forwardVendorMutation = useMutation({
    mutationFn: () =>
      adminApi.forwardFeedbackToVendor(
        feedbackId,
        Number(vendorIdInput),
        vendorDueDays,
        vendorMessage.trim()
      ),
    onSuccess: () => {
      setVendorIdInput('');
      setVendorDueDays(7);
      setVendorMessage('');
      queryClient.invalidateQueries({ queryKey: ['feedback-detail', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      alert('Forwarded to vendor');
    },
    onError: () => alert('Forward to vendor failed'),
  });

  const approveVendorMutation = useMutation({
    mutationFn: (action: 'approve' | 'reject') =>
      adminApi.approveVendorReply(feedbackId, action, superAdminComment.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-detail', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      alert('Updated vendor approval status');
      setSuperAdminComment('');
    },
    onError: () => alert('Approval action failed'),
  });

  const requestSuperadminMutation = useMutation({
    mutationFn: () => adminApi.requestSuperadminReview(feedbackId, superAdminRequest.trim()),
    onSuccess: () => {
      setSuperAdminRequest('');
      queryClient.invalidateQueries({ queryKey: ['feedback-detail', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      alert('Sent to superadmin for review');
    },
    onError: () => alert('Failed to send for superadmin review'),
  });

  const handleGenerateAIReply = async () => {
    if (!feedback) return;

    setIsGeneratingAI(true);
    try {
      const data = await feedbackApi.generateReplySuggestion(feedbackId);
      setComment(data.suggestedReply);
    } catch (error) {
      console.error('AI suggestion error:', error);
      alert('Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!Number.isFinite(feedbackId)) {
    return (
      <AppLayout>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-red-600">
          Invalid feedback identifier.
        </div>
      </AppLayout>
    );
  }

  useEffect(() => {
    if (feedback?.status) {
      setSelectedStatus(feedback.status);
    }
  }, [feedback?.status]);

  useEffect(() => {
    setVendorPage(1);
  }, [vendorSearch]);

  useEffect(() => {
    setVendorPage((p) => Math.min(p, vendorTotalPages));
  }, [vendorTotalPages]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              const fromAdmin = (location.state as any)?.from === 'admin-feedback';
              navigate(fromAdmin ? '/admin/feedback' : '/feedback');
            }
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <div className="p-1 rounded-full bg-white border border-gray-200 group-hover:border-gray-300 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span>Back to list</span>
        </button>

        {feedbackQuery.isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading feedback details...
          </div>
        ) : !feedback ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-red-600">
            Feedback not found or you no longer have access.
          </div>
        ) : (
          <>
            {/* Urgent Alert */}
            {(feedback as any).priority === 'URGENT' && (feedback as any).sla_status === 'BREACHED' && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">URGENT SLA Breached</div>
                  <div className="text-sm opacity-90">
                    This urgent feedback exceeded the response SLA. Please respond or update status immediately.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Feedback Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${STATUS_BADGE[feedback.status] || STATUS_BADGE.SUBMITTED}`}>
                        {formatStatus(feedback.status)}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getPriorityBadgeStyles((feedback as any).priority)}`}>
                        {((feedback as any).priority || 'MEDIUM')} Priority
                      </span>
                      <span className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                        {feedback.category}
                      </span>
                      {(feedback as any).sla_status && (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getSlaBadgeStyles((feedback as any).sla_status)}`}>
                          {(feedback as any).sla_status === 'BREACHED' ? 'SLA Breached' : 'SLA Normal'}
                        </span>
                      )}
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">{feedback.title}</h1>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{(feedback as any).description}</p>

                    <AttachmentList attachments={feedback.attachments} />

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          {feedback.is_anonymous ? 'A' : (feedback.submitter_name?.charAt(0) || 'E')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {feedback.is_anonymous ? 'Anonymous' : feedback.submitter_name || 'Employee'}
                          </p>
                          <p className="text-xs">Submitted on {new Date(feedback.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </div>
                      Discussion
                    </h2>
                    <span className="text-xs text-gray-500">
                      {comments.length} message{comments.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30">
                    {commentsQuery.isLoading ? (
                      <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation below.</p>
                      </div>
                    ) : (
                      comments.map((entry: any) => {
                        const isMe = user?.id === entry.user_id;
                        const isSystem = !entry.user_id; // Assuming system messages have no user_id

                        return (
                          <div key={entry.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
                              }`}>
                              {entry.user?.full_name?.charAt(0) || '?'}
                            </div>
                            <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-700">
                                  {entry.user?.full_name || 'Unknown'}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(entry.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className={`p-3 rounded-2xl text-sm shadow-sm relative ${isMe
                                  ? 'bg-blue-600 text-white rounded-tr-none'
                                  : entry.is_internal
                                    ? 'bg-amber-50 border border-amber-200 text-gray-800 rounded-tl-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                }`}>
                                {entry.is_internal && (
                                  <div className="mb-2">
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-200 inline-block">
                                      Internal Note
                                    </span>
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap">{entry.comment}</p>
                              </div>
                              {entry.attachments && entry.attachments.length > 0 && (
                                <div className={`mt-2 ${isMe ? 'self-end' : 'self-start'}`}>
                                  <AttachmentList attachments={entry.attachments} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {canComment && (
                    <div className="p-4 bg-white border-t border-gray-100 rounded-b-xl">
                      {isHr && (
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                              className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                            />
                            <span className="text-xs font-medium text-gray-600">Internal Note (Hidden from employee)</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGenerateAIReply}
                            disabled={isGeneratingAI}
                            className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                          >
                            <span className={isGeneratingAI ? 'animate-spin' : ''}>✨</span>
                            {isGeneratingAI ? 'Generating...' : 'AI Suggestion'}
                          </button>
                        </div>
                      )}

                      <div className="relative">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={3}
                          placeholder={isInternal ? "Add an internal note..." : "Type your reply..."}
                          className={`w-full pl-4 pr-12 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none ${isInternal
                              ? 'bg-amber-50 border-amber-200 focus:border-amber-400 focus:ring-amber-200'
                              : 'bg-gray-50 border-gray-200 focus:border-blue-400 focus:ring-blue-100'
                            }`}
                        />
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => commentFileInputRef.current?.click()}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => addCommentMutation.mutate()}
                            disabled={!comment.trim() && commentAttachmentIds.length === 0}
                            className={`p-2 rounded-full text-white transition-all shadow-sm ${!comment.trim() && commentAttachmentIds.length === 0
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:scale-105'
                              }`}
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <input
                        ref={commentFileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => {
                          addCommentFiles(e.target.files);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                      <div className="mt-2">
                        <AttachmentPreviewList
                          attachments={commentAttachments}
                          onRemove={removeCommentAttachment}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900">Status & Assignment</h3>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Current Status</p>
                      {isHr ? (
                        <div className="flex gap-2">
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateStatusMutation.mutate(selectedStatus)}
                            disabled={updateStatusMutation.isPending || selectedStatus === feedback.status}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-lg border ${STATUS_BADGE[feedback.status]}`}>
                          {formatStatus(feedback.status)}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Assigned To</p>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
                          {(feedback as any).assigned_to_name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {(feedback as any).assigned_to_name || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {(feedback as any).sla_status && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">SLA Status</p>
                        <div className={`p-3 rounded-lg border ${(feedback as any).sla_status === 'BREACHED'
                            ? 'bg-red-50 border-red-100'
                            : 'bg-blue-50 border-blue-100'
                          }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className={`h-4 w-4 ${(feedback as any).sla_status === 'BREACHED' ? 'text-red-600' : 'text-blue-600'}`} />
                            <span className={`text-sm font-semibold ${(feedback as any).sla_status === 'BREACHED' ? 'text-red-700' : 'text-blue-700'}`}>
                              {(feedback as any).sla_status === 'BREACHED' ? 'Breached' : 'On Track'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {(feedback as any).sla_status === 'BREACHED'
                              ? `Overdue by ${formatSeconds((feedback as any).sla_seconds_since_breach)}`
                              : `Time remaining: ${formatSeconds((feedback as any).sla_seconds_to_breach)}`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Panel */}
                {(isHr || (user && user.role?.toUpperCase() === 'SUPERADMIN')) && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Vendor Management
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${(feedback as any).is_vendor_related ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                        {(feedback as any).is_vendor_related ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Vendor Status Display */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium text-gray-900">{formatVendorStatus((feedback as any).vendor_status)}</span>
                      </div>

                      {/* Vendor Actions */}
                      {isHr && (
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setShowVendorForm((v) => !v)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {showVendorForm ? 'Cancel Action' : 'Forward to Vendor'}
                          </button>

                          {showVendorForm && (
                            <div className="space-y-3 animate-in slide-in-from-top-2">
                              <input
                                type="text"
                                value={vendorSearch}
                                onChange={(e) => setVendorSearch(e.target.value)}
                                placeholder="Search vendor..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                              <select
                                value={vendorIdInput}
                                onChange={(e) => setVendorIdInput(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              >
                                <option value="">Select Vendor</option>
                                {pagedVendors.map((v: any) => (
                                  <option key={v.id} value={v.id}>
                                    {v.full_name || v.email}
                                  </option>
                                ))}
                              </select>
                              <textarea
                                value={vendorMessage}
                                onChange={(e) => setVendorMessage(e.target.value)}
                                rows={2}
                                placeholder="Instructions..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                              <button
                                onClick={() => forwardVendorMutation.mutate()}
                                disabled={!vendorIdInput || !vendorMessage.trim() || forwardVendorMutation.isPending}
                                className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                              >
                                {forwardVendorMutation.isPending ? 'Sending...' : 'Send Request'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {canViewTimeline && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <History className="h-4 w-4 text-gray-500" />
                      Timeline
                    </h3>

                    {timelineQuery.isLoading ? (
                      <div className="text-center text-gray-400 text-sm">Loading...</div>
                    ) : !timelineQuery.data || timelineQuery.data.total === 0 ? (
                      <div className="text-center text-gray-400 text-sm">No activity recorded.</div>
                    ) : (
                      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:-translate-x-1/2 before:bg-gray-100 before:h-full">
                        {timelineQuery.data.events.map((event: any) => (
                          <div key={event.id} className="relative flex gap-4">
                            <div className="absolute left-0 ml-2.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-blue-500 shadow-sm ring-1 ring-blue-100"></div>
                            <div className="flex-1 pt-0.5 pl-6">
                              <p className="text-sm font-medium text-gray-900">
                                {event.action.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-gray-500 mb-1">
                                {new Date(event.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                {event.user?.full_name || 'System'}
                                {event.details && <span className="block mt-1 text-gray-500">{event.details}</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

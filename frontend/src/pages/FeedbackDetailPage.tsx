import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { feedbackApi, adminApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';
import { AttachmentList } from '../components/AttachmentList';

const STATUS_BADGE: Record<string, string> = {
  RESOLVED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-gray-200 text-gray-800',
  SUBMITTED: 'bg-gray-100 text-gray-800',
};

const STATUS_OPTIONS = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const formatStatus = (status?: string) => status?.replace(/_/g, ' ') ?? '';

const getPriorityBadgeClasses = (priority?: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-800';
    case 'LOW':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

const getSlaBadgeClasses = (sla?: string) => {
  switch (sla) {
    case 'BREACHED':
      return 'bg-red-100 text-red-800';
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-600';
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
        <div className="bg-white rounded-lg shadow p-6 text-red-600">
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
      <div className="space-y-6 max-w-5xl mx-auto">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              const fromAdmin = (location.state as any)?.from === 'admin-feedback';
              navigate(fromAdmin ? '/admin/feedback' : '/feedback');
            }
          }}
          className="text-sm text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to previous page
        </button>

        {feedbackQuery.isLoading ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">Loading feedback...</div>
        ) : !feedback ? (
          <div className="bg-white rounded-lg shadow p-6 text-red-600">
            Feedback not found or you no longer have access.
          </div>
        ) : (
          <>
            {(feedback as any).priority === 'URGENT' && (feedback as any).sla_status === 'BREACHED' && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-sm flex flex-col gap-2">
                <div className="font-semibold">URGENT SLA breached</div>
                <div className="text-sm">
                  This urgent feedback exceeded the response SLA. Please respond or update status immediately.
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Feedback</p>
                  <h1 className="text-3xl font-bold text-gray-900">{feedback.title}</h1>
                  <p className="text-gray-600 mt-2">{(feedback as any).description}</p>
                  <AttachmentList attachments={feedback.attachments} />
                </div>
                <div className="flex flex-wrap items-center md:justify-end gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[feedback.status] || STATUS_BADGE.SUBMITTED
                      }`}
                  >
                    {formatStatus(feedback.status)}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeClasses(
                      (feedback as any).priority
                    )}`}
                  >
                    Priority: {(feedback as any).priority || 'MEDIUM'}
                  </span>
                  {(feedback as any).sla_status && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getSlaBadgeClasses(
                        (feedback as any).sla_status
                      )}`}
                    >
                      {(feedback as any).sla_status === 'BREACHED'
                        ? `SLA Breached ${formatSeconds((feedback as any).sla_seconds_since_breach)} ago`
                        : typeof (feedback as any).sla_seconds_to_breach === 'number'
                          ? `Time left: ${formatSeconds((feedback as any).sla_seconds_to_breach)}`
                          : 'SLA Normal'}
                    </span>
                  )}
                  {(feedback as any).vendor_sla_status && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getSlaBadgeClasses(
                        (feedback as any).vendor_sla_status
                      )}`}
                    >
                      Vendor SLA: {(feedback as any).vendor_sla_status}
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                    {feedback.category}
                  </span>
                  {(feedback as any).sla_status && (
                    <div className="text-xs text-gray-600 text-right space-y-0.5">
                      {(feedback as any).sla_status === 'BREACHED'
                        ? `SLA breached ${formatSeconds((feedback as any).sla_seconds_since_breach)} ago`
                        : `Time left until breach: ${formatSeconds((feedback as any).sla_seconds_to_breach)}`}
                      <div className="text-[11px] text-gray-500">
                        Breach time: {formatExactBreachTime(
                          (feedback as any).sla_seconds_to_breach,
                          (feedback as any).sla_status === 'BREACHED' ? (feedback as any).sla_seconds_since_breach : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Submitted by</p>
                  <p className="text-base font-medium text-gray-900">
                    {feedback.is_anonymous
                      ? 'Anonymous'
                      : feedback.submitter_name || 'Employee'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(feedback.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Assigned to</p>
                  <p className="text-base font-medium text-gray-900">
                    {(feedback as any).assigned_to_name || 'Not assigned'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Status: {formatStatus(feedback.status)}</p>
                </div>
              </div>
              {(isHr || (user && user.role?.toUpperCase() === 'SUPERADMIN')) && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Vendor</p>
                      <p className="text-xs text-blue-700">
                        Vendor related: {(feedback as any).is_vendor_related ? 'Yes' : 'No'} • Status: {formatVendorStatus((feedback as any).vendor_status)}
                      </p>
                      {(feedback as any).vendor_due_at && (
                        <p className="text-xs text-blue-700">
                          Due: {new Date((feedback as any).vendor_due_at).toLocaleString(undefined, tzOptions)}
                        </p>
                      )}
                      {(feedback as any).vendor_last_response_at && (
                        <p className="text-xs text-blue-700">
                          Last response: {new Date((feedback as any).vendor_last_response_at).toLocaleString(undefined, tzOptions)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-gray-600">
                      <span className={`px-2 py-1 rounded-full ${getSlaBadgeClasses((feedback as any).vendor_sla_status)}`}>
                        Vendor SLA: {(feedback as any).vendor_sla_status || 'NORMAL'}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {formatVendorStatus((feedback as any).vendor_status)}
                      </span>
                      {(feedback as any).vendor_status === 'VENDOR_REPLIED' && (
                        <span className="text-[11px] text-indigo-700">Awaiting superadmin approval</span>
                      )}
                      {(feedback as any).vendor_status === 'FORWARDED' && (
                        <span className="text-[11px] text-orange-700">Awaiting vendor response</span>
                      )}
                      {(feedback as any).vendor_status === 'PAST_DUE' && (
                        <span className="text-[11px] text-red-700 font-semibold">Vendor overdue</span>
                      )}
                      {['HR', 'ADMIN', 'SUPERADMIN', 'VENDOR'].includes((user?.role || '').toUpperCase()) && (
                        <Link
                          to={`/vendor-conversation/${feedback.id}`}
                          className="text-[11px] text-blue-700 hover:underline"
                        >
                          Open vendor conversation
                        </Link>
                      )}
                    </div>
                  </div>
                  {isHr && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowVendorForm((v) => !v)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {showVendorForm ? 'Close vendor panel' : 'Send to Vendor'}
                      </button>

                      {showVendorForm && (
                        <div className="flex flex-wrap items-center gap-3 bg-white/60 border border-blue-100 rounded-lg p-3">
                          <label className="flex flex-col gap-1 text-xs text-gray-600">
                            Search vendor
                            <input
                              type="text"
                              value={vendorSearch}
                              onChange={(e) => setVendorSearch(e.target.value)}
                              placeholder="Search by name/email/id"
                              className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-gray-600">
                            Select vendor
                            <select
                              value={vendorIdInput}
                              onChange={(e) => setVendorIdInput(e.target.value ? Number(e.target.value) : '')}
                              className="border border-gray-300 rounded px-3 py-2 text-sm"
                            >
                              <option value="">Choose a vendor</option>
                              {pagedVendors.map((v: any) => (
                                <option key={v.id} value={v.id}>
                                  {v.full_name || v.email} (#{v.id})
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-gray-600">
                            Instructions to vendor
                            <textarea
                              value={vendorMessage}
                              onChange={(e) => setVendorMessage(e.target.value)}
                              rows={3}
                              placeholder="Describe what the vendor should do"
                              className="border border-gray-300 rounded px-3 py-2 text-sm w-80"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-xs text-gray-600">
                            Due in (days)
                            <input
                              type="number"
                              value={vendorDueDays}
                              onChange={(e) => setVendorDueDays(Number(e.target.value))}
                              className="border border-gray-300 rounded px-3 py-2 text-sm w-24"
                              min={1}
                            />
                          </label>
                          <div className="flex flex-col gap-1 text-xs text-gray-600">
                            <span>Action</span>
                            <button
                              onClick={() => forwardVendorMutation.mutate()}
                              disabled={!vendorIdInput || !vendorMessage.trim() || forwardVendorMutation.isPending}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {forwardVendorMutation.isPending ? 'Forwarding...' : 'Forward to Vendor'}
                            </button>
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-gray-600">
                            <span>Results</span>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span>
                                Page {vendorPage} / {vendorTotalPages}
                              </span>
                              <button
                                type="button"
                                disabled={vendorPage <= 1}
                                onClick={() => setVendorPage((p) => Math.max(1, p - 1))}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                              >
                                Prev
                              </button>
                              <button
                                type="button"
                                disabled={vendorPage >= vendorTotalPages}
                                onClick={() => setVendorPage((p) => Math.min(vendorTotalPages, p + 1))}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {isHr &&
                    ['FORWARDED', 'VENDOR_REPLIED', 'AWAITING_SUPERADMIN'].includes(
                      (feedback as any).vendor_status
                    ) && (
                    <div className="space-y-2 bg-white/60 border border-blue-100 rounded-lg p-3">
                      <label className="flex flex-col gap-1 text-xs text-gray-600">
                        Message to superadmin (optional)
                        <textarea
                          value={superAdminRequest}
                          onChange={(e) => setSuperAdminRequest(e.target.value)}
                          rows={3}
                          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                          placeholder="Summarize vendor response or provide context"
                        />
                      </label>
                      <button
                        onClick={() => requestSuperadminMutation.mutate()}
                        disabled={requestSuperadminMutation.isPending}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      >
                        {requestSuperadminMutation.isPending ? 'Sending...' : 'Send to Superadmin for approval'}
                      </button>
                    </div>
                  )}
                  {user?.role?.toUpperCase() === 'SUPERADMIN' &&
                    ((feedback as any).vendor_status === 'VENDOR_REPLIED' ||
                      (feedback as any).vendor_status === 'AWAITING_SUPERADMIN') && (
                    <div className="space-y-2">
                      <label className="flex flex-col gap-1 text-xs text-gray-600">
                        Superadmin comment (optional)
                        <textarea
                          value={superAdminComment}
                          onChange={(e) => setSuperAdminComment(e.target.value)}
                          rows={3}
                          className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                          placeholder="Add context for approval/rejection"
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveVendorMutation.mutate('approve')}
                          disabled={approveVendorMutation.isPending}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {approveVendorMutation.isPending ? 'Saving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => approveVendorMutation.mutate('reject')}
                          disabled={approveVendorMutation.isPending}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {approveVendorMutation.isPending ? 'Saving...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                  {(feedback as any).vendor_status && (
                    <div className="text-xs text-gray-700 space-y-2">
                      <div className="font-semibold text-gray-800">Vendor timeline</div>
                      <div className="flex flex-wrap gap-3">
                        {[
                          {
                            label: 'Forwarded',
                            active: (feedback as any).vendor_status !== 'NONE',
                            detail: (feedback as any).vendor_due_at
                              ? `Due ${new Date((feedback as any).vendor_due_at).toLocaleString(undefined, tzOptions)}`
                              : '',
                          },
                          {
                            label: 'Vendor replied',
                            active:
                              (feedback as any).vendor_status === 'VENDOR_REPLIED' ||
                              (feedback as any).vendor_status === 'APPROVED' ||
                              (feedback as any).vendor_status === 'REJECTED',
                            detail: (feedback as any).vendor_last_response_at
                              ? new Date((feedback as any).vendor_last_response_at).toLocaleString(undefined, tzOptions)
                              : '',
                          },
                          {
                            label: 'Superadmin approval',
                            active:
                              (feedback as any).vendor_status === 'APPROVED' ||
                              (feedback as any).vendor_status === 'REJECTED',
                            detail:
                              (feedback as any).vendor_status === 'APPROVED'
                                ? 'Approved'
                                : (feedback as any).vendor_status === 'REJECTED'
                                  ? 'Rejected'
                                  : 'Pending',
                          },
                          {
                            label: 'SLA',
                            active: (feedback as any).vendor_status === 'PAST_DUE',
                            detail: (feedback as any).vendor_status === 'PAST_DUE' ? 'Past due' : 'On track',
                          },
                        ].map((step) => (
                          <div
                            key={step.label}
                            className={`flex items-start gap-2 px-2 py-1 rounded border ${step.active
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                                : 'bg-white border-gray-200 text-gray-600'
                              }`}
                          >
                            <span
                              className={`mt-1 h-2 w-2 rounded-full ${step.active ? 'bg-indigo-500' : 'bg-gray-300'
                                }`}
                            />
                            <div>
                              <div className="font-medium">{step.label}</div>
                              {step.detail && <div className="text-[11px]">{step.detail}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {isHr && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-600">
                    Update status (visible to employees)
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateStatusMutation.mutate(selectedStatus)}
                      disabled={
                        updateStatusMutation.isPending ||
                        !selectedStatus ||
                        selectedStatus === feedback.status
                      }
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updateStatusMutation.isPending ? 'Saving...' : 'Save status'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Conversation</h2>
                  <p className="text-gray-500 text-sm">
                    Replies from HR/Admin appear below. You can respond to keep the discussion moving.
                  </p>
                </div>
                <Link
                  to="/feedback"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all feedback →
                </Link>
              </div>
              {commentsQuery.isLoading ? (
                <p className="text-gray-500">Loading replies...</p>
              ) : comments.length === 0 ? (
                <p className="text-gray-500">No replies yet. You’ll receive a notification when HR responds.</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((entry: any) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {entry.user?.full_name || 'Team Member'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.is_internal && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                              Internal
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mt-3 whitespace-pre-line">{entry.comment}</p>
                      <AttachmentList attachments={entry.attachments} />
                    </div>
                  ))}
                </div>
              )}

              {canComment && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Add a reply</h3>
                  {isHr && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={handleGenerateAIReply}
                        disabled={isGeneratingAI}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                      >
                        <span className={`mr-2 ${isGeneratingAI ? 'animate-spin' : 'animate-pulse'}`}>✨</span>
                        {isGeneratingAI ? 'Generating AI suggestion...' : 'Generate AI Reply'}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">AI will suggest a professional, empathetic response</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        placeholder="Share an update or follow-up question..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => commentFileInputRef.current?.click()}
                        className="absolute bottom-3 right-3 rounded-full p-2 text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        📎
                      </button>
                      <input
                        ref={commentFileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => {
                          addCommentFiles(e.target.files);
                          e.target.value = '';
                        }}
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </div>
                    {isHr && (
                      <label className="flex items-center text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        Mark as internal (only HR/Admin can see)
                      </label>
                    )}
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setComment('');
                          setIsInternal(false);
                          resetCommentAttachments();
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => addCommentMutation.mutate()}
                        disabled={!comment.trim() || addCommentMutation.isPending || commentUploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {addCommentMutation.isPending ? 'Sending...' : 'Post Reply'}
                      </button>
                    </div>
                    <AttachmentPreviewList
                      attachments={commentAttachments}
                      onRemove={removeCommentAttachment}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

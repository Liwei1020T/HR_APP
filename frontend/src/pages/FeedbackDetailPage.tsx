import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { feedbackApi, adminApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { useAttachmentUpload } from '../components/AttachmentUploader';
import { AttachmentList } from '../components/AttachmentList';
import { FeedbackDiscussion } from '../components/feedback/FeedbackDiscussion';
import { FeedbackStatusCard } from '../components/feedback/FeedbackStatusCard';
import { FeedbackVendorPanel } from '../components/feedback/FeedbackVendorPanel';
import { FeedbackTimeline } from '../components/feedback/FeedbackTimeline';
import { StatusToast } from '../components/StatusToast';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
  SUBMITTED: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_OPTIONS = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const formatStatus = (status?: string) => {
  if (!status) return '';
  const normalized = status.replace(/_/g, ' ');
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
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
  } = useAttachmentUpload(4);
  const commentFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('SUBMITTED');
  const [vendorIdInput, setVendorIdInput] = useState<number | ''>('');
  const [vendorDueDays, setVendorDueDays] = useState(7);
  const [vendorMessage, setVendorMessage] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorPage, setVendorPage] = useState(1);
  const VENDOR_PAGE_SIZE = 10;
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

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
  const vendorStatus = ((feedback as any)?.vendor_status || '').toUpperCase();
  const canForwardToVendor = vendorStatus !== 'FORWARDED';

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);
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
      setToastMessage({ text: 'Status updated.', type: 'success' });
    },
    onError: () => setToastMessage({ text: 'Failed to update status.', type: 'error' }),
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
      setShowVendorForm(false);
      queryClient.invalidateQueries({ queryKey: ['feedback-detail', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setToastMessage({ text: 'Request sent to vendor.', type: 'success' });
    },
  });

  const requestApprovalMutation = useMutation({
    mutationFn: () => adminApi.requestSuperadminReview(feedbackId),
    onSuccess: () => {
      setToastMessage({ text: 'Approval request sent to Superadmin.', type: 'success' });
    },
    onError: () => setToastMessage({ text: 'Failed to send request.', type: 'error' }),
  });

  const approveVendorMutation = useMutation({
    mutationFn: ({ action, comment }: { action: 'approve' | 'reject'; comment?: string }) =>
      adminApi.approveVendorReply(feedbackId, action, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedback-detail', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setToastMessage({
        text: variables.action === 'approve' ? 'Vendor response approved.' : 'Vendor response rejected.',
        type: 'success',
      });
    },
    onError: () => setToastMessage({ text: 'Failed to process approval.', type: 'error' }),
  });

  const handleGenerateAIReply = async () => {
    if (!feedback) return;

    setIsGeneratingAI(true);
    try {
      const data = await feedbackApi.generateReplySuggestion(feedbackId);
      setComment(data.suggestedReply);
    } catch (error) {
      console.error('AI suggestion error:', error);
      setToastMessage({ text: 'Failed to generate AI suggestion.', type: 'error' });
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

  if (feedbackQuery.isError) {
    return (
      <AppLayout>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-red-600 space-y-3">
          <p>Failed to load feedback details.</p>
          <button
            onClick={() => feedbackQuery.refetch()}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
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
      {toastMessage && (
        <StatusToast
          message={toastMessage.text}
          variant={toastMessage.type || 'success'}
          onClose={() => setToastMessage(null)}
        />
      )}
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

                <FeedbackDiscussion
                  commentsQuery={commentsQuery}
                  comments={comments}
                  user={user}
                  canComment={canComment}
                  isHr={isHr}
                  comment={comment}
                  setComment={setComment}
                  isInternal={isInternal}
                  setIsInternal={setIsInternal}
                  isGeneratingAI={isGeneratingAI}
                  handleGenerateAIReply={handleGenerateAIReply}
                  commentFileInputRef={commentFileInputRef}
                  addCommentFiles={addCommentFiles}
                  addCommentMutation={addCommentMutation}
                  commentAttachmentIds={commentAttachmentIds}
                  commentAttachments={commentAttachments}
                  removeCommentAttachment={removeCommentAttachment}
                />
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                <FeedbackStatusCard
                  feedback={feedback}
                  isHr={isHr}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  statusOptions={STATUS_OPTIONS}
                  formatStatus={formatStatus}
                  statusBadgeMap={STATUS_BADGE}
                  updateStatusMutation={updateStatusMutation}
                  getSlaBadgeStyles={getSlaBadgeStyles}
                  formatSeconds={formatSeconds}
                />

                {/* Vendor Panel */}
                {(isHr || (user && user.role?.toUpperCase() === 'SUPERADMIN')) && (
                  <FeedbackVendorPanel
                    isHr={isHr}
                    feedback={feedback}
                    showVendorForm={showVendorForm}
                    setShowVendorForm={setShowVendorForm}
                    vendorSearch={vendorSearch}
                    setVendorSearch={setVendorSearch}
                    vendorPage={vendorPage}
                    setVendorPage={setVendorPage}
                    vendorTotalPages={vendorTotalPages}
                    vendorIdInput={vendorIdInput}
                    setVendorIdInput={setVendorIdInput}
                    vendorDueDays={vendorDueDays}
                    setVendorDueDays={setVendorDueDays}
                    vendorMessage={vendorMessage}
                    setVendorMessage={setVendorMessage}
                    pagedVendors={pagedVendors}
                    forwardVendorMutation={forwardVendorMutation}
                    formatVendorStatus={formatVendorStatus}
                    canForward={canForwardToVendor}
                    userRole={user?.role}
                    requestApprovalMutation={requestApprovalMutation}
                    approveVendorMutation={approveVendorMutation}
                  />
                )}

                {/* Timeline */}
                {canViewTimeline && <FeedbackTimeline timelineQuery={timelineQuery} />}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { feedbackApi } from '../lib/api-client';
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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <button
          onClick={() => {
            const fromAdmin = (location.state as any)?.from === 'admin-feedback';
            navigate(fromAdmin ? '/admin/feedback' : '/feedback');
          }}
          className="text-sm text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to Feedback
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
                <div className="flex flex-col items-start md:items-end gap-2">
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
                        ? 'SLA Breached'
                        : (feedback as any).sla_status === 'WARNING'
                          ? 'SLA Warning'
                          : 'SLA Normal'}
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                    {feedback.category}
                  </span>
                  {(feedback as any).sla_status && (
                    <div className="text-xs text-gray-600 text-right">
                      {(feedback as any).sla_status === 'BREACHED'
                        ? `SLA breached ${formatSeconds((feedback as any).sla_seconds_since_breach)} ago`
                        : (feedback as any).sla_status === 'WARNING'
                          ? 'SLA warning'
                          : 'SLA normal'}
                      {(feedback as any).sla_status !== 'BREACHED' &&
                        typeof (feedback as any).sla_seconds_to_breach === 'number' &&
                        (feedback as any).sla_seconds_to_breach !== null &&
                        ` • ${formatSeconds((feedback as any).sla_seconds_to_breach)} until breach`}
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

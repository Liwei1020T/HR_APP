import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { feedbackApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';

const STATUS_BADGE: Record<string, string> = {
  RESOLVED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-gray-200 text-gray-800',
  SUBMITTED: 'bg-gray-100 text-gray-800',
};

const formatStatus = (status?: string) => status?.replace(/_/g, ' ') ?? '';

export default function FeedbackDetailPage() {
  const { id } = useParams();
  const feedbackId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  const isHr = hasRole(['hr', 'admin', 'superadmin']);

  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

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
      }),
    onSuccess: () => {
      setComment('');
      setIsInternal(false);
      queryClient.invalidateQueries({ queryKey: ['feedback-comments', feedbackId] });
    },
  });

  if (!Number.isFinite(feedbackId)) {
    return (
      <AppLayout>
        <div className="bg-white rounded-lg shadow p-6 text-red-600">
          Invalid feedback identifier.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/feedback')}
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
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Feedback</p>
                  <h1 className="text-3xl font-bold text-gray-900">{feedback.title}</h1>
                  <p className="text-gray-600 mt-2">{(feedback as any).description}</p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      STATUS_BADGE[feedback.status] || STATUS_BADGE.SUBMITTED
                    }`}
                  >
                    {formatStatus(feedback.status)}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                    {feedback.category}
                  </span>
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
                    </div>
                  ))}
                </div>
              )}

              {canComment && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Add a reply</h3>
                  <div className="space-y-3">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      placeholder="Share an update or follow-up question..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                    <div className="flex justify-end">
                      <button
                        onClick={() => addCommentMutation.mutate()}
                        disabled={!comment.trim() || addCommentMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {addCommentMutation.isPending ? 'Sending...' : 'Post Reply'}
                      </button>
                    </div>
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

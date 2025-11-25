import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { feedbackApi } from '../lib/api-client';
import { AttachmentList } from '../components/AttachmentList';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';

export default function VendorConversationPage() {
  const { id } = useParams();
  const feedbackId = Number(id);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const {
    attachments,
    addFiles,
    removeAttachment,
    resetAttachments,
    attachmentIds,
    isUploading,
  } = useAttachmentUpload(5);

  const threadQuery = useQuery({
    queryKey: ['vendor-thread', feedbackId],
    queryFn: () => feedbackApi.getVendorThread(feedbackId),
    enabled: Number.isFinite(feedbackId),
  });

  const detailQuery = useQuery({
    queryKey: ['feedback-detail', feedbackId],
    queryFn: () => feedbackApi.getById(feedbackId),
    enabled: Number.isFinite(feedbackId),
  });

  const addMessageMutation = useMutation({
    mutationFn: () => feedbackApi.addVendorMessage(feedbackId, { comment: message, attachments: attachmentIds }),
    onSuccess: () => {
      setMessage('');
      resetAttachments();
      queryClient.invalidateQueries({ queryKey: ['vendor-thread', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback-detail', feedbackId] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });

  if (!Number.isFinite(feedbackId)) {
    return (
      <AppLayout>
        <div className="p-6 bg-white rounded-lg shadow text-red-600">Invalid feedback.</div>
      </AppLayout>
    );
  }

  const feedback = detailQuery.data;
  const comments = threadQuery.data?.comments || [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Conversation</h1>
            <p className="text-gray-600 text-sm">Only Admin / Superadmin / Vendor can view this thread.</p>
          </div>
          <Link to={`/feedback/${feedbackId}`} className="text-blue-600 text-sm hover:underline">
            ← Back to feedback
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border">
          {detailQuery.isLoading ? (
            <p className="text-gray-500">Loading feedback...</p>
          ) : feedback ? (
            <div>
              <div className="text-sm text-gray-500 uppercase">Feedback</div>
              <div className="text-lg font-semibold text-gray-900">{feedback.title}</div>
              <p className="text-gray-700 text-sm mt-1">{(feedback as any).description}</p>
              <div className="text-xs text-gray-500 mt-1">
                Vendor status: {(feedback as any).vendor_status || 'NONE'} • Assigned vendor:{' '}
                {(feedback as any).vendor_assigned_to || 'N/A'}
              </div>
            </div>
          ) : (
            <p className="text-red-600 text-sm">Feedback not found or inaccessible.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 border space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Conversation</h3>
          {threadQuery.isLoading ? (
            <p className="text-gray-500">Loading messages...</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">{c.user?.full_name || 'User'} ({c.user?.role})</span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{c.comment}</p>
                  {c.attachments && c.attachments.length > 0 && (
                    <div className="mt-2">
                      <AttachmentList attachments={c.attachments} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 border space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Send a message</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Write a message to the vendor/admin..."
          />
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Attach files/photos:
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) addFiles(Array.from(e.target.files));
                }}
                className="mt-1"
              />
              {isUploading && <span className="text-xs text-gray-500 ml-2">Uploading…</span>}
            </div>
            <AttachmentPreviewList attachments={attachments} onRemove={removeAttachment} />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => addMessageMutation.mutate()}
              disabled={!message || addMessageMutation.isPending || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {addMessageMutation.isPending ? 'Sending...' : 'Send'}
            </button>
          </div>
          {addMessageMutation.isError && (
            <p className="text-red-600 text-sm">Failed to send message. Please try again.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

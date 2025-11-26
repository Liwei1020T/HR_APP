import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { feedbackApi, authApi } from '../lib/api-client';
import { AttachmentList } from '../components/AttachmentList';
import { AttachmentPreviewList, useAttachmentUpload } from '../components/AttachmentUploader';
import { Feedback, FeedbackComment } from '../lib/types';
import {
  MessageSquare,
  ArrowLeft,
  Send,
  Paperclip,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function VendorConversationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const feedbackId = Number(id);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    attachments,
    addFiles,
    removeAttachment,
    resetAttachments,
    attachmentIds,
    isUploading,
  } = useAttachmentUpload(5);

  const { data: currentUser } = useQuery({
    queryKey: ['auth-user'],
    queryFn: () => authApi.getCurrentUser(),
  });

  const threadQuery = useQuery({
    queryKey: ['vendor-thread', feedbackId],
    queryFn: () => feedbackApi.getVendorThread(feedbackId),
    enabled: Number.isFinite(feedbackId),
    refetchInterval: 5000,
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

  useEffect(() => {
    if (threadQuery.data?.comments) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadQuery.data?.comments]);

  if (!Number.isFinite(feedbackId)) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="p-4 bg-red-50 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Invalid Feedback ID</h2>
          <p className="text-gray-500 mt-2">The requested feedback item could not be found.</p>
          <Link to="/vendor/feedback" className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  const feedback = detailQuery.data as Feedback | undefined;
  const comments = (threadQuery.data?.comments || []) as FeedbackComment[];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Vendor Conversation
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Feedback Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Feedback Details</h3>
                <p className="text-xs text-gray-500">Reference #{feedbackId}</p>
              </div>

              {detailQuery.isLoading ? (
                <div className="p-6 space-y-4 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-20 bg-gray-100 rounded"></div>
                </div>
              ) : feedback ? (
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{feedback.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {feedback.description || feedback.content}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Tag className="h-4 w-4" /> Category
                      </span>
                      <span className="font-medium text-gray-900">{feedback.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Priority
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                        ${feedback.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          feedback.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'}`}>
                        {feedback.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Status
                      </span>
                      <span className="font-medium text-gray-900">{feedback.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Created
                      </span>
                      <span className="font-medium text-gray-900">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>


                </div>
              ) : (
                <div className="p-6 text-center text-red-500">Feedback details unavailable</div>
              )}
            </div>
          </div>

          {/* Right Column: Conversation Thread */}
          <div className="lg:col-span-2 flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Discussion Thread</h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                Visible to Admin & Vendor
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {threadQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">No messages yet.</p>
                  <p className="text-xs mt-1">Start the conversation below.</p>
                </div>
              ) : (
                comments.map((c) => {
                  const isMe = c.user_id === currentUser?.id;

                  return (
                    <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm
                          ${isMe ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                          {c.user?.full_name?.charAt(0) || <User className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-2xl px-5 py-3 shadow-sm
                          ${isMe
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                          }`}>
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <span className={`text-xs font-bold ${isMe ? 'text-blue-100' : 'text-gray-900'}`}>
                              {c.user?.full_name}
                            </span>
                            <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                              {c.user?.role}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-line leading-relaxed">{c.comment}</p>
                          {c.attachments && c.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/20">
                              <AttachmentList attachments={c.attachments} />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 mx-12">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex flex-col gap-3">
                <AttachmentPreviewList attachments={attachments} onRemove={removeAttachment} />
                <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Attach files"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(Array.from(e.target.files));
                    }}
                  />

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-0 focus:ring-0 text-sm py-2.5 px-2 resize-none max-h-32"
                    rows={1}
                    style={{ minHeight: '44px' }}
                  />

                  <button
                    onClick={() => addMessageMutation.mutate()}
                    disabled={(!message.trim() && attachmentIds.length === 0) || addMessageMutation.isPending || isUploading}
                    className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-sm"
                  >
                    {addMessageMutation.isPending ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {isUploading && <span className="text-xs text-blue-600 animate-pulse pl-2">Uploading attachments...</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

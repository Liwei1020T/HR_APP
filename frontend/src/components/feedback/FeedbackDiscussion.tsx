import { MutableRefObject } from 'react';
import { MoreVertical, Paperclip, Send } from 'lucide-react';
import { AttachmentList } from '../AttachmentList';
import { AttachmentPreviewList } from '../AttachmentUploader';

type FeedbackDiscussionProps = {
  commentsQuery: any;
  comments: any[];
  user: any;
  canComment: boolean;
  isHr: boolean;
  comment: string;
  setComment: (value: string) => void;
  isInternal: boolean;
  setIsInternal: (value: boolean) => void;
  isGeneratingAI: boolean;
  handleGenerateAIReply: () => void;
  commentFileInputRef: MutableRefObject<HTMLInputElement | null>;
  addCommentFiles: (files: FileList | null) => void;
  addCommentMutation: any;
  commentAttachmentIds: Array<number | string>;
  commentAttachments: any[];
  removeCommentAttachment: (id: string) => void;
};

export function FeedbackDiscussion({
  commentsQuery,
  comments,
  user,
  canComment,
  isHr,
  comment,
  setComment,
  isInternal,
  setIsInternal,
  isGeneratingAI,
  handleGenerateAIReply,
  commentFileInputRef,
  addCommentFiles,
  addCommentMutation,
  commentAttachmentIds,
  commentAttachments,
  removeCommentAttachment,
}: FeedbackDiscussionProps) {
  return (
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
        ) : commentsQuery.isError ? (
          <div className="text-center py-12 text-red-600 space-y-2">
            <p>Failed to load messages.</p>
            <button
              type="button"
              onClick={() => commentsQuery.refetch()}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No messages yet.</p>
            <p className="text-sm">Start the conversation below.</p>
          </div>
        ) : (
          comments.map((entry: any) => {
            const isMe = user?.id === entry.user_id;

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
                disabled={(!comment.trim() && commentAttachmentIds.length === 0) || addCommentMutation.isPending}
                className={`p-2 rounded-full text-white transition-all shadow-sm ${(!comment.trim() && commentAttachmentIds.length === 0) || addCommentMutation.isPending
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:scale-105'
                  }`}
              >
                <Send className={`h-4 w-4 ${addCommentMutation.isPending ? 'animate-pulse' : ''}`} />
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
  );
}

export default FeedbackDiscussion;

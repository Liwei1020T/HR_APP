import { Link } from 'react-router-dom';
import {
    MessageSquare,
    ArrowRight,
    Calendar,
    Tag,
    Send,
    Clock,
} from 'lucide-react';
import { Feedback } from '../lib/types';
import { getPriorityColor, getStatusColor } from '../lib/utils';

interface VendorFeedbackCardProps {
    item: Feedback;
    replyText: string;
    onReplyTextChange: (text: string) => void;
    onSendReply: () => void;
    isSending: boolean;
}

export function VendorFeedbackCard({
    item,
    replyText,
    onReplyTextChange,
    onSendReply,
    isSending,
}: VendorFeedbackCardProps) {
    return (
        <div className="group bg-white rounded-md border border-gray-200 shadow-sm transition-all overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="text-xs font-bold text-gray-400">#{item.id}</span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold border ${getPriorityColor(
                                    item.priority
                                )}`}
                            >
                                {item.priority}
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold border ${getStatusColor(
                                    item.status
                                )}`}
                            >
                                {item.status}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                <Tag className="h-3 w-3" />
                                {item.category}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#1a4f9c] transition-colors">
                            {item.title}
                        </h3>
                        <p className="text-gray-600 font-bold leading-relaxed mb-4">
                            {item.description || item.content}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-bold">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                Created: {new Date(item.created_at).toLocaleDateString()}
                            </span>
                            {item.vendor_due_at && item.status?.toUpperCase() !== 'RESOLVED' && (
                                <span className="flex items-center gap-1.5 text-red-700 font-bold">
                                    <Clock className="h-4 w-4" />
                                    Due: {new Date(item.vendor_due_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <Link
                            to={`/vendor-conversation/${item.id}`}
                            className="flex items-center gap-2 px-5 py-2 bg-[#1a4f9c] text-white rounded-md font-bold hover:bg-blue-800 transition-colors shadow-sm"
                        >
                            <MessageSquare className="h-4 w-4 text-white" />
                            View Details
                            <ArrowRight className="h-4 w-4 text-white" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => onReplyTextChange(e.target.value)}
                            placeholder="Type a quick reply to admin..."
                            className="w-full pl-4 pr-12 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-bold focus:ring-1 focus:ring-[#1a4f9c] focus:border-[#1a4f9c] transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && replyText.trim()) {
                                    onSendReply();
                                }
                            }}
                        />
                        <button
                            onClick={onSendReply}
                            disabled={isSending || !replyText.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#1a4f9c] hover:bg-blue-50 rounded-md disabled:opacity-50 transition-colors"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

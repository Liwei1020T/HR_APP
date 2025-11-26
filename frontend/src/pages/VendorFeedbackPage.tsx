import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { vendorApi } from '../lib/api-client';
import { StatusToast } from '../components/StatusToast';
import { VendorFeedbackCard } from '../components/VendorFeedbackCard';
import { Feedback } from '../lib/types';
import {
  Wrench,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react';

export default function VendorFeedbackPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-feedback'],
    queryFn: () => vendorApi.getMyFeedback(),
  });

  // Ensure we have an array even if data is undefined
  const feedback = (data?.feedback || []) as Feedback[];

  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => vendorApi.reply(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-feedback'] });
      setReplyText({});
      setToast({ text: 'Reply sent.', type: 'success' });
    },
    onError: () => setToast({ text: 'Failed to send reply.', type: 'error' }),
  });

  const filteredFeedback = feedback.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status?.toUpperCase() === statusFilter;
  });

  const handleReplyTextChange = (id: number, text: string) => {
    setReplyText((prev) => ({ ...prev, [id]: text }));
  };

  const handleSendReply = (id: number) => {
    const text = replyText[id];
    if (text && text.trim()) {
      replyMutation.mutate({ id, text });
    }
  };

  return (
    <AppLayout>
      {toast && (
        <StatusToast
          message={toast.text}
          variant={toast.type || 'success'}
          onClose={() => setToast(null)}
        />
      )}
      <div className="space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 shadow-lg">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Wrench className="h-8 w-8" />
                Vendor Dashboard
              </h2>
              <p className="mt-2 text-blue-100 text-lg">
                Manage and resolve assigned feedback items efficiently.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 text-white text-sm font-medium">
                {feedback.length} Assigned Items
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors shadow-sm
                  ${isFilterOpen || statusFilter !== 'ALL'
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <Filter className="h-4 w-4" />
                {statusFilter === 'ALL' ? 'Filter Status' : `Status: ${statusFilter}`}
              </button>

              {isFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-1">
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${statusFilter === status
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {status === 'ALL' ? 'All Statuses' : status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Clear filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white rounded-2xl shadow-sm animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {statusFilter === 'ALL' ? 'All caught up!' : 'No items found'}
            </h3>
            <p className="text-gray-500 mt-1">
              {statusFilter === 'ALL'
                ? 'You have no pending feedback items assigned.'
                : `No feedback items with status "${statusFilter}".`}
            </p>
            {statusFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter('ALL')}
                className="mt-4 text-blue-600 text-sm font-medium hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredFeedback.map((item) => (
              <VendorFeedbackCard
                key={item.id}
                item={item}
                replyText={replyText[item.id] || ''}
                onReplyTextChange={(text) => handleReplyTextChange(item.id, text)}
                onSendReply={() => handleSendReply(item.id)}
                isSending={replyMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

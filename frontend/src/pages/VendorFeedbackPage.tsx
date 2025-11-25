import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { vendorApi } from '../lib/api-client';

export default function VendorFeedbackPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-feedback'],
    queryFn: () => vendorApi.getMyFeedback(),
  });
  const feedback = data?.feedback || [];

  const [replyText, setReplyText] = useState<Record<number, string>>({});

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => vendorApi.reply(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-feedback'] });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Feedback</h2>
          <p className="text-gray-600">Items assigned to you to resolve</p>
        </div>

        {isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : feedback.length === 0 ? (
          <div className="text-gray-500">No assigned feedback.</div>
        ) : (
          <div className="space-y-3">
            {feedback.map((item: any) => (
              <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">#{item.id}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-xs text-gray-500">
                      Category: {item.category} • Priority: {item.priority} • Status: {item.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      Vendor status: {item.vendor_status || 'NONE'}{' '}
                      {item.vendor_due_at ? `• Due: ${item.vendor_due_at}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Created: {item.created_at}</p>
                    <Link
                      to={`/vendor-conversation/${item.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 font-medium mt-1 hover:underline"
                    >
                      View details & conversation →
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText[item.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [item.id]: e.target.value })}
                    placeholder="Reply to admin..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => replyMutation.mutate({ id: item.id, text: replyText[item.id] || '' })}
                    disabled={replyMutation.isPending || !(replyText[item.id] || '').trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {replyMutation.isPending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

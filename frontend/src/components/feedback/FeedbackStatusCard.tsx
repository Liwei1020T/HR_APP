import { Clock } from 'lucide-react';

type FeedbackStatusCardProps = {
  feedback: any;
  isHr: boolean;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  statusOptions: readonly string[];
  formatStatus: (status?: string) => string;
  statusBadgeMap: Record<string, string>;
  updateStatusMutation: any;
  getSlaBadgeStyles: (sla?: string) => string;
  formatSeconds: (seconds?: number | null) => string;
};

export function FeedbackStatusCard({
  feedback,
  isHr,
  selectedStatus,
  setSelectedStatus,
  statusOptions,
  formatStatus,
  statusBadgeMap,
  updateStatusMutation,
  getSlaBadgeStyles,
  formatSeconds,
}: FeedbackStatusCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Status & Assignment</h3>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Current Status</p>
          {isHr ? (
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={updateStatusMutation.isPending}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => updateStatusMutation.mutate(selectedStatus)}
                disabled={updateStatusMutation.isPending || selectedStatus === feedback.status}
                aria-busy={updateStatusMutation.isPending}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updateStatusMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-lg border ${statusBadgeMap[feedback.status]}`}>
              {formatStatus(feedback.status)}
            </span>
          )}
          {updateStatusMutation.isError && (
            <p className="text-xs text-red-600 mt-1">Failed to update status. Please try again.</p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Assigned To</p>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
              {(feedback as any).assigned_to_name?.charAt(0) || '?'}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {(feedback as any).assigned_to_name || 'Unassigned'}
            </span>
          </div>
        </div>

        {(feedback as any).sla_status && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">SLA Status</p>
            <div className={`p-3 rounded-lg border ${(feedback as any).sla_status === 'BREACHED'
                ? 'bg-red-50 border-red-100'
                : 'bg-blue-50 border-blue-100'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`h-4 w-4 ${(feedback as any).sla_status === 'BREACHED' ? 'text-red-600' : 'text-blue-600'}`} />
                <span className={`text-sm font-semibold ${(feedback as any).sla_status === 'BREACHED' ? 'text-red-700' : 'text-blue-700'}`}>
                  {(feedback as any).sla_status === 'BREACHED' ? 'Breached' : 'On Track'}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {(feedback as any).sla_status === 'BREACHED'
                  ? `Overdue by ${formatSeconds((feedback as any).sla_seconds_since_breach)}`
                  : `Time remaining: ${formatSeconds((feedback as any).sla_seconds_to_breach)}`
                }
              </p>
              {(feedback as any).sla_status && (
                <span className={`inline-block mt-2 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getSlaBadgeStyles((feedback as any).sla_status)}`}>
                  {(feedback as any).sla_status === 'BREACHED' ? 'SLA Breached' : 'SLA Normal'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackStatusCard;

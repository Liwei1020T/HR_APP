import { History } from 'lucide-react';

type FeedbackTimelineProps = {
  timelineQuery: any;
};

export function FeedbackTimeline({ timelineQuery }: FeedbackTimelineProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-gray-500" />
        Timeline
      </h3>

      {timelineQuery.isLoading ? (
        <div className="text-center text-gray-400 text-sm">Loading...</div>
      ) : timelineQuery.isError ? (
        <div className="text-center text-red-600 text-sm space-y-2">
          <p>Failed to load timeline.</p>
          <button
            type="button"
            onClick={() => timelineQuery.refetch()}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : !timelineQuery.data || timelineQuery.data.total === 0 ? (
        <div className="text-center text-gray-400 text-sm">No activity recorded.</div>
      ) : (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-2.5 before:w-0.5 before:-translate-x-1/2 before:bg-gray-100 before:h-full">
          {timelineQuery.data.events.map((event: any) => (
            <div key={event.id} className="relative flex gap-4">
              <div className="absolute left-0 ml-2.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-blue-500 shadow-sm ring-1 ring-blue-100"></div>
              <div className="flex-1 pt-0.5 pl-6">
                <p className="text-sm font-medium text-gray-900">
                  {event.action.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-gray-500 mb-1">
                  {new Date(event.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {event.user?.full_name || 'System'}
                  {event.details && <span className="block mt-1 text-gray-500">{event.details}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedbackTimeline;

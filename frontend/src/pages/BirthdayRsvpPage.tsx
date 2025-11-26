import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { birthdayApi } from '../lib/api-client';
import { StatusToast } from '../components/StatusToast';

export default function BirthdayRsvpPage() {
  const { eventId } = useParams();
  const numericEventId = Number(eventId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  const eventQuery = useQuery({
    queryKey: ['birthday-event', numericEventId, 'rsvp'],
    queryFn: () => birthdayApi.getEventById(numericEventId),
    enabled: Number.isFinite(numericEventId),
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: 'going' | 'not_going') =>
      birthdayApi.submitRsvp(numericEventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthday-event', numericEventId, 'rsvp'] });
      setToast({ text: 'RSVP updated.', type: 'success' });
    },
    onError: () => setToast({ text: 'Failed to update RSVP.', type: 'error' }),
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!Number.isFinite(numericEventId)) {
    return (
      <AppLayout>
        <div className="bg-white rounded-lg shadow p-6 text-red-600">Invalid event link.</div>
      </AppLayout>
    );
  }

  const event = eventQuery.data;
  const viewerRegistration = event?.viewer_registration;
  const currentStatus = viewerRegistration?.rsvp_status ?? 'pending';

  return (
    <AppLayout>
      {toast && (
        <StatusToast
          message={toast.text}
          variant={toast.type || 'success'}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:text-blue-800 transition"
        >
          ← Back
        </button>

        {eventQuery.isLoading ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">
            Loading your invite...
          </div>
        ) : !event ? (
          <div className="bg-white rounded-lg shadow p-6 text-red-600">
            Birthday event not found or you do not have access.
          </div>
        ) : !viewerRegistration ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-600">
            You are not listed for this month&apos;s celebration.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                Monthly Birthday Celebration
              </p>
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-gray-600 mt-2">{event.description || 'Join us to celebrate!'}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-blue-700">Date & Time</p>
                <p className="text-xl font-semibold text-blue-900">
                  {new Date(event.event_date).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-purple-50 p-4">
                <p className="text-sm text-purple-700">Location</p>
                <p className="text-xl font-semibold text-purple-900">
                  {event.location || 'To be announced'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500 mb-1">Your RSVP</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {currentStatus.replace('_', ' ')}
              </p>
              {viewerRegistration.rsvp_at && (
                <p className="text-sm text-gray-500">
                  Responded on {new Date(viewerRegistration.rsvp_at).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => rsvpMutation.mutate('going')}
                disabled={rsvpMutation.isPending}
                className={`flex-1 rounded-lg px-4 py-3 text-white font-medium transition ${
                  currentStatus === 'going'
                    ? 'bg-green-600'
                    : 'bg-green-500 hover:bg-green-600'
                } disabled:opacity-60`}
              >
                🎉 I&apos;m Going
              </button>
              <button
                onClick={() => rsvpMutation.mutate('not_going')}
                disabled={rsvpMutation.isPending}
                className={`flex-1 rounded-lg px-4 py-3 font-medium transition ${
                  currentStatus === 'not_going'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                } disabled:opacity-60`}
              >
                🚫 Can&apos;t Make It
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

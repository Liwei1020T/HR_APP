import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { birthdayApi } from '../lib/api-client';
import type { BirthdayRegistration } from '../lib/types';

const statusBadges: Record<string, string> = {
  going: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  not_going: 'bg-red-100 text-red-700',
};

export default function BirthdayEventDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const eventId = Number(params.eventId);

  const eventQuery = useQuery({
    queryKey: ['birthday-event', eventId],
    queryFn: () => birthdayApi.getEventById(eventId),
    enabled: Number.isFinite(eventId),
  });

  const registrationsQuery = useQuery({
    queryKey: ['birthday-registrations', eventId],
    queryFn: () => birthdayApi.getRegistrations(eventId),
    enabled: Number.isFinite(eventId),
  });

  const registrations = useMemo<BirthdayRegistration[]>(
    () => registrationsQuery.data?.registrations ?? [],
    [registrationsQuery.data]
  );

  if (!Number.isFinite(eventId)) {
    return (
      <AppLayout>
        <div className="bg-white rounded-lg shadow p-6 text-red-600">
          Invalid event.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/admin/birthdays')}
          className="text-sm text-blue-600 hover:text-blue-800 transition"
        >
          ← Back to events
        </button>

        {eventQuery.isLoading ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">Loading event...</div>
        ) : !eventQuery.data ? (
          <div className="bg-white rounded-lg shadow p-6 text-red-600">
            Birthday event not found.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    {eventQuery.data.month}/{eventQuery.data.year}
                  </p>
                  <h1 className="text-3xl font-bold text-gray-900">{eventQuery.data.title}</h1>
                  <p className="text-gray-600 mt-2">{eventQuery.data.description || 'No description'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Event date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(eventQuery.data.event_date).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Location: {eventQuery.data.location || 'TBD'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Invited', value: eventQuery.data.summary.total_registrations },
                  { label: 'Going', value: eventQuery.data.summary.going_count },
                  { label: 'Pending', value: eventQuery.data.summary.pending_count },
                  { label: 'Not going', value: eventQuery.data.summary.not_going_count },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Registrations</h2>
                <span className="text-sm text-gray-500">{registrations.length} records</span>
              </div>

              {registrationsQuery.isLoading ? (
                <p className="text-gray-500">Loading registrations...</p>
              ) : registrations.length === 0 ? (
                <p className="text-gray-500">No registrations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Department
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          RSVP Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          RSVP Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {registrations.map((registration) => (
                        <tr key={registration.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {registration.user?.full_name || 'User'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {registration.user?.department || '—'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                statusBadges[registration.rsvp_status]
                              }`}
                            >
                              {registration.rsvp_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {registration.rsvp_at
                              ? new Date(registration.rsvp_at).toLocaleString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

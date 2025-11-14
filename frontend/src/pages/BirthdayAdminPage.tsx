import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { birthdayApi } from '../lib/api-client';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const fromDateTimeLocal = (value: string) => {
  if (!value) return '';
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? value : asDate.toISOString();
};

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

export default function BirthdayAdminPage() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    location: '',
    eventDate: '',
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['birthday-events'],
    queryFn: birthdayApi.getEvents,
  });

  const events = useMemo(() => data?.events ?? [], [data]);

  const selectedEvent = events.find(
    (event: any) => event.year === selectedYear && event.month === selectedMonth
  );

  useEffect(() => {
    if (selectedEvent) {
      setFormState({
        title: selectedEvent.title,
        description: selectedEvent.description ?? '',
        location: selectedEvent.location ?? '',
        eventDate: toDateTimeLocal(selectedEvent.event_date),
      });
    } else {
      setFormState({
        title: '',
        description: '',
        location: '',
        eventDate: '',
      });
    }
  }, [selectedEvent, selectedMonth, selectedYear]);

  const createOrUpdateEvent = useMutation({
    mutationFn: birthdayApi.createOrUpdateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthday-events'] });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.eventDate) {
      return;
    }

    createOrUpdateEvent.mutate({
      year: selectedYear,
      month: selectedMonth,
      event_date: fromDateTimeLocal(formState.eventDate),
      title: formState.title,
      description: formState.description || undefined,
      location: formState.location || undefined,
    });
  };

  const summary = selectedEvent?.summary ?? {
    total_registrations: 0,
    going_count: 0,
    pending_count: 0,
    not_going_count: 0,
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Birthday Events</h1>
            <p className="text-gray-600">
              Plan, notify, and monitor RSVPs for every monthly birthday celebration.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value) || currentMonth)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((name, index) => (
                <option value={index + 1} key={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value) || currentYear)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={2000}
              max={2100}
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Birthday Employees', value: summary.total_registrations, color: 'bg-blue-50 text-blue-700' },
            { label: 'Going', value: summary.going_count, color: 'bg-green-50 text-green-700' },
            { label: 'Pending RSVP', value: summary.pending_count, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Not Going', value: summary.not_going_count, color: 'bg-red-50 text-red-700' },
          ].map((card) => (
            <div key={card.label} className={`${card.color} rounded-2xl border border-gray-100 p-4`}>
              <p className="text-sm font-medium">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Event form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedEvent ? 'Update birthday event' : 'Create birthday event'}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  required
                  placeholder="Example: July Birthday Bash"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formState.eventDate}
                  onChange={(e) => setFormState({ ...formState, eventDate: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  placeholder="Pantry Hall, HQ"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  rows={4}
                  placeholder="Agenda, treats, dress code..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={createOrUpdateEvent.isPending}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {selectedEvent ? 'Save changes' : 'Create event'}
              </button>
            </form>
          </div>

          {/* Events table */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">All birthday events</h2>
              <span className="text-sm text-gray-500">{events.length} total</span>
            </div>
            {isLoading ? (
              <p className="text-gray-500">Loading events...</p>
            ) : sortedEvents.length === 0 ? (
              <p className="text-gray-500">No birthday events yet.</p>
            ) : (
              <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                          {monthNames[event.month - 1]} {event.year}
                        </p>
                        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(event.event_date).toLocaleString()} • {event.location || 'TBD'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/admin/birthdays/${event.id}`)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View details →
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-gray-600">
                      <span>Going: {event.summary.going_count}</span>
                      <span>Pending: {event.summary.pending_count}</span>
                      <span>Not going: {event.summary.not_going_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

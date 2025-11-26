import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { birthdayApi } from '../lib/api-client';
import { StatusToast } from '../components/StatusToast';
import {
  Calendar,
  MapPin,
  Users,
  Check,
  Clock,
  X,
  ChevronRight,
  Cake,
  Plus,
  Edit3,
  AlignLeft
} from 'lucide-react';

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
  const [toast, setToast] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

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
      setToast({ text: 'Birthday event saved.', type: 'success' });
    },
    onError: () => setToast({ text: 'Failed to save birthday event.', type: 'error' }),
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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

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
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Cake className="h-8 w-8" />
                Monthly Birthday Events
              </h1>
              <p className="mt-2 text-blue-100 text-lg max-w-2xl">
                Plan, notify, and monitor RSVPs for every monthly birthday celebration.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value) || currentMonth)}
                  className="appearance-none w-full sm:w-40 pl-4 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 backdrop-blur-sm"
                >
                  {monthNames.map((name, index) => (
                    <option key={name} value={index + 1} className="text-gray-900">
                      {name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value) || currentYear)}
                  className="w-full sm:w-32 pl-4 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 backdrop-blur-sm"
                  min={2000}
                  max={2100}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Birthday Employees', value: summary.total_registrations, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Users },
            { label: 'Going', value: summary.going_count, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', icon: Check },
            { label: 'Pending RSVP', value: summary.pending_count, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock },
            { label: 'Not Going', value: summary.not_going_count, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: X },
          ].map((card) => (
            <div key={card.label} className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border ${card.border} group hover:shadow-md transition-all`}>
              <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <card.icon className={`h-16 w-16 ${card.color}`} />
              </div>
              <div className="relative">
                <div className={`inline-flex p-3 rounded-xl ${card.bg} ${card.color} mb-4`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Event form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${selectedEvent ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                {selectedEvent ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedEvent ? 'Update Event' : 'Create Event'}
              </h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Cake className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    required
                    placeholder="Example: July Birthday Bash"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Event Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="datetime-local"
                    value={formState.eventDate}
                    onChange={(e) => setFormState({ ...formState, eventDate: e.target.value })}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    placeholder="Pantry Hall, HQ"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <AlignLeft className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    value={formState.description}
                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                    rows={4}
                    placeholder="Agenda, treats, dress code..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createOrUpdateEvent.isPending}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:-translate-y-0.5 ${selectedEvent
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {selectedEvent ? (
                  <>
                    <Check className="h-5 w-5" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Create Event
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Events table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">All Events</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                {events.length} Total
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : sortedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <div className="p-3 bg-gray-50 rounded-full mb-3">
                  <Cake className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No birthday events yet.</p>
                <p className="text-sm text-gray-400 mt-1">Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group relative bg-white border border-gray-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                            {monthNames[event.month - 1]} {event.year}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(event.event_date).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location || 'TBD'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/admin/birthdays/${event.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-50">
                      <div className="text-center p-2 rounded-lg bg-green-50/50">
                        <span className="block text-xs text-green-700 font-medium">Going</span>
                        <span className="block text-lg font-bold text-green-700">{event.summary.going_count}</span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-amber-50/50">
                        <span className="block text-xs text-amber-700 font-medium">Pending</span>
                        <span className="block text-lg font-bold text-amber-700">{event.summary.pending_count}</span>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-red-50/50">
                        <span className="block text-xs text-red-700 font-medium">Not Going</span>
                        <span className="block text-lg font-bold text-red-700">{event.summary.not_going_count}</span>
                      </div>
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

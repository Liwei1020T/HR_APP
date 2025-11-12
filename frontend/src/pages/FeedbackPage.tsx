import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackApi } from '../lib/api-client';
import type { FeedbackItem, FeedbackCreate } from '../lib/types';

const STATUS_OPTIONS = ['all', 'SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const formatStatusLabel = (status: string) =>
  status === 'all' ? 'ALL' : status.replace(/_/g, ' ').toUpperCase();

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'RESOLVED':
      return 'bg-green-100 text-green-800';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'UNDER_REVIEW':
      return 'bg-yellow-100 text-yellow-800';
    case 'CLOSED':
      return 'bg-gray-200 text-gray-800';
    case 'SUBMITTED':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function FeedbackPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<typeof STATUS_OPTIONS[number]>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<FeedbackCreate>({
    title: '',
    description: '',
    category: 'general',
    is_anonymous: false,
  });

  // Fetch feedback
  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['feedback', selectedStatus],
    queryFn: () =>
      feedbackApi.getAll(selectedStatus !== 'all' ? { status: selectedStatus } : undefined),
  });

  // Create feedback mutation
  const createMutation = useMutation({
    mutationFn: (data: FeedbackCreate) => feedbackApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setShowCreateForm(false);
      setFormData({ title: '', description: '', category: 'general', is_anonymous: false });
    },
  });

  // Update status mutation (HR/Admin only)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      feedbackApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setSelectedFeedback(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      category: formData.category.toUpperCase(),
    });
  };

  const filteredFeedback = feedbackData?.feedback || [];
  const canManage = hasRole(['hr', 'admin', 'superadmin']);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Feedback</h2>
            <p className="text-gray-600">Share your thoughts and suggestions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📝 Submit Feedback
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Submit New Feedback</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="workplace">Workplace</option>
                    <option value="management">Management</option>
                    <option value="benefits">Benefits</option>
                    <option value="culture">Culture</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                    Submit anonymously
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ title: '', description: '', category: 'general', is_anonymous: false });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex space-x-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading feedback...</div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No feedback found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeedback.map((feedback) => (
                <div key={feedback.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{feedback.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(
                            feedback.status
                          )}`}
                        >
                          {formatStatusLabel(feedback.status)}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {feedback.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{feedback.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          by {feedback.is_anonymous ? 'Anonymous' : feedback.submitted_by_name}
                        </span>
                        <span>•</span>
                        <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                        {feedback.assigned_to_name && (
                          <>
                            <span>•</span>
                            <span>Assigned to: {feedback.assigned_to_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => setSelectedFeedback(feedback)}
                        className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        {selectedFeedback && canManage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Update Status</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedFeedback.title}</p>
              <div className="space-y-2">
                {STATUS_OPTIONS.filter((status) => status !== 'all').map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      updateStatusMutation.mutate({ id: selectedFeedback.id, status })
                    }
                    disabled={updateStatusMutation.isPending}
                    className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {formatStatusLabel(status)}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/AppLayout';
import { usersApi } from '../lib/api-client';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersApi.getProfile(),
  });

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    department: '',
    date_of_birth: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileForm) => usersApi.updateProfile(data),
    onSuccess: () => {
      setProfileMessage('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      setProfileMessage(error.response?.data?.detail || 'Update failed');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: typeof passwordForm) => usersApi.changePassword(data),
    onSuccess: () => {
      setPasswordMessage('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    },
    onError: (error: any) => {
      setPasswordMessage(error.response?.data?.detail || 'Password change failed');
    },
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    updateProfileMutation.mutate({
      ...profileForm,
      date_of_birth: profileForm.date_of_birth || '',
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    changePasswordMutation.mutate(passwordForm);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        department: user.department || '',
        date_of_birth: user.date_of_birth ? user.date_of_birth.slice(0, 10) : '',
      });
    }
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

        {isLoading || !user ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">Loading profile...</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium">Full Name</p>
                  <p>{user.full_name}</p>
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="font-medium">Employee ID</p>
                  <p>{user.employee_id || '—'}</p>
                </div>
                <div>
                  <p className="font-medium">Role</p>
                  <p>{user.role}</p>
                </div>
                <div>
                  <p className="font-medium">Department</p>
                  <p>{user.department || '—'}</p>
                </div>
                <div>
                  <p className="font-medium">Date of Birth</p>
                  <p>{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Profile</h2>
              {profileMessage && (
                <div className="mb-4 text-sm px-4 py-2 rounded border">
                  {profileMessage}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={profileForm.full_name}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={profileForm.department}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={profileForm.date_of_birth}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
              {passwordMessage && (
                <div className="mb-4 text-sm px-4 py-2 rounded border">
                  {passwordMessage}
                </div>
              )}
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordForm.new_password}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordForm.confirm_password}
                      onChange={handlePasswordChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? 'Updating...' : 'Change password'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

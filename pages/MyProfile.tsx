import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { showAlert } from '../utils/alerts';

const getAuthHeader = () => {
  const userStr = localStorage.getItem('teachaide_session');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

const MyProfile: React.FC = () => {
  const current = db.auth.getCurrentUser();
  const [name, setName] = useState(current?.name || '');
  const [email, setEmail] = useState(current?.email || '');
  const [role, setRole] = useState(current?.role || 'user');
  const [avatar, setAvatar] = useState<string>(current?.avatar || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  useEffect(() => {
    // Load school details if user belongs to a school
    (async () => {
      try {
        const info = await db.school.getDetails();
        setSchoolInfo(info?.school || null);
      } catch (e) {
        // ignore if user not in a school
      }
    })();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          ...getAuthHeader()
        },
        body: form,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Upload failed');
      const url = payload.data?.url || payload.data?.url || payload.data?.secure_url;
      if (url) setAvatar(url);
    } catch (err: any) {
      setUploadError(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = { name, email, role };
      if (avatar) updateData.avatar = avatar;
      if (password) updateData.password = password;
      await db.auth.updateProfile(updateData);
      // refresh local user from server
      await db.auth.refreshUser();
      showAlert.success('Profile Updated', 'Your changes have been saved.');
    } catch (err: any) {
      showAlert.error('Update Failed', err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (await showAlert.confirm('Delete Account', 'This will permanently delete your account and all related data. This action cannot be undone. Continue?')) {
      try {
        await db.auth.deleteAccount();
        showAlert.success('Account Deleted', 'Your account has been successfully removed. Goodbye!');
        // Redirect to home or login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } catch (err: any) {
        showAlert.error('Deletion Failed', err?.message || 'Failed to delete account');
      }
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-100 dark:border-slate-700">
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">My Profile</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col items-center">
          <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-slate-400">{(name || 'U').charAt(0)}</span>
            )}
          </div>
          <label className="mt-3 text-sm text-slate-600 dark:text-slate-300">Change avatar</label>
          <input type="file" accept="image/*" onChange={handleFile} className="mt-2" />
          {uploading && <div className="text-sm text-slate-500 dark:text-slate-300 mt-2">Uploading...</div>}
          {uploadError && <div className="text-sm text-red-500 mt-2">{uploadError}</div>}
        </div>

        <div className="col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                <option value="user">User</option>
                <option value="teacher">Teacher</option>
                <option value="school_admin">School Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 dark:text-slate-300">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" placeholder="Leave blank to keep current" />
            </div>
          </div>

          <div className="mt-4">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button onClick={handleDeleteAccount} className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete Account</button>
          </div>

          {schoolInfo && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
              <h4 className="font-medium">School Details</h4>
              <p className="text-sm text-slate-600">Name: {schoolInfo.name}</p>
              <p className="text-sm text-slate-600">Owner: {schoolInfo.owner?.name}</p>
              <p className="text-sm text-slate-600">Teachers: {schoolInfo.teachers?.length || 0}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

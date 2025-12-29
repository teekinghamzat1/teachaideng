import React, { useState, useEffect } from 'react';
import { db, getAuthHeader, getAdminAuthHeader } from '../database';
import { showAlert } from '../utils/alerts';

interface MyProfileProps {
  isAdminView?: boolean;
}

const MyProfile: React.FC<MyProfileProps> = ({ isAdminView = false }) => {
  const current = isAdminView ? db.adminAuth.getCurrentUser() : db.auth.getCurrentUser();
  const [name, setName] = useState(current?.name || '');
  const [email, setEmail] = useState(current?.email || '');
  const [role, setRole] = useState(current?.role || 'Teacher');
  const [avatar, setAvatar] = useState<string>(current?.avatar || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  useEffect(() => {
    // Load school details if user belongs to a school
    if (!isAdminView) {
      (async () => {
        try {
          const info = await db.school.getDetails();
          setSchoolInfo(info?.school || null);
        } catch (e) {
          // ignore if user not in a school
        }
      })();
    }
  }, [isAdminView]);

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
          ...(isAdminView ? getAdminAuthHeader() : getAuthHeader())
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

      if (isAdminView) {
        await db.adminAuth.updateProfile(updateData);
        await db.adminAuth.refreshUser();
      } else {
        await db.auth.updateProfile(updateData);
        await db.auth.refreshUser();
      }
      showAlert.success('Profile Updated', 'Your changes have been saved.');
    } catch (err: any) {
      showAlert.error('Update Failed', err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isAdminView) {
      showAlert.error('Action Restricted', 'Administrators cannot delete their own accounts from this panel.');
      return;
    }
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

  const isSystemAdmin = current?.role.toLowerCase() === 'admin' || current?.role.toLowerCase() === 'superadmin';

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-100 dark:border-slate-700">
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
        {isAdminView ? 'Admin Account Settings' : 'My Profile'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex items-center justify-center border-4 border-slate-50 dark:border-slate-800 shadow-inner">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-brand-600">{(name || 'U').charAt(0)}</span>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
              </div>
            )}
          </div>

          <div className="mt-4 w-full">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-2">Change Profile Photo</label>
            <input type="file" accept="image/*" onChange={handleFile} className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
            {uploadError && <div className="text-xs text-red-500 mt-1 text-center">{uploadError}</div>}
          </div>
        </div>

        <div className="col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Your Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Professional Title</label>
              {isSystemAdmin ? (
                <div className="mt-1 block w-full rounded-md border border-slate-100 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-not-allowed">
                  {current?.role || 'Admin'} (System Role)
                </div>
              ) : (
                <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="Teacher">Teacher</option>
                  <option value="Principal">Principal</option>
                  <option value="Proprietor/Proprietress">Proprietor/Proprietress</option>
                  <option value="Headmaster/Headmistress">Headmaster/Headmistress</option>
                  <option value="Educator">Educator</option>
                  <option value="Student">Student</option>
                  <option value="School Admin">School Admin</option>
                </select>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Leave blank to keep current password" />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
            {!isAdminView && (
              <button onClick={handleDeleteAccount} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            )}
          </div>

          {!isAdminView && schoolInfo && (
            <div className="mt-10 p-4 bg-brand-50/50 dark:bg-slate-900 rounded-xl border border-brand-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider">Linked School</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">School Name</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{schoolInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Teacher Capacity</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{schoolInfo.teachers?.length || 0} Teachers</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

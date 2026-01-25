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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Profile Header section */}
      <div className="flex flex-col md:flex-row items-center gap-8 pb-10 border-b border-slate-100 dark:border-slate-800">
        <div className="relative group">
          <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white dark:bg-slate-900 rounded-[3.5rem] overflow-hidden flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-2xl relative z-10">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
            ) : (
              <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-5xl font-black text-[#16A34A]">{(name || 'U').charAt(0)}</span>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#16A34A] border-t-transparent animate-spin rounded-full"></div>
              </div>
            )}
          </div>

          {/* Decorative Ring */}
          <div className="absolute inset-[-8px] border-2 border-dashed border-[#16A34A]/20 rounded-[4rem] animate-spin-slow"></div>

          <label className="absolute bottom-2 right-2 w-10 h-10 bg-[#16A34A] text-white rounded-2xl flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-all z-20">
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </label>
        </div>

        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{name || 'Your Profile'}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="bg-[#16A34A]/10 text-[#16A34A] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#16A34A]/20">
              {role}
            </span>
            <span className="text-slate-400 font-bold text-sm">{email}</span>
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all shadow-sm"
            placeholder="Your Name"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all shadow-sm"
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Professional Focus</label>
          {isSystemAdmin ? (
            <div className="w-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl px-6 py-4 text-slate-400 font-bold border-2 border-transparent">
              {current?.role || 'Admin'} (System Locked)
            </div>
          ) : (
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold appearance-none outline-none transition-all shadow-sm"
              >
                <option value="Teacher">Teacher</option>
                <option value="Principal">Principal</option>
                <option value="Proprietor/Proprietress">Proprietor/Proprietress</option>
                <option value="Headmaster/Headmistress">Headmaster/Headmistress</option>
                <option value="Educator">Educator</option>
                <option value="Student">Student</option>
                <option value="School Admin">School Admin</option>
              </select>
              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Update Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 outline-none transition-all shadow-sm"
            placeholder="Leave blank to keep current"
          />
        </div>
      </div>

      {/* Linked School Card */}
      {!isAdminView && schoolInfo && (
        <div className="bg-gradient-to-br from-[#16A34A]/5 to-blue-500/5 dark:from-[#16A34A]/10 dark:to-blue-500/10 p-8 rounded-[2rem] border-2 border-[#16A34A]/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/5 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-[#16A34A] shadow-lg border border-slate-100 dark:border-slate-800 transition-transform group-hover:rotate-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Affiliation</p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{schoolInfo.name}</h4>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{schoolInfo.teachers?.length || 0} Registered Educators</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-10 py-5 bg-[#16A34A] text-white font-black rounded-2xl shadow-xl shadow-[#16A34A]/20 hover:shadow-[#16A34A]/40 transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
        >
          {saving ? 'Syncing...' : 'Save Profile Changes'}
        </button>
        {!isAdminView && (
          <button
            onClick={handleDeleteAccount}
            className="w-full sm:w-auto px-8 py-5 text-red-500 font-black rounded-2xl border-2 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-xs uppercase tracking-widest"
          >
            Permanently Terminate Account
          </button>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
